<script lang="ts" setup>
import { NImage } from 'naive-ui';
import { withDefaults } from 'vue';

withDefaults(
  defineProps<{
    src: string;
  }>(),
  {
    src: '',
  }
);
</script>

<template>
  <n-image
    :src="src"
    style="border-radius: 4px"
    v-if="src"
  />
  <span v-else>loading...</span>
</template>
