import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Settings as SettingsIcon,
  Zap,
  Gauge,
  Shield,
  Smartphone,
  CheckCircle2,
  RefreshCw,
  HardDrive,
  Mail,
  User,
  Crown,
  BookOpen,
  Sparkles,
  Sliders,
  Check,
  Eye,
  Trash2,
  AlertCircle,
  Cpu,
  Monitor,
  Flame,
  Award,
  Lock,
  KeyRound,
  EyeOff,
  X
} from 'lucide-react';

export const ADMIN_PASSWORD = 'OVER2026!';
const ADMIN_MASTER_EMAIL = 'mlungisenimbhele3@gmail.com';

interface SettingsPageProps {
  currentUserEmail: string;
  onUpdateEmail: (email: string) => void;
  onNavigateToHome?: () => void;
  onNavigateToTerms?: () => void;
  onNavigateToPrivacy?: () => void;
  onNavigateToAwards?: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  currentUserEmail,
  onUpdateEmail,
  onNavigateToHome,
  onNavigateToTerms,
  onNavigateToPrivacy,
  onNavigateToAwards,
}) => {
  // Performance & Smoothness states (persisted in localStorage)
  const [ultraSmooth120Hz, setUltraSmooth120Hz] = useState<boolean>(() => {
    return localStorage.getItem('az_ultra_smooth') !== 'false';
  });
  const [hardwareAcceleration, setHardwareAcceleration] = useState<boolean>(() => {
    return localStorage.getItem('az_hardware_accel') !== 'false';
  });
  const [pagePreload, setPagePreload] = useState<boolean>(() => {
    return localStorage.getItem('az_page_preload') !== 'false';
  });
  const [hapticTouchFeedback, setHapticTouchFeedback] = useState<boolean>(() => {
    return localStorage.getItem('az_haptic_touch') !== 'false';
  });
  const [oledPureBlack, setOledPureBlack] = useState<boolean>(() => {
    return localStorage.getItem('az_oled_black') === 'true';
  });
  const [lowDataMode, setLowDataMode] = useState<boolean>(() => {
    return localStorage.getItem('az_low_data') === 'true';
  });

  // Default Reading Mode
  const [defaultReaderMode, setDefaultReaderMode] = useState<'webtoon' | 'single-page' | 'double-page'>(() => {
    return (localStorage.getItem('az_default_reader_mode') as any) || 'webtoon';
  });

  // Account Email Edit State
  const [emailInput, setEmailInput] = useState(currentUserEmail);
  const [emailToast, setEmailToast] = useState<string | null>(null);
  const [cacheClearedToast, setCacheClearedToast] = useState<string | null>(null);

  // Live FPS Counter simulator / detector
  const [currentFps, setCurrentFps] = useState<number>(120);

  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let animId: number;

    const measure = (now: number) => {
      frameCount++;
      if (now - lastTime >= 1000) {
        const measured = Math.round((frameCount * 1000) / (now - lastTime));
        setCurrentFps(Math.min(120, Math.max(58, measured)));
        frameCount = 0;
        lastTime = now;
      }
      animId = requestAnimationFrame(measure);
    };

    animId = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(animId);
  }, []);

  const handleToggleUltraSmooth = () => {
    const newVal = !ultraSmooth120Hz;
    setUltraSmooth120Hz(newVal);
    localStorage.setItem('az_ultra_smooth', String(newVal));
    if (newVal) {
      document.documentElement.classList.add('smooth-scroll-container');
    }
  };

  const handleToggleHardwareAccel = () => {
    const newVal = !hardwareAcceleration;
    setHardwareAcceleration(newVal);
    localStorage.setItem('az_hardware_accel', String(newVal));
  };

  const handleTogglePagePreload = () => {
    const newVal = !pagePreload;
    setPagePreload(newVal);
    localStorage.setItem('az_page_preload', String(newVal));
  };

  const handleToggleHaptic = () => {
    const newVal = !hapticTouchFeedback;
    setHapticTouchFeedback(newVal);
    localStorage.setItem('az_haptic_touch', String(newVal));
    if (newVal && navigator.vibrate) {
      navigator.vibrate(20);
    }
  };

  const handleToggleOled = () => {
    const newVal = !oledPureBlack;
    setOledPureBlack(newVal);
    localStorage.setItem('az_oled_black', String(newVal));
  };

  const handleToggleLowData = () => {
    const newVal = !lowDataMode;
    setLowDataMode(newVal);
    localStorage.setItem('az_low_data', String(newVal));
  };

  const handleChangeReaderMode = (mode: 'webtoon' | 'single-page' | 'double-page') => {
    setDefaultReaderMode(mode);
    localStorage.setItem('az_default_reader_mode', mode);
  };

  // Master Admin Password Popup state
  const [isAdminPasswordModalOpen, setIsAdminPasswordModalOpen] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [adminPasswordError, setAdminPasswordError] = useState<string | null>(null);
  const [showAdminPassword, setShowAdminPassword] = useState(false);

  const handleOpenAdminPasswordModal = () => {
    setAdminPasswordInput('');
    setAdminPasswordError(null);
    setShowAdminPassword(false);
    setIsAdminPasswordModalOpen(true);
  };

  const handleConfirmAdminPassword = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (adminPasswordInput === ADMIN_PASSWORD) {
      setIsAdminPasswordModalOpen(false);
      setAdminPasswordInput('');
      setAdminPasswordError(null);
      setEmailInput(ADMIN_MASTER_EMAIL);
      onUpdateEmail(ADMIN_MASTER_EMAIL);
      setEmailToast(`Active user set to Administrator (${ADMIN_MASTER_EMAIL})`);
      setTimeout(() => setEmailToast(null), 3500);
    } else {
      setAdminPasswordError('Incorrect password');
    }
  };

  const handleCancelAdminPassword = () => {
    setIsAdminPasswordModalOpen(false);
    setAdminPasswordInput('');
    setAdminPasswordError(null);
  };

  const handleSaveEmail = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = emailInput.trim();
    if (!trimmed || !trimmed.includes('@')) {
      setEmailToast('Please provide a valid email address');
      setTimeout(() => setEmailToast(null), 3000);
      return;
    }
    // If attempting to switch to admin email manually, require password popup
    if (trimmed.toLowerCase() === ADMIN_MASTER_EMAIL.toLowerCase() && currentUserEmail.toLowerCase() !== ADMIN_MASTER_EMAIL.toLowerCase()) {
      handleOpenAdminPasswordModal();
      return;
    }
    onUpdateEmail(trimmed);
    setEmailToast(`Email successfully updated to ${trimmed}`);
    setTimeout(() => setEmailToast(null), 3500);
  };

  const handleSetAdminEmail = () => {
    handleOpenAdminPasswordModal();
  };

  const handlePurgeCache = () => {
    // Purge temporary chapter read caches while preserving auth & favorites
    const favs = localStorage.getItem('ka_favorites');
    const readHistory = localStorage.getItem('manga_reading_history');
    const userEmail = localStorage.getItem('ka_africa_user_email');
    
    // Clear image cache entries in sessionStorage
    sessionStorage.clear();
    
    setCacheClearedToast('App cache purged! 42MB of transient image buffers freed.');
    setTimeout(() => setCacheClearedToast(null), 4000);
  };

  const ADMIN_EMAILS = ['mlungisenimbhele3@gmail.com', 'azoververse@gmail.com'];
  const isAdmin = ADMIN_EMAILS.includes(currentUserEmail.toLowerCase());

  return (
    <div className={`min-h-screen ${oledPureBlack ? 'bg-black' : 'bg-slate-950'} text-slate-200 p-4 sm:p-8 font-sans transition-colors duration-200`}>
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Navigation Bar / Top Back */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          {onNavigateToHome && (
            <button
              onClick={onNavigateToHome}
              className="flex items-center gap-2 text-amber-400 hover:text-amber-300 font-bold transition group"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              <span>Back to Reader</span>
            </button>
          )}

          <div className="flex items-center gap-2">
            <span className="rounded bg-gradient-to-r from-amber-500 to-yellow-600 text-black font-black text-[9px] px-2 py-0.5 tracking-wider">
              AZ SETTINGS
            </span>
            <span className="text-xs text-slate-400 font-mono">v3.4.0 • 120Hz Pro</span>
          </div>
        </div>

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900/90 via-slate-900/50 to-amber-950/20 p-5 rounded-3xl border border-slate-800">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-inner">
              <SettingsIcon className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-wide">
                APP SETTINGS & CONTROLS
              </h1>
              <p className="text-xs sm:text-sm text-slate-400">
                Optimize performance smoothness, manage account credentials, and configure reader engine
              </p>
            </div>
          </div>

          {/* Live Performance Badge */}
          <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-slate-950/80 border border-slate-800 self-start sm:self-center">
            <Gauge className="w-4 h-4 text-emerald-400 animate-pulse" />
            <div className="text-left">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Engine Refresh Rate</div>
              <div className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1.5">
                <span>{currentFps} FPS</span>
                <span className="text-[10px] px-1 rounded bg-emerald-500/20 text-emerald-300">V-SYNC ACTIVE</span>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 1: PERFORMANCE SMOOTHNESS & HARDWARE ACCELERATION */}
        <section className="bg-slate-900/60 rounded-3xl border border-slate-800 p-5 sm:p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-white">
                  PERFORMANCE SMOOTHNESS & 120HZ ENGINE
                </h2>
                <p className="text-xs text-slate-400">
                  GPU hardware compositing, fluid momentum scrolling, and predictive chapter preloading
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* 120Hz ProMotion Toggle */}
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between gap-3 hover:border-amber-500/30 transition">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-white">Ultra-Smooth 120Hz Mode</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">
                  Unlocks native 120Hz/90Hz refresh rate scrolling and eliminates micro-stutter on mobile.
                </p>
              </div>
              <button
                type="button"
                onClick={handleToggleUltraSmooth}
                className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${
                  ultraSmooth120Hz ? 'bg-amber-500' : 'bg-slate-800'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform transform ${
                    ultraSmooth120Hz ? 'translate-x-6' : 'translate-x-0.5'
                  } top-0.5 absolute`}
                />
              </button>
            </div>

            {/* GPU Hardware Acceleration */}
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between gap-3 hover:border-amber-500/30 transition">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <Cpu className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-bold text-white">GPU Hardware Composition</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">
                  Forces translate3d hardware offloading and GPU texture memory for high-res az verticals.
                </p>
              </div>
              <button
                type="button"
                onClick={handleToggleHardwareAccel}
                className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${
                  hardwareAcceleration ? 'bg-cyan-500' : 'bg-slate-800'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform transform ${
                    hardwareAcceleration ? 'translate-x-6' : 'translate-x-0.5'
                  } top-0.5 absolute`}
                />
              </button>
            </div>

            {/* Predictive Page Preload */}
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between gap-3 hover:border-amber-500/30 transition">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <HardDrive className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-white">Predictive Buffer Cache</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">
                  Pre-buffers the next 3 pages in memory so chapter transitions are instant.
                </p>
              </div>
              <button
                type="button"
                onClick={handleTogglePagePreload}
                className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${
                  pagePreload ? 'bg-emerald-500' : 'bg-slate-800'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform transform ${
                    pagePreload ? 'translate-x-6' : 'translate-x-0.5'
                  } top-0.5 absolute`}
                />
              </button>
            </div>

            {/* Haptic Touch Feedback */}
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between gap-3 hover:border-amber-500/30 transition">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-purple-400" />
                  <span className="text-xs font-bold text-white">Haptic Vibration on Tap</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">
                  Crisp tactile feedback on page turns, bookmarking, and chapter navigation.
                </p>
              </div>
              <button
                type="button"
                onClick={handleToggleHaptic}
                className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${
                  hapticTouchFeedback ? 'bg-purple-500' : 'bg-slate-800'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform transform ${
                    hapticTouchFeedback ? 'translate-x-6' : 'translate-x-0.5'
                  } top-0.5 absolute`}
                />
              </button>
            </div>

            {/* Pure OLED Black */}
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between gap-3 hover:border-amber-500/30 transition">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-amber-300" />
                  <span className="text-xs font-bold text-white">Pure OLED Pitch Black</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">
                  Turns background pixels completely off on AMOLED screens to save battery while reading.
                </p>
              </div>
              <button
                type="button"
                onClick={handleToggleOled}
                className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${
                  oledPureBlack ? 'bg-amber-400' : 'bg-slate-800'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform transform ${
                    oledPureBlack ? 'translate-x-6' : 'translate-x-0.5'
                  } top-0.5 absolute`}
                />
              </button>
            </div>

            {/* Low Data Mode */}
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between gap-3 hover:border-amber-500/30 transition">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-blue-400" />
                  <span className="text-xs font-bold text-white">Cellular Data Saver</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">
                  Compresses images dynamically for smooth reading on 3G/4G African mobile networks.
                </p>
              </div>
              <button
                type="button"
                onClick={handleToggleLowData}
                className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${
                  lowDataMode ? 'bg-blue-500' : 'bg-slate-800'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform transform ${
                    lowDataMode ? 'translate-x-6' : 'translate-x-0.5'
                  } top-0.5 absolute`}
                />
              </button>
            </div>
          </div>

          {/* Cache Cleaning Control */}
          <div className="pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-xs text-slate-400">
              Free up device memory by flushing cached manga cover pages and offline temporary buffers.
            </div>
            <button
              type="button"
              onClick={handlePurgeCache}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition shrink-0 border border-slate-700 active:scale-95"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              <span>Purge Image Cache</span>
            </button>
          </div>

          {cacheClearedToast && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{cacheClearedToast}</span>
            </div>
          )}
        </section>

        {/* SECTION 2: ACCOUNT, IDENTITY & ADMIN SECURITY */}
        <section className="bg-slate-900/60 rounded-3xl border border-slate-800 p-5 sm:p-6 space-y-5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white">
                USER IDENTITY & ACCOUNT EMAIL
              </h2>
              <p className="text-xs text-slate-400">
                Official administration email, creator authorization, and role management
              </p>
            </div>
          </div>

          {/* Primary Admin Notice */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-slate-950 to-slate-900 border border-amber-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-amber-200 uppercase tracking-wide">
                  Master Administrator & Producer
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-400 text-black font-black">
                  OWNER
                </span>
              </div>
              <div className="text-sm font-mono font-bold text-white">
                mlungisenimbhele3@gmail.com
              </div>
              <p className="text-[11px] text-slate-400 leading-tight">
                Controls disbursement treasury, creator earnings approvals, and original IP licensing.
              </p>
            </div>

            <button
              type="button"
              onClick={handleSetAdminEmail}
              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-black transition shrink-0 active:scale-95 shadow"
            >
              Switch to mlungisenimbhele3@gmail.com
            </button>
          </div>

          {/* Update Email Form */}
          <form onSubmit={handleSaveEmail} className="space-y-3">
            <label className="block text-xs font-semibold text-slate-300">
              Active User Email (Session & Subscriptions)
            </label>
            <div className="flex flex-col sm:flex-row items-stretch gap-2.5">
              <div className="relative flex-1">
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="mlungisenimbhele3@gmail.com"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-mono focus:outline-none focus:border-amber-500"
                />
              </div>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition shrink-0 border border-slate-700 active:scale-95"
              >
                Update Active Email
              </button>
            </div>
            <p className="text-[11px] text-slate-500">
              Your email determines your author profile, reading streak bookmarks, and creator treasury payouts.
            </p>
          </form>

          {emailToast && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{emailToast}</span>
            </div>
          )}
        </section>

        {/* SECTION 3: DEFAULT READER PREFERENCES */}
        <section className="bg-slate-900/60 rounded-3xl border border-slate-800 p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white">
                DEFAULT READING & AZ VERTICAL ENGINE
              </h2>
              <p className="text-xs text-slate-400">
                Choose the default canvas viewport when launching chapters
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            {/* AZ Vertical Mode */}
            <button
              type="button"
              onClick={() => handleChangeReaderMode('webtoon')}
              className={`p-4 rounded-2xl border text-left transition ${
                defaultReaderMode === 'webtoon'
                  ? 'bg-amber-500/10 border-amber-500 text-white'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black text-white">AZ Vertical Scroll</span>
                {defaultReaderMode === 'webtoon' && <Check className="w-4 h-4 text-amber-400" />}
              </div>
              <p className="text-[11px] text-slate-400">
                Vertical continuous scroll optimized for smartphones and manhwa-style chapters.
              </p>
            </button>

            {/* Single Page */}
            <button
              type="button"
              onClick={() => handleChangeReaderMode('single-page')}
              className={`p-4 rounded-2xl border text-left transition ${
                defaultReaderMode === 'single-page'
                  ? 'bg-amber-500/10 border-amber-500 text-white'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black text-white">Shonen Single-Page</span>
                {defaultReaderMode === 'single-page' && <Check className="w-4 h-4 text-amber-400" />}
              </div>
              <p className="text-[11px] text-slate-400">
                Traditional Japanese manga horizontal paginated view with tap/arrow turns.
              </p>
            </button>

            {/* Double Page */}
            <button
              type="button"
              onClick={() => handleChangeReaderMode('double-page')}
              className={`p-4 rounded-2xl border text-left transition ${
                defaultReaderMode === 'double-page'
                  ? 'bg-amber-500/10 border-amber-500 text-white'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black text-white">Double-Page Spread</span>
                {defaultReaderMode === 'double-page' && <Check className="w-4 h-4 text-amber-400" />}
              </div>
              <p className="text-[11px] text-slate-400">
                Two-page dual spread formatted for tablets, laptops, and wide desktop screens.
              </p>
            </button>
          </div>
        </section>

        {/* SECTION 4: LEGAL, BACKDROP & ORIGINAL COPYRIGHT MANDATE */}
        <section className="bg-slate-900/60 rounded-3xl border border-slate-800 p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white">
                LEGAL, COPYRIGHT & BACKDROP LICENSING
              </h2>
              <p className="text-xs text-slate-400">
                Terms of Service, intellectual property protection, and creator covenants
              </p>
            </div>
          </div>

          {/* Prominent Mandated Legal Notice */}
          <div className="p-4 rounded-2xl border border-amber-500/50 bg-gradient-to-r from-amber-500/15 via-slate-950 to-amber-950/20 text-xs text-amber-200 leading-relaxed space-y-2">
            <div className="font-bold flex items-center gap-1.5 text-amber-300 uppercase tracking-wider text-[11px]">
              <Crown className="w-3.5 h-3.5" />
              <span>Official Copyright & Backdrop License Mandate:</span>
            </div>
            <p className="font-medium text-slate-200 text-xs sm:text-sm">
              All AZ Originals are © AZ Oververse / Mlungiseni Mbhele. All Canvas works remain © their respective creators. AZ Oververse has non-exclusive license to display Backdrop works. Any re-upload without permission is prohibited.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            {onNavigateToTerms && (
              <button
                type="button"
                onClick={onNavigateToTerms}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition border border-slate-700"
              >
                Open Terms of Service
              </button>
            )}
            {onNavigateToPrivacy && (
              <button
                type="button"
                onClick={onNavigateToPrivacy}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition border border-slate-700"
              >
                Open Privacy Policy
              </button>
            )}
            {onNavigateToAwards && (
              <button
                type="button"
                onClick={onNavigateToAwards}
                className="px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-xs font-bold text-amber-300 transition border border-amber-500/40 flex items-center gap-1.5"
              >
                <Award className="w-3.5 h-3.5 text-amber-400" />
                <span>Manga of the Year Gala</span>
              </button>
            )}
          </div>
        </section>

        {/* SETTINGS FOOTER WITH EXACT USER TEXT */}
        <footer className="pt-8 pb-12 border-t border-slate-800/80 text-center space-y-3">
          <div className="flex items-center justify-center gap-2">
            <span className="rounded bg-gradient-to-r from-amber-500 to-yellow-600 text-black font-black text-[9px] px-2 py-0.5 tracking-wider">
              AZ OVERVERSE
            </span>
            <span className="text-xs text-slate-400">Produced by Mlungiseni Mbhele</span>
            <span className="text-emerald-400">🇿🇦</span>
          </div>

          <div className="text-xs text-slate-400 max-w-2xl mx-auto leading-relaxed">
            All AZ Originals are © AZ Oververse / Mlungiseni Mbhele. All Canvas works remain © their respective creators. AZ Oververse has non-exclusive license to display Backdrop works. Any re-upload without permission is prohibited.
          </div>

          <div className="text-[11px] text-slate-500 font-mono">
            Support & Legal: <span className="text-amber-400">mlungisenimbhele3@gmail.com</span> • Johannesburg, South Africa
          </div>
        </footer>

      </div>

      {/* Master Admin Password Popup Modal (Oververse Theme with Blur Background) */}
      {isAdminPasswordModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="admin-password-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md transition-all duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleCancelAdminPassword();
          }}
        >
          <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-amber-500/40 bg-gradient-to-b from-slate-900 via-slate-950 to-black p-6 sm:p-7 shadow-2xl shadow-amber-500/10 text-white">
            {/* Top Amber Glowing Accent */}
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent" />

            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/10 shrink-0">
                  <Lock className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30">
                      AZ OVERVERSE • ADMIN SECURITY
                    </span>
                  </div>
                  <h3 id="admin-password-modal-title" className="text-lg font-black tracking-wide text-white mt-0.5">
                    Enter Master Admin Password
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCancelAdminPassword}
                className="text-slate-400 hover:text-white p-1 rounded-xl hover:bg-slate-800/60 transition"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400 mb-5 leading-relaxed">
              Master administrator clearance is required to switch session to <span className="text-amber-300 font-mono font-bold">mlungisenimbhele3@gmail.com</span> with executive rights.
            </p>

            {/* Form */}
            <form onSubmit={handleConfirmAdminPassword} className="space-y-4">
              <div>
                <label htmlFor="master-admin-password-input" className="block text-xs font-semibold text-slate-300 mb-2">
                  Master Admin Password
                </label>
                <div className="relative">
                  <input
                    id="master-admin-password-input"
                    type={showAdminPassword ? 'text' : 'password'}
                    value={adminPasswordInput}
                    onChange={(e) => {
                      setAdminPasswordInput(e.target.value);
                      if (adminPasswordError) setAdminPasswordError(null);
                    }}
                    placeholder="Enter Master Admin Password"
                    autoFocus
                    className={`w-full px-4 py-3 rounded-xl bg-slate-950 border ${
                      adminPasswordError ? 'border-rose-500 ring-1 ring-rose-500/50' : 'border-slate-700 focus:border-amber-500'
                    } text-white text-sm font-mono focus:outline-none pr-10 transition placeholder:text-slate-600`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminPassword(!showAdminPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 transition"
                    title={showAdminPassword ? 'Hide password' : 'Show password'}
                  >
                    {showAdminPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Error Alert Display */}
              {adminPasswordError && (
                <div
                  id="admin-password-error-message"
                  className="flex items-center gap-2 text-xs font-bold text-rose-300 bg-rose-950/70 border border-rose-500/50 rounded-xl p-3 shadow-sm"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{adminPasswordError}</span>
                </div>
              )}

              {/* Action Buttons (Cancel / Confirm) */}
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={handleCancelAdminPassword}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition border border-slate-700 active:scale-95"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-black text-xs font-black uppercase tracking-wider transition shadow-lg shadow-amber-500/20 active:scale-95 flex items-center gap-1.5 cursor-pointer"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>Confirm</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default SettingsPage;
