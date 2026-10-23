import React from 'react';
import { ArrowLeft, ShieldCheck, FileText } from 'lucide-react';

interface TermsOfServiceProps {
  onClose?: () => void;
}

export const TermsOfService: React.FC<TermsOfServiceProps> = ({ onClose }) => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-6 sm:p-10 font-sans">
      <div className="max-w-4xl mx-auto">
        {onClose && (
          <button
            onClick={onClose}
            className="flex items-center gap-2 text-amber-400 hover:text-amber-300 font-bold mb-6 transition"
            aria-label="Back to App"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Reader</span>
          </button>
        )}

        <div className="flex items-center gap-3 mb-3">
          <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">TERMS OF SERVICE</h1>
            <p className="text-xs sm:text-sm text-slate-400">AZ Oververse • Effective Date: October 1, 2026</p>
          </div>
        </div>

        <div className="mt-8 space-y-6 text-sm leading-relaxed border-t border-slate-800 pt-6">
          <section className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
            <h2 className="text-lg font-bold text-amber-400 mb-2">1. Introduction</h2>
            <p className="text-slate-300">
              Welcome to AZ Oververse ("we," "us," or "our"). By accessing or using our application and website, you agree to comply with and be bound by these Terms of Service. If you disagree with any part of these terms, please discontinue use of our service immediately.
            </p>
          </section>

          <section className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
            <h2 className="text-lg font-bold text-amber-400 mb-2">2. Content Ownership & Manga Publishing Rights</h2>
            <p className="text-slate-300">
              All manga content, including images, text, and characters, made available through the AZ Oververse application belongs to their respective publishers, creators, authors, and copyright holders.
            </p>
            <div className="my-3 p-3.5 rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-200 text-xs font-medium leading-relaxed">
              <strong>Official Copyright & Backdrop License Mandate:</strong> All AZ Originals are © AZ Oververse / Mlungiseni Mbhele. All Canvas works remain © their respective creators. AZ Oververse has non-exclusive license to display Backdrop works. Any re-upload without permission is prohibited.
            </div>
            <p className="text-slate-300 mt-2">
              Creators publishing to AZ Oververse retain 100% intellectual property ownership of their titles while granting AZ Oververse a worldwide, non-exclusive license to distribute, render, and display their chapters to readers across all supported platforms.
            </p>
          </section>

          <section className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
            <h2 className="text-lg font-bold text-amber-400 mb-2">3. Monetization, ZAR Payouts & 70% Revenue Share</h2>
            <p className="text-slate-300">
              Independent creators enrolled in the Creator Studio earn a 70% revenue split from Google AdMob impressions, rewarded chapter unlocks, and Google Play Billing VIP reader reading hours on their works.
            </p>
          </section>

          <section className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
            <h2 className="text-lg font-bold text-amber-400 mb-2">4. User Responsibilities & Fair Use</h2>
            <p className="text-slate-300">
              You agree to use our services for personal, non-commercial reading and interaction. You shall not scrape, re-distribute, decompile, or re-upload content made available through the app without explicit written consent from the author or publisher.
            </p>
          </section>

          <section className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
            <h2 className="text-lg font-bold text-amber-400 mb-2">5. Limitation of Liability</h2>
            <p className="text-slate-300">
              We provide the application on an "as-is" and "as-available" basis. We are not liable for transient network disruptions, third-party content disputes, or service interruptions beyond reasonable control.
            </p>
          </section>

          <section className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
            <h2 className="text-lg font-bold text-amber-400 mb-2">6. Changes to Terms</h2>
            <p className="text-slate-300">
              We reserve the right to modify these terms at any time. Notice will be provided by updating the "Effective Date" at the top of this document. Continued usage signifies agreement with updated terms.
            </p>
          </section>

          <section className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
            <h2 className="text-lg font-bold text-amber-400 mb-2">7. Contact & Support</h2>
            <p className="text-slate-300">
              For any legal notices, copyright inquiries, or support inquiries, please reach out to our administration team at:
            </p>
            <p className="mt-2 font-mono text-amber-300">mlungisenimbhele3@gmail.com</p>
            <p className="text-xs text-slate-400 mt-1">Produced by Mlungiseni Mbhele • Johannesburg, South Africa</p>
          </section>
        </div>
      </div>
    </div>
  );
};
