export type TrackedTabGroupMoveAction = 'none' | 'update-space' | 'restore-space' | 'deassociate';

export interface TrackedTabGroupMoveInput
{
  itemKey: string | undefined;
  registeredSpaceId: string;
  liveSpaceId: string | undefined;
}

/**
 * 决定受管理 Tab 被原生移动到另一个 Chrome 组后的同步方式。
 * Favorite 是跨 Space 的固定入口，保留关联并更新归属；书签由文件夹定义归属，跨出后转为普通 Tab。
 */
export function resolveTrackedTabGroupMove({
  itemKey,
  registeredSpaceId,
  liveSpaceId,
}: TrackedTabGroupMoveInput): TrackedTabGroupMoveAction
{
  if (!liveSpaceId)
  {
    return itemKey?.startsWith('pinned-') ? 'restore-space' : 'deassociate';
  }
  if (liveSpaceId === registeredSpaceId) return 'none';
  if (itemKey?.startsWith('pinned-')) return 'update-space';
  return 'deassociate';
}
