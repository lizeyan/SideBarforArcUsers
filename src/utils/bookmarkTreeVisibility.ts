export interface BookmarkTreeNodeLike {
  id: string;
  url?: string;
  children?: BookmarkTreeNodeLike[];
}

export interface VisibleBookmarkChild<TNode extends BookmarkTreeNodeLike> {
  node: TNode;
  isActivePeek: boolean;
}

export type BookmarkRowClickIntent = 'toggle-folder' | 'select-only' | 'open-bookmark';
export type BookmarkRowKeyIntent =
  | 'toggle-folder'
  | 'expand-folder'
  | 'collapse-folder'
  | 'open-bookmark'
  | 'none';

/**
 * Space 绑定的书签根文件夹只负责界定范围，不作为侧边栏中的可见行。
 */
export const getVisibleSpaceRootItems = <TNode extends BookmarkTreeNodeLike>(
  spaceRoot: TNode,
): TNode[] =>
  spaceRoot.children ? [...spaceRoot.children] as TNode[] : [];

/**
 * 返回文件夹当前应渲染的子节点。
 *
 * 折叠时仍递归寻找活跃固定 Tab，是为了复现 Arc 的行为：文件夹结构保持折叠，
 * 但用户仍能看到当前页面位于哪个文件夹。当前窗口只会有一个活跃 Tab，因此找到
 * 第一个活跃书签后即可提前结束遍历，避免每次渲染扫描完整棵子树。
 */
export const getVisibleBookmarkChildren = <TNode extends BookmarkTreeNodeLike>(
  folder: TNode,
  isExpanded: boolean,
  isActive: (bookmarkId: string) => boolean,
): VisibleBookmarkChild<TNode>[] =>
{
  if (!folder.children?.length)
  {
    return [];
  }

  if (isExpanded)
  {
    return folder.children.map((node) => ({
      node: node as TNode,
      isActivePeek: false,
    }));
  }

  const findActiveDescendant = (nodes: BookmarkTreeNodeLike[]): TNode | undefined =>
  {
    // 深度优先查找可以保持书签树原有顺序，同时在命中当前活跃项后立即停止。
    for (const node of nodes)
    {
      if (node.url && isActive(node.id))
      {
        return node as TNode;
      }

      if (node.children?.length)
      {
        const activeDescendant = findActiveDescendant(node.children);
        if (activeDescendant)
        {
          return activeDescendant;
        }
      }
    }

    return undefined;
  };

  const activeDescendant = findActiveDescendant(folder.children);
  return activeDescendant
    ? [{ node: activeDescendant, isActivePeek: true }]
    : [];
};

/**
 * 将文件夹行点击与书签打开区分开，组合键点击继续交给多选逻辑处理。
 */
export const resolveBookmarkRowClickIntent = (
  isFolder: boolean,
  hasSelectionModifier: boolean,
): BookmarkRowClickIntent =>
{
  if (hasSelectionModifier)
  {
    return 'select-only';
  }

  return isFolder ? 'toggle-folder' : 'open-bookmark';
};

/**
 * 将键盘输入解析为与 Arc 一致的文件夹和固定页面动作。
 */
export const resolveBookmarkRowKeyIntent = (
  isFolder: boolean,
  isExpanded: boolean,
  key: string,
  hasModifier: boolean,
): BookmarkRowKeyIntent =>
{
  if (hasModifier) return 'none';

  if (key === 'Enter' || key === ' ')
  {
    return isFolder ? 'toggle-folder' : 'open-bookmark';
  }

  if (isFolder && key === 'ArrowRight' && !isExpanded)
  {
    return 'expand-folder';
  }

  if (isFolder && key === 'ArrowLeft' && isExpanded)
  {
    return 'collapse-folder';
  }

  return 'none';
};
