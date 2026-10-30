import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'suppress-vite8-ws-when-hmr-disabled',
        apply: 'serve',
        enforce: 'post',
        transformIndexHtml: {
          order: 'post',
          handler() {
            if (process.env.DISABLE_HMR !== 'true') {
              return [];
            }
            return [
              {
                tag: 'script',
                injectTo: 'head-prepend',
                children: `(function(){if('caches' in window){caches.keys().then(function(ks){ks.forEach(function(k){if(k==='oververse-v2'||k==='oververse-v3'||k==='oververse-v4'||k==='oververse-pwa-v5'||k==='oververse-pwa-v6'){caches.delete(k).catch(function(){});}});}).catch(function(){});}if('serviceWorker' in navigator){navigator.serviceWorker.getRegistrations().then(function(rs){rs.forEach(function(r){r.update().catch(function(){});});}).catch(function(){});}var W=window.WebSocket;if(typeof W==='function'){var P=function(u,p){var h=p==='vite-hmr'||p==='vite-ping'||(Array.isArray(p)&&(p.indexOf('vite-hmr')!==-1||p.indexOf('vite-ping')!==-1));if(h){var t=new EventTarget();Object.defineProperties(t,{url:{value:String(u),enumerable:true},protocol:{value:typeof p==='string'?p:(p&&p[0])||'',enumerable:true},readyState:{value:1,enumerable:true},bufferedAmount:{value:0,enumerable:true},extensions:{value:'',enumerable:true},binaryType:{value:'blob',writable:true,enumerable:true},CONNECTING:{value:0,enumerable:true},OPEN:{value:1,enumerable:true},CLOSING:{value:2,enumerable:true},CLOSED:{value:3,enumerable:true},send:{value:function(){}},close:{value:function(){}}});t.onopen=null;t.onmessage=null;t.onerror=null;t.onclose=null;return t;}return arguments.length>1?new W(u,p):new W(u);};P.prototype=W.prototype;P.CONNECTING=W.CONNECTING;P.OPEN=W.OPEN;P.CLOSING=W.CLOSING;P.CLOSED=W.CLOSED;window.WebSocket=P;}})();`,
              },
            ];
          },
        },
        transform(code, id) {
          if (
            process.env.DISABLE_HMR === 'true' &&
            id.includes('vite/dist/client/client.mjs')
          ) {
            return {
              code: code
                .replace(
                  'const createWebSocketModuleRunnerTransport = (options) => {',
                  'const createWebSocketModuleRunnerTransport = (_options) => ({ async connect() {}, async disconnect() {}, send() {} }); const _unusedCreateWsTransport = (options) => {'
                )
                .replace(
                  'console.debug("[vite] connecting...");',
                  '/* HMR disabled */'
                ),
              map: null,
            };
          }
        },
      },
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: false,
        manifestFilename: 'manifest.json',
        includeAssets: [
          'favicon.png',
          'apple-touch-icon.png',
          'icon.svg',
          'master-logo.png',
          'playstore-icon-512.png',
          'pwa-192x192.png',
          'pwa-512x512.png',
          'pwa-maskable-192x192.png',
          'pwa-maskable-512x512.png',
          'assets/aistudio/IMG-20261030-WA4361_fe49230b.jpg',
          'assets/aistudio/876507702_1790968748807516_1967466416315700542_n_aea98a38.webp',
        ],
        manifest: {
          id: '/',
          name: 'AZ OVERVERSE',
          short_name: 'AZ OVERVERSE',
          description:
            'AZ OVERVERSE: Next-generation manga publishing and reading platform. Read Left-to-Right manga chapters offline, support creators, and publish originals.',
          theme_color: '#000000',
          background_color: '#000000',
          display: 'standalone',
          orientation: 'portrait-primary',
          scope: '/',
          start_url: '/',
          lang: 'en',
          dir: 'ltr',
          categories: ['books', 'entertainment', 'comics'],
          prefer_related_applications: false,
          related_applications: [
            {
              platform: 'play',
              id: 'com.azoververse.app',
              url: 'https://play.google.com/store/apps/details?id=com.azoververse.app',
            },
          ],
          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-maskable-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'maskable',
            },
            {
              src: '/pwa-maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
          shortcuts: [
            {
              name: 'Favorites',
              short_name: 'Favorites',
              description: 'View your saved manga collection',
              url: '/?filter=favorites',
              icons: [{ src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' }],
            },
            {
              name: 'Creator Studio',
              short_name: 'Publish',
              description: 'Upload new manga chapters & view earnings',
              url: '/?action=creator_dashboard',
              icons: [{ src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' }],
            },
            {
              name: 'MOTY Awards',
              short_name: 'Awards',
              description: 'View Manga of the Year winners',
              url: '/?action=awards',
              icons: [{ src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' }],
            },
          ],
        },
        devOptions: {
          enabled: true,
          type: 'module',
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,jpg,jpeg,svg,webp,woff,woff2,json}'],
          globIgnores: ['**/*.aab', '**/*.apk', '**/*.keystore', '**/AZ-OVERVERSE-signed.aab'],
          maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
          cleanupOutdatedCaches: true,
          clientsClaim: true,
          skipWaiting: true,
          navigateFallbackDenylist: [
            /^\/api\//,
            /^\/__\//,
            /^\/\.well-known\//,
            /^\/@vite\//,
            /^\/@id\//,
            /^\/@fs\//,
            /^\/@react-refresh/,
            /^\/src\//,
            /^\/node_modules\//,
            /\.aab$/i,
            /\.apk$/i,
            /\.keystore$/i,
          ],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'oververse-google-fonts-css',
                expiration: {
                  maxEntries: 15,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'oververse-gstatic-fonts',
                expiration: {
                  maxEntries: 20,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: ({ request, url }) =>
                request.destination === 'image' ||
                /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i.test(url.pathname),
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'oververse-manga-images',
                expiration: {
                  maxEntries: 250,
                  maxAgeSeconds: 60 * 60 * 24 * 30,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^\/api\/.*/i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'oververse-api-cache',
                networkTimeoutSeconds: 5,
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 60 * 24,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
        },
      }),
      {
        name: 'dedupe-manifest-link',
        enforce: 'post',
        transformIndexHtml: {
          order: 'post',
          handler(html) {
            let seen = false;
            return html.replace(/<link\s+rel=["']manifest["'][^>]*>/gi, (match) => {
              if (!seen) {
                seen = true;
                return '<link rel="manifest" href="/manifest.json" />';
              }
              return '';
            });
          },
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '.'),
      },
    },
    build: {
      target: 'es2020',
      cssCodeSplit: true,
      chunkSizeWarningLimit: 900,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return undefined;
            if (id.includes('recharts') || id.includes('d3-')) {
              return 'vendor-charts';
            }
            if (id.includes('firebase') || id.includes('@firebase')) {
              return 'vendor-firebase';
            }
            if (id.includes('motion') || id.includes('framer-motion')) {
              return 'vendor-motion';
            }
            if (id.includes('lucide-react')) {
              return 'vendor-icons';
            }
            if (id.includes('@supabase')) {
              return 'vendor-supabase';
            }
            if (id.includes('react-dom') || id.includes('/react/') || id.includes('scheduler')) {
              return 'vendor-react';
            }
            return undefined;
          },
        },
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
