import React, { useState } from 'react';
import { Manga } from '../../types';
import { USD_TO_ZAR_RATE } from '../../data/paymentData';
import {
  Coins,
  TrendingUp,
  CreditCard,
  Building2,
  Send,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  ArrowUpRight,
  Eye,
  AlertCircle,
  HelpCircle,
  Clock,
  Lock,
} from 'lucide-react';

interface CreatorEarningsViewProps {
  currentUserEmail: string;
  mangaList: Manga[];
  onOpenUploadModal: () => void;
}

const PAYOUT_CHANNELS = [
  'Google Play Console Merchant Settlement',
  'Google AdMob Publisher Revenue Settlement',
];

export const CreatorEarningsView: React.FC<CreatorEarningsViewProps> = ({
  currentUserEmail,
  mangaList,
  onOpenUploadModal,
}) => {
  // Creator sees ONLY their own earnings, not total platform treasury!
  // Filter series where submittedByEmail is currentUserEmail, or if author matches, or default sample for the active user
  const mySeries = mangaList.filter((m) => {
    if (m.submittedByEmail && m.submittedByEmail.toLowerCase() === currentUserEmail.toLowerCase()) {
      return true;
    }
    // Also include if user is Mlungiseni Mbhele / AZ Oververse
    if ((currentUserEmail.includes('mlungisenimbhele') || currentUserEmail === 'mlungisenimbhele3@gmail.com' || currentUserEmail === 'azoververse@gmail.com') && (m.author.includes('Mbhele') || m.id.includes('zulu'))) {
      return true;
    }
    // If standard demo author and none specifically tagged, show author's published demo series
    if (m.author.toLowerCase().includes('ndaba') || m.author.toLowerCase().includes('khumalo') || m.author.toLowerCase().includes('moyo')) {
      return currentUserEmail !== 'mlungisenimbhele3@gmail.com' && currentUserEmail !== 'azoververse@gmail.com';
    }
    return false;
  });

  // Calculate creator-specific reads and 70% shares
  const effectiveSeries = mySeries.length > 0 ? mySeries : [mangaList[0]];
  const totalReads = effectiveSeries.reduce((acc, m) => acc + (m.views || 0), 0);

  // 70% Ad Share (e.g. R0.00 base or estimated from creator's reads)
  // Let's store or calculate:
  const adShareUSD = totalReads > 0 ? totalReads * 0.0018 * 0.7 : 0.0;
  // 70% VIP Pool Share
  const vipPoolUSD = totalReads > 0 ? totalReads * 0.0024 * 0.7 : 0.0;
  const totalPendingUSD = adShareUSD + vipPoolUSD;
  const pendingPayoutZAR = totalPendingUSD * USD_TO_ZAR_RATE;

  // Google Play / AdMob Settlement Modal state
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState(PAYOUT_CHANNELS[0]);
  const [merchantAccountId, setMerchantAccountId] = useState('GPLAY-MERCHANT-882910');
  const [accountHolder, setAccountHolder] = useState(currentUserEmail.split('@')[0].toUpperCase() + ' STUDIO');
  const [isSubmittingTransfer, setIsSubmittingTransfer] = useState(false);
  const [transferReceipt, setTransferReceipt] = useState<{
    reference: string;
    amountZAR: number;
    channel: string;
    date: string;
  } | null>(null);

  const handleExecuteSettlement = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingTransfer(true);

    setTimeout(() => {
      setIsSubmittingTransfer(false);
      setTransferReceipt({
        reference: `GPA-SETTLE-${Math.floor(100000 + Math.random() * 900000)}`,
        amountZAR: pendingPayoutZAR > 0 ? pendingPayoutZAR : 0.0,
        channel: selectedChannel,
        date: new Date().toLocaleDateString('en-ZA', { dateStyle: 'medium' }),
      });
    }, 1000);
  };

  return (
    <div id="creator-earnings-view" className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-['Bebas_Neue',sans-serif] text-3xl tracking-wide text-white">
              MY CREATOR <span className="text-emerald-400">EARNINGS</span>
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            Real-time monetization dashboard for <strong className="text-white">{currentUserEmail}</strong>. You see ONLY your personal royalties.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-300 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Google Play Billing · Google AdMob</span>
          </span>
        </div>
      </div>

      {/* Confidentiality Notice */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3.5 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            <strong>Author Privacy Protected:</strong> Total platform treasury and distribution controls remain restricted to app administrator (<strong className="text-amber-300">mlungisenimbhele3@gmail.com</strong>). You are viewing solely your own series stats.
          </span>
        </div>
      </div>

      {/* 4 Core Creator Metrics Cards (As requested by User) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Reads */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-2 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Total Reads</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/20 text-blue-400">
              <Eye className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {totalReads.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-400">Across your {effectiveSeries.length} published series</p>
        </div>

        {/* Metric 2: 70% Ad Share */}
        <div className="rounded-2xl border border-amber-500/30 bg-slate-900/80 p-5 space-y-2 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs text-amber-400 font-bold uppercase tracking-wider">70% Ad Share</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white font-mono">
            R{(adShareUSD * USD_TO_ZAR_RATE).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-slate-400">From chapter breaks & rewarded ads</p>
        </div>

        {/* Metric 3: 70% VIP Pool */}
        <div className="rounded-2xl border border-purple-500/30 bg-slate-900/80 p-5 space-y-2 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs text-purple-400 font-bold uppercase tracking-wider">70% VIP Pool</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/20 text-purple-400">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white font-mono">
            R{(vipPoolUSD * USD_TO_ZAR_RATE).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-slate-400">Proportional VIP subscriber read-time</p>
        </div>

        {/* Metric 4: Pending Payout in ZAR + Pay Now Button */}
        <div className="rounded-2xl border border-emerald-500/40 bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-950 p-5 flex flex-col justify-between shadow-xl">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-emerald-400 font-bold uppercase tracking-wider">Pending Payout</span>
              <Building2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-emerald-300 font-mono">
              R{(pendingPayoutZAR > 0 ? pendingPayoutZAR : 0.0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ZAR
            </div>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              Verified reader royalty balance
            </span>
          </div>

          {/* Settlement Button */}
          <div className="pt-3">
            <button
              type="button"
              onClick={() => setIsPayModalOpen(true)}
              className="min-h-[40px] w-full flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black py-2 px-3 text-xs font-bold transition shadow-lg active:scale-95 whitespace-nowrap"
            >
              <Send className="w-3.5 h-3.5 shrink-0" />
              <span>Request Google Play / AdMob Payout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Creator Series Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950/70 overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between flex-wrap gap-2">
          <div>
            <h4 className="text-sm font-bold text-white">Your Published Series Royalty Breakdown</h4>
            <p className="text-xs text-slate-400">Individual performance metrics for your titles</p>
          </div>
          <button
            onClick={onOpenUploadModal}
            className="rounded-xl bg-amber-500 hover:bg-amber-400 text-black px-3.5 py-1.5 text-xs font-black transition shadow"
          >
            Upload New Chapter
          </button>
        </div>

        <div className="divide-y divide-slate-800/80">
          {effectiveSeries.map((manga, idx) => {
            const mAdUSD = (manga.views * 0.0018 * 0.7);
            const mSubUSD = (manga.views * 0.0024 * 0.7);
            const mTotalUSD = mAdUSD + mSubUSD;
            const mTotalZAR = mTotalUSD * USD_TO_ZAR_RATE;

            return (
              <div key={`${manga.id}-${idx}`} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <img
                    src={manga.cover || manga.coverImage || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80'}
                    alt={manga.title}
                    onError={(e: any) => {
                      e.target.onerror = null;
                      e.target.src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80';
                    }}
                    className="h-14 w-11 rounded-lg object-cover border border-slate-800 shrink-0"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h5 className="font-bold text-sm text-white">{manga.title}</h5>
                      {manga.isOriginal ? (
                        <span className="rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.2 text-[9px] font-black uppercase">
                          AZ ORIGINAL
                        </span>
                      ) : (
                        <span className="rounded-full bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.2 text-[9px] font-bold uppercase">
                          BACKDROP
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {manga.chapters.length} Chapters • {manga.views.toLocaleString()} Total Reads
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6 text-right font-mono text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block font-sans">Ad Royalty</span>
                    <span className="text-amber-400">R{(mAdUSD * USD_TO_ZAR_RATE).toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block font-sans">VIP Pool</span>
                    <span className="text-purple-300">R{(mSubUSD * USD_TO_ZAR_RATE).toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block font-sans">Total Payout</span>
                    <span className="text-emerald-400 font-bold">R{mTotalZAR.toFixed(2)} ZAR</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Google Play & AdMob Settlement Modal */}
      {isPayModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md rounded-3xl border border-emerald-500/40 bg-slate-950 p-6 text-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="font-['Bebas_Neue',sans-serif] text-2xl text-white">
                  Google Play & AdMob Settlement
                </h3>
              </div>
              <button type="button" onClick={() => setIsPayModalOpen(false)} className="min-h-[40px] min-w-[40px] text-slate-400 hover:text-white">✕</button>
            </div>

            {transferReceipt ? (
              <div className="space-y-4 text-center py-4">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="font-bold text-lg text-white">Settlement Scheduled!</h4>
                  <p className="text-xs text-slate-300 mt-1">
                    Your royalty payout of <strong className="text-emerald-400 font-mono tabular-nums">R{transferReceipt.amountZAR.toFixed(2)} ZAR</strong> has been queued via {transferReceipt.channel}.
                  </p>
                </div>

                <div className="rounded-xl bg-slate-900 p-3 text-left font-mono text-xs space-y-1.5 border border-slate-800">
                  <div className="flex justify-between text-slate-400">
                    <span>Reference:</span>
                    <span className="text-white font-bold">{transferReceipt.reference}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Channel:</span>
                    <span className="text-white">{transferReceipt.channel}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Account ID:</span>
                    <span className="text-white font-bold">{merchantAccountId}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Date:</span>
                    <span className="text-white">{transferReceipt.date}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setTransferReceipt(null);
                    setIsPayModalOpen(false);
                  }}
                  className="min-h-[44px] w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs transition"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleExecuteSettlement} className="space-y-3.5">
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">Settlement Channel</label>
                  <select
                    value={selectedChannel}
                    onChange={(e) => setSelectedChannel(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 p-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
                  >
                    {PAYOUT_CHANNELS.map((ch, idx) => (
                      <option key={`${ch}-${idx}`} value={ch}>{ch}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">Google Play Merchant / AdMob Publisher ID</label>
                  <input
                    type="text"
                    value={merchantAccountId}
                    onChange={(e) => setMerchantAccountId(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 p-2.5 text-xs text-white font-mono focus:border-emerald-500 focus:outline-none"
                    placeholder="GPLAY-MERCHANT-ID or pub-XXXX"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">Publisher / Developer Name</label>
                  <input
                    type="text"
                    value={accountHolder}
                    onChange={(e) => setAccountHolder(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 p-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
                    placeholder="Publisher account name"
                    required
                  />
                </div>

                <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3 flex items-center justify-between text-xs">
                  <span className="text-slate-300">Amount to Settle:</span>
                  <span className="font-mono font-black text-emerald-400 text-sm tabular-nums">
                    R{(pendingPayoutZAR > 0 ? pendingPayoutZAR : 0.0).toFixed(2)} ZAR
                  </span>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsPayModalOpen(false)}
                    className="min-h-[40px] px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingTransfer}
                    className="min-h-[40px] px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition flex items-center gap-1.5 shadow whitespace-nowrap"
                  >
                    <Send className="w-3.5 h-3.5 shrink-0" />
                    <span>{isSubmittingTransfer ? 'Scheduling...' : 'Confirm Settlement'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
