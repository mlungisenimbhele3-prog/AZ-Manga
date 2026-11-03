import React, { useState } from 'react';
import { CreatorAuthState } from '../../services/userProfile';
import { RegisterPage } from '../../app/(auth)/register/page';
import { LoginPage } from '../../app/(auth)/login/page';
import { ForgotPasswordPage } from '../../app/(auth)/forgot/page';
import type { AuthRoutePath } from '../../app/(auth)/schemas';

interface CreatorAccountGateProps {
  authState: CreatorAuthState;
  onBackToReader: () => void;
  onNavigateAuthRoute?: (route: AuthRoutePath, querySearch?: string) => void;
  onNavigateToTerms?: () => void;
  onNavigateToPrivacy?: () => void;
}

/**
 * Studio Creator Gate — Powered 100% by AZ OVERVERSE Custom Auth (PostgreSQL + JWT + bcrypt + Resend).
 * Zero Firebase, Zero Firestore, Zero Supabase Auth.
 */
export const CreatorAccountGate: React.FC<CreatorAccountGateProps> = ({
  onBackToReader,
  onNavigateAuthRoute,
  onNavigateToTerms,
  onNavigateToPrivacy,
}) => {
  const [embeddedMode, setEmbeddedMode] = useState<'login' | 'register' | 'forgot'>('login');

  const handleNavigate = (route: AuthRoutePath, querySearch?: string) => {
    if (onNavigateAuthRoute && (route === 'verify' || route === 'reset' || route === 'dashboard')) {
      onNavigateAuthRoute(route, querySearch);
      return;
    }
    if (route === 'login' || route === 'register' || route === 'forgot') {
      setEmbeddedMode(route);
      return;
    }
    if (onNavigateAuthRoute) {
      onNavigateAuthRoute(route, querySearch);
    }
  };

  if (embeddedMode === 'register') {
    return (
      <RegisterPage
        onNavigateAuthRoute={handleNavigate}
        onBackToHome={onBackToReader}
        onNavigateToTerms={onNavigateToTerms}
        onNavigateToPrivacy={onNavigateToPrivacy}
      />
    );
  }

  if (embeddedMode === 'forgot') {
    return (
      <ForgotPasswordPage
        onNavigateAuthRoute={handleNavigate}
        onBackToHome={onBackToReader}
      />
    );
  }

  return (
    <LoginPage
      onNavigateAuthRoute={handleNavigate}
      onBackToHome={onBackToReader}
      onLoginSuccess={() => {
        // Unlocks Studio immediately once CreatorAuthState updates
      }}
    />
  );
};
