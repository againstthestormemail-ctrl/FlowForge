import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: 'src',
  publicDir: '../public',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        app: resolve(__dirname, 'src/index.html'),
        admin: resolve(__dirname, 'admin/index.html'),
        marketing: resolve(__dirname, 'marketing/index.html')
      }
    }
  },
  server: { port: 3000 }
});
