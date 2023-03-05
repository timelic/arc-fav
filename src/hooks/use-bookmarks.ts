export type Bookmark = {
  id?: string; // 新的当然没有id
  title: string;
  url: string | undefined;
  parentId?: string | undefined;
  isFolder: boolean;
};

function convert(bookmark: Bookmark): chrome.bookmarks.BookmarkTreeNode {
  return {
    id: bookmark.id ?? '',
    title: bookmark.title,
    url: bookmark.url,
    parentId: bookmark.parentId,
    children: bookmark.isFolder ? [] : undefined,
  };
}

export function useBookmarks() {
  async function removeBookmark(id: string) {
    const bookmarks = await getBookmarks();
    // 查找这个node
    function find(
      bookmarks: chrome.bookmarks.BookmarkTreeNode[],
      id: string
    ): chrome.bookmarks.BookmarkTreeNode | undefined {
      for (const bookmark of bookmarks) {
        if (bookmark.id === id) {
          return bookmark;
        }
        if (bookmark.children) {
          const result = find(bookmark.children, id);
          if (result) {
            return result;
          }
        }
      }
    }
    const node = find(bookmarks, id);

    // 递归删除它的所有子节点 最后删除它本身
    async function remove(bookmark: chrome.bookmarks.BookmarkTreeNode) {
      if (bookmark.children) {
        for (const child of bookmark.children) {
          await remove(child);
        }
      }
      await chrome.bookmarks.remove(bookmark.id!);
    }
    await remove(node!);
  }
  async function getBookmarks() {
    const bookmarks = await chrome.bookmarks.getTree();
    return bookmarks[0].children!;
  }
  return {
    getBookmarks,
    createBookmark: chrome.bookmarks.create,
    deleteBookmark: removeBookmark,
    updateBookmark: chrome.bookmarks.update,
    moveBookmark: async (id: string, parentId: string, index: number) => {
      await chrome.bookmarks.move(id, {
        parentId,
        index,
      });
    },
  };
}
