// TabHistoryManager - tracks per-window tab navigation history.
//
// Background-side implementation of shared/tabHistoryManagerApi.ts. The
// sidebar reaches navigate/navigateToIndex/getHistoryDetails through
// proxies/tabHistoryManagerProxy.ts; everything else here (push, remove, the
// #navigatingWindows bookkeeping, load) is background-internal, and so is the
// chrome.commands.onCommand path, which calls navigate() on the instance
// directly.

import { ManagerId, RoutedManager } from '../proxies/messageRouting';
import { RecentTabItem, TabHistoryDetails, TabHistoryItem, TabHistoryManagerApi } from '../shared/tabHistoryManagerApi';
import { RecentTabOrder } from '../../utils/recentTabOrder';
import { WindowTaskQueue } from '../../utils/windowTaskQueue';

/**
 * The two background.ts functions this manager needs, handed in at
 * construction instead of imported.
 *
 * Both are orchestration that reaches into the other managers'
 * singletons - setActiveTabAndSpace touches SpaceWindowStateManager,
 * getSpaceForTab touches TabSpaceRegistry and SpaceManager - and both live in
 * background.ts, which already imports this file. Importing them back from
 * here would be the circular case, so the dependency is inverted: background
 * constructs the manager with them.
 */
export interface TabHistoryDeps
{
  setActiveTabAndSpace(tabId: number): Promise<{ success: boolean; error?: string }>;
  getSpaceForTab(windowId: number, tabId: number): Promise<string | undefined>;
}

interface HistoryEntry
{
  tabId: number;
}

interface TabHistory
{
  stack: HistoryEntry[];
  index: number;
}

export class TabHistoryManager implements RoutedManager, TabHistoryManagerApi
{
  static STORAGE_KEY = 'bg_windowTabHistory';
  static RECENT_TABS_STORAGE_KEY = 'bg_windowRecentTabs';
  static MAX_SIZE = 25;

  readonly managerId = ManagerId.TAB_HISTORY;

  #history = new Map<number, TabHistory>();  // windowId -> history
  #recentTabs = new Map<number, RecentTabOrder>();
  #recentSwitchQueue = new WindowTaskQueue();

  // Navigation state tracking (per-window)
  // - Prevents history tracking when we programmatically activate a tab via navigate()
  // - Uses incrementing IDs to handle rapid navigation: if user triggers nav A then B quickly,
  //   only B's callback executes (A's callback sees stale navId and returns early)
  // - Per-window so navigation in window A doesn't affect history tracking in window B
  #navigatingWindows = new Map<number, number>();  // windowId -> navId

  #deps: TabHistoryDeps;

  constructor(deps: TabHistoryDeps)
  {
    this.#deps = deps;
  }

  /**
   * See RoutedManager.dispatch.
   *
   * navigate and navigateToIndex are awaited before the ack goes out, so the
   * proxy's promise resolves once the target tab is actually active rather
   * than once the message was accepted.
   */
  async dispatch(method: string, message: Record<string, unknown>): Promise<unknown>
  {
    switch (method)
    {
      case 'navigate':
        await this.navigate(message.windowId as number, message.direction as number);
        return undefined;

      case 'navigateToIndex':
        await this.navigateToIndex(message.windowId as number, message.index as number);
        return undefined;

      case 'getHistoryDetails':
        return this.getHistoryDetails(message.windowId as number);

      case 'getRecentTabs':
        return this.getRecentTabs(message.windowId as number);

      case 'switchToMostRecent':
        return this.switchToMostRecent(message.windowId as number);

      case 'activateRecentTab':
        return this.activateRecentTab(message.windowId as number, message.tabId as number);

      default:
        throw new Error(`${this.managerId}: unknown method "${method}"`);
    }
  }

  isNavigating(windowId: number): boolean
  {
    return this.#navigatingWindows.has(windowId);
  }

