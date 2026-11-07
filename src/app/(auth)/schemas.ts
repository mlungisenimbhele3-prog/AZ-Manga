import { z } from 'zod';

export type AuthRoutePath =
  | 'register'
  | 'login'
  | 'verify'
  | 'forgot'
  | 'reset'
  | 'dashboard';

export type LegalRoutePath = 'terms' | 'privacy';

/**
 * Zod schema for /register form inputs
 */
export const registerFormSchema = z
  .object({
    pen_name: z
      .string()
      .trim()
      .min(2, 'Pen name must be at least 2 characters.')
      .max(60, 'Pen name must be 60 characters or fewer.')
      .regex(
        /^[a-zA-Z0-9 _.'-]+$/,
        'Pen name may only contain letters, numbers, spaces, and basic punctuation.'
      ),
    email: z
      .string()
      .trim()
      .min(1, 'Email address is required.')
      .toLowerCase()
      .email('Enter a valid email address.'),
    role: z.enum(['creator', 'reader']),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters.')
      .max(128, 'Password must be 128 characters or fewer.')
      .regex(/[A-Za-z]/, 'Password must include at least one letter.')
      .regex(/[0-9]/, 'Password must include at least one number.'),
    confirmPassword: z.string().min(1, 'Please confirm your password.'),
    agreeToTerms: z.boolean().refine((val) => val === true, {
      message: 'You must agree to the Terms of Service and Privacy Policy.',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match.',
  });

export type RegisterFormValues = z.infer<typeof registerFormSchema>;

/**
 * Zod schema for /login form inputs
 */
export const loginFormSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email address is required.')
    .toLowerCase()
    .email('Enter a valid email address.'),
  password: z
    .string()
    .min(1, 'Password is required.')
    .max(128, 'Password is too long.'),
});

export type LoginFormValues = z.infer<typeof loginFormSchema>;

/**
 * Zod schemas for /verify token & resend verification email form inputs
 */
export const verifyTokenSchema = z.object({
  token: z
    .string()
    .trim()
    .min(16, 'Enter a valid verification token.')
    .max(2048, 'Verification token is invalid.'),
});

export const resendVerificationFormSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email address is required.')
    .toLowerCase()
    .email('Enter a valid email address.'),
});

export type VerifyTokenValues = z.infer<typeof verifyTokenSchema>;
export type ResendVerificationValues = z.infer<typeof resendVerificationFormSchema>;

/**
 * Zod schema for /dashboard creator profile form inputs
 */
export const dashboardProfileFormSchema = z.object({
  pen_name: z
    .string()
    .trim()
    .min(2, 'Pen name must be at least 2 characters.')
    .max(60, 'Pen name must be 60 characters or fewer.'),
  studio_name: z
    .string()
    .trim()
    .min(2, 'Studio name must be at least 2 characters.')
    .max(80, 'Studio name must be 80 characters or fewer.'),
  role: z.enum(['creator', 'reader']),
  bio: z
    .string()
    .trim()
    .max(500, 'Biography must be 500 characters or fewer.'),
});

export type DashboardProfileFormValues = z.infer<typeof dashboardProfileFormSchema>;

/**
 * Zod schema for secondary backup recovery email configuration
 */
export const backupEmailFormSchema = z.object({
  backup_email: z
    .string()
    .trim()
    .min(1, 'Secondary recovery email is required.')
    .toLowerCase()
    .email('Enter a valid email address (e.g. author.recovery@example.com).')
    .max(120, 'Email address must be 120 characters or fewer.'),
});

export type BackupEmailFormValues = z.infer<typeof backupEmailFormSchema>;

/**
 * Zod schemas for /forgot and /reset password forms
 */
export const forgotPasswordFormSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email address is required.')
    .toLowerCase()
    .email('Enter a valid email address.'),
});

export const resetPasswordFormSchema = z
  .object({
    token: z.string().trim().min(16, 'Missing or invalid password reset token.'),
    password: z
      .string()
      .min(8, 'New password must be at least 8 characters.')
      .max(128, 'Password must be 128 characters or fewer.')
      .regex(/[A-Za-z]/, 'Password must include at least one letter.')
      .regex(/[0-9]/, 'Password must include at least one number.'),
    confirmPassword: z.string().min(1, 'Please confirm your new password.'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match.',
  });

/**
 * Zod schemas for Two-Factor Authentication (TOTP 6-digit authenticator code)
 */
export const totpCodeFormSchema = z.object({
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, 'Enter the 6-digit numeric code from your authenticator app.'),
});

