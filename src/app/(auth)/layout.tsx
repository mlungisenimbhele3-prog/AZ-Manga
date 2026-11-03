'use client';

import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { APP_LOGO_SRC } from '../../components/common/KAAfricaLogo';
import { navigateHomeCatalog } from './schemas';

export interface AuthLayoutProps {
  children: React.ReactNode;
}

/**
 * Route-group layout under src/app/(auth)/layout.tsx
 * Consistent with AZ OVERVERSE dark slate-950 + amber-400 + Bebas Neue visual language.
 */
export default function AuthGroupLayout({ children }: AuthLayoutProps) {
  return (
    <div className="w-full text-slate-100 selection:bg-amber-500/30 selection:text-amber-200">
      {children}
    </div>
  );
}

interface AuthSplitFrameProps {
  kicker: string;
  title: string;
  subtitle: string;
  onBackToHome?: () => void;
  children: React.ReactNode;
}

export const AuthSplitFrame: React.FC<AuthSplitFrameProps> = ({
  kicker,
  title,
  subtitle,
  onBackToHome,
  children,
}) => {
  const prefersReducedMotion = useReducedMotion();

  return (
    <AuthGroupLayout>
      <section className="mx-auto w-full max-w-5xl py-3 sm:py-6">
        <div className="mb-6 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => navigateHomeCatalog(onBackToHome)}
            className="min-h-[44px] inline-flex items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4 text-amber-400" />
            <span>Back to Catalog</span>
          </button>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="text-slate-200 font-medium">AZ OVERVERSE</span>
            <span aria-hidden="true">·</span>
            <span>Creators &amp; Readers</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800/90 bg-slate-950 p-6 sm:p-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            {/* Left Editorial Brand Column */}
            <div className="lg:col-span-5 space-y-6">
              <div className="flex items-center gap-3.5">
                <img
                  src={APP_LOGO_SRC}
                  alt="AZ OVERVERSE Logo"
                  width={48}
                  height={48}
                  decoding="async"
                  className="h-12 w-12 rounded-xl bg-[#0f0424] object-cover border border-slate-800 shrink-0"
                />
                <div>
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.p
                      key={kicker}
                      initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: prefersReducedMotion ? 0 : -4 }}
                      transition={{ duration: prefersReducedMotion ? 0.1 : 0.2, ease: 'easeOut' }}
                      className="text-xs font-semibold text-amber-400"
                    >
                      {kicker}
                    </motion.p>
                  </AnimatePresence>
                  <p className="font-['Bebas_Neue',sans-serif] text-2xl sm:text-3xl tracking-wider text-white leading-none mt-0.5">
                    OVER<span className="text-amber-400">VERSE</span>
                  </p>
                </div>
              </div>

              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={title}
                  initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: prefersReducedMotion ? 0 : -8 }}
                  transition={{
                    duration: prefersReducedMotion ? 0.12 : 0.24,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="space-y-3"
                >
                  <h1 className="font-['Bebas_Neue',sans-serif] text-3xl sm:text-4xl tracking-wide text-white leading-tight [text-wrap:balance]">
                    {title}
                  </h1>
                  <p className="text-sm text-slate-400 leading-relaxed">{subtitle}</p>
                </motion.div>
              </AnimatePresence>

              <div className="border-t border-slate-800/80 pt-5 space-y-4 text-xs">
                <div>
                  <h2 className="font-semibold text-slate-100 text-sm mb-1">
                    01. Official Creator Pen Name
                  </h2>
                  <p className="text-slate-400 leading-relaxed">
                    Claim your creator pen name to serialize original manga and vertical webtoon episodes.
                  </p>
                </div>
                <div>
                  <h2 className="font-semibold text-slate-100 text-sm mb-1">
                    02. Verified Publishing Studio
                  </h2>
                  <p className="text-slate-400 leading-relaxed">
                    Email verification unlocks chapter uploads, audience analytics, and 70% creator revenue share.
                  </p>
                </div>
                <div>
                  <h2 className="font-semibold text-slate-100 text-sm mb-1">
                    03. Protected Creator Sessions
                  </h2>
                  <p className="text-slate-400 leading-relaxed">
                    Short-lived 15-minute access tokens paired with 7-day httpOnly refresh cookies keep your studio protected.
                  </p>
                </div>
              </div>
            </div>

            {/* Right Interactive Form Column */}
            <div className="lg:col-span-7 border-t lg:border-t-0 lg:border-l border-slate-800/80 pt-6 lg:pt-0 lg:pl-10">
              {children}
            </div>
          </div>
        </div>
      </section>
    </AuthGroupLayout>
  );
};
