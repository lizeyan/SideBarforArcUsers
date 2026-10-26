import { runBatchOperation } from '../hooks/useBookmarks';
import { UndoableAction } from './types';

interface BookmarkLocation
{
  id: string;
  parentId: string;
  index: number;
}

type BookmarkMovedCallback = (bookmarkId: string, targetFolderId: string) => Promise<void>;

/**
 * 把一组选中的固定 Tab 组成新的 Chrome 书签文件夹，并支持撤销。
 * 原始父目录和位置只在第一次执行时记录，后续 redo 继续使用同一组位置。
 */
export class CreateBookmarkFolderAction implements UndoableAction
{
  description: string;
  #targetParentId: string;
  #title: string;
  #bookmarkIds: string[];
  #originalLocations: BookmarkLocation[] = [];
  #createdFolderId: string | null = null;
  #onBookmarkMoved?: BookmarkMovedCallback;
  #onFolderCreated?: (folderId: string) => void;

  constructor(
    targetParentId: string,
    title: string,
    bookmarkIds: string[],
    onBookmarkMoved?: BookmarkMovedCallback,
    onFolderCreated?: (folderId: string) => void
  )
  {
    this.#targetParentId = targetParentId;
    this.#title = title;
    this.#bookmarkIds = bookmarkIds;
    this.#onBookmarkMoved = onBookmarkMoved;
    this.#onFolderCreated = onFolderCreated;
    this.description = `Created "${title}" with ${bookmarkIds.length} items`;
  }

  async do(): Promise<void>
  {
    if (this.#originalLocations.length === 0)
    {
      const nodes = await Promise.all(this.#bookmarkIds.map(async (id) =>
      {
        const [node] = await chrome.bookmarks.get(id);
        return node;
      }));

      this.#originalLocations = nodes
        .filter((node): node is chrome.bookmarks.BookmarkTreeNode =>
          !!node && !!node.parentId && node.index !== undefined)
        .map(node => ({ id: node.id, parentId: node.parentId!, index: node.index! }));
    }

    await runBatchOperation(async () =>
    {
      const folder = await chrome.bookmarks.create({
        parentId: this.#targetParentId,
        title: this.#title,
      });
      this.#createdFolderId = folder.id;

      // 按选中顺序移动，确保新文件夹中的顺序与侧边栏选择顺序一致。
      for (let index = 0; index < this.#bookmarkIds.length; index++)
      {
        const bookmarkId = this.#bookmarkIds[index];
        await chrome.bookmarks.move(bookmarkId, { parentId: folder.id, index });
        await this.#onBookmarkMoved?.(bookmarkId, folder.id);
      }

      this.#onFolderCreated?.(folder.id);
    });
  }

  async undo(): Promise<void>
  {
    if (!this.#createdFolderId) return;

    await runBatchOperation(async () =>
    {
      // 同一父目录按原 index 升序恢复，避免前面的移动改变后续插入位置。
      const locations = [...this.#originalLocations].sort((a, b) =>
      {
        if (a.parentId !== b.parentId) return a.parentId.localeCompare(b.parentId);
        return a.index - b.index;
      });

      for (const location of locations)
      {
        await chrome.bookmarks.move(location.id, {
          parentId: location.parentId,
          index: location.index,
        });
        await this.#onBookmarkMoved?.(location.id, location.parentId);
      }

      await chrome.bookmarks.removeTree(this.#createdFolderId!);
      this.#createdFolderId = null;
    });
  }
}
