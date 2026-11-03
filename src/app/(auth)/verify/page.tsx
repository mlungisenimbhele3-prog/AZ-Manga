'use client';

import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Mail,
  KeyRound,
  RefreshCw,
} from 'lucide-react';
import {
  verifyOververseEmail,
  resendOververseVerificationEmail,
} from '../../../services/oververseAuth';
import { AuthSplitFrame } from '../layout';
import {
  AuthRoutePath,
  verifyTokenSchema,
  resendVerificationFormSchema,
  extractZodFieldErrors,
  navigateAuthRoute,
  navigateToVerificationOrResetUrl,
} from '../schemas';

export interface VerifyEmailPageProps {
  searchParams?: { token?: string };
  onNavigateAuthRoute?: (route: AuthRoutePath, querySearch?: string) => void;
  onBackToHome?: () => void;
}

function readTokenFromUrl(propToken?: string): string {
  if (propToken && propToken.trim()) return propToken.trim();
  if (typeof window === 'undefined') return '';
  const searchParams = new URLSearchParams(window.location.search);
  const queryToken = searchParams.get('token');
  if (queryToken) return queryToken.trim();

  const hashQueryIndex = window.location.hash.indexOf('?');
  if (hashQueryIndex >= 0) {
    const hashParams = new URLSearchParams(window.location.hash.slice(hashQueryIndex));
    return (hashParams.get('token') || '').trim();
  }
  return '';
}

