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
    v-if="src"
  />
  <span v-else />
</template>
