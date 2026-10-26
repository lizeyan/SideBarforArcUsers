export interface FolderSelectionNode
{
  id: string;
  parentId?: string;
}

/**
 * 决定“New Folder with N Items”的新文件夹位置。
 * 同父项目保留原层级；跨父项目进入当前 Space 根目录；Space 文件夹配置缺失时
 * 回退到第一个项目的父目录，避免把书签移动到不可预测的位置。
 */
export function resolveNewFolderParentId(
  selectedNodes: readonly FolderSelectionNode[],
  currentSpaceFolderId: string | null
): string | null
{
  const firstParentId = selectedNodes[0]?.parentId;
  if (!firstParentId) return currentSpaceFolderId;

  const shareParent = selectedNodes.every(node => node.parentId === firstParentId);
  if (shareParent) return firstParentId;

  return currentSpaceFolderId ?? firstParentId;
}
