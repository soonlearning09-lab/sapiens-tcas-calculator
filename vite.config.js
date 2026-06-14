import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base: './' เพื่อให้ deploy ได้ทั้ง root และ subpath (GitHub Pages ฯลฯ)
export default defineConfig({
  base: './',
  plugins: [react()],
  server: { port: 5173, open: true },
});
