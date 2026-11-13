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
    "revision": "41283aefa0f1aa3082c5434f108fb681"
  }, {
    "url": "pwa-maskable-192x192.png",
    "revision": "078d20cb810b6b942970856fd0c8e9cb"
  }, {
    "url": "pwa-512x512.png",
    "revision": "41283aefa0f1aa3082c5434f108fb681"
  }, {
    "url": "pwa-192x192.png",
    "revision": "c12cb638b23b64366fbc2c60474b28c2"
  }, {
    "url": "playstore-icon-512.png",
    "revision": "41283aefa0f1aa3082c5434f108fb681"
  }, {
    "url": "placeholder.png",
    "revision": "241af57795d3e389e64848b62416e202"
  }, {
    "url": "master-logo.png",
    "revision": "41283aefa0f1aa3082c5434f108fb681"
  }, {
    "url": "master-logo.jpg",
    "revision": "0479d2adfb77eefb56591b191e3029f0"
  }, {
    "url": "manifest.json",
    "revision": "bf2f6ecad3df4bb71e2e0aaf04f982e2"
  }, {
    "url": "index.html",
    "revision": "37c3902fe2d0c35fe78fd6920651d46a"
  }, {
    "url": "icon.svg",
    "revision": "e2522550d52c2a9be93fb57dfe0c93c1"
  }, {
    "url": "favicon.png",
    "revision": "69c1b57d80f58feb20171ea0ed79ae3f"
  }, {
    "url": "apple-touch-icon.png",
    "revision": "0d73acf9ddb02175ebf091fa172d5c58"
  }, {
    "url": "assets/web-BumBZQEA.js",
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
    "url": "assets/safetyService-LUABMzqj.js",
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
    "url": "assets/page-xNRmFmx0.js",
    "revision": null
  }, {
    "url": "assets/page-w5IFbYeu.js",
    "revision": null
  }, {
    "url": "assets/page-DZHMvOwU.js",
    "revision": null
  }, {
    "url": "assets/page-DYsRADgj.js",
    "revision": null
  }, {
    "url": "assets/page-DSwS5QMo.js",
    "revision": null
  }, {
    "url": "assets/page-BXNZjizC.js",
    "revision": null
  }, {
    "url": "assets/oververseAuth-BJJmd_zi.js",
    "revision": null
  }, {
    "url": "assets/mangakaManager-a8vQ-7Dw.js",
    "revision": null
  }, {
    "url": "assets/layout-BM3BFngk.js",
    "revision": null
  }, {
    "url": "assets/index-Cyk6R3GM.js",
    "revision": null
  }, {
    "url": "assets/index-CUCE8Y-l.css",
    "revision": null
  }, {
    "url": "assets/esm-CNHyA_CQ.js",
    "revision": null
  }, {
    "url": "assets/devicePerformance-DyHGMh_n.js",
    "revision": null
  }, {
    "url": "assets/creatorChapterStatsService-CO5GdbZY.js",
    "revision": null
  }, {
    "url": "assets/coverStorage-e1SgGqRy.js",
    "revision": null
  }, {
    "url": "assets/aiDetector-VIheQF7w.js",
    "revision": null
  }, {
    "url": "assets/WebViewerModal-CJX7dZW4.js",
    "revision": null
  }, {
    "url": "assets/WalletPage-Cz5bszzZ.js",
    "revision": null
  }, {
    "url": "assets/UserProfileModal-DlNfYV3Y.js",
    "revision": null
  }, {
    "url": "assets/TermsOfService-DgVqP9el.js",
    "revision": null
  }, {
    "url": "assets/SubscriptionModal-CxEcrojw.js",
    "revision": null
  }, {
    "url": "assets/StarRating-DaskIId9.js",
    "revision": null
  }, {
    "url": "assets/SettingsPage-B3sqvseV.js",
    "revision": null
  }, {
    "url": "assets/SecurityDefenseModal-CyPVYnwZ.js",
    "revision": null
  }, {
    "url": "assets/RewardedAdModal-CZ6ktkR0.js",
    "revision": null
  }, {
    "url": "assets/RecommendationModal-B0Iu5t52.js",
    "revision": null
  }, {
    "url": "assets/ReaderView-BHIXBMVc.js",
    "revision": null
  }, {
    "url": "assets/PublishModal-DZ11dI8l.js",
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
    "url": "assets/NavigationDrawer-C7klSlhh.js",
    "revision": null
  }, {
    "url": "assets/MilestoneCelebrationModal-DHO2rJiq.js",
    "revision": null
  }, {
    "url": "assets/MangakaDashboardModal-BBC_z598.js",
    "revision": null
  }, {
    "url": "assets/MangaOfTheYearAwardsPage-Bu-O2UuN.js",
    "revision": null
  }, {
    "url": "assets/MangaOfTheYearAwardsModal-COxtfKdX.js",
    "revision": null
  }, {
    "url": "assets/MangaDetailModal-md1QLGND.js",
    "revision": null
  }, {
    "url": "assets/MangaCoverImage-DCdJzv9C.js",
    "revision": null
  }, {
    "url": "assets/KAAfricaLogo-C2KUA74Y.js",
    "revision": null
  }, {
    "url": "assets/InterstitialAdModal-D_XPieyi.js",
    "revision": null
  }, {
    "url": "assets/GlobalPublishShareModal-DyXdbXed.js",
    "revision": null
  }, {
    "url": "assets/FcmNotificationBanner-g_wQyr0c.js",
    "revision": null
  }, {
    "url": "assets/DevicePerformanceModal-Cs_ZtU4K.js",
    "revision": null
  }, {
    "url": "assets/CreatorEarningsView-1TToc7SE.js",
    "revision": null
  }, {
    "url": "assets/CreatorDashboardView-DiIThhqS.js",
    "revision": null
  }, {
    "url": "assets/CreatorDashboardModal-x-AwVYr8.js",
    "revision": null
  }, {
    "url": "assets/CreatorChapterStatsCard-CK5RkaFb.js",
    "revision": null
  }, {
    "url": "assets/CreatorAccountGate-Dz51ioL-.js",
    "revision": null
  }, {
    "url": "assets/ContentRules-Dirr_ReV.js",
    "revision": null
  }, {
    "url": "assets/ChatsPage-B5mek8dY.js",
    "revision": null
  }, {
    "url": "assets/ChapterUploadManager-DYVUTWUM.js",
    "revision": null
  }, {
    "url": "assets/BackdropPage-CdjDxp-L.js",
    "revision": null
  }, {
    "url": "assets/ApplyAsMangakaModal-CeHRUcfE.js",
    "revision": null
  }, {
    "url": "assets/AppStoreModal-DFB70gpQ.js",
    "revision": null
  }, {
    "url": "assets/AppOpenAdModal-Dr6eCX8v.js",
    "revision": null
  }, {
    "url": "assets/AiReportModal-BfujU5ac.js",
    "revision": null
  }, {
    "url": "assets/AdminDashboardModal-B88K0wFc.js",
    "revision": null
  }, {
    "url": "assets/AdminApprovalView-BNDyVavK.js",
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
    "revision": "0d73acf9ddb02175ebf091fa172d5c58"
  }, {
    "url": "favicon.png",
    "revision": "69c1b57d80f58feb20171ea0ed79ae3f"
  }, {
    "url": "icon.svg",
    "revision": "e2522550d52c2a9be93fb57dfe0c93c1"
  }, {
    "url": "master-logo.png",
    "revision": "41283aefa0f1aa3082c5434f108fb681"
  }, {
    "url": "playstore-icon-512.png",
    "revision": "41283aefa0f1aa3082c5434f108fb681"
  }, {
    "url": "pwa-192x192.png",
    "revision": "c12cb638b23b64366fbc2c60474b28c2"
  }, {
    "url": "pwa-512x512.png",
    "revision": "41283aefa0f1aa3082c5434f108fb681"
  }, {
    "url": "pwa-maskable-192x192.png",
    "revision": "078d20cb810b6b942970856fd0c8e9cb"
  }, {
    "url": "pwa-maskable-512x512.png",
    "revision": "41283aefa0f1aa3082c5434f108fb681"
  }, {
    "url": "assets/aistudio/876507702_1790968748807516_1967466416315700542_n_aea98a38.webp",
    "revision": "359338ece339d5e385b5d8a7f01cc411"
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
