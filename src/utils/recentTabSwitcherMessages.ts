export const RecentTabSwitcherMessageAction = {
  SHOW_COMMAND_SESSION: 'recent-tab-switcher-show-command-session',
  CLOSE_COMMAND_SESSION: 'recent-tab-switcher-close-command-session',
  CANCEL_COMMAND_SESSION: 'recent-tab-switcher-cancel-command-session',
} as const;

export interface ShowRecentTabCommandSessionMessage
{
  action: typeof RecentTabSwitcherMessageAction.SHOW_COMMAND_SESSION;
  windowId: number;
  tabIds: number[];
  selectedTabId: number;
}

export interface CloseRecentTabCommandSessionMessage
{
  action: typeof RecentTabSwitcherMessageAction.CLOSE_COMMAND_SESSION;
  windowId: number;
}

export interface CancelRecentTabCommandSessionMessage
{
  action: typeof RecentTabSwitcherMessageAction.CANCEL_COMMAND_SESSION;
  windowId: number;
}

export type RecentTabSwitcherRuntimeMessage =
  | ShowRecentTabCommandSessionMessage
  | CloseRecentTabCommandSessionMessage
  | CancelRecentTabCommandSessionMessage;
