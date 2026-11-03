'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  Check,
  CheckCircle2,
  ClipboardCopy,
  Copy,
  Download,
  KeyRound,
  Lock,
  LogOut,
  QrCode,
  RefreshCw,
  Save,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  UploadCloud,
} from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  OververseAuthUser,
  disableOververseTwoFactor,
  enableOververseTwoFactor,
  fetchAuthenticatedMe,
  logoutOververseSession,
  patchOververseCreatorProfile,
  regenerateOververseRecoveryCodes,
  setupOververseTwoFactor,
} from '../../../services/oververseAuth';
import { APP_LOGO_SRC } from '../../../components/common/KAAfricaLogo';
import AuthGroupLayout from '../layout';
import {
  AuthRoutePath,
  DashboardProfileFormValues,
  DisableTwoFactorFormValues,
  dashboardProfileFormSchema,
  disableTwoFactorFormSchema,
  extractZodFieldErrors,
  navigateAuthRoute,
  navigateHomeCatalog,
  totpCodeFormSchema,
} from '../schemas';

export interface CreatorDashboardPageProps {
  onNavigateAuthRoute?: (route: AuthRoutePath, querySearch?: string) => void;
  onOpenPublishingStudio?: () => void;
  onOpenUploadModal?: () => void;
  onBackToCatalog?: () => void;
}

interface TotpSetupPayload {
  otpauthUrl: string;
  qrCodeDataUrl: string;
  manualEntryKey: string;
}

