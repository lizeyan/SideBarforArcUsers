import { Globe2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { tabHistoryManagerProxy } from '../managers/proxies/tabHistoryManagerProxy';
import { RecentTabItem } from '../managers/shared/tabHistoryManagerApi';
import { RecentTabSelection } from '../utils/recentTabSelection';

interface RecentTabSwitcherProps
{
  windowId: number;
  onClose: () => void;
  snapshotTabIds?: readonly number[];
  controlledSelectedTabId?: number;
}

/**
 * 在 Side Panel 视口上方临时展示最近使用的实时 Tab。
 *
 * 组件通过 portal 脱离工具栏和内容区布局，因此不会占据固定高度。
 * 真正的 Tab 与 Space 激活仍交给后台 manager，避免 UI 自己复制跨 Space 逻辑。
 */
export function RecentTabSwitcher({
  windowId,
  onClose,
  snapshotTabIds,
  controlledSelectedTabId,
}: RecentTabSwitcherProps)
{
  const [items, setItems] = useState<RecentTabItem[]>([]);
  const [selection, setSelection] = useState<RecentTabSelection | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [activating, setActivating] = useState(false);
  const loadGenerationRef = useRef(0);
  const listboxRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(document.activeElement as HTMLElement | null);
  const focusedRef = useRef(false);

  const loadItems = useCallback(async () =>
  {
    const generation = ++loadGenerationRef.current;
    try
    {
      const nextItems = await tabHistoryManagerProxy.getRecentTabs(windowId);
      if (generation !== loadGenerationRef.current) return;

      const nextItemsById = new Map(nextItems.map(item => [item.tabId, item]));
      const orderedItems = snapshotTabIds
        ? snapshotTabIds.flatMap(tabId =>
        {
          const item = nextItemsById.get(tabId);
          return item ? [item] : [];
        })
        : nextItems;
      const nextTabIds = orderedItems.map(item => item.tabId);

      setItems(orderedItems);
      setSelection(current =>
      {
        const updated = current?.update(nextTabIds) ?? RecentTabSelection.open(nextTabIds);
        return controlledSelectedTabId === undefined
          ? updated
          : updated?.select(controlledSelectedTabId) ?? null;
      });
      setLoaded(true);
    }
    catch (error)
    {
      if (generation !== loadGenerationRef.current) return;
      if (import.meta.env.DEV)
      {
        console.error('[RecentTabSwitcher] Failed to load recent tabs:', error);
      }
      onClose();
    }
  }, [controlledSelectedTabId, onClose, snapshotTabIds, windowId]);

  useEffect(() =>
  {
    if (controlledSelectedTabId === undefined) return;
    setSelection(current => current?.select(controlledSelectedTabId) ?? null);
  }, [controlledSelectedTabId]);

  useEffect(() =>
  {
    void loadItems();
    return () =>
    {
      loadGenerationRef.current++;
    };
  }, [loadItems]);

  useEffect(() =>
  {
    const refreshForActivation = (activeInfo: chrome.tabs.TabActiveInfo) =>
    {
      if (activeInfo.windowId === windowId) void loadItems();
    };
    const refreshForRemoval = (_tabId: number, removeInfo: chrome.tabs.TabRemoveInfo) =>
    {
      if (removeInfo.windowId === windowId) void loadItems();
    };
    const refreshForUpdate = (_tabId: number, _changeInfo: chrome.tabs.TabChangeInfo, tab: chrome.tabs.Tab) =>
    {
      if (tab.windowId === windowId) void loadItems();
    };
    const refreshForDetach = (_tabId: number, detachInfo: chrome.tabs.TabDetachInfo) =>
    {
      if (detachInfo.oldWindowId === windowId) void loadItems();
    };
    const refreshForAttach = (_tabId: number, attachInfo: chrome.tabs.TabAttachInfo) =>
    {
      if (attachInfo.newWindowId === windowId) void loadItems();
    };

    chrome.tabs.onActivated.addListener(refreshForActivation);
    chrome.tabs.onRemoved.addListener(refreshForRemoval);
    chrome.tabs.onUpdated.addListener(refreshForUpdate);
    chrome.tabs.onDetached.addListener(refreshForDetach);
    chrome.tabs.onAttached.addListener(refreshForAttach);
    return () =>
    {
      chrome.tabs.onActivated.removeListener(refreshForActivation);
      chrome.tabs.onRemoved.removeListener(refreshForRemoval);
      chrome.tabs.onUpdated.removeListener(refreshForUpdate);
      chrome.tabs.onDetached.removeListener(refreshForDetach);
      chrome.tabs.onAttached.removeListener(refreshForAttach);
    };
  }, [loadItems, windowId]);

  useEffect(() =>
  {
    if (!loaded || !selection || focusedRef.current) return;
    focusedRef.current = true;
    listboxRef.current?.focus();
  }, [loaded, selection]);

  useEffect(() =>
  {
    return () =>
    {
      const previousFocus = previousFocusRef.current;
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, []);

  useEffect(() =>
  {
    if (loaded && selection === null)
    {
      onClose();
    }
  }, [loaded, onClose, selection]);

  const itemById = useMemo(
    () => new Map(items.map(item => [item.tabId, item])),
    [items]
  );

  const confirm = useCallback(async (tabId: number) =>
  {
    if (activating) return;
    setActivating(true);
    try
    {
      const activated = await tabHistoryManagerProxy.activateRecentTab(windowId, tabId);
      if (activated)
      {
        onClose();
        return;
      }

      setActivating(false);
      await loadItems();
    }
    catch (error)
    {
      if (import.meta.env.DEV)
      {
        console.error('[RecentTabSwitcher] Failed to activate recent tab:', error);
      }
      setActivating(false);
      await loadItems();
    }
  }, [activating, loadItems, onClose, windowId]);

  useEffect(() =>
  {
    const handleKeyDown = (event: KeyboardEvent) =>
    {
      if (!selection) return;

      if (event.key === 'Escape')
      {
        event.preventDefault();
        onClose();
      }
      else if (event.key === 'Enter')
      {
        event.preventDefault();
        void confirm(selection.selectedTabId);
      }
      else if (event.key === 'ArrowDown' || (event.key === 'Tab' && !event.shiftKey))
      {
        event.preventDefault();
        setSelection(current => current?.move(1) ?? null);
      }
      else if (event.key === 'ArrowUp' || (event.key === 'Tab' && event.shiftKey))
      {
        event.preventDefault();
        setSelection(current => current?.move(-1) ?? null);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [confirm, onClose, selection]);

  if (!loaded || !selection) return null;

  const candidates = selection.tabIds.flatMap(tabId =>
  {
    const item = itemById.get(tabId);
    return item ? [item] : [];
  });

  return createPortal(
    <div
      className="fixed inset-0 z-[80] bg-black/15 dark:bg-black/30"
      data-testid="recent-tab-switcher-backdrop"
      onMouseDown={(event) =>
      {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Recent tabs"
        data-testid="recent-tab-switcher"
        className="absolute left-2 right-2 top-12 max-h-[70vh] overflow-y-auto rounded-2xl border border-white/50 bg-white/90 p-1.5 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-gray-900/90"
      >
        <div
          ref={listboxRef}
          role="listbox"
          aria-label="Recently used tabs"
          aria-activedescendant={`recent-tab-switcher-option-${selection.selectedTabId}`}
          tabIndex={-1}
          className="space-y-1 outline-none"
        >
          {candidates.map(item =>
          {
            const selected = item.tabId === selection.selectedTabId;
            return (
              <button
                key={item.tabId}
                id={`recent-tab-switcher-option-${item.tabId}`}
                type="button"
                role="option"
                data-testid={`recent-tab-switcher-item-${item.tabId}`}
                aria-selected={selected}
                disabled={activating}
                onMouseEnter={() =>
                {
                  setSelection(current => current?.select(item.tabId) ?? null);
                }}
                onClick={() => void confirm(item.tabId)}
                className={`flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left transition-all ${
                  selected
                    ? 'bg-white/95 text-gray-950 shadow-md ring-2 ring-indigo-400/70 dark:bg-white/15 dark:text-white dark:ring-indigo-300/60'
                    : 'text-gray-700 hover:bg-white/60 dark:text-gray-200 dark:hover:bg-white/10'
                }`}
              >
                {item.favIconUrl ? (
                  <img src={item.favIconUrl} alt="" className="h-4 w-4 flex-none" />
                ) : (
                  <Globe2 size={16} className="flex-none text-gray-400" />
                )}
                <span className="min-w-0 flex-1 truncate">{item.title}</span>
                {item.active && (
                  <span className="flex-none text-[10px] text-gray-400 dark:text-gray-500">Current</span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>,
    document.body
  );
}
