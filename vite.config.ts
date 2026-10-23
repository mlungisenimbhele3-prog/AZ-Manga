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
                children: `(function(){if('caches' in window){caches.keys().then(function(ks){ks.forEach(function(k){if(k==='oververse-v2'||k==='oververse-v3'||k.indexOf('workbox-precache')===0){caches.delete(k).catch(function(){});}});}).catch(function(){});}if('serviceWorker' in navigator){navigator.serviceWorker.getRegistrations().then(function(rs){rs.forEach(function(r){r.update().catch(function(){});});}).catch(function(){});}var W=window.WebSocket;if(typeof W==='function'){var P=function(u,p){var h=p==='vite-hmr'||p==='vite-ping'||(Array.isArray(p)&&(p.indexOf('vite-hmr')!==-1||p.indexOf('vite-ping')!==-1));if(h){var t=new EventTarget();Object.defineProperties(t,{url:{value:String(u),enumerable:true},protocol:{value:typeof p==='string'?p:(p&&p[0])||'',enumerable:true},readyState:{value:1,enumerable:true},bufferedAmount:{value:0,enumerable:true},extensions:{value:'',enumerable:true},binaryType:{value:'blob',writable:true,enumerable:true},CONNECTING:{value:0,enumerable:true},OPEN:{value:1,enumerable:true},CLOSING:{value:2,enumerable:true},CLOSED:{value:3,enumerable:true},send:{value:function(){}},close:{value:function(){}}});t.onopen=null;t.onmessage=null;t.onerror=null;t.onclose=null;return t;}return arguments.length>1?new W(u,p):new W(u);};P.prototype=W.prototype;P.CONNECTING=W.CONNECTING;P.OPEN=W.OPEN;P.CLOSING=W.CLOSING;P.CLOSED=W.CLOSED;window.WebSocket=P;}})();`,
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
      includeAssets: ['favicon.png', 'apple-touch-icon.png', 'icon.svg', 'master-logo.png'],
      manifest: {
        id: '/',
        name: 'OVERVERSE',
        short_name: 'OVERVERSE',
        description: 'Read and publish manga on the go with OVERVERSE.',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        scope: '/',
        start_url: '/',
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
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      devOptions: {
        enabled: true,
        type: 'module',
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff,woff2}'],
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        navigateFallbackDenylist: [
          /^\/api\//,
          /^\/@vite\//,
          /^\/@id\//,
          /^\/@fs\//,
          /^\/@react-refresh/,
          /^\/src\//,
          /^\/node_modules\//,
        ],
      },
    })],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '.'),
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
