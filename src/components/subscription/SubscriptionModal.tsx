import React, { useState, useEffect } from 'react';
import { useCurrencyDetection } from '../../hooks/useCurrencyDetection';
import { SubscriptionTier, UserSubscription, SubscriptionInvoice } from '../../types';
import {
  Check,
  Sparkles,
  Zap,
  ShieldCheck,
  X,
  Heart,
  Star,
  Lock,
  ArrowRight,
  Gift,
  Crown,
  Receipt,
  FileText,
  Clock,
  AlertCircle,
  Smartphone,
  CheckCircle,
  Download,
  Printer,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import { USD_TO_ZAR_RATE } from '../../data/paymentData';
import {
  SUBSCRIPTION_PLANS,
  INITIAL_SAVED_PAYMENT_METHODS,
  INITIAL_SUBSCRIPTION_INVOICES,
} from '../../data/subscriptionData';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSubscription: UserSubscription;
  onUpdateSubscription: (
    tier: SubscriptionTier,
    billingCycle?: 'monthly' | 'yearly',
    newInvoice?: SubscriptionInvoice
  ) => void;
  initialTab?: 'plans' | 'manage' | 'history' | 'payment_methods';
  highlightTier?: SubscriptionTier;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  onClose,
  currentSubscription,
  onUpdateSubscription,
  initialTab = 'plans',
  highlightTier,
}) => {
  const { currency, isZA } = useCurrencyDetection();
  const [activeTab, setActiveTab] = useState<'plans' | 'manage' | 'history' | 'payment_methods'>(
    currentSubscription.tier !== 'free' && initialTab === 'plans' ? 'plans' : initialTab
  );

  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>(
    currentSubscription.billingCycle || 'yearly'
  );

  const [paymentProvider, setPaymentProvider] = useState<'google_play' | 'admob'>('google_play');
  const [currencyView, setCurrencyView] = useState<'USD' | 'ZAR'>(currency as 'USD' | 'ZAR');
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Invoices & Billing State
  const [invoices, setInvoices] = useState<SubscriptionInvoice[]>(() => {
    try {
      const saved = localStorage.getItem('ka_subscription_invoices');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return currentSubscription.invoices && currentSubscription.invoices.length > 0
      ? currentSubscription.invoices
      : INITIAL_SUBSCRIPTION_INVOICES;
  });

  // Selected invoice for receipt viewing modal
  const [selectedReceipt, setSelectedReceipt] = useState<SubscriptionInvoice | null>(null);

  // Cancellation modal
  const [showCancelPrompt, setShowCancelPrompt] = useState(false);

  useEffect(() => {
    setCurrencyView('ZAR');
  }, []);

  if (!isOpen) return null;

  const formatPrice = (usd: number) => {
    if (usd === 0) return 'R0.00';
    const zar = (usd * USD_TO_ZAR_RATE).toFixed(2);
    return `R${zar}`;
  };

  const handleGooglePlayBilling = (
    tierToBuy: SubscriptionTier = highlightTier || 'vip',
    cycleToBuy: 'monthly' | 'yearly' = billingCycle
  ) => {
    setIsProcessing(true);
    const targetPlan = SUBSCRIPTION_PLANS.find((p) => p.id === tierToBuy) || SUBSCRIPTION_PLANS[1];
    const amountUSD = cycleToBuy === 'yearly' ? targetPlan.priceYearlyUSD : targetPlan.priceMonthlyUSD;
    const amountZAR = Math.round(amountUSD * USD_TO_ZAR_RATE * 100) / 100;

    setTimeout(() => {
      const newInv: SubscriptionInvoice = {
        id: `inv-gplay-${Date.now()}`,
        invoiceNumber: `GPA.${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(10000 + Math.random() * 90000)}`,
        date: new Date().toISOString().split('T')[0],
        tier: tierToBuy,
        planName: `${targetPlan.name} (${cycleToBuy === 'yearly' ? 'Annual Pass' : 'Monthly'})`,
        amountUSD,
        amountZAR,
        billingCycle: cycleToBuy,
        paymentMethod: 'Google Play Billing',
        paymentMethodDetails: 'Google Play In-App Purchase · Play Console Verified',
        status: 'paid',
        taxAmountUSD: Math.round(amountUSD * 0.15 * 100) / 100,
        creatorPoolUSD: Math.round(amountUSD * 0.7 * 100) / 100,
      };

      const updatedInvoices = [newInv, ...invoices];
      setInvoices(updatedInvoices);
      try {
        localStorage.setItem('ka_subscription_invoices', JSON.stringify(updatedInvoices));
      } catch (e) {
        console.error(e);
      }

      onUpdateSubscription(tierToBuy, cycleToBuy, newInv);
      setIsProcessing(false);
      setSuccessMessage(
        `Google Play Billing verified! Welcome to ${targetPlan.name}. 70% (R${((newInv.creatorPoolUSD || 3.49) * USD_TO_ZAR_RATE).toFixed(2)}) routed directly to manga creators.`
      );

      setTimeout(() => {
        setSuccessMessage(null);
        setActiveTab('manage');
      }, 2200);
    }, 1000);
  };

  const handleStartPurchase = (tier: SubscriptionTier, cycle: 'monthly' | 'yearly' = billingCycle) => {
    if (tier === 'free') {
      onUpdateSubscription('free', 'monthly');
      setSuccessMessage('Switched to Free Reader plan (Google AdMob supported).');
      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 1600);
      return;
    }

    handleGooglePlayBilling(tier, cycle);
  };

  const handleToggleAutoRenew = () => {
    const nextStatus = currentSubscription.autoRenew ? 'cancelled_at_period_end' : 'active';
    const updated = {
      ...currentSubscription,
      autoRenew: !currentSubscription.autoRenew,
      status: nextStatus as any,
    };
    onUpdateSubscription(currentSubscription.tier, currentSubscription.billingCycle);
    setShowCancelPrompt(false);
    setSuccessMessage(
      currentSubscription.autoRenew
        ? 'Auto-renewal turned off. Your premium perks will remain active until the end of your billing cycle.'
        : 'Auto-renewal restored! Seamless uninterrupted reading enabled.'
    );
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  return (
    <div
      id="subscription-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-5 overflow-y-auto"
    >
      <div
        id="subscription-modal"
        className="relative my-2 sm:my-6 w-full max-w-5xl max-h-[95vh] flex flex-col rounded-3xl border border-slate-700 bg-slate-900 text-white shadow-2xl overflow-hidden"
      >
        {/* Top Header */}
        <div className="relative border-b border-slate-800 bg-gradient-to-r from-purple-950/70 via-slate-900 to-amber-950/60 px-6 pt-6 pb-5 shrink-0">
          <button
            id="subscription-modal-close-btn"
            onClick={onClose}
            className="absolute top-4 right-4 z-10 rounded-full bg-slate-800/80 p-2 text-slate-400 hover:text-white hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-black shadow">
                  <Crown className="w-5 h-5 fill-black" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-white">
                    AZ OVERVERSE Subscription & In-App Purchases
                  </h2>
                  <p className="text-xs text-slate-300">
                    Secure payment processing with 70% direct creator revenue sharing
                  </p>
                </div>
              </div>
            </div>

            {/* Currency & Live Exchange Badge */}
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 px-3 py-1 text-xs font-bold font-mono">
                🇿🇦 South African Rands (ZAR)
              </span>
            </div>
          </div>

          {/* Sub Navigation Tabs */}
          <div className="mt-5 flex items-center gap-2 border-b border-slate-800/80 -mb-5 pb-0 overflow-x-auto no-scrollbar">
            <button
              id="sub-tab-plans"
              onClick={() => setActiveTab('plans')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition whitespace-nowrap ${
                activeTab === 'plans'
                  ? 'border-amber-400 text-amber-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Browse Plans & Purchase</span>
            </button>

            <button
              id="sub-tab-manage"
              onClick={() => setActiveTab('manage')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition whitespace-nowrap ${
                activeTab === 'manage'
                  ? 'border-amber-400 text-amber-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>My Subscription & Billing</span>
              {currentSubscription.tier !== 'free' && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                  Active
                </span>
              )}
            </button>

            <button
              id="sub-tab-history"
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition whitespace-nowrap ${
                activeTab === 'history'
                  ? 'border-amber-400 text-amber-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Receipt className="w-4 h-4" />
              <span>Invoices & Receipts ({invoices.length})</span>
            </button>

            <button
              id="sub-tab-payment-methods"
              onClick={() => setActiveTab('payment_methods')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition whitespace-nowrap ${
                activeTab === 'payment_methods'
                  ? 'border-amber-400 text-amber-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span>Google Play & AdMob</span>
            </button>
          </div>
        </div>

        {/* Success Alert Banner */}
        {successMessage && (
          <div className="mx-6 mt-4 rounded-xl bg-emerald-500/20 border border-emerald-500/50 p-4 text-center text-emerald-300 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 animate-in fade-in">
            <CheckCircle className="w-5 h-5 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Tab 1: Browse Plans & In-App Purchase */}
        {activeTab === 'plans' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            {/* Billing Interval & 70% Creator Revenue Share Banner */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800">
              <div className="inline-flex items-center gap-2 rounded-full bg-slate-900 p-1 border border-slate-700">
                <button
                  id="cycle-monthly-btn"
                  onClick={() => setBillingCycle('monthly')}
                  className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                    billingCycle === 'monthly'
                      ? 'bg-amber-500 text-black font-bold shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Monthly Billing
                </button>
                <button
                  id="cycle-yearly-btn"
                  onClick={() => setBillingCycle('yearly')}
                  className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-black transition ${
                    billingCycle === 'yearly'
                      ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-black shadow'
                      : 'text-amber-400 hover:text-white'
                  }`}
                >
                  <Crown className="w-3.5 h-3.5 fill-black" />
                  <span>Annual Pass (Save 20% + 2 Mos Free)</span>
                </button>
              </div>

              <div className="flex items-center gap-2 text-xs text-emerald-300">
                <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>
                  <strong>70% Payout Guaranteed</strong> directly to African creators
                </span>
              </div>
            </div>

            {/* Plans Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {SUBSCRIPTION_PLANS.map((plan, pIdx) => {
                const isCurrent = currentSubscription.tier === plan.id;
                const price =
                  billingCycle === 'yearly'
                    ? formatPrice(plan.priceYearlyUSD)
                    : formatPrice(plan.priceMonthlyUSD);

                const monthlyEquiv =
                  billingCycle === 'yearly' && plan.priceYearlyUSD > 0
                    ? formatPrice(plan.priceYearlyUSD / 12)
                    : null;

                const isHighlighted = highlightTier === plan.id;

                return (
                  <div
                    key={`sub-plan-${plan.id}-${pIdx}`}
                    id={`plan-card-${plan.id}`}
                    className={`relative rounded-2xl border-2 p-5 flex flex-col justify-between transition-all bg-gradient-to-b ${plan.gradient} ${
                      isCurrent
                        ? 'border-purple-400 shadow-xl ring-2 ring-purple-500/40'
                        : isHighlighted
                        ? 'border-amber-400 ring-2 ring-amber-400/50'
                        : plan.popular
                        ? 'border-amber-500/80 shadow-lg'
                        : plan.bestValue
                        ? 'border-rose-500/80 shadow-lg'
                        : 'border-slate-800'
                    }`}
                  >
                    {/* Badge */}
                    {plan.popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 px-3 py-0.5 text-[9px] font-black uppercase tracking-wider text-black shadow">
                        ★ MOST POPULAR • ZERO ADS
                      </div>
                    )}
                    {plan.bestValue && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-rose-500 to-purple-500 px-3 py-0.5 text-[9px] font-black uppercase tracking-wider text-white shadow">
                        👑 ALL-ACCESS + BONUS CONTENT
                      </div>
                    )}
                    {plan.id === 'early_access' && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 px-3 py-0.5 text-[9px] font-black uppercase tracking-wider text-black shadow">
                        ⚡ 7-14 DAYS EARLY DROP
                      </div>
                    )}

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-bold text-base text-white">{plan.name}</h3>
                        {isCurrent && (
                          <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-500/30 text-purple-200 border border-purple-500/40">
                            Current
                          </span>
                        )}
                      </div>

                      <div className="mb-3">
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl sm:text-3xl font-black text-white">{price}</span>
                          <span className="text-xs text-slate-400">
                            {plan.priceMonthlyUSD === 0
                              ? ' / forever'
                              : billingCycle === 'yearly'
                              ? ' / year'
                              : ' / month'}
                          </span>
                        </div>
                        {monthlyEquiv && (
                          <div className="text-[11px] font-mono text-emerald-400 mt-0.5">
                            ≈ {monthlyEquiv}/mo (2 Months Free!)
                          </div>
                        )}
                      </div>

                      <p className="text-xs text-slate-300 mb-4 leading-relaxed">{plan.tagline}</p>

                      {/* Key Perk Pill */}
                      <div className="mb-4 rounded-xl bg-slate-950/70 p-2 border border-slate-800 text-[11px] font-semibold text-amber-300 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>{plan.keyPerk}</span>
                      </div>

                      {/* Perks List */}
                      <ul className="space-y-2 text-xs text-slate-300 mb-5">
                        {plan.perks.map((perk, idx) => (
                          <li key={`perk-${plan.id}-${idx}`} className="flex items-start gap-2">
                            <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                            <span className="leading-tight">{perk}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Action Button */}
                    <button
                      id={`select-tier-${plan.id}-btn`}
                      disabled={isCurrent && currentSubscription.billingCycle === billingCycle || isProcessing}
                      onClick={() => handleStartPurchase(plan.id, billingCycle)}
                      className={`w-full rounded-xl py-2.5 text-xs font-black transition shadow flex items-center justify-center gap-1.5 ${
                        isCurrent && currentSubscription.billingCycle === billingCycle
                          ? 'bg-slate-800 text-slate-400 cursor-default'
                          : plan.id === 'patron'
                          ? 'bg-gradient-to-r from-rose-500 to-amber-500 hover:opacity-95 text-white font-extrabold'
                          : plan.id === 'early_access'
                          ? 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:opacity-95 text-black font-extrabold'
                          : plan.id === 'vip'
                          ? 'bg-gradient-to-r from-amber-500 to-yellow-400 hover:opacity-95 text-black font-extrabold'
                          : 'border border-slate-700 hover:bg-slate-800 text-slate-300'
                      }`}
                    >
                      {isCurrent && currentSubscription.billingCycle === billingCycle ? (
                        <span>Active Plan</span>
                      ) : isCurrent && currentSubscription.billingCycle !== billingCycle ? (
                        <span>Switch to {billingCycle === 'yearly' ? 'Annual Pass' : 'Monthly'}</span>
                      ) : plan.id === 'free' ? (
                        <span>Downgrade to Free</span>
                      ) : (
                        <span>
                          Subscribe ({price})
                        </span>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Official Monetization Channels: Google Play Billing & Google AdMob ONLY */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Supported Monetization & Billing Channels</span>
                </span>
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Google Play Store · Google AdMob Verified</span>
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  id="provider-google-play-btn"
                  type="button"
                  onClick={() => setPaymentProvider('google_play')}
                  className={`min-h-[56px] p-4 rounded-xl border flex items-center gap-3 text-left transition ${
                    paymentProvider === 'google_play'
                      ? 'border-emerald-400 bg-emerald-500/15 text-white shadow'
                      : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-white'
                  }`}
                >
                  <Smartphone className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <span className="text-xs font-bold block">Google Play Billing</span>
                    <span className="text-[11px] text-slate-400 block">
                      In-App Subscriptions (VIP, Early Access & Patron)
                    </span>
                  </div>
                </button>

                <button
                  id="provider-admob-btn"
                  type="button"
                  onClick={() => setPaymentProvider('admob')}
                  className={`min-h-[56px] p-4 rounded-xl border flex items-center gap-3 text-left transition ${
                    paymentProvider === 'admob'
                      ? 'border-amber-400 bg-amber-500/15 text-white shadow'
                      : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-white'
                  }`}
                >
                  <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
                  <div>
                    <span className="text-xs font-bold block">Google AdMob</span>
                    <span className="text-[11px] text-slate-400 block">
                      Persistent Bottom Banner & Watch Ad Chapter Unlocks
                    </span>
                  </div>
                </button>
              </div>

              {paymentProvider === 'google_play' ? (
                <div className="pt-2 space-y-3 bg-slate-900/90 p-4 sm:p-5 rounded-2xl border border-emerald-500/40">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                    <div>
                      <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Google Play In-App Billing</span>
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Official Google Play Store subscription billing with 70% direct creator revenue share.
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-slate-300 block">
                        Selected: {SUBSCRIPTION_PLANS.find((p) => p.id === (highlightTier || 'vip'))?.name} ({billingCycle === 'yearly' ? 'Annual Pass' : 'Monthly'})
                      </span>
                      <span className="text-sm font-black text-amber-400 font-mono tabular-nums">
                        R{(((billingCycle === 'yearly' ? (SUBSCRIPTION_PLANS.find((p) => p.id === (highlightTier || 'vip'))?.priceYearlyUSD || 47.9) : (SUBSCRIPTION_PLANS.find((p) => p.id === (highlightTier || 'vip'))?.priceMonthlyUSD || 4.99)) * USD_TO_ZAR_RATE)).toFixed(2)} ZAR
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => handleGooglePlayBilling(highlightTier || 'vip', billingCycle)}
                    className="min-h-[48px] w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs active:scale-95 transition shadow-lg flex items-center justify-center gap-2 whitespace-nowrap"
                  >
                    {isProcessing ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4 shrink-0" />
                        <span>Subscribe with Google Play</span>
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="pt-2 space-y-3 bg-slate-900/90 p-4 sm:p-5 rounded-2xl border border-amber-500/40">
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Google AdMob Free Ad-Supported Access</span>
                  </h4>
                  <p className="text-[11px] text-slate-300">
                    Read for free with our persistent Google AdMob bottom banner and unlock next chapters anytime using the "Watch ad to unlock next chapter" rewarded video button.
                  </p>
                  <button
                    type="button"
                    onClick={() => handleStartPurchase('free', 'monthly')}
                    className="min-h-[48px] w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs transition whitespace-nowrap"
                  >
                    Continue with Google AdMob (Free)
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Manage My Subscription & Billing */}
        {activeTab === 'manage' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
            {/* Active Plan Card */}
            <div className="rounded-3xl border-2 border-purple-500/60 bg-gradient-to-br from-purple-950/50 via-slate-900 to-slate-950 p-6 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40">
                      CURRENT ACTIVE SUBSCRIPTION
                    </span>
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span>
                        {currentSubscription.autoRenew ? 'Auto-Renewing' : 'Expires at period end'}
                      </span>
                    </span>
                  </div>
                  <h3 className="text-2xl font-black text-white mt-1">
                    {currentSubscription.planName}
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Member active since {currentSubscription.activeSince}
                  </p>
                </div>

                <div className="text-left sm:text-right">
                  <div className="text-3xl font-black text-white">{currentSubscription.price}</div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    Billing Cycle: {currentSubscription.billingCycle === 'yearly' ? 'Annual Pass' : 'Monthly'}
                  </div>
                  <div className="text-xs text-amber-400 mt-1">
                    Renewal Date: {currentSubscription.expiresAt}
                  </div>
                </div>
              </div>

              {/* Perks Checklist */}
              <div className="py-4">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
                  Active Features & Unlocked Benefits:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-200">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Ad-Free Reading: Zero banner breaks or interstitials</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Ultra-HD uncompressed manga image delivery</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>
                      {currentSubscription.tier === 'early_access' || currentSubscription.tier === 'patron'
                        ? '⚡ Pro Early Access: 7-14 Days Fast-Pass Drop active'
                        : 'Standard Simulpub Access (Upgrade for Early Access)'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>
                      {currentSubscription.tier === 'patron'
                        ? '✨ Exclusive Bonus Content & Sketches Unlocked'
                        : 'Bonus content locked (Upgrade to Patron to unlock)'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveTab('plans')}
                    className="rounded-xl bg-amber-500 hover:bg-amber-400 px-4 py-2 text-xs font-bold text-black transition shadow"
                  >
                    Change Plan / Upgrade
                  </button>
                  <button
                    onClick={() => setActiveTab('history')}
                    className="rounded-xl border border-slate-700 hover:bg-slate-800 px-4 py-2 text-xs font-bold text-slate-300 transition"
                  >
                    View Invoices
                  </button>
                </div>

                <div>
                  {currentSubscription.tier !== 'free' && (
                    <button
                      onClick={() => setShowCancelPrompt(true)}
                      className="text-xs text-rose-400 hover:text-rose-300 underline font-semibold transition"
                    >
                      {currentSubscription.autoRenew ? 'Cancel Subscription Auto-Renew' : 'Manage Cancellation'}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Cancellation Confirmation Prompt */}
            {showCancelPrompt && (
              <div className="rounded-2xl border border-rose-500/50 bg-rose-950/30 p-5 animate-in fade-in space-y-3">
                <div className="flex items-center gap-2 text-rose-300 font-bold text-sm">
                  <AlertCircle className="w-5 h-5 text-rose-400" />
                  <span>Are you sure you want to cancel auto-renewal?</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Your premium perks (Ad-free reading, uncompressed HD pages, and early access) will remain fully active until your current billing period ends on <strong>{currentSubscription.expiresAt}</strong>. You will not be billed again unless you reactivate.
                </p>
                <div className="flex items-center gap-3 pt-1">
                  <button
                    onClick={handleToggleAutoRenew}
                    className="rounded-xl bg-rose-600 hover:bg-rose-500 px-4 py-2 text-xs font-bold text-white transition shadow"
                  >
                    Confirm Turn Off Auto-Renew
                  </button>
                  <button
                    onClick={() => setShowCancelPrompt(false)}
                    className="rounded-xl border border-slate-700 hover:bg-slate-800 px-4 py-2 text-xs font-bold text-slate-300 transition"
                  >
                    Keep Subscription
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Invoices & Receipts */}
        {activeTab === 'history' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-white">Billing History & Tax Receipts</h3>
                <p className="text-xs text-slate-400">
                  Compliant with South African VAT, international receipt standards & 70% Creator Allocation
                </p>
              </div>
            </div>

            {invoices.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-slate-800 rounded-2xl text-slate-400 text-xs">
                No past transactions recorded yet.
              </div>
            ) : (
              <div className="divide-y divide-slate-800 rounded-2xl border border-slate-800 bg-slate-950/60 overflow-hidden">
                {invoices.map((inv, idx) => (
                  <div
                    key={`sub-inv-${inv.id}-${idx}`}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-900/60 transition"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-amber-400">
                          {inv.invoiceNumber}
                        </span>
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          {inv.status.toUpperCase()}
                        </span>
                      </div>
                      <h4 className="text-sm font-semibold text-white mt-0.5">{inv.planName}</h4>
                      <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                        <span>{inv.date}</span>
                        <span>•</span>
                        <span>{inv.paymentMethod}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm font-black text-white">
                          R{inv.amountZAR.toFixed(2)} ZAR
                        </div>
                        <div className="text-[11px] font-mono text-emerald-400">
                          Paid
                        </div>
                      </div>

                      <button
                        onClick={() => setSelectedReceipt(inv)}
                        className="flex items-center gap-1.5 rounded-xl border border-slate-700 hover:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 transition"
                      >
                        <FileText className="w-3.5 h-3.5 text-amber-400" />
                        <span>View Receipt</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Payment Methods */}
        {activeTab === 'payment_methods' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            <div>
              <h3 className="font-bold text-base text-white">Active Monetization & Billing Channels</h3>
              <p className="text-xs text-slate-400">
                All app transactions and free chapter unlocks run strictly through Google Play Billing and Google AdMob.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {INITIAL_SAVED_PAYMENT_METHODS.map((pm, idx) => (
                <div
                  key={`sub-pm-${pm.id}-${idx}`}
                  className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                      {pm.type === 'google_play' ? (
                        <Smartphone className="w-5 h-5" />
                      ) : (
                        <Sparkles className="w-5 h-5 text-amber-400" />
                      )}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">{pm.providerName}</div>
                      <div className="text-[11px] text-slate-400">{pm.accountLabel}</div>
                    </div>
                  </div>

                  <span className="text-[11px] font-semibold text-emerald-400">
                    {pm.isDefault ? 'Primary' : 'Active'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="border-t border-slate-800 bg-slate-950/90 px-6 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400 shrink-0">
          <div className="flex items-center gap-2 text-slate-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Powered exclusively by Google Play Billing & Google AdMob.</span>
          </div>

          <div className="flex items-center gap-3">
            <span>Instant Activation</span>
            <span>·</span>
            <span className="text-emerald-400 font-bold">70% to Original Creators</span>
            <span>·</span>
            <span>Cancel Anytime</span>
          </div>
        </div>

        {/* Selected Receipt Viewer Modal */}
        {selectedReceipt && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm animate-in fade-in">
            <div className="w-full max-w-lg rounded-3xl border border-slate-700 bg-slate-900 p-6 text-white shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-amber-400" />
                  <span className="text-sm font-bold text-white">Official Tax Invoice & Receipt</span>
                </div>
                <button
                  onClick={() => setSelectedReceipt(null)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs bg-slate-950 p-4 rounded-2xl border border-slate-800">
                <div className="flex justify-between border-b border-slate-800/80 pb-2">
                  <span className="text-slate-400">Invoice Number:</span>
                  <span className="font-mono font-bold text-amber-400">
                    {selectedReceipt.invoiceNumber}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Date Issued:</span>
                  <span className="text-white">{selectedReceipt.date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Description:</span>
                  <span className="text-white font-semibold">{selectedReceipt.planName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Payment Channel:</span>
                  <span className="text-slate-300">{selectedReceipt.paymentMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Status:</span>
                  <span className="text-emerald-400 font-bold uppercase">
                    {selectedReceipt.status}
                  </span>
                </div>
                <div className="flex justify-between border-t border-slate-800 pt-2 font-bold text-sm">
                  <span className="text-white">Total Paid:</span>
                  <span className="text-amber-400 font-mono">
                    R{selectedReceipt.amountZAR.toFixed(2)} ZAR
                  </span>
                </div>
                <div className="rounded-lg bg-emerald-950/40 p-2.5 border border-emerald-500/30 text-[11px] text-emerald-300 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    <strong>70% Creator Allocation (R{((selectedReceipt.creatorPoolUSD || 3.49) * USD_TO_ZAR_RATE).toFixed(2)})</strong> has been credited to original African artists.
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => {
                    window.print();
                  }}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-700 hover:bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-300"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Receipt</span>
                </button>
                <button
                  onClick={() => setSelectedReceipt(null)}
                  className="rounded-xl bg-amber-500 hover:bg-amber-400 px-4 py-2 text-xs font-bold text-black"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
