import React, { useEffect, useState } from 'react';
import {
  Bell,
  BellRing,
  BookOpen,
  Check,
  Flame,
  Sparkles,
  Volume2,
  X,
  ExternalLink,
  ChevronRight,
  Radio,
} from 'lucide-react';
import {
  ChapterDropNotificationPayload,
  onChapterDropNotification,
  requestFcmToken,
  isPushNotificationEnabled,
  getNotificationsHistory,
  triggerTestChapterDropFcmPush,
  clearNotificationsHistory,
} from '../../services/fcm';

interface FcmNotificationBannerProps {
  onReadChapter: (mangaId: string, chapterId: string) => void;
}

export const FcmNotificationBanner: React.FC<FcmNotificationBannerProps> = ({ onReadChapter }) => {
  const [activeBanner, setActiveBanner] = useState<ChapterDropNotificationPayload | null>(null);

  useEffect(() => {
    const unsubscribe = onChapterDropNotification((payload) => {
      setActiveBanner(payload);

      // Play soft audio chime cue if browser audio context allows
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
        osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // A5
        gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.4);
      } catch (e) {
        // Audio policy ignore
      }

      // Auto dismiss banner after 10s
      const timer = setTimeout(() => {
        setActiveBanner(null);
      }, 10000);

      return () => clearTimeout(timer);
    });

    return () => unsubscribe();
  }, []);

  if (!activeBanner) return null;

  return (
    <div className="fixed top-18 right-4 z-50 max-w-sm sm:max-w-md w-full animate-in slide-in-from-top-4 fade-in duration-300">
      <div className="p-3.5 sm:p-4 bg-slate-950/95 backdrop-blur-xl border-2 border-amber-500/80 rounded-2xl shadow-2xl shadow-amber-500/20 text-slate-100 flex items-start gap-3 relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute -top-10 -right-10 w-24 h-24 bg-amber-500/20 rounded-full blur-2xl pointer-events-none" />

        {/* Manga Thumbnail */}
        <img
          src={activeBanner.coverImage}
          alt={activeBanner.mangaTitle}
          className="w-14 h-18 object-cover rounded-xl border border-slate-700 shadow-md shrink-0"
        />

        {/* Content */}
        <div className="flex-1 min-w-0 pr-6">
          <div className="flex items-center gap-1.5 text-amber-400 font-mono text-[11px] font-bold">
            <Flame className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span>FCM PUSH • NEW CHAPTER DROP</span>
          </div>

          <h4 className="text-sm font-black text-white truncate mt-0.5">
            {activeBanner.mangaTitle}
          </h4>

          <p className="text-xs text-slate-300 line-clamp-1 mt-0.5 font-medium">
            Chapter {activeBanner.chapterNumber}: {activeBanner.chapterTitle}
          </p>

          {/* Action Button */}
          <div className="mt-2.5 flex items-center gap-2">
            <button
              onClick={() => {
                onReadChapter(activeBanner.mangaId, `chap-${activeBanner.chapterNumber}`);
                setActiveBanner(null);
              }}
              className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black text-xs font-black rounded-lg shadow-md flex items-center gap-1.5 transition active:scale-95"
            >
              <BookOpen className="w-3.5 h-3.5" />
              Read Chapter Now
            </button>
            <span className="text-[10px] text-slate-400 font-mono">Just dropped!</span>
          </div>
        </div>

        {/* Dismiss */}
        <button
          onClick={() => setActiveBanner(null)}
          className="absolute top-2 right-2 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          aria-label="Dismiss notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

interface FcmNotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReadChapter: (mangaId: string, chapterId: string) => void;
}

