// AZ OVERVERSE Custom Production Auth Client
// Stack: PostgreSQL + bcrypt (12) + JWT (15m access in-memory / 7d httpOnly refresh cookie) + Resend
// Zero Firebase, Zero Firestore, Zero Supabase Auth

export interface OververseAuthUser {
  id: string;
  email: string;
  backup_email?: string | null;
  pen_name: string;
  studio_name: string;
  bio: string;
  avatar_url: string | null;
  email_verified: boolean;
  totp_enabled: boolean;
  totp_recovery_codes_remaining?: number;
  role: 'reader' | 'creator' | 'admin';
  created_at: string;
}

export interface OververseAuthSnapshot {
  ready: boolean;
  user: OververseAuthUser | null;
  accessToken: string | null;
}

type AuthSnapshotListener = (snapshot: OververseAuthSnapshot) => void;

// Access token lives strictly in memory (mitigates XSS localStorage exfiltration);
// 7-day refresh token is managed via httpOnly cookie on /api/auth.
let inMemoryAccessToken: string | null = null;
let currentAuthUser: OververseAuthUser | null = null;
let authBootstrapped = false;
let inflightRefresh: Promise<OververseAuthUser | null> | null = null;

const listeners = new Set<AuthSnapshotListener>();

function emitAuthSnapshot(): void {
  const snapshot: OververseAuthSnapshot = {
    ready: authBootstrapped,
    user: currentAuthUser,
    accessToken: inMemoryAccessToken,
  };
  listeners.forEach((listener) => {
    try {
      listener(snapshot);
    } catch (err) {
      console.error('[OververseAuth] Listener error:', err);
    }
  });
}

export function getOververseAuthSnapshot(): OververseAuthSnapshot {
  return {
    ready: authBootstrapped,
    user: currentAuthUser,
    accessToken: inMemoryAccessToken,
  };
}

export function getInMemoryAccessToken(): string | null {
  return inMemoryAccessToken;
}

export function subscribeToOververseAuth(listener: AuthSnapshotListener): () => void {
  listeners.add(listener);
  listener(getOververseAuthSnapshot());
  return () => {
    listeners.delete(listener);
  };
}

function setAuthenticatedSession(accessToken: string, user: OververseAuthUser): void {
  inMemoryAccessToken = accessToken;
  currentAuthUser = user;
  authBootstrapped = true;
  emitAuthSnapshot();
}

function clearAuthenticatedSession(): void {
  inMemoryAccessToken = null;
  currentAuthUser = null;
  authBootstrapped = true;
  emitAuthSnapshot();
}

async function fetchWithBearerRetry(
  url: string,
  init: Omit<RequestInit, 'headers'> & { headers?: Record<string, string> }
): Promise<Response | null> {
  let token = inMemoryAccessToken;
  if (!token) {
    await refreshOververseAccessToken();
    token = inMemoryAccessToken;
  }
  if (!token) {
    return null;
  }

  const makeRequest = (bearer: string) =>
    fetch(url, {
      ...init,
      headers: {
        ...(init.headers || {}),
        Authorization: `Bearer ${bearer}`,
      },
      credentials: 'include',
    });

  const firstResponse = await makeRequest(token);
  if (firstResponse.status !== 401) {
    return firstResponse;
  }

  await refreshOververseAccessToken();
  const refreshedToken = inMemoryAccessToken;
  if (!refreshedToken) {
    return firstResponse;
  }

  return makeRequest(refreshedToken);
}

