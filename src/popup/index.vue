<script setup lang="ts">
import { useBookmarks } from '../hooks';
import {
  NButton,
  NTree,
  type TreeOption,
  createDiscreteApi,
  NIcon,
} from 'naive-ui';
// @ts-ignore
import Folder from '~icons/mdi/folder-outline';

const { createBookmark } = useBookmarks();

const selected = ref<string>('2');

const { message } = createDiscreteApi(['message']);

function handleUpdateValue(
  value: string | number | Array<string | number> | null,
  option: TreeOption | null | Array<TreeOption | null>
) {
  selected.value = value?.toString() ?? '';
  chrome.storage.local.set({ [SELECTED_FOLDER]: selected.value });
}

function convert(
  bookmarkTreeNodes: chrome.bookmarks.BookmarkTreeNode[]
): TreeOption[] {
  const TreeOptions: TreeOption[] = [];

  bookmarkTreeNodes.forEach((node) => {
    if (node?.children) {
      const childrenNodes = convert(node.children);
      const treeOption: TreeOption = {
        key: node.id,
        label: node.title,
        children: node?.children.some((c) => c?.children)
          ? childrenNodes
          : undefined,
        // 判断它能不能被展开（有无子文件夹）
        prefix: () =>
          h(NIcon, null, {
            default: () => h(Folder),
          }),
      };
      TreeOptions.push(treeOption);
    }
  });

  return TreeOptions;
}

const SELECTED_FOLDER = 'SELECTED_FOLDER';

const options: Ref<TreeOption[]> = ref([]);
chrome.bookmarks.getTree(async (bookmarkTreeNodes) => {
  options.value = convert(bookmarkTreeNodes)[0].children!;
  selected.value =
    (await chrome.storage.local.get(SELECTED_FOLDER))[SELECTED_FOLDER] ??
    options.value![0].key?.toString() ??
    '';
});

async function addBookmark() {
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const tabId = tabs[0].id ?? 0;
    const tab = await chrome.tabs.get(tabId);
    await createBookmark({
      parentId: selected.value,
      title: tab.title,
      url: tab.url,
    });
    message.success('收藏成功');
  } catch (error) {
    message.error('收藏失败');
  }
}
</script>

<template>
  <div class="container">
    <!-- <div class="title-fav text-bookmarks">Add to fav</div> -->
    <div class="tree-wrap">
      <n-tree
        :data="options"
        default-expand-all
        :default-selected-keys="['1']"
        expand-on-click
        check-on-click
        @update:selected-keys="handleUpdateValue"
        show-line
      />
    </div>
    <button
      @click="addBookmark"
      class="macos-button btn-fav"
    >
      Add
    </button>
  </div>
</template>

<style scoped></style>
