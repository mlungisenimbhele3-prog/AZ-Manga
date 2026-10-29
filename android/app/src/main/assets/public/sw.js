/**
 * Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// If the loader is already loaded, just stop.
if (!self.define) {
  let registry = {};

  // Used for `eval` and `importScripts` where we can't get script URL by other means.
  // In both cases, it's safe to use a global var because those functions are synchronous.
  let nextDefineUri;

  const singleRequire = (uri, parentUri) => {
    uri = new URL(uri + ".js", parentUri).href;
    return registry[uri] || (
      
        new Promise(resolve => {
          if ("document" in self) {
            const script = document.createElement("script");
            script.src = uri;
            script.onload = resolve;
            document.head.appendChild(script);
          } else {
            nextDefineUri = uri;
            importScripts(uri);
            resolve();
          }
        })
      
      .then(() => {
        let promise = registry[uri];
        if (!promise) {
          throw new Error(`Module ${uri} didn’t register its module`);
        }
        return promise;
      })
    );
  };

  self.define = (depsNames, factory) => {
    const uri = nextDefineUri || ("document" in self ? document.currentScript.src : "") || location.href;
    if (registry[uri]) {
      // Module is already loading or loaded.
      return;
    }
    let exports = {};
    const require = depUri => singleRequire(depUri, uri);
    const specialDeps = {
      module: { uri },
      exports,
      require
    };
    registry[uri] = Promise.all(depsNames.map(
      depName => specialDeps[depName] || require(depName)
    )).then(deps => {
      factory(...deps);
      return exports;
    });
  };
}
define(['./workbox-53feb3a3'], (function (workbox) { 'use strict';

  self.skipWaiting();
  workbox.clientsClaim();
  /**
   * The precacheAndRoute() method efficiently caches and responds to
   * requests for URLs in the manifest.
   * See https://goo.gl/S9QRab
   */
  workbox.precacheAndRoute([{
    "url": "pwa-maskable-512x512.png",
    "revision": "59411a84b4c125d0d6d10b64f292b8df"
  }, {
    "url": "pwa-maskable-192x192.png",
    "revision": "333b244a5730f693bc8fc61e44dec020"
  }, {
    "url": "pwa-512x512.png",
    "revision": "f25929f89446421dbb1a1eb116ab4b1a"
  }, {
    "url": "pwa-192x192.png",
    "revision": "60170844584e5f708c370911ed5e78fb"
  }, {
    "url": "playstore-icon-512.png",
    "revision": "f25929f89446421dbb1a1eb116ab4b1a"
  }, {
    "url": "placeholder.png",
    "revision": "241af57795d3e389e64848b62416e202"
  }, {
    "url": "master-logo.png",
    "revision": "241af57795d3e389e64848b62416e202"
  }, {
    "url": "manifest.json",
    "revision": "1d63fd5f79e17417a765ff9a5da1a984"
  }, {
    "url": "index.html",
    "revision": "72d432f3d4f52390187ad9c19264421a"
  }, {
    "url": "icon.svg",
    "revision": "534ebf9da0dd39acd059278761fe5005"
  }, {
    "url": "firebase-messaging-sw.js",
    "revision": "c0202eec0889a732a298b9edb3488a2b"
  }, {
    "url": "favicon.png",
    "revision": "ec02f08130993727e0f9f1757810a58a"
  }, {
    "url": "apple-touch-icon.png",
    "revision": "c4ec2ea431d558d4a9e6b9c61bbb156c"
  }, {
    "url": "assets/workbox-window.prod.es5-Bd17z0YL.js",
    "revision": null
  }, {
    "url": "assets/web-BIQ9x6rE.js",
    "revision": null
  }, {
    "url": "assets/vendor-supabase-DlWE8pix.js",
    "revision": null
  }, {
    "url": "assets/vendor-react-M-U5T2k7.js",
    "revision": null
  }, {
    "url": "assets/vendor-motion-C7lkAO7t.js",
    "revision": null
  }, {
    "url": "assets/vendor-icons-DzpdHQ1E.js",
    "revision": null
  }, {
    "url": "assets/vendor-firebase-COyu5S2f.js",
    "revision": null
  }, {
    "url": "assets/vendor-charts-ZAeb2kp1.js",
    "revision": null
  }, {
    "url": "assets/safeStorage-DaX-BBjB.js",
    "revision": null
  }, {
    "url": "assets/rolldown-runtime-B0Z9INg1.js",
    "revision": null
  }, {
    "url": "assets/readingStreak-EPUFuNHa.js",
    "revision": null
  }, {
    "url": "assets/index-DHOVKknJ.css",
    "revision": null
  }, {
    "url": "assets/index-B0UePo-N.js",
    "revision": null
  }, {
    "url": "assets/esm-C-MtZFvB.js",
    "revision": null
  }, {
    "url": "assets/coverStorage-D3AWAbQ9.js",
    "revision": null
  }, {
    "url": "assets/WebViewerModal-zEso0HPl.js",
    "revision": null
  }, {
    "url": "assets/WalletPage-B3t9yEaM.js",
    "revision": null
  }, {
    "url": "assets/UserProfileModal-DtRjcY9c.js",
    "revision": null
  }, {
    "url": "assets/TermsOfService-qYsrCci4.js",
    "revision": null
  }, {
    "url": "assets/SubscriptionModal-DHuspvYF.js",
    "revision": null
  }, {
    "url": "assets/SettingsPage-TJBe3W_Y.js",
    "revision": null
  }, {
    "url": "assets/SecurityDefenseModal-XEtr81_a.js",
    "revision": null
  }, {
    "url": "assets/RewardedAdModal-DV_-sTs4.js",
    "revision": null
  }, {
    "url": "assets/RecommendationModal-DDfeF3eo.js",
    "revision": null
  }, {
    "url": "assets/ReaderView-D1R5igxg.js",
    "revision": null
  }, {
    "url": "assets/PublishModal-Hb9TdnIb.js",
    "revision": null
  }, {
    "url": "assets/ProductivityCommandPalette-C1xZGQJG.js",
    "revision": null
  }, {
    "url": "assets/PrivacyPolicy-BuNAVknl.js",
    "revision": null
  }, {
    "url": "assets/NavigationDrawer-kY-hcBGw.js",
    "revision": null
  }, {
    "url": "assets/MilestoneCelebrationModal-BytOCqMQ.js",
    "revision": null
  }, {
    "url": "assets/MangakaDashboardModal-DZd_IoFi.js",
    "revision": null
  }, {
    "url": "assets/MangaOfTheYearAwardsPage-Bcsfa1Yn.js",
    "revision": null
  }, {
    "url": "assets/MangaOfTheYearAwardsModal-BtQT7wxD.js",
    "revision": null
  }, {
    "url": "assets/MangaDetailModal-BOgkZTTA.js",
    "revision": null
  }, {
    "url": "assets/InterstitialAdModal-ZADkrZXo.js",
    "revision": null
  }, {
    "url": "assets/GlobalPublishShareModal-MVtGOcDd.js",
    "revision": null
  }, {
    "url": "assets/DevicePerformanceModal-CF-6ikfJ.js",
    "revision": null
  }, {
    "url": "assets/CreatorEarningsView-B5SYt1tf.js",
    "revision": null
  }, {
    "url": "assets/CreatorDashboardModal-D0M3Z4_u.js",
    "revision": null
  }, {
    "url": "assets/CreatorAccountGate-DwKD6Vzv.js",
    "revision": null
  }, {
    "url": "assets/ChatsPage-Fjv8o3mi.js",
    "revision": null
  }, {
    "url": "assets/ChapterUploadManager-4pLZkmdf.js",
    "revision": null
  }, {
    "url": "assets/BackdropPage-DWdGXgdW.js",
    "revision": null
  }, {
    "url": "assets/ApplyAsMangakaModal-BbGBHa_B.js",
    "revision": null
  }, {
    "url": "assets/AppStoreModal-CRsWVXKX.js",
    "revision": null
  }, {
    "url": "assets/AppOpenAdModal-BR63r0pb.js",
    "revision": null
  }, {
    "url": "assets/AiReportModal-BUsd12IC.js",
    "revision": null
  }, {
    "url": "assets/AdminDashboardModal-BxK8nPjP.js",
    "revision": null
  }, {
    "url": "assets/aistudio/864065446_1439121761762844_7954184789731044419_n_4e836595.webp",
    "revision": null
  }, {
    "url": "assets/aistudio/863828260_4617557535148066_7093504428428258727_n_00bb7391.webp",
    "revision": null
  }, {
    "url": "assets/aistudio/862620681_1304598868406485_898394409428393681_n_8fa8ea5a.webp",
    "revision": null
  }, {
    "url": "assets/aistudio/862516203_2025904894785875_8927204788896565857_n_afa879ec.webp",
    "revision": null
  }, {
    "url": "assets/aistudio/858773050_1090471570458562_5763578410902289088_n_e2f7ebb3.webp",
    "revision": null
  }, {
    "url": "assets/aistudio/857872877_1452459446839395_7963345796326052180_n_b7d59072.webp",
    "revision": null
  }, {
    "url": "assets/aistudio/857740589_1731657971260608_5138240210488329565_n_d9fa3357.webp",
    "revision": null
  }, {
    "url": "assets/aistudio/854579517_1468245221882114_98463028170683618_n_d2b1173e.webp",
    "revision": null
  }, {
    "url": "apple-touch-icon.png",
    "revision": "c4ec2ea431d558d4a9e6b9c61bbb156c"
  }, {
    "url": "favicon.png",
    "revision": "ec02f08130993727e0f9f1757810a58a"
  }, {
    "url": "icon.svg",
    "revision": "534ebf9da0dd39acd059278761fe5005"
  }, {
    "url": "master-logo.png",
    "revision": "241af57795d3e389e64848b62416e202"
  }, {
    "url": "playstore-icon-512.png",
    "revision": "f25929f89446421dbb1a1eb116ab4b1a"
  }, {
    "url": "pwa-192x192.png",
    "revision": "60170844584e5f708c370911ed5e78fb"
  }, {
    "url": "pwa-512x512.png",
    "revision": "f25929f89446421dbb1a1eb116ab4b1a"
  }, {
    "url": "pwa-maskable-192x192.png",
    "revision": "333b244a5730f693bc8fc61e44dec020"
  }, {
    "url": "pwa-maskable-512x512.png",
    "revision": "59411a84b4c125d0d6d10b64f292b8df"
  }, {
    "url": "assets/aistudio/863828260_4617557535148066_7093504428428258727_n_00bb7391.webp",
    "revision": "38c9fb1be7f0bb2ffc4b480eeb1b0db2"
  }, {
    "url": "assets/aistudio/864065446_1439121761762844_7954184789731044419_n_4e836595.webp",
    "revision": "ad7297d16009c2d9225d2ad86b4cfb6e"
  }, {
    "url": "manifest.json",
    "revision": "1d63fd5f79e17417a765ff9a5da1a984"
  }], {});
  workbox.cleanupOutdatedCaches();
  workbox.registerRoute(new workbox.NavigationRoute(workbox.createHandlerBoundToURL("index.html"), {
    denylist: [/^\/api\//, /^\/__\//, /^\/\.well-known\//, /^\/@vite\//, /^\/@id\//, /^\/@fs\//, /^\/@react-refresh/, /^\/src\//, /^\/node_modules\//, /\.aab$/i, /\.apk$/i, /\.keystore$/i]
  }));
  workbox.registerRoute(/^https:\/\/fonts\.googleapis\.com\/.*/i, new workbox.CacheFirst({
    "cacheName": "oververse-google-fonts-css",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 15,
      maxAgeSeconds: 31536000
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');
  workbox.registerRoute(/^https:\/\/fonts\.gstatic\.com\/.*/i, new workbox.CacheFirst({
    "cacheName": "oververse-gstatic-fonts",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 20,
      maxAgeSeconds: 31536000
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');
  workbox.registerRoute(({
    request,
    url
  }) => request.destination === "image" || /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i.test(url.pathname), new workbox.StaleWhileRevalidate({
    "cacheName": "oververse-manga-images",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 250,
      maxAgeSeconds: 2592000
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');
  workbox.registerRoute(/^\/api\/.*/i, new workbox.NetworkFirst({
    "cacheName": "oververse-api-cache",
    "networkTimeoutSeconds": 5,
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 50,
      maxAgeSeconds: 86400
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');

}));
