type AsyncStep = () => Promise<unknown>;

/**
 * 统一固定 Tab 关联的启动顺序：先加载 background manager，再恢复本地备份。
 * 调用方只需要等待 wait()，不需要了解两阶段初始化或错误降级细节。
 */
export class TabAssociationReadiness
{
  #ready: Promise<void>;

  constructor(
    loadManagers: AsyncStep,
    restoreAssociations: AsyncStep,
    onError: (error: unknown) => void = () => {}
  )
  {
    this.#ready = (async () =>
    {
      try
      {
        await loadManagers();
        await restoreAssociations();
      }
      catch (error)
      {
        onError(error);
      }
    })();
  }

  wait = (): Promise<void> => this.#ready;
}
