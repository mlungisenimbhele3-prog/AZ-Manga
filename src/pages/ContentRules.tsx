import React, { useState } from 'react';
import {
  ArrowLeft,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Flag,
  Sparkles,
  Baby,
  Users,
  Flame,
  Skull,
  Mail,
  Check,
} from 'lucide-react';

interface ContentRulesProps {
  onClose?: () => void;
  onOpenReportModal?: () => void;
}

export const ContentRules: React.FC<ContentRulesProps> = ({
  onClose,
  onOpenReportModal,
}) => {
  const [reportSubmitted, setReportSubmitted] = useState(false);
  const [reportText, setReportText] = useState('');
  const [reportedTitle, setReportedTitle] = useState('');
  const [isReportingOpen, setIsReportingOpen] = useState(false);

  const handleSendReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportedTitle.trim()) return;
    setReportSubmitted(true);
    setTimeout(() => {
      setReportSubmitted(false);
      setIsReportingOpen(false);
      setReportText('');
      setReportedTitle('');
    }, 2500);
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-200 p-4 sm:p-8 md:p-12 font-sans selection:bg-amber-500/30">
      <div className="max-w-4xl mx-auto space-y-6">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-2 text-amber-400 hover:text-amber-300 font-bold transition active:scale-95 text-xs sm:text-sm py-2 px-3 rounded-xl bg-slate-900 border border-slate-800"
            aria-label="Back to App"
          >
            <ArrowLeft className="w-4 h-4 text-amber-400" />
            <span>Back to App</span>
          </button>
        )}

        {/* Header Hero */}
        <div className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900/90 via-[#0d121d] to-[#07090e] p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[11px] font-bold uppercase tracking-wider">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>AZ OVERVERSE • Official Community Standards</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                AZ OVERVERSE - Age Rating Rules
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
                Content Rules & Publishing Standards for all Creators and Readers.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                if (onOpenReportModal) {
                  onOpenReportModal();
                } else {
                  setIsReportingOpen(true);
                }
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-950/40 hover:bg-red-950/60 border border-red-500/40 text-red-300 font-bold text-xs transition active:scale-95 shrink-0 self-start sm:self-center"
            >
              <Flag className="w-4 h-4 text-red-400" />
              <span>Report Violation</span>
            </button>
          </div>
        </div>

        {/* Golden Mandatory Rule Notice */}
        <div className="rounded-2xl border-2 border-amber-500/60 bg-gradient-to-r from-amber-950/40 via-amber-900/20 to-amber-950/40 p-5 shadow-xl">
          <div className="flex items-start gap-3.5">
            <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h2 className="text-sm sm:text-base font-extrabold text-amber-300 uppercase tracking-wide">
                Mandatory Publishing Standard
              </h2>
              <p className="text-xs sm:text-sm text-amber-100/90 leading-relaxed font-medium">
                All manga must follow these rules, no matter what rating you choose. If you break them, your series will be removed.
              </p>
            </div>
          </div>
        </div>

        {/* 4 Age Rating Tiers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* 1. ALL AGES */}
          <div className="rounded-2xl border border-emerald-500/30 bg-slate-900/70 p-5 space-y-3 relative overflow-hidden hover:border-emerald-500/60 transition">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-mono font-black text-xs uppercase tracking-wider">
                ALL AGES
              </span>
              <Baby className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">For Everyone</h3>
              <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                No blood, no gore, no swearing, no kissing beyond a quick peck, no scary horror.
              </p>
              <div className="mt-3 p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-emerald-300/90 font-medium">
                💡 <strong>Think:</strong> Sunday morning cartoon.
              </div>
            </div>
          </div>

          {/* 2. 13+ */}
          <div className="rounded-2xl border border-cyan-500/30 bg-slate-900/70 p-5 space-y-3 relative overflow-hidden hover:border-cyan-500/60 transition">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 font-mono font-black text-xs uppercase tracking-wider">
                13+
              </span>
              <Users className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Young Teen Readers</h3>
              <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                Mild action violence, a little blood, mild swearing, crushes and romance, spooky but not scary.
              </p>
              <div className="mt-3 p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-cyan-300/90 font-medium">
                🚫 <strong>Restrictions:</strong> No gore, no sexual content, no detailed injuries.
              </div>
            </div>
          </div>

          {/* 3. 16+ */}
          <div className="rounded-2xl border border-amber-500/30 bg-slate-900/70 p-5 space-y-3 relative overflow-hidden hover:border-amber-500/60 transition">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/40 font-mono font-black text-xs uppercase tracking-wider">
                16+
              </span>
              <Flame className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Older Teen Readers</h3>
              <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                Stronger violence, blood, horror, death, trauma, strong language, suggestive outfits, kissing and romantic tension, implied intimacy off-screen.
              </p>
              <div className="mt-3 p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-amber-300/90 font-medium">
                🚫 <strong>Restrictions:</strong> No explicit sex, no genitalia, no graphic sexual violence.
              </div>
            </div>
          </div>

          {/* 4. 18+ */}
          <div className="rounded-2xl border border-rose-500/40 bg-slate-900/70 p-5 space-y-3 relative overflow-hidden hover:border-rose-500/70 transition">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/40 font-mono font-black text-xs uppercase tracking-wider">
                18+
              </span>
              <Skull className="w-5 h-5 text-rose-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Mature Readers Only</h3>
              <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                Intense gore, graphic violence, horror, dark themes, strong language, suggestive themes, implied sex.
              </p>
              <div className="mt-3 p-2.5 rounded-xl bg-rose-950/30 border border-rose-500/30 text-[11px] text-rose-300 font-bold">
                ⚠️ This is strictly for MATURE readers only.
              </div>
            </div>
          </div>
        </div>

        {/* NEVER ALLOWED Section - Even in 18+ */}
        <div className="rounded-3xl border-2 border-red-600/70 bg-gradient-to-b from-red-950/50 via-slate-950 to-slate-950 p-6 sm:p-8 space-y-4 shadow-2xl">
          <div className="flex items-center gap-3 pb-3 border-b border-red-500/30">
            <div className="p-2 rounded-xl bg-red-600 text-white font-bold">
              <XCircle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-red-300 uppercase tracking-wide">
                NEVER ALLOWED — Even in 18+
              </h2>
              <p className="text-xs text-slate-400">
                Zero-tolerance violations resulting in immediate permanent removal and account suspension:
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-900/90 border border-red-500/30 text-xs text-slate-200">
              <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span><strong>No explicit sex acts</strong> or visible genitals</span>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-900/90 border border-red-500/30 text-xs text-slate-200">
              <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span><strong>No pornographic / hentai content</strong></span>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-900/90 border border-red-500/30 text-xs text-slate-200">
              <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span><strong>No sexual content</strong> involving minors or characters who look like minors</span>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-900/90 border border-red-500/30 text-xs text-slate-200">
              <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span><strong>No real photos</strong> of sexual content or real gore</span>
            </div>
          </div>
        </div>

        {/* Review & Enforcement Details */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-3 text-xs sm:text-sm text-slate-300 leading-relaxed">
          <h3 className="text-sm font-bold text-amber-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-amber-400" />
            <span>Admin Review & Approval Workflow</span>
          </h3>
          <p>
            Your series will stay as <strong className="text-amber-300">"Pending Review"</strong> until an Admin checks it.
          </p>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300">
            <strong>Important distinction:</strong> Choosing <span className="text-rose-400 font-bold">18+</span> does <em>not</em> mean you can post porn. It means you can post darker, more violent stories.
          </div>
          <p className="text-slate-400 text-xs">
            If you see something that breaks these rules, please report it immediately using the button above or contact the team at <a href="mailto:mlungisenimbhele3@gmail.com" className="text-amber-400 underline font-mono">mlungisenimbhele3@gmail.com</a>.
          </p>
        </div>

        {/* Inline Report Violation Modal */}
        {isReportingOpen && (
          <div
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setIsReportingOpen(false)}
          >
            <div
              className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Flag className="w-5 h-5 text-red-400" />
                  <h3 className="text-sm font-bold text-white">Report Content Rule Violation</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsReportingOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              {reportSubmitted ? (
                <div className="py-8 text-center space-y-2">
                  <Check className="w-10 h-10 text-emerald-400 mx-auto" />
                  <p className="text-sm font-bold text-white">Thank you for keeping AZ OVERVERSE safe.</p>
                  <p className="text-xs text-slate-400">Our admin team will review this series within 24 hours.</p>
                </div>
              ) : (
                <form onSubmit={handleSendReport} className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Manga Title or Creator Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Manga title or author pen name"
                      value={reportedTitle}
                      onChange={(e) => setReportedTitle(e.target.value)}
                      className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Reason for Report *
                    </label>
                    <textarea
                      required
                      rows={3}
                      placeholder="Explain what rule is broken (e.g. pornographic content, graphic nudity, unrated gore)..."
                      value={reportText}
                      onChange={(e) => setReportText(e.target.value)}
                      className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsReportingOpen(false)}
                      className="px-4 py-2 rounded-xl border border-slate-800 text-slate-300 hover:bg-slate-800 text-xs font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs transition"
                    >
                      Submit Report
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContentRules;
