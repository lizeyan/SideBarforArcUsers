/**
 * 返回未被书签或 Favorite 关联管理的 Chrome Tab。
 * 只做分类，不复制或重排对象，因此原生 groupId、index、pinned 等状态保持不变。
 */
export function filterUnmanagedTabs<T extends { id?: number }>(
  tabs: readonly T[],
  managedTabIds: ReadonlySet<number>
): T[]
{
  return tabs.filter(tab => tab.id === undefined || !managedTabIds.has(tab.id));
}
