<script setup lang="ts">
// @ts-ignore
import IconAccountBox from '~icons/fluent/search-32-regular'
</script>

<template>
  <header>
    <div class="main">
      <img
        class="logo"
        src="/logo.png"
      />
      <div class="search">
        <IconAccountBox class="search-icon" />
        <input
          type="text"
          autocomplete="off"
          class="search__input js__search-input o__ltr"
          placeholder="Search for articles..."
        />
      </div>
    </div>
  </header>
</template>

<style scoped lang="scss">
header {
  background-color: #3036e9;
  height: var(--header-height);
  width: 100%;
  position: relative;
  padding: 0 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.main {
  max-width: var(--content-width);
  flex: 1;
  z-index: 3;
  display: flex;
  align-items: center;
  column-gap: 15px;
  .logo {
    width: fit-content;
    max-height: 35px;
    vertical-align: baseline;
    -webkit-backface-visibility: hidden;
    backface-visibility: hidden;
    overflow: hidden;
  }
  .search {
    width: 100%;
    height: 48px;
    background-color: #ffffff41;
    border-radius: 3px;
    display: flex;
    align-items: center;
    column-gap: 16px;
    padding: 20px;
    .search-icon {
      width: 24px;
      height: 24px;
      color: #ffffff;
    }
    input {
      font-size: 16px;
      background-color: transparent;
      color: white;
      &::placeholder {
        color: #ffffff8b;
      }
    }
  }
}
</style>
