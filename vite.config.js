import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// base: './' เพื่อให้ deploy ได้ทั้ง root และ subpath (GitHub Pages ฯลฯ)
export default defineConfig({
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate', // อัปเดต service worker อัตโนมัติเมื่อ deploy ใหม่
      includeAssets: ['favicon.ico', 'apple-touch-icon-180x180.png', 'logo.svg'],
      manifest: {
        name: 'SAPIENS TUTOR — คำนวณโอกาสติดคณะ TCAS',
        short_name: 'SAPIENS TCAS',
        description: 'คำนวณโอกาสติดคณะ TCAS จากข้อมูลคะแนนจริง mytcas.com',
        lang: 'th',
        theme_color: '#921b1b',
        background_color: '#921b1b',
        display: 'standalone',
        orientation: 'portrait',
        // base เป็น './' (relative) → scope/start_url ใช้ '.' เพื่อให้ทำงานได้ทั้ง root และ subpath
        scope: '.',
        start_url: '.',
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // precache app shell (js/css/html/icons) — ไม่รวม programs.json (ใหญ่ 9.4MB)
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        navigateFallback: 'index.html',
        runtimeCaching: [
          {
            // ข้อมูลหลักสูตร: ลองเน็ตก่อนเสมอ (ได้ข้อมูลล่าสุดตั้งแต่โหลดรอบแรก) — ถ้าเน็ตช้า/ล่ม
            // เกิน 4 วิ ค่อย fallback ไป cache (ยังใช้ offline ได้หลังเปิดครั้งแรก)
            urlPattern: ({ url }) => url.pathname.includes('/data/') && url.pathname.endsWith('.json'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'tcas-data',
              networkTimeoutSeconds: 4,
              expiration: { maxEntries: 8, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: ({ url }) => url.origin === 'https://fonts.googleapis.com',
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'google-fonts-stylesheets' },
          },
          {
            urlPattern: ({ url }) => url.origin === 'https://fonts.gstatic.com',
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: { maxEntries: 16, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  server: { port: 5173, open: true },
});