export function VerifyEmailPage({
  searchParams,
  onNavigateAuthRoute,
  onBackToHome,
}: VerifyEmailPageProps = {}) {
  const [status, setStatus] = useState<'idle' | 'verifying' | 'verified' | 'error'>(() =>
    readTokenFromUrl(searchParams?.token) ? 'verifying' : 'idle'
  );
  const [statusMessage, setStatusMessage] = useState<string>('Verifying your email...');
  const [verifiedEmail, setVerifiedEmail] = useState<string | null>(null);

  // Manual token form (Zod-validated)
  const [manualToken, setManualToken] = useState<string>('');
  const [tokenError, setTokenError] = useState<string | null>(null);

  // Resend verification email form (Zod-validated)
  const [resendEmail, setResendEmail] = useState<string>('');
  const [resendEmailError, setResendEmailError] = useState<string | null>(null);
  const [isResending, setIsResending] = useState<boolean>(false);
  const [resendNotice, setResendNotice] = useState<string | null>(null);
  const [previewVerifyUrl, setPreviewVerifyUrl] = useState<string | null>(null);

  const runVerification = async (rawToken: string) => {
    const parsed = verifyTokenSchema.safeParse({ token: rawToken });
    if (!parsed.success) {
      setStatus('error');
      setStatusMessage(parsed.error.issues[0]?.message || 'Invalid verification token.');
      return;
    }

    setStatus('verifying');
    setStatusMessage('Verifying your email...');
    const res = await verifyOververseEmail(parsed.data.token);
    if (!res.success) {
      setStatus('error');
      setStatusMessage(res.error || 'Verification link is invalid or has expired.');
      return;
    }

    setStatus('verified');
    setStatusMessage('Email verified');
    setVerifiedEmail(res.user?.email || null);
  };

  useEffect(() => {
    const initialToken = readTokenFromUrl(searchParams?.token);
    if (initialToken) {
      void runVerification(initialToken);
    }
  }, [searchParams?.token]);

  const handleManualTokenSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setTokenError(null);
    const parsed = verifyTokenSchema.safeParse({ token: manualToken });
    if (!parsed.success) {
      const errs = extractZodFieldErrors(parsed.error);
      setTokenError(errs.token || 'Enter a valid verification token.');
      return;
    }
    await runVerification(parsed.data.token);
  };

  const handleResendSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setResendEmailError(null);
    setResendNotice(null);
    setPreviewVerifyUrl(null);

    const parsed = resendVerificationFormSchema.safeParse({ email: resendEmail });
    if (!parsed.success) {
      const errs = extractZodFieldErrors(parsed.error);
      setResendEmailError(errs.email || 'Enter a valid email address.');
      return;
    }

    setIsResending(true);
    const res = await resendOververseVerificationEmail(parsed.data.email);
    setIsResending(false);

    if (!res.success) {
      setResendEmailError(res.error || 'Could not resend verification email.');
      return;
    }

    setResendNotice(res.message || 'Verification link sent. Check your email inbox.');
    if (res.previewVerificationUrl) {
      setPreviewVerifyUrl(res.previewVerificationUrl);
    }
  };

  return (
    <AuthSplitFrame
      kicker="Account Verification"
      title="Email Confirmation"
      subtitle="Verify your email address to activate your AZ OVERVERSE creator pen name and sign in to your dashboard."
      onBackToHome={onBackToHome}
    >
      <div className="space-y-6">
        {status === 'verifying' && (
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-6 flex items-center gap-4">
            <div className="h-7 w-7 rounded-full border-2 border-amber-500/30 border-t-amber-400 animate-spin shrink-0" />
            <div>
              <h2 className="text-base font-bold text-white">Verifying Token</h2>
              <p className="text-xs text-slate-400 mt-0.5">{statusMessage}</p>
            </div>
          </div>
        )}

        {status === 'verified' && (
          <div className="space-y-5">
            <div className="rounded-xl border border-emerald-500/35 bg-emerald-950/25 p-6 space-y-2">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                <h2 id="verify-success-heading" className="text-xl font-bold text-white">
                  Email verified
                </h2>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {verifiedEmail
                  ? `Your account (${verifiedEmail}) is now active. Sign in to open your Creator Dashboard.`
                  : 'Your email address has been confirmed. You can now sign in to your account.'}
              </p>
            </div>

            <button
              id="verify-proceed-login-btn"
              type="button"
              onClick={() => navigateAuthRoute('login', { onNavigateAuthRoute })}
              className="min-h-[48px] w-full rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm px-5 py-3 transition flex items-center justify-center gap-2"
            >
              <span>Continue to Sign In</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {(status === 'idle' || status === 'error') && (
          <div className="space-y-6">
            {status === 'error' && (
              <div
                role="alert"
                className="rounded-xl border border-rose-500/40 bg-rose-950/30 p-4 flex items-start gap-2.5 text-xs text-rose-200"
              >
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{statusMessage}</span>
              </div>
            )}

            {/* Manual Token Verification Form (Zod-validated) */}
            <form onSubmit={handleManualTokenSubmit} noValidate className="space-y-3">
              <h2 className="text-base font-bold text-white">Paste Verification Token</h2>
              <div>
                <label
                  htmlFor="verify-token-input"
                  className="block text-xs font-semibold text-slate-200 mb-1.5"
                >
                  Verification Token
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="verify-token-input"
                    name="token"
                    type="text"
                    value={manualToken}
                    onChange={(e) => {
                      setManualToken(e.target.value);
                      if (tokenError) setTokenError(null);
                    }}
                    aria-invalid={Boolean(tokenError)}
                    placeholder="Paste token from verification email"
                    className={`min-h-[46px] w-full rounded-xl border bg-slate-900/90 pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none transition font-mono ${
                      tokenError
                        ? 'border-rose-500/70 focus:border-rose-400'
                        : 'border-slate-800 focus:border-amber-500'
                    }`}
                  />
                </div>
                {tokenError && <p className="mt-1.5 text-xs text-rose-300">{tokenError}</p>}
              </div>

              <button
                type="submit"
                className="min-h-[46px] w-full rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm px-4 py-2.5 transition"
              >
                Verify Token
              </button>
            </form>

            {/* Resend Verification Link Form (Zod-validated) */}
            <div className="pt-5 border-t border-slate-800/80">
              <form onSubmit={handleResendSubmit} noValidate className="space-y-3">
                <h3 className="text-sm font-bold text-slate-100">
                  Request a New Verification Link
                </h3>
                <div>
                  <label
                    htmlFor="verify-resend-email"
                    className="block text-xs font-semibold text-slate-300 mb-1.5"
                  >
                    Account Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="verify-resend-email"
                      name="email"
                      type="email"
                      value={resendEmail}
                      onChange={(e) => {
                        setResendEmail(e.target.value);
                        if (resendEmailError) setResendEmailError(null);
                      }}
                      aria-invalid={Boolean(resendEmailError)}
                      placeholder="creator@studio.com"
                      className={`min-h-[44px] w-full rounded-xl border bg-slate-900/90 pl-10 pr-4 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none transition ${
                        resendEmailError
                          ? 'border-rose-500/70 focus:border-rose-400'
                          : 'border-slate-800 focus:border-amber-500'
                      }`}
                    />
                  </div>
                  {resendEmailError && (
                    <p className="mt-1.5 text-xs text-rose-300">{resendEmailError}</p>
                  )}
                </div>

                {resendNotice && (
                  <div className="rounded-xl border border-emerald-500/35 bg-emerald-950/25 p-3.5 space-y-2 text-xs text-emerald-200">
                    <p>{resendNotice}</p>
                    {previewVerifyUrl && (
                      <button
                        type="button"
                        onClick={() =>
                          navigateToVerificationOrResetUrl(previewVerifyUrl, onNavigateAuthRoute)
                        }
                        className="min-h-[40px] w-full rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs px-3 py-2 transition"
                      >
                        Verify Email Now →
                      </button>
                    )}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isResending}
                  className="min-h-[44px] w-full rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-slate-100 font-semibold text-xs px-4 py-2.5 transition flex items-center justify-center gap-2"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`} />
                  <span>{isResending ? 'Sending Link...' : 'Send Verification Email'}</span>
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </AuthSplitFrame>
  );
}

export default VerifyEmailPage;