export async function registerOververseUser(input: {
  email: string;
  pen_name: string;
  password: string;
  confirmPassword: string;
  studio_name?: string;
  bio?: string;
  role?: 'reader' | 'creator';
}): Promise<{
  success: boolean;
  message?: string;
  emailDelivered?: boolean;
  previewVerificationUrl?: string;
  user?: OververseAuthUser;
  error?: string;
}> {
  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(input),
    });
    const data = await res.json();
    if (!res.ok) {
      return {
        success: false,
        error: data?.error || 'Could not create account.',
      };
    }
    return {
      success: true,
      message: data.message,
      emailDelivered: Boolean(data.emailDelivered),
      previewVerificationUrl: data.previewVerificationUrl,
      user: data.user,
    };
  } catch {
    return {
      success: false,
      error: 'Network error while registering account. Please try again.',
    };
  }
}

export async function resendOververseVerificationEmail(email: string): Promise<{
  success: boolean;
  message?: string;
  emailDelivered?: boolean;
  previewVerificationUrl?: string;
  error?: string;
}> {
  try {
    const res = await fetch('/api/auth/resend-verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (!res.ok) {
      return {
        success: false,
        error: data?.error || 'Could not resend verification email.',
      };
    }
    return {
      success: true,
      message: data.message,
      emailDelivered: Boolean(data.emailDelivered),
      previewVerificationUrl: data.previewVerificationUrl,
    };
  } catch {
    return {
      success: false,
      error: 'Network error while resending verification email.',
    };
  }
}

export async function verifyOververseEmail(token: string): Promise<{
  success: boolean;
  message?: string;
  user?: OververseAuthUser;
  error?: string;
}> {
  try {
    const res = await fetch(`/api/auth/verify?token=${encodeURIComponent(token)}`, {
      method: 'GET',
      credentials: 'include',
    });
    const data = await res.json();
    if (!res.ok) {
      return {
        success: false,
        error: data?.error || 'Email verification failed.',
      };
    }
    return {
      success: true,
      message: data.message || 'Email verified',
      user: data.user,
    };
  } catch {
    return {
      success: false,
      error: 'Network error while verifying email token.',
    };
  }
}

export async function loginOververseUser(input: {
  email: string;
  password: string;
  totpCode?: string;
}): Promise<{
  success: boolean;
  requiresTwoFactor?: boolean;
  mfaToken?: string;
  email?: string;
  message?: string;
  accessToken?: string;
  refreshToken?: string;
  user?: OververseAuthUser;
  code?: string;
  error?: string;
}> {
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(input),
    });
    const data = await res.json();

    if (res.ok && data?.requiresTwoFactor && data?.mfaToken) {
      return {
        success: false,
        requiresTwoFactor: true,
        mfaToken: String(data.mfaToken),
        email: String(data.email || input.email),
        message: data.message,
      };
    }

    if (!res.ok || !data?.accessToken || !data?.user) {
      return {
        success: false,
        code: data?.code,
        error: data?.error || 'Invalid email or password.',
      };
    }

    setAuthenticatedSession(data.accessToken, data.user);
    return {
      success: true,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      user: data.user,
    };
  } catch {
    return {
      success: false,
      error: 'Network error while signing in. Please try again.',
    };
  }
}

export async function verifyOververseLoginTwoFactor(input: {
  mfaToken: string;
  code: string;
}): Promise<{
  success: boolean;
  usedRecoveryCode?: boolean;
  remainingRecoveryCodes?: number;
  accessToken?: string;
  refreshToken?: string;
  user?: OververseAuthUser;
  code?: string;
  error?: string;
}> {
  try {
    const res = await fetch('/api/auth/login/2fa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(input),
    });
    const data = await res.json();
    if (!res.ok || !data?.accessToken || !data?.user) {
      return {
        success: false,
        code: data?.code,
        error: data?.error || 'Invalid verification code.',
      };
    }

    setAuthenticatedSession(data.accessToken, data.user);
    return {
      success: true,
      usedRecoveryCode: Boolean(data.usedRecoveryCode),
      remainingRecoveryCodes:
        typeof data.remainingRecoveryCodes === 'number'
          ? data.remainingRecoveryCodes
          : undefined,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      user: data.user,
    };
  } catch {
    return {
      success: false,
      error: 'Network error while verifying authenticator code. Please try again.',
    };
  }
}

