/**
 * 按 Chrome windowId 串行执行异步任务，不同窗口之间仍可并行。
 *
 * 最近 Tab 快速切换必须等前一次激活完成后再读取新的 active Tab，
 * 否则两次连续触发会选中同一个目标，无法形成 A/B 往返。
 */
export class WindowTaskQueue
{
  #tails = new Map<number, Promise<void>>();

  run<T>(windowId: number, task: () => Promise<T>): Promise<T>
  {
    const previous = this.#tails.get(windowId) ?? Promise.resolve();
    const result = previous.catch(() => undefined).then(task);
    const tail = result.then(() => undefined, () => undefined);
    this.#tails.set(windowId, tail);

    void tail.then(() =>
    {
      if (this.#tails.get(windowId) === tail)
      {
        this.#tails.delete(windowId);
      }
    });

    return result;
  }
}
