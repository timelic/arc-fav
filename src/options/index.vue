<script setup lang="ts">
// @ts-ignore
import IconMore from '~icons/fluent/more-vertical-28-regular';
import { NMessageProvider } from 'naive-ui';

const favicon = (pageUrl: string, size: number = 24) => {
  const url = new URL(`chrome-extension://${chrome.runtime.id}/_favicon/`);
  url.searchParams.append('pageUrl', pageUrl);
  url.searchParams.append('size', size.toString());

  return url.href;
};
const searchPattern = ref('');
</script>

<template>
  <n-message-provider>
    <Header v-model:value="searchPattern" />
    <main>
      <div id="content">
        <div class="content-top">
          <span class="text-bookmarks">Bookmarks</span>
          <IconMore />
        </div>
        <div class="menu">
          <Tree :pattern="searchPattern" />
        </div>
      </div></main
  ></n-message-provider>
</template>

<style scoped lang="scss">
main {
  background-color: #f3f5f7;
  height: calc(100vh - var(--header-height));
  overflow-x: hidden;
  overflow-y: overlay;
  display: flex;
  justify-content: center;
  padding-top: 10px;
  padding-bottom: 20px;
  &::-webkit-scrollbar {
    // position: absolute;
    // right: 0;
    // top: 0;
  }
}
#content {
  width: var(--content-width);
  background-color: transparent;
  padding: 20px 0;
  row-gap: 20px;
  display: flex;
  flex-direction: column;
  .content-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    .text-bookmarks {
      font-size: 26px;
      font-weight: 300;
      font-family: 'Oxanium', cursive;
    }
  }
  .menu {
    background-color: white;
    border-radius: 10px;
    padding: 20px;
    // height: 100%;
    // overflow-y: scroll;
  }
}
</style>
