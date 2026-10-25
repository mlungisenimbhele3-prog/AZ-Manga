import React, { useState } from 'react';
import { Manga } from '../../types';
import { APP_LOGO_SRC } from '../common/KAAfricaLogo';
import {
  Coins,
  Send,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  Eye,
  Clock,
  Lock,
  Wallet,
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

const PAYMENT_THRESHOLD_ZAR = 1000;

type StudioWalletFilter = 'all' | 'pending' | 'payable' | 'paid';

export const CreatorEarningsView: React.FC<CreatorEarningsViewProps> = ({
  currentUserEmail,
  mangaList,
  onOpenUploadModal,
}) => {
  // Creator sees ONLY their own earnings, not total platform treasury
  const mySeries = mangaList.filter((m) => {
    if (m.submittedByEmail && m.submittedByEmail.toLowerCase() === currentUserEmail.toLowerCase()) {
      return true;
    }
    if (
      (currentUserEmail.includes('mlungisenimbhele') ||
        currentUserEmail === 'mlungisenimbhele3@gmail.com' ||
        currentUserEmail === 'azoververse@gmail.com') &&
      (m.author.includes('Mbhele') || m.id.includes('zulu'))
    ) {
      return true;
    }
    if (
      m.author.toLowerCase().includes('ndaba') ||
      m.author.toLowerCase().includes('khumalo') ||
      m.author.toLowerCase().includes('moyo')
    ) {
      return (
        currentUserEmail !== 'mlungisenimbhele3@gmail.com' &&
        currentUserEmail !== 'azoververse@gmail.com'
      );
    }
    return false;
  });

  const effectiveSeries = mySeries.length > 0 ? mySeries : [mangaList[0]];
  const totalReads = effectiveSeries.reduce((acc, m) => acc + (m.views || 0), 0);

  // All earnings reduced to R0 across Pending / Payable / Paid
  const pendingZAR = 0;
  const payableZAR = 0;
  const paidZAR = 0;
  const thresholdProgressPct = Math.min(
    100,
    Math.round((payableZAR / PAYMENT_THRESHOLD_ZAR) * 100)
  );

  const [activityFilter, setActivityFilter] = useState<StudioWalletFilter>('all');

  // Google Play / AdMob Settlement Modal state
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState(PAYOUT_CHANNELS[0]);
  const [merchantAccountId, setMerchantAccountId] = useState('GPLAY-MERCHANT-882910');
  const [accountHolder, setAccountHolder] = useState(
    currentUserEmail.split('@')[0].toUpperCase() + ' STUDIO'
  );
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
        amountZAR: 0,
        channel: selectedChannel,
        date: new Date().toLocaleDateString('en-ZA', { dateStyle: 'medium' }),
      });
    }, 1000);
  };

  const walletStatements = [
    {
      id: 'creator-stmt-oct-2026',
      period: 'Oct 1 – 31, 2026',
      stage: 'pending' as const,
      stageLabel: 'Pending',
      description: 'Current-month 70% AdMob & Google Play VIP royalties (accruing)',
      note: 'Finalizes Nov 7 – 12, 2026',
      amount: 0,
    },
    {
      id: 'creator-stmt-sep-2026',
      period: 'Sep 1 – 30, 2026',
      stage: 'payable' as const,
      stageLabel: 'Payable',
      description: 'Audited creator statement finalized into wallet balance',
      note: 'Carried forward toward R1,000.00 threshold',
      amount: 0,
    },
    {
      id: 'creator-stmt-paid-summary',
      period: 'Lifetime Disbursed',
      stage: 'paid' as const,
      stageLabel: 'Paid',
      description: 'Completed monthly disbursements (21st – 26th payout window)',
      note: '0 completed settlements',
      amount: 0,
    },
  ];

  const visibleStatements =
    activityFilter === 'all'
      ? walletStatements
      : walletStatements.filter((item) => item.stage === activityFilter);

  return (
    <div id="creator-earnings-view" className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <img
            src={APP_LOGO_SRC}
            alt="AZ OVERVERSE"
            className="h-11 w-11 rounded-2xl object-cover border border-slate-800 shrink-0"
          />
          <div>
            <h2 className="font-['Bebas_Neue',sans-serif] text-3xl tracking-wide text-white leading-none">
              IN-APP CREATOR WALLET & <span className="text-emerald-400">EARNINGS</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              YouTube Studio-style wallet for <strong className="text-white">{currentUserEmail}</strong> · Personal royalties only
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-300">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Google Play Billing · Google AdMob</span>
        </div>
      </div>

      {/* Confidentiality Notice */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3.5 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            <strong>Author Privacy Protected:</strong> Platform treasury and distribution controls remain restricted to administrator (
            <strong className="text-amber-300">mlungisenimbhele3@gmail.com</strong>). You are viewing solely your own series wallet.
          </span>
        </div>
      </div>

      {/* YOUTUBE STUDIO IN-APP WALLET: PENDING / PAYABLE / PAID */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-white">
              In-App Wallet Balance · Pending, Payable & Paid
            </h3>
            <p className="text-xs text-slate-400">
              Earnings finalize into Payable between the 7th – 12th and disburse between the 21st – 26th once R1,000.00 is reached.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsPayModalOpen(true)}
            className="min-h-[40px] inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 py-2 px-4 text-xs font-bold transition whitespace-nowrap self-start sm:self-auto"
          >
            <Send className="w-3.5 h-3.5 shrink-0" />
            <span>Configure Settlement Account</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Pending */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-semibold text-amber-400">
              <span>Pending</span>
              <Clock className="w-4 h-4 shrink-0" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white font-mono tabular-nums">
              R{pendingZAR.toFixed(2)}
            </div>
            <p className="text-[11px] text-slate-400 font-mono tabular-nums">
              Oct 1 – 31, 2026 · Finalizes Nov 7 – 12
            </p>
            <p className="text-xs text-slate-400 pt-1 leading-relaxed">
              Estimated 70% AdMob & VIP read-time share currently under monthly verification.
            </p>
          </div>

          {/* Payable */}
          <div className="rounded-xl border border-emerald-500/40 bg-slate-900/80 p-4 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-semibold text-emerald-400">
              <span>Payable</span>
              <Wallet className="w-4 h-4 shrink-0" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-300 font-mono tabular-nums">
              R{payableZAR.toFixed(2)}
            </div>
            <p className="text-[11px] text-slate-400 font-mono tabular-nums">
              Finalized balance · Disburses 21st – 26th
            </p>
            <p className="text-xs text-slate-400 pt-1 leading-relaxed">
              Audited royalties ready for automatic payout once the R1,000.00 threshold is met.
            </p>
          </div>

          {/* Paid */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-semibold text-sky-400">
              <span>Paid</span>
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white font-mono tabular-nums">
              R{paidZAR.toFixed(2)}
            </div>
            <p className="text-[11px] text-slate-400 font-mono tabular-nums">
              Lifetime disbursed · 0 payouts
            </p>
            <p className="text-xs text-slate-400 pt-1 leading-relaxed">
              Total finalized payouts transferred to your Google Play or AdMob publisher account.
            </p>
          </div>
        </div>

        {/* YouTube Studio Payment Threshold Bar */}
        <div className="pt-4 border-t border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono tabular-nums">
            <span className="text-slate-300 font-sans font-medium">Payment threshold progress</span>
            <span className="text-white font-bold">
              R{payableZAR.toFixed(2)} / R{PAYMENT_THRESHOLD_ZAR.toLocaleString('en-ZA', { minimumFractionDigits: 2 })} ({thresholdProgressPct}%)
            </span>
          </div>
          <div
            role="progressbar"
            aria-valuenow={thresholdProgressPct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Creator payment threshold progress"
            className="h-2 w-full rounded-full bg-slate-900 border border-slate-800 overflow-hidden"
          >
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${thresholdProgressPct}%` }}
            />
          </div>
        </div>

        {/* Filterable Statement Rows */}
        <div className="pt-4 border-t border-slate-800/80 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="text-xs font-semibold text-slate-300">Monthly Wallet Statements</span>
            <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-slate-900 border border-slate-800 self-start">
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
                  onClick={() => setActivityFilter(tab.id)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${
                    activityFilter === tab.id
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="divide-y divide-slate-800/80">
            {visibleStatements.map((row) => (
              <div
                key={row.id}
                className="py-3 first:pt-1 last:pb-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-white">{row.period}</span>
                    <span className="text-slate-600" aria-hidden="true">·</span>
                    <span
                      className={`font-semibold ${
                        row.stage === 'pending'
                          ? 'text-amber-400'
                          : row.stage === 'payable'
                          ? 'text-emerald-400'
                          : 'text-sky-400'
                      }`}
                    >
                      {row.stageLabel}
                    </span>
                  </div>
                  <p className="text-slate-400 mt-0.5">{row.description}</p>
                </div>
                <div className="text-left sm:text-right font-mono tabular-nums shrink-0">
                  <div className="font-bold text-white">R{row.amount.toFixed(2)}</div>
                  <div className="text-[11px] text-slate-500">{row.note}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Core Creator Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Metric 1: Total Reads */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-semibold">Total Reads</span>
            <Eye className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono tabular-nums">
            {totalReads.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-400">Across your {effectiveSeries.length} published series</p>
        </div>

        {/* Metric 2: 70% Ad Share */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-amber-400 font-semibold">70% Ad Share</span>
            <Coins className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono tabular-nums">R0</div>
          <p className="text-[11px] text-slate-400">From chapter breaks & rewarded ads</p>
        </div>

        {/* Metric 3: 70% VIP Pool */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-purple-400 font-semibold">70% VIP Pool</span>
            <Sparkles className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono tabular-nums">R0</div>
          <p className="text-[11px] text-slate-400">Proportional VIP subscriber read-time</p>
        </div>
      </div>

      {/* Creator Series Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950/70 overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between flex-wrap gap-2">
          <div>
            <h4 className="text-sm font-bold text-white">Your Published Series Royalty Breakdown</h4>
            <p className="text-xs text-slate-400">Individual performance metrics for your titles</p>
          </div>
          <button
            type="button"
            onClick={onOpenUploadModal}
            className="min-h-[40px] rounded-xl bg-amber-500 hover:bg-amber-400 text-black px-4 py-2 text-xs font-bold transition"
          >
            Upload New Chapter
          </button>
        </div>

        <div className="divide-y divide-slate-800/80">
          {effectiveSeries.map((manga, idx) => {
            const mAdZAR = 0;
            const mSubZAR = 0;
            const mTotalZAR = 0;

            return (
              <div
                key={`${manga.id}-${idx}`}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={
                      manga.cover ||
                      manga.coverImage ||
                      APP_LOGO_SRC
                    }
                    alt={manga.title}
                    onError={(e: any) => {
                      e.target.onerror = null;
                      e.target.src = APP_LOGO_SRC;
                    }}
                    className="h-14 w-11 rounded-lg object-cover border border-slate-800 shrink-0"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h5 className="font-bold text-sm text-white">{manga.title}</h5>
                      {manga.isOriginal ? (
                        <span className="text-[11px] font-semibold text-amber-400">· AZ Original</span>
                      ) : (
                        <span className="text-[11px] font-medium text-slate-400">· Backdrop</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5 tabular-nums">
                      {manga.chapters.length} Chapters · {manga.views.toLocaleString()} Total Reads
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6 text-right font-mono tabular-nums text-xs">
                  <div>
                    <span className="text-[11px] text-slate-500 block font-sans">Pending</span>
                    <span className="text-amber-400">R{mAdZAR.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block font-sans">Payable</span>
                    <span className="text-emerald-400">R{mSubZAR.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block font-sans">Paid</span>
                    <span className="text-sky-400 font-bold">R{mTotalZAR.toFixed(2)}</span>
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
              <div className="flex items-center gap-2.5">
                <img
                  src={APP_LOGO_SRC}
                  alt="AZ OVERVERSE"
                  className="h-7 w-7 rounded-lg object-cover border border-slate-800"
                />
                <h3 className="font-['Bebas_Neue',sans-serif] text-2xl text-white">
                  Google Play & AdMob Settlement
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsPayModalOpen(false)}
                className="min-h-[40px] min-w-[40px] text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {transferReceipt ? (
              <div className="space-y-4 text-center py-4">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="font-bold text-lg text-white">Settlement Account Verified</h4>
                  <p className="text-xs text-slate-300 mt-1">
                    Your Payable wallet balance of{' '}
                    <strong className="text-emerald-400 font-mono tabular-nums">R0.00</strong> is linked to{' '}
                    {transferReceipt.channel}.
                  </p>
                </div>

                <div className="rounded-xl bg-slate-900 p-3 text-left font-mono tabular-nums text-xs space-y-1.5 border border-slate-800">
                  <div className="flex justify-between text-slate-400">
                    <span>Reference</span>
                    <span className="text-white font-bold">{transferReceipt.reference}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Channel</span>
                    <span className="text-white">{transferReceipt.channel}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Account ID</span>
                    <span className="text-white font-bold">{merchantAccountId}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Date</span>
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
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">
                    Settlement Channel
                  </label>
                  <select
                    value={selectedChannel}
                    onChange={(e) => setSelectedChannel(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 p-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
                  >
                    {PAYOUT_CHANNELS.map((ch, idx) => (
                      <option key={`${ch}-${idx}`} value={ch}>
                        {ch}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">
                    Google Play Merchant / AdMob Publisher ID
                  </label>
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
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">
                    Publisher / Developer Name
                  </label>
                  <input
                    type="text"
                    value={accountHolder}
                    onChange={(e) => setAccountHolder(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 p-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
                    placeholder="Publisher account name"
                    required
                  />
                </div>

                <div className="rounded-xl bg-slate-900 border border-slate-800 p-3 space-y-1.5 text-xs font-mono tabular-nums">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="font-sans">Pending Balance</span>
                    <span className="text-amber-400">R0.00</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="font-sans">Payable Balance (Threshold R1,000.00)</span>
                    <span className="font-bold text-emerald-400">R0.00</span>
                  </div>
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
                    className="min-h-[40px] px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap"
                  >
                    <Send className="w-3.5 h-3.5 shrink-0" />
                    <span>{isSubmittingTransfer ? 'Saving...' : 'Save & Verify'}</span>
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
