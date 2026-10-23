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
    "url": "index.html",
    "revision": "741e00638b4af7f08263ce08f7c25890"
  }, {
    "url": "firebase-messaging-sw.js",
    "revision": "c0202eec0889a732a298b9edb3488a2b"
  }, {
    "url": "assets/web-532xTi2A.js",
    "revision": null
  }, {
    "url": "assets/index-Fu95abIM.css",
    "revision": null
  }, {
    "url": "assets/index-BDcWGan7.js",
    "revision": null
  }, {
    "url": "assets/esm-CQHI8HNK.js",
    "revision": null
  }, {
    "url": "apple-touch-icon.png",
    "revision": "001ce5822169df84520451f18d1472d5"
  }, {
    "url": "favicon.png",
    "revision": "7df4bce571724780e4fb7711d00f3694"
  }, {
    "url": "icon.svg",
    "revision": "67226f1cdc7aacfd4b868e79a9f6caf0"
  }, {
    "url": "pwa-192x192.png",
    "revision": "2c8a52cef5ee8b7ffd9ea12b1b1809a5"
  }, {
    "url": "pwa-512x512.png",
    "revision": "9178514f8af84d158d3a8fcd7d46e98d"
  }, {
    "url": "manifest.webmanifest",
    "revision": "2de1881db7e98077602ce261cbd85925"
  }], {});
  workbox.cleanupOutdatedCaches();
  workbox.registerRoute(new workbox.NavigationRoute(workbox.createHandlerBoundToURL("index.html")));

}));
