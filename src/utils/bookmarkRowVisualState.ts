export type BookmarkRowVisualState = 'active' | 'selected' | 'default';

export interface BookmarkRowVisualInput
{
  isActive: boolean;
  isSelected: boolean;
  selectionCount: number;
}

/**
 * 决定固定 Tab 行的主要视觉状态。
 * 普通点击形成的单项选择不能覆盖 Arc 的活跃卡片；只有真正多选时才显示选择态。
 */
export function resolveBookmarkRowVisualState({
  isActive,
  isSelected,
  selectionCount,
}: BookmarkRowVisualInput): BookmarkRowVisualState
{
  if (isSelected && selectionCount > 1) return 'selected';
  if (isActive) return 'active';
  return 'default';
}
