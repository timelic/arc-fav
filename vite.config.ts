import { crx } from '@crxjs/vite-plugin';
import vue from '@vitejs/plugin-vue';
import { dirname, relative } from 'path';
import AutoImport from 'unplugin-auto-import/vite';
import IconsResolver from 'unplugin-icons/resolver';
import Icons from 'unplugin-icons/vite';
import Components from 'unplugin-vue-components/vite';
import { defineConfig } from 'vite';
import manifest from './manifest.json';
import tsconfigPaths from 'vite-tsconfig-paths';
import hotReloadExtension from 'hot-reload-extension-vite';

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      '~/': 'src/',
      hooks: '~/hooks',
    },
  },
  base: '',
  plugins: [
    hotReloadExtension({
      log: true,
      backgroundPath: 'src/background/index.ts' // src/pages/background/index.ts
    }),
    vue(),
    // @ts-ignore
    crx({ manifest }),

    AutoImport({
      imports: ['vue', { 'webext-bridge': ['sendMessage', 'onMessage'] }],
      dts: 'src/auto-imports.d.ts',
    }),

    // https://github.com/antfu/unplugin-vue-components
    Components({
      dirs: ['src/components'],
      // generate `components.d.ts` for ts support with Volar
      dts: 'src/components.d.ts',
      resolvers: [
        // auto import icons
        IconsResolver({
          prefix: 'icon',
          enabledCollections: ['mdi'],
        }),
      ],
    }),

    // https://github.com/antfu/unplugin-icons
    Icons({
      // experimental
      autoInstall: true,
    }),

    // rewrite assets to use relative path
    {
      name: 'assets-rewrite',
      enforce: 'post',
      apply: 'build',
      transformIndexHtml(html, { path }) {
        return html.replace(
          /"\/assets\//g,
          `"${relative(dirname(path), '/assets')}/`
        );
      },
    },
  ],
  server: {
    hmr: {
      overlay: false,
    },
  },
  optimizeDeps: {
    include: ['vue', '@vueuse/core'],
    exclude: ['vue-demi'],
  },
});
