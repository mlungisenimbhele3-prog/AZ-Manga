import React, { useState } from 'react';
import {
  CreatorPayoutSettings,
  PayoutTransaction,
  PayoutProviderType,
} from '../../types';
import { USD_TO_ZAR_RATE } from '../../data/paymentData';
import {
  Send,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Sparkles,
  RefreshCw,
  Sliders,
  Smartphone,
  Play,
} from 'lucide-react';

interface CreatorPayoutManagerProps {
  availableBalanceUSD: number;
  onExecutePayout: (payout: PayoutTransaction) => void;
  payoutHistory: PayoutTransaction[];
  currentSettings: CreatorPayoutSettings;
  onUpdateSettings: (settings: CreatorPayoutSettings) => void;
}

export const CreatorPayoutManager: React.FC<CreatorPayoutManagerProps> = ({
  availableBalanceUSD,
  onExecutePayout,
  payoutHistory,
  currentSettings,
  onUpdateSettings,
}) => {
  const [activeTab, setActiveTab] = useState<'payout_action' | 'configure_methods' | 'history'>('payout_action');
  const [withdrawAmountUSD, setWithdrawAmountUSD] = useState<string>(
    availableBalanceUSD > 0 ? (availableBalanceUSD * 0.75).toFixed(2) : '50.00'
  );
  const [selectedProvider, setSelectedProvider] = useState<PayoutProviderType>(
    currentSettings.preferredProvider === 'admob' ? 'admob' : 'google_play'
  );

  // Settings form state (strictly Google Play Billing & Google AdMob)
  const [settingsForm, setSettingsForm] = useState<CreatorPayoutSettings>({
    preferredProvider: currentSettings.preferredProvider === 'admob' ? 'admob' : 'google_play',
    googlePlay: {
      merchantId: currentSettings.googlePlay?.merchantId || 'GPLAY-MERCHANT-882910',
      developerAccountName: currentSettings.googlePlay?.developerAccountName || 'AZ Oververse Creator Studio',
    },
    admob: {
      publisherId: currentSettings.admob?.publisherId || 'pub-3940256099942544',
      accountName: currentSettings.admob?.accountName || 'AZ Oververse AdMob Revenue Pool',
    },
    autoPayoutEnabled: currentSettings.autoPayoutEnabled ?? true,
    minPayoutThresholdUSD: currentSettings.minPayoutThresholdUSD ?? 50,
  });
  const [settingsSavedToast, setSettingsSavedToast] = useState(false);

  // Settlement process state
  const [isProcessingWithdrawal, setIsProcessingWithdrawal] = useState(false);
  const [withdrawalSuccessReceipt, setWithdrawalSuccessReceipt] = useState<PayoutTransaction | null>(null);

  const withdrawNum = parseFloat(withdrawAmountUSD) || 0;
  const withdrawZAR = (withdrawNum * USD_TO_ZAR_RATE).toFixed(2);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings({
      ...settingsForm,
      preferredProvider: selectedProvider,
    });
    setSettingsSavedToast(true);
    setTimeout(() => setSettingsSavedToast(false), 3000);
  };

  const handleInitiateWithdrawal = () => {
    if (withdrawNum <= 0 || withdrawNum > availableBalanceUSD) return;

    setIsProcessingWithdrawal(true);

    setTimeout(() => {
      const isGooglePlay = selectedProvider === 'google_play';
      const destSummary = isGooglePlay
        ? `Google Play Billing (${settingsForm.googlePlay?.merchantId || 'GPLAY-MERCHANT'})`
        : `Google AdMob (${settingsForm.admob?.publisherId || 'pub-admob'})`;
      const refPrefix = isGooglePlay ? 'GPLAY-SETTLE-' : 'ADMOB-SETTLE-';

      const newTx: PayoutTransaction = {
        id: `TX-GOOG-${Math.floor(10000 + Math.random() * 90000)}`,
        date: new Date().toISOString().split('T')[0],
        amountUSD: withdrawNum,
        amountZAR: parseFloat(withdrawZAR),
        exchangeRate: USD_TO_ZAR_RATE,
        provider: selectedProvider,
        providerReference: `${refPrefix}${Math.floor(1000000 + Math.random() * 9000000)}`,
        destinationSummary: destSummary,
        revenueSource: isGooglePlay ? '70% Subscription Pool' : '70% Ad Monetization',
        status: 'COMPLETED',
      };

      onExecutePayout(newTx);
      setIsProcessingWithdrawal(false);
      setWithdrawalSuccessReceipt(newTx);
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* 70% Revenue Share Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/90 p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-black">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium">
                <span>Creator Revenue Contract</span>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums">70% Creator Share</span>
              </div>
              <h4 className="text-lg font-bold text-white mt-0.5">
                Google AdMob & Google Play Billing Revenue Pool
              </h4>
              <p className="text-xs text-slate-300 max-w-xl mt-1 leading-relaxed">
                Creators earn 70% of persistent AdMob banner & rewarded chapter unlock revenue plus 70% of Google Play Billing VIP subscriptions. All other payment rails are disabled.
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5 text-right shrink-0">
            <span className="text-[11px] font-medium text-slate-400 block">Available 70% Balance</span>
            <div className="text-2xl font-black text-white tabular-nums">
              R{(availableBalanceUSD * USD_TO_ZAR_RATE).toLocaleString('en-US', { minimumFractionDigits: 2 })} ZAR
            </div>
            <div className="text-xs font-medium text-emerald-400">
              Google Play & AdMob Settlement
            </div>
          </div>
        </div>
      </div>

      {/* Sub Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto">
        <button
          type="button"
          onClick={() => {
            setActiveTab('payout_action');
            setWithdrawalSuccessReceipt(null);
          }}
          className={`min-h-[44px] flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition whitespace-nowrap shrink-0 ${
            activeTab === 'payout_action'
              ? 'bg-emerald-500 text-black'
              : 'bg-slate-800/80 text-slate-300 hover:text-white'
          }`}
        >
          <Send className="w-3.5 h-3.5 shrink-0" />
          <span>Settle 70% Revenue</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('configure_methods');
            setWithdrawalSuccessReceipt(null);
          }}
          className={`min-h-[44px] flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition whitespace-nowrap shrink-0 ${
            activeTab === 'configure_methods'
              ? 'bg-emerald-500 text-black'
              : 'bg-slate-800/80 text-slate-300 hover:text-white'
          }`}
        >
          <Sliders className="w-3.5 h-3.5 shrink-0" />
          <span>Google Play & AdMob Accounts</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('history');
            setWithdrawalSuccessReceipt(null);
          }}
          className={`min-h-[44px] flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition whitespace-nowrap shrink-0 ${
            activeTab === 'history'
              ? 'bg-emerald-500 text-black'
              : 'bg-slate-800/80 text-slate-300 hover:text-white'
          }`}
        >
          <Clock className="w-3.5 h-3.5 shrink-0" />
          <span className="tabular-nums">Settlement History ({payoutHistory.length})</span>
        </button>
      </div>

      {/* TAB 1: SETTLE REVENUE */}
      {activeTab === 'payout_action' && (
        <div className="space-y-6">
          {withdrawalSuccessReceipt ? (
            <div className="rounded-2xl border border-emerald-500/50 bg-slate-900 p-6 text-center space-y-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <span className="text-xs font-semibold text-emerald-400">
                  Google Settlement Dispatched
                </span>
                <h4 className="text-2xl font-black text-white mt-1 tabular-nums">
                  R{withdrawalSuccessReceipt.amountZAR.toLocaleString('en-US', { minimumFractionDigits: 2 })} ZAR
                </h4>
                <p className="text-xs text-slate-300 mt-1">
                  Settled via <strong>{withdrawalSuccessReceipt.destinationSummary}</strong>
                </p>
              </div>

              <div className="mx-auto max-w-md rounded-xl border border-slate-800 bg-slate-950 p-4 text-xs font-mono tabular-nums text-left space-y-2">
                <div className="flex justify-between text-slate-400">
                  <span>Transaction ID</span>
                  <span className="text-white font-bold">{withdrawalSuccessReceipt.id}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Settlement Reference</span>
                  <span className="text-emerald-400 font-bold">{withdrawalSuccessReceipt.providerReference}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Creator Share (70%)</span>
                  <span className="text-white">R{withdrawalSuccessReceipt.amountZAR.toFixed(2)} ZAR</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Revenue Channel</span>
                  <span className="text-amber-400">{withdrawalSuccessReceipt.revenueSource}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setWithdrawalSuccessReceipt(null)}
                className="min-h-[44px] rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black px-6 py-2.5 text-xs font-bold transition whitespace-nowrap"
              >
                Done
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Form */}
              <div className="lg:col-span-7 rounded-2xl border border-slate-800 bg-slate-950/80 p-5 space-y-5">
                <h4 className="font-bold text-sm text-white">
                  Select Settlement Channel & Amount
                </h4>

                {/* Provider Selector Cards (Strictly Google Play Billing & Google AdMob) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedProvider('google_play')}
                    className={`rounded-xl border p-4 text-left transition flex flex-col justify-between ${
                      selectedProvider === 'google_play'
                        ? 'border-emerald-500 bg-emerald-950/30'
                        : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-white">Google Play Billing</span>
                        <Smartphone className="w-4 h-4 text-emerald-400 shrink-0" />
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Google Play Console merchant settlement for VIP & Patron subscriptions.
                      </p>
                    </div>
                    <span className="text-[11px] text-emerald-300 mt-3 font-mono truncate">
                      {settingsForm.googlePlay?.merchantId}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedProvider('admob')}
                    className={`rounded-xl border p-4 text-left transition flex flex-col justify-between ${
                      selectedProvider === 'admob'
                        ? 'border-amber-500 bg-amber-950/20'
                        : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-white">Google AdMob</span>
                        <Play className="w-4 h-4 text-amber-400 shrink-0" />
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        AdMob publisher settlement from bottom banners & rewarded chapter ads.
                      </p>
                    </div>
                    <span className="text-[11px] text-amber-300 mt-3 font-mono truncate">
                      {settingsForm.admob?.publisherId}
                    </span>
                  </button>
                </div>

                {/* Amount input */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <label htmlFor="settlement-amount-usd" className="text-slate-300 font-semibold">
                      Settlement Amount (USD Base)
                    </label>
                    <button
                      type="button"
                      onClick={() => setWithdrawAmountUSD(availableBalanceUSD.toFixed(2))}
                      className="text-emerald-400 hover:underline font-semibold text-xs tabular-nums"
                    >
                      Use Full Balance (${availableBalanceUSD.toFixed(2)})
                    </button>
                  </div>

                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-400 font-bold">$</span>
                    <input
                      id="settlement-amount-usd"
                      type="number"
                      min="10"
                      max={Math.max(10, availableBalanceUSD)}
                      step="5"
                      value={withdrawAmountUSD}
                      onChange={(e) => setWithdrawAmountUSD(e.target.value)}
                      className="w-full rounded-xl border border-slate-700 bg-slate-900 py-2.5 pl-8 pr-4 text-white text-base font-bold tabular-nums focus:border-emerald-500 focus:outline-none"
                      placeholder="50.00"
                    />
                  </div>
                </div>

                {/* Quick amount buttons */}
                <div className="flex items-center gap-2 flex-wrap">
                  {[25, 50, 100, 250].map((amt) => (
                    <button
                      key={`amt-${amt}`}
                      type="button"
                      onClick={() => setWithdrawAmountUSD(amt.toString())}
                      className="min-h-[36px] rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition tabular-nums whitespace-nowrap"
                    >
                      ${amt}
                    </button>
                  ))}
                </div>

                {/* Action button */}
                <button
                  type="button"
                  disabled={isProcessingWithdrawal || withdrawNum <= 0 || withdrawNum > availableBalanceUSD}
                  onClick={handleInitiateWithdrawal}
                  className={`min-h-[44px] w-full rounded-xl py-3 px-4 text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 whitespace-nowrap ${
                    isProcessingWithdrawal || withdrawNum <= 0 || withdrawNum > availableBalanceUSD
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      : 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-lg'
                  }`}
                >
                  {isProcessingWithdrawal ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
                      <span>Processing Google Settlement...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 shrink-0" />
                      <span className="tabular-nums">
                        Settle R{parseFloat(withdrawZAR).toLocaleString('en-US', { minimumFractionDigits: 2 })} ZAR via {selectedProvider === 'google_play' ? 'Google Play' : 'AdMob'}
                      </span>
                    </>
                  )}
                </button>
              </div>

              {/* Right Column: Breakdown */}
              <div className="lg:col-span-5 rounded-2xl border border-slate-800 bg-slate-950/80 p-5 space-y-4">
                <h5 className="text-xs font-bold text-slate-300">
                  Google Ecosystem Settlement Summary
                </h5>

                <div className="space-y-3 divide-y divide-slate-800 text-xs tabular-nums">
                  <div className="flex justify-between text-slate-300 pt-1">
                    <span>Creator 70% Pool Claim</span>
                    <span className="font-bold text-white">${withdrawNum.toFixed(2)} USD</span>
                  </div>

                  <div className="flex justify-between text-slate-300 pt-3">
                    <span>ZAR Conversion Rate</span>
                    <span className="font-mono text-emerald-400 font-semibold">1 USD = R{USD_TO_ZAR_RATE} ZAR</span>
                  </div>

                  <div className="flex justify-between text-slate-300 pt-3">
                    <span>Settlement Rail</span>
                    <span className="text-slate-200 font-semibold">
                      {selectedProvider === 'google_play' ? 'Google Play Billing' : 'Google AdMob'}
                    </span>
                  </div>

                  <div className="flex justify-between items-baseline pt-4 border-t border-slate-700">
                    <span className="font-bold text-white text-sm">Estimated ZAR Payout</span>
                    <div className="text-right">
                      <span className="text-xl font-black text-amber-300">
                        R{parseFloat(withdrawZAR).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                      <span className="text-[10px] text-slate-400 block font-mono">ZAR Equivalent</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 text-xs text-slate-400 space-y-1">
                  <div className="flex items-center gap-1.5 text-slate-200 font-semibold">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Exclusive Monetization Policy</span>
                  </div>
                  <p className="leading-relaxed">
                    AZ Oververse processes monetization strictly through Google AdMob and Google Play Billing.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CONFIGURE GOOGLE PLAY & ADMOB ACCOUNTS */}
      {activeTab === 'configure_methods' && (
        <form onSubmit={handleSaveSettings} className="space-y-6">
          {settingsSavedToast && (
            <div className="rounded-xl bg-emerald-500 text-black px-4 py-2.5 text-xs font-bold flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Google Play & AdMob settlement settings saved.</span>
              </div>
              <button type="button" onClick={() => setSettingsSavedToast(false)} className="px-2 py-0.5 font-bold">
                ✕
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 1. Google Play Billing Merchant Configuration */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="font-bold text-sm text-white">Google Play Billing</h5>
                    <span className="text-[11px] text-slate-400">Subscriptions & VIP Passes</span>
                  </div>
                </div>
                <input
                  type="radio"
                  name="preferredProvider"
                  checked={selectedProvider === 'google_play'}
                  onChange={() => setSelectedProvider('google_play')}
                  className="accent-emerald-500 h-4 w-4"
                />
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Google Play Merchant ID</label>
                  <input
                    type="text"
                    value={settingsForm.googlePlay?.merchantId || ''}
                    onChange={(e) =>
                      setSettingsForm((prev) => ({
                        ...prev,
                        googlePlay: {
                          merchantId: e.target.value,
                          developerAccountName: prev.googlePlay?.developerAccountName || '',
                        },
                      }))
                    }
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-white text-xs font-mono focus:border-emerald-500 focus:outline-none"
                    placeholder="GPLAY-MERCHANT-882910"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Developer Account Name</label>
                  <input
                    type="text"
                    value={settingsForm.googlePlay?.developerAccountName || ''}
                    onChange={(e) =>
                      setSettingsForm((prev) => ({
                        ...prev,
                        googlePlay: {
                          merchantId: prev.googlePlay?.merchantId || '',
                          developerAccountName: e.target.value,
                        },
                      }))
                    }
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-white text-xs focus:border-emerald-500 focus:outline-none"
                    placeholder="AZ Oververse Creator Studio"
                  />
                </div>
              </div>
            </div>

            {/* 2. Google AdMob Publisher Configuration */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                    <Play className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="font-bold text-sm text-white">Google AdMob</h5>
                    <span className="text-[11px] text-slate-400">Persistent Banner & Rewarded Unlocks</span>
                  </div>
                </div>
                <input
                  type="radio"
                  name="preferredProvider"
                  checked={selectedProvider === 'admob'}
                  onChange={() => setSelectedProvider('admob')}
                  className="accent-amber-500 h-4 w-4"
                />
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">AdMob Publisher ID</label>
                  <input
                    type="text"
                    value={settingsForm.admob?.publisherId || ''}
                    onChange={(e) =>
                      setSettingsForm((prev) => ({
                        ...prev,
                        admob: {
                          publisherId: e.target.value,
                          accountName: prev.admob?.accountName || '',
                        },
                      }))
                    }
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-white text-xs font-mono focus:border-amber-500 focus:outline-none"
                    placeholder="pub-3940256099942544"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">AdMob Account Name</label>
                  <input
                    type="text"
                    value={settingsForm.admob?.accountName || ''}
                    onChange={(e) =>
                      setSettingsForm((prev) => ({
                        ...prev,
                        admob: {
                          publisherId: prev.admob?.publisherId || '',
                          accountName: e.target.value,
                        },
                      }))
                    }
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-white text-xs focus:border-amber-500 focus:outline-none"
                    placeholder="AZ Oververse AdMob Revenue Pool"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-800 pt-4">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Authenticated via Google Play Console & Google AdMob Publisher Services.</span>
            </div>

            <button
              type="submit"
              className="min-h-[44px] rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black px-6 py-2.5 text-xs font-bold transition whitespace-nowrap shrink-0"
            >
              Save Settlement Accounts
            </button>
          </div>
        </form>
      )}

      {/* TAB 3: SETTLEMENT HISTORY */}
      {activeTab === 'history' && (
        <div className="rounded-2xl border border-slate-800 bg-slate-950/80 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between text-xs">
            <span className="font-bold text-white">
              Disbursed 70% Creator Revenue Records
            </span>
            <span className="text-slate-400 font-mono tabular-nums">
              Total Paid: R
              {payoutHistory
                .reduce((a, b) => a + (b.amountZAR || b.amountUSD * USD_TO_ZAR_RATE), 0)
                .toLocaleString('en-US', { minimumFractionDigits: 2 })}{' '}
              ZAR
            </span>
          </div>

          {payoutHistory.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No Google Play Billing or Google AdMob settlement records yet.
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {payoutHistory.map((tx, idx) => (
                <div
                  key={`${tx.id}-${idx}`}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-9 w-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                        tx.provider === 'google_play'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {tx.provider === 'google_play' ? 'GP' : 'AD'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h5 className="font-bold text-white">{tx.destinationSummary}</h5>
                        <span className="text-[11px] font-medium text-emerald-400">
                          · {tx.status}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono tabular-nums">
                        Ref: {tx.providerReference} · {tx.date} · {tx.revenueSource}
                      </span>
                    </div>
                  </div>

                  <div className="text-right self-end sm:self-auto tabular-nums">
                    <div className="text-sm font-black text-amber-300">
                      R{tx.amountZAR.toLocaleString('en-US', { minimumFractionDigits: 2 })} ZAR
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">
                      Rate: R{tx.exchangeRate} / USD
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
