<script setup lang="ts">
import { useBookmarks } from '../hooks';
import {
  NMessageProvider,
  type TreeSelectOption,
  NTreeSelect,
  NButton,
} from 'naive-ui';

const { createBookmark } = useBookmarks();

const selected = ref<string>('2');

function handleUpdateValue(
  value: string | number | Array<string | number> | null,
  option: TreeSelectOption | null | Array<TreeSelectOption | null>
) {
  selected.value = value?.toString() ?? '';
  chrome.storage.local.set({ [SELECTED_FOLDER]: selected.value });
}

function convert(
  bookmarkTreeNodes: chrome.bookmarks.BookmarkTreeNode[]
): TreeSelectOption[] {
  const treeSelectOptions: TreeSelectOption[] = [];

  bookmarkTreeNodes.forEach((node) => {
    if (node?.children?.some((child) => child.children)) {
      const childrenNodes = convert(node.children);
      const treeOption: TreeSelectOption = {
        key: node.id,
        label: node.title,
        children: childrenNodes,
      };
      treeSelectOptions.push(treeOption);
    } else {
      const treeOption: TreeSelectOption = {
        key: node.id,
        label: node.title,
      };
      treeSelectOptions.push(treeOption);
    }
  });

  return treeSelectOptions;
}

const SELECTED_FOLDER = 'SELECTED_FOLDER';

const options: Ref<TreeSelectOption[]> = ref([]);
chrome.bookmarks.getTree(async (bookmarkTreeNodes) => {
  options.value = convert(bookmarkTreeNodes)[0].children!;
  selected.value =
    (await chrome.storage.local.get(SELECTED_FOLDER))[SELECTED_FOLDER] ??
    options.value![0].key?.toString() ??
    '';
  console.log(selected.value);
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
  } catch (error) {}
}
</script>

<template>
  <n-message-provider>
    <n-button @click="addBookmark">收藏</n-button>
    <n-tree-select
      :options="options"
      :value="selected"
      @update:value="handleUpdateValue"
    />
  </n-message-provider>
</template>

<style scoped></style>
