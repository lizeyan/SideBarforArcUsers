interface ActiveTabUrl
{
  url?: string;
}

interface CopyActiveTabUrlDependencies
{
  getActiveTab: (windowId: number) => Promise<ActiveTabUrl | undefined>;
  writeText: (text: string) => Promise<void>;
}

/**
 * 读取指定窗口的活跃 Tab，并把其完整 URL 原样写入剪贴板。
 * Chrome 查询与剪贴板写入均由调用方注入，便于在不模拟内部组件的情况下验证用户行为。
 */
export async function copyActiveTabUrl(
  windowId: number,
  dependencies: CopyActiveTabUrlDependencies
): Promise<string>
{
  const activeTab = await dependencies.getActiveTab(windowId);
  if (!activeTab?.url)
  {
    throw new Error('Active tab has no URL');
  }

  await dependencies.writeText(activeTab.url);
  return activeTab.url;
}
