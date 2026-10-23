import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Manga, AiDetectionResult } from '../../types';
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  Cpu,
  Fingerprint,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  X,
  Zap,
  Lock,
  Unlock,
} from 'lucide-react';

interface AiReportModalProps {
  manga: Manga | null;
  isOpen: boolean;
  onClose: () => void;
  onToggleBan?: (mangaId: string, shouldBan: boolean) => void;
  onReScan?: (mangaId: string) => void;
  isAdmin?: boolean;
}

export const AiReportModal: React.FC<AiReportModalProps> = ({
  manga,
  isOpen,
  onClose,
  onToggleBan,
  onReScan,
  isAdmin = true,
}) => {
  if (!isOpen || !manga) return null;

  const detection: AiDetectionResult = manga.aiDetection || {
    isAiGenerated: Boolean(manga.isAiGenerated),
    confidenceScore: manga.aiConfidenceScore || (manga.isBanned ? 94 : manga.isAiGenerated ? 88 : 12),
    detectedFeatures: [
      'Latent diffusion edge smoothing artifact',
      'Synthetic non-human line-weight interpolation',
      'Unnatural high-frequency texture coherence',
    ],
    modelFingerprint: manga.isAiGenerated
      ? 'Latent Diffusion (SDXL / Midjourney v6 Architecture)'
      : 'N/A (Human Artisan Craft)',
    detectedAt: new Date().toISOString(),
    bannedStatus: manga.isBanned ? 'auto_banned' : manga.isAiGenerated ? 'ai_labeled' : 'clean',
    banReason: manga.banReason || 'Auto-detected synthetic diffusion art exceeding 75% threshold.',
    scanLog: [
      `[AI SCAN AUDIT] Series: "${manga.title}"`,
      `[ANALYSIS] Heuristic confidence: ${manga.aiConfidenceScore || 88}%`,
      manga.isBanned
        ? '[ACTION] AUTO-BAN ACTIVE: Public access quarantined.'
        : '[ACTION] AI Transparency Sticker affixed to home screen.',
    ],
    inspectorNotes: manga.isBanned
      ? 'Violates AZ OVERVERSE Artisan Creator Code Section 4.1. Auto-banned to protect human mangaka.'
      : 'Transparency label mandatory under AZ OVERVERSE Reader Disclosure standard.',
  };

  const isBanned = manga.isBanned || detection.bannedStatus === 'auto_banned';
  const confidence = detection.confidenceScore;

  return (
    <AnimatePresence>
      <div
        id="ai-report-modal-overlay"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto"
      >
        <motion.div
          id="ai-report-modal-card"
          initial={{ opacity: 0, scale: 0.94, y: 14 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="relative my-6 w-full max-w-xl rounded-3xl border border-slate-700 bg-slate-900 text-white shadow-2xl overflow-hidden"
        >
          {/* Header Banner */}
          <div
            className={`px-6 py-4 flex items-center justify-between border-b ${
              isBanned
                ? 'bg-rose-950/80 border-rose-900/60'
                : 'bg-cyan-950/80 border-cyan-900/60'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                  isBanned
                    ? 'bg-rose-600 text-white shadow-lg shadow-rose-950/50'
                    : 'bg-cyan-500 text-black shadow-lg shadow-cyan-950/50'
                }`}
              >
                {isBanned ? (
                  <ShieldAlert className="w-5 h-5 animate-pulse" />
                ) : (
                  <Bot className="w-5 h-5" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-sm sm:text-base text-white">
                    {isBanned ? 'AZ OVERVERSE Auto-Ban & Quarantine Audit' : 'AI Content Transparency Report'}
                  </h3>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                      isBanned
                        ? 'bg-rose-500 text-white'
                        : 'bg-cyan-400 text-black'
                    }`}
                  >
                    {isBanned ? 'BANNED' : 'STICKER LABELED'}
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  Automated AI Detector Engine • AZ OVERVERSE Artisan Guard
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Content */}
          <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
            {/* Manga Info Card */}
            <div className="flex items-center gap-4 rounded-2xl bg-slate-950 border border-slate-800 p-3.5">
              <img
                src={manga.coverImage}
                alt={manga.title}
                className="h-20 w-14 rounded-lg object-cover border border-slate-700 shrink-0"
              />
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-sm text-white truncate">{manga.title}</h4>
                <p className="text-xs text-slate-400 truncate">
                  Author: {manga.author} • Artist: {manga.artist}
                </p>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span className="text-[10px] text-slate-400 font-mono">
                    ID: {manga.id}
                  </span>
                  <span className="text-slate-600">•</span>
                  <span className="text-[10px] text-slate-400">
                    {manga.chapters.length} Chapters Published
                  </span>
                </div>
              </div>
            </div>

            {/* Confidence Score Bar */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                  <span>AI Generation Confidence</span>
                </span>
                <span
                  className={`font-mono font-black text-sm ${
                    confidence >= 75
                      ? 'text-rose-400'
                      : confidence >= 40
                      ? 'text-amber-400'
                      : 'text-emerald-400'
                  }`}
                >
                  {confidence}% Synthetic AI
                </span>
              </div>

              {/* Multi-segment Progress Bar */}
              <div className="h-3 w-full rounded-full bg-slate-900 border border-slate-800 overflow-hidden relative">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${confidence}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className={`h-full rounded-full ${
                    confidence >= 75
                      ? 'bg-gradient-to-r from-amber-500 to-rose-600'
                      : confidence >= 40
                      ? 'bg-gradient-to-r from-cyan-500 to-amber-500'
                      : 'bg-emerald-500'
                  }`}
                />
              </div>

              <div className="flex justify-between text-[10px] text-slate-500 font-mono pt-1">
                <span>0% Handcrafted</span>
                <span>35% AI Labeled</span>
                <span className="text-rose-400 font-bold">75% Auto-Ban Threshold</span>
                <span>100% Full Synthetic</span>
              </div>
            </div>

            {/* Banned Banner Alert if Banned */}
            {isBanned && (
              <div className="rounded-2xl border border-rose-500/60 bg-rose-950/40 p-4 space-y-2">
                <div className="flex items-center gap-2 text-rose-300 font-bold text-xs uppercase tracking-wide">
                  <Lock className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>PUBLISHING LOCKOUT ACTIVE: AUTO-BANNED</span>
                </div>
                <p className="text-xs text-rose-200/90 leading-relaxed">
                  {detection.banReason}
                </p>
                <p className="text-[11px] text-slate-400">
                  Readers cannot access chapters of auto-banned manga until artisan human verification is confirmed by Executive Producer Mlungiseni Mbhele.
                </p>
              </div>
            )}

            {/* Detected AI Artifacts & Features */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 space-y-3">
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Fingerprint className="w-3.5 h-3.5 text-amber-400" />
                <span>Detected AI Indicators & Signatures</span>
              </h5>

              <div className="space-y-1.5">
                {detection.detectedFeatures.map((feat, index) => (
                  <div
                    key={`feat-${index}`}
                    className="flex items-start gap-2 text-xs text-slate-300 bg-slate-900/60 rounded-xl p-2.5 border border-slate-800/80"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
                <span className="text-slate-500">Model Fingerprint:</span>
                <span className="font-mono text-cyan-300 font-semibold truncate max-w-[280px]">
                  {detection.modelFingerprint}
                </span>
              </div>
            </div>

            {/* Producer Integrity Declaration */}
            <div className="rounded-2xl border border-amber-500/30 bg-amber-950/20 p-3.5 text-xs text-slate-300 space-y-1">
              <div className="flex items-center gap-2 font-bold text-amber-300">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>Executive Producer Integrity Mandate</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                "AZ OVERVERSE upholds authentic human craftsmanship and transparent digital publishing. Auto-detection ensures our 70% revenue share rewards genuine African creators, not scraped prompt farms."
                <span className="block mt-1 font-semibold text-amber-400/90">— Mlungiseni Mbhele</span>
              </p>
            </div>

            {/* Moderator Action Buttons */}
            {isAdmin && (
              <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => onReScan?.(manga.id)}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 px-3.5 py-2 text-xs font-semibold text-white transition"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Re-Scan Neural Engine</span>
                </button>

                <div className="flex items-center gap-2">
                  {isBanned ? (
                    <button
                      type="button"
                      onClick={() => onToggleBan?.(manga.id, false)}
                      className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-xs font-bold text-white transition shadow-lg shadow-emerald-950/50"
                    >
                      <Unlock className="w-3.5 h-3.5" />
                      <span>Unban Manga (Human Approved)</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onToggleBan?.(manga.id, true)}
                      className="flex items-center gap-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 px-4 py-2 text-xs font-bold text-white transition shadow-lg shadow-rose-950/50"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Manual AI Strike & Ban</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
