'use client';

import React, { useState } from 'react';
import { CheckCircle2, AlertCircle, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { confirmOverversePasswordReset } from '../../../services/oververseAuth';
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
  return (sp.get('token') || '').trim();
}

export function ResetPasswordPage({
  searchParams,
  onNavigateAuthRoute,
  onBackToHome,
}: ResetPasswordPageProps = {}) {
  const [token, setToken] = useState<string>(() => readResetTokenFromUrl(searchParams?.token));
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [fieldErrors, setFieldErrors] = useState<{
    token?: string;
    password?: string;
    confirmPassword?: string;
  }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [resetDone, setResetDone] = useState(false);

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
            className="min-h-[48px] w-full rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm px-5 py-3 transition flex items-center justify-center gap-2"
          >
            <span>Sign In Now</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <h2 className="text-lg font-bold text-white">Set New Password</h2>

          {serverError && (
            <div
              role="alert"
              className="rounded-xl border border-rose-500/40 bg-rose-950/30 p-3.5 flex items-start gap-2.5 text-xs text-rose-200"
            >
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{serverError}</span>
            </div>
          )}

          {!readResetTokenFromUrl(searchParams?.token) && (
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
                onChange={(e) => setToken(e.target.value)}
                placeholder="Paste reset token"
                className="min-h-[46px] w-full rounded-xl border border-slate-800 bg-slate-900/90 px-3.5 py-2.5 text-sm text-white font-mono focus:border-amber-500 focus:outline-none"
              />
              {fieldErrors.token && (
                <p className="mt-1.5 text-xs text-rose-300">{fieldErrors.token}</p>
              )}
            </div>
          )}

          <div>
            <label
              htmlFor="reset-new-password"
              className="block text-xs font-semibold text-slate-200 mb-1.5"
            >
              New Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="reset-new-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 8 chars (letter + number)"
                className={`min-h-[46px] w-full rounded-xl border bg-slate-900/90 pl-10 pr-10 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none transition ${
                  fieldErrors.password
                    ? 'border-rose-500/70 focus:border-rose-400'
                    : 'border-slate-800 focus:border-amber-500'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-white transition"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {fieldErrors.password && (
              <p className="mt-1.5 text-xs text-rose-300">{fieldErrors.password}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="reset-confirm-password"
              className="block text-xs font-semibold text-slate-200 mb-1.5"
            >
              Confirm New Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="reset-confirm-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className={`min-h-[46px] w-full rounded-xl border bg-slate-900/90 pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none transition ${
                  fieldErrors.confirmPassword
                    ? 'border-rose-500/70 focus:border-rose-400'
                    : 'border-slate-800 focus:border-amber-500'
                }`}
              />
            </div>
            {fieldErrors.confirmPassword && (
              <p className="mt-1.5 text-xs text-rose-300">{fieldErrors.confirmPassword}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="min-h-[48px] w-full rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-slate-950 font-bold text-sm px-5 py-3 transition"
          >
            {isSubmitting ? 'Updating Password...' : 'Save New Password'}
          </button>
        </form>
      )}
    </AuthSplitFrame>
  );
}

export default ResetPasswordPage;
