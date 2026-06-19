import { resolve } from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, externalizeDepsPlugin } from 'electron-vite';

const root = import.meta.dirname;

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    resolve: { alias: { '@shared': resolve(root, 'src/shared') } },
    build: { rollupOptions: { input: resolve(root, 'src/main/index.ts') } },
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    resolve: { alias: { '@shared': resolve(root, 'src/shared') } },
    build: { rollupOptions: { input: resolve(root, 'src/preload/index.ts') } },
  },
  renderer: {
    root: resolve(root, 'src/renderer'),
    resolve: {
      alias: {
        '@renderer': resolve(root, 'src/renderer/src'),
        '@shared': resolve(root, 'src/shared'),
      },
    },
    plugins: [react(), tailwindcss()],
    build: { rollupOptions: { input: resolve(root, 'src/renderer/index.html') } },
  },
});
