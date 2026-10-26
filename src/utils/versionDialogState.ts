export interface VersionDialogStateInput
{
  isLoaded: boolean;
  lastSeenVersion: string;
  currentVersion: string;
}

export interface VersionDialogState
{
  isNewInstall: boolean;
  hasVersionChanged: boolean;
}

/** 存储就绪前不推断安装状态，避免每次冷启动误挂载 Welcome 对话框。 */
export function resolveVersionDialogState({
  isLoaded,
  lastSeenVersion,
  currentVersion,
}: VersionDialogStateInput): VersionDialogState
{
  if (!isLoaded)
  {
    return { isNewInstall: false, hasVersionChanged: false };
  }

  const isNewInstall = lastSeenVersion === '';
  return {
    isNewInstall,
    hasVersionChanged: !isNewInstall && lastSeenVersion !== currentVersion,
  };
}
