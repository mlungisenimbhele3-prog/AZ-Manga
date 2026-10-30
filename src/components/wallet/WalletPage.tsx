import React, { useMemo, useState } from 'react';
import {
  Wallet,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  CreditCard,
  CheckCircle2,
  Sliders,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { CreatorStats, UserSubscription } from '../../types';
import { APP_LOGO_SRC } from '../common/KAAfricaLogo';

const chartData = [
  { name: 'May', zar: 0 },
  { name: 'Jun', zar: 0 },
  { name: 'Jul', zar: 0 },
  { name: 'Aug', zar: 0 },
  { name: 'Sep', zar: 0 },
  { name: 'Oct', zar: 0 },
];

const PAYMENT_THRESHOLD_ZAR = 1000;

type WalletStageFilter = 'all' | 'pending' | 'payable' | 'paid';

interface WalletStatementEntry {
  id: string;
  period: string;
  stage: 'pending' | 'payable' | 'paid';
  stageLabel: string;
  channel: string;
  detail: string;
  scheduleNote: string;
  amountZAR: number;
}

interface WalletPageProps {
  creatorStats: CreatorStats;
  userSubscription: UserSubscription;
  onOpenCreatorDashboard: () => void;
  onOpenSubscriptionModal: () => void;
  isAdmin: boolean;
  currentUserEmail: string;
  onSwitchToAdmin: () => void;
  onNavigateToStudioEarnings?: () => void;
}

export const WalletPage: React.FC<WalletPageProps> = ({
  creatorStats,
  userSubscription,
  onOpenCreatorDashboard,
  onOpenSubscriptionModal,
  isAdmin,
  currentUserEmail,
  onSwitchToAdmin,
  onNavigateToStudioEarnings,
}) => {
  const [stageFilter, setStageFilter] = useState<WalletStageFilter>('all');

  // All live balances strictly R0 unless dynamic in-session payoutHistory entries were created
  const pendingBalanceZAR = 0;
  const payableBalanceZAR = 0;
  const paidBalanceZAR = useMemo(() => {
    if (!creatorStats.payoutHistory || creatorStats.payoutHistory.length === 0) {
      return 0;
    }
    return creatorStats.payoutHistory.reduce((sum, tx) => sum + (tx.amountZAR || 0), 0);
  }, [creatorStats.payoutHistory]);

  const thresholdProgressPct = Math.min(
    100,
    Math.round((payableBalanceZAR / PAYMENT_THRESHOLD_ZAR) * 100)
  );

  const statementEntries: WalletStatementEntry[] = useMemo(() => {
    const baseCycleEntries: WalletStatementEntry[] = [
      {
        id: 'stmt-2026-10-pending',
        period: 'Oct 1 – 31, 2026',
        stage: 'pending',
        stageLabel: 'Pending',
        channel: '70% Google AdMob & Google Play VIP Pool',
        detail: 'Current month estimated royalties accruing from chapter reads & rewarded ads',
        scheduleNote: 'Finalizes into Payable Nov 7 – 12, 2026',
        amountZAR: 0,
      },
      {
        id: 'stmt-2026-09-payable',
        period: 'Sep 1 – 30, 2026',
        stage: 'payable',
        stageLabel: 'Payable',
        channel: 'Audited Monthly Creator Statement',
        detail: 'Verified activity posted to wallet balance (carried forward toward R1,000.00 threshold)',
        scheduleNote: 'Finalized Oct 10, 2026',
        amountZAR: 0,
      },
      {
        id: 'stmt-2026-08-payable',
        period: 'Aug 1 – 31, 2026',
        stage: 'payable',
        stageLabel: 'Payable',
        channel: 'Audited Monthly Creator Statement',
        detail: 'Verified activity posted to wallet balance (carried forward toward R1,000.00 threshold)',
        scheduleNote: 'Finalized Sep 9, 2026',
        amountZAR: 0,
      },
    ];

    const paidEntries: WalletStatementEntry[] = (creatorStats.payoutHistory || []).map(
      (tx) => ({
        id: tx.id,
        period: tx.date,
        stage: 'paid',
        stageLabel: 'Paid',
        channel: tx.destinationSummary,
        detail: `${tx.revenueSource} · Ref ${tx.providerReference}`,
        scheduleNote: 'Disbursed to settlement account',
        amountZAR: tx.amountZAR || 0,
      })
    );

    return [...paidEntries, ...baseCycleEntries];
  }, [creatorStats.payoutHistory]);

  const filteredEntries = useMemo(() => {
    if (stageFilter === 'all') return statementEntries;
    return statementEntries.filter((entry) => entry.stage === stageFilter);
  }, [statementEntries, stageFilter]);

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-4xl pb-24 py-12">
        <div className="rounded-3xl border border-rose-500/40 bg-slate-950 p-8 sm:p-12 shadow-2xl text-center space-y-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#0f0424] overflow-hidden shadow-lg">
            <img src={APP_LOGO_SRC} alt="AZ OVERVERSE" className="h-full w-full object-cover" />
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold text-rose-400">
              Restricted Admin Treasury · Security Protected
            </p>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              Platform Treasury & Distribution Protected
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto leading-relaxed">
              Access to platform-wide money distribution and treasury controls is restricted exclusively to administrator{' '}
              <strong className="text-amber-300">Mlungiseni Mbhele (mlungisenimbhele3@gmail.com)</strong>.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 max-w-md mx-auto text-center space-y-3">
            <p className="text-xs font-semibold text-emerald-400">
              Creator In-App Wallet · Pending · Payable · Paid
            </p>
            <h3 className="text-lg font-black text-white">View Your Creator Wallet in Studio</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Creators can track Pending, Payable, and Paid royalties alongside the R1,000.00 payment threshold in your private Studio dashboard.
            </p>
            {onNavigateToStudioEarnings && (
              <button
                type="button"
                onClick={onNavigateToStudioEarnings}
                className="min-h-[44px] w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs transition flex items-center justify-center gap-2"
              >
                <span>Open Studio Wallet</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 max-w-md mx-auto text-xs text-slate-400">
            Signed in as <span className="text-white font-mono font-bold">{currentUserEmail}</span>
          </div>

          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={onSwitchToAdmin}
              className="min-h-[44px] rounded-xl bg-amber-500 hover:bg-amber-400 text-black px-6 py-3 text-xs font-bold transition flex items-center gap-2"
            >
              <span>Switch to Admin Account (mlungisenimbhele3@gmail.com)</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="in-app-wallet-page" className="mx-auto max-w-7xl pb-24 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3.5">
          <img
            src={APP_LOGO_SRC}
            alt="AZ OVERVERSE"
            className="h-12 w-12 rounded-2xl object-cover border border-slate-800 shadow-lg shrink-0"
          />
          <div>
            <h1 className="font-['Bebas_Neue',sans-serif] text-3xl sm:text-4xl tracking-wide text-white leading-none">
              IN-APP WALLET & <span className="text-amber-400">PAYOUTS</span>
            </h1>
            <div className="flex items-center gap-2 flex-wrap text-xs text-slate-400 mt-1">
              <span>YouTube Studio-style creator payments</span>
              <span aria-hidden="true">·</span>
              <span>70% Google AdMob & Google Play Billing</span>
              <span aria-hidden="true">·</span>
              <span className="text-emerald-400 font-medium inline-flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Verified Escrow
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onOpenCreatorDashboard}
            className="min-h-[44px] inline-flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-4 py-2.5 text-xs font-bold transition whitespace-nowrap"
          >
            <Sliders className="w-4 h-4 shrink-0" />
            <span>Payout Settings</span>
          </button>
        </div>
      </div>

      {/* YOUTUBE STUDIO 3-STAGE WALLET CARDS: PENDING / PAYABLE / PAID */}
      <section aria-label="Wallet stages" className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Stage 1: PENDING */}
        <div
          id="wallet-card-pending"
          className="rounded-2xl border border-slate-800 bg-slate-950 p-6 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between text-xs text-amber-400 font-semibold">
              <span>01. Pending</span>
              <Clock className="w-4 h-4 text-amber-400 shrink-0" />
            </div>
            <div className="mt-3 text-3xl sm:text-4xl font-black text-white font-mono tabular-nums">
              R{pendingBalanceZAR.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-400 font-mono tabular-nums">
              <span>Oct 1 – 31, 2026</span>
              <span aria-hidden="true">·</span>
              <span>Finalizes Nov 7 – 12</span>
            </div>
            <p className="mt-3 text-xs text-slate-400 leading-relaxed">
              Estimated current-month 70% AdMob ad share and Google Play VIP read-time royalties being verified before posting to Payable.
            </p>
          </div>

          <div className="mt-5 pt-3.5 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 font-mono tabular-nums">
            <span>AdMob R0.00 · Play VIP R0.00</span>
            <span className="text-amber-300 font-sans font-medium">Accruing</span>
          </div>
        </div>

        {/* Stage 2: PAYABLE */}
        <div
          id="wallet-card-payable"
          className="rounded-2xl border border-emerald-500/40 bg-slate-950 p-6 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between text-xs text-emerald-400 font-semibold">
              <span>02. Payable</span>
              <Wallet className="w-4 h-4 text-emerald-400 shrink-0" />
            </div>
            <div className="mt-3 text-3xl sm:text-4xl font-black text-white font-mono tabular-nums">
              R{payableBalanceZAR.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-400 font-mono tabular-nums">
              <span>Finalized balance</span>
              <span aria-hidden="true">·</span>
              <span>Payout window 21st – 26th</span>
            </div>
            <p className="mt-3 text-xs text-slate-400 leading-relaxed">
              Audited earnings finalized in your wallet and queued for automatic monthly disbursement once the R1,000.00 threshold is reached.
            </p>
          </div>

          <div className="mt-5 pt-3.5 border-t border-slate-800/80">
            <button
              type="button"
              onClick={onOpenCreatorDashboard}
              className="min-h-[40px] w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 py-2.5 px-4 text-xs font-bold transition whitespace-nowrap"
            >
              <span>Manage Google Play / AdMob Payout</span>
              <ArrowUpRight className="w-4 h-4 shrink-0" />
            </button>
          </div>
        </div>

        {/* Stage 3: PAID */}
        <div
          id="wallet-card-paid"
          className="rounded-2xl border border-slate-800 bg-slate-950 p-6 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between text-xs text-sky-400 font-semibold">
              <span>03. Paid</span>
              <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
            </div>
            <div className="mt-3 text-3xl sm:text-4xl font-black text-white font-mono tabular-nums">
              R{paidBalanceZAR.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-400 font-mono tabular-nums">
              <span>Lifetime disbursed</span>
              <span aria-hidden="true">·</span>
              <span>{(creatorStats.payoutHistory || []).length} payouts</span>
            </div>
            <p className="mt-3 text-xs text-slate-400 leading-relaxed">
              Total finalized creator earnings paid out to your linked Google Play Console Merchant or Google AdMob settlement account.
            </p>
          </div>

          <div className="mt-5 pt-3.5 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Last payout: {(creatorStats.payoutHistory || [])[0]?.date || 'None yet'}</span>
            <button
              type="button"
              onClick={() => setStageFilter('paid')}
              className="text-sky-400 hover:text-sky-300 font-semibold transition"
            >
              View receipts
            </button>
          </div>
        </div>
      </section>

      {/* YOUTUBE STUDIO PAYMENT THRESHOLD & MONTHLY PAYOUT CYCLE */}
      <section className="rounded-2xl border border-slate-800 bg-slate-950 p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-base sm:text-lg font-bold text-white">
              Payment Threshold & Monthly Payout Schedule
            </h2>
            <p className="text-xs text-slate-400">
              Payable earnings automatically disburse between the 21st and 26th of the month once your Payable balance reaches R1,000.00.
            </p>
          </div>

          <div className="text-left md:text-right font-mono tabular-nums">
            <div className="text-sm font-bold text-white">
              R{payableBalanceZAR.toFixed(2)} <span className="text-slate-500 font-normal">of</span> R{PAYMENT_THRESHOLD_ZAR.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-slate-400">
              {thresholdProgressPct}% of payment threshold reached
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div
            role="progressbar"
            aria-valuenow={thresholdProgressPct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Payment threshold progress"
            className="h-2.5 w-full rounded-full bg-slate-900 border border-slate-800 overflow-hidden"
          >
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${thresholdProgressPct}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono tabular-nums">
            <span>R0.00</span>
            <span>Threshold: R1,000.00 ZAR</span>
          </div>
        </div>

        {/* 3-Step YouTube Studio Timeline */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-5 border-t border-slate-800/80 text-xs">
          <div className="space-y-1">
            <div className="font-semibold text-white">01. Pending Accrual · 1st – 31st</div>
            <p className="text-slate-400 leading-relaxed">
              Daily chapter views, bottom/interstitial AdMob impressions, and VIP subscriber read-time accumulate as estimated Pending earnings.
            </p>
          </div>
          <div className="space-y-1">
            <div className="font-semibold text-white">02. Payable Finalization · 7th – 12th</div>
            <p className="text-slate-400 leading-relaxed">
              Between the 7th and 12th of the following month, prior-month activity is audited and finalized into your Payable wallet balance.
            </p>
          </div>
          <div className="space-y-1">
            <div className="font-semibold text-white">03. Paid Disbursement · 21st – 26th</div>
            <p className="text-slate-400 leading-relaxed">
              If your Payable balance is at least R1,000.00 with no holds, payment is issued between the 21st and 26th and moves to Paid.
            </p>
          </div>
        </div>
      </section>

      {/* PAYMENT ACTIVITY & MONTHLY STATEMENTS (FILTERABLE BY PENDING / PAYABLE / PAID) */}
      <section className="rounded-2xl border border-slate-800 bg-slate-950 p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h2 className="font-['Bebas_Neue',sans-serif] text-2xl tracking-wide text-white">
              PAYMENT ACTIVITY <span className="text-amber-400">& STATEMENTS</span>
            </h2>
            <p className="text-xs text-slate-400">
              Monthly statement ledger across Pending, Payable, and Paid stages
            </p>
          </div>

          {/* Interactive Filter Controls */}
          <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-slate-900 border border-slate-800 self-start sm:self-auto">
            {(
              [
                { id: 'all', label: 'All' },
                { id: 'pending', label: 'Pending' },
                { id: 'payable', label: 'Payable' },
                { id: 'paid', label: 'Paid' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStageFilter(tab.id)}
                className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  stageFilter === tab.id
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {filteredEntries.length > 0 ? (
          <div className="divide-y divide-slate-800/80">
            {filteredEntries.map((entry) => (
              <div
                key={entry.id}
                className="py-4 first:pt-1 last:pb-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap text-sm">
                    <span className="font-bold text-white">{entry.period}</span>
                    <span className="text-slate-600" aria-hidden="true">·</span>
                    <span
                      className={`text-xs font-semibold ${
                        entry.stage === 'pending'
                          ? 'text-amber-400'
                          : entry.stage === 'payable'
                          ? 'text-emerald-400'
                          : 'text-sky-400'
                      }`}
                    >
                      {entry.stageLabel}
                    </span>
                    <span className="text-slate-600" aria-hidden="true">·</span>
                    <span className="text-xs text-slate-400">{entry.channel}</span>
                  </div>
                  <p className="text-xs text-slate-400">{entry.detail}</p>
                </div>

                <div className="text-left sm:text-right shrink-0">
                  <div className="text-base font-bold text-white font-mono tabular-nums">
                    R{entry.amountZAR.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono tabular-nums">
                    {entry.scheduleNote}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-10 text-center space-y-1.5">
            <p className="text-sm font-semibold text-white">No Paid Disbursements Yet (R0.00)</p>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Completed Google Play Billing and Google AdMob payouts appear here once your finalized Payable balance reaches R1,000.00 during the 21st – 26th monthly payout window.
            </p>
          </div>
        )}
      </section>

      {/* SECONDARY ROW: EARNINGS TREND + READER VIP SUBSCRIPTION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ZAR Earnings Trend */}
        <div className="lg:col-span-8 rounded-2xl border border-slate-800 bg-slate-950 p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-['Bebas_Neue',sans-serif] text-2xl tracking-wide text-white">
                EARNINGS TREND <span className="text-emerald-400">(6 MONTHS ZAR)</span>
              </h3>
              <p className="text-xs text-slate-400">Finalized monthly creator royalties in South African Rand</p>
            </div>
            <span className="text-xs font-mono tabular-nums text-slate-400">R0.00 / mo</span>
          </div>
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #1e293b',
                    color: '#fff',
                  }}
                  formatter={(value: any) => [
                    value != null ? `R${(value as number).toFixed(2)}` : 'R0.00',
                    'Royalties',
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey="zar"
                  stroke="#34d399"
                  strokeWidth={2.5}
                  dot={{ fill: '#34d399' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* User Subscription Card */}
        <div className="lg:col-span-4 rounded-2xl border border-slate-800 bg-slate-950 p-6 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-purple-400 font-semibold">
              <span>Reader Membership</span>
              <CreditCard className="w-4 h-4 text-purple-400 shrink-0" />
            </div>
            <div className="text-xl font-bold text-white">{userSubscription.planName}</div>
            <div className="text-xs text-slate-400 flex items-center gap-2 flex-wrap font-mono tabular-nums">
              <span>Rate: {userSubscription.price}</span>
              {userSubscription.tier !== 'free' && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-emerald-400">Renews {userSubscription.expiresAt}</span>
                </>
              )}
            </div>
            <p className="text-xs text-slate-400 leading-relaxed pt-1">
              70% of every Google Play VIP membership is distributed directly to creators based on verified chapter read-time.
            </p>
          </div>

          <div className="pt-6">
            <button
              type="button"
              onClick={onOpenSubscriptionModal}
              className="min-h-[44px] w-full flex items-center justify-center gap-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white py-3 px-4 text-xs font-bold transition whitespace-nowrap"
            >
              <span>Manage Subscription & VIP Pass</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
