export interface SpaceIdentity {
  id: string;
}

/**
 * 将持久化的 Space ID 解析为当前可用的真实 Space。
 * 旧版本保存的 `all` 与已经删除的 ID 都统一回退到第一个真实 Space。
 */
export function resolveActiveSpaceId(
  spaces: readonly SpaceIdentity[],
  requestedSpaceId: string,
): string | null
{
  if (spaces.some(space => space.id === requestedSpaceId))
  {
    return requestedSpaceId;
  }

  return spaces[0]?.id ?? null;
}

/**
 * 删除当前 Space 时选择相邻 Space，避免重新落入旧的 All 聚合视图。
 */
export function resolveSpaceIdAfterDeletion(
  spaces: readonly SpaceIdentity[],
  deletedSpaceId: string,
  activeSpaceId: string,
): string | null
{
  if (activeSpaceId !== deletedSpaceId && spaces.some(space => space.id === activeSpaceId))
  {
    return activeSpaceId;
  }

  const deletedIndex = spaces.findIndex(space => space.id === deletedSpaceId);
  if (deletedIndex === -1)
  {
    return resolveActiveSpaceId(spaces, activeSpaceId);
  }

  return spaces[deletedIndex + 1]?.id
    ?? spaces[deletedIndex - 1]?.id
    ?? null;
}
