'use client';

import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  Mail,
  QrCode,
  RefreshCw,
  Save,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Trash2,
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
import { CreatorChapterStatsCard } from '../../../components/publisher/CreatorChapterStatsCard';
import AuthGroupLayout from '../layout';
import {
  AuthRoutePath,
  DashboardProfileFormValues,
  DisableTwoFactorFormValues,
  backupEmailFormSchema,
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

/**
 * Skeleton loader matching CreatorDashboardPage layout to eliminate layout shift during initial fetch.
 */
export const CreatorDashboardSkeleton = memo(function CreatorDashboardSkeleton() {
  return (
    <section
      id="creator-dashboard-skeleton"
      role="status"
      aria-busy="true"
      aria-label="Loading Creator Dashboard..."
      className="mx-auto w-full max-w-5xl py-3 sm:py-6 space-y-6 animate-pulse"
    >
      <span className="sr-only">Checking your session for Creator Dashboard...</span>

      {/* Top Navigation Skeleton */}
      <div className="flex items-center justify-between gap-4">
        <div className="h-10 w-44 rounded-xl bg-slate-900/90 border border-slate-800/80" />
        <div className="h-10 w-28 rounded-xl bg-slate-900/90 border border-slate-800/80" />
      </div>

      {/* Creator Identity Header Skeleton */}
      <div className="rounded-2xl border border-slate-800/90 bg-slate-950 p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start sm:items-center gap-4 min-w-0 flex-1">
          <div className="h-16 w-16 rounded-2xl bg-slate-800/80 shrink-0" />
          <div className="space-y-2.5 flex-1 max-w-md">
            <div className="h-3.5 w-36 rounded-md bg-slate-800/80" />
            <div className="h-8 w-52 rounded-lg bg-slate-800/90" />
            <div className="h-3.5 w-72 max-w-full rounded-md bg-slate-900" />
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="h-11 w-48 rounded-xl bg-amber-500/20 border border-amber-500/20" />
          <div className="h-11 w-36 rounded-xl bg-slate-900 border border-slate-800" />
        </div>
      </div>

      {/* Reading Stats Card Skeleton */}
      <div className="rounded-2xl border border-slate-800/90 bg-slate-950 p-5 sm:p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-slate-800/80 shrink-0" />
            <div className="space-y-2">
              <div className="h-4 w-64 max-w-full rounded-md bg-slate-800/90" />
              <div className="h-3 w-48 rounded-md bg-slate-900" />
            </div>
          </div>
          <div className="h-3.5 w-36 rounded-md bg-slate-900" />
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[0, 1, 2, 3].map((idx) => (
            <div
              key={idx}
              className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-4 space-y-3"
            >
              <div className="h-3 w-24 rounded bg-slate-800/80" />
              <div className="h-8 w-20 rounded-md bg-slate-800/90" />
              <div className="h-2.5 w-28 rounded bg-slate-900" />
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-4 space-y-3">
          <div className="h-10 w-full rounded-lg bg-slate-900/80" />
          <div className="h-10 w-full rounded-lg bg-slate-900/80" />
        </div>
      </div>

      {/* Main Content + Sidebar Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 space-y-6">
          <div className="rounded-2xl border border-slate-800/90 bg-slate-950 p-6 sm:p-8 space-y-5">
            <div className="space-y-2">
              <div className="h-5 w-48 rounded-md bg-slate-800/90" />
              <div className="h-3.5 w-80 max-w-full rounded bg-slate-900" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="h-12 rounded-xl bg-slate-900/80 border border-slate-800/80" />
              <div className="h-12 rounded-xl bg-slate-900/80 border border-slate-800/80" />
            </div>
            <div className="h-10 w-56 rounded-xl bg-slate-900/80 border border-slate-800/80" />
            <div className="h-24 w-full rounded-xl bg-slate-900/80 border border-slate-800/80" />
            <div className="h-11 w-44 rounded-xl bg-amber-500/20" />
          </div>

          <div className="rounded-2xl border border-slate-800/90 bg-slate-950 p-6 sm:p-8 space-y-4">
            <div className="h-5 w-56 rounded-md bg-slate-800/90" />
            <div className="h-28 w-full rounded-xl bg-slate-900/80 border border-slate-800/80" />
          </div>
        </div>

        <div className="lg:col-span-4 rounded-2xl border border-slate-800/90 bg-slate-950 p-6 space-y-4">
          <div className="h-5 w-36 rounded-md bg-slate-800/90" />
          {[0, 1, 2, 3, 4, 5].map((row) => (
            <div
              key={row}
              className="flex items-center justify-between py-2 border-b border-slate-800/70"
            >
              <div className="h-3 w-24 rounded bg-slate-800/80" />
              <div className="h-3 w-20 rounded bg-slate-900" />
            </div>
          ))}
          <div className="h-11 w-full rounded-xl bg-slate-900 border border-slate-800" />
        </div>
      </div>
    </section>
  );
});

interface DashboardTopBarProps {
  onBack: () => void;
  onLogout: () => void;
}

const DashboardTopBar = memo(function DashboardTopBar({
  onBack,
  onLogout,
}: DashboardTopBarProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <button
        type="button"
        onClick={onBack}
        className="min-h-[44px] inline-flex items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-400 hover:text-white transition"
      >
        <ArrowLeft className="w-4 h-4 text-amber-400" />
        <span>Back to Manga Catalog</span>
      </button>

      <button
        id="dashboard-logout-btn"
        type="button"
        onClick={onLogout}
        className="min-h-[44px] inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white text-xs font-semibold px-4 py-2 transition"
      >
        <LogOut className="w-4 h-4 text-rose-400" />
        <span>Logout</span>
      </button>
    </div>
  );
});

interface CreatorIdentityHeaderProps {
  avatarUrl?: string | null;
  penName: string;
  role: OververseAuthUser['role'];
  totpEnabled: boolean;
  email: string;
  studioName?: string | null;
  joinedDate: string;
  onOpenUpload: () => void;
  onOpenStudio: () => void;
}

const CreatorIdentityHeader = memo(function CreatorIdentityHeader({
  avatarUrl,
  penName,
  role,
  totpEnabled,
  email,
  studioName,
  joinedDate,
  onOpenUpload,
  onOpenStudio,
}: CreatorIdentityHeaderProps) {
  return (
    <div className="rounded-2xl border border-slate-800/90 bg-slate-950 p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
      <div className="flex items-start sm:items-center gap-4 min-w-0">
        <img
          src={avatarUrl || APP_LOGO_SRC}
          alt={penName}
          width={64}
          height={64}
          decoding="async"
          className="h-16 w-16 rounded-2xl object-cover border border-slate-800 bg-[#0f0424] shrink-0"
        />
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold flex-wrap">
            <span className="text-emerald-400 capitalize">
              Verified {role} Account
            </span>
            {totpEnabled && (
              <>
                <span aria-hidden="true" className="text-slate-600">
                  ·
                </span>
                <span className="text-amber-400">2FA Protected</span>
              </>
            )}
          </div>
          <h1 className="font-['Bebas_Neue',sans-serif] text-3xl sm:text-4xl tracking-wide text-white truncate">
            {penName}
          </h1>
          <div className="flex items-center gap-2 text-xs text-slate-400 flex-wrap">
            <span className="text-slate-200">{email}</span>
            <span aria-hidden="true">·</span>
            <span>{studioName}</span>
            <span aria-hidden="true">·</span>
            <span>Joined {joinedDate}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <button
          type="button"
          onClick={onOpenUpload}
          className="min-h-[46px] inline-flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm px-4 py-2.5 transition"
        >
          <UploadCloud className="w-4 h-4" />
          <span>Publish Series / Chapter</span>
        </button>

        <button
          type="button"
          onClick={onOpenStudio}
          className="min-h-[46px] inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs sm:text-sm px-4 py-2.5 transition"
        >
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>Creator Studio</span>
        </button>
      </div>
    </div>
  );
});

interface CreatorProfileSettingsFormProps {
  user: OververseAuthUser;
  backupEmailInput: string;
  backupEmailError: string | null;
  backupEmailTouched: boolean;
  isSavingBackupEmail: boolean;
  isRemovingBackupEmail: boolean;
  showRemoveBackupConfirm: boolean;
  validateBackupEmailDraft: (input: string) => string | null;
  onBackupEmailChange: (nextValue: string) => void;
  onBackupEmailBlur: () => void;
  onQuickSaveBackupEmail: () => void;
  onRequestRemoveBackupEmail: () => void;
  onConfirmRemoveBackupEmail: () => void;
  onCancelRemoveBackupEmail: () => void;
  onUserUpdated: (nextUser: OververseAuthUser) => void;
}

const CreatorProfileSettingsForm = memo(function CreatorProfileSettingsForm({
  user,
  backupEmailInput,
  backupEmailError,
  backupEmailTouched,
  isSavingBackupEmail,
  isRemovingBackupEmail,
  showRemoveBackupConfirm,
  validateBackupEmailDraft,
  onBackupEmailChange,
  onBackupEmailBlur,
  onQuickSaveBackupEmail,
  onRequestRemoveBackupEmail,
  onConfirmRemoveBackupEmail,
  onCancelRemoveBackupEmail,
  onUserUpdated,
}: CreatorProfileSettingsFormProps) {
  const [values, setValues] = useState<DashboardProfileFormValues>({
    pen_name: user.pen_name,
    studio_name: user.studio_name || `${user.pen_name} Studio`,
    role: user.role === 'reader' ? 'reader' : 'creator',
    bio: user.bio || '',
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

  useEffect(() => {
    setValues({
      pen_name: user.pen_name,
      studio_name: user.studio_name || `${user.pen_name} Studio`,
      role: user.role === 'reader' ? 'reader' : 'creator',
      bio: user.bio || '',
    });
  }, [user.pen_name, user.studio_name, user.role, user.bio]);

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

    let backupEmailParam: string | null | undefined = undefined;
    if (backupEmailInput.trim()) {
      const valid = validateBackupEmailDraft(backupEmailInput);
      if (!valid) {
        return;
      }
      backupEmailParam = valid;
    } else if (user.backup_email && backupEmailInput === '') {
      backupEmailParam = null;
    }

    setIsSaving(true);
    const patchPayload: {
      pen_name: string;
      studio_name: string;
      bio: string;
      role: 'creator' | 'reader';
      backup_email?: string | null;
    } = {
      pen_name: parsed.data.pen_name,
      studio_name: parsed.data.studio_name,
      bio: parsed.data.bio,
      role: parsed.data.role,
    };
    if (backupEmailParam !== undefined) {
      patchPayload.backup_email = backupEmailParam;
    }

    const res = await patchOververseCreatorProfile(patchPayload);
    setIsSaving(false);

    if (!res.success || !res.user) {
      setSaveError(res.error || 'Could not update profile.');
      return;
    }

    onUserUpdated(res.user);
    setSaveMessage('Creator profile and secondary recovery settings saved.');
  };

  return (
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

      {/* Profile Settings: Secondary Backup Email Configuration (Clean Two-Column Layout) */}
      <div
        id="profile-settings-backup-email-section"
        className="rounded-2xl border border-amber-500/30 bg-slate-900/60 p-5 sm:p-6 space-y-4 pt-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-amber-400 shrink-0" />
              <h3 className="text-sm font-bold text-white">
                Secondary Recovery Email Configuration
              </h3>
              {user.backup_email ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-semibold">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Configured</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px] font-semibold">
                  <AlertCircle className="w-3 h-3" />
                  <span>Not Configured</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Maintain a dedicated emergency recovery email address to protect your creator account
              access, ongoing manga series, and royalty statements.
            </p>
          </div>
        </div>

        {/* Clean Two-Column Layout: Current Primary Email vs Secondary Recovery Email */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
          {/* Column 1: Current Primary Email Status */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4 flex flex-col justify-between space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Current Primary Email</span>
                </span>
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-[10px] font-bold font-mono">
                  Primary
                </span>
              </div>
              <p className="font-mono text-xs sm:text-sm font-bold text-white break-all" title={user.email}>
                {user.email}
              </p>
              <div className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Verified Account Login Identifier</span>
              </div>
            </div>
            <p className="text-[10px] text-slate-500 pt-2 border-t border-slate-850 leading-relaxed">
              Main login credential. Platform notices and revenue reports are routed here.
            </p>
          </div>

          {/* Column 2: Secondary Recovery Email Status & Input */}
          <div className="rounded-xl border border-amber-500/30 bg-slate-950/80 p-4 flex flex-col justify-between space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                  <span>Secondary Recovery Email</span>
                </span>
                {user.backup_email ? (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
                    Active
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-bold">
                    Missing
                  </span>
                )}
              </div>
              <p
                className={`font-mono text-xs sm:text-sm font-bold break-all ${
                  user.backup_email ? 'text-amber-300' : 'text-slate-500 italic'
                }`}
                title={user.backup_email || 'No secondary recovery address configured'}
              >
                {user.backup_email || 'No recovery address configured'}
              </p>
              <span className="text-[10px] text-slate-400 block">
                Emergency recovery inbox for password resets and security alerts.
              </span>
            </div>

            <div className="space-y-1.5 pt-1 border-t border-slate-850">
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-amber-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="dashboard-profile-backup-email"
                  name="backup_email"
                  type="email"
                  autoComplete="email"
                  disabled={isSavingBackupEmail || isRemovingBackupEmail || isSaving}
                  value={backupEmailInput}
                  onChange={(e) => onBackupEmailChange(e.target.value)}
                  onBlur={onBackupEmailBlur}
                  aria-invalid={Boolean(backupEmailTouched && backupEmailError)}
                  placeholder="e.g. author.recovery@example.com"
                  className={`min-h-[40px] w-full rounded-lg border bg-slate-900 pl-9 pr-3 py-1.5 text-xs text-white placeholder:text-slate-600 focus:outline-none transition ${
                    backupEmailTouched && backupEmailError
                      ? 'border-rose-500/70 focus:border-rose-400'
                      : 'border-slate-800 focus:border-amber-500'
                  }`}
                />
              </div>
              {backupEmailTouched && backupEmailError && (
                <p className="text-[11px] text-rose-300">{backupEmailError}</p>
              )}
            </div>
          </div>
        </div>

        {/* Quick Secondary Save & Remove Actions */}
        <div className="flex items-center gap-2.5 flex-wrap pt-1">
          <button
            id="profile-save-backup-email-btn"
            type="button"
            disabled={isSavingBackupEmail || isRemovingBackupEmail || isSaving}
            onClick={onQuickSaveBackupEmail}
            className="min-h-[40px] inline-flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-slate-950 font-bold text-xs px-4 py-2 transition shadow"
          >
            <Save className="w-3.5 h-3.5" />
            <span>
              {isSavingBackupEmail
                ? 'Saving Recovery Email...'
                : user.backup_email
                ? 'Update Secondary Email'
                : 'Save Secondary Email'}
            </span>
          </button>

          {user.backup_email && !showRemoveBackupConfirm && (
            <button
              id="profile-remove-backup-email-btn"
              type="button"
              disabled={isSavingBackupEmail || isRemovingBackupEmail || isSaving}
              onClick={onRequestRemoveBackupEmail}
              className="min-h-[40px] inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-950 hover:bg-rose-950/40 hover:border-rose-500/40 text-slate-300 hover:text-rose-200 text-xs font-semibold px-3.5 py-2 transition"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              <span>Remove</span>
            </button>
          )}

          {showRemoveBackupConfirm && (
            <div className="flex items-center gap-2 p-1 rounded-xl bg-rose-950/40 border border-rose-500/40 animate-fadeIn">
              <span className="text-[11px] text-rose-200 font-semibold px-2">
                Remove secondary recovery email?
              </span>
              <button
                id="profile-confirm-remove-backup-email-btn"
                type="button"
                disabled={isRemovingBackupEmail}
                onClick={onConfirmRemoveBackupEmail}
                className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition"
              >
                {isRemovingBackupEmail ? '...' : 'Yes, Remove'}
              </button>
              <button
                type="button"
                onClick={onCancelRemoveBackupEmail}
                className="px-2 py-1 text-slate-400 hover:text-white text-xs transition"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
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
  );
});

interface BackupRecoveryEmailSectionProps {
  primaryEmail: string;
  emailVerified: boolean;
  backupEmail?: string | null;
  backupEmailInput: string;
  backupEmailError: string | null;
  backupEmailTouched: boolean;
  isSavingBackupEmail: boolean;
  isRemovingBackupEmail: boolean;
  backupEmailBannerMessage: string | null;
  backupEmailBannerError: string | null;
  showRemoveBackupConfirm: boolean;
  onBackupEmailChange: (nextValue: string) => void;
  onBackupEmailBlur: () => void;
  onSaveBackupEmail: (e: React.FormEvent<HTMLFormElement>) => void;
  onDismissBannerMessage: () => void;
  onDismissBannerError: () => void;
  onRequestRemoveBackupEmail: () => void;
  onConfirmRemoveBackupEmail: () => void;
  onCancelRemoveBackupEmail: () => void;
}

const BackupRecoveryEmailSection = memo(function BackupRecoveryEmailSection({
  primaryEmail,
  emailVerified,
  backupEmail,
  backupEmailInput,
  backupEmailError,
  backupEmailTouched,
  isSavingBackupEmail,
  isRemovingBackupEmail,
  backupEmailBannerMessage,
  backupEmailBannerError,
  showRemoveBackupConfirm,
  onBackupEmailChange,
  onBackupEmailBlur,
  onSaveBackupEmail,
  onDismissBannerMessage,
  onDismissBannerError,
  onRequestRemoveBackupEmail,
  onConfirmRemoveBackupEmail,
  onCancelRemoveBackupEmail,
}: BackupRecoveryEmailSectionProps) {
  return (
    <div
      id="dashboard-backup-email-section"
      className="rounded-2xl border border-slate-800/90 bg-slate-950 p-6 sm:p-8 space-y-5"
    >
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-amber-400 shrink-0" />
            <h2 className="text-lg font-bold text-white">Backup Recovery Email</h2>
          </div>
          <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
            Add a secondary recovery email address for your creator account to ensure
            uninterrupted access to your series, royalties, and studio settings if you ever
            lose access to your primary email address or authenticator device.
          </p>
        </div>

        <div className="text-xs font-semibold shrink-0">
          {backupEmail ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[11px] font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Recovery Active</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[11px] font-medium">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Not Configured</span>
            </span>
          )}
        </div>
      </div>

      {backupEmailBannerMessage && (
        <div className="rounded-xl border border-emerald-500/35 bg-emerald-950/25 p-3.5 flex items-center justify-between gap-2.5 text-xs text-emerald-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{backupEmailBannerMessage}</span>
          </div>
          <button
            type="button"
            onClick={onDismissBannerMessage}
            className="text-emerald-400 hover:text-white transition text-xs font-bold px-1"
            aria-label="Dismiss message"
          >
            ✕
          </button>
        </div>
      )}

      {backupEmailBannerError && (
        <div
          role="alert"
          className="rounded-xl border border-rose-500/40 bg-rose-950/30 p-3.5 flex items-center justify-between gap-2.5 text-xs text-rose-200"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{backupEmailBannerError}</span>
          </div>
          <button
            type="button"
            onClick={onDismissBannerError}
            className="text-rose-400 hover:text-white transition text-xs font-bold px-1"
            aria-label="Dismiss error"
          >
            ✕
          </button>
        </div>
      )}

      {/* Clean Two-Column Layout: Current Primary Email vs Secondary Recovery Email */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
        {/* Column 1: Current Primary Email Status Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6 flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Current Primary Email</h3>
                  <span className="text-[11px] text-slate-400">Account Owner Credential</span>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                <CheckCircle2 className="w-3 h-3" />
                <span>Active Login</span>
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Primary Account Address
              </span>
              <p className="font-mono text-sm sm:text-base font-bold text-white break-all" title={primaryEmail}>
                {primaryEmail}
              </p>
              <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-400">
                <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>{emailVerified ? 'Verified Email' : 'Verification Pending'}</span>
                </span>
                <span className="text-slate-600">·</span>
                <span>Fixed Account Identity</span>
              </div>
            </div>

            <div className="space-y-2 text-xs text-slate-300">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Account Responsibilities
              </span>
              <ul className="space-y-2 text-xs text-slate-400">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold mt-0.5">•</span>
                  <span>Used for primary web &amp; Android Play Console credentials.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold mt-0.5">•</span>
                  <span>Receives 70% AdMob and Play Store royalty disbursement statements.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold mt-0.5">•</span>
                  <span>Main destination for reader reviews, comments, and series notices.</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800/80 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Guarded by OVERVERSE Custom Auth</span>
            <span className="font-mono text-[10px] text-slate-400">Primary ID</span>
          </div>
        </div>

        {/* Column 2: Secondary Recovery Email Status & Configuration Card */}
        <div className="rounded-2xl border border-amber-500/35 bg-gradient-to-b from-amber-950/20 via-slate-900/80 to-slate-950 p-5 sm:p-6 flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Secondary Recovery Email</h3>
                  <span className="text-[11px] text-slate-400">Emergency Account Access</span>
                </div>
              </div>

              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                  backupEmail
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                    : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                }`}
              >
                {backupEmail ? (
                  <>
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Recovery Active</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-3 h-3" />
                    <span>Not Configured</span>
                  </>
                )}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Designated Recovery Inbox
                </span>
                {backupEmail && (
                  <span className="text-[10px] text-emerald-400 font-semibold">Active &amp; Guarded</span>
                )}
              </div>
              <p
                className={`font-mono text-sm sm:text-base font-bold break-all ${
                  backupEmail ? 'text-amber-300' : 'text-slate-500 italic'
                }`}
                title={backupEmail || 'No secondary recovery address configured'}
              >
                {backupEmail || 'No recovery address configured'}
              </p>
              <span className="text-[11px] text-slate-400 block">
                {backupEmail
                  ? 'Emergency access, password reset tokens, and 2FA lockout overrides are routed here.'
                  : 'Configure a secondary address below to guarantee account recovery if you lose access to your primary email.'}
              </span>
            </div>

            <form onSubmit={onSaveBackupEmail} noValidate className="space-y-3.5">
              <div className="space-y-1.5">
                <label
                  htmlFor="dashboard-backup-email"
                  className="block text-xs font-semibold text-slate-200"
                >
                  {backupEmail ? 'Update Secondary Recovery Address' : 'Add Secondary Recovery Address'}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-amber-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="dashboard-backup-email"
                    name="backup_email"
                    type="email"
                    autoComplete="email"
                    disabled={isSavingBackupEmail || isRemovingBackupEmail}
                    value={backupEmailInput}
                    onChange={(e) => onBackupEmailChange(e.target.value)}
                    onBlur={onBackupEmailBlur}
                    aria-invalid={Boolean(backupEmailTouched && backupEmailError)}
                    placeholder="e.g. author.recovery@example.com"
                    className={`min-h-[44px] w-full rounded-xl border bg-slate-950 pl-10 pr-3.5 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none transition ${
                      backupEmailTouched && backupEmailError
                        ? 'border-rose-500/70 focus:border-rose-400'
                        : 'border-slate-800 focus:border-amber-500'
                    }`}
                  />
                </div>
                {backupEmailTouched && backupEmailError && (
                  <p className="text-xs text-rose-300">{backupEmailError}</p>
                )}
                <p className="text-[11px] text-slate-400">
                  Must be distinct from primary address (
                  <span className="text-slate-300 font-mono">{primaryEmail}</span>).
                </p>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap pt-1">
                <button
                  id="dashboard-save-backup-email-btn"
                  type="submit"
                  disabled={isSavingBackupEmail || isRemovingBackupEmail}
                  className="min-h-[42px] inline-flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-slate-950 font-bold text-xs px-4 py-2 transition shadow"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>
                    {isSavingBackupEmail
                      ? 'Saving Recovery Email...'
                      : backupEmail
                      ? 'Update Recovery Email'
                      : 'Save Recovery Email'}
                  </span>
                </button>

                {backupEmail && !showRemoveBackupConfirm && (
                  <button
                    id="dashboard-open-remove-backup-email-btn"
                    type="button"
                    disabled={isSavingBackupEmail || isRemovingBackupEmail}
                    onClick={onRequestRemoveBackupEmail}
                    className="min-h-[42px] inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 hover:bg-rose-950/40 hover:border-rose-500/40 text-slate-300 hover:text-rose-200 text-xs font-semibold px-3.5 py-2 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                    <span>Remove</span>
                  </button>
                )}

                {showRemoveBackupConfirm && (
                  <div className="flex items-center gap-2 p-1.5 rounded-xl bg-rose-950/40 border border-rose-500/40 animate-fadeIn">
                    <span className="text-[11px] text-rose-200 font-semibold px-2">
                      Remove secondary email?
                    </span>
                    <button
                      id="dashboard-confirm-remove-backup-email-btn"
                      type="button"
                      disabled={isRemovingBackupEmail}
                      onClick={onConfirmRemoveBackupEmail}
                      className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition"
                    >
                      {isRemovingBackupEmail ? '...' : 'Yes, Remove'}
                    </button>
                    <button
                      type="button"
                      onClick={onCancelRemoveBackupEmail}
                      className="px-2 py-1 text-slate-400 hover:text-white text-xs transition"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Security Benefits & Account Access Guarantees */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-slate-800/80 text-[11px]">
        <div className="p-2.5 rounded-xl bg-slate-900/40 border border-slate-800/60 flex items-start gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-slate-200 block">Account Lockout Safety</span>
            <span className="text-slate-400">
              Regain studio access if your primary inbox is compromised or unavailable.
            </span>
          </div>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-900/40 border border-slate-800/60 flex items-start gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-slate-200 block">Emergency Alerts</span>
            <span className="text-slate-400">
              Notified immediately when sensitive security or 2FA updates occur.
            </span>
          </div>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-900/40 border border-slate-800/60 flex items-start gap-2">
          <Sparkles className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-slate-200 block">Creator Rights Guard</span>
            <span className="text-slate-400">
              Protects your publishing catalog, pen name ownership, and revenue payouts.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
});

interface TwoFactorSecuritySectionProps {
  userEmail: string;
  totpEnabled: boolean;
  isCreatorOrAdmin: boolean;
  remainingRecoveryCodesCount: number;
  prefersReducedMotion: boolean;
  onUserUpdated: (nextUser: OververseAuthUser) => void;
}

const TwoFactorSecuritySection = memo(function TwoFactorSecuritySection({
  userEmail,
  totpEnabled,
  isCreatorOrAdmin,
  remainingRecoveryCodesCount,
  prefersReducedMotion,
  onUserUpdated,
}: TwoFactorSecuritySectionProps) {
  const enableTotpInputRef = useRef<HTMLInputElement | null>(null);
  const regenerateTotpInputRef = useRef<HTMLInputElement | null>(null);

  const [totpSetup, setTotpSetup] = useState<TotpSetupPayload | null>(null);
  const [isStartingTotpSetup, setIsStartingTotpSetup] = useState(false);
  const [enableCode, setEnableCode] = useState('');
  const [enableCodeError, setEnableCodeError] = useState<string | null>(null);
  const [enableCodeTouched, setEnableCodeTouched] = useState(false);
  const [isEnablingTotp, setIsEnablingTotp] = useState(false);
  const [copiedTotpUrl, setCopiedTotpUrl] = useState(false);
  const [copiedManualKey, setCopiedManualKey] = useState(false);

  const [freshRecoveryCodes, setFreshRecoveryCodes] = useState<string[] | null>(null);
  const [copiedRecoveryCodes, setCopiedRecoveryCodes] = useState(false);
  const [showRegenerateCodesForm, setShowRegenerateCodesForm] = useState(false);
  const [regenerateTotpCode, setRegenerateTotpCode] = useState('');
  const [regenerateTotpError, setRegenerateTotpError] = useState<string | null>(null);
  const [regenerateTotpTouched, setRegenerateTotpTouched] = useState(false);
  const [isRegeneratingCodes, setIsRegeneratingCodes] = useState(false);

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
    const emailLabel = userEmail || 'creator@azoververse.com';
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

    onUserUpdated(res.user);
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

    onUserUpdated(res.user);
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

    onUserUpdated(res.user);
    setFreshRecoveryCodes(null);
    setShowDisableTotpForm(false);
    setShowRegenerateCodesForm(false);
    setDisableValues({ password: '', code: '' });
    setDisableTouched({});
    setTotpBannerMessage(
      res.message || 'Two-Factor Authentication has been disabled for your account.'
    );
  };

  return (
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
          <AnimatePresence mode="wait" initial={false}>
            {totpEnabled ? (
              <motion.span
                key="2fa-header-badge-enabled"
                initial={{ opacity: 0, scale: 0.88, y: 3 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.88, y: -3 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs font-bold shadow-[0_0_12px_rgba(16,185,129,0.25)]"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Enabled · TOTP Active</span>
              </motion.span>
            ) : (
              <motion.span
                key="2fa-header-badge-disabled"
                initial={{ opacity: 0, scale: 0.88, y: 3 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.88, y: -3 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700 text-xs font-medium"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                <span>Disabled</span>
              </motion.span>
            )}
          </AnimatePresence>
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
      ) : (
        <AnimatePresence mode="wait" initial={false}>
          {totpEnabled ? (
            <motion.div
              key="dashboard-2fa-status-card-enabled"
              id="dashboard-2fa-status-card"
              initial={{
                opacity: 0,
                scale: prefersReducedMotion ? 1 : 0.98,
                y: prefersReducedMotion ? 0 : 8,
              }}
              animate={{
                opacity: 1,
                scale: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                scale: prefersReducedMotion ? 1 : 0.98,
                y: prefersReducedMotion ? 0 : -8,
              }}
              transition={{
                duration: prefersReducedMotion ? 0.12 : 0.32,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="space-y-4"
            >
              <div className="rounded-2xl border border-emerald-500/35 bg-gradient-to-r from-emerald-950/30 via-slate-900/80 to-slate-950 p-5 sm:p-6 shadow-[0_0_24px_rgba(16,185,129,0.12)] transition-all">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="relative shrink-0 mt-0.5">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-[0_0_14px_rgba(16,185,129,0.35)]">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                      </span>
                    </div>

                    <div className="space-y-1 text-xs">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-bold text-white">
                          Two-Factor Authentication is Active &amp; Enforced
                        </h3>
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold tracking-wide">
                          <Check className="w-3 h-3" />
                          <span>Guarded</span>
                        </span>
                      </div>
                      <p className="text-slate-300 leading-relaxed">
                        Every sign-in to <span className="text-white font-medium">{userEmail}</span>{' '}
                        requires your primary password plus a 6-digit TOTP code.
                      </p>
                      <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-400">
                        <span>
                          Active Recovery Codes:{' '}
                          <strong className="font-mono text-amber-300 tabular-nums">
                            {remainingRecoveryCodesCount}/8
                          </strong>{' '}
                          remaining
                        </span>
                        <span className="text-slate-600">·</span>
                        <span className="text-emerald-400 font-semibold">
                          Publisher Shield On
                        </span>
                      </div>
                    </div>
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
            </motion.div>
          ) : (
            <motion.div
              key="dashboard-2fa-status-card-disabled"
              id="dashboard-2fa-status-card"
              initial={{
                opacity: 0,
                scale: prefersReducedMotion ? 1 : 0.98,
                y: prefersReducedMotion ? 0 : 8,
              }}
              animate={{
                opacity: 1,
                scale: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                scale: prefersReducedMotion ? 1 : 0.98,
                y: prefersReducedMotion ? 0 : -8,
              }}
              transition={{
                duration: prefersReducedMotion ? 0.12 : 0.32,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="space-y-4"
            >
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
                    className="rounded-2xl border border-amber-500/25 bg-gradient-to-r from-amber-950/15 via-slate-900/70 to-slate-950 p-5 sm:p-6 shadow-[0_0_20px_rgba(245,158,11,0.06)] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
                        <ShieldAlert className="w-5 h-5" />
                      </div>
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-bold text-white">
                            Two-Factor Authentication is Inactive
                          </h3>
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
                            <AlertCircle className="w-3 h-3" />
                            <span>Action Recommended</span>
                          </span>
                        </div>
                        <p className="text-slate-400 leading-relaxed">
                          Add an authenticator app (Google Authenticator, Authy, 1Password)
                          to protect your creator studio, chapters, and payout credentials
                          against unauthorized access.
                        </p>
                      </div>
                    </div>

                    <button
                      id="dashboard-2fa-setup-btn"
                      type="button"
                      disabled={isStartingTotpSetup}
                      onClick={handleStartTotpSetup}
                      className="min-h-[44px] shrink-0 inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-slate-950 font-bold text-xs px-5 py-2.5 shadow-lg shadow-amber-500/20 transition"
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
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
});

interface DashboardSessionSummaryProps {
  emailVerified: boolean;
  backupEmail?: string | null;
  totpEnabled: boolean;
  remainingRecoveryCodesCount: number;
  penName: string;
  onExploreCatalog: () => void;
}

const DashboardSessionSummary = memo(function DashboardSessionSummary({
  emailVerified,
  backupEmail,
  totpEnabled,
  remainingRecoveryCodesCount,
  penName,
  onExploreCatalog,
}: DashboardSessionSummaryProps) {
  return (
    <div className="lg:col-span-4 rounded-2xl border border-slate-800/90 bg-slate-950 p-6 space-y-5">
      <h2 className="text-base font-bold text-white">Session Summary</h2>

      <div className="space-y-3 text-xs">
        <div className="flex items-center justify-between py-2 border-b border-slate-800/80">
          <span className="text-slate-400">Email Status</span>
          <span className="font-semibold text-emerald-400">
            {emailVerified ? 'Verified' : 'Pending'}
          </span>
        </div>
        <div className="flex items-center justify-between py-2 border-b border-slate-800/80">
          <span className="text-slate-400">Backup Email</span>
          <span
            className={`font-semibold text-right truncate max-w-[170px] ${
              backupEmail
                ? 'text-emerald-400 font-mono text-[11px]'
                : 'text-slate-500'
            }`}
            title={backupEmail || 'Not configured'}
          >
            {backupEmail || 'Not configured'}
          </span>
        </div>
        <div className="flex items-center justify-between py-2 border-b border-slate-800/80">
          <span className="text-slate-400">Two-Factor Auth</span>
          <AnimatePresence mode="wait" initial={false}>
            {totpEnabled ? (
              <motion.span
                key="summary-totp-active"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                className="font-semibold text-emerald-400 inline-flex items-center gap-1"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Enabled (TOTP)</span>
              </motion.span>
            ) : (
              <motion.span
                key="summary-totp-disabled"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                className="font-semibold text-slate-400 inline-flex items-center gap-1"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                <span>Disabled</span>
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        {totpEnabled && (
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
            {penName}
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
        onClick={onExploreCatalog}
        className="min-h-[44px] w-full inline-flex items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-semibold px-4 py-2.5 transition"
      >
        <BookOpen className="w-4 h-4 text-amber-400" />
        <span>Explore Reader Catalog</span>
      </button>
    </div>
  );
});

export function CreatorDashboardPage({
  onNavigateAuthRoute,
  onOpenPublishingStudio,
  onOpenUploadModal,
  onBackToCatalog,
}: CreatorDashboardPageProps = {}) {
  const prefersReducedMotion = Boolean(useReducedMotion());

  const [user, setUser] = useState<OververseAuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Backup Recovery Email configuration states shared between Profile form and Recovery section
  const [backupEmailInput, setBackupEmailInput] = useState('');
  const [backupEmailError, setBackupEmailError] = useState<string | null>(null);
  const [backupEmailTouched, setBackupEmailTouched] = useState(false);
  const [isSavingBackupEmail, setIsSavingBackupEmail] = useState(false);
  const [isRemovingBackupEmail, setIsRemovingBackupEmail] = useState(false);
  const [backupEmailBannerMessage, setBackupEmailBannerMessage] = useState<string | null>(null);
  const [backupEmailBannerError, setBackupEmailBannerError] = useState<string | null>(null);
  const [showRemoveBackupConfirm, setShowRemoveBackupConfirm] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchAuthenticatedMe().then((me) => {
      if (cancelled) return;
      if (!me) {
        navigateAuthRoute('login', { onNavigateAuthRoute });
        return;
      }
      setUser(me);
      setBackupEmailInput(me.backup_email || '');
      setIsLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [onNavigateAuthRoute]);

  useEffect(() => {
    if (user?.backup_email !== undefined) {
      setBackupEmailInput(user.backup_email || '');
    }
  }, [user?.backup_email]);

  const validateBackupEmailDraft = useCallback(
    (input: string) => {
      const trimmed = input.trim();
      if (!trimmed) {
        setBackupEmailError('Enter a secondary recovery email address.');
        return null;
      }
      if (user && trimmed.toLowerCase() === user.email.toLowerCase()) {
        setBackupEmailError(
          'Backup recovery email cannot be identical to your primary account email.'
        );
        return null;
      }
      const parsed = backupEmailFormSchema.safeParse({ backup_email: trimmed });
      if (!parsed.success) {
        const msg = parsed.error.issues[0]?.message || 'Enter a valid email address.';
        setBackupEmailError(msg);
        return null;
      }
      setBackupEmailError(null);
      return parsed.data.backup_email;
    },
    [user]
  );

  const handleBackupEmailChange = useCallback(
    (nextValue: string) => {
      setBackupEmailInput(nextValue);
      setBackupEmailBannerError(null);
      if (backupEmailTouched) {
        validateBackupEmailDraft(nextValue);
      }
    },
    [backupEmailTouched, validateBackupEmailDraft]
  );

  const handleBackupEmailBlur = useCallback(() => {
    setBackupEmailTouched(true);
    validateBackupEmailDraft(backupEmailInput);
  }, [backupEmailInput, validateBackupEmailDraft]);

  const persistBackupEmail = useCallback(async () => {
    setBackupEmailBannerError(null);
    setBackupEmailBannerMessage(null);
    setBackupEmailTouched(true);

    const validEmail = validateBackupEmailDraft(backupEmailInput);
    if (!validEmail) return;

    setIsSavingBackupEmail(true);
    const res = await patchOververseCreatorProfile({
      backup_email: validEmail,
    });
    setIsSavingBackupEmail(false);

    if (!res.success || !res.user) {
      setBackupEmailBannerError(res.error || 'Could not save backup email.');
      return;
    }

    setUser(res.user);
    setBackupEmailInput(res.user.backup_email || validEmail);
    setShowRemoveBackupConfirm(false);
    setBackupEmailBannerMessage(
      `Secondary recovery email updated to ${res.user.backup_email || validEmail}. Emergency access alerts will be sent here.`
    );
  }, [backupEmailInput, validateBackupEmailDraft]);

  const handleSaveBackupEmail = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      await persistBackupEmail();
    },
    [persistBackupEmail]
  );

  const handleRemoveBackupEmail = useCallback(async () => {
    setBackupEmailBannerError(null);
    setBackupEmailBannerMessage(null);

    setIsRemovingBackupEmail(true);
    const res = await patchOververseCreatorProfile({
      backup_email: null,
    });
    setIsRemovingBackupEmail(false);

    if (!res.success || !res.user) {
      setBackupEmailBannerError(res.error || 'Could not remove backup email.');
      return;
    }

    setUser(res.user);
    setBackupEmailInput('');
    setBackupEmailTouched(false);
    setBackupEmailError(null);
    setShowRemoveBackupConfirm(false);
    setBackupEmailBannerMessage('Secondary recovery email address has been removed.');
  }, []);

  const handleUserUpdated = useCallback((nextUser: OververseAuthUser) => {
    setUser(nextUser);
    if (nextUser.backup_email !== undefined) {
      setBackupEmailInput(nextUser.backup_email || '');
    }
  }, []);

  const handleNavigateBackToCatalog = useCallback(() => {
    navigateHomeCatalog(onBackToCatalog);
  }, [onBackToCatalog]);

  const handleLogout = useCallback(async () => {
    await logoutOververseSession();
    navigateAuthRoute('login', { onNavigateAuthRoute });
  }, [onNavigateAuthRoute]);

  const handleOpenStudio = useCallback(() => {
    if (onOpenPublishingStudio) {
      onOpenPublishingStudio();
      return;
    }
    if (typeof window !== 'undefined') {
      window.history.pushState(null, '', '/creators');
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  }, [onOpenPublishingStudio]);

  const handleOpenUpload = useCallback(() => {
    if (onOpenUploadModal) {
      onOpenUploadModal();
      return;
    }
    handleOpenStudio();
  }, [onOpenUploadModal, handleOpenStudio]);

  const handleRequestRemoveBackupEmail = useCallback(() => {
    setShowRemoveBackupConfirm(true);
  }, []);

  const handleCancelRemoveBackupEmail = useCallback(() => {
    setShowRemoveBackupConfirm(false);
  }, []);

  const handleDismissBannerMessage = useCallback(() => {
    setBackupEmailBannerMessage(null);
  }, []);

  const handleDismissBannerError = useCallback(() => {
    setBackupEmailBannerError(null);
  }, []);

  const joinedDate = useMemo(() => {
    if (!user?.created_at) return '';
    return new Date(user.created_at).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }, [user?.created_at]);

  if (isLoading) {
    return (
      <AuthGroupLayout>
        <CreatorDashboardSkeleton />
      </AuthGroupLayout>
    );
  }

  if (!user) {
    return null;
  }

  const isCreatorOrAdmin = user.role === 'creator' || user.role === 'admin';
  const remainingRecoveryCodesCount =
    typeof user.totp_recovery_codes_remaining === 'number'
      ? user.totp_recovery_codes_remaining
      : 0;

  return (
    <AuthGroupLayout>
      <section className="mx-auto w-full max-w-5xl py-3 sm:py-6 space-y-6">
        <DashboardTopBar
          onBack={handleNavigateBackToCatalog}
          onLogout={handleLogout}
        />

        <CreatorIdentityHeader
          avatarUrl={user.avatar_url}
          penName={user.pen_name}
          role={user.role}
          totpEnabled={user.totp_enabled}
          email={user.email}
          studioName={user.studio_name}
          joinedDate={joinedDate}
          onOpenUpload={handleOpenUpload}
          onOpenStudio={handleOpenStudio}
        />

        {/* Real-time Chapter Reading Duration & Reader Engagement Statistics */}
        <CreatorChapterStatsCard />

        {/* Profile Form + Security & Session Details */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8 space-y-6">
            <CreatorProfileSettingsForm
              user={user}
              backupEmailInput={backupEmailInput}
              backupEmailError={backupEmailError}
              backupEmailTouched={backupEmailTouched}
              isSavingBackupEmail={isSavingBackupEmail}
              isRemovingBackupEmail={isRemovingBackupEmail}
              showRemoveBackupConfirm={showRemoveBackupConfirm}
              validateBackupEmailDraft={validateBackupEmailDraft}
              onBackupEmailChange={handleBackupEmailChange}
              onBackupEmailBlur={handleBackupEmailBlur}
              onQuickSaveBackupEmail={persistBackupEmail}
              onRequestRemoveBackupEmail={handleRequestRemoveBackupEmail}
              onConfirmRemoveBackupEmail={handleRemoveBackupEmail}
              onCancelRemoveBackupEmail={handleCancelRemoveBackupEmail}
              onUserUpdated={handleUserUpdated}
            />

            <BackupRecoveryEmailSection
              primaryEmail={user.email}
              emailVerified={user.email_verified}
              backupEmail={user.backup_email}
              backupEmailInput={backupEmailInput}
              backupEmailError={backupEmailError}
              backupEmailTouched={backupEmailTouched}
              isSavingBackupEmail={isSavingBackupEmail}
              isRemovingBackupEmail={isRemovingBackupEmail}
              backupEmailBannerMessage={backupEmailBannerMessage}
              backupEmailBannerError={backupEmailBannerError}
              showRemoveBackupConfirm={showRemoveBackupConfirm}
              onBackupEmailChange={handleBackupEmailChange}
              onBackupEmailBlur={handleBackupEmailBlur}
              onSaveBackupEmail={handleSaveBackupEmail}
              onDismissBannerMessage={handleDismissBannerMessage}
              onDismissBannerError={handleDismissBannerError}
              onRequestRemoveBackupEmail={handleRequestRemoveBackupEmail}
              onConfirmRemoveBackupEmail={handleRemoveBackupEmail}
              onCancelRemoveBackupEmail={handleCancelRemoveBackupEmail}
            />

            <TwoFactorSecuritySection
              userEmail={user.email}
              totpEnabled={user.totp_enabled}
              isCreatorOrAdmin={isCreatorOrAdmin}
              remainingRecoveryCodesCount={remainingRecoveryCodesCount}
              prefersReducedMotion={prefersReducedMotion}
              onUserUpdated={handleUserUpdated}
            />
          </div>

          <DashboardSessionSummary
            emailVerified={user.email_verified}
            backupEmail={user.backup_email}
            totpEnabled={user.totp_enabled}
            remainingRecoveryCodesCount={remainingRecoveryCodesCount}
            penName={user.pen_name}
            onExploreCatalog={handleNavigateBackToCatalog}
          />
        </div>
      </section>
    </AuthGroupLayout>
  );
}

export default CreatorDashboardPage;
