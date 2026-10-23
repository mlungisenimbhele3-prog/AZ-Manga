export type MonetizationModel = 'hybrid' | 'ad_supported' | 'subscription_only';

export type AccessType = 'free' | 'premium';

export interface ChapterDialog {
  speaker: string;
  text: string;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
}

export interface ChapterPage {
  id: string;
  pageNumber: number;
  imageUrl: string;
  caption?: string;
  dialogs?: ChapterDialog[];
}

export interface Chapter {
  id: string;
  mangaId: string;
  number: number;
  title: string;
  releaseDate: string;
  pageCount: number;
  accessType: AccessType;
  pages: ChapterPage[];
  likesCount: number;
  commentsCount: number;
  isUnlockedForFreeSession?: boolean;
  isEarlyAccess?: boolean;
  earlyAccessDaysLeft?: number;
  earlyAccessReleaseDate?: string;
  isExclusiveBonus?: boolean;
}

export interface MangaAward {
  id: string;
  category: string;
  year: number;
  badge: string;
  isWinner: boolean;
  citation: string;
}

export interface AwardCategory {
  id: string;
  title: string;
  subtitle: string;
  year: number;
  winnerMangaId: string;
  winnerCitation: string;
  nominees: {
    mangaId: string;
    nominationReason: string;
    votes: number;
  }[];
}

export interface AiDetectionResult {
  isAiGenerated: boolean;
  confidenceScore: number; // 0 to 100
  detectedFeatures: string[];
  modelFingerprint?: string;
  detectedAt: string;
  bannedStatus: 'clean' | 'ai_labeled' | 'auto_banned';
  banReason?: string;
  scanLog?: string[];
  inspectorNotes?: string;
}

export type MangaApprovalStatus = 'approved' | 'pending_review' | 'rejected' | 'draft';

export type MangakaStatus = 'none' | 'pending' | 'approved' | 'rejected';

export interface MangakaApplication {
  id: string;
  userId?: string;
  userEmail: string;
  legalName: string;
  penName: string;
  bio: string;
  idPhotoUrl: string; // ID document / photo verification
  portfolioUrl?: string;
  country: string;
  region: string;
  primaryGenres: string[];
  submittedAt: string;
  status: MangakaStatus;
  reviewedAt?: string;
  reviewedBy?: string;
  adminNotes?: string;
}

export interface Manga {
  id: string;
  title: string;
  japaneseTitle?: string;
  author: string;
  artist: string;
  coverImage: string;
  cover?: string;
  coverUrl?: string;
  bannerImage: string;
  genres: string[];
  status: 'ONGOING' | 'COMPLETED';
  synopsis: string;
  rating: number;
  views: number;
  bookmarksCount: number;
  monetizationModel: MonetizationModel;
  chapters: Chapter[];
  featured?: boolean;
  isOriginal?: boolean; // AZ Originals vs Backdrop
  isBackdrop?: boolean;
  isCanvas?: boolean; // backward compatibility alias
  isOwnedIP?: boolean;
  order?: number;
  weeklyRank?: number;
  award?: MangaAward;
  isAiGenerated?: boolean;
  aiConfidenceScore?: number;
  isBanned?: boolean;
  banReason?: string;
  aiDetection?: AiDetectionResult;
  approvalStatus?: MangaApprovalStatus;
  submittedByEmail?: string;
  rejectionReason?: string;
  submittedAt?: string;
  publishedAt?: string;
  createdAt?: string;
  isNew?: boolean;
  isComingSoon?: boolean;
  bonusContent?: BonusContentItem[];
}

export const isMangaComingSoon = (manga?: Manga | null): boolean => {
  if (!manga) return false;
  if (manga.isComingSoon === true) return true;
  if (!manga.chapters || manga.chapters.length === 0) return true;
  return manga.chapters.every((c) => !c.pages || c.pages.length === 0);
};

export type SubscriptionTier = 'free' | 'vip' | 'early_access' | 'patron';

export interface BonusContentItem {
  id: string;
  mangaId: string;
  title: string;
  category: 'omake' | 'sketch' | 'lore' | 'wallpaper' | 'commentary';
  description: string;
  coverImage: string;
  previewUrl?: string;
  pages?: string[];
  authorNote?: string;
  resolution?: string;
  downloadUrl?: string;
  publishedDate: string;
  exclusiveTier: 'patron' | 'early_access';
}

export interface SubscriptionInvoice {
  id: string;
  invoiceNumber: string;
  date: string;
  tier: SubscriptionTier;
  planName: string;
  amountUSD: number;
  amountZAR: number;
  billingCycle: 'monthly' | 'yearly';
  paymentMethod: string;
  paymentMethodDetails?: string;
  status: 'paid' | 'pending' | 'refunded';
  taxAmountUSD?: number;
  creatorPoolUSD?: number;
}

export interface UserSubscription {
  tier: SubscriptionTier;
  planName: string;
  price: string;
  activeSince: string;
  expiresAt: string;
  autoRenew: boolean;
  perks: string[];
  unlockedChapters: string[]; // IDs of chapters temporarily unlocked via rewarded ads
  billingCycle?: 'monthly' | 'yearly';
  status?: 'active' | 'cancelled_at_period_end' | 'expired';
  paymentMethodSummary?: string;
  invoices?: SubscriptionInvoice[];
  nextBillingDate?: string;
  currency?: 'USD' | 'ZAR';
}

export interface AdData {
  id: string;
  title: string;
  advertiser: string;
  description: string;
  ctaText: string;
  tagline: string;
  badge: string;
  imageUrl: string;
  accentColor: string;
}

export interface SouthAfricanBank {
  id: string;
  name: string;
  universalBranchCode: string;
  popular?: boolean;
}

export type PayoutProviderType = 'google_play' | 'admob';

export interface GooglePlayPayoutDetails {
  merchantId: string;
  developerAccountName: string;
}

export interface AdMobPayoutDetails {
  publisherId: string;
  accountName: string;
}

export interface CreatorPayoutSettings {
  preferredProvider: PayoutProviderType;
  googlePlay?: GooglePlayPayoutDetails;
  admob?: AdMobPayoutDetails;
  autoPayoutEnabled: boolean;
  minPayoutThresholdUSD: number;
}

export interface PayoutTransaction {
  id: string;
  date: string;
  amountUSD: number;
  amountZAR: number;
  exchangeRate: number;
  provider: PayoutProviderType;
  providerReference: string;
  destinationSummary: string;
  revenueSource: '70% Ads & Subscriptions' | '70% Ad Monetization' | '70% Subscription Pool';
  status: 'COMPLETED' | 'PROCESSING' | 'PENDING';
}

export interface CreatorStats {
  totalRevenueUSD: number;
  monthlyAdRevenue: number;
  monthlySubShareRevenue: number;
  totalReads: number;
  adImpressions: number;
  subscriberViews: number;
  ecpm: number;
  payoutSettings?: CreatorPayoutSettings;
  payoutHistory?: PayoutTransaction[];
}

export interface ReadingSettings {
  mode: 'webtoon' | 'single-page' | 'double-page';
  direction: 'vertical' | 'ltr';
  theme: 'black' | 'dark' | 'sepia' | 'light';
  zoom: number; // 70 to 130
  autoScroll: boolean;
  scrollSpeed: number;
}

export interface Comment {
  id: string;
  mangaId: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: string;
  chapterNumber?: number;
  userBadge?: string;
  likes?: number;
}
