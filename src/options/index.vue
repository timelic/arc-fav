<script setup lang="ts">
// @ts-ignore
import IconMore from '~icons/fluent/more-vertical-28-regular';
import { NMenu, type MenuOption, NMessageProvider } from 'naive-ui';
import { onMounted } from 'vue';

const favicon = (pageUrl: string, size: number = 24) => {
  const url = new URL(`chrome-extension://${chrome.runtime.id}/_favicon/`);
  url.searchParams.append('pageUrl', pageUrl);
  url.searchParams.append('size', size.toString());

  return url.href;
};
// console.log(favicon('https://www.google.com'));
</script>

<template>
  <n-message-provider>
    <Header />
    <main>
      <div id="content">
        <div class="content-top">
          <span class="text-bookmarks">Bookmarks</span>
          <IconMore />
        </div>
        <div class="menu">
          <Tree />
        </div>
      </div></main
  ></n-message-provider>
</template>

<style scoped lang="scss">
main {
  background-color: #f3f5f7;
  height: calc(100vh - var(--header-height));
  overflow: hidden;
  display: flex;
  justify-content: center;
  padding-top: 30px;
}
#content {
  width: var(--content-width);
  background-color: #ebeef1;
  padding: 20px 35px;
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
    }
  }
  .menu {
    background-color: white;
  }
}
</style>
