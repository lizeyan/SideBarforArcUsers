// TabSpaceRegistry - authoritative Space assignment for every real Chrome Tab.
//
// Background-side implementation of shared/tabSpaceRegistryApi.ts. Only
// The sidebar reads and mutates assignments through proxies/tabSpaceRegistryProxy.ts.

import { ManagerId, RoutedManager } from '../proxies/messageRouting';
import { TAB_SPACE_ASSIGNMENTS_CHANGED, TabSpaceRegistryApi } from '../shared/tabSpaceRegistryApi';

export class TabSpaceRegistry implements RoutedManager, TabSpaceRegistryApi
{
  static STORAGE_KEY = 'tabSpaceAssignments';
  static LEGACY_SESSION_KEY = 'bg_tabSpaces';

  readonly managerId = ManagerId.TAB_SPACE_REGISTRY;

  // Map<windowId, Map<tabId, spaceId>>
  #registry: Map<number, Map<number, string>> = new Map();
  #tabMetadata = new Map<string, { url: string; index: number }>();

  /** See RoutedManager.dispatch. */
  async dispatch(method: string, message: Record<string, unknown>): Promise<unknown>
  {
    switch (method)
    {
      case 'register':
        return this.register(message.windowId as number, message.tabId as number, message.spaceId as string);

      case 'unregister':
        return this.unregister(message.windowId as number, message.tabId as number);

      case 'getWindowAssignments':
        return this.getWindowAssignments(message.windowId as number);

      default:
        throw new Error(`${this.managerId}: unknown method "${method}"`);
    }
  }

  async register(windowId: number, tabId: number, spaceId: string): Promise<void>
  {
    if (!this.#registry.has(windowId))
    {
      this.#registry.set(windowId, new Map());
    }
    this.#registry.get(windowId)!.set(tabId, spaceId);
    try
    {
      const tab = await chrome.tabs.get(tabId);
      this.#tabMetadata.set(`${windowId}:${tabId}`, { url: tab.url ?? '', index: tab.index });
    }
    catch { /* Tab may close between creation and registration. */ }
    await this.save();
    this.broadcast(windowId);
  }

  getSpace(windowId: number, tabId: number): string | undefined
  {
    return this.#registry.get(windowId)?.get(tabId);
  }

  async unregister(windowId: number, tabId: number): Promise<void>
  {
    this.#registry.get(windowId)?.delete(tabId);
    this.#tabMetadata.delete(`${windowId}:${tabId}`);
    await this.save();
    this.broadcast(windowId);
  }

  getWindowAssignments(windowId: number): Record<number, string>
  {
    return Object.fromEntries(this.#registry.get(windowId) ?? []);
  }

  private async save(): Promise<void>
  {
    const data: Array<{ windowId: number; tabId: number; spaceId: string; url: string; index: number }> = [];
    for (const [windowId, tabMap] of this.#registry)
    {
      for (const [tabId, spaceId] of tabMap)
      {
        const metadata = this.#tabMetadata.get(`${windowId}:${tabId}`) ?? { url: '', index: -1 };
        data.push({ windowId, tabId, spaceId, ...metadata });
      }
    }
    await chrome.storage.local.set({ [TabSpaceRegistry.STORAGE_KEY]: data });
  }

  removeWindow(windowId: number): void
  {
    this.#registry.delete(windowId);
    for (const key of this.#tabMetadata.keys())
    {
      if (key.startsWith(`${windowId}:`)) this.#tabMetadata.delete(key);
    }
    void this.save();
  }

  /** Tab 排序或批量移动后刷新持久化恢复所需的 URL/index 元数据。 */
  async refreshWindowMetadata(windowId: number): Promise<void>
  {
    const assignments = this.#registry.get(windowId);
    if (!assignments || assignments.size === 0) return;

    const tabs = await chrome.tabs.query({ windowId });
    for (const tab of tabs)
    {
      if (tab.id === undefined || !assignments.has(tab.id)) continue;
      this.#tabMetadata.set(`${windowId}:${tab.id}`, { url: tab.url ?? '', index: tab.index });
    }
    await this.save();
  }

  async load(): Promise<void>
  {
    const [localResult, legacyResult] = await Promise.all([
      chrome.storage.local.get([TabSpaceRegistry.STORAGE_KEY]),
      chrome.storage.session.get([TabSpaceRegistry.LEGACY_SESSION_KEY]),
    ]);
    const data = Array.isArray(localResult[TabSpaceRegistry.STORAGE_KEY])
      ? localResult[TabSpaceRegistry.STORAGE_KEY] as Array<{
        windowId: number; tabId: number; spaceId: string; url: string; index: number;
      }>
      : [];
    const tabs = await chrome.tabs.query({});
    const liveTabs = new Map<number, chrome.tabs.Tab>(
      tabs.flatMap(tab => tab.id === undefined ? [] : [[tab.id, tab] as const])
    );
    const claimedTabIds = new Set<number>();

    // 优先使用仍然指向同一真实 Tab 的记录；浏览器恢复导致 ID 改变时，再按 URL 和位置找回。
    for (const item of data)
    {
      let tab = liveTabs.get(item.tabId);
      if (!tab || tab.windowId !== item.windowId)
      {
        const candidates = tabs.filter(candidate =>
          candidate.id !== undefined &&
          !claimedTabIds.has(candidate.id) &&
          candidate.url === item.url
        );
        candidates.sort((left, right) => Math.abs(left.index - item.index) - Math.abs(right.index - item.index));
        tab = candidates[0];
      }
      if (!tab || tab.id === undefined || tab.windowId === undefined) continue;
      claimedTabIds.add(tab.id);
      if (!this.#registry.has(tab.windowId)) this.#registry.set(tab.windowId, new Map());
      this.#registry.get(tab.windowId)!.set(tab.id, item.spaceId);
      this.#tabMetadata.set(`${tab.windowId}:${tab.id}`, { url: tab.url ?? '', index: tab.index });
    }

    // 一次性兼容旧 session 数据，避免升级当下丢失仍打开 Tab 的归属。
    const legacy = legacyResult[TabSpaceRegistry.LEGACY_SESSION_KEY];
    if (Array.isArray(legacy))
    {
      for (const [windowId, entries] of legacy)
      {
        for (const [tabId, spaceId] of entries)
        {
          const tab = liveTabs.get(tabId);
          if (!tab || tab.windowId !== windowId || this.getSpace(windowId, tabId)) continue;
          if (!this.#registry.has(windowId)) this.#registry.set(windowId, new Map());
          this.#registry.get(windowId)!.set(tabId, spaceId);
          this.#tabMetadata.set(`${windowId}:${tabId}`, { url: tab.url ?? '', index: tab.index });
        }
      }
    }
    await this.save();
  }

  private broadcast(windowId: number): void
  {
    chrome.runtime.sendMessage({
      action: TAB_SPACE_ASSIGNMENTS_CHANGED,
      windowId,
      assignments: this.getWindowAssignments(windowId),
    }).catch(() => {});
  }
}
