'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  CheckCircle2,
  AlertCircle,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Copy,
} from 'lucide-react';
import { confirmOverversePasswordReset } from '../../../services/oververseAuth';
import {
  PasswordStrengthIndicator,
  evaluatePasswordStrength,
} from '../../../components/common/PasswordStrengthIndicator';
import { AuthSplitFrame } from '../layout';
import {
  AuthRoutePath,
  resetPasswordFormSchema,
  extractZodFieldErrors,
  navigateAuthRoute,
} from '../schemas';

export interface ResetPasswordPageProps {
  searchParams?: { token?: string };
  onNavigateAuthRoute?: (route: AuthRoutePath, querySearch?: string) => void;
  onBackToHome?: () => void;
}

function readResetTokenFromUrl(propToken?: string): string {
  if (propToken && propToken.trim()) return propToken.trim();
  if (typeof window === 'undefined') return '';
  const sp = new URLSearchParams(window.location.search);
  const queryToken = sp.get('token');
  if (queryToken && queryToken.trim()) return queryToken.trim();

  const hashQueryIndex = window.location.hash.indexOf('?');
  if (hashQueryIndex >= 0) {
    const hashParams = new URLSearchParams(window.location.hash.slice(hashQueryIndex));
    const hashToken = hashParams.get('token');
    if (hashToken && hashToken.trim()) return hashToken.trim();
  }
  return '';
}

function buildResetUrl(currentToken: string): string {
  const trimmedToken = currentToken.trim();
  if (typeof window === 'undefined') {
    return trimmedToken
      ? `/reset?token=${encodeURIComponent(trimmedToken)}`
      : '/reset';
  }
  const origin = window.location.origin;
  if (trimmedToken) {
    return `${origin}/reset?token=${encodeURIComponent(trimmedToken)}`;
  }
  const path = window.location.pathname.toLowerCase();
  if (path.endsWith('/reset') || path === 'reset') {
    return window.location.href;
  }
  return `${origin}/reset`;
}

async function copyTextToClipboard(text: string): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall back to document.execCommand('copy') when iframe clipboard policy restricts async API
    }
  }

  if (typeof document === 'undefined') return false;
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.className = 'fixed -top-96 -left-96 opacity-0 pointer-events-none';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    textarea.setSelectionRange(0, text.length);
    const copied = document.execCommand('copy');
    document.body.removeChild(textarea);
    return copied;
  } catch {
    return false;
  }
}

