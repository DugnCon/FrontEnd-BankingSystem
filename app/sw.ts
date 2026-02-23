// app/sw.ts
/// <reference lib="WebWorker" />

import { defaultCache } from '@serwist/next/worker';
import type { PrecacheEntry, SerwistGlobalConfig } from 'serwist';
import { Serwist, NetworkFirst, CacheFirst } from 'serwist';  // Import trực tiếp từ 'serwist'

// Optional: ExpirationPlugin từ scoped package
import { ExpirationPlugin } from '@serwist/expiration';

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST || [],  // Fallback [] ở dev
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    // Cache API calls - NetworkFirst
    {
      matcher: /^https?.*\/api\/.*$/i,
      handler: new NetworkFirst({
        cacheName: 'api-responses',
        plugins: [
          new ExpirationPlugin({
            maxEntries: 100,
            maxAgeSeconds: 24 * 60 * 60, // 1 ngày
            purgeOnQuotaError: true,
          }),
        ],
        networkTimeoutSeconds: 10,
      }),
    },
    // Cache Plaid assets - CacheFirst
    {
      matcher: /plaid\.com/i,
      handler: new CacheFirst({
        cacheName: 'plaid-assets',
        plugins: [
          new ExpirationPlugin({
            maxAgeSeconds: 30 * 24 * 60 * 60, // 30 ngày
            purgeOnQuotaError: true,
          }),
        ],
      }),
    },
    // Default cache cho static resources (images, fonts, JS/CSS...)
    ...defaultCache,
  ],
  precacheOptions: {
    cleanupOutdatedCaches: true,
    ignoreURLParametersMatching: [/.*/],
  },
});

serwist.addEventListeners();