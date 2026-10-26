import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CreatorStats, Manga, PayoutTransaction, CreatorPayoutSettings, Chapter } from '../../types';
import {
  Coins,
  TrendingUp,
  Eye,
  Sparkles,
  Award,
  BarChart3,
  X,
  ArrowUpRight,
  HelpCircle,
  Building2,
  CreditCard,
  Send,
  Zap,
  UploadCloud,
  Plus,
  PieChart as PieChartIcon,
} from 'lucide-react';
import { CreatorPayoutManager } from './CreatorPayoutManager';
import { ChapterUploadManager } from './ChapterUploadManager';
import { INITIAL_CREATOR_PAYOUT_SETTINGS, INITIAL_PAYOUT_HISTORY, USD_TO_ZAR_RATE } from '../../data/paymentData';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface CreatorDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: CreatorStats;
  mangaList: Manga[];
  onExecutePayout?: (payout: PayoutTransaction) => void;
  onUpdatePayoutSettings?: (settings: CreatorPayoutSettings) => void;
  onPublishChapter?: (mangaId: string, chapter: Chapter) => void;
  initialTab?: 'analytics' | 'upload_chapter' | 'payouts';
}

export const CreatorDashboardModal: React.FC<CreatorDashboardModalProps> = ({
  isOpen,
  onClose,
  stats,
  mangaList,
  onExecutePayout,
  onUpdatePayoutSettings,
  onPublishChapter,
  initialTab = 'analytics',
}) => {
  const [activeTab, setActiveTab] = useState<'analytics' | 'upload_chapter' | 'payouts'>(initialTab);
  const [selectedUploadMangaId, setSelectedUploadMangaId] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const currentPayoutSettings = stats.payoutSettings || INITIAL_CREATOR_PAYOUT_SETTINGS;
  const currentPayoutHistory = stats.payoutHistory || INITIAL_PAYOUT_HISTORY;
  const totalMonthlyUSD = stats.monthlyAdRevenue + stats.monthlySubShareRevenue;
  const totalMonthlyZAR = totalMonthlyUSD * USD_TO_ZAR_RATE;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          id="creator-dashboard-overlay"
          key="creator-dashboard-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 overflow-y-auto"
        >
          <motion.div
            id="creator-dashboard-modal"
            key="creator-dashboard-modal-card"
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{
              type: 'spring',
              damping: 26,
              stiffness: 300,
              mass: 0.75,
            }}
            className="relative my-6 w-full max-w-4xl rounded-3xl border border-slate-700 bg-slate-900 text-white shadow-2xl overflow-hidden"
          >
            {/* Top bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 bg-slate-950 px-6 py-4 gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-lg text-white">Creator Studio & Monetization</h3>
                    <span className="rounded bg-emerald-500/20 border border-emerald-500/50 px-1.5 py-0.2 text-[9px] font-black uppercase text-emerald-300">
                      70% REV-SHARE
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Google AdMob · Google Play Billing Revenue Share
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Tab switcher */}
                <div className="inline-flex rounded-xl bg-slate-900 p-1 border border-slate-800">
                  <button
                    id="creator-tab-analytics"
                    onClick={() => setActiveTab('analytics')}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold transition flex items-center gap-1.5 ${
                      activeTab === 'analytics'
                        ? 'bg-slate-800 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Analytics & Ads</span>
                  </button>

                  <button
                    id="creator-tab-upload-chapter"
                    onClick={() => {
                      setSelectedUploadMangaId(undefined);
                      setActiveTab('upload_chapter');
                    }}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold transition flex items-center gap-1.5 ${
                      activeTab === 'upload_chapter'
                        ? 'bg-amber-500 text-black shadow-sm font-black'
                        : 'text-amber-400 hover:text-amber-300'
                    }`}
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>Upload Chapter</span>
                  </button>

                  <button
                    id="creator-tab-payouts"
                    onClick={() => setActiveTab('payouts')}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold transition flex items-center gap-1.5 ${
                      activeTab === 'payouts'
                        ? 'bg-emerald-500 text-black shadow-sm font-black'
                        : 'text-emerald-400 hover:text-emerald-300'
                    }`}
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>70% Payout & Banking</span>
                  </button>
                </div>

                <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {activeTab === 'upload_chapter' ? (
                <ChapterUploadManager
                  mangaList={mangaList}
                  selectedMangaId={selectedUploadMangaId}
                  onPublishChapter={(mangaId, chapter) => {
                    if (onPublishChapter) {
                      onPublishChapter(mangaId, chapter);
                    }
                  }}
                  onCancel={() => setActiveTab('analytics')}
                />
              ) : activeTab === 'payouts' ? (
                <CreatorPayoutManager
                  availableBalanceUSD={stats.totalRevenueUSD}
                  payoutHistory={currentPayoutHistory}
                  currentSettings={currentPayoutSettings}
                  onExecutePayout={(tx) => {
                    if (onExecutePayout) {
                      onExecutePayout(tx);
                    }
                  }}
                  onUpdateSettings={(newSettings) => {
                    if (onUpdatePayoutSettings) {
                      onUpdatePayoutSettings(newSettings);
                    }
                  }}
                />
              ) : (
                <>
                  {/* Quick Upload Callout Banner */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-amber-950/40 via-amber-900/20 to-slate-950 border border-amber-500/40 rounded-2xl p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400">
                        <UploadCloud className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                          <span>Have new manga pages or chapters ready?</span>
                          <span className="rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-1.5 py-0.5">
                            70% REV-SHARE
                          </span>
                        </h4>
                        <p className="text-xs text-slate-400">
                          Upload manga scans, set dialogue balloons, and monetize instantly with ads and VIP Passes.
                        </p>
                      </div>
                    </div>
                    <button
                      id="creator-quick-upload-chapter-btn"
                      onClick={() => {
                        setSelectedUploadMangaId(undefined);
                        setActiveTab('upload_chapter');
                      }}
                      className="flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black px-4 py-2 text-xs font-bold transition shadow-md shadow-amber-500/20 shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Upload New Chapter</span>
                    </button>
                  </div>

                  {/* Estimated Earnings Projected Monthly Breakdown & Revenue Simulator */}
                  <div className="rounded-2xl border border-amber-500/30 bg-slate-950/80 p-5 space-y-4 shadow-xl">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
                          <Coins className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-white">Estimated Earnings & Revenue Projection Calculator</h4>
                          <p className="text-xs text-slate-400">Projected monthly ZAR revenue based on reader views, eCPM, and 70% rev-share</p>
                        </div>
                      </div>
                      <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 text-[11px] font-bold text-emerald-300">
                        ⚡ Real-Time Revenue Split
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="rounded-xl bg-slate-900/90 p-4 border border-slate-800 flex flex-col justify-between">
                        <div>
                          <span className="text-xs text-slate-400 block mb-1">Projected Monthly Reads</span>
                          <span className="text-2xl font-black text-white font-mono">
                            {(stats.totalReads || 0).toLocaleString()}
                          </span>
                        </div>
                        <div className="mt-3 text-[11px] text-emerald-400 flex items-center gap-1 font-semibold">
                          <TrendingUp className="w-3.5 h-3.5" />
                          <span>Estimated active reach across South Africa</span>
                        </div>
                      </div>

                      <div className="rounded-xl bg-slate-900/90 p-4 border border-slate-800 flex flex-col justify-between">
                        <div>
                          <span className="text-xs text-slate-400 block mb-1">Estimated Ad Pool (70%)</span>
                          <span className="text-2xl font-black text-amber-400 font-mono tabular-nums">
                            R0
                          </span>
                        </div>
                        <div className="mt-3 text-[11px] text-slate-400">
                          Based on Google AdMob banner & interstitial impressions
                        </div>
                      </div>

                      <div className="rounded-xl bg-slate-900/90 p-4 border border-emerald-500/40 bg-emerald-950/20 flex flex-col justify-between">
                        <div>
                          <span className="text-xs text-emerald-300 block mb-1">Total Creator Payout (ZAR)</span>
                          <span className="text-2xl font-black text-white font-mono tabular-nums">
                            R0
                          </span>
                        </div>
                        <div className="mt-3 text-[11px] text-emerald-400 font-bold flex items-center justify-between">
                          <span>Google Play & AdMob Settlement</span>
                          <span className="text-amber-300">ZAR</span>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl bg-slate-900/60 p-4 border border-slate-800 text-xs text-slate-300 space-y-2">
                      <div className="flex justify-between font-semibold text-white">
                        <span>Monetization Breakdown Component</span>
                        <span>Share %</span>
                      </div>
                      <div className="space-y-1.5 font-mono text-[11px]">
                        <div className="flex justify-between items-center bg-slate-950/60 p-2 rounded">
                          <span className="text-slate-400">Interstitial & Rewarded Ads (70% Creator Share)</span>
                          <span className="text-amber-400">55% of earnings</span>
                        </div>
                        <div className="flex justify-between items-center bg-slate-950/60 p-2 rounded">
                          <span className="text-slate-400">VIP Subscription Pool (Proportional Reading Time)</span>
                          <span className="text-purple-300">45% of earnings</span>
                        </div>
                      </div>
                    </div>
                  </div>

                    {/* Monetization Channels Callout Banner */}
                  <div className="space-y-4">
                    <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0">
                          <Send className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm text-white">Google Play Billing & Google AdMob Payouts</h4>
                            <span className="text-[10px] text-emerald-400 font-bold">
                              Active
                            </span>
                          </div>
                          <p className="text-xs text-slate-300">
                            70% creator share settled directly via Google Play Console Merchant and Google AdMob Publisher accounts.
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveTab('payouts')}
                        className="min-h-[40px] rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black px-4 py-2 text-xs font-bold transition shrink-0 flex items-center gap-1.5 whitespace-nowrap"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Manage Payout Account</span>
                      </button>
                    </div>
                  </div>

                  {/* Monetization Mechanics Explanation */}
                  <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
                    <h4 className="font-bold text-sm text-white mb-3 flex items-center gap-2">
                      <HelpCircle className="w-4 h-4 text-amber-400" />
                      How 70% Revenue Share Works For Creators
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-300">
                      <div className="rounded-xl bg-slate-900/90 p-3.5 border border-slate-800">
                        <span className="font-bold text-amber-400 block mb-1">
                          1. 70% of Google AdMob Placements
                        </span>
                        <p className="text-slate-400 leading-relaxed">
                          Readers enjoy free manga with persistent Google AdMob bottom banners and rewarded video ads to unlock next chapters. Creators receive 70% of all AdMob revenue generated by their series.
                        </p>
                      </div>
                      <div className="rounded-xl bg-slate-900/90 p-3.5 border border-slate-800">
                        <span className="font-bold text-purple-300 block mb-1">
                          2. 70% of Google Play Billing Subscriptions
                        </span>
                        <p className="text-slate-400 leading-relaxed">
                          Subscribers purchase VIP, Early Access, and Patron passes via Google Play Billing. 70% of subscription revenue is distributed to creators proportionally by subscriber reading time.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Trending Genres Data Visualization Section (Recharts) */}
                  <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400">
                          <TrendingUp className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-white">Trending Genres Among Readers (Recharts)</h4>
                          <p className="text-xs text-slate-400">Reader views and engagement distribution across manga genres</p>
                        </div>
                      </div>
                      <span className="rounded-full bg-amber-500/10 border border-amber-500/30 px-3 py-1 text-[11px] font-bold text-amber-300">
                        📊 Live Reader Metrics
                      </span>
                    </div>

                    <div className="pt-2 space-y-4">
                      <div className="h-72 w-full">
                        {(() => {
                          const SHORT_GENRE_NAMES: { [key: string]: string } = {
                            'Action': 'Action',
                            'Shonen': 'Shonen',
                            'Seinen': 'Seinen',
                            'Fantasy': 'Fantasy',
                            'Slice of Life': 'Slice',
                            'Romance': 'Romance',
                            'Sci-Fi': 'Sci-Fi',
                            'Pan-African': 'Afro',
                            'Afro-Futurism': 'Afro',
                            'Supernatural': 'Mystic',
                          };

                          const genreMap: { [genre: string]: number } = {};
                          mangaList.forEach((m) => {
                            m.genres.forEach((g) => {
                              const shortG = SHORT_GENRE_NAMES[g] || g;
                              genreMap[shortG] = (genreMap[shortG] || 0) + m.views;
                            });
                          });
                          const genreChartData = Object.keys(genreMap)
                            .map((genre) => ({
                              genre,
                              views: genreMap[genre],
                              readers: Math.round(genreMap[genre] / 2.2),
                            }))
                            .sort((a, b) => b.views - a.views)
                            .slice(0, 7);

                          const CHART_COLORS = ['#f59e0b', '#3b82f6', '#ec4899', '#10b981', '#a855f7', '#06b6d4', '#e11d48'];

                          return (
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart
                                data={genreChartData}
                                layout="vertical"
                                margin={{ top: 10, right: 30, left: 15, bottom: 80 }}
                              >
                                <XAxis
                                  type="number"
                                  stroke="#94a3b8"
                                  fontSize={10}
                                  tickLine={false}
                                  angle={0}
                                  tickFormatter={(val) =>
                                    Number(val) >= 1000 ? `${(Number(val) / 1000).toFixed(0)}k` : String(val)
                                  }
                                />
                                <YAxis
                                  type="category"
                                  dataKey="genre"
                                  stroke="#cbd5e1"
                                  fontSize={10}
                                  tickLine={false}
                                  width={65}
                                />
                                <Tooltip
                                  contentStyle={{
                                    backgroundColor: '#020617',
                                    borderColor: '#334155',
                                    borderRadius: '0.75rem',
                                    color: '#fff',
                                    fontSize: '11px',
                                  }}
                                  formatter={(value: any) => [`${Number(value).toLocaleString()} Reads`, 'Total Views']}
                                />
                                <Bar dataKey="views" radius={[0, 6, 6, 0]}>
                                  {genreChartData.map((_entry, index) => (
                                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                  ))}
                                </Bar>
                              </BarChart>
                            </ResponsiveContainer>
                          );
                        })()}
                      </div>

                      {/* Clear Genre Names & Metrics List Next to Bars */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 pt-2 border-t border-slate-800">
                        {(() => {
                          const genreMap: { [genre: string]: number } = {};
                          const SHORT_GENRE_NAMES: { [key: string]: string } = {
                            'Action': 'Action',
                            'Shonen': 'Shonen',
                            'Seinen': 'Seinen',
                            'Fantasy': 'Fantasy',
                            'Slice of Life': 'Slice',
                            'Romance': 'Romance',
                            'Sci-Fi': 'Sci-Fi',
                            'Pan-African': 'Afro',
                          };
                          mangaList.forEach((m) => {
                            m.genres.forEach((g) => {
                              const shortG = SHORT_GENRE_NAMES[g] || g;
                              genreMap[shortG] = (genreMap[shortG] || 0) + m.views;
                            });
                          });
                          const list = Object.keys(genreMap)
                            .map((genre) => ({ genre, views: genreMap[genre] }))
                            .sort((a, b) => b.views - a.views)
                            .slice(0, 7);

                          const CHART_COLORS = ['#f59e0b', '#3b82f6', '#ec4899', '#10b981', '#a855f7', '#06b6d4', '#e11d48'];

                          return list.map((item, i) => (
                            <div key={`${item.genre}-${i}`} className="rounded-xl bg-slate-900/90 p-2 border border-slate-800 text-center">
                              <span
                                className="inline-block w-2 h-2 rounded-full mr-1.5 align-middle"
                                style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                              />
                              <span className="text-[10px] font-bold text-white">{item.genre}</span>
                              <div className="font-mono text-[10px] text-slate-400 mt-0.5">
                                {item.views >= 1000
                                  ? `${(item.views / 1000).toFixed(1)}k`
                                  : item.views.toLocaleString()}
                              </div>
                            </div>
                          ));
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* Series Breakdown Table */}
                  <div className="rounded-2xl border border-slate-800 bg-slate-950/60 overflow-hidden">
                    <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between">
                      <span className="text-xs font-bold text-white uppercase tracking-wider">
                        Published Series 70% Earnings Breakdown
                      </span>
                      <span className="text-xs text-slate-400">{mangaList.length} Titles Listed</span>
                    </div>
                    <div className="divide-y divide-slate-800/80">
                      {mangaList.map((m, idx) => {
                        return (
                          <div key={`${m.id}-${idx}`} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <img
                                src={m.coverImage}
                                alt={m.title}
                                className="h-12 w-9 rounded-md object-cover"
                                referrerPolicy="no-referrer"
                              />
                              <div>
                                <h5 className="text-sm font-bold text-white">{m.title}</h5>
                                <span className="text-[11px] text-slate-400 tabular-nums">
                                  {m.chapters.length} Chapters · {m.views.toLocaleString()} Total Reads
                                </span>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-4 sm:gap-6 self-end sm:self-center font-mono tabular-nums">
                              <div className="text-right">
                                <span className="text-[10px] text-slate-400 block font-sans">70% Ad Share</span>
                                <span className="text-xs font-bold text-amber-400">R0</span>
                              </div>
                              <div className="text-right">
                                <span className="text-[10px] text-slate-400 block font-sans">70% VIP Pool</span>
                                <span className="text-xs font-bold text-purple-300">R0</span>
                              </div>
                              <div className="text-right pl-3 border-l border-slate-800">
                                <span className="text-[10px] text-slate-400 block font-sans">Total Disbursable</span>
                                <span className="text-sm font-black text-white">
                                  R0
                                </span>
                              </div>
                              <button
                                id={`upload-chapter-series-${m.id}`}
                                onClick={() => {
                                  setSelectedUploadMangaId(m.id);
                                  setActiveTab('upload_chapter');
                                }}
                                className="flex items-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 px-3 py-1.5 text-xs font-bold transition shadow-sm shrink-0"
                                title={`Upload a new chapter to ${m.title}`}
                              >
                                <UploadCloud className="w-3.5 h-3.5 text-amber-400" />
                                <span>+ Upload Chapter</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
export default CreatorDashboardModal;

