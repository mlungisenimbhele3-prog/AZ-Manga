'use client';

import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Mail,
  Lock,
  PenTool,
  ArrowRight,
} from 'lucide-react';
import { registerOververseUser } from '../../../services/oververseAuth';
import { PasswordStrengthIndicator } from '../../../components/common/PasswordStrengthIndicator';
import { AuthSplitFrame } from '../layout';
import {
  AuthRoutePath,
  RegisterFormValues,
  registerFormSchema,
  extractZodFieldErrors,
  navigateAuthRoute,
  navigateLegalRoute,
  navigateToVerificationOrResetUrl,
} from '../schemas';

export interface RegisterPageProps {
  onNavigateAuthRoute?: (route: AuthRoutePath, querySearch?: string) => void;
  onBackToHome?: () => void;
  onNavigateToTerms?: () => void;
  onNavigateToPrivacy?: () => void;
}

export function RegisterPage({
  onNavigateAuthRoute,
  onBackToHome,
  onNavigateToTerms,
  onNavigateToPrivacy,
}: RegisterPageProps = {}) {
  const [values, setValues] = useState<RegisterFormValues>({
    pen_name: '',
    email: '',
    role: 'creator',
    password: '',
    confirmPassword: '',
    agreeToTerms: false,
  });
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof RegisterFormValues, string>>
  >({});
  const [touched, setTouched] = useState<
    Partial<Record<keyof RegisterFormValues, boolean>>
  >({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [registeredMessage, setRegisteredMessage] = useState<string | null>(null);
  const [previewVerifyUrl, setPreviewVerifyUrl] = useState<string | null>(null);

  const validateDraft = (nextValues: RegisterFormValues) => {
    const parsed = registerFormSchema.safeParse(nextValues);
    if (parsed.success) {
      setFieldErrors({});
      return parsed.data;
    }
    setFieldErrors(extractZodFieldErrors(parsed.error));
    return null;
  };

  const handleFieldChange = <K extends keyof RegisterFormValues>(
    field: K,
    value: RegisterFormValues[K]
  ) => {
    const nextValues = { ...values, [field]: value };
    setValues(nextValues);
    setServerError(null);
    if (touched[field]) {
      validateDraft(nextValues);
    }
  };

  const handleBlur = (field: keyof RegisterFormValues) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validateDraft(values);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setServerError(null);
    setRegisteredMessage(null);
    setPreviewVerifyUrl(null);

    setTouched({
      pen_name: true,
      email: true,
      role: true,
      password: true,
      confirmPassword: true,
      agreeToTerms: true,
    });

    const parsed = registerFormSchema.safeParse(values);
    if (!parsed.success) {
      setFieldErrors(extractZodFieldErrors(parsed.error));
      return;
    }
    setFieldErrors({});

    setIsSubmitting(true);
    const res = await registerOververseUser({
      email: parsed.data.email,
      pen_name: parsed.data.pen_name,
      password: parsed.data.password,
      confirmPassword: parsed.data.confirmPassword,
      role: parsed.data.role,
    });
    setIsSubmitting(false);

    if (!res.success) {
      console.error('[Register Error Details]', res.error);
      setServerError(res.error || 'Could not create your account. Please try again.');
      return;
    }

    setRegisteredMessage(
      res.message || 'Account created. Check your inbox for your verification link.'
    );
    if (res.previewVerificationUrl) {
      setPreviewVerifyUrl(res.previewVerificationUrl);
    }
  };

  return (
    <AuthSplitFrame
      kicker="Creator & Reader Registration"
      title="Create Your AZ OVERVERSE Account"
      subtitle="Register your official creator pen name or reader profile to publish series, follow releases, and access your Creator Dashboard."
      onBackToHome={onBackToHome}
    >
      {registeredMessage ? (
        <div className="space-y-6">
          <div className="rounded-xl border border-emerald-500/35 bg-emerald-950/25 p-5 space-y-3">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h2 className="text-base font-bold text-white">Verify Your Email Address</h2>
                <p className="text-xs text-slate-300 leading-relaxed">{registeredMessage}</p>
                <p className="text-xs text-slate-400">
                  Sent to <span className="text-white font-medium">{values.email}</span>
                  <span aria-hidden="true"> · </span>
                  Valid for 24 hours
                </p>
              </div>
            </div>

            {previewVerifyUrl && (
              <div className="pt-3 border-t border-emerald-500/20 space-y-2.5">
                <p className="text-xs text-slate-300">
                  Instant verification preview link (active when transactional email key is not configured):
                </p>
                <button
                  id="register-instant-verify-btn"
                  type="button"
                  onClick={() =>
                    navigateToVerificationOrResetUrl(previewVerifyUrl, onNavigateAuthRoute)
                  }
                  className="min-h-[44px] w-full rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm px-4 py-2.5 transition flex items-center justify-center gap-2"
                >
                  <span>Verify Email Now</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-3 pt-1 text-xs">
            <button
              type="button"
              onClick={() => {
                setRegisteredMessage(null);
                setPreviewVerifyUrl(null);
              }}
              className="min-h-[44px] px-3 text-slate-400 hover:text-white font-medium transition"
            >
              Edit registration details
            </button>

            <button
              type="button"
              onClick={() =>
                navigateAuthRoute('login', { onNavigateAuthRoute })
              }
              className="min-h-[44px] px-4 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-white font-semibold transition"
            >
              Continue to Sign In →
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div className="flex items-center justify-between gap-3 pb-1 flex-wrap">
            <h2 className="text-lg font-bold text-white">Register Account</h2>

            <div
              role="group"
              aria-label="Select account role"
              className="inline-flex rounded-xl border border-slate-800 bg-slate-900 p-1"
            >
              <button
                type="button"
                onClick={() => handleFieldChange('role', 'creator')}
                className={`min-h-[36px] px-3.5 py-1 rounded-lg text-xs font-semibold transition ${
                  values.role === 'creator'
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Creator
              </button>
              <button
                type="button"
                onClick={() => handleFieldChange('role', 'reader')}
                className={`min-h-[36px] px-3.5 py-1 rounded-lg text-xs font-semibold transition ${
                  values.role === 'reader'
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Reader
              </button>
            </div>
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

          {/* Pen Name */}
          <div>
            <label
              htmlFor="register-pen-name"
              className="block text-xs font-semibold text-slate-200 mb-1.5"
            >
              Pen Name (Creator Nickname)
            </label>
            <div className="relative">
              <PenTool className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="register-pen-name"
                name="pen_name"
                type="text"
                autoComplete="nickname"
                value={values.pen_name}
                onChange={(e) => handleFieldChange('pen_name', e.target.value)}
                onBlur={() => handleBlur('pen_name')}
                aria-invalid={Boolean(touched.pen_name && fieldErrors.pen_name)}
                aria-describedby={
                  touched.pen_name && fieldErrors.pen_name ? 'register-pen-name-error' : undefined
                }
                placeholder="e.g. Mlungiseni"
                className={`min-h-[46px] w-full rounded-xl border bg-slate-900/90 pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none transition ${
                  touched.pen_name && fieldErrors.pen_name
                    ? 'border-rose-500/70 focus:border-rose-400'
                    : 'border-slate-800 focus:border-amber-500'
                }`}
              />
            </div>
            {touched.pen_name && fieldErrors.pen_name && (
              <p id="register-pen-name-error" className="mt-1.5 text-xs text-rose-300">
                {fieldErrors.pen_name}
              </p>
            )}
          </div>

          {/* Email */}
          <div>
            <label
              htmlFor="register-email"
              className="block text-xs font-semibold text-slate-200 mb-1.5"
            >
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="register-email"
                name="email"
                type="email"
                autoComplete="email"
                value={values.email}
                onChange={(e) => handleFieldChange('email', e.target.value)}
                onBlur={() => handleBlur('email')}
                aria-invalid={Boolean(touched.email && fieldErrors.email)}
                aria-describedby={
                  touched.email && fieldErrors.email ? 'register-email-error' : undefined
                }
                placeholder="creator@studio.com"
                className={`min-h-[46px] w-full rounded-xl border bg-slate-900/90 pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none transition ${
                  touched.email && fieldErrors.email
                    ? 'border-rose-500/70 focus:border-rose-400'
                    : 'border-slate-800 focus:border-amber-500'
                }`}
              />
            </div>
            {touched.email && fieldErrors.email && (
              <p id="register-email-error" className="mt-1.5 text-xs text-rose-300">
                {fieldErrors.email}
              </p>
            )}
          </div>

          {/* Password & Confirm Password */}
          <div className="space-y-4">
            <div>
              <label
                htmlFor="register-password"
                className="block text-xs font-semibold text-slate-200 mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="register-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={values.password}
                  onChange={(e) => handleFieldChange('password', e.target.value)}
                  onBlur={() => handleBlur('password')}
                  aria-invalid={Boolean(touched.password && fieldErrors.password)}
                  aria-describedby={
                    touched.password && fieldErrors.password
                      ? 'register-password-error register-password-strength'
                      : 'register-password-strength'
                  }
                  placeholder="Min. 8 chars (upper, number & special char)"
                  className={`min-h-[46px] w-full rounded-xl border bg-slate-900/90 pl-10 pr-10 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none transition ${
                    touched.password && fieldErrors.password
                      ? 'border-rose-500/70 focus:border-rose-400'
                      : 'border-slate-800 focus:border-amber-500'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-white transition"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {touched.password && fieldErrors.password && (
                <p id="register-password-error" className="mt-1.5 text-xs text-rose-300">
                  {fieldErrors.password}
                </p>
              )}
              <PasswordStrengthIndicator
                password={values.password}
                id="register-password-strength"
              />
            </div>

            <div>
              <label
                htmlFor="register-confirm-password"
                className="block text-xs font-semibold text-slate-200 mb-1.5"
              >
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="register-confirm-password"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={values.confirmPassword}
                  onChange={(e) => handleFieldChange('confirmPassword', e.target.value)}
                  onBlur={() => handleBlur('confirmPassword')}
                  aria-invalid={Boolean(touched.confirmPassword && fieldErrors.confirmPassword)}
                  aria-describedby={
                    touched.confirmPassword && fieldErrors.confirmPassword
                      ? 'register-confirm-password-error'
                      : undefined
                  }
                  placeholder="Re-enter password"
                  className={`min-h-[46px] w-full rounded-xl border bg-slate-900/90 pl-10 pr-10 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none transition ${
                    touched.confirmPassword && fieldErrors.confirmPassword
                      ? 'border-rose-500/70 focus:border-rose-400'
                      : 'border-slate-800 focus:border-amber-500'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-white transition"
                  aria-label={
                    showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {touched.confirmPassword && fieldErrors.confirmPassword && (
                <p id="register-confirm-password-error" className="mt-1.5 text-xs text-rose-300">
                  {fieldErrors.confirmPassword}
                </p>
              )}
            </div>
          </div>

          {/* Terms of Service & Privacy Policy Agreement */}
          <div className="pt-1">
            <div className="flex items-start gap-3 py-1">
              <input
                id="register-agree-terms"
                name="agreeToTerms"
                type="checkbox"
                required
                aria-required="true"
                checked={values.agreeToTerms}
                onChange={(e) => handleFieldChange('agreeToTerms', e.target.checked)}
                onBlur={() => handleBlur('agreeToTerms')}
                aria-invalid={Boolean(touched.agreeToTerms && fieldErrors.agreeToTerms)}
                aria-describedby={
                  touched.agreeToTerms && fieldErrors.agreeToTerms
                    ? 'register-agree-terms-error'
                    : undefined
                }
                className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-slate-600 bg-slate-900 text-amber-500 accent-amber-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
              />
              <label
                htmlFor="register-agree-terms"
                className="cursor-pointer select-none text-xs leading-relaxed text-slate-300"
              >
                I agree to the{' '}
                <a
                  href="/terms"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    navigateLegalRoute('terms', onNavigateToTerms);
                  }}
                  className="font-semibold text-amber-400 underline decoration-amber-400/50 underline-offset-2 hover:text-amber-300 hover:decoration-amber-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-sm transition-colors"
                >
                  Terms of Service
                </a>{' '}
                and{' '}
                <a
                  href="/privacy"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    navigateLegalRoute('privacy', onNavigateToPrivacy);
                  }}
                  className="font-semibold text-amber-400 underline decoration-amber-400/50 underline-offset-2 hover:text-amber-300 hover:decoration-amber-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-sm transition-colors"
                >
                  Privacy Policy
                </a>
              </label>
            </div>
            {touched.agreeToTerms && fieldErrors.agreeToTerms && (
              <p id="register-agree-terms-error" className="mt-1 text-xs text-rose-300">
                {fieldErrors.agreeToTerms}
              </p>
            )}
          </div>

          <button
            id="register-submit-btn"
            type="submit"
            disabled={isSubmitting || !values.agreeToTerms}
            className="min-h-[48px] w-full rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-amber-500 text-slate-950 font-bold text-sm px-5 py-3 transition-colors duration-150 flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
          >
            <span>{isSubmitting ? 'Creating Account...' : 'Create Account'}</span>
            {!isSubmitting && <ArrowRight className="w-4 h-4" />}
          </button>

          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2 text-xs text-slate-400">
            <span>Already have an AZ OVERVERSE account?</span>
            <button
              type="button"
              onClick={() => navigateAuthRoute('login', { onNavigateAuthRoute })}
              className="min-h-[36px] font-semibold text-amber-400 hover:text-amber-300 transition"
            >
              Sign In →
            </button>
          </div>
        </form>
      )}
    </AuthSplitFrame>
  );
}

export default RegisterPage;
