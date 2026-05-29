import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['icons/*.png', 'sounds/*.wav'],
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,wav}'],
        runtimeCaching: [
          {
            urlPattern: /^https?:\/\/localhost:3001\/api\/quotes\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'quotes-cache',
              expiration: { maxEntries: 50, maxAgeSeconds: 86400 },
            },
          },
        ],
      },
      manifest: {
        name: 'SAT - 智能时间调配',
        short_name: 'SAT',
        description: 'AI 驱动的智能时间管理助手',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        theme_color: '#1E40AF',
        background_color: '#FFFFFF',
        categories: ['productivity', 'utilities'],
        icons: [
          { src: '/icons/icon-72x72.png', sizes: '72x72', type: 'image/png' },
          { src: '/icons/icon-96x96.png', sizes: '96x96', type: 'image/png' },
          { src: '/icons/icon-128x128.png', sizes: '128x128', type: 'image/png' },
          { src: '/icons/icon-144x144.png', sizes: '144x144', type: 'image/png' },
          { src: '/icons/icon-152x152.png', sizes: '152x152', type: 'image/png' },
          { src: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-384x384.png', sizes: '384x384', type: 'image/png' },
          { src: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/icons/maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        shortcuts: [
          { name: '今日任务', url: '/', description: '查看今日计划' },
          { name: '新建计划', url: '/setup', description: '创建新计划' },
          { name: '拍照打卡', url: '/photo', description: '完成每日拍照打卡' },
        ],
      },
    }),
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
    host: true,
  },
});
