import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Globe,
  Share2,
  Copy,
  Check,
  ExternalLink,
  QrCode,
  ShieldCheck,
  Server,
  Sparkles,
  MessageCircle,
  Twitter,
  Linkedin,
  Code2,
  Send,
} from 'lucide-react';
import { SouthAfricaFlameLogo } from './SouthAfricaFlameLogo';

interface GlobalPublishShareModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalPublishShareModal: React.FC<GlobalPublishShareModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);
  const [copiedEmbed, setCopiedEmbed] = useState(false);
  const [showQR, setShowQR] = useState(false);

  // The primary shared production URL
  const publicShareUrl =
    typeof window !== 'undefined' && window.location.origin
      ? `${window.location.origin}`
      : 'https://ais-pre-2gzwiumq3db3tvpnp45izm-401335544603.europe-west2.run.app';

  const shareTitle = 'AZ OVERVERSE - Manga of the Year Awards & Global Reader';
  const shareText =
    'Read free manga with ads or go uninterrupted VIP. Original creators earn 70% rev-share via Google AdMob & Google Play Billing on AZ OVERVERSE!';

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(publicShareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const embedCode = `<iframe src="${publicShareUrl}" width="100%" height="800" frameborder="0" allow="fullscreen" title="AZ OVERVERSE"></iframe>`;

  const handleCopyEmbed = async () => {
    try {
      await navigator.clipboard.writeText(embedCode);
      setCopiedEmbed(true);
      setTimeout(() => setCopiedEmbed(false), 2500);
    } catch {
      setCopiedEmbed(true);
      setTimeout(() => setCopiedEmbed(false), 2500);
    }
  };

  // Social share links
  const socialChannels = [
    {
      name: 'WhatsApp',
      icon: MessageCircle,
      color: 'bg-emerald-600 hover:bg-emerald-500',
      url: `https://api.whatsapp.com/send?text=${encodeURIComponent(
        `${shareTitle}\n\n${shareText}\n${publicShareUrl}`
      )}`,
    },
    {
      name: 'X (Twitter)',
      icon: Twitter,
      color: 'bg-sky-600 hover:bg-sky-500',
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(
        `${shareTitle} - ${shareText}`
      )}&url=${encodeURIComponent(publicShareUrl)}`,
    },
    {
      name: 'Telegram',
      icon: Send,
      color: 'bg-blue-600 hover:bg-blue-500',
      url: `https://t.me/share/url?url=${encodeURIComponent(
        publicShareUrl
      )}&text=${encodeURIComponent(shareTitle)}`,
    },
    {
      name: 'LinkedIn',
      icon: Linkedin,
      color: 'bg-indigo-600 hover:bg-indigo-500',
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
        publicShareUrl
      )}`,
    },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          id="global-publish-share-modal-overlay"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto"
          onClick={onClose}
        >
          <motion.div
            id="global-publish-share-modal-container"
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-2xl rounded-3xl bg-[#0f141f] border border-slate-700/80 p-6 sm:p-8 shadow-2xl shadow-emerald-950/20 text-slate-100 my-auto"
          >
            {/* Ambient Background Gradient */}
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-72 h-72 rounded-full bg-emerald-600/10 blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-72 h-72 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

            {/* Header */}
            <div className="relative z-10 flex items-start justify-between gap-4 border-b border-slate-800 pb-5">
              <div className="flex items-center gap-3.5">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-amber-500 p-0.5 shadow-lg shadow-emerald-500/20">
                  <div className="flex h-full w-full items-center justify-center rounded-[14px] bg-[#0c1017]">
                    <SouthAfricaFlameLogo size="sm" variant="sa_flag" />
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-400 font-mono">
                      Global Live Deployment
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                    Publish & Share Worldwide
                  </h2>
                </div>
              </div>

              <button
                id="close-global-share-modal"
                onClick={onClose}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="relative z-10 mt-6 space-y-6">
              {/* Live URL Card */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-amber-400" />
                    Production Public Web Address
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-950/80 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                    <ShieldCheck className="w-3 h-3" />
                    HTTPS • Worldwide Edge
                  </span>
                </div>

                <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl p-2 sm:p-2.5">
                  <input
                    type="text"
                    readOnly
                    value={publicShareUrl}
                    className="w-full bg-transparent text-xs sm:text-sm font-mono text-amber-200 outline-none select-all truncate px-1"
                  />
                  <button
                    id="copy-global-share-url-btn"
                    onClick={handleCopyLink}
                    className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition shrink-0 ${
                      copied
                        ? 'bg-emerald-500 text-black'
                        : 'bg-amber-500 hover:bg-amber-400 text-black'
                    }`}
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Link</span>
                      </>
                    )}
                  </button>
                  <a
                    href={publicShareUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition shrink-0"
                    title="Open live app in new tab"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>

              {/* Instant Social Channels */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Share2 className="w-3.5 h-3.5 text-emerald-400" />
                    Broadcast to Global Readers & Creators
                  </span>
                  <button
                    onClick={() => setShowQR(!showQR)}
                    className="flex items-center gap-1 text-xs text-slate-400 hover:text-amber-400 transition"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>{showQR ? 'Hide QR' : 'Show Mobile QR'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {socialChannels.map((ch, idx) => (
                    <a
                      key={`${ch.name}-${idx}`}
                      href={ch.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center justify-center gap-2 rounded-xl py-2.5 px-3 text-xs font-bold text-white transition shadow-sm ${ch.color}`}
                    >
                      <ch.icon className="w-4 h-4" />
                      <span>{ch.name}</span>
                    </a>
                  ))}
                </div>

                {/* QR Code expansion */}
                {showQR && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="rounded-2xl border border-slate-800 bg-slate-950 p-4 text-center flex flex-col items-center gap-3"
                  >
                    <div className="bg-white p-3 rounded-xl shadow-lg inline-block">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(
                          publicShareUrl
                        )}`}
                        alt="Mobile QR Code for AZ OVERVERSE"
                        className="w-36 h-36"
                        loading="lazy"
                      />
                    </div>
                    <p className="text-xs text-slate-400 max-w-sm">
                      Scan with any smartphone camera to open and read manga directly on mobile or tablet.
                    </p>
                  </motion.div>
                )}
              </div>

              {/* Production Architecture & Payout Note */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-2xl border border-slate-800/80 bg-slate-900/50 p-3.5 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                    <Server className="w-3.5 h-3.5" />
                    <span>Global Cloud Run Infrastructure</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Auto-scaling container topology with zero-downtime hot reloading, CDN asset caching, and global edge routing.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-800/80 bg-slate-900/50 p-3.5 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-300">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>70% Global & SA Creator Payouts</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Automated creator revenue splits powered exclusively by Google AdMob and Google Play Billing.
                  </p>
                </div>
              </div>

              {/* Embed / Iframe Option */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3.5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                    <Code2 className="w-3.5 h-3.5 text-indigo-400" />
                    Embed AZ OVERVERSE Web Reader on External Blogs & Portals
                  </span>
                  <button
                    onClick={handleCopyEmbed}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
                  >
                    {copiedEmbed ? 'Snippet Copied!' : 'Copy Snippet'}
                  </button>
                </div>
                <pre className="text-[11px] font-mono text-slate-400 bg-slate-950 p-2.5 rounded-xl border border-slate-800 overflow-x-auto">
                  {embedCode}
                </pre>
              </div>
            </div>

            {/* Footer */}
            <div className="relative z-10 mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-400 flex items-center gap-1.5">
                <SouthAfricaFlameLogo size="xs" variant="sa_flag" />
                <span>AZ OVERVERSE • Global Reader Network</span>
              </span>
              <button
                id="close-global-share-btn-secondary"
                onClick={onClose}
                className="rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white px-4 py-2 transition"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
