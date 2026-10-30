/**
 * 表示通过扩展快捷键连续触发的一次最近 Tab 切换会话。
 *
 * Chrome Commands API 不提供修饰键松开事件，因此会话只记录每次命令
 * 的时间，并由后台在无新输入超时后结束。Tab 顺序在第一次触发时冻结，
 * 避免实时激活导致 MRU 重排后候选顺序跳动。
 */
export class RecentTabCommandSession
{
  readonly tabIds: readonly number[];
  readonly selectedIndex: number;
  readonly overlayVisible: boolean;
  readonly lastTriggeredAt: number;

  private constructor(
    tabIds: readonly number[],
    selectedIndex: number,
    overlayVisible: boolean,
    lastTriggeredAt: number
  )
  {
    this.tabIds = tabIds;
    this.selectedIndex = selectedIndex;
    this.overlayVisible = overlayVisible;
    this.lastTriggeredAt = lastTriggeredAt;
  }

  static start(tabIds: readonly number[], triggeredAt: number): RecentTabCommandSession | null
  {
    const snapshot = [...new Set(tabIds)];
    if (snapshot.length < 2)
    {
      return null;
    }

    return new RecentTabCommandSession(snapshot, 1, false, triggeredAt);
  }

  get selectedTabId(): number
  {
    return this.tabIds[this.selectedIndex];
  }

  advance(triggeredAt: number): RecentTabCommandSession
  {
    const selectedIndex = (this.selectedIndex + 1) % this.tabIds.length;
    return new RecentTabCommandSession(this.tabIds, selectedIndex, true, triggeredAt);
  }

  isExpired(now: number, timeoutMs: number): boolean
  {
    return now - this.lastTriggeredAt >= timeoutMs;
  }
}
