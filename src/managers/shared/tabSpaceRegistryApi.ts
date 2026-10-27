// The wire contract for TabSpaceRegistry, owned by neither side.
//
// impl/tabSpaceRegistry.ts implements TabSpaceRegistryApi;
// proxies/tabSpaceRegistryProxy.ts implements Remote<TabSpaceRegistryApi>.
// Both import this file, so the two signatures cannot drift apart silently -
// and neither has to import the other.

/**
 * The subset of TabSpaceRegistry the sidebar can call.
 *
 * Only register() is here. getSpace/unregister/removeWindow/load are
 * background-internal - nothing in the sidebar reads the registry, so there
 * is no mirror store or broadcast for this manager. See the decision doc's
 * migration order.
 */
export const TAB_SPACE_ASSIGNMENTS_CHANGED = 'tab-space-assignments-changed';

export interface TabSpaceRegistryApi
{
  /** Record which Space a tab belongs to; the association is independent of Chrome groups. */
  register(windowId: number, tabId: number, spaceId: string): Promise<void>;
  unregister(windowId: number, tabId: number): Promise<void>;
  getWindowAssignments(windowId: number): Record<number, string>;
}