export async function setupOververseTwoFactor(): Promise<{
  success: boolean;
  otpauthUrl?: string;
  qrCodeDataUrl?: string;
  manualEntryKey?: string;
  error?: string;
}> {
  try {
    const res = await fetchWithBearerRetry('/api/auth/2fa/setup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    if (!res) {
      return {
        success: false,
        error: 'Your session expired. Please sign in again.',
      };
    }
    const data = await res.json();
    if (!res.ok || !data?.qrCodeDataUrl || !data?.manualEntryKey) {
      return {
        success: false,
        error: data?.error || 'Could not initialize authenticator setup.',
      };
    }
    return {
      success: true,
      otpauthUrl: data.otpauthUrl,
      qrCodeDataUrl: data.qrCodeDataUrl,
      manualEntryKey: data.manualEntryKey,
    };
  } catch {
    return {
      success: false,
      error: 'Network error while starting Two-Factor Authentication setup.',
    };
  }
}

export async function enableOververseTwoFactor(code: string): Promise<{
  success: boolean;
  message?: string;
  recoveryCodes?: string[];
  user?: OververseAuthUser;
  error?: string;
}> {
  try {
    const res = await fetchWithBearerRetry('/api/auth/2fa/enable', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });
    if (!res) {
      return {
        success: false,
        error: 'Your session expired. Please sign in again.',
      };
    }
    const data = await res.json();
    if (!res.ok || !data?.user) {
      return {
        success: false,
        error: data?.error || 'Invalid 6-digit authenticator code.',
      };
    }
    currentAuthUser = data.user;
    authBootstrapped = true;
    emitAuthSnapshot();
    return {
      success: true,
      message: data.message,
      recoveryCodes: Array.isArray(data.recoveryCodes) ? data.recoveryCodes : [],
      user: data.user,
    };
  } catch {
    return {
      success: false,
      error: 'Network error while enabling Two-Factor Authentication.',
    };
  }
}

