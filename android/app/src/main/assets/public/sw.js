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
    "revision": "410f724a6dba2d8db173878fa2d36276"
  }, {
    "url": "pwa-maskable-192x192.png",
    "revision": "b6cd643bb23f0cab9a598d6ad6610be0"
  }, {
    "url": "pwa-512x512.png",
    "revision": "d7badec8ff8063129911fbcbaafca669"
  }, {
    "url": "pwa-192x192.png",
    "revision": "c95833ce671a3524644d66a7a9b6f783"
  }, {
    "url": "playstore-icon-512.png",
    "revision": "fa401aef71b64fe9a11e8e6c95f15876"
  }, {
    "url": "placeholder.png",
    "revision": "241af57795d3e389e64848b62416e202"
  }, {
    "url": "master-logo.png",
    "revision": "d7badec8ff8063129911fbcbaafca669"
  }, {
    "url": "master-logo.jpg",
    "revision": "ab3dff21b233005575375243fd2d08e3"
  }, {
    "url": "manifest.json",
    "revision": "3aa826474b5c96b32066bc0bc2fab78e"
  }, {
    "url": "index.html",
    "revision": "7dbed18c16c325142b1d84a991a961f3"
  }, {
    "url": "icon.svg",
    "revision": "229523a767ca4505775c29c724dc8fa1"
  }, {
    "url": "firebase-messaging-sw.js",
    "revision": "c0202eec0889a732a298b9edb3488a2b"
  }, {
    "url": "favicon.png",
    "revision": "475b1f48653f5cd50312a151414f3a92"
  }, {
    "url": "apple-touch-icon.png",
    "revision": "13fb4a822f3e6052f62a1bc93099efdf"
  }, {
    "url": "assets/workbox-window.prod.es5-Bd17z0YL.js",
    "revision": null
  }, {
    "url": "assets/web-C1g6PURT.js",
    "revision": null
  }, {
    "url": "assets/vendor-supabase-Bcwuvg3K.js",
    "revision": null
  }, {
    "url": "assets/vendor-react-mDCvsGiD.js",
    "revision": null
  }, {
    "url": "assets/vendor-motion-DV0bViKr.js",
    "revision": null
  }, {
    "url": "assets/vendor-icons-DUU8EZVq.js",
    "revision": null
  }, {
    "url": "assets/vendor-charts-BbCxPWep.js",
    "revision": null
  }, {
    "url": "assets/vendor-auth-utils-CoYlvp1e.js",
    "revision": null
  }, {
    "url": "assets/schemas-BkBiGV9V.js",
    "revision": null
  }, {
    "url": "assets/safeStorage-B2nYKOjp.js",
    "revision": null
  }, {
    "url": "assets/rolldown-runtime-B0Z9INg1.js",
    "revision": null
  }, {
    "url": "assets/readingStreak-Bv_S8T4j.js",
    "revision": null
  }, {
    "url": "assets/preload-helper-B3nfOi5I.js",
    "revision": null
  }, {
    "url": "assets/page-PqwDMhjJ.js",
    "revision": null
  }, {
    "url": "assets/page-DuqD0PgY.js",
    "revision": null
  }, {
    "url": "assets/page-DuYnxN_U.js",
    "revision": null
  }, {
    "url": "assets/page-DlvkvUNK.js",
    "revision": null
  }, {
    "url": "assets/page-DkrsliGA.js",
    "revision": null
  }, {
    "url": "assets/page-BPBYkt9R.js",
    "revision": null
  }, {
    "url": "assets/oververseAuth-iQz2EJJg.js",
    "revision": null
  }, {
    "url": "assets/mangakaManager-a8vQ-7Dw.js",
    "revision": null
  }, {
    "url": "assets/layout-CJ6YxzV5.js",
    "revision": null
  }, {
    "url": "assets/index-LqGr755L.js",
    "revision": null
  }, {
    "url": "assets/index-BhgO2Mym.css",
    "revision": null
  }, {
    "url": "assets/esm-DZUycZ38.js",
    "revision": null
  }, {
    "url": "assets/coverStorage-q_z9AH74.js",
    "revision": null
  }, {
    "url": "assets/WebViewerModal-B4phHPnt.js",
    "revision": null
  }, {
    "url": "assets/WalletPage-CciFRNzJ.js",
    "revision": null
  }, {
    "url": "assets/UserProfileModal-BbUeDzhF.js",
    "revision": null
  }, {
    "url": "assets/TermsOfService-Cr9JsolS.js",
    "revision": null
  }, {
    "url": "assets/SubscriptionModal-DLXsHQz8.js",
    "revision": null
  }, {
    "url": "assets/SettingsPage-B30-D3HR.js",
    "revision": null
  }, {
    "url": "assets/SecurityDefenseModal-PDBquPw1.js",
    "revision": null
  }, {
    "url": "assets/RewardedAdModal-6vgJHwdD.js",
    "revision": null
  }, {
    "url": "assets/RecommendationModal-DHxRon6r.js",
    "revision": null
  }, {
    "url": "assets/ReaderView-BxakMEnY.js",
    "revision": null
  }, {
    "url": "assets/PublishModal-D3wka3cE.js",
    "revision": null
  }, {
    "url": "assets/ProductivityCommandPalette-8LElzupN.js",
    "revision": null
  }, {
    "url": "assets/PrivacyPolicy-BeLYCe3W.js",
    "revision": null
  }, {
    "url": "assets/PasswordStrengthIndicator-Cfd7FV-G.js",
    "revision": null
  }, {
    "url": "assets/NavigationDrawer-Goh5XSAv.js",
    "revision": null
  }, {
    "url": "assets/MilestoneCelebrationModal-CKi_-iB9.js",
    "revision": null
  }, {
    "url": "assets/MangakaDashboardModal-B6vzrTlN.js",
    "revision": null
  }, {
    "url": "assets/MangaOfTheYearAwardsPage-BxfcryKE.js",
    "revision": null
  }, {
    "url": "assets/MangaOfTheYearAwardsModal-CohN20Ky.js",
    "revision": null
  }, {
    "url": "assets/MangaDetailModal-DVE9AHME.js",
    "revision": null
  }, {
    "url": "assets/InterstitialAdModal-6nhiDKTm.js",
    "revision": null
  }, {
    "url": "assets/GlobalPublishShareModal-CMijg8Go.js",
    "revision": null
  }, {
    "url": "assets/DevicePerformanceModal-CeRye4yj.js",
    "revision": null
  }, {
    "url": "assets/CreatorEarningsView-CMz2WcWb.js",
    "revision": null
  }, {
    "url": "assets/CreatorDashboardModal-BLg2tpow.js",
    "revision": null
  }, {
    "url": "assets/CreatorAccountGate-C2K1h6pc.js",
    "revision": null
  }, {
    "url": "assets/ChatsPage-Bjd9RRc3.js",
    "revision": null
  }, {
    "url": "assets/ChapterUploadManager-CJvKOEqU.js",
    "revision": null
  }, {
    "url": "assets/BackdropPage-BciGU-zu.js",
    "revision": null
  }, {
    "url": "assets/ApplyAsMangakaModal-pkpPvVvD.js",
    "revision": null
  }, {
    "url": "assets/AppStoreModal-BvEpD6oH.js",
    "revision": null
  }, {
    "url": "assets/AppOpenAdModal-1g6SmmNw.js",
    "revision": null
  }, {
    "url": "assets/AiReportModal-D8kr59PQ.js",
    "revision": null
  }, {
    "url": "assets/AdminDashboardModal-CttjwiB-.js",
    "revision": null
  }, {
    "url": "assets/aistudio/az_oververse_black_silver_transparent_29ae4c4c.png",
    "revision": null
  }, {
    "url": "assets/aistudio/IMG-20261030-WA4361_fe49230b.jpg",
    "revision": null
  }, {
    "url": "assets/aistudio/876507702_1790968748807516_1967466416315700542_n_aea98a38.webp",
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
    "revision": "13fb4a822f3e6052f62a1bc93099efdf"
  }, {
    "url": "favicon.png",
    "revision": "475b1f48653f5cd50312a151414f3a92"
  }, {
    "url": "icon.svg",
    "revision": "229523a767ca4505775c29c724dc8fa1"
  }, {
    "url": "master-logo.png",
    "revision": "d7badec8ff8063129911fbcbaafca669"
  }, {
    "url": "playstore-icon-512.png",
    "revision": "fa401aef71b64fe9a11e8e6c95f15876"
  }, {
    "url": "pwa-192x192.png",
    "revision": "c95833ce671a3524644d66a7a9b6f783"
  }, {
    "url": "pwa-512x512.png",
    "revision": "d7badec8ff8063129911fbcbaafca669"
  }, {
    "url": "pwa-maskable-192x192.png",
    "revision": "b6cd643bb23f0cab9a598d6ad6610be0"
  }, {
    "url": "pwa-maskable-512x512.png",
    "revision": "410f724a6dba2d8db173878fa2d36276"
  }, {
    "url": "assets/aistudio/876507702_1790968748807516_1967466416315700542_n_aea98a38.webp",
    "revision": "359338ece339d5e385b5d8a7f01cc411"
  }, {
    "url": "assets/aistudio/IMG-20261030-WA4361_fe49230b.jpg",
    "revision": "0602a84b84096d635dd7d7646c4b2398"
  }, {
    "url": "manifest.json",
    "revision": "3aa826474b5c96b32066bc0bc2fab78e"
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
