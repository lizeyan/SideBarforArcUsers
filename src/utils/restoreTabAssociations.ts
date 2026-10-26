export interface RestoredTabAssociations
{
  associations: Record<number, string>;
  itemToTab: Map<string, number>;
  tabToItem: Map<number, string>;
  tabTitles: Map<number, string>;
  audibleTabs: Set<number>;
  mutedTabs: Set<number>;
}

type GetTab = (tabId: number) => Promise<chrome.tabs.Tab | null>;

/**
 * 合并当前 session 与本地 backup 恢复结果。
 * 当前 session 优先；backup 只补充缺失且仍存在的 Tab，并保持 itemKey 一对一。
 */
export function mergeRestoredTabAssociations(
  sessionAssociations: Record<number, string>,
  backupAssociations: Record<number, string>,
  validTabIds: ReadonlySet<number>
): Record<number, string>
{
  const merged: Record<number, string> = {};
  const claimedItemKeys = new Set<string>();

  // 先保留当前 session 中仍然存在的真实 Tab 关联。
  for (const [tabIdText, itemKey] of Object.entries(sessionAssociations))
  {
    const tabId = Number(tabIdText);
    if (!validTabIds.has(tabId) || claimedItemKeys.has(itemKey)) continue;
    merged[tabId] = itemKey;
    claimedItemKeys.add(itemKey);
  }

  // backup 只补充 session 缺失的 tabId 和 itemKey。
  for (const [tabIdText, itemKey] of Object.entries(backupAssociations))
  {
    const tabId = Number(tabIdText);
    if (!validTabIds.has(tabId) || merged[tabId] || claimedItemKeys.has(itemKey)) continue;
    merged[tabId] = itemKey;
    claimedItemKeys.add(itemKey);
  }

  return merged;
}

/**
 * 并发验证一个窗口中持久化的固定 Tab 关联，并构造 Provider 所需快照。
 * Chrome API 调用彼此独立，批量并发可以避免关联数量线性增加启动等待时间。
 */
export async function restoreTabAssociations(
  associations: Record<number, string>,
  getTab: GetTab
): Promise<RestoredTabAssociations>
{
  const entries = Object.entries(associations).map(([tabId, itemKey]) => ({
    tabId: Number(tabId),
    itemKey,
  }));

  const validated = await Promise.all(entries.map(async ({ tabId, itemKey }) => ({
    tabId,
    itemKey,
    tab: await getTab(tabId),
  })));

  const result: RestoredTabAssociations = {
    associations: {},
    itemToTab: new Map(),
    tabToItem: new Map(),
    tabTitles: new Map(),
    audibleTabs: new Set(),
    mutedTabs: new Set(),
  };

  // 只保留仍然存在的 Tab，并一次构造全部派生索引。
  for (const { tabId, itemKey, tab } of validated)
  {
    if (!tab) continue;

    result.associations[tabId] = itemKey;
    result.itemToTab.set(itemKey, tabId);
    result.tabToItem.set(tabId, itemKey);
    if (tab.title) result.tabTitles.set(tabId, tab.title);
    if (tab.audible) result.audibleTabs.add(tabId);
    if (tab.mutedInfo?.muted) result.mutedTabs.add(tabId);
  }

  return result;
}
