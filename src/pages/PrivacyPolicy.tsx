import React from 'react';
import { ArrowLeft } from 'lucide-react';

const PrivacyPolicy = ({ onClose }: { onClose: () => void }) => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-6 sm:p-10 font-sans">
      <div className="max-w-4xl mx-auto">
        <button 
          onClick={onClose}
          className="flex items-center gap-2 text-amber-400 hover:text-amber-300 font-bold mb-6 transition"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to App
        </button>

        <h1 className="text-3xl font-bold text-white mb-6">PRIVACY POLICY FOR AZ OVERVERSE</h1>
        <p className="text-sm text-slate-400 mb-6">Produced by Mlungiseni Mbhele | Effective Date: October 1, 2026</p>

        <div className="space-y-6 text-sm leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-white mb-2">1. Introduction</h2>
            <p>AZ Oververse ("we," "us," "our") respects your privacy. This Privacy Policy explains how we collect, use, and protect your information when you use our mobile application and web reader.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-2">2. Information We Collect</h2>
            <p>a) Information you provide: Email address when you create account or subscribe to AZ Oververse VIP or Patron plans. Payment information is processed securely by Google Play Billing and we do not store card details.</p>
            <p>b) Automatic Information: Device type, Android ID, app version, reading history, favorite manga list, crash logs. This is collected via Google Firebase (Analytics, Crashlytics, Cloud Firestore) - that's your google-services.json file.</p>
            <p>c) We do NOT collect: Your precise location, contacts, photos, microphone, or phone calls.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-2">3. How We Use Your Information</h2>
            <p>To provide manga chapters, library, and subscriptions</p>
            <p>To process payments (R89/mo, R149/mo, or annual discounted plans)</p>
            <p>To fix crashes and improve app performance</p>
            <p>To send updates about new manga releases (if you opt-in)</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-2">4. Third-Party Services</h2>
            <p>We use: Google Firebase / Google Play Services, Google Play Billing (for subscriptions). These services have their own privacy policies.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-2">5. Data Storage & Security</h2>
            <p>Your data is stored securely on Firebase servers. We take reasonable measures to protect it but no system is 100% secure.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-2">6. Data Sharing</h2>
            <p>We do NOT sell your personal data. We only share data with Google Firebase to run the app.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-2">7. Your Rights (POPIA - South Africa)</h2>
            <p>You can request to view, correct, or delete your data at any time by emailing us. You can also delete your account in app Settings.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-2">8. Children's Privacy</h2>
            <p>Our app is rated 13+. We do not knowingly collect data from children under 13.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-2">9. Changes</h2>
            <p>We may update this policy. We will notify you in-app.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-2">10. Contact Us</h2>
            <p>If you have questions, contact: Producer: Mlungiseni Mbhele | Email: mlungisenimbhele3@gmail.com | Location: South Africa</p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
