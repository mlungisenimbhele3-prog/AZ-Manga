'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  LifeBuoy,
  Loader2,
  Lock,
  Mail,
  RefreshCw,
} from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  loginOververseUser,
  resendOververseVerificationEmail,
  verifyOververseLoginTwoFactor,
} from '../../../services/oververseAuth';
import { AuthSplitFrame } from '../layout';
import {
  AuthRoutePath,
  LoginFormValues,
  extractZodFieldErrors,
  loginFormSchema,
  navigateAuthRoute,
  navigateToVerificationOrResetUrl,
  recoveryCodeFormSchema,
  resendVerificationFormSchema,
  totpCodeFormSchema,
} from '../schemas';

export interface LoginPageProps {
  onNavigateAuthRoute?: (route: AuthRoutePath, querySearch?: string) => void;
  onBackToHome?: () => void;
  onLoginSuccess?: () => void;
}

interface MfaChallengeState {
  mfaToken: string;
  email: string;
}

const STEP_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export function LoginPage({
  onNavigateAuthRoute,
  onBackToHome,
  onLoginSuccess,
}: LoginPageProps = {}) {
  const prefersReducedMotion = useReducedMotion();
  const totpInputRef = useRef<HTMLInputElement | null>(null);
  const emailInputRef = useRef<HTMLInputElement | null>(null);

  const [values, setValues] = useState<LoginFormValues>({
    email: '',
    password: '',
  });
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof LoginFormValues, string>>
  >({});
  const [touched, setTouched] = useState<
    Partial<Record<keyof LoginFormValues, boolean>>
  >({});
  const [showPassword, setShowPassword] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [needsEmailVerification, setNeedsEmailVerification] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendInfo, setResendInfo] = useState<string | null>(null);
  const [previewVerifyUrl, setPreviewVerifyUrl] = useState<string | null>(null);

  // Two-Factor Authentication (TOTP / Recovery Code) challenge & directional transition state
  const [mfaChallenge, setMfaChallenge] = useState<MfaChallengeState | null>(null);
  const [stepDirection, setStepDirection] = useState<1 | -1>(1);
  const [useRecoveryMode, setUseRecoveryMode] = useState(false);
  const [totpCode, setTotpCode] = useState('');
  const [totpFieldError, setTotpFieldError] = useState<string | null>(null);
  const [totpTouched, setTotpTouched] = useState(false);

  const isTotpStepActiveRef = useRef(false);
  isTotpStepActiveRef.current = Boolean(mfaChallenge);

  const focusTotpField = useCallback((selectExisting = false) => {
    const input = totpInputRef.current;
    if (!input || input.disabled) return;
    input.focus({ preventScroll: true });
    if (selectExisting && input.value.length > 0) {
      input.select();
    }
  }, []);

  const validateDraft = (nextValues: LoginFormValues) => {
    const parsed = loginFormSchema.safeParse(nextValues);
    if (parsed.success) {
      setFieldErrors({});
      return parsed.data;
    }
    setFieldErrors(extractZodFieldErrors(parsed.error));
    return null;
  };

  const handleFieldChange = <K extends keyof LoginFormValues>(
    field: K,
    value: LoginFormValues[K]
  ) => {
    const nextValues = { ...values, [field]: value };
    setValues(nextValues);
    setServerError(null);
    if (touched[field]) {
      validateDraft(nextValues);
    }
  };

  const handleBlur = (field: keyof LoginFormValues) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validateDraft(values);
  };

  const completeAuthenticatedSignIn = () => {
    if (onLoginSuccess) {
      onLoginSuccess();
      return;
    }
    navigateAuthRoute('dashboard', { onNavigateAuthRoute });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setServerError(null);
    setResendInfo(null);
    setPreviewVerifyUrl(null);
    setNeedsEmailVerification(false);

    setTouched({ email: true, password: true });
    const parsed = loginFormSchema.safeParse(values);
    if (!parsed.success) {
      setFieldErrors(extractZodFieldErrors(parsed.error));
      return;
    }
    setFieldErrors({});

    setIsSubmitting(true);
    const res = await loginOververseUser({
      email: parsed.data.email,
      password: parsed.data.password,
    });
    setIsSubmitting(false);

    if (res.requiresTwoFactor && res.mfaToken) {
      setStepDirection(1);
      setMfaChallenge({
        mfaToken: res.mfaToken,
        email: res.email || parsed.data.email,
      });
      setUseRecoveryMode(false);
      setTotpCode('');
      setTotpFieldError(null);
      setTotpTouched(false);
      setServerError(null);
      return;
    }

    if (!res.success) {
      if (res.code === 'EMAIL_NOT_VERIFIED') {
        setNeedsEmailVerification(true);
      }
      setServerError(res.error || 'Invalid email or password.');
      return;
    }

    completeAuthenticatedSignIn();
  };

  const validateCurrentSecondFactor = (candidateValue: string, recoveryMode: boolean) => {
    const activeSchema = recoveryMode ? recoveryCodeFormSchema : totpCodeFormSchema;
    return activeSchema.safeParse({ code: candidateValue });
  };

  const handleTotpCodeChange = (rawValue: string) => {
    let formattedValue: string;
    if (useRecoveryMode) {
      const alnum = rawValue.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
      formattedValue = alnum.length > 4 ? `${alnum.slice(0, 4)}-${alnum.slice(4)}` : alnum;
    } else {
      formattedValue = rawValue.replace(/\D/g, '').slice(0, 6);
    }

    setTotpCode(formattedValue);
    setServerError(null);

    if (totpTouched) {
      const parsed = validateCurrentSecondFactor(formattedValue, useRecoveryMode);
      setTotpFieldError(
        parsed.success ? null : parsed.error.issues[0]?.message || 'Enter a valid code.'
      );
    }
  };

  const handleToggleRecoveryMode = () => {
    const nextMode = !useRecoveryMode;
    setUseRecoveryMode(nextMode);
    setTotpCode('');
    setTotpFieldError(null);
    setTotpTouched(false);
    setServerError(null);
    requestAnimationFrame(() => {
      totpInputRef.current?.focus({ preventScroll: true });
    });
  };

  const handleTotpSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!mfaChallenge) return;

    setServerError(null);
    setTotpTouched(true);

    const parsed = validateCurrentSecondFactor(totpCode, useRecoveryMode);
    if (!parsed.success) {
      setTotpFieldError(
        parsed.error.issues[0]?.message ||
          (useRecoveryMode
            ? 'Enter an 8-character recovery code (XXXX-XXXX).'
            : 'Enter the 6-digit numeric code from your authenticator app.')
      );
      return;
    }
    setTotpFieldError(null);

    setIsSubmitting(true);
    const res = await verifyOververseLoginTwoFactor({
      mfaToken: mfaChallenge.mfaToken,
      code: parsed.data.code,
    });
    setIsSubmitting(false);

    if (!res.success) {
      if (res.code === 'MFA_CHALLENGE_EXPIRED') {
        setStepDirection(-1);
        setMfaChallenge(null);
        setUseRecoveryMode(false);
        setTotpCode('');
        setServerError(
          res.error || 'Two-Factor challenge expired. Please sign in with your password again.'
        );
        return;
      }
      setServerError(
        res.error ||
          (useRecoveryMode
            ? 'Invalid or already-used recovery code.'
            : 'Invalid 6-digit authenticator code.')
      );
      setTimeout(() => {
        focusTotpField(true);
      }, 0);
      return;
    }

    completeAuthenticatedSignIn();
  };

  const handleBackToPasswordStep = () => {
    setStepDirection(-1);
    setMfaChallenge(null);
    setUseRecoveryMode(false);
    setTotpCode('');
    setTotpFieldError(null);
    setTotpTouched(false);
    setServerError(null);
  };

  const handleResendVerification = async () => {
    setResendInfo(null);
    setPreviewVerifyUrl(null);

    const parsedEmail = resendVerificationFormSchema.safeParse({ email: values.email });
    if (!parsedEmail.success) {
      setTouched((prev) => ({ ...prev, email: true }));
      setFieldErrors((prev) => ({
        ...prev,
        email: parsedEmail.error.issues[0]?.message || 'Enter a valid email address.',
      }));
      return;
    }

    setIsResending(true);
    const res = await resendOververseVerificationEmail(parsedEmail.data.email);
    setIsResending(false);

    if (!res.success) {
      setServerError(res.error || 'Could not resend verification email.');
      return;
    }

    setResendInfo(res.message || 'Verification email sent. Check your inbox.');
    if (res.previewVerificationUrl) {
      setPreviewVerifyUrl(res.previewVerificationUrl);
    }
  };

  const slideOffset = prefersReducedMotion ? 0 : 28;
  const stepTransitionDuration = prefersReducedMotion ? 0.12 : 0.28;

  // Deterministic fallback focus after exit + enter transition completes
  useEffect(() => {
    if (!mfaChallenge) return;
    const totalTransitionMs = Math.ceil(stepTransitionDuration * 2 * 1000) + 40;
    const timer = window.setTimeout(() => {
      if (
        isTotpStepActiveRef.current &&
        typeof document !== 'undefined' &&
        document.activeElement !== totpInputRef.current
      ) {
        focusTotpField(false);
      }
    }, totalTransitionMs);

    return () => window.clearTimeout(timer);
  }, [mfaChallenge, stepTransitionDuration, focusTotpField]);

  const stepVariants = {
    enter: (direction: 1 | -1) => ({
      opacity: 0,
      x: direction * slideOffset,
    }),
    center: {
      opacity: 1,
      x: 0,
    },
    exit: (direction: 1 | -1) => ({
      opacity: 0,
      x: direction * -slideOffset,
    }),
  };

  const isTotpStep = Boolean(mfaChallenge);

  return (
    <AuthSplitFrame
      kicker={isTotpStep ? 'Creator Two-Factor Verification' : 'Creator & Reader Sign In'}
      title={
        isTotpStep
          ? useRecoveryMode
            ? 'Enter a Recovery Code'
            : 'Enter Your Authenticator Code'
          : 'Welcome Back to AZ OVERVERSE'
      }
      subtitle={
        isTotpStep
          ? useRecoveryMode
            ? 'Enter one of the 8-character one-time recovery codes you saved when setting up Two-Factor Authentication.'
            : 'Two-Factor Authentication is active on this creator account. Enter the 6-digit TOTP code generated by your authenticator app to complete sign-in.'
          : 'Sign in with your verified email and password to access your Creator Dashboard, publish chapters, and manage your series.'
      }
      onBackToHome={onBackToHome}
    >
      <div className="space-y-5">
        {/* Step Progress Indicator */}
        <nav
          aria-label="Sign-in steps"
          className="grid grid-cols-2 gap-4 border-b border-slate-800/80"
        >
          <div className="relative pb-3">
            {isTotpStep ? (
              <button
                type="button"
                onClick={handleBackToPasswordStep}
                className="group w-full text-left flex items-center gap-2 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition"
              >
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">01. Password Verified</span>
              </button>
            ) : (
              <div className="flex items-center gap-2 text-xs font-semibold text-white">
                <span className="font-mono text-amber-400 tabular-nums">01.</span>
                <span className="truncate">Account Credentials</span>
              </div>
            )}

            {!isTotpStep && (
              <motion.div
                layoutId="login-step-active-bar"
                transition={{
                  duration: prefersReducedMotion ? 0.1 : 0.26,
                  ease: STEP_EASE,
                }}
                className="absolute inset-x-0 -bottom-px h-0.5 bg-amber-500"
              />
            )}
          </div>

          <div className="relative pb-3">
            <div
              className={`flex items-center gap-2 text-xs font-semibold transition-colors ${
                isTotpStep ? 'text-white' : 'text-slate-500'
              }`}
            >
              <span
                className={`font-mono tabular-nums ${
                  isTotpStep ? 'text-amber-400' : 'text-slate-600'
                }`}
              >
                02.
              </span>
              <span className="truncate">
                {isTotpStep
                  ? useRecoveryMode
                    ? 'Recovery Code'
                    : 'Authenticator Code'
                  : '2FA Verification'}
              </span>
            </div>

            {isTotpStep && (
              <motion.div
                layoutId="login-step-active-bar"
                transition={{
                  duration: prefersReducedMotion ? 0.1 : 0.26,
                  ease: STEP_EASE,
                }}
                className="absolute inset-x-0 -bottom-px h-0.5 bg-amber-500"
              />
            )}
          </div>
        </nav>

        {/* Directional Animated Step Container */}
        <div className="relative overflow-hidden">
          <AnimatePresence mode="wait" initial={false} custom={stepDirection}>
            {mfaChallenge ? (
              <motion.form
                key="login-step-totp"
                custom={stepDirection}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  duration: stepTransitionDuration,
                  ease: STEP_EASE,
                }}
                onAnimationComplete={() => {
                  if (isTotpStepActiveRef.current) {
                    focusTotpField(false);
                  }
                }}
                onSubmit={handleTotpSubmit}
                noValidate
                className="space-y-5"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-lg font-bold text-white">
                      {useRecoveryMode ? 'One-Time Recovery Code' : 'Two-Factor Authentication'}
                    </h2>
                    <button
                      type="button"
                      onClick={handleBackToPasswordStep}
                      className="inline-flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-amber-400 transition"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Use different account</span>
                    </button>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Password verified for{' '}
                    <span className="text-slate-200 font-medium">{mfaChallenge.email}</span>.{' '}
                    {useRecoveryMode
                      ? 'Enter an unused 8-character recovery code (XXXX-XXXX). Each recovery code works once.'
                      : 'Open your authenticator app and enter the current 6-digit code to finish signing in.'}
                  </p>
                </div>

                {serverError && (
                  <motion.div
                    initial={{ opacity: 0, y: prefersReducedMotion ? 0 : -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.18 }}
                    role="alert"
                    className="rounded-xl border border-rose-500/40 bg-rose-950/30 p-3.5 flex items-start gap-2.5 text-xs text-rose-200"
                  >
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <span>{serverError}</span>
                  </motion.div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      htmlFor="login-totp-code"
                      className="block text-xs font-semibold text-slate-200"
                    >
                      {useRecoveryMode
                        ? '8-Character Recovery Code'
                        : '6-Digit Authenticator Code'}
                    </label>
                    <span className="font-mono text-[11px] text-slate-400 tabular-nums">
                      {useRecoveryMode
                        ? `${totpCode.replace(/-/g, '').length}/8 chars`
                        : `${totpCode.length}/6 digits`}
                    </span>
                  </div>
                  <div className="relative">
                    {useRecoveryMode ? (
                      <LifeBuoy className="w-4 h-4 text-amber-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    ) : (
                      <KeyRound className="w-4 h-4 text-amber-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    )}
                    <input
                      ref={totpInputRef}
                      id="login-totp-code"
                      name="code"
                      type="text"
                      inputMode={useRecoveryMode ? 'text' : 'numeric'}
                      pattern={useRecoveryMode ? undefined : '[0-9]*'}
                      autoComplete="one-time-code"
                      maxLength={useRecoveryMode ? 9 : 6}
                      disabled={isSubmitting}
                      value={totpCode}
                      onChange={(e) => handleTotpCodeChange(e.target.value)}
                      onBlur={() => {
                        setTotpTouched(true);
                        const parsed = validateCurrentSecondFactor(totpCode, useRecoveryMode);
                        setTotpFieldError(
                          parsed.success
                            ? null
                            : parsed.error.issues[0]?.message || 'Enter a valid code.'
                        );
                      }}
                      aria-invalid={Boolean(totpTouched && totpFieldError)}
                      aria-describedby={
                        totpTouched && totpFieldError ? 'login-totp-code-error' : undefined
                      }
                      placeholder={useRecoveryMode ? 'XXXX-XXXX' : '000000'}
                      className={`min-h-[52px] w-full rounded-xl border bg-slate-900/90 pl-10 pr-4 py-3 text-center font-mono text-xl ${
                        useRecoveryMode ? 'tracking-[0.22em]' : 'tracking-[0.35em]'
                      } tabular-nums text-white placeholder:text-slate-600 disabled:opacity-70 focus:outline-none transition ${
                        totpTouched && totpFieldError
                          ? 'border-rose-500/70 focus:border-rose-400'
                          : 'border-slate-800 focus:border-amber-500'
                      }`}
                    />
                  </div>
                  {totpTouched && totpFieldError && (
                    <p id="login-totp-code-error" className="mt-1.5 text-xs text-rose-300">
                      {totpFieldError}
                    </p>
                  )}

                  <div className="mt-2.5 flex justify-end">
                    <button
                      id="login-2fa-toggle-recovery-btn"
                      type="button"
                      disabled={isSubmitting}
                      onClick={handleToggleRecoveryMode}
                      className="text-xs font-medium text-slate-400 hover:text-amber-400 transition"
                    >
                      {useRecoveryMode
                        ? 'Use 6-digit authenticator app code instead'
                        : 'Lost authenticator device? Use a recovery code'}
                    </button>
                  </div>
                </div>

                {/* 6-Digit TOTP Verification Button with Spinner + Handshake Progress Bar */}
                <button
                  id="login-2fa-submit-btn"
                  type="submit"
                  disabled={isSubmitting}
                  aria-busy={isSubmitting}
                  className="relative overflow-hidden min-h-[50px] w-full rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-90 disabled:cursor-wait text-slate-950 font-bold text-sm px-5 py-3 transition flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                      <span>Authenticating Code...</span>
                    </>
                  ) : (
                    <>
                      <span>
                        {useRecoveryMode ? 'Verify Recovery Code' : 'Verify 6-Digit Code'}
                      </span>
                      <ArrowRight className="w-4 h-4 shrink-0" />
                    </>
                  )}

                  {isSubmitting && (
                    <span
                      role="progressbar"
                      aria-label="Verifying two-factor authentication code"
                      className="absolute inset-x-0 bottom-0 h-1 bg-slate-950/20 overflow-hidden"
                    >
                      <motion.span
                        initial={{ x: '-100%' }}
                        animate={
                          prefersReducedMotion
                            ? { x: '0%', opacity: [0.45, 0.9, 0.45] }
                            : { x: ['-100%', '200%'] }
                        }
                        transition={{
                          duration: prefersReducedMotion ? 1.1 : 0.95,
                          repeat: Infinity,
                          ease: 'easeInOut',
                        }}
                        className={`block h-full ${
                          prefersReducedMotion ? 'w-full' : 'w-1/2'
                        } bg-slate-950/80`}
                      />
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleBackToPasswordStep}
                  className="min-h-[44px] w-full rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-slate-300 hover:text-white text-xs font-semibold px-4 py-2.5 transition"
                >
                  Back to Email &amp; Password
                </button>
              </motion.form>
            ) : (
              <motion.form
                key="login-step-credentials"
                custom={stepDirection}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  duration: stepTransitionDuration,
                  ease: STEP_EASE,
                }}
                onAnimationComplete={() => {
                  if (!isTotpStepActiveRef.current && stepDirection === -1) {
                    emailInputRef.current?.focus({ preventScroll: true });
                  }
                }}
                onSubmit={handleSubmit}
                noValidate
                className="space-y-4"
              >
                <div className="flex items-center justify-between gap-2 pb-1">
                  <h2 className="text-lg font-bold text-white">Sign In</h2>
                  <button
                    type="button"
                    onClick={() => navigateAuthRoute('forgot', { onNavigateAuthRoute })}
                    className="text-xs font-medium text-slate-400 hover:text-amber-400 transition"
                  >
                    Forgot password?
                  </button>
                </div>

                {serverError && (
                  <motion.div
                    initial={{ opacity: 0, y: prefersReducedMotion ? 0 : -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.18 }}
                    role="alert"
                    className="rounded-xl border border-rose-500/40 bg-rose-950/30 p-3.5 space-y-2.5 text-xs text-rose-200"
                  >
                    <div className="flex items-start gap-2.5">
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      <span>{serverError}</span>
                    </div>

                    {needsEmailVerification && (
                      <div className="pt-2 border-t border-rose-500/20 flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-slate-300">Need a fresh verification link?</span>
                        <button
                          type="button"
                          disabled={isResending}
                          onClick={handleResendVerification}
                          className="min-h-[36px] inline-flex items-center gap-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 px-3 py-1.5 text-xs font-semibold text-amber-400 transition"
                        >
                          <RefreshCw
                            className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`}
                          />
                          <span>{isResending ? 'Sending...' : 'Resend Verification'}</span>
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}

                {resendInfo && (
                  <div className="rounded-xl border border-emerald-500/35 bg-emerald-950/25 p-4 space-y-2.5 text-xs text-emerald-200">
                    <div className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{resendInfo}</span>
                    </div>

                    {previewVerifyUrl && (
                      <button
                        type="button"
                        onClick={() =>
                          navigateToVerificationOrResetUrl(previewVerifyUrl, onNavigateAuthRoute)
                        }
                        className="min-h-[42px] w-full rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs px-4 py-2 transition flex items-center justify-center gap-2"
                      >
                        <span>Open Verification Link</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}

                {/* Email */}
                <div>
                  <label
                    htmlFor="login-email"
                    className="block text-xs font-semibold text-slate-200 mb-1.5"
                  >
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      ref={emailInputRef}
                      id="login-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      value={values.email}
                      onChange={(e) => handleFieldChange('email', e.target.value)}
                      onBlur={() => handleBlur('email')}
                      aria-invalid={Boolean(touched.email && fieldErrors.email)}
                      aria-describedby={
                        touched.email && fieldErrors.email ? 'login-email-error' : undefined
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
                    <p id="login-email-error" className="mt-1.5 text-xs text-rose-300">
                      {fieldErrors.email}
                    </p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <label
                    htmlFor="login-password"
                    className="block text-xs font-semibold text-slate-200 mb-1.5"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="login-password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      value={values.password}
                      onChange={(e) => handleFieldChange('password', e.target.value)}
                      onBlur={() => handleBlur('password')}
                      aria-invalid={Boolean(touched.password && fieldErrors.password)}
                      aria-describedby={
                        touched.password && fieldErrors.password
                          ? 'login-password-error'
                          : undefined
                      }
                      placeholder="Enter your password"
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
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {touched.password && fieldErrors.password && (
                    <p id="login-password-error" className="mt-1.5 text-xs text-rose-300">
                      {fieldErrors.password}
                    </p>
                  )}
                </div>

                <button
                  id="login-submit-btn"
                  type="submit"
                  disabled={isSubmitting}
                  className="min-h-[48px] w-full rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-slate-950 font-bold text-sm px-5 py-3 transition flex items-center justify-center gap-2"
                >
                  <span>{isSubmitting ? 'Signing In...' : 'Sign In'}</span>
                  {!isSubmitting && <ArrowRight className="w-4 h-4" />}
                </button>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2 text-xs text-slate-400">
                  <span>New to AZ OVERVERSE?</span>
                  <button
                    type="button"
                    onClick={() => navigateAuthRoute('register', { onNavigateAuthRoute })}
                    className="min-h-[36px] font-semibold text-amber-400 hover:text-amber-300 transition"
                  >
                    Create Account →
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>
    </AuthSplitFrame>
  );
}

export default LoginPage;