export type TotpCodeFormValues = z.infer<typeof totpCodeFormSchema>;

export const recoveryCodeFormSchema = z.object({
  code: z
    .string()
    .trim()
    .regex(
      /^[A-Za-z0-9]{4}-?[A-Za-z0-9]{4}$/,
      'Enter an 8-character recovery code (for example, K9P4-M7W2).'
    ),
});

export type RecoveryCodeFormValues = z.infer<typeof recoveryCodeFormSchema>;

export const disableTwoFactorFormSchema = z.object({
  password: z
    .string()
    .min(1, 'Current password is required to disable Two-Factor Authentication.')
    .max(128, 'Password is too long.'),
  code: z
    .string()
    .trim()
    .refine(
      (val) => /^\d{6}$/.test(val) || /^[A-Za-z0-9]{4}-?[A-Za-z0-9]{4}$/.test(val),
      'Enter a 6-digit authenticator code or an 8-character recovery code (XXXX-XXXX).'
    ),
});

export type DisableTwoFactorFormValues = z.infer<typeof disableTwoFactorFormSchema>;

/**
 * Converts a ZodError into a flat field -> first error message dictionary
 */
export function extractZodFieldErrors<T extends Record<string, unknown>>(
  error: z.ZodError<T>
): Partial<Record<keyof T, string>> {
  const fieldErrors: Partial<Record<keyof T, string>> = {};
  for (const issue of error.issues) {
    const key = issue.path[0] as keyof T | undefined;
    if (key && !fieldErrors[key]) {
      fieldErrors[key] = issue.message;
    }
  }
  return fieldErrors;
}

/**
 * Universal route navigator supporting both standalone URL pushState and parent callback routing
 */
export function navigateAuthRoute(
  route: AuthRoutePath,
  options?: {
    querySearch?: string;
    onNavigateAuthRoute?: (route: AuthRoutePath, querySearch?: string) => void;
  }
): void {
  if (options?.onNavigateAuthRoute) {
    options.onNavigateAuthRoute(route, options.querySearch);
    return;
  }
  if (typeof window !== 'undefined') {
    const suffix = options?.querySearch
      ? options.querySearch.startsWith('?')
        ? options.querySearch
        : `?${options.querySearch}`
      : '';
    try {
      window.history.pushState(null, '', `/${route}${suffix}`);
      window.dispatchEvent(new PopStateEvent('popstate'));
    } catch {
      window.location.href = `/${route}${suffix}`;
    }
  }
}

export function navigateHomeCatalog(onBack?: () => void): void {
  if (onBack) {
    onBack();
    return;
  }
  if (typeof window !== 'undefined') {
    try {
      window.history.pushState(null, '', '/');
      window.dispatchEvent(new PopStateEvent('popstate'));
    } catch {
      window.location.href = '/';
    }
  }
}

export function navigateLegalRoute(
  route: LegalRoutePath,
  onNavigate?: () => void
): void {
  if (onNavigate) {
    onNavigate();
    return;
  }
  if (typeof window !== 'undefined') {
    try {
      window.history.pushState(null, '', `/${route}`);
      window.dispatchEvent(new PopStateEvent('popstate'));
    } catch {
      window.location.hash = route;
    }
  }
}

export function navigateToVerificationOrResetUrl(
  previewUrl: string,
  onNavigateAuthRoute?: (route: AuthRoutePath, querySearch?: string) => void
): void {
  if (typeof window === 'undefined') return;
  try {
    const parsed = new URL(previewUrl, window.location.origin);
    const path = parsed.pathname.replace(/^\//, '').toLowerCase();
    if (path === 'verify' || path === 'reset') {
      navigateAuthRoute(path, {
        querySearch: parsed.search,
        onNavigateAuthRoute,
      });
      return;
    }
  } catch {
    // Fallback below
  }
  window.location.href = previewUrl;
}
