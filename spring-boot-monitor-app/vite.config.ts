import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { vitePlugin as cartographer } from '@replit/vite-plugin-cartographer';
import { runtimeErrorModalPlugin } from '@replit/vite-plugin-runtime-error-modal';
import { tailwind } from '@tailwindcss/vite';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    runtimeErrorModalPlugin(),
    cartographer(),
    tailwind(),
  ],
  server: {
    hmr: {
      clientPort: 443,
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './client/src'),
      '@components': path.resolve(__dirname, './client/src/components'),
      '@assets': path.resolve(__dirname, './attached_assets'),
      '@lib': path.resolve(__dirname, './client/src/lib'),
      '@shared': path.resolve(__dirname, './shared'),
    },
  },
});