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
    "revision": "1648c5dca0db7023ff36c1e9b872a588"
  }, {
    "url": "pwa-maskable-192x192.png",
    "revision": "1292adf90968775ca3f34ac67d57aace"
  }, {
    "url": "pwa-512x512.png",
    "revision": "0d0432970c905d810560edbc8aadb4b5"
  }, {
    "url": "pwa-192x192.png",
    "revision": "e7f88ad6473a84f1a9c8b7a2a1a76039"
  }, {
    "url": "playstore-icon-512.png",
    "revision": "5294fc6d7228ff49ab932c03d118c474"
  }, {
    "url": "placeholder.png",
    "revision": "241af57795d3e389e64848b62416e202"
  }, {
    "url": "master-logo.png",
    "revision": "0d0432970c905d810560edbc8aadb4b5"
  }, {
    "url": "master-logo.jpg",
    "revision": "aff594d5a8dc7894c809dfa2793d04c0"
  }, {
    "url": "manifest.json",
    "revision": "bf2f6ecad3df4bb71e2e0aaf04f982e2"
  }, {
    "url": "index.html",
    "revision": "c8d6a4db5f44d1f9f3302958024ce2f5"
  }, {
    "url": "icon.svg",
    "revision": "ac17a5fde1676f42f1ea620f29962e05"
  }, {
    "url": "favicon.png",
    "revision": "55c6919dc92a0950d74cb146b17068b2"
  }, {
    "url": "apple-touch-icon.png",
    "revision": "f0b02a74701197e3a57a507471c0c742"
  }, {
    "url": "assets/web-BugljC8f.js",
    "revision": null
  }, {
    "url": "assets/vendor-supabase-BN79N3Si.js",
    "revision": null
  }, {
    "url": "assets/vendor-react-mDCvsGiD.js",
    "revision": null
  }, {
    "url": "assets/vendor-motion-DV0bViKr.js",
    "revision": null
  }, {
    "url": "assets/vendor-icons-DGmHQS1z.js",
    "revision": null
  }, {
    "url": "assets/vendor-charts-BbCxPWep.js",
    "revision": null
  }, {
    "url": "assets/vendor-auth-utils-CoYlvp1e.js",
    "revision": null
  }, {
    "url": "assets/schemas-CAZOdCfY.js",
    "revision": null
  }, {
    "url": "assets/safetyService-CxO1u-GW.js",
    "revision": null
  }, {
    "url": "assets/safeStorage-B2nYKOjp.js",
    "revision": null
  }, {
    "url": "assets/rolldown-runtime-B0Z9INg1.js",
    "revision": null
  }, {
    "url": "assets/recommendationEngine-DCMbPXHd.js",
    "revision": null
  }, {
    "url": "assets/readingStreak-7XLJH5xQ.js",
    "revision": null
  }, {
    "url": "assets/preload-helper-B3nfOi5I.js",
    "revision": null
  }, {
    "url": "assets/page-sspUsY_V.js",
    "revision": null
  }, {
    "url": "assets/page-lsri6kTT.js",
    "revision": null
  }, {
    "url": "assets/page-EKI4vPRM.js",
    "revision": null
  }, {
    "url": "assets/page-DleNhq8O.js",
    "revision": null
  }, {
    "url": "assets/page-DEeI5Q1k.js",
    "revision": null
  }, {
    "url": "assets/page-DCR8bEGM.js",
    "revision": null
  }, {
    "url": "assets/oververseAuth-BJJmd_zi.js",
    "revision": null
  }, {
    "url": "assets/mangakaManager-a8vQ-7Dw.js",
    "revision": null
  }, {
    "url": "assets/layout-BJHy3kS8.js",
    "revision": null
  }, {
    "url": "assets/index-CUCE8Y-l.css",
    "revision": null
  }, {
    "url": "assets/index-BrNzpXfc.js",
    "revision": null
  }, {
    "url": "assets/esm-K2ky2vBP.js",
    "revision": null
  }, {
    "url": "assets/devicePerformance-BpCStpek.js",
    "revision": null
  }, {
    "url": "assets/creatorChapterStatsService-CO5GdbZY.js",
    "revision": null
  }, {
    "url": "assets/coverStorage-B4PDXKyq.js",
    "revision": null
  }, {
    "url": "assets/aiDetector-VIheQF7w.js",
    "revision": null
  }, {
    "url": "assets/WebViewerModal-CVbRQw3f.js",
    "revision": null
  }, {
    "url": "assets/WalletPage-qE9HoWK2.js",
    "revision": null
  }, {
    "url": "assets/UserProfileModal-DMZZ_D89.js",
    "revision": null
  }, {
    "url": "assets/TermsOfService-DgVqP9el.js",
    "revision": null
  }, {
    "url": "assets/SubscriptionModal-BbaZeWEN.js",
    "revision": null
  }, {
    "url": "assets/StarRating-C_XEGi6L.js",
    "revision": null
  }, {
    "url": "assets/SettingsPage-Dgc7xD4S.js",
    "revision": null
  }, {
    "url": "assets/SecurityDefenseModal-CdocuHjv.js",
    "revision": null
  }, {
    "url": "assets/RewardedAdModal-BGJ13WxF.js",
    "revision": null
  }, {
    "url": "assets/RecommendationModal-C8LvyIet.js",
    "revision": null
  }, {
    "url": "assets/ReaderView-Da-GB1vo.js",
    "revision": null
  }, {
    "url": "assets/PublishModal-Cnll5rCj.js",
    "revision": null
  }, {
    "url": "assets/ProductivityCommandPalette-BNLLeZVs.js",
    "revision": null
  }, {
    "url": "assets/PrivacyPolicy-B-1cZgGk.js",
    "revision": null
  }, {
    "url": "assets/PasswordStrengthIndicator-doSdbdbC.js",
    "revision": null
  }, {
    "url": "assets/NavigationDrawer-xKSL6tpn.js",
    "revision": null
  }, {
    "url": "assets/MilestoneCelebrationModal-DHO2rJiq.js",
    "revision": null
  }, {
    "url": "assets/MangakaDashboardModal-CD0zZgBe.js",
    "revision": null
  }, {
    "url": "assets/MangaOfTheYearAwardsPage-Bu-O2UuN.js",
    "revision": null
  }, {
    "url": "assets/MangaOfTheYearAwardsModal-COxtfKdX.js",
    "revision": null
  }, {
    "url": "assets/MangaDetailModal-BCF1XpUi.js",
    "revision": null
  }, {
    "url": "assets/MangaCoverImage-DCdJzv9C.js",
    "revision": null
  }, {
    "url": "assets/KAAfricaLogo-BQrHYnjX.js",
    "revision": null
  }, {
    "url": "assets/InterstitialAdModal-TrZVr4AY.js",
    "revision": null
  }, {
    "url": "assets/GlobalPublishShareModal-CO92pM1B.js",
    "revision": null
  }, {
    "url": "assets/FcmNotificationBanner-8FuY3dHL.js",
    "revision": null
  }, {
    "url": "assets/DevicePerformanceModal-D1L1es8L.js",
    "revision": null
  }, {
    "url": "assets/CreatorEarningsView-OCz_lZTL.js",
    "revision": null
  }, {
    "url": "assets/CreatorDashboardView-Bc3I0AP_.js",
    "revision": null
  }, {
    "url": "assets/CreatorDashboardModal-Cm8nu2nJ.js",
    "revision": null
  }, {
    "url": "assets/CreatorChapterStatsCard-CK5RkaFb.js",
    "revision": null
  }, {
    "url": "assets/CreatorAccountGate-tqlIoKO8.js",
    "revision": null
  }, {
    "url": "assets/ContentRules-Dirr_ReV.js",
    "revision": null
  }, {
    "url": "assets/ChatsPage-sP1xQ9In.js",
    "revision": null
  }, {
    "url": "assets/ChapterUploadManager-D8OHhTzg.js",
    "revision": null
  }, {
    "url": "assets/BackdropPage-gdTRLzPV.js",
    "revision": null
  }, {
    "url": "assets/ApplyAsMangakaModal-CeHRUcfE.js",
    "revision": null
  }, {
    "url": "assets/AppStoreModal-CfZSgVhD.js",
    "revision": null
  }, {
    "url": "assets/AppOpenAdModal-wy4Vwj2T.js",
    "revision": null
  }, {
    "url": "assets/AiReportModal-BfujU5ac.js",
    "revision": null
  }, {
    "url": "assets/AdminDashboardModal-B6hgm9tk.js",
    "revision": null
  }, {
    "url": "assets/AdminApprovalView-DTSBYeHv.js",
    "revision": null
  }, {
    "url": "assets/aistudio/az_oververse_black_silver_transparent_29ae4c4c.png",
    "revision": null
  }, {
    "url": "assets/aistudio/app_icon_512_hq_50b7d64c.png",
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
    "revision": "f0b02a74701197e3a57a507471c0c742"
  }, {
    "url": "favicon.png",
    "revision": "55c6919dc92a0950d74cb146b17068b2"
  }, {
    "url": "icon.svg",
    "revision": "ac17a5fde1676f42f1ea620f29962e05"
  }, {
    "url": "master-logo.png",
    "revision": "0d0432970c905d810560edbc8aadb4b5"
  }, {
    "url": "playstore-icon-512.png",
    "revision": "5294fc6d7228ff49ab932c03d118c474"
  }, {
    "url": "pwa-192x192.png",
    "revision": "e7f88ad6473a84f1a9c8b7a2a1a76039"
  }, {
    "url": "pwa-512x512.png",
    "revision": "0d0432970c905d810560edbc8aadb4b5"
  }, {
    "url": "pwa-maskable-192x192.png",
    "revision": "1292adf90968775ca3f34ac67d57aace"
  }, {
    "url": "pwa-maskable-512x512.png",
    "revision": "1648c5dca0db7023ff36c1e9b872a588"
  }, {
    "url": "assets/aistudio/876507702_1790968748807516_1967466416315700542_n_aea98a38.webp",
    "revision": "359338ece339d5e385b5d8a7f01cc411"
  }, {
    "url": "assets/aistudio/app_icon_512_hq_50b7d64c.png",
    "revision": "26b6a15b796c1f115247226cb76b0302"
  }, {
    "url": "manifest.json",
    "revision": "bf2f6ecad3df4bb71e2e0aaf04f982e2"
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