export function ResetPasswordPage({
  searchParams,
  onNavigateAuthRoute,
  onBackToHome,
}: ResetPasswordPageProps = {}) {
  const urlToken = readResetTokenFromUrl(searchParams?.token);
  const [token, setToken] = useState<string>(() => urlToken);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'error'>('idle');
  const copyResetTimerRef = useRef<number | null>(null);

  const [fieldErrors, setFieldErrors] = useState<{
    token?: string;
    password?: string;
    confirmPassword?: string;
  }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [resetDone, setResetDone] = useState(false);

  useEffect(() => {
    const nextToken = readResetTokenFromUrl(searchParams?.token);
    if (nextToken) {
      setToken(nextToken);
    }
  }, [searchParams?.token]);

  useEffect(() => {
    return () => {
      if (copyResetTimerRef.current !== null) {
        window.clearTimeout(copyResetTimerRef.current);
      }
    };
  }, []);

  const passwordStrength = useMemo(() => evaluatePasswordStrength(password), [password]);

  const isNewPasswordValid =
    password.length > 0 &&
    passwordStrength.meetsMinimumRequirements &&
    !passwordStrength.exceedsMaxLength;

  const isConfirmPasswordValid =
    confirmPassword.length > 0 &&
    isNewPasswordValid &&
    confirmPassword === password;

  const showLiveConfirmMismatch =
    !fieldErrors.confirmPassword &&
    confirmPassword.length > 0 &&
    password.length > 0 &&
    confirmPassword.length >= password.length &&
    confirmPassword !== password;

  const handleCopyResetLink = async () => {
    if (copyResetTimerRef.current !== null) {
      window.clearTimeout(copyResetTimerRef.current);
      copyResetTimerRef.current = null;
    }

    const resetUrl = buildResetUrl(token);
    const ok = await copyTextToClipboard(resetUrl);

    if (ok) {
      setCopyStatus('copied');
      copyResetTimerRef.current = window.setTimeout(() => {
        setCopyStatus('idle');
        copyResetTimerRef.current = null;
      }, 2500);
    } else {
      setCopyStatus('error');
      copyResetTimerRef.current = window.setTimeout(() => {
        setCopyStatus('idle');
        copyResetTimerRef.current = null;
      }, 3500);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setServerError(null);

    const parsed = resetPasswordFormSchema.safeParse({
      token,
      password,
      confirmPassword,
    });
    if (!parsed.success) {
      setFieldErrors(extractZodFieldErrors(parsed.error));
      return;
    }
    setFieldErrors({});

    setIsSubmitting(true);
    const res = await confirmOverversePasswordReset({
      token: parsed.data.token,
      password: parsed.data.password,
      confirmPassword: parsed.data.confirmPassword,
    });
    setIsSubmitting(false);

    if (!res.success) {
      setServerError(res.error || 'Could not reset password.');
      return;
    }

    setResetDone(true);
  };

  return (
    <AuthSplitFrame
      kicker="Choose New Password"
      title="Update Account Password"
      subtitle="Set a strong new password for your AZ OVERVERSE account."
      onBackToHome={onBackToHome}
    >
      {resetDone ? (
        <div className="space-y-5">
          <div className="rounded-xl border border-emerald-500/35 bg-emerald-950/25 p-5 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h2 className="text-base font-bold text-white">Password Updated</h2>
              <p className="text-xs text-slate-300">
                Your password has been updated. Sign in with your new credentials.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigateAuthRoute('login', { onNavigateAuthRoute })}
            className="min-h-[48px] w-full rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm px-5 py-3 transition flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
          >
            <span>Sign In Now</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h2 className="text-lg font-bold text-white">Set New Password</h2>
          </div>

          {/* Direct Reset URL Copy Fallback in case email/browser auto-redirect fails */}
          <div className="rounded-xl border border-slate-800/90 bg-slate-900/55 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="min-w-0 space-y-0.5">
              <p className="text-xs font-semibold text-slate-200">
                Direct Recovery URL
              </p>
              <p
                aria-live="polite"
                className={`text-[11px] leading-snug ${
                  copyStatus === 'copied'
                    ? 'text-emerald-300'
                    : copyStatus === 'error'
                    ? 'text-rose-300'
                    : 'text-slate-400'
                }`}
              >
                {copyStatus === 'copied'
                  ? 'Reset URL copied to clipboard. Paste it into your browser if auto-redirect failed.'
                  : copyStatus === 'error'
                  ? 'Clipboard access unavailable. Please copy the reset URL from your address bar.'
                  : 'Copy your reset URL to open directly in your browser if auto-redirect fails.'}
              </p>
            </div>

            <button
              id="copy-reset-link-btn"
              type="button"
              onClick={handleCopyResetLink}
              aria-label="Copy Reset Link"
              className={`min-h-[44px] shrink-0 inline-flex items-center justify-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-semibold whitespace-nowrap transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
                copyStatus === 'copied'
                  ? 'border-emerald-500/50 bg-emerald-950/40 text-emerald-300'
                  : 'border-slate-700 bg-slate-900 hover:bg-slate-800 hover:border-amber-500/50 text-slate-100'
              }`}
            >
              {copyStatus === 'copied' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" aria-hidden="true" />
                  <span>Reset Link Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-amber-400 shrink-0" aria-hidden="true" />
                  <span>Copy Reset Link</span>
                </>
              )}
            </button>
          </div>

          {serverError && (
            <div
              role="alert"
              className="rounded-xl border border-rose-500/40 bg-rose-950/30 p-3.5 flex items-start gap-2.5 text-xs text-rose-200"
            >
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{serverError}</span>
            </div>
          )}

          {!urlToken && (
            <div>
              <label
                htmlFor="reset-token"
                className="block text-xs font-semibold text-slate-200 mb-1.5"
              >
                Reset Token
              </label>
              <input
                id="reset-token"
                type="text"
                value={token}
                onChange={(e) => {
                  setToken(e.target.value);
                  if (fieldErrors.token) {
                    setFieldErrors((prev) => ({ ...prev, token: undefined }));
                  }
                }}
                placeholder="Paste reset token"
                className="min-h-[46px] w-full rounded-xl border border-slate-800 bg-slate-900/90 px-3.5 py-2.5 text-sm text-white font-mono focus:border-amber-500 focus:outline-none"
              />
              {fieldErrors.token && (
                <p className="mt-1.5 text-xs text-rose-300">{fieldErrors.token}</p>
              )}
            </div>
          )}

          {/* New Password */}
          <div>
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <label
                htmlFor="reset-new-password"
                className="block text-xs font-semibold text-slate-200"
              >
                New Password
              </label>
              {isNewPasswordValid && !fieldErrors.password && (
                <span
                  id="reset-new-password-criteria-met"
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400"
                >
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" aria-hidden="true" />
                  <span>Criteria met</span>
                </span>
              )}
            </div>

            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="reset-new-password"
                name="password"
                type={showNewPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={password}
                onChange={(e) => {
                  const nextPassword = e.target.value;
                  setPassword(nextPassword);
                  if (fieldErrors.password) {
                    setFieldErrors((prev) => ({ ...prev, password: undefined }));
                  }
                  if (fieldErrors.confirmPassword && confirmPassword === nextPassword) {
                    setFieldErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                  }
                }}
                aria-invalid={Boolean(fieldErrors.password)}
                aria-describedby={
                  fieldErrors.password
                    ? 'reset-password-error reset-password-strength'
                    : 'reset-password-strength'
                }
                placeholder="Min. 8 chars (letter + number)"
                className={`min-h-[46px] w-full rounded-xl border bg-slate-900/90 pl-10 ${
                  isNewPasswordValid && !fieldErrors.password ? 'pr-20' : 'pr-12'
                } py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none transition ${
                  fieldErrors.password
                    ? 'border-rose-500/70 focus:border-rose-400'
                    : isNewPasswordValid
                    ? 'border-emerald-500/55 focus:border-emerald-400'
                    : 'border-slate-800 focus:border-amber-500'
                }`}
              />

              <div className="absolute inset-y-0 right-1 flex items-center gap-0.5">
                {isNewPasswordValid && !fieldErrors.password && (
                  <span
                    id="reset-new-password-valid-indicator"
                    role="status"
                    aria-label="New password meets strength criteria"
                    title="New password meets strength criteria"
                    className="inline-flex h-7 w-7 items-center justify-center text-emerald-400 pointer-events-none"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" aria-hidden="true" />
                  </span>
                )}
                <button
                  id="reset-toggle-new-password"
                  type="button"
                  onClick={() => setShowNewPassword((prev) => !prev)}
                  className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-slate-400 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 transition-colors"
                  aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}
                  aria-pressed={showNewPassword}
                  aria-controls="reset-new-password"
                >
                  {showNewPassword ? (
                    <EyeOff className="w-4 h-4" aria-hidden="true" />
                  ) : (
                    <Eye className="w-4 h-4" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            {fieldErrors.password && (
              <p id="reset-password-error" className="mt-1.5 text-xs text-rose-300">
                {fieldErrors.password}
              </p>
            )}
            <PasswordStrengthIndicator
              password={password}
              id="reset-password-strength"
            />
          </div>

          {/* Confirm New Password */}
          <div>
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <label
                htmlFor="reset-confirm-password"
                className="block text-xs font-semibold text-slate-200"
              >
                Confirm New Password
              </label>
              {isConfirmPasswordValid && !fieldErrors.confirmPassword && (
                <span
                  id="reset-confirm-password-criteria-met"
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400"
                >
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" aria-hidden="true" />
                  <span>Passwords match</span>
                </span>
              )}
            </div>

            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="reset-confirm-password"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (fieldErrors.confirmPassword) {
                    setFieldErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                  }
                }}
                aria-invalid={Boolean(fieldErrors.confirmPassword || showLiveConfirmMismatch)}
                aria-describedby={
                  fieldErrors.confirmPassword
                    ? 'reset-confirm-password-error'
                    : showLiveConfirmMismatch
                    ? 'reset-confirm-password-mismatch'
                    : undefined
                }
                placeholder="Re-enter new password"
                className={`min-h-[46px] w-full rounded-xl border bg-slate-900/90 pl-10 ${
                  isConfirmPasswordValid && !fieldErrors.confirmPassword ? 'pr-20' : 'pr-12'
                } py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none transition ${
                  fieldErrors.confirmPassword || showLiveConfirmMismatch
                    ? 'border-rose-500/70 focus:border-rose-400'
                    : isConfirmPasswordValid
                    ? 'border-emerald-500/55 focus:border-emerald-400'
                    : 'border-slate-800 focus:border-amber-500'
                }`}
              />

              <div className="absolute inset-y-0 right-1 flex items-center gap-0.5">
                {isConfirmPasswordValid && !fieldErrors.confirmPassword && (
                  <span
                    id="reset-confirm-password-valid-indicator"
                    role="status"
                    aria-label="Confirmed password matches and meets strength criteria"
                    title="Confirmed password matches and meets strength criteria"
                    className="inline-flex h-7 w-7 items-center justify-center text-emerald-400 pointer-events-none"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" aria-hidden="true" />
                  </span>
                )}
                <button
                  id="reset-toggle-confirm-password"
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-slate-400 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 transition-colors"
                  aria-label={
                    showConfirmPassword ? 'Hide confirm new password' : 'Show confirm new password'
                  }
                  aria-pressed={showConfirmPassword}
                  aria-controls="reset-confirm-password"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4" aria-hidden="true" />
                  ) : (
                    <Eye className="w-4 h-4" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            {fieldErrors.confirmPassword && (
              <p id="reset-confirm-password-error" className="mt-1.5 text-xs text-rose-300">
                {fieldErrors.confirmPassword}
              </p>
            )}
            {showLiveConfirmMismatch && (
              <p id="reset-confirm-password-mismatch" className="mt-1.5 text-xs text-rose-300">
                Passwords do not match.
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="min-h-[48px] w-full rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-slate-950 font-bold text-sm px-5 py-3 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
          >
            {isSubmitting ? 'Updating Password...' : 'Save New Password'}
          </button>

          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2 text-xs text-slate-400">
            <button
              type="button"
              onClick={() => navigateAuthRoute('forgot', { onNavigateAuthRoute })}
              className="min-h-[44px] inline-flex items-center font-medium text-slate-400 hover:text-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-lg px-1"
            >
              Request new link
            </button>
            <button
              type="button"
              onClick={() => navigateAuthRoute('login', { onNavigateAuthRoute })}
              className="min-h-[44px] inline-flex items-center font-semibold text-amber-400 hover:text-amber-300 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-lg px-1"
            >
              Back to Sign In →
            </button>
          </div>
        </form>
      )}
    </AuthSplitFrame>
  );
}

export default ResetPasswordPage;
