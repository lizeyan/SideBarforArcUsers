export type ArcFolderIconState = 'collapsed' | 'expanded' | 'active-peek';

/**
 * 解析 Arc 文件夹图标状态。展开状态优先，因为活跃子项在展开时已经位于完整树结构中。
 */
export function resolveArcFolderIconState(
  isExpanded: boolean,
  hasActivePeek: boolean
): ArcFolderIconState
{
  if (isExpanded) return 'expanded';
  if (hasActivePeek) return 'active-peek';
  return 'collapsed';
}
