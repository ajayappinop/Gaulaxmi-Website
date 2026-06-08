import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import {defineConfig} from 'vite';

const projectRoot = path.dirname(fileURLToPath(import.meta.url));
const memberEntry = path.resolve(projectRoot, 'index.html');

export default defineConfig({
  cacheDir: 'node_modules/.vite-member',
  envDir: projectRoot,
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': projectRoot,
    },
  },
  optimizeDeps: {
    entries: [memberEntry],
  },
  server: {
    port: 3000,
    strictPort: true,
    host: true,
    open: '/',
    watch: {
      ignored: [
        '**/server/**',
        '**/.env',
        '**/.env.*',
        '**/server/data/**',
        '**/dist/**',
        '**/dist-admin/**',
        '**/admin.html',
        '**/vite.admin.config.ts',
        '**/src/admin/**',
      ],
    },
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:4000',
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: 3000,
    host: true,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:4000',
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      input: path.resolve(projectRoot, 'index.html'),
    },
  },
});
