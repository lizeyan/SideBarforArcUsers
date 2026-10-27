export type ArcTabSectionItem<TTab> =
  | { type: 'new-tab' }
  | { type: 'tab'; tab: TTab };

/**
 * Arc 将 New Tab 作为普通标签页列表的固定入口，始终排在临时标签页之前。
 */
export function getArcTabSectionItems<TTab>(
  tabs: readonly TTab[],
): ArcTabSectionItem<TTab>[]
{
  return [
    { type: 'new-tab' },
    ...tabs.map(tab => ({ type: 'tab' as const, tab })),
  ];
}
