import { getEffectiveTabUrl, normalizeComparableUrl } from './parkedTabAssociation.ts';

interface GlobalFavoriteTabInput
{
  itemKey?: string;
  tabUrl?: string;
  favoriteUrls: readonly string[];
}

interface TabSpaceAssignmentInput
{
  isGlobalFavorite: boolean;
  assignedSpaceId?: string;
  fallbackSpaceId?: string | null;
}

export interface TabSpaceAssignmentDecision
{
  spaceId?: string;
  shouldUnregister: boolean;
}

/**
 * 判断一个真实 Tab 是否由全局 Favorite 管理。
 *
 * 已恢复的 `pinned-*` 关联是最可靠的身份；Side Panel 尚未完成关联恢复时，
 * 再以规范化后的有效 URL 兜底，避免 Chrome 的创建/激活事件抢先把它绑定到 Space。
 */
export function isGlobalFavoriteTab({
  itemKey,
  tabUrl,
  favoriteUrls,
}: GlobalFavoriteTabInput): boolean
{
  if (itemKey?.startsWith('pinned-')) return true;
  if (!tabUrl) return false;

  const comparableTabUrl = normalizeComparableUrl(getEffectiveTabUrl(tabUrl));
  if (!comparableTabUrl) return false;

  // Favorite 数量通常很少；在事件边界按需规范化可避免维护另一份易失效的缓存。
  return favoriteUrls.some(url => normalizeComparableUrl(url) === comparableTabUrl);
}

/**
 * 决定 Tab 在一次创建、激活或恢复事件后应保留的 Space 归属。
 * Global Favorite 永远不取 fallback，并主动清理旧版本遗留的已有归属。
 */
export function resolveTabSpaceAssignment({
  isGlobalFavorite,
  assignedSpaceId,
  fallbackSpaceId,
}: TabSpaceAssignmentInput): TabSpaceAssignmentDecision
{
  if (isGlobalFavorite)
  {
    return {
      spaceId: undefined,
      shouldUnregister: assignedSpaceId !== undefined,
    };
  }

  return {
    spaceId: assignedSpaceId ?? fallbackSpaceId ?? undefined,
    shouldUnregister: false,
  };
}
