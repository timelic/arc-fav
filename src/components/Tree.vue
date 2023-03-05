<template>
  <n-tree
    block-line
    :checkable="true"
    check-on-click
    expand-on-click
    draggable
    :data="data"
    :checked-keys="checkedKeys"
    v-model:expanded-keys="expandedKeys"
    :selectable="false"
    @drop="handleDrop"
    @update:checked-keys="handleCheckedKeysChange"
    @update:expanded-keys="handleExpandedKeysChange"
    :node-props="nodeProps"
    :class="`tree--${mode} tree`"
  />
  <!-- 右键菜单 -->
  <n-dropdown
    trigger="manual"
    placement="bottom-start"
    :show="showDropdown"
    :options="(options as any)"
    :x="x"
    :y="y"
    @select="handleSelect"
    @clickoutside="handleClickoutside"
  />
  <!-- 模态框 -->
  <n-modal
    ref="formRef"
    v-model:show="showModal"
    preset="dialog"
    title="确认"
    positive-text="确认"
    negative-text="算了"
    @positive-click="submitCallback"
    :rules="rules"
  >
    <template #default>
      <n-form
        ref="formRef"
        :model="modal"
        :style="{
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          margin: '20px 0',
        }"
        v-if="currentAction !== 'delete'"
      >
        <n-form-item
          path="title"
          label="名称"
        >
          <n-input
            v-model:value="modal.title"
            @keydown.enter.prevent
          />
        </n-form-item>
        <n-form-item
          path="title"
          label="网址"
          v-if="showUrlInput"
          :validation-status="urlStatus"
          :feedback="urlFeedback"
        >
          <n-input
            v-model:value="modal.url"
            @keydown.enter.prevent
          />
        </n-form-item>
      </n-form>
      <span v-else>确认删除？</span>
    </template>
  </n-modal>
</template>

<script setup lang="ts">
import { ref, computed, withDefaults } from 'vue';
import { repeat } from 'seemly';
import {
  NTree,
  NDropdown,
  NModal,
  NForm,
  NInput,
  NFormItem,
  type TreeOption,
  TreeDropInfo,
  type DropdownOption,
  FormInst,
  useMessage,
  NIcon,
} from 'naive-ui';
import { type Key } from 'naive-ui/es/tree/src/interface';
import { useBookmarks, type Bookmark } from 'hooks';
// @ts-ignore
import Folder from '~icons/mdi/folder-outline';
// @ts-ignore
import FolderOpen from '~icons/mdi/folder-open-outline';

withDefaults(
  defineProps<{
    mode: 'click' | 'edit';
  }>(),
  {
    mode: 'click',
  }
);

const message = useMessage();

const {
  getBookmarks,
  moveBookmark,
  updateBookmark,
  deleteBookmark,
  createBookmark,
} = useBookmarks();

function convertToTreeOption(
  bookmark: chrome.bookmarks.BookmarkTreeNode
): TreeOption {
  const key = bookmark.id.toString();
  const treeOption: TreeOption = {
    key,
    label: bookmark.title, // TODO 先看看
    isLeaf: !bookmark.children,
    url: bookmark.url,
    prefix: !bookmark.url
      ? () =>
          h(
            NIcon,
            {
              size: '18px',
            },
            {
              default: () =>
                h(expandedKeys.value.includes(key) ? FolderOpen : Folder),
            }
          )
      : undefined,
  };
  if (bookmark.children) {
    treeOption.children = bookmark.children.map((child) =>
      convertToTreeOption(child)
    );
  }
  return treeOption;
}

/**
 * 递归转换书签数据
 */
function convert(bookmarks: chrome.bookmarks.BookmarkTreeNode[]): TreeOption[] {
  return bookmarks.map((x) => convertToTreeOption(x));
}

/**
 * 书签数据
 */
const data: Ref<TreeOption[]> = ref<TreeOption[]>([]) as any;
const expandedKeys = ref<Key[]>([]);
const checkedKeys = ref<Key[]>([]);

async function refreshData() {
  data.value = convert(await getBookmarks());
  console.log('data refreshed', data.value);
}

/*
 * 获取基础的书签数据
 */
(async () => {
  await refreshData();
  // console.log('data', data.value);
  // 默认展开第一层
  expandedKeys.value = data.value?.map((x) => x.key!) || [];
})();

function findSiblingsAndIndex(
  node: TreeOption,
  nodes?: TreeOption[]
): [TreeOption[], number] | [null, null] {
  if (!nodes) return [null, null];
  for (let i = 0; i < nodes.length; ++i) {
    const siblingNode = nodes[i];
    if (siblingNode.key === node.key) return [nodes, i];
    const [siblings, index] = findSiblingsAndIndex(node, siblingNode.children);
    if (siblings && index !== null) return [siblings, index];
  }
  return [null, null];
}

function handleExpandedKeysChange(_expandedKeys: string[]) {
  expandedKeys.value = _expandedKeys;
}

// 以后要根据能拖动与否来使用这个方法...
async function handleCheckedKeysChange(_checkedKeys: string[]) {
  if (_checkedKeys.length < 1) {
    return;
  }
  const key = _checkedKeys[0];
  function helper(tree: TreeOption[], key: string): string {
    for (let i = 0; i < tree.length; i++) {
      const item = tree[i];
      if (item.key === key) {
        if (item.isLeaf) {
          return (item as any).url || '';
        } else {
          return '';
        }
      }
      if (item.children) {
        const label = helper(item.children, key);
        if (label) {
          return label;
        }
      }
    }

    checkedKeys.value = [];
    return '';
  }
  const url = helper(data.value, key);
  if (url) {
    // chrome.tabs.create({ url });
    window.open(url);
  }
  await refreshData();
}

async function handleDrop({ node, dragNode, dropPosition }: TreeDropInfo) {
  const [dragNodeSiblings, dragNodeIndex] = findSiblingsAndIndex(
    dragNode,
    data.value
  );
  if (dragNodeSiblings === null || dragNodeIndex === null) return;
  if (dropPosition === 'inside') {
    moveBookmark(dragNode.key as string, node.key as string, 0);
  } else {
    const [nodeSiblings, nodeIndex] = findSiblingsAndIndex(node, data.value);
    if (nodeSiblings === null || nodeIndex === null) return;
    const newIndex = nodeIndex + (dropPosition === 'after' ? 1 : 0);
    // 获取它的父母
    const parentKey = getParentKey(data.value, node.key ?? '');
    if (parentKey) {
      moveBookmark(dragNode.key as string, parentKey, newIndex);
    }
  }
  await refreshData();
}

function getParentKey(data: TreeOption[], key: Key): string | null {
  const stack = [...data]; // Initialize a stack with the root nodes
  while (stack.length) {
    const node = stack.pop()!;
    if (node.children) {
      for (let i = 0; i < node.children.length; i++) {
        const child = node.children[i];
        if (child.key === key) {
          return (node.key as string) ?? null;
        }
        stack.push(child); // Add the child nodes to the stack
      }
    }
  }
  // If the key is not found in the tree, return null
  return null;
}

// Region 右键菜单
const showDropdown: Ref<boolean> = ref(false);
const currentSelectKey: Ref<string> = ref('');
const currentSelectNode = computed(() => {
  // 递归查找
  function helper(tree: TreeOption[], key: string): TreeOption | null {
    for (let i = 0; i < tree.length; i++) {
      const item = tree[i];
      if (item.key === key) {
        return item;
      }
      if (item.children) {
        const label = helper(item.children, key);
        if (label) {
          return label;
        }
      }
    }
    return null;
  }
  return helper(data.value, currentSelectKey.value);
});
const options: Ref<DropdownOption[]> = computed(() => [
  {
    label: '新窗口打开',
    key: 'openInNewWindow',
    disabled: currentIsFolder.value,
  },
  {
    label: '编辑',
    key: 'edit',
    disabled: isRootKey(currentSelectKey.value),
  },
  {
    label: '删除',
    key: 'delete',
    disabled: isRootKey(currentSelectKey.value),
  },
  {
    label: '新建文件夹',
    key: 'newFolder',
  },
  {
    label: '新建书签',
    key: 'newBookmark',
  },
]);

const currentIsFolder = computed(() => {
  if (currentSelectNode.value) {
    return !currentSelectNode.value.isLeaf;
  }
  return false;
});

type Action =
  | 'edit'
  | 'delete'
  | 'newFolder'
  | 'newBookmark'
  | 'openInNewWindow';
const currentAction: Ref<Action> = ref('edit');
const x: Ref<number> = ref(0);
const y: Ref<number> = ref(0);

function isRootKey(key: string): boolean {
  return data.value?.some((x) => x.key === key) ?? false;
}

function handleSelect(key: Action): void {
  showDropdown.value = false;

  if (key === 'openInNewWindow') {
    if (currentSelectNode.value) {
      chrome.tabs.create({ url: currentSelectNode.value.url as string });
    }
    return;
  }

  modal.value.title = '';
  modal.value.url = '';

  currentAction.value = key;
  showModal.value = true;
  switch (key) {
    case 'edit':
      if (currentSelectNode.value) {
        modal.value.title = currentSelectNode.value.label ?? '';
        modal.value.url = currentSelectNode.value.url as string;
      }
      break;
    case 'delete':
      break;
    default:
      break;
  }
}

