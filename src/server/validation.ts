import { z } from 'zod';

export const totpSixDigitCodeSchema = z
  .string()
  .trim()
  .regex(/^\d{6}$/, 'Enter a valid 6-digit authenticator code.');

export const registerInputSchema = z
  .object({
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email('Enter a valid email address.'),
    pen_name: z
      .string()
      .trim()
      .min(2, 'Pen name must be at least 2 characters.')
      .max(60, 'Pen name must be 60 characters or fewer.')
      .regex(/^[^<>]+$/, 'Pen name contains invalid characters.'),
    studio_name: z
      .string()
      .trim()
      .max(80, 'Studio name must be 80 characters or fewer.')
      .optional(),
    bio: z
      .string()
      .trim()
      .max(500, 'Bio must be 500 characters or fewer.')
      .optional(),
    role: z.enum(['reader', 'creator']).optional().default('creator'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters long.')
      .max(128, 'Password must be 128 characters or fewer.')
      .regex(/[A-Z]/, 'Password must include at least one uppercase letter.')
      .regex(/[0-9]/, 'Password must include at least one number.')
      .regex(/[^A-Za-z0-9]/, 'Password must include at least one special character.'),
    confirmPassword: z.string().optional(),
  })
  .refine(
    (data) =>
      data.confirmPassword === undefined || data.password === data.confirmPassword,
    {
      message: 'Passwords do not match.',
      path: ['confirmPassword'],
    }
  );

export const loginInputSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Enter a valid email address.'),
  password: z
    .string()
    .min(1, 'Enter your password.')
    .max(128, 'Password is too long.'),
  totpCode: totpSixDigitCodeSchema.optional(),
});

export const totpOrRecoveryCodeSchema = z
  .string()
  .trim()
  .refine(
    (val) => /^\d{6}$/.test(val) || /^[A-Za-z0-9]{4}-?[A-Za-z0-9]{4}$/.test(val),
    'Enter a 6-digit authenticator code or an 8-character recovery code (XXXX-XXXX).'
  );

export const loginTwoFactorSchema = z.object({
  mfaToken: z.string().trim().min(20, 'Missing or invalid two-factor challenge token.'),
  code: totpOrRecoveryCodeSchema,
});

export const enableTwoFactorSchema = z.object({
  code: totpSixDigitCodeSchema,
});

export const regenerateRecoveryCodesSchema = z.object({
  code: totpSixDigitCodeSchema,
});

export const disableTwoFactorSchema = z.object({
  password: z.string().min(1, 'Enter your current account password.').max(128),
  code: totpOrRecoveryCodeSchema,
});

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Enter a valid email address.'),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().trim().min(20, 'Invalid or missing reset token.'),
    password: z
      .string()
      .min(8, 'New password must be at least 8 characters long.')
      .max(128, 'Password must be 128 characters or fewer.')
      .regex(/[A-Z]/, 'Password must include at least one uppercase letter.')
      .regex(/[0-9]/, 'Password must include at least one number.')
      .regex(/[^A-Za-z0-9]/, 'Password must include at least one special character.'),
    confirmPassword: z.string().optional(),
  })
  .refine(
    (data) =>
      data.confirmPassword === undefined || data.password === data.confirmPassword,
    {
      message: 'Passwords do not match.',
      path: ['confirmPassword'],
    }
  );

export const updateProfileSchema = z.object({
  pen_name: z
    .string()
    .trim()
    .min(2, 'Pen name must be at least 2 characters.')
    .max(60)
    .optional(),
  studio_name: z.string().trim().max(80).optional(),
  bio: z.string().trim().max(500).optional(),
  avatar_url: z.string().trim().url('Avatar URL must be a valid URL.').nullable().optional(),
  role: z.enum(['reader', 'creator']).optional(),
  backup_email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Enter a valid backup recovery email address.')
    .max(120, 'Email address must be 120 characters or fewer.')
    .nullable()
    .optional()
    .or(z.literal('')),
});

export const editMyProfileSchema = z.object({
  display_name: z
    .string()
    .trim()
    .min(1, 'Display Name is required.')
    .max(30, 'Display Name must be 30 characters or fewer.')
    .regex(/^[^<>]+$/, 'Display Name contains invalid characters.'),
  studio_name: z
    .string()
    .trim()
    .max(30, 'Studio Name must be 30 characters or fewer.')
    .regex(/^[^<>]*$/, 'Studio Name contains invalid characters.')
    .optional()
    .default(''),
  bio: z
    .string()
    .trim()
    .max(150, 'Bio must be 150 characters or fewer.')
    .regex(/^[^<>]*$/, 'Bio contains invalid characters.')
    .optional()
    .default(''),
  avatarData: z.string().optional(),
  avatarFileName: z.string().max(120).optional(),
  removeAvatar: z.boolean().optional(),
});