export const FcmNotificationsModal: React.FC<FcmNotificationsModalProps> = ({
  isOpen,
  onClose,
  onReadChapter,
}) => {
  const [notifications, setNotifications] = useState<ChapterDropNotificationPayload[]>(() =>
    getNotificationsHistory()
  );
  const [isPushEnabled, setIsPushEnabled] = useState(() => isPushNotificationEnabled());
  const [isRequesting, setIsRequesting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setNotifications(getNotificationsHistory());
      setIsPushEnabled(isPushNotificationEnabled());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleEnablePush = async () => {
    setIsRequesting(true);
    setStatusMessage(null);
    const result = await requestFcmToken();
    setIsRequesting(false);
    if (result.success) {
      setIsPushEnabled(true);
      setStatusMessage('✅ Firebase Cloud Messaging Push successfully enabled!');
    } else {
      setStatusMessage(`⚠️ ${result.error || 'Permission was not granted'}`);
    }
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const handleTestDrop = async () => {
    const item = await triggerTestChapterDropFcmPush();
    setNotifications(getNotificationsHistory());
    setStatusMessage('🔥 Test FCM push triggered! Check your screen for the banner.');
    setTimeout(() => setStatusMessage(null), 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400">
              <BellRing className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white">
                FCM Chapter Drop Notifications
              </h3>
              <p className="text-xs text-slate-400">
                Powered by Firebase Cloud Messaging & Service Worker
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto">
          {/* Status Message */}
          {statusMessage && (
            <div className="p-3 rounded-xl bg-slate-900 border border-amber-500/40 text-xs text-amber-300 font-mono">
              {statusMessage}
            </div>
          )}

          {/* FCM Push Toggle Card */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Radio className={`w-4 h-4 ${isPushEnabled ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />
                <span className="text-sm font-bold text-white">
                  Push Notifications: {isPushEnabled ? 'Active' : 'Disabled'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Instant alerts directly to your phone or desktop when your followed manga updates.
              </p>
            </div>

            {!isPushEnabled ? (
              <button
                onClick={handleEnablePush}
                disabled={isRequesting}
                className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-black text-xs font-black rounded-lg transition shrink-0 disabled:opacity-50"
              >
                {isRequesting ? 'Enabling...' : 'Enable FCM'}
              </button>
            ) : (
              <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
                ENABLED
              </span>
            )}
          </div>

          {/* Test Push Button */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/40 border border-slate-800 text-xs">
            <span className="text-slate-300">Want to test a chapter drop push?</span>
            <button
              onClick={handleTestDrop}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold rounded-lg border border-slate-700 transition flex items-center gap-1.5"
            >
              <Flame className="w-3.5 h-3.5 fill-amber-400" />
              Test Drop Push
            </button>
          </div>

          {/* Recent Drops List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-slate-400 uppercase">
                Recent Chapter Drops ({notifications.length})
              </span>
              {notifications.length > 0 && (
                <button
                  onClick={() => {
                    clearNotificationsHistory();
                    setNotifications([]);
                  }}
                  className="text-[11px] text-slate-500 hover:text-slate-300"
                >
                  Clear History
                </button>
              )}
            </div>

            {notifications.length === 0 ? (
              <div className="p-6 text-center rounded-xl bg-slate-900/30 border border-slate-800/80">
                <Bell className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-xs text-slate-400">
                  No chapter drop alerts yet. When creators drop chapters, they will appear here!
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {notifications.map((notif, idx) => (
                  <div
                    key={`${notif.id}-${idx}`}
                    className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition flex items-center gap-3"
                  >
                    <img
                      src={notif.coverImage}
                      alt={notif.mangaTitle}
                      className="w-10 h-14 object-cover rounded-lg border border-slate-800 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-white truncate">
                        {notif.mangaTitle}
                      </h4>
                      <p className="text-[11px] text-amber-400 mt-0.5">
                        Chapter {notif.chapterNumber}: {notif.chapterTitle}
                      </p>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        onReadChapter(notif.mangaId, `chap-${notif.chapterNumber}`);
                        onClose();
                      }}
                      className="px-2.5 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded-lg text-xs font-bold transition flex items-center gap-1 shrink-0"
                    >
                      Read
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white rounded-lg transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