  // Mark window as navigating. Returns navId to pass to unsetNavigating().
  setNavigating(windowId: number): number
  {
    const navId = (this.#navigatingWindows.get(windowId) ?? 0) + 1;
    this.#navigatingWindows.set(windowId, navId);
    // if (import.meta.env.DEV)
    // {
    //   console.log(`[TabHistory] setNavigating: windowId=${windowId}, navId=${navId}`);
    // }
    return navId;
  }

  // Clear navigation state if navId still matches. Returns false if a newer navigation superseded this one.
  unsetNavigating(windowId: number, navId: number): boolean
  {
    const currentNavId = this.#navigatingWindows.get(windowId);
    const matches = currentNavId === navId;
    // if (import.meta.env.DEV)
    // {
    //   console.log(`[TabHistory] unsetNavigating: windowId=${windowId}, navId=${navId}, currentNavId=${currentNavId}, cleared=${matches}`);
    // }
    if (!matches) return false;
    this.#navigatingWindows.delete(windowId);
    return true;
  }

  getHistory(windowId: number): TabHistory | undefined
  {
    return this.#history.get(windowId);
  }

  private getOrCreateHistory(windowId: number): TabHistory
  {
    if (!this.#history.has(windowId))
    {
      this.#history.set(windowId, { stack: [], index: -1 });
    }
    return this.#history.get(windowId)!;
  }

  private save(): void
  {
    chrome.storage.session.set({
      [TabHistoryManager.STORAGE_KEY]: Array.from(this.#history.entries())
    });
  }

  private saveRecentTabs(): void
  {
    chrome.storage.session.set({
      [TabHistoryManager.RECENT_TABS_STORAGE_KEY]: Array.from(
        this.#recentTabs.entries(),
        ([windowId, order]) => [windowId, order.toArray()]
      )
    });
  }

  private getOrCreateRecentTabs(windowId: number): RecentTabOrder
  {
    let order = this.#recentTabs.get(windowId);
    if (!order)
    {
      order = new RecentTabOrder([], TabHistoryManager.MAX_SIZE);
      this.#recentTabs.set(windowId, order);
    }
    return order;
  }

  recordRecent(windowId: number, tabId: number): void
  {
    this.getOrCreateRecentTabs(windowId).record(tabId);
    this.saveRecentTabs();
  }

  push(windowId: number, tabId: number): void
  {
    const history = this.getOrCreateHistory(windowId);

    // skip if same as current entry (same tab)
    if (history.index >= 0)
    {
      const current = history.stack[history.index];
      if (current.tabId === tabId)
      {
        return;
      }
    }

    // remove any existing occurrence of this tabId to prevent duplicates
    const existingIdx = history.stack.findIndex(e => e.tabId === tabId);
    if (existingIdx !== -1)
    {
      history.stack.splice(existingIdx, 1);
      if (existingIdx <= history.index)
      {
        history.index--;
      }
    }

    // insert new entry after current position
    history.stack.splice(history.index + 1, 0, { tabId });
    history.index++;

    // trim to keep ±MAX_SIZE around current index
    const beforeCount = history.index;
    if (beforeCount > TabHistoryManager.MAX_SIZE)
    {
      const trimCount = beforeCount - TabHistoryManager.MAX_SIZE;
      history.stack.splice(0, trimCount);
      history.index -= trimCount;
    }

    const afterCount = history.stack.length - history.index - 1;
    if (afterCount > TabHistoryManager.MAX_SIZE)
    {
      const trimCount = afterCount - TabHistoryManager.MAX_SIZE;
      history.stack.splice(history.stack.length - trimCount, trimCount);
    }

    this.save();
    // if (import.meta.env.DEV) this.dump(windowId, `PUSH tabId=${tabId}`);
  }

  remove(windowId: number, tabId: number): void
  {
    const history = this.#history.get(windowId);
    const recentTabs = this.#recentTabs.get(windowId);
    if (recentTabs)
    {
      recentTabs.remove(tabId);
      this.saveRecentTabs();
    }

    if (!history) return;

    const idx = history.stack.findIndex(e => e.tabId === tabId);
    if (idx === -1) return;

    history.stack.splice(idx, 1);

    if (history.index >= idx)
    {
      history.index = Math.max(0, history.index - 1);
    }

    if (history.stack.length === 0)
    {
      history.index = -1;
    }

    this.save();
    // if (import.meta.env.DEV) this.dump(windowId, `REMOVE tabId=${tabId}`);
  }

  async navigate(windowId: number, direction: number): Promise<void>
  {
    const history = this.#history.get(windowId);
    if (!history || history.stack.length === 0) return;

    const newIndex = history.index + direction;
    if (newIndex < 0 || newIndex >= history.stack.length) return;

    history.index = newIndex;
    const entry = history.stack[newIndex];
    this.save();

    if (import.meta.env.DEV)
    {
      const dirLabel = direction === -1 ? "BACK" : "FORWARD";
      this.dump(windowId, `NAVIGATE ${dirLabel} to tabId=${entry.tabId}`);
    }

    const navId = this.setNavigating(windowId);

    // Use unified function to activate tab and switch space
    // Skip history since we're navigating within existing history
    const result = await this.#deps.setActiveTabAndSpace(entry.tabId);

    if (!this.unsetNavigating(windowId, navId)) return;

    if (import.meta.env.DEV && result.success)
    {
      console.log(`[TabHistory] Navigate completed: result=${result}`);
    }
  }

  async navigateToIndex(windowId: number, index: number): Promise<void>
  {
    const history = this.#history.get(windowId);
    if (!history || index < 0 || index >= history.stack.length) return;

    history.index = index;
    const entry = history.stack[index];
    this.save();

    if (import.meta.env.DEV)
    {
      this.dump(windowId, `NAVIGATE to index=${index}, tabId=${entry.tabId}`);
    }

    const navId = this.setNavigating(windowId);

    // Use unified function to activate tab and switch space
    // Skip history since we're navigating within existing history
    const result = await this.#deps.setActiveTabAndSpace(entry.tabId);

    if (!this.unsetNavigating(windowId, navId)) return;

    if (import.meta.env.DEV && result.success)
    {
      console.log(`[TabHistory] NavigateToIndex completed: result=${result}`);
    }
  }

  getActivationOrder(windowId: number): number[]
  {
    const history = this.#history.get(windowId);
    if (!history || history.stack.length === 0) return [];

    // Return tab IDs from current index backwards (most recent first)
    const result: number[] = [];
    for (let i = history.index; i >= 0; i--)
    {
      result.push(history.stack[i].tabId);
    }
    return result;
  }

  async getHistoryDetails(windowId: number): Promise<TabHistoryDetails>
  {
    const history = this.#history.get(windowId);
    if (!history || history.stack.length === 0)
    {
      return { before: [], after: [], currentIndex: -1 };
    }

    const before: TabHistoryItem[] = [];
    const after: TabHistoryItem[] = [];

    for (let i = 0; i < history.stack.length; i++)
    {
      const entry = history.stack[i];
      try
      {
        const tab = await chrome.tabs.get(entry.tabId);
        // Lookup space dynamically at query time (fallback to 'all' for pinned tabs)
        const spaceId = await this.#deps.getSpaceForTab(windowId, entry.tabId) ?? 'all';
        const item = {
          tabId: entry.tabId,
          spaceId,
          index: i,
          title: tab.title || '(no title)',
          url: tab.url || tab.pendingUrl || '',
          favIconUrl: tab.favIconUrl || ''
        };

        if (i < history.index)
        {
          before.push(item);
        }
        else if (i > history.index)
        {
          after.push(item);
        }
      }
      catch { /* Tab no longer exists */ }
    }

    before.reverse();
    return { before, after, currentIndex: history.index };
  }

  async getRecentTabs(windowId: number): Promise<RecentTabItem[]>
  {
    const liveTabs = await chrome.tabs.query({ windowId });
    const liveTabsById = new Map(
      liveTabs.flatMap(tab => tab.id === undefined ? [] : [[tab.id, tab] as const])
    );
    const validTabIds = new Set(liveTabsById.keys());
    const order = this.getOrCreateRecentTabs(windowId);
    let changed = order.retain(validTabIds);

    const activeTabId = liveTabs.find(tab => tab.active)?.id;
    if (activeTabId !== undefined && order.toArray()[0] !== activeTabId)
    {
      order.record(activeTabId);
      changed = true;
    }

    // 没有激活历史的实时 Tab 仍应出现在切换窗口末尾，并保持标签栏顺序。
    const tabIdsByStripOrder = [...liveTabs]
      .sort((left, right) => left.index - right.index)
      .flatMap(tab => tab.id === undefined ? [] : [tab.id]);
    if (order.appendMissing(tabIdsByStripOrder))
    {
      changed = true;
    }

    if (changed)
    {
      this.saveRecentTabs();
    }

    const items = await Promise.all(order.toArray().map(async tabId =>
    {
      const tab = liveTabsById.get(tabId)!;
      const spaceId = await this.#deps.getSpaceForTab(windowId, tabId) ?? 'all';
      return {
        tabId,
        spaceId,
        title: tab.title || '(no title)',
        url: tab.url || tab.pendingUrl || '',
        favIconUrl: tab.favIconUrl || '',
        active: tab.active,
      };
    }));

    return items;
  }

  async switchToMostRecent(windowId: number): Promise<boolean>
  {
    return this.#recentSwitchQueue.run(windowId, async () =>
    {
      // 前一次切换完成后才读取 active 状态，保证快速连续触发形成 A/B 往返。
      const recentTabs = await this.getRecentTabs(windowId);
      const target = recentTabs.find(tab => !tab.active);
      if (!target) return false;
      return this.activateRecentTab(windowId, target.tabId);
    });
  }

  async activateRecentTab(windowId: number, tabId: number): Promise<boolean>
  {
    try
    {
      const tab = await chrome.tabs.get(tabId);
      if (tab.windowId !== windowId) return false;

      const result = await this.#deps.setActiveTabAndSpace(tabId);
      if (!result.success) return false;

      // onActivated 也会更新此顺序；move-to-front 是幂等的，可覆盖事件到达时序差异。
      this.recordRecent(windowId, tabId);
      return true;
    }
    catch
    {
      this.remove(windowId, tabId);
      return false;
    }
  }

  removeWindow(windowId: number): void
  {
    this.#history.delete(windowId);
    this.#recentTabs.delete(windowId);
    this.#navigatingWindows.delete(windowId);
    this.saveRecentTabs();
  }

  async load(): Promise<void>
  {
    const result = await chrome.storage.session.get([
      TabHistoryManager.STORAGE_KEY,
      TabHistoryManager.RECENT_TABS_STORAGE_KEY,
    ]);
    if (result[TabHistoryManager.STORAGE_KEY])
    {
      for (const [key, value] of result[TabHistoryManager.STORAGE_KEY])
      {
        this.#history.set(key, value);
      }
    }

    const recentTabs = result[TabHistoryManager.RECENT_TABS_STORAGE_KEY];
    if (recentTabs)
    {
      // 每个窗口恢复成独立对象，避免后续移动顺序时共享可变数组。
      for (const [windowId, tabIds] of recentTabs as Array<[number, number[]]>)
      {
        this.#recentTabs.set(windowId, new RecentTabOrder(tabIds, TabHistoryManager.MAX_SIZE));
      }
    }
  }

  // Debug: dump complete history with tab details
  private async dump(_windowId: number, _action: string): Promise<void>
  {
    return;
  //   const history = this.#history.get(windowId);
  //   if (!history)
  //   {
  //     console.log(`[TabHistory] ${action} - windowId=${windowId}: NO HISTORY`);
  //     return;
  //   }

  //   const uniqueSpaceIds = [...new Set(history.stack.map(e => e.spaceId))];
  //   const spaceNameMap: Record<string, string> = { all: 'All' };
  //   const result = await chrome.storage.local.get([SPACES_STORAGE_KEY]);
  //   const spaces = result.spaces || [];
  //   for (const spaceId of uniqueSpaceIds)
  //   {
  //     if (spaceId !== 'all')
  //     {
  //       const space = spaces.find((s: { id: string; name: string }) => s.id === spaceId);
  //       spaceNameMap[spaceId] = space ? space.name : spaceId;
  //     }
  //   }

  //   console.log(`\n[TabHistory] --- begin ---`);
  //   console.log(`[TabHistory] ${action} - windowId=${windowId}, index=${history.index}, size=${history.stack.length}`);
  //   console.log(`[TabHistory] spaces: ${uniqueSpaceIds.map(id => `${spaceNameMap[id]}`).join(', ')}`);

  //   for (let i = 0; i < history.stack.length; i++)
  //   {
  //     const entry = history.stack[i];
  //     const marker = i === history.index ? ">>>" : "   ";
  //     const spaceName = spaceNameMap[entry.spaceId] || "(not found)";
  //     try
  //     {
  //       const tab = await chrome.tabs.get(entry.tabId);
  //       const title = tab.title || "(no title)";
  //       const url = tab.url || tab.pendingUrl || "(no url)";
  //       console.log(`${marker} [${i}] space="${spaceName}", spaceId="${entry.spaceId}", title="${title}", url="${url}"`);
  //     }
  //     catch
  //     {
  //       console.log(`${marker} [${i}] space="${spaceName}", spaceId="${entry.spaceId}", (tab not found - closed?)`);
  //     }
  //   }
  //   console.log(`[TabHistory] --- end ---`);
  }
}
