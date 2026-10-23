import { SubscriptionTier, SubscriptionInvoice, BonusContentItem } from '../types';
import { USD_TO_ZAR_RATE } from './paymentData';

export interface SubscriptionPlanDefinition {
  id: SubscriptionTier;
  name: string;
  shortName: string;
  tagline: string;
  badge: string;
  priceMonthlyUSD: number;
  priceYearlyUSD: number;
  perks: string[];
  keyPerk: string;
  popular?: boolean;
  bestValue?: boolean;
  accentColor: string;
  ringColor: string;
  gradient: string;
}

export const SUBSCRIPTION_PLANS: SubscriptionPlanDefinition[] = [
  {
    id: 'free',
    name: 'Free Reader',
    shortName: 'Free',
    tagline: 'Standard access funded by community sponsors and ad breaks',
    badge: 'Standard',
    priceMonthlyUSD: 0,
    priceYearlyUSD: 0,
    perks: [
      'Access to standard catalog manga chapters',
      'Ad-supported reading (Banners & Interstitials)',
      'Unlock VIP chapters with 10-second rewarded ads',
      'Standard FHD image resolution',
      'Sync favorites & reading streak',
    ],
    keyPerk: 'Ad-Supported Reading',
    accentColor: 'slate',
    ringColor: 'border-slate-700',
    gradient: 'from-slate-900 via-slate-900 to-slate-950',
  },
  {
    id: 'vip',
    name: 'VIP Pass (Ad-Free)',
    shortName: 'VIP Pass',
    tagline: 'Complete uninterrupted reading with zero advertisements',
    badge: 'Zero Ads',
    priceMonthlyUSD: 4.99,
    priceYearlyUSD: 47.9,
    perks: [
      '100% Ad-Free reading (Zero banner breaks or interstitials)',
      'Instant access to all VIP Simulpub chapters',
      'Ultra-HD uncompressed crystal-clear page scans',
      'Offline reader downloads & local cache',
      '70% routed directly to African creator payout pool',
      'VIP Member reader badge in comments',
    ],
    keyPerk: '100% Ad-Free Reading & Ultra-HD Scans',
    popular: true,
    accentColor: 'amber',
    ringColor: 'border-amber-400',
    gradient: 'from-amber-950/40 via-slate-900 to-slate-900',
  },
  {
    id: 'early_access',
    name: 'Pro Early Access',
    shortName: 'Pro Early Access',
    tagline: 'Read chapters 7 to 14 days before public drop with high-speed CDN',
    badge: 'Fast-Pass',
    priceMonthlyUSD: 7.99,
    priceYearlyUSD: 74.9,
    perks: [
      'Everything in VIP Pass (100% Ad-Free + Ultra HD)',
      '⚡ Early Access to new chapters 7-14 days ahead of general release',
      'Priority high-speed CDN streaming bandwidth',
      'Exclusive Pro Early Access reader badge',
      'Verified early commenter reactions on drop day',
      '70% routed to African creator payout pool',
    ],
    keyPerk: '7-14 Days Early Access to New Chapters',
    accentColor: 'cyan',
    ringColor: 'border-cyan-400',
    gradient: 'from-cyan-950/50 via-slate-900 to-slate-900',
  },
  {
    id: 'patron',
    name: 'Creator Patron Pass',
    shortName: 'Creator Patron',
    tagline: 'Ultimate tier with exclusive bonus content & direct creator support',
    badge: 'All-Access + Bonus',
    priceMonthlyUSD: 11.99,
    priceYearlyUSD: 110.9,
    perks: [
      'Everything in Pro Early Access & VIP (Zero Ads + Early Access)',
      '✨ Exclusive Bonus Content: Behind-the-scenes sketches & concept notes',
      '🎨 Character design dossiers & 4K pan-African wallpapers',
      '📖 Exclusive full-color omake side-story manga chapters',
      '70% royalty allocation directly funding original artists',
      '👑 Exclusive Gold VIP Crown Patron Profile Badge',
      'Direct creator Q&A chat & priority community access',
    ],
    keyPerk: 'Exclusive Bonus Content + Concept Sketches + 70% Creator Funding',
    bestValue: true,
    accentColor: 'rose',
    ringColor: 'border-rose-400',
    gradient: 'from-purple-950/60 via-rose-950/30 to-slate-900',
  },
];

export const INITIAL_SAVED_PAYMENT_METHODS = [
  {
    id: 'pm-google-play',
    type: 'google_play' as const,
    providerName: 'Google Play Billing',
    accountLabel: 'Google Play Store Account (Primary)',
    isDefault: true,
  },
  {
    id: 'pm-admob',
    type: 'admob' as const,
    providerName: 'Google AdMob Rewarded & Banner Ads',
    accountLabel: 'Free Ad-Supported Chapter Unlocks',
    isDefault: false,
  },
];

export const INITIAL_SUBSCRIPTION_INVOICES: SubscriptionInvoice[] = [
  {
    id: 'inv-ka-2026-001',
    invoiceNumber: 'GPA.3381-8819-40219',
    date: '2026-09-01',
    tier: 'vip',
    planName: 'VIP Pass (Ad-Free) - Monthly',
    amountUSD: 4.99,
    amountZAR: Math.round(4.99 * USD_TO_ZAR_RATE * 100) / 100,
    billingCycle: 'monthly',
    paymentMethod: 'Google Play Billing',
    paymentMethodDetails: 'Google Play In-App Subscription · Play Console Verified',
    status: 'paid',
    taxAmountUSD: 0.65,
    creatorPoolUSD: 3.49,
  },
];

export const SAMPLE_BONUS_CONTENT: Record<string, BonusContentItem[]> = {
  placeholder: [
    {
      id: 'bonus-placeholder-1',
      mangaId: 'placeholder',
      title: 'AZ Oververse Production Roughs & Concept Art',
      category: 'sketch',
      description: 'Exclusive early drafts and concept sketches for upcoming AZ Oververse original titles.',
      coverImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
      previewUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
      pages: [
        'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80',
      ],
      authorNote: 'Exclusive for Patron tier supporters.',
      publishedDate: '2026-10-01',
      exclusiveTier: 'patron',
    },
  ],
};
