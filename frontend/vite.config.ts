import process from 'node:process'

// import darkMode from '@kevinmarrec/vite-plugin-dark-mode';
import yaml from '@modyfi/vite-plugin-yaml'
import unhead from '@unhead/addons/vite'
// import unocss from '@unocss/vite';
import ui from '@nuxt/ui/vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
import { visualizer } from 'rollup-plugin-visualizer'
import { defineConfig } from 'vite'
import devtools from 'vite-plugin-vue-devtools'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig(({ command, mode }) => ({
  build: {
    modulePreload: {
      polyfill: false,
    },
    sourcemap: mode === 'analyze',
  },
  builder: {
    async buildApp(builder) {
      if (builder.config.mode === 'static') {
        const { build } = await import('vite-ssg/node');
        await build(builder.config.ssgOptions);
        process.exit(0);
      }

      await builder.build(builder.environments.client);
    },
  },
  plugins: [
    vue({
      features: {
        optionsAPI: command !== 'build',
      },
    }),
    ui({
      ui: {
        colors: {
          primary: 'purple',
          neutral: 'slate'
        }
      },
      autoImport:{
        imports: ['vue', 'vue-router', '@vueuse/core'],
        dirs:['./src/stores', './src/composables']
      }
    }),
    yaml(),
    // darkMode(),
    // unocss(),
    unhead(),
    tsconfigPaths(),
    devtools({
      componentInspector: {
        toggleComboKey: 'alt-s',
      },
    }),
    mode === 'analyze' && visualizer({
      filename: 'node_modules/.vite/stats.html',
      brotliSize: true,
      gzipSize: true,
      open: true,
      sourcemap: true,
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@libs': fileURLToPath(new URL('../libs', import.meta.url)),
      '@sdk': fileURLToPath(
        new URL('./node_modules/core-sdk', import.meta.url)
      ),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:6001',
        changeOrigin: true,
      },
    },
  },
  ssgOptions: {
    script: 'async',
    formatting: 'minify',
    beastiesOptions: {
      reduceInlineStyles: false,
    },
  },
  ssr: {
    noExternal: ['@kevinmarrec/vue-i18n'],
  },
}));
