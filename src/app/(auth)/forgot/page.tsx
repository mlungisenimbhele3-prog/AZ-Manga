'use client';

import React, { useState } from 'react';
import { CheckCircle2, AlertCircle, Mail, ArrowRight } from 'lucide-react';
import { requestOverversePasswordReset } from '../../../services/oververseAuth';
import { AuthSplitFrame } from '../layout';
import {
  AuthRoutePath,
  forgotPasswordFormSchema,
  extractZodFieldErrors,
  navigateAuthRoute,
  navigateToVerificationOrResetUrl,
} from '../schemas';

export interface ForgotPasswordPageProps {
  onNavigateAuthRoute?: (route: AuthRoutePath, querySearch?: string) => void;
  onBackToHome?: () => void;
}

export function ForgotPasswordPage({
  onNavigateAuthRoute,
  onBackToHome,
}: ForgotPasswordPageProps = {}) {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [sentMessage, setSentMessage] = useState<string | null>(null);
  const [previewResetUrl, setPreviewResetUrl] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setEmailError(null);
    setServerError(null);
    setSentMessage(null);
    setPreviewResetUrl(null);

    const parsed = forgotPasswordFormSchema.safeParse({ email });
    if (!parsed.success) {
      const errs = extractZodFieldErrors(parsed.error);
      setEmailError(errs.email || 'Enter a valid email address.');
      return;
    }

    setIsSubmitting(true);
    const res = await requestOverversePasswordReset(parsed.data.email);
    setIsSubmitting(false);

    if (!res.success) {
      setServerError(res.error || 'Could not process password reset request.');
      return;
    }

    setSentMessage(
      res.message || 'If an account exists for that email, a password reset link has been sent.'
    );
    if (res.previewResetUrl) {
      setPreviewResetUrl(res.previewResetUrl);
    }
  };

  return (
    <AuthSplitFrame
      kicker="Account Recovery"
      title="Reset Your Password"
      subtitle="Enter your registered email address and we will send a 1-hour password recovery link."
      onBackToHome={onBackToHome}
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <h2 className="text-lg font-bold text-white">Forgot Password</h2>

        {serverError && (
          <div
            role="alert"
            className="rounded-xl border border-rose-500/40 bg-rose-950/30 p-3.5 flex items-start gap-2.5 text-xs text-rose-200"
          >
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{serverError}</span>
          </div>
        )}

        {sentMessage && (
          <div className="rounded-xl border border-emerald-500/35 bg-emerald-950/25 p-4 space-y-3 text-xs text-emerald-200">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{sentMessage}</span>
            </div>
            {previewResetUrl && (
              <button
                type="button"
                onClick={() =>
                  navigateToVerificationOrResetUrl(previewResetUrl, onNavigateAuthRoute)
                }
                className="min-h-[42px] w-full rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs px-4 py-2 transition flex items-center justify-center gap-2"
              >
                <span>Open Password Reset Link</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        <div>
          <label
            htmlFor="forgot-email"
            className="block text-xs font-semibold text-slate-200 mb-1.5"
          >
            Email Address
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="forgot-email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailError) setEmailError(null);
              }}
              aria-invalid={Boolean(emailError)}
              placeholder="creator@studio.com"
              className={`min-h-[46px] w-full rounded-xl border bg-slate-900/90 pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none transition ${
                emailError
                  ? 'border-rose-500/70 focus:border-rose-400'
                  : 'border-slate-800 focus:border-amber-500'
              }`}
            />
          </div>
          {emailError && <p className="mt-1.5 text-xs text-rose-300">{emailError}</p>}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="min-h-[48px] w-full rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-slate-950 font-bold text-sm px-5 py-3 transition"
        >
          {isSubmitting ? 'Sending Reset Link...' : 'Send Reset Link'}
        </button>

        <div className="pt-3 border-t border-slate-800/80 text-right text-xs">
          <button
            type="button"
            onClick={() => navigateAuthRoute('login', { onNavigateAuthRoute })}
            className="font-semibold text-amber-400 hover:text-amber-300 transition"
          >
            Back to Sign In →
          </button>
        </div>
      </form>
    </AuthSplitFrame>
  );
}

export default ForgotPasswordPage;
