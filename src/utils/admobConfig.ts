/**
 * Google AdMob Production Ad Unit IDs
 * Configured for AZ OVERVERSE (com.azoververse.app)
 */

export const ADMOB_CONFIG = {
  // Publisher ID
  PUBLISHER_ID: 'pub-7570164094154420',

  // Application ID: Initialized in AndroidManifest.xml, capacitor.config.json, and app.json
  APP_ID: 'ca-app-pub-7570164094154420~3142297870',

  // Production Banner Ad Unit ID
  BANNER_ID: 'ca-app-pub-7570164094154420/3068852398',

  // Production Interstitial Ad Unit ID
  INTERSTITIAL_ID: 'ca-app-pub-7570164094154420/2379433436',

  // Mapped full-screen slots to the production Interstitial Ad Unit ID
  APP_OPEN_ID: 'ca-app-pub-7570164094154420/2379433436',
  REWARDED_INTERSTITIAL_ID: 'ca-app-pub-7570164094154420/2379433436',
  REWARDED_ADS_ID: 'ca-app-pub-7570164094154420/2379433436',
} as const;

// Backwards-compatible export alias
export const ADMOB_TEST_CONFIG = ADMOB_CONFIG;

export type AdMobUnitKey = keyof typeof ADMOB_CONFIG;
