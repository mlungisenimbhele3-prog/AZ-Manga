// REAL MODE - LIVE
export const AVAILABLE_BALANCE = 0;
export const DISPATCHED = 0;
export const isDemo = false;

import { CreatorPayoutSettings, PayoutTransaction } from '../types';

export const USD_TO_ZAR_RATE = 18.25; // 1 USD = 18.25 ZAR

export const INITIAL_CREATOR_PAYOUT_SETTINGS: CreatorPayoutSettings = {
  preferredProvider: 'google_play',
  googlePlay: {
    merchantId: 'GPLAY-MERCHANT-882910',
    developerAccountName: 'AZ Oververse Creator Studio',
  },
  admob: {
    publisherId: 'pub-7570164094154420',
    accountName: 'AZ Oververse AdMob Revenue Pool',
  },
  autoPayoutEnabled: true,
  minPayoutThresholdUSD: 50,
};

export const INITIAL_PAYOUT_HISTORY: PayoutTransaction[] = [];
