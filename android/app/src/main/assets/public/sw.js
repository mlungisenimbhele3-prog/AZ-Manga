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
define(['./workbox-7e5eb42b'], (function (workbox) { 'use strict';

  self.skipWaiting();
  workbox.clientsClaim();
  /**
   * The precacheAndRoute() method efficiently caches and responds to
   * requests for URLs in the manifest.
   * See https://goo.gl/S9QRab
   */
  workbox.precacheAndRoute([{
    "url": "registerSW.js",
    "revision": "1872c500de691dce40960bb85481de07"
  }, {
    "url": "pwa-512x512.png",
    "revision": "b01dfeac5b325e5580e5e4c35ef16d77"
  }, {
    "url": "pwa-192x192.png",
    "revision": "bb0a305db7309bc076b51763e95dd48e"
  }, {
    "url": "placeholder.png",
    "revision": "2c5bc3404cfcca42124ba0878cf9beb1"
  }, {
    "url": "master-logo.png",
    "revision": "46bec134bc33d41e3df1dbcce3747608"
  }, {
    "url": "index.html",
    "revision": "2415e58927d104b06ef9cfa24fb9478c"
  }, {
    "url": "icon.svg",
    "revision": "d818f989f6b3e3b8f802d8a49f764f25"
  }, {
    "url": "firebase-messaging-sw.js",
    "revision": "c0202eec0889a732a298b9edb3488a2b"
  }, {
    "url": "favicon.png",
    "revision": "ef64cee5bfc9da50af8ff6966759f42b"
  }, {
    "url": "apple-touch-icon.png",
    "revision": "82b9c029932a88507bfdf79514c9d8f0"
  }, {
    "url": "assets/web-BkscBfzV.js",
    "revision": null
  }, {
    "url": "assets/index-D4OfoK-O.css",
    "revision": null
  }, {
    "url": "assets/index-BlXE1Cg7.js",
    "revision": null
  }, {
    "url": "assets/esm-dhCn27q1.js",
    "revision": null
  }, {
    "url": "assets/aistudio/864065446_1439121761762844_7954184789731044419_n_4e836595.webp",
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
    "revision": "82b9c029932a88507bfdf79514c9d8f0"
  }, {
    "url": "favicon.png",
    "revision": "ef64cee5bfc9da50af8ff6966759f42b"
  }, {
    "url": "icon.svg",
    "revision": "d818f989f6b3e3b8f802d8a49f764f25"
  }, {
    "url": "master-logo.png",
    "revision": "46bec134bc33d41e3df1dbcce3747608"
  }, {
    "url": "pwa-192x192.png",
    "revision": "bb0a305db7309bc076b51763e95dd48e"
  }, {
    "url": "pwa-512x512.png",
    "revision": "b01dfeac5b325e5580e5e4c35ef16d77"
  }, {
    "url": "manifest.webmanifest",
    "revision": "5fa9eb0582d21b8f803ab31cb6b799de"
  }], {});
  workbox.cleanupOutdatedCaches();
  workbox.registerRoute(new workbox.NavigationRoute(workbox.createHandlerBoundToURL("index.html"), {
    denylist: [/^\/api\//, /^\/@vite\//, /^\/@id\//, /^\/@fs\//, /^\/@react-refresh/, /^\/src\//, /^\/node_modules\//]
  }));

}));