export async function regenerateOververseRecoveryCodes(code: string): Promise<{
  success: boolean;
  message?: string;
  recoveryCodes?: string[];
  user?: OververseAuthUser;
  error?: string;
}> {
  try {
    const res = await fetchWithBearerRetry('/api/auth/2fa/recovery-codes/regenerate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });
    if (!res) {
      return {
        success: false,
        error: 'Your session expired. Please sign in again.',
      };
    }
    const data = await res.json();
    if (!res.ok || !data?.user) {
      return {
        success: false,
        error: data?.error || 'Invalid 6-digit authenticator code.',
      };
    }
    currentAuthUser = data.user;
    authBootstrapped = true;
    emitAuthSnapshot();
    return {
      success: true,
      message: data.message,
      recoveryCodes: Array.isArray(data.recoveryCodes) ? data.recoveryCodes : [],
      user: data.user,
    };
  } catch {
    return {
      success: false,
      error: 'Network error while regenerating recovery codes.',
    };
  }
}

export async function disableOververseTwoFactor(input: {
  password: string;
  code: string;
}): Promise<{
  success: boolean;
  message?: string;
  user?: OververseAuthUser;
  error?: string;
}> {
  try {
    const res = await fetchWithBearerRetry('/api/auth/2fa/disable', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (!res) {
      return {
        success: false,
        error: 'Your session expired. Please sign in again.',
      };
    }
    const data = await res.json();
    if (!res.ok || !data?.user) {
      return {
        success: false,
        error: data?.error || 'Could not disable Two-Factor Authentication.',
      };
    }
    currentAuthUser = data.user;
    authBootstrapped = true;
    emitAuthSnapshot();
    return {
      success: true,
      message: data.message,
      user: data.user,
    };
  } catch {
    return {
      success: false,
      error: 'Network error while disabling Two-Factor Authentication.',
    };
  }
}

export async function refreshOververseAccessToken(): Promise<OververseAuthUser | null> {
  if (inflightRefresh) {
    return inflightRefresh;
  }

  inflightRefresh = (async () => {
    try {
      const res = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        clearAuthenticatedSession();
        return null;
      }
      const data = await res.json();
      if (data?.accessToken && data?.user) {
        setAuthenticatedSession(data.accessToken, data.user);
        return data.user as OververseAuthUser;
      }
      clearAuthenticatedSession();
      return null;
    } catch {
      authBootstrapped = true;
      emitAuthSnapshot();
      return null;
    } finally {
      inflightRefresh = null;
    }
  })();

  return inflightRefresh;
}

export async function fetchAuthenticatedMe(): Promise<OververseAuthUser | null> {
  if (!inMemoryAccessToken) {
    return refreshOververseAccessToken();
  }

  try {
    const res = await fetch('/api/auth/me', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${inMemoryAccessToken}`,
      },
      credentials: 'include',
    });

    if (res.status === 401) {
      return refreshOververseAccessToken();
    }

    if (!res.ok) {
      return null;
    }

    const data = await res.json();
    if (data?.user) {
      currentAuthUser = data.user;
      authBootstrapped = true;
      emitAuthSnapshot();
      return data.user as OververseAuthUser;
    }
    return null;
  } catch {
    return currentAuthUser;
  }
}

export async function requestOverversePasswordReset(email: string): Promise<{
  success: boolean;
  message?: string;
  emailDelivered?: boolean;
  previewResetUrl?: string;
  error?: string;
}> {
  try {
    const res = await fetch('/api/auth/forgot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (!res.ok) {
      return {
        success: false,
        error: data?.error || 'Could not request password reset.',
      };
    }
    return {
      success: true,
      message: data.message,
      emailDelivered: Boolean(data.emailDelivered),
      previewResetUrl: data.previewResetUrl,
    };
  } catch {
    return {
      success: false,
      error: 'Network error while requesting password reset.',
    };
  }
}

export async function confirmOverversePasswordReset(input: {
  token: string;
  password: string;
  confirmPassword: string;
}): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    const res = await fetch('/api/auth/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(input),
    });
    const data = await res.json();
    if (!res.ok) {
      return {
        success: false,
        error: data?.error || 'Could not reset password.',
      };
    }
    clearAuthenticatedSession();
    return {
      success: true,
      message: data.message,
    };
  } catch {
    return {
      success: false,
      error: 'Network error while resetting password.',
    };
  }
}

export async function patchOververseCreatorProfile(updates: {
  pen_name?: string;
  studio_name?: string;
  bio?: string;
  avatar_url?: string | null;
  role?: 'reader' | 'creator';
  backup_email?: string | null;
}): Promise<{
  success: boolean;
  user?: OververseAuthUser;
  error?: string;
}> {
  try {
    const res = await fetchWithBearerRetry('/api/auth/profile', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });
    if (!res) {
      return {
        success: false,
        error: 'Your session expired. Please sign in again.',
      };
    }
    const data = await res.json();
    if (!res.ok || !data?.user) {
      return {
        success: false,
        error: data?.error || 'Could not update profile.',
      };
    }

    const activeToken = data.accessToken || inMemoryAccessToken;
    if (activeToken) {
      setAuthenticatedSession(activeToken, data.user);
    } else {
      currentAuthUser = data.user;
      emitAuthSnapshot();
    }
    return {
      success: true,
      user: data.user,
    };
  } catch {
    return {
      success: false,
      error: 'Network error while updating profile.',
    };
  }
}

export async function logoutOververseSession(): Promise<void> {
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });
  } catch {
    // Ignore network disconnect on logout
  } finally {
    clearAuthenticatedSession();
  }
}

// Automatically restore active session from httpOnly refreshToken cookie on startup
if (typeof window !== 'undefined') {
  void refreshOververseAccessToken();
}
