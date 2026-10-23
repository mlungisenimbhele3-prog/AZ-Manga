/**
 * Google AdMob Demo & Test Ad Unit IDs
 * Configured for AZ OVERVERSE
 */

export const ADMOB_TEST_CONFIG = {
  // Application ID: Initialized in AndroidManifest.xml and app.json
  APP_ID: 'ca-app-pub-3940256099942544~3347511713',

  // App Open Ad Unit ID (Test / Demo)
  APP_OPEN_ID: 'ca-app-pub-3940256099942544/9257395921',

  // Rewarded Interstitial Ad Unit ID (Test / Demo)
  REWARDED_INTERSTITIAL_ID: 'ca-app-pub-3940256099942544/5354046379',

  // Rewarded Ads Unit ID (Test / Demo)
  REWARDED_ADS_ID: 'ca-app-pub-3940256099942544/5224354917',

  // Standard Banner Ad Unit ID (Test / Demo)
  BANNER_ID: 'ca-app-pub-3940256099942544/6300978111',

  // Standard Interstitial Ad Unit ID (Test / Demo)
  INTERSTITIAL_ID: 'ca-app-pub-3940256099942544/1033173712',
} as const;

export type AdMobTestUnitKey = keyof typeof ADMOB_TEST_CONFIG;