function handleClickoutside(): void {
  showDropdown.value = false;
  clearSelected();
}

function nodeProps({
  option,
}: {
  option: TreeOption;
}): Record<string, unknown> {
  return {
    onContextmenu(e: MouseEvent): void {
      console.log('onContextmenu', e);
      currentSelectKey.value = option.key as string;
      showDropdown.value = true;
      x.value = e.clientX;
      y.value = e.clientY;
      e.preventDefault();
      let nodeElement = e.target as HTMLElement;
      // 往上找父节点
      while (nodeElement && !nodeElement.classList.contains('n-tree-node')) {
        nodeElement = nodeElement.parentElement as HTMLElement;
      }
      console.log(nodeElement);
      currentSelectDomElement.value = nodeElement;
    },
  };
}

const currentSelectDomElement = ref<HTMLElement>();
watch(
  currentSelectDomElement,
  (newValue, oldValue) => {
    if (oldValue) {
      oldValue.classList.remove('n-tree-node-selected');
    }
    if (newValue) {
      newValue.classList.add('n-tree-node-selected');
    }
  },
  { immediate: true }
);
function clearSelected() {
  if (currentSelectDomElement.value) {
    currentSelectDomElement.value.classList.remove('n-tree-node-selected');
  }
}
// End Region 右键菜单

// Region 模态框
const formRef = ref<FormInst | null>(null);
const showModal = ref(false);
const modal = ref({
  title: '',
  url: '',
});
const rules = {
  url: {
    required: true,
    message: '请输入完整的网址',
    trigger: ['input', 'blur'],
  },
};

function createStatus(value: string) {
  // 用正则来判断 如果是网址 返回undefined
  if (/^https?:\/\/.*/.test(value)) {
    return undefined;
  }
  return 'error';
}

const urlStatus = computed(() => createStatus(modal.value.url));

function createFeedback(value: string) {
  // 用正则来判断 如果是网址 返回undefined
  if (/^https?:\/\/.*/.test(value)) {
    return undefined;
  }
  return '请输入完整的网址';
}

const urlFeedback = computed(() => createFeedback(modal.value.url));

async function submitCallback() {
  // 后面改成ref的验证
  if (
    currentAction.value !== 'delete' &&
    showUrlInput.value &&
    urlStatus.value === 'error' &&
    modal.value.title === ''
  ) {
    message.error('名字和网址均不可为空');
    return;
  }
  switch (currentAction.value) {
    case 'edit':
      if (currentSelectNode.value) {
        await updateBookmark(currentSelectNode.value.key as string, {
          title: modal.value.title,
          url: modal.value.url,
        });
      }
      break;
    case 'delete':
      if (currentSelectNode.value) {
        await deleteBookmark(currentSelectNode.value.key as string);
      }
      break;
    case 'newFolder':
      await create(modal.value.url);
      break;
    case 'newBookmark':
      await create(modal.value.url);
      break;
    default:
      break;
  }
  async function create(url: string) {
    // 如果当前是一个文件夹 那么直接建立在该文件夹的0号位 并且展开该文件夹
    let parentKey = '0';
    if (currentSelectNode.value!.url) {
      parentKey = getParentKey(data.value, currentSelectKey.value)!;
    } else {
      parentKey = currentSelectKey.value;
    }
    const [_, nodeIndex] = findSiblingsAndIndex(
      currentSelectNode.value!,
      data.value
    );
    await createBookmark({
      title: modal.value.title,
      parentId: parentKey,
      index: url ? nodeIndex! + 1 : undefined,
      url: url ? url : undefined,
    });
  }
  showModal.value = false;
  await refreshData();
}

const showUrlInput = computed(
  () =>
    currentAction.value == 'newBookmark' ||
    (currentAction.value == 'edit' && modal.value.url)
);

// End Region 模态框
</script>

<style scoped lang="scss">
.tree--click :deep(.n-tree-node-checkbox) {
  display: none !important;
}

:global(.n-button) {
  background-color: var(--n-color) !important;
}

:deep(.n-form-item .n-form-item-feedback-wrapper) {
  min-height: unset !important;
}

.n-tree :deep(.n-tree-node) {
  height: 34px !important;
  align-items: center;
  border-radius: 5px;
}
:global(.n-tree-node.n-tree-node-selected) {
  background-color: #e1ecff;
}
</style>
