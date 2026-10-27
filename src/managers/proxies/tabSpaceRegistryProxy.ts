// Sidebar-side client for TabSpaceRegistry. The sidebar never reads this
// registry, so unlike spaceWindowStateProxy there is no mirror store and no
// broadcast listener here - see shared/tabSpaceRegistryApi.ts.

import { ManagerId, callManager, Remote } from './messageRouting';
import { TabSpaceRegistryApi } from '../shared/tabSpaceRegistryApi';

export const tabSpaceRegistryProxy: Remote<TabSpaceRegistryApi> = {
  async register(windowId: number, tabId: number, spaceId: string): Promise<void>
  {
    await callManager<void>(ManagerId.TAB_SPACE_REGISTRY, 'register', { windowId, tabId, spaceId });
  },

  async unregister(windowId: number, tabId: number): Promise<void>
  {
    await callManager<void>(ManagerId.TAB_SPACE_REGISTRY, 'unregister', { windowId, tabId });
  },

  async getWindowAssignments(windowId: number): Promise<Record<number, string>>
  {
    return await callManager<Record<number, string>>(
      ManagerId.TAB_SPACE_REGISTRY,
      'getWindowAssignments',
      { windowId }
    );
  },
};
