/** 判断原生标签激活事件是否属于当前 Side Panel 窗口。 */
export function isActivationForWindow(
  currentWindowId: number | null,
  activeInfo: Pick<chrome.tabs.TabActiveInfo, 'windowId'>
): boolean
{
  return currentWindowId !== null && activeInfo.windowId === currentWindowId;
}
