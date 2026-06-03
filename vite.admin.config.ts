import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, type Plugin } from 'vite';

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

/** Serve admin SPA at http://localhost:3001/ (project root stays default for correct /src paths). */
function serveAdminAtRoot(): Plugin {
  return {
    name: 'serve-admin-at-root',
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        const url = req.url?.split('?')[0] ?? '';
        if (url === '/' || url === '/index.html') {
          const qs = req.url?.includes('?') ? '?' + req.url.split('?').slice(1).join('?') : '';
          req.url = '/admin/index.html' + qs;
        }
        next();
      });
    },
  };
}

export default defineConfig({
  root: projectRoot,
  plugins: [react(), tailwindcss(), serveAdminAtRoot()],
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
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist-admin',
    emptyOutDir: true,
    rollupOptions: {
      input: path.resolve(projectRoot, 'admin/index.html'),
    },
  },
});
