import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import dts from 'vite-plugin-dts'

// Builds the installable package from src/index.ts — separate from vite.config.ts, which
// builds the dev playground app (src/main.ts + App.vue). Never merge these: the playground
// is an app build (HTML entry, no external vue), this is a library build (no HTML, vue
// externalized so consumers use their own copy).
export default defineConfig({
  plugins: [
    vue(),
    dts({
      tsconfigPath: './tsconfig.app.json',
      include: ['src/**/*.ts', 'src/**/*.vue'],
      exclude: [
        'src/App.vue',
        'src/main.ts',
        'src/playground/**/*',
      ],
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  // Not an app build — there's no HTML entry to serve public/ assets for, and
  // vite copies publicDir into outDir by default even in library mode.
  publicDir: false,
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    lib: {
      entry: fileURLToPath(new URL('./src/index.ts', import.meta.url)),
      name: 'EzForm',
      fileName: (format) => `ez-form.${format === 'es' ? 'mjs' : 'cjs'}`,
      formats: ['es', 'cjs'],
    },
    rollupOptions: {
      external: ['vue'],
      output: {
        globals: { vue: 'Vue' },
      },
    },
  },
})
