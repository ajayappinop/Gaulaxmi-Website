import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';

const projectRoot = path.dirname(fileURLToPath(import.meta.url));
const adminEntry = path.resolve(projectRoot, 'admin.html');

/** Serve admin SPA at http://localhost:3001/ */
function serveAdminAtRoot(): Plugin {
  return {
    name: 'serve-admin-at-root',
    configureServer(server) {
      server.middlewares.use(rewriteAdminRoot);
    },
    configurePreviewServer(server) {
      server.middlewares.use(rewriteAdminRoot);
    },
  };
}

function rewriteAdminRoot(
  req: { url?: string },
  _res: unknown,
  next: () => void
): void {
  const url = req.url?.split('?')[0] ?? '';

  if (url === '/' || url === '/index.html') {
    const qs = req.url?.includes('?')
      ? '?' + req.url.split('?').slice(1).join('?')
      : '';

    req.url = '/admin.html' + qs;
  }

  next();
}

/** Rename dist-admin/admin.html -> dist-admin/index.html after build */
function renameAdminHtml(): Plugin {
  return {
    name: 'rename-admin-html',
    closeBundle() {
      const adminHtml = path.resolve(projectRoot, 'dist-admin/admin.html');
      const indexHtml = path.resolve(projectRoot, 'dist-admin/index.html');

      if (fs.existsSync(adminHtml)) {
        fs.renameSync(adminHtml, indexHtml);
        console.log('✓ Renamed admin.html -> index.html');
      }
    },
  };
}

export default defineConfig({
  root: projectRoot,
  cacheDir: 'node_modules/.vite-admin',
  envDir: projectRoot,

  optimizeDeps: {
    entries: [adminEntry],
  },

  plugins: [
    react(),
    tailwindcss(),
    serveAdminAtRoot(),
    renameAdminHtml(),
  ],

  resolve: {
    alias: {
      '@': projectRoot,
    },
  },

  server: {
    port: 3001,
    host: true,
    open: '/',
    strictPort: true,

    watch: {
      ignored: [
        '**/server/**',
        '**/.env',
        '**/.env.*',
        '**/server/data/**',
        '**/dist/**',
        '**/dist-admin/**',
        '**/index.html',
        '**/vite.config.ts',
      ],
    },

    proxy: {
      '/api': {
        target: 'http://127.0.0.1:4000',
        changeOrigin: true,
        secure: false,
      },
    },
  },

  preview: {
    port: 3001,
    host: true,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:4000',
        changeOrigin: true,
        secure: false,
      },
    },
  },

  build: {
    outDir: 'dist-admin',
    emptyOutDir: true,

    rollupOptions: {
      input: {
        main: path.resolve(projectRoot, 'admin.html'),
      },

      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
  },
});
