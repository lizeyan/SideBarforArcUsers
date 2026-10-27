import { getEffectiveTabUrl, normalizeComparableUrl } from './parkedTabAssociation.ts';

/**
 * 返回未被书签或 Favorite 关联管理的 Chrome Tab。
 * 用户定义的普通 Tab 还必须不在任何书签或 Favorite 中；只做分类，不复制或重排对象。
 */
export function filterUnmanagedTabs<T extends { id?: number; url?: string }>(
  tabs: readonly T[],
  managedTabIds: ReadonlySet<number>,
  persistentUrls: ReadonlySet<string> = new Set()
): T[]
{
  // 预先规范化一次固定网址，避免每个 Tab 都重复遍历书签和 Favorites。
  const normalizedPersistentUrls = new Set(
    Array.from(persistentUrls, normalizeComparableUrl)
  );

  return tabs.filter(tab =>
  {
    if (tab.id !== undefined && managedTabIds.has(tab.id)) return false;
    if (!tab.url || normalizedPersistentUrls.size === 0) return true;
    return !normalizedPersistentUrls.has(
      normalizeComparableUrl(getEffectiveTabUrl(tab.url))
    );
  });
}

/** 按扩展持有的 tabId → spaceId 关联筛选普通 Tab，Chrome groupId 不参与判断。 */
export function filterTabsForSpace<T extends { id?: number }>(
  tabs: readonly T[],
  assignments: Readonly<Record<number, string>>,
  spaceId: string
): T[]
{
  return tabs.filter(tab => tab.id !== undefined && assignments[tab.id] === spaceId);
}
