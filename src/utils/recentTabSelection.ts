/**
 * 表示一次 Side Panel 最近标签切换窗口中的临时选择。
 *
 * 输入顺序的第一项是当前 Tab；窗口保留完整 MRU 列表，并默认选中
 * 第二项，也就是上一个使用的 Tab。实例不负责激活 Chrome Tab。
 */
export class RecentTabSelection
{
  readonly tabIds: readonly number[];
  readonly selectedIndex: number;

  private constructor(tabIds: readonly number[], selectedIndex: number)
  {
    this.tabIds = tabIds;
    this.selectedIndex = selectedIndex;
  }

  static open(recentTabIds: readonly number[]): RecentTabSelection | null
  {
    if (recentTabIds.length < 2)
    {
      return null;
    }
    return new RecentTabSelection(recentTabIds, 1);
  }

  get selectedTabId(): number
  {
    return this.tabIds[this.selectedIndex];
  }

  move(direction: -1 | 1): RecentTabSelection
  {
    const nextIndex = (this.selectedIndex + direction + this.tabIds.length) % this.tabIds.length;
    return new RecentTabSelection(this.tabIds, nextIndex);
  }

  select(tabId: number): RecentTabSelection
  {
    const index = this.tabIds.indexOf(tabId);
    return index === -1 ? this : new RecentTabSelection(this.tabIds, index);
  }

  update(recentTabIds: readonly number[]): RecentTabSelection | null
  {
    if (recentTabIds.length < 2)
    {
      return null;
    }

    const preservedIndex = recentTabIds.indexOf(this.selectedTabId);
    if (preservedIndex !== -1)
    {
      return new RecentTabSelection(recentTabIds, preservedIndex);
    }

    // 当前候选刚被关闭时保持原来的视觉位置，超出末尾才回退一项。
    const fallbackIndex = Math.min(this.selectedIndex, recentTabIds.length - 1);
    return new RecentTabSelection(recentTabIds, fallbackIndex);
  }
}
