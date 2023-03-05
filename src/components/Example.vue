<template>
  <n-tree
    block-line
    checkable
    draggable
    :data="data"
    :checked-keys="checkedKeys"
    :expanded-keys="expandedKeys"
    @drop="handleDrop"
    @update:checked-keys="handleCheckedKeysChange"
    @update:expanded-keys="handleExpandedKeysChange"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { repeat } from 'seemly';
import { NTree, TreeOption, TreeDropInfo } from 'naive-ui';

function createData(level = 4, baseKey = ''): TreeOption[] | undefined {
  if (!level) return undefined;
  return repeat(6 - level, undefined).map((_, index) => {
    const key = '' + baseKey + level + index;
    return {
      label: createLabel(level),
      key,
      children: createData(level - 1, key),
    };
  });
}

function createLabel(level: number): string {
  if (level === 4) return '道生一';
  if (level === 3) return '一生二';
  if (level === 2) return '二生三';
  if (level === 1) return '三生万物';
  return '';
}

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

const expandedKeys = ref<string[]>([]);
const checkedKeys = ref<string[]>([]);
const data = ref(createData() || []);

function handleExpandedKeysChange(_expandedKeys: string[]) {
  expandedKeys.value = _expandedKeys;
}

function handleCheckedKeysChange(_checkedKeys: string[]) {
  checkedKeys.value = _checkedKeys;
}

function handleDrop({ node, dragNode, dropPosition }: TreeDropInfo) {
  const [dragNodeSiblings, dragNodeIndex] = findSiblingsAndIndex(
    dragNode,
    data.value
  );
  if (dragNodeSiblings === null || dragNodeIndex === null) return;
  dragNodeSiblings.splice(dragNodeIndex, 1);
  if (dropPosition === 'inside') {
    if (node.children) {
      node.children.unshift(dragNode);
    } else {
      node.children = [dragNode];
    }
  } else if (dropPosition === 'before') {
    const [nodeSiblings, nodeIndex] = findSiblingsAndIndex(node, data.value);
    if (nodeSiblings === null || nodeIndex === null) return;
    nodeSiblings.splice(nodeIndex, 0, dragNode);
  } else if (dropPosition === 'after') {
    const [nodeSiblings, nodeIndex] = findSiblingsAndIndex(node, data.value);
    if (nodeSiblings === null || nodeIndex === null) return;
    nodeSiblings.splice(nodeIndex + 1, 0, dragNode);
  }
  data.value = Array.from(data.value);
}
</script>