export function CreatorDashboardPage({
  onNavigateAuthRoute,
  onOpenPublishingStudio,
  onOpenUploadModal,
  onBackToCatalog,
}: CreatorDashboardPageProps = {}) {
  const prefersReducedMotion = useReducedMotion();
  const enableTotpInputRef = useRef<HTMLInputElement | null>(null);
  const regenerateTotpInputRef = useRef<HTMLInputElement | null>(null);

  const [user, setUser] = useState<OververseAuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [values, setValues] = useState<DashboardProfileFormValues>({
    pen_name: '',
    studio_name: '',
    role: 'creator',
    bio: '',
  });
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof DashboardProfileFormValues, string>>
  >({});
  const [touched, setTouched] = useState<
    Partial<Record<keyof DashboardProfileFormValues, boolean>>
  >({});

  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Two-Factor Authentication (TOTP) Account Settings states
  const [totpSetup, setTotpSetup] = useState<TotpSetupPayload | null>(null);
  const [isStartingTotpSetup, setIsStartingTotpSetup] = useState(false);
  const [enableCode, setEnableCode] = useState('');
  const [enableCodeError, setEnableCodeError] = useState<string | null>(null);
  const [enableCodeTouched, setEnableCodeTouched] = useState(false);
  const [isEnablingTotp, setIsEnablingTotp] = useState(false);
  const [copiedTotpUrl, setCopiedTotpUrl] = useState(false);
  const [copiedManualKey, setCopiedManualKey] = useState(false);

  // One-time recovery codes display & regeneration states
  const [freshRecoveryCodes, setFreshRecoveryCodes] = useState<string[] | null>(null);
  const [copiedRecoveryCodes, setCopiedRecoveryCodes] = useState(false);
  const [showRegenerateCodesForm, setShowRegenerateCodesForm] = useState(false);
  const [regenerateTotpCode, setRegenerateTotpCode] = useState('');
  const [regenerateTotpError, setRegenerateTotpError] = useState<string | null>(null);
  const [regenerateTotpTouched, setRegenerateTotpTouched] = useState(false);
  const [isRegeneratingCodes, setIsRegeneratingCodes] = useState(false);

  // Disable 2FA states
  const [showDisableTotpForm, setShowDisableTotpForm] = useState(false);
  const [disableValues, setDisableValues] = useState<DisableTwoFactorFormValues>({
    password: '',
    code: '',
  });
  const [disableErrors, setDisableErrors] = useState<
    Partial<Record<keyof DisableTwoFactorFormValues, string>>
  >({});
  const [disableTouched, setDisableTouched] = useState<
    Partial<Record<keyof DisableTwoFactorFormValues, boolean>>
  >({});
  const [isDisablingTotp, setIsDisablingTotp] = useState(false);

  const [totpBannerMessage, setTotpBannerMessage] = useState<string | null>(null);
  const [totpBannerError, setTotpBannerError] = useState<string | null>(null);

  const totpSetupActiveRef = useRef(false);
  totpSetupActiveRef.current = Boolean(totpSetup);

  const regenerateFormActiveRef = useRef(false);
  regenerateFormActiveRef.current = showRegenerateCodesForm;

  useEffect(() => {
    if (!totpSetup) return;
    const delayMs = prefersReducedMotion ? 160 : 340;
    const timer = window.setTimeout(() => {
      if (
        totpSetupActiveRef.current &&
        typeof document !== 'undefined' &&
        document.activeElement !== enableTotpInputRef.current
      ) {
        enableTotpInputRef.current?.focus({ preventScroll: true });
      }
    }, delayMs);
    return () => window.clearTimeout(timer);
  }, [totpSetup, prefersReducedMotion]);

  useEffect(() => {
    if (!showRegenerateCodesForm) return;
    const delayMs = prefersReducedMotion ? 160 : 300;
    const timer = window.setTimeout(() => {
      if (
        regenerateFormActiveRef.current &&
        typeof document !== 'undefined' &&
        document.activeElement !== regenerateTotpInputRef.current
      ) {
        regenerateTotpInputRef.current?.focus({ preventScroll: true });
      }
    }, delayMs);
    return () => window.clearTimeout(timer);
  }, [showRegenerateCodesForm, prefersReducedMotion]);

  useEffect(() => {
    let cancelled = false;
    fetchAuthenticatedMe().then((me) => {
      if (cancelled) return;
      if (!me) {
        navigateAuthRoute('login', { onNavigateAuthRoute });
        return;
      }
      setUser(me);
      setValues({
        pen_name: me.pen_name,
        studio_name: me.studio_name || `${me.pen_name} Studio`,
        role: me.role === 'reader' ? 'reader' : 'creator',
        bio: me.bio || '',
      });
      setIsLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [onNavigateAuthRoute]);

  const validateDraft = (nextValues: DashboardProfileFormValues) => {
    const parsed = dashboardProfileFormSchema.safeParse(nextValues);
    if (parsed.success) {
      setFieldErrors({});
      return parsed.data;
    }
    setFieldErrors(extractZodFieldErrors(parsed.error));
    return null;
  };

  const handleFieldChange = <K extends keyof DashboardProfileFormValues>(
    field: K,
    value: DashboardProfileFormValues[K]
  ) => {
    const nextValues = { ...values, [field]: value };
    setValues(nextValues);
    setSaveMessage(null);
    setSaveError(null);
    if (touched[field]) {
      validateDraft(nextValues);
    }
  };

  const handleBlur = (field: keyof DashboardProfileFormValues) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validateDraft(values);
  };

  const handleSaveProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaveError(null);
    setSaveMessage(null);

    setTouched({
      pen_name: true,
      studio_name: true,
      role: true,
      bio: true,
    });

    const parsed = dashboardProfileFormSchema.safeParse(values);
    if (!parsed.success) {
      setFieldErrors(extractZodFieldErrors(parsed.error));
      return;
    }
    setFieldErrors({});

    setIsSaving(true);
    const res = await patchOververseCreatorProfile({
      pen_name: parsed.data.pen_name,
      studio_name: parsed.data.studio_name,
      bio: parsed.data.bio,
      role: parsed.data.role,
    });
    setIsSaving(false);

    if (!res.success || !res.user) {
      setSaveError(res.error || 'Could not update profile.');
      return;
    }

    setUser(res.user);
    setSaveMessage('Creator profile saved.');
  };

  const handleStartTotpSetup = async () => {
    setTotpBannerError(null);
    setTotpBannerMessage(null);
    setFreshRecoveryCodes(null);
    setEnableCode('');
    setEnableCodeError(null);
    setEnableCodeTouched(false);
    setCopiedTotpUrl(false);
    setCopiedManualKey(false);

    setIsStartingTotpSetup(true);
    const res = await setupOververseTwoFactor();
    setIsStartingTotpSetup(false);

    if (!res.success || !res.qrCodeDataUrl || !res.manualEntryKey) {
      setTotpBannerError(res.error || 'Could not initialize authenticator setup.');
      return;
    }

    setTotpSetup({
      otpauthUrl: res.otpauthUrl || '',
      qrCodeDataUrl: res.qrCodeDataUrl,
      manualEntryKey: res.manualEntryKey,
    });
  };

  const handleCopyTotpUrl = async () => {
    if (!totpSetup?.otpauthUrl || typeof navigator === 'undefined') return;
    try {
      await navigator.clipboard.writeText(totpSetup.otpauthUrl);
      setCopiedTotpUrl(true);
      setTimeout(() => setCopiedTotpUrl(false), 2400);
    } catch {
      setTotpBannerError(
        'Clipboard access is unavailable. Please select and copy the TOTP URL manually.'
      );
    }
  };

  const handleCopyManualKey = async () => {
    if (!totpSetup?.manualEntryKey || typeof navigator === 'undefined') return;
    try {
      await navigator.clipboard.writeText(totpSetup.manualEntryKey.replace(/\s+/g, ''));
      setCopiedManualKey(true);
      setTimeout(() => setCopiedManualKey(false), 2200);
    } catch {
      setTotpBannerError(
        'Clipboard access is unavailable. Please select and copy the setup key manually.'
      );
    }
  };

  const formatRecoveryCodesDocument = (codes: string[]) => {
    const emailLabel = user?.email || 'creator@azoververse.com';
    const generatedAt = new Date().toISOString();
    return [
      'AZ OVERVERSE — Creator Account Two-Factor Recovery Codes',
      `Account: ${emailLabel}`,
      `Generated: ${generatedAt}`,
      '',
      'Each recovery code below can be used ONCE if you lose access to your authenticator device:',
      '',
      ...codes.map((c, idx) => `${String(idx + 1).padStart(2, '0')}. ${c}`),
      '',
      'Keep these codes in an encrypted password manager or offline safe place.',
    ].join('\n');
  };

  const handleCopyRecoveryCodes = async () => {
    if (!freshRecoveryCodes?.length || typeof navigator === 'undefined') return;
    try {
      await navigator.clipboard.writeText(freshRecoveryCodes.join('\n'));
      setCopiedRecoveryCodes(true);
      setTimeout(() => setCopiedRecoveryCodes(false), 2400);
    } catch {
      setTotpBannerError('Clipboard access is unavailable. Use Download .txt to save your codes.');
    }
  };

  const handleDownloadRecoveryCodes = () => {
    if (!freshRecoveryCodes?.length || typeof window === 'undefined') return;
    const textContent = formatRecoveryCodesDocument(freshRecoveryCodes);
    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'az-oververse-2fa-recovery-codes.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleEnableTotpSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setTotpBannerError(null);
    setTotpBannerMessage(null);
    setEnableCodeTouched(true);

    const parsed = totpCodeFormSchema.safeParse({ code: enableCode });
    if (!parsed.success) {
      setEnableCodeError(
        parsed.error.issues[0]?.message ||
          'Enter the 6-digit numeric code from your authenticator app.'
      );
      return;
    }
    setEnableCodeError(null);

    setIsEnablingTotp(true);
    const res = await enableOververseTwoFactor(parsed.data.code);
    setIsEnablingTotp(false);

    if (!res.success || !res.user) {
      setTotpBannerError(res.error || 'Invalid 6-digit authenticator code.');
      window.setTimeout(() => {
        enableTotpInputRef.current?.focus({ preventScroll: true });
        enableTotpInputRef.current?.select();
      }, 0);
      return;
    }

    setUser(res.user);
    setTotpSetup(null);
    setEnableCode('');
    setEnableCodeTouched(false);
    if (res.recoveryCodes && res.recoveryCodes.length > 0) {
      setFreshRecoveryCodes(res.recoveryCodes);
      setCopiedRecoveryCodes(false);
    }
    setTotpBannerMessage(
      res.message ||
        'Two-Factor Authentication is now enabled. Store your one-time recovery codes below.'
    );
  };

  const handleRegenerateCodesSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setTotpBannerError(null);
    setTotpBannerMessage(null);
    setRegenerateTotpTouched(true);

    const parsed = totpCodeFormSchema.safeParse({ code: regenerateTotpCode });
    if (!parsed.success) {
      setRegenerateTotpError(
        parsed.error.issues[0]?.message ||
          'Enter the 6-digit numeric code from your authenticator app.'
      );
      return;
    }
    setRegenerateTotpError(null);

    setIsRegeneratingCodes(true);
    const res = await regenerateOververseRecoveryCodes(parsed.data.code);
    setIsRegeneratingCodes(false);

    if (!res.success || !res.user) {
      setTotpBannerError(res.error || 'Could not regenerate recovery codes.');
      window.setTimeout(() => {
        regenerateTotpInputRef.current?.focus({ preventScroll: true });
        regenerateTotpInputRef.current?.select();
      }, 0);
      return;
    }

    setUser(res.user);
    setShowRegenerateCodesForm(false);
    setRegenerateTotpCode('');
    setRegenerateTotpTouched(false);
    if (res.recoveryCodes && res.recoveryCodes.length > 0) {
      setFreshRecoveryCodes(res.recoveryCodes);
      setCopiedRecoveryCodes(false);
    }
    setTotpBannerMessage(
      res.message || 'Generated 8 new one-time recovery codes. Save them in a secure location.'
    );
  };

  const handleDisableFieldChange = <K extends keyof DisableTwoFactorFormValues>(
    field: K,
    rawValue: string
  ) => {
    const cleanValue =
      field === 'code'
        ? rawValue.toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 9)
        : rawValue;
    const nextValues = { ...disableValues, [field]: cleanValue };
    setDisableValues(nextValues);
    setTotpBannerError(null);

    if (disableTouched[field]) {
      const parsed = disableTwoFactorFormSchema.safeParse(nextValues);
      setDisableErrors(parsed.success ? {} : extractZodFieldErrors(parsed.error));
    }
  };

  const handleDisableTotpSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setTotpBannerError(null);
    setTotpBannerMessage(null);
    setDisableTouched({ password: true, code: true });

    const parsed = disableTwoFactorFormSchema.safeParse(disableValues);
    if (!parsed.success) {
      setDisableErrors(extractZodFieldErrors(parsed.error));
      return;
    }
    setDisableErrors({});

    setIsDisablingTotp(true);
    const res = await disableOververseTwoFactor({
      password: parsed.data.password,
      code: parsed.data.code,
    });
    setIsDisablingTotp(false);

    if (!res.success || !res.user) {
      setTotpBannerError(res.error || 'Could not disable Two-Factor Authentication.');
      return;
    }

    setUser(res.user);
    setFreshRecoveryCodes(null);
    setShowDisableTotpForm(false);
    setShowRegenerateCodesForm(false);
    setDisableValues({ password: '', code: '' });
    setDisableTouched({});
    setTotpBannerMessage(
      res.message || 'Two-Factor Authentication has been disabled for your account.'
    );
  };

  const handleLogout = async () => {
    await logoutOververseSession();
    navigateAuthRoute('login', { onNavigateAuthRoute });
  };

  const handleOpenStudio = () => {
    if (onOpenPublishingStudio) {
      onOpenPublishingStudio();
      return;
    }
    if (typeof window !== 'undefined') {
      window.history.pushState(null, '', '/creators');
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  const handleOpenUpload = () => {
    if (onOpenUploadModal) {
      onOpenUploadModal();
      return;
    }
    handleOpenStudio();
  };

  if (isLoading) {
    return (
      <AuthGroupLayout>
        <div className="mx-auto max-w-xl py-16 px-4 text-center space-y-3">
          <div className="h-8 w-8 mx-auto rounded-full border-2 border-amber-500/30 border-t-amber-400 animate-spin" />
          <p className="text-xs font-medium text-slate-400">
            Checking your session for Creator Dashboard...
          </p>
        </div>
      </AuthGroupLayout>
    );
  }

  if (!user) {
    return null;
  }

  const joinedDate = new Date(user.created_at).toLocaleDateString('en-ZA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const isCreatorOrAdmin = user.role === 'creator' || user.role === 'admin';
  const remainingRecoveryCodesCount =
    typeof user.totp_recovery_codes_remaining === 'number'
      ? user.totp_recovery_codes_remaining
      : 0;

  return (
    <AuthGroupLayout>
      <section className="mx-auto w-full max-w-5xl py-3 sm:py-6 space-y-6">
        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => navigateHomeCatalog(onBackToCatalog)}
            className="min-h-[44px] inline-flex items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4 text-amber-400" />
            <span>Back to Manga Catalog</span>
          </button>

          <button
            id="dashboard-logout-btn"
            type="button"
            onClick={handleLogout}
            className="min-h-[44px] inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white text-xs font-semibold px-4 py-2 transition"
          >
            <LogOut className="w-4 h-4 text-rose-400" />
            <span>Logout</span>
          </button>
        </div>

        {/* Creator Identity Header */}
        <div className="rounded-2xl border border-slate-800/90 bg-slate-950 p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4 min-w-0">
            <img
              src={user.avatar_url || APP_LOGO_SRC}
              alt={user.pen_name}
              width={64}
              height={64}
              decoding="async"
              className="h-16 w-16 rounded-2xl object-cover border border-slate-800 bg-[#0f0424] shrink-0"
            />
            <div className="min-w-0 space-y-1">
              <div className="flex items-center gap-2 text-xs font-semibold flex-wrap">
                <span className="text-emerald-400 capitalize">
                  Verified {user.role} Account
                </span>
                {user.totp_enabled && (
                  <>
                    <span aria-hidden="true" className="text-slate-600">
                      ·
                    </span>
                    <span className="text-amber-400">2FA Protected</span>
                  </>
                )}
              </div>
              <h1 className="font-['Bebas_Neue',sans-serif] text-3xl sm:text-4xl tracking-wide text-white truncate">
                {user.pen_name}
              </h1>
              <div className="flex items-center gap-2 text-xs text-slate-400 flex-wrap">
                <span className="text-slate-200">{user.email}</span>
                <span aria-hidden="true">·</span>
                <span>{user.studio_name}</span>
                <span aria-hidden="true">·</span>
                <span>Joined {joinedDate}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={handleOpenUpload}
              className="min-h-[46px] inline-flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm px-4 py-2.5 transition"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Publish Series / Chapter</span>
            </button>

            <button
              type="button"
              onClick={handleOpenStudio}
              className="min-h-[46px] inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs sm:text-sm px-4 py-2.5 transition"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Creator Studio</span>
            </button>
          </div>
        </div>

        {/* Profile Form + Security & Session Details */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8 space-y-6">
            <form
              onSubmit={handleSaveProfile}
              noValidate
              className="rounded-2xl border border-slate-800/90 bg-slate-950 p-6 sm:p-8 space-y-5"
            >
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-white">Creator Profile Settings</h2>
                <p className="text-xs text-slate-400">
                  Update your public creator pen name, studio imprint, account role, and biography.
                </p>
              </div>

              {saveMessage && (
                <div className="rounded-xl border border-emerald-500/35 bg-emerald-950/25 p-3.5 flex items-center gap-2.5 text-xs text-emerald-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{saveMessage}</span>
                </div>
              )}

              {saveError && (
                <div
                  role="alert"
                  className="rounded-xl border border-rose-500/40 bg-rose-950/30 p-3.5 flex items-center gap-2.5 text-xs text-rose-200"
                >
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{saveError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="dashboard-pen-name"
                    className="block text-xs font-semibold text-slate-200 mb-1.5"
                  >
                    Pen Name (Creator Nickname)
                  </label>
                  <input
                    id="dashboard-pen-name"
                    name="pen_name"
                    type="text"
                    value={values.pen_name}
                    onChange={(e) => handleFieldChange('pen_name', e.target.value)}
                    onBlur={() => handleBlur('pen_name')}
                    aria-invalid={Boolean(touched.pen_name && fieldErrors.pen_name)}
                    className={`min-h-[46px] w-full rounded-xl border bg-slate-900/90 px-3.5 py-2.5 text-sm text-white focus:outline-none transition ${
                      touched.pen_name && fieldErrors.pen_name
                        ? 'border-rose-500/70 focus:border-rose-400'
                        : 'border-slate-800 focus:border-amber-500'
                    }`}
                  />
                  {touched.pen_name && fieldErrors.pen_name && (
                    <p className="mt-1.5 text-xs text-rose-300">{fieldErrors.pen_name}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="dashboard-studio-name"
                    className="block text-xs font-semibold text-slate-200 mb-1.5"
                  >
                    Studio / Imprint Name
                  </label>
                  <input
                    id="dashboard-studio-name"
                    name="studio_name"
                    type="text"
                    value={values.studio_name}
                    onChange={(e) => handleFieldChange('studio_name', e.target.value)}
                    onBlur={() => handleBlur('studio_name')}
                    aria-invalid={Boolean(touched.studio_name && fieldErrors.studio_name)}
                    className={`min-h-[46px] w-full rounded-xl border bg-slate-900/90 px-3.5 py-2.5 text-sm text-white focus:outline-none transition ${
                      touched.studio_name && fieldErrors.studio_name
                        ? 'border-rose-500/70 focus:border-rose-400'
                        : 'border-slate-800 focus:border-amber-500'
                    }`}
                  />
                  {touched.studio_name && fieldErrors.studio_name && (
                    <p className="mt-1.5 text-xs text-rose-300">{fieldErrors.studio_name}</p>
                  )}
                </div>
              </div>

              <div>
                <span className="block text-xs font-semibold text-slate-200 mb-1.5">
                  Account Role
                </span>
                <div
                  role="group"
                  aria-label="Account role"
                  className="inline-flex rounded-xl border border-slate-800 bg-slate-900 p-1"
                >
                  <button
                    type="button"
                    onClick={() => handleFieldChange('role', 'creator')}
                    className={`min-h-[38px] px-4 py-1.5 rounded-lg text-xs font-semibold transition ${
                      values.role === 'creator'
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Creator (Publish &amp; Read)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFieldChange('role', 'reader')}
                    className={`min-h-[38px] px-4 py-1.5 rounded-lg text-xs font-semibold transition ${
                      values.role === 'reader'
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Reader
                  </button>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="dashboard-bio" className="text-xs font-semibold text-slate-200">
                    Creator Biography
                  </label>
                  <span className="text-xs font-mono text-slate-400 tabular-nums">
                    {values.bio.length}/500
                  </span>
                </div>
                <textarea
                  id="dashboard-bio"
                  name="bio"
                  rows={3}
                  value={values.bio}
                  onChange={(e) => handleFieldChange('bio', e.target.value)}
                  onBlur={() => handleBlur('bio')}
                  aria-invalid={Boolean(touched.bio && fieldErrors.bio)}
                  placeholder="Share your release schedule, series themes, and studio background..."
                  className={`w-full rounded-xl border bg-slate-900/90 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none transition resize-none ${
                    touched.bio && fieldErrors.bio
                      ? 'border-rose-500/70 focus:border-rose-400'
                      : 'border-slate-800 focus:border-amber-500'
                  }`}
                />
                {touched.bio && fieldErrors.bio && (
                  <p className="mt-1.5 text-xs text-rose-300">{fieldErrors.bio}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="min-h-[46px] inline-flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-slate-950 font-bold text-xs sm:text-sm px-5 py-2.5 transition"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Saving...' : 'Save Profile Changes'}</span>
              </button>
            </form>

            {/* Account Settings: Two-Factor Authentication (TOTP + Recovery Codes) */}
            <div
              id="dashboard-2fa-section"
              className="rounded-2xl border border-slate-800/90 bg-slate-950 p-6 sm:p-8 space-y-5"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0" />
                    <h2 className="text-lg font-bold text-white">
                      Two-Factor Authentication (2FA)
                    </h2>
                  </div>
                  <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
                    Protect your Creator Studio, chapters, and payouts with a time-based 6-digit
                    code from Google Authenticator, Authy, 1Password, or any TOTP app, backed by
                    one-time recovery codes.
                  </p>
                </div>

                <div className="text-xs font-semibold shrink-0">
                  {user.totp_enabled ? (
                    <span className="text-emerald-400">Enabled · TOTP Active</span>
                  ) : (
                    <span className="text-slate-400">Disabled</span>
                  )}
                </div>
              </div>

              {totpBannerMessage && (
                <div className="rounded-xl border border-emerald-500/35 bg-emerald-950/25 p-3.5 flex items-center gap-2.5 text-xs text-emerald-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{totpBannerMessage}</span>
                </div>
              )}

              {totpBannerError && (
                <div
                  role="alert"
                  className="rounded-xl border border-rose-500/40 bg-rose-950/30 p-3.5 flex items-center gap-2.5 text-xs text-rose-200"
                >
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{totpBannerError}</span>
                </div>
              )}

              {/* Newly Generated One-Time Recovery Codes Vault View */}
              {freshRecoveryCodes && freshRecoveryCodes.length > 0 && (
                <div
                  id="dashboard-2fa-recovery-codes-panel"
                  className="rounded-xl border border-amber-500/40 bg-slate-900/80 p-5 space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
                        <h3 className="text-sm font-bold text-white">
                          Save Your One-Time Recovery Codes
                        </h3>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        Store these {freshRecoveryCodes.length} recovery codes in a password manager
                        or safe offline location. Each code works{' '}
                        <strong className="text-white">once</strong> to sign in if you lose access
                        to your authenticator device, and will not be shown in plaintext again.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {freshRecoveryCodes.map((code, index) => (
                      <div
                        key={code}
                        className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2.5 flex items-center justify-between gap-2 font-mono text-xs tabular-nums"
                      >
                        <span className="text-slate-500">
                          {String(index + 1).padStart(2, '0')}.
                        </span>
                        <span className="font-semibold text-amber-300 tracking-wider">
                          {code}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <button
                        id="dashboard-2fa-copy-recovery-codes-btn"
                        type="button"
                        onClick={handleCopyRecoveryCodes}
                        className="min-h-[40px] inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-950 hover:bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-100 transition"
                      >
                        {copiedRecoveryCodes ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400">Codes Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-amber-400" />
                            <span>Copy Recovery Codes</span>
                          </>
                        )}
                      </button>

                      <button
                        id="dashboard-2fa-download-recovery-codes-btn"
                        type="button"
                        onClick={handleDownloadRecoveryCodes}
                        className="min-h-[40px] inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-950 hover:bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-100 transition"
                      >
                        <Download className="w-3.5 h-3.5 text-amber-400" />
                        <span>Download .txt</span>
                      </button>
                    </div>

                    <button
                      id="dashboard-2fa-dismiss-recovery-codes-btn"
                      type="button"
                      onClick={() => setFreshRecoveryCodes(null)}
                      className="min-h-[40px] rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs px-4 py-2 transition"
                    >
                      I Have Saved These Codes
                    </button>
                  </div>
                </div>
              )}

              {!isCreatorOrAdmin ? (
                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-xs text-slate-300 leading-relaxed">
                  Two-Factor Authentication is designed for Creator Accounts. Switch your{' '}
                  <span className="font-semibold text-white">Account Role</span> to{' '}
                  <span className="font-semibold text-amber-400">Creator</span> above and save
                  profile changes to enable authenticator app protection.
                </div>
              ) : user.totp_enabled ? (
                <div className="space-y-4">
                  <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1 text-xs">
                      <p className="font-semibold text-white">
                        Authenticator App Verification Required at Sign-In
                      </p>
                      <p className="text-slate-400">
                        Every sign-in to <span className="text-slate-200">{user.email}</span>{' '}
                        requires your password plus a 6-digit code. Unused recovery codes:{' '}
                        <span className="font-mono font-semibold text-amber-300 tabular-nums">
                          {remainingRecoveryCodesCount}/8
                        </span>
                        .
                      </p>
                    </div>

                    <div className="flex items-center gap-2.5 flex-wrap shrink-0">
                      {!showRegenerateCodesForm && (
                        <button
                          id="dashboard-2fa-open-regenerate-btn"
                          type="button"
                          onClick={() => {
                            setShowRegenerateCodesForm(true);
                            setShowDisableTotpForm(false);
                            setTotpBannerError(null);
                            setTotpBannerMessage(null);
                          }}
                          className="min-h-[42px] inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-950 hover:bg-slate-800 text-slate-200 text-xs font-semibold px-3.5 py-2 transition"
                        >
                          <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                          <span>New Recovery Codes</span>
                        </button>
                      )}

                      {!showDisableTotpForm && (
                        <button
                          id="dashboard-2fa-open-disable-btn"
                          type="button"
                          onClick={() => {
                            setShowDisableTotpForm(true);
                            setShowRegenerateCodesForm(false);
                            setTotpBannerError(null);
                            setTotpBannerMessage(null);
                          }}
                          className="min-h-[42px] rounded-xl border border-slate-700 bg-slate-900 hover:bg-rose-950/40 hover:border-rose-500/40 text-slate-200 hover:text-rose-200 text-xs font-semibold px-4 py-2 transition"
                        >
                          Disable 2FA
                        </button>
                      )}
                    </div>
                  </div>

                  <AnimatePresence initial={false}>
                    {showRegenerateCodesForm && (
                      <motion.form
                        key="dashboard-regenerate-totp-form"
                        initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: prefersReducedMotion ? 0 : -8 }}
                        transition={{
                          duration: prefersReducedMotion ? 0.12 : 0.22,
                          ease: [0.22, 1, 0.36, 1],
                        }}
                        onAnimationComplete={() => {
                          if (regenerateFormActiveRef.current) {
                            regenerateTotpInputRef.current?.focus({ preventScroll: true });
                          }
                        }}
                        onSubmit={handleRegenerateCodesSubmit}
                        noValidate
                        className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 space-y-4"
                      >
                        <div className="space-y-1">
                          <h3 className="text-sm font-bold text-white">
                            Regenerate One-Time Recovery Codes
                          </h3>
                          <p className="text-xs text-slate-400">
                            Enter a current 6-digit code from your authenticator app to issue 8 fresh
                            recovery codes. Any previously saved recovery codes will be invalidated.
                          </p>
                        </div>

                        <div className="max-w-xs">
                          <label
                            htmlFor="dashboard-2fa-regenerate-code"
                            className="block text-xs font-semibold text-slate-200 mb-1.5"
                          >
                            6-Digit Authenticator Code
                          </label>
                          <div className="relative">
                            <KeyRound className="w-4 h-4 text-amber-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <input
                              ref={regenerateTotpInputRef}
                              id="dashboard-2fa-regenerate-code"
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              autoComplete="one-time-code"
                              maxLength={6}
                              disabled={isRegeneratingCodes}
                              value={regenerateTotpCode}
                            onChange={(e) => {
                              const clean = e.target.value.replace(/\D/g, '').slice(0, 6);
                              setRegenerateTotpCode(clean);
                              setTotpBannerError(null);
                              if (regenerateTotpTouched) {
                                const parsed = totpCodeFormSchema.safeParse({ code: clean });
                                setRegenerateTotpError(
                                  parsed.success
                                    ? null
                                    : parsed.error.issues[0]?.message || 'Enter a 6-digit code.'
                                );
                              }
                            }}
                            onBlur={() => {
                              setRegenerateTotpTouched(true);
                              const parsed = totpCodeFormSchema.safeParse({
                                code: regenerateTotpCode,
                              });
                              setRegenerateTotpError(
                                parsed.success
                                  ? null
                                  : parsed.error.issues[0]?.message || 'Enter a 6-digit code.'
                              );
                            }}
                            placeholder="000000"
                            className={`min-h-[46px] w-full rounded-xl border bg-slate-950 pl-10 pr-3.5 py-2.5 text-center font-mono text-base tracking-[0.3em] tabular-nums text-white placeholder:text-slate-600 focus:outline-none transition ${
                              regenerateTotpTouched && regenerateTotpError
                                ? 'border-rose-500/70 focus:border-rose-400'
                                : 'border-slate-800 focus:border-amber-500'
                            }`}
                          />
                        </div>
                        {regenerateTotpTouched && regenerateTotpError && (
                          <p className="mt-1.5 text-xs text-rose-300">{regenerateTotpError}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-3 flex-wrap">
                        <button
                          id="dashboard-2fa-confirm-regenerate-btn"
                          type="submit"
                          disabled={isRegeneratingCodes}
                          className="min-h-[44px] rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-slate-950 font-bold text-xs px-4 py-2.5 transition"
                        >
                          {isRegeneratingCodes
                            ? 'Generating Codes...'
                            : 'Generate 8 New Recovery Codes'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowRegenerateCodesForm(false);
                            setRegenerateTotpCode('');
                            setRegenerateTotpError(null);
                            setRegenerateTotpTouched(false);
                          }}
                          className="min-h-[44px] rounded-xl border border-slate-800 bg-slate-950 hover:bg-slate-800 text-slate-300 text-xs font-semibold px-4 py-2.5 transition"
                        >
                          Cancel
                        </button>
                      </div>
                      </motion.form>
                    )}
                  </AnimatePresence>

                  {showDisableTotpForm && (
                    <form
                      onSubmit={handleDisableTotpSubmit}
                      noValidate
                      className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 space-y-4"
                    >
                      <div className="space-y-1">
                        <h3 className="text-sm font-bold text-white">
                          Confirm Disable Two-Factor Authentication
                        </h3>
                        <p className="text-xs text-slate-400">
                          Enter your current account password and a live 6-digit authenticator code
                          (or an unused recovery code) to turn off 2FA.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label
                            htmlFor="dashboard-2fa-disable-password"
                            className="block text-xs font-semibold text-slate-200 mb-1.5"
                          >
                            Current Password
                          </label>
                          <div className="relative">
                            <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <input
                              id="dashboard-2fa-disable-password"
                              name="password"
                              type="password"
                              autoComplete="current-password"
                              value={disableValues.password}
                              onChange={(e) =>
                                handleDisableFieldChange('password', e.target.value)
                              }
                              onBlur={() =>
                                setDisableTouched((prev) => ({ ...prev, password: true }))
                              }
                              aria-invalid={Boolean(
                                disableTouched.password && disableErrors.password
                              )}
                              placeholder="Enter current password"
                              className={`min-h-[46px] w-full rounded-xl border bg-slate-950 pl-10 pr-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none transition ${
                                disableTouched.password && disableErrors.password
                                  ? 'border-rose-500/70 focus:border-rose-400'
                                  : 'border-slate-800 focus:border-amber-500'
                              }`}
                            />
                          </div>
                          {disableTouched.password && disableErrors.password && (
                            <p className="mt-1.5 text-xs text-rose-300">
                              {disableErrors.password}
                            </p>
                          )}
                        </div>

                        <div>
                          <label
                            htmlFor="dashboard-2fa-disable-code"
                            className="block text-xs font-semibold text-slate-200 mb-1.5"
                          >
                            6-Digit Code or Recovery Code
                          </label>
                          <div className="relative">
                            <KeyRound className="w-4 h-4 text-amber-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <input
                              id="dashboard-2fa-disable-code"
                              name="code"
                              type="text"
                              autoComplete="one-time-code"
                              maxLength={9}
                              value={disableValues.code}
                              onChange={(e) => handleDisableFieldChange('code', e.target.value)}
                              onBlur={() =>
                                setDisableTouched((prev) => ({ ...prev, code: true }))
                              }
                              aria-invalid={Boolean(disableTouched.code && disableErrors.code)}
                              placeholder="000000 or XXXX-XXXX"
                              className={`min-h-[46px] w-full rounded-xl border bg-slate-950 pl-10 pr-3.5 py-2.5 text-center font-mono text-sm tracking-widest tabular-nums text-white placeholder:text-slate-600 focus:outline-none transition ${
                                disableTouched.code && disableErrors.code
                                  ? 'border-rose-500/70 focus:border-rose-400'
                                  : 'border-slate-800 focus:border-amber-500'
                              }`}
                            />
                          </div>
                          {disableTouched.code && disableErrors.code && (
                            <p className="mt-1.5 text-xs text-rose-300">{disableErrors.code}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 flex-wrap">
                        <button
                          id="dashboard-2fa-confirm-disable-btn"
                          type="submit"
                          disabled={isDisablingTotp}
                          className="min-h-[44px] rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-60 text-white font-bold text-xs px-4 py-2.5 transition"
                        >
                          {isDisablingTotp ? 'Disabling 2FA...' : 'Disable Two-Factor Auth'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowDisableTotpForm(false);
                            setDisableValues({ password: '', code: '' });
                            setDisableErrors({});
                            setDisableTouched({});
                          }}
                          className="min-h-[44px] rounded-xl border border-slate-800 bg-slate-950 hover:bg-slate-800 text-slate-300 text-xs font-semibold px-4 py-2.5 transition"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              ) : (
                <AnimatePresence mode="wait" initial={false}>
                  {!totpSetup ? (
                    <motion.div
                      key="dashboard-totp-idle"
                      initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: prefersReducedMotion ? 0 : -8 }}
                      transition={{
                        duration: prefersReducedMotion ? 0.1 : 0.2,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-900/60 p-4"
                    >
                      <div className="space-y-1 text-xs">
                        <p className="font-semibold text-white">
                          Add an Authenticator App to Your Creator Account
                        </p>
                        <p className="text-slate-400">
                          Generate a QR code, copyable TOTP URL, and 8 one-time recovery codes
                          compatible with any standard authenticator app.
                        </p>
                      </div>

                      <button
                        id="dashboard-2fa-setup-btn"
                        type="button"
                        disabled={isStartingTotpSetup}
                        onClick={handleStartTotpSetup}
                        className="min-h-[44px] shrink-0 inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-slate-950 font-bold text-xs px-4 py-2.5 transition"
                      >
                        <QrCode className="w-4 h-4" />
                        <span>
                          {isStartingTotpSetup ? 'Generating Key...' : 'Set Up Authenticator App'}
                        </span>
                      </button>
                    </motion.div>
                  ) : (
                    <motion.form
                      key="dashboard-totp-setup-form"
                      initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: prefersReducedMotion ? 0 : -8 }}
                      transition={{
                        duration: prefersReducedMotion ? 0.12 : 0.24,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                      onAnimationComplete={() => {
                        if (totpSetupActiveRef.current) {
                          enableTotpInputRef.current?.focus({ preventScroll: true });
                        }
                      }}
                      onSubmit={handleEnableTotpSubmit}
                      noValidate
                      className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-5"
                    >
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
                    {/* QR Code + Adjacent Copy TOTP URL Action */}
                    <div className="md:col-span-5 flex flex-col items-center justify-center space-y-3">
                      <div className="rounded-xl bg-white p-3 border border-slate-200">
                        <img
                          src={totpSetup.qrCodeDataUrl}
                          alt="Scan this QR code in your authenticator app"
                          width={184}
                          height={184}
                          className="h-44 w-44 object-contain"
                        />
                      </div>

                      <div className="w-full max-w-[230px] space-y-1.5 text-center">
                        <span className="block text-[11px] text-slate-400">
                          Scan QR code or paste the TOTP URL directly:
                        </span>
                        <button
                          id="dashboard-2fa-copy-totp-url-btn"
                          type="button"
                          onClick={handleCopyTotpUrl}
                          aria-label="Copy TOTP URL to clipboard"
                          className="min-h-[40px] w-full inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-950 hover:bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-100 transition"
                        >
                          {copiedTotpUrl ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              <span className="text-emerald-400">TOTP URL Copied!</span>
                            </>
                          ) : (
                            <>
                              <ClipboardCopy className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                              <span>Copy to clipboard</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="md:col-span-7 space-y-4">
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-white">
                          01. Scan QR Code or Enter Setup Details
                        </p>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          Scan the QR code with your authenticator app, click{' '}
                          <strong className="text-slate-200">Copy to clipboard</strong> beside the
                          QR code to paste the <code className="text-slate-300">otpauth://</code>{' '}
                          URL, or enter this Base32 key manually:
                        </p>
                      </div>

                      <div className="space-y-2">
                        <div className="rounded-xl border border-slate-800 bg-slate-950 p-2.5 flex items-center justify-between gap-2">
                          <code
                            title={totpSetup.otpauthUrl}
                            className="font-mono text-[11px] text-slate-300 truncate"
                          >
                            {totpSetup.otpauthUrl}
                          </code>
                          <button
                            type="button"
                            onClick={handleCopyTotpUrl}
                            className="min-h-[32px] shrink-0 inline-flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 px-2.5 py-1 text-[11px] font-semibold text-amber-400 transition"
                          >
                            {copiedTotpUrl ? 'Copied' : 'Copy URL'}
                          </button>
                        </div>

                        <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 flex items-center justify-between gap-2">
                          <code className="font-mono text-xs text-amber-300 tracking-wider break-all">
                            {totpSetup.manualEntryKey}
                          </code>
                          <button
                            type="button"
                            onClick={handleCopyManualKey}
                            className="min-h-[36px] shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 transition"
                          >
                            {copiedManualKey ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                <span className="text-emerald-400">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5 text-slate-400" />
                                <span>Copy Key</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label
                          htmlFor="dashboard-2fa-enable-code"
                          className="block text-xs font-bold text-white"
                        >
                          02. Enter 6-Digit Verification Code to Activate &amp; Generate Recovery
                          Codes
                        </label>
                        <div className="relative">
                          <KeyRound className="w-4 h-4 text-amber-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input
                            ref={enableTotpInputRef}
                            id="dashboard-2fa-enable-code"
                            name="code"
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            autoComplete="one-time-code"
                            maxLength={6}
                            disabled={isEnablingTotp}
                            value={enableCode}
                            onChange={(e) => {
                              const clean = e.target.value.replace(/\D/g, '').slice(0, 6);
                              setEnableCode(clean);
                              setTotpBannerError(null);
                              if (enableCodeTouched) {
                                const parsed = totpCodeFormSchema.safeParse({ code: clean });
                                setEnableCodeError(
                                  parsed.success
                                    ? null
                                    : parsed.error.issues[0]?.message ||
                                        'Enter a 6-digit numeric code.'
                                );
                              }
                            }}
                            onBlur={() => {
                              setEnableCodeTouched(true);
                              const parsed = totpCodeFormSchema.safeParse({ code: enableCode });
                              setEnableCodeError(
                                parsed.success
                                  ? null
                                  : parsed.error.issues[0]?.message ||
                                      'Enter a 6-digit numeric code.'
                              );
                            }}
                            aria-invalid={Boolean(enableCodeTouched && enableCodeError)}
                            placeholder="000000"
                            className={`min-h-[48px] w-full rounded-xl border bg-slate-950 pl-10 pr-4 py-2.5 text-center font-mono text-lg tracking-[0.35em] tabular-nums text-white placeholder:text-slate-600 focus:outline-none transition ${
                              enableCodeTouched && enableCodeError
                                ? 'border-rose-500/70 focus:border-rose-400'
                                : 'border-slate-800 focus:border-amber-500'
                            }`}
                          />
                        </div>
                        {enableCodeTouched && enableCodeError && (
                          <p className="text-xs text-rose-300">{enableCodeError}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center gap-3 flex-wrap">
                    <button
                      id="dashboard-2fa-enable-btn"
                      type="submit"
                      disabled={isEnablingTotp}
                      className="min-h-[46px] inline-flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-slate-950 font-bold text-xs sm:text-sm px-5 py-2.5 transition"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>
                        {isEnablingTotp
                          ? 'Verifying & Generating Recovery Codes...'
                          : 'Enable Two-Factor Authentication'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setTotpSetup(null);
                        setEnableCode('');
                        setEnableCodeError(null);
                        setEnableCodeTouched(false);
                      }}
                      className="min-h-[46px] rounded-xl border border-slate-800 bg-slate-950 hover:bg-slate-800 text-slate-300 text-xs font-semibold px-4 py-2.5 transition"
                    >
                      Cancel
                    </button>
                  </div>
                    </motion.form>
                  )}
                </AnimatePresence>
              )}
            </div>
          </div>

          {/* Session & Account Summary */}
          <div className="lg:col-span-4 rounded-2xl border border-slate-800/90 bg-slate-950 p-6 space-y-5">
            <h2 className="text-base font-bold text-white">Session Summary</h2>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between py-2 border-b border-slate-800/80">
                <span className="text-slate-400">Email Status</span>
                <span className="font-semibold text-emerald-400">
                  {user.email_verified ? 'Verified' : 'Pending'}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-800/80">
                <span className="text-slate-400">Two-Factor Auth</span>
                <span
                  className={`font-semibold ${
                    user.totp_enabled ? 'text-emerald-400' : 'text-slate-400'
                  }`}
                >
                  {user.totp_enabled ? 'Enabled (TOTP)' : 'Disabled'}
                </span>
              </div>
              {user.totp_enabled && (
                <div className="flex items-center justify-between py-2 border-b border-slate-800/80">
                  <span className="text-slate-400">Recovery Codes</span>
                  <span className="font-mono text-amber-300 tabular-nums">
                    {remainingRecoveryCodesCount}/8 unused
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between py-2 border-b border-slate-800/80">
                <span className="text-slate-400">Pen Name</span>
                <span className="font-medium text-slate-200 truncate max-w-[160px]">
                  {user.pen_name}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-800/80">
                <span className="text-slate-400">Access Token</span>
                <span className="font-mono text-slate-300 tabular-nums">15m JWT</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-slate-400">Refresh Cookie</span>
                <span className="font-mono text-slate-300 tabular-nums">7d httpOnly</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigateHomeCatalog(onBackToCatalog)}
              className="min-h-[44px] w-full inline-flex items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-semibold px-4 py-2.5 transition"
            >
              <BookOpen className="w-4 h-4 text-amber-400" />
              <span>Explore Reader Catalog</span>
            </button>
          </div>
        </div>
      </section>
    </AuthGroupLayout>
  );
}

export default CreatorDashboardPage;
