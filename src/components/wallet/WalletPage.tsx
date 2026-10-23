import React from 'react';
import { Wallet, Coins, ArrowUpRight, ShieldCheck, CreditCard, Sparkles, Download, CheckCircle2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { CreatorStats, UserSubscription } from '../../types';
import { USD_TO_ZAR_RATE } from '../../data/paymentData';

const chartData = [
  { name: 'Apr', zar: 0 },
  { name: 'May', zar: 0 },
  { name: 'Jun', zar: 0 },
  { name: 'Jul', zar: 0 },
  { name: 'Aug', zar: 0 },
  { name: 'Sep', zar: 0 },
];

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
  const totalMonthlyUSD = creatorStats.monthlyAdRevenue + creatorStats.monthlySubShareRevenue;
  const totalMonthlyZAR = totalMonthlyUSD * USD_TO_ZAR_RATE;

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-4xl pb-24 py-12">
        <div className="rounded-3xl border border-rose-500/40 bg-gradient-to-br from-rose-950/50 via-slate-950 to-slate-950 p-8 sm:p-12 shadow-2xl text-center space-y-6">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-xl">
            <ShieldCheck className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <span className="rounded-full bg-rose-500/20 border border-rose-500/40 px-3.5 py-1 text-xs font-bold text-rose-300 uppercase tracking-widest">
              RESTRICTED ADMIN AREA
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              Money Distribution & Treasury Protected
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto leading-relaxed">
              Security Guarantee: Access to platform-wide money distribution, treasury disbursements, and revenue share controls is restricted exclusively to app creator and administrator <strong className="text-amber-300">Mlungiseni Mbhele (mlungisenimbhele3@gmail.com)</strong>.
            </p>
          </div>

          {/* User notice & Studio Redirect Card */}
          <div className="rounded-2xl border border-emerald-500/40 bg-gradient-to-r from-emerald-950/50 via-slate-900 to-slate-900 p-5 max-w-md mx-auto text-center space-y-3 shadow-lg">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-3 py-0.5 text-xs font-black uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              <span>CREATOR PAYOUTS ACTIVE</span>
            </div>
            <h3 className="text-lg font-black text-white">Your payouts are in Studio</h3>
            <p className="text-xs text-slate-300">
              Authors can review personal chapter reads, 70% Google AdMob & Google Play Billing earnings, and manage creator payouts in your private Studio dashboard.
            </p>
            {onNavigateToStudioEarnings && (
              <button
                onClick={onNavigateToStudioEarnings}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-black font-black text-xs transition shadow-lg flex items-center justify-center gap-2"
              >
                <span>Go to Studio &gt; My Earnings</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 max-w-md mx-auto text-xs text-slate-400">
            You are currently signed in as: <span className="text-white font-mono font-bold">{currentUserEmail}</span> (Standard Reader/Author Role). Readers and authors have full access to the manga reader, chapters, publishing studio, and community chats.
          </div>

          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <button
              onClick={onSwitchToAdmin}
              className="rounded-xl bg-amber-500 hover:bg-amber-400 text-black px-6 py-3 text-xs font-black transition shadow-lg flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Switch to Admin Account (mlungisenimbhele3@gmail.com)</span>
            </button>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="mx-auto max-w-7xl pb-24 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h1 className="font-['Bebas_Neue',sans-serif] text-3xl tracking-wide text-white">
            WALLET & <span className="text-amber-400">PAYOUTS</span>
          </h1>
          <p className="text-xs text-slate-400">Manage 70% creator earnings, bank disbursements, and VIP subscriptions.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 text-xs font-bold text-emerald-300 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Verified Secure Escrow</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Creator Balance Card */}
        <div className="rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/40 via-slate-950 to-slate-950 p-6 shadow-2xl relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-emerald-400 font-bold uppercase tracking-wider">Available Creator Balance</span>
              <Coins className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="text-3xl font-black text-white font-mono">
              R{(creatorStats.totalRevenueUSD * USD_TO_ZAR_RATE).toLocaleString('en-US', { minimumFractionDigits: 2 })} ZAR
            </div>
            <div className="text-xs font-mono font-bold text-amber-300 mt-1">
              Google Play & AdMob Ready
            </div>
          </div>
          <div className="mt-6">
            <button
              type="button"
              onClick={onOpenCreatorDashboard}
              className="min-h-[44px] w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black py-3 px-4 text-xs font-bold transition shadow-lg whitespace-nowrap"
            >
              <span>Manage Google Play / AdMob Payout</span>
              <ArrowUpRight className="w-4 h-4 shrink-0" />
            </button>
          </div>
        </div>

        {/* Projected Monthly Rev-Share */}
        <div className="rounded-3xl border border-amber-500/30 bg-gradient-to-br from-amber-950/40 via-slate-950 to-slate-950 p-6 shadow-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-amber-400 font-bold uppercase tracking-wider">Projected 70% Pool</span>
              <Sparkles className="w-5 h-5 text-amber-400" />
            </div>
            <div className="text-3xl font-black text-white font-mono tabular-nums">
              R{totalMonthlyZAR.toLocaleString('en-US', { minimumFractionDigits: 2 })} ZAR
            </div>
            <div className="text-xs font-mono font-bold text-amber-300 mt-1">
              Estimated Monthly Creator Share
            </div>
          </div>
          <div className="mt-6 text-[11px] text-slate-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Disbursed monthly via Google Play & Google AdMob</span>
          </div>
        </div>

        {/* User Subscription Card */}
        <div className="rounded-3xl border border-purple-500/30 bg-gradient-to-br from-purple-950/40 via-slate-950 to-slate-950 p-6 shadow-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-purple-400 font-bold uppercase tracking-wider">Your Subscription</span>
              <CreditCard className="w-5 h-5 text-purple-400" />
            </div>
            <div className="text-xl font-bold text-white">
              {userSubscription.planName}
            </div>
            <div className="text-xs text-slate-300 mt-1 flex items-center gap-2 flex-wrap">
              <span>Price: <strong className="text-amber-400">{userSubscription.price}</strong></span>
              {userSubscription.tier !== 'free' && (
                <>
                  <span className="text-slate-500">•</span>
                  <span className="text-emerald-400 font-medium">Expires: {userSubscription.expiresAt}</span>
                </>
              )}
            </div>
          </div>
          <div className="mt-6">
            <button
              onClick={onOpenSubscriptionModal}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white py-3 text-xs font-bold transition shadow-lg"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Manage Subscription & VIP Pass</span>
            </button>
          </div>
        </div>
      </div>

      {/* ZAR Earnings Trend */}
      <div className="rounded-3xl border border-slate-800 bg-slate-950 p-6 shadow-2xl">
        <h3 className="font-['Bebas_Neue',sans-serif] text-2xl tracking-wide text-white mb-6">
          EARNINGS TREND <span className="text-emerald-400">(6 MONTHS ZAR)</span>
        </h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', color: '#fff' }}
                formatter={(value: any) => [value != null ? `R${(value as number).toLocaleString()}` : 'N/A', 'Earnings']}
              />
              <Line type="monotone" dataKey="zar" stroke="#34d399" strokeWidth={3} dot={{ fill: '#34d399' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Payout History Section */}
      <div className="rounded-3xl border border-slate-800 bg-slate-950 p-6 shadow-2xl">
        <h3 className="font-['Bebas_Neue',sans-serif] text-2xl tracking-wide text-white mb-4">
          RECENT PAYOUT <span className="text-amber-400">HISTORY</span>
        </h3>
        {creatorStats.payoutHistory && creatorStats.payoutHistory.length > 0 ? (
          <div className="space-y-3">
            {creatorStats.payoutHistory.map((tx, idx) => (
              <div key={`wallet-tx-${tx.id}-${idx}`} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <Wallet className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white">{tx.id}</span>
                      <span className="rounded bg-emerald-500/20 text-emerald-300 px-2 py-0.5 text-[10px] font-bold">
                        {tx.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{tx.destinationSummary} • {tx.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-sm text-amber-300">R{tx.amountZAR.toLocaleString()} ZAR</span>
                  <p className="text-xs text-slate-400">Processed</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-slate-400 text-xs">
            No payout transactions yet in Live Mode. Earnings accumulate based on reader views and ad performance.
          </div>
        )}
      </div>
    </div>
  );
};
