/**
 * 维护一个窗口内真实 Chrome Tab 的最近使用顺序。
 *
 * 第一项始终是最近激活的 Tab。重新激活已有 Tab 时只移动位置，
 * 不产生重复记录，因此第二项可以稳定表示“上一个使用的 Tab”。
 */
export class RecentTabOrder
{
  #tabIds: number[];
  #maxSize: number;

  constructor(tabIds: readonly number[] = [], maxSize = 25)
  {
    this.#maxSize = maxSize;

    // Session 恢复的数据可能来自旧版本或异常中断；按原顺序去重后再裁剪。
    this.#tabIds = [...new Set(tabIds)].slice(0, this.#maxSize);
  }

  record(tabId: number): void
  {
    const existingIndex = this.#tabIds.indexOf(tabId);
    if (existingIndex !== -1)
    {
      this.#tabIds.splice(existingIndex, 1);
    }
    this.#tabIds.unshift(tabId);
    if (this.#tabIds.length > this.#maxSize)
    {
      this.#tabIds.length = this.#maxSize;
    }
  }

  getMostRecentOther(currentTabId: number): number | undefined
  {
    return this.#tabIds.find(tabId => tabId !== currentTabId);
  }

  remove(tabId: number): void
  {
    const index = this.#tabIds.indexOf(tabId);
    if (index !== -1)
    {
      this.#tabIds.splice(index, 1);
    }
  }

  retain(validTabIds: ReadonlySet<number>): boolean
  {
    const next = this.#tabIds.filter(tabId => validTabIds.has(tabId));
    if (next.length === this.#tabIds.length)
    {
      return false;
    }

    this.#tabIds = next;
    return true;
  }

  appendMissing(tabIds: readonly number[]): boolean
  {
    let changed = false;

    // 新安装或旧会话恢复时没有完整 MRU；把其余实时 Tab 稳定追加到末尾。
    for (const tabId of tabIds)
    {
      if (this.#tabIds.length >= this.#maxSize) break;
      if (this.#tabIds.includes(tabId)) continue;
      this.#tabIds.push(tabId);
      changed = true;
    }

    return changed;
  }

  toArray(): number[]
  {
    return [...this.#tabIds];
  }
}
