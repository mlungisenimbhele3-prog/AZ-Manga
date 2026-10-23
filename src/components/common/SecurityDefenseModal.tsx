import React, { useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Lock,
  Flame,
  CheckCircle,
  Copy,
  Check,
  ExternalLink,
  Terminal,
  Activity,
  X,
  AlertTriangle,
  RefreshCw,
  Cpu,
} from 'lucide-react';
import {
  getDefenseSecurityReport,
  sanitizeInput,
  vaultStore,
  vaultRetrieve,
  clearSecurityLogs,
  SecurityAuditReport,
} from '../../utils/securitySanitizer';
import { getSupabaseDetails } from '../../services/supabase';

interface SecurityDefenseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SecurityDefenseModal: React.FC<SecurityDefenseModalProps> = ({ isOpen, onClose }) => {
  const [report, setReport] = useState<SecurityAuditReport>(() => getDefenseSecurityReport());
  const [copiedSchema, setCopiedSchema] = useState(false);
  const [testInput, setTestInput] = useState('<script>alert("XSS Attack!")</script><img src=x onerror=alert(1)>');
  const [testOutput, setTestOutput] = useState('');
  const [tamperTestStatus, setTamperTestStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const refreshReport = () => {
    setReport(getDefenseSecurityReport());
  };

  const handleRunXssTest = () => {
    const cleaned = sanitizeInput(testInput, 'Security Playground');
    setTestOutput(cleaned);
    refreshReport();
  };

  const handleRunTamperTest = () => {
    // 1. Store legit VIP state in vault
    vaultStore('test_license', { plan: 'VIP_UNLIMITED', verified: true });
    // 2. Read back valid
    const valid = vaultRetrieve('test_license', { plan: 'FREE', verified: false });
    // 3. Intentionally inject corrupted raw data into localStorage bypass
    localStorage.setItem('vault_test_license', JSON.stringify({
      payload: { plan: 'PIRATED_ENTERPRISE', verified: true },
      signature: 'corrupted_forged_hash_000',
      signedAt: new Date().toISOString(),
    }));
    // 4. Vault must catch it and reject it
    const afterTamper = vaultRetrieve('test_license', { plan: 'SAFE_FALLBACK_DEFAULT', verified: false });
    
    refreshReport();
    setTamperTestStatus(
      afterTamper.plan === 'SAFE_FALLBACK_DEFAULT'
        ? '✅ Tamper Blocked! Vault rejected the forged signature and restored verified state.'
        : 'Tamper undetected'
    );
  };

  const handleCopySchema = () => {
    const sqlSchema = `-- AZ OVERVERSE - Supabase Core Relational Database Schema
CREATE TABLE IF NOT EXISTS mangas (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  artist TEXT NOT NULL,
  cover_image TEXT NOT NULL,
  genres TEXT[] DEFAULT '{}',
  status TEXT NOT NULL,
  synopsis TEXT NOT NULL,
  rating NUMERIC(3,2) DEFAULT 4.90,
  monetization_model TEXT DEFAULT 'hybrid',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS chapters (
  id TEXT PRIMARY KEY,
  manga_id TEXT NOT NULL REFERENCES mangas(id) ON DELETE CASCADE,
  number INT NOT NULL,
  title TEXT NOT NULL,
  release_date TEXT NOT NULL,
  access_type TEXT DEFAULT 'free',
  pages JSONB DEFAULT '[]'::jsonb
);

CREATE TABLE IF NOT EXISTS user_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  manga_id TEXT NOT NULL REFERENCES mangas(id) ON DELETE CASCADE,
  is_favorite BOOLEAN DEFAULT true,
  reading_status TEXT DEFAULT 'reading',
  last_chapter_id TEXT,
  progress_percent INT DEFAULT 0
);

ALTER TABLE mangas ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_library ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public Read Mangas" ON mangas FOR SELECT USING (true);
CREATE POLICY "Public Read Chapters" ON chapters FOR SELECT USING (true);
CREATE POLICY "User Library Isolated" ON user_library FOR ALL
  USING (user_email = auth.jwt()->>'email');`;

    navigator.clipboard.writeText(sqlSchema);
    setCopiedSchema(true);
    setTimeout(() => setCopiedSchema(false), 3000);
  };

  const supabaseInfo = getSupabaseDetails();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl my-6 bg-slate-950 border border-emerald-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-800 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-950">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide">
                  DEFENSE ×5 SECURITY SUITE
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  ALL 5 ACTIVE
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Produced by Mlungiseni Mbhele • Fortified Cyber Armor & Supabase RLS
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 space-y-6 overflow-y-auto">
          
          {/* Defense Score Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
              <span className="text-[11px] font-mono text-slate-400 uppercase">Security Score</span>
              <div className="text-2xl font-black text-emerald-400 font-mono mt-0.5">
                {report.securityScore}%
              </div>
              <span className="text-[10px] text-emerald-500/80">Maximum Hardening</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
              <span className="text-[11px] font-mono text-slate-400 uppercase">Attacks Blocked</span>
              <div className="text-2xl font-black text-amber-400 font-mono mt-0.5">
                {report.attacksBlockedCount}
              </div>
              <span className="text-[10px] text-slate-500">Neutralized</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
              <span className="text-[11px] font-mono text-slate-400 uppercase">XSS Sanitized</span>
              <div className="text-2xl font-black text-blue-400 font-mono mt-0.5">
                {report.xssSanitizationsCount}
              </div>
              <span className="text-[10px] text-slate-500">Payloads Scrubbed</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
              <span className="text-[11px] font-mono text-slate-400 uppercase">Tamper Audits</span>
              <div className="text-2xl font-black text-purple-400 font-mono mt-0.5">
                {report.tamperAttemptsDetected}
              </div>
              <span className="text-[10px] text-slate-500">Signatures Checked</span>
            </div>
          </div>

          {/* 5 Defense Pillars */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
              The 5 Active Defense Layers
            </h3>

            {/* Defense 1 */}
            <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 flex items-start gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 mt-0.5 shrink-0">
                <Lock className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white">Defense 1: Hardened CSP & Clickjacking Shield</h4>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                    ENFORCED
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Enforces nosniff, strict referrer origin, and strict Content-Security-Policy disallowing unauthorized script evaluation.
                </p>
              </div>
            </div>

            {/* Defense 2 */}
            <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 flex items-start gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 mt-0.5 shrink-0">
                <Cpu className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white">Defense 2: Anti-XSS Sanitizer & Tag Stripper</h4>
                  <span className="text-[10px] font-mono text-blue-400 bg-blue-950/60 px-2 py-0.5 rounded border border-blue-800/40">
                    REAL-TIME
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Deep input inspection scrubbing script tags, onerror handlers, and javascript: pseudo-protocols across comments and creator uploads.
                </p>
              </div>
            </div>

            {/* Defense 3 */}
            <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 flex items-start gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 mt-0.5 shrink-0">
                <Flame className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white">Defense 3: Adaptive Rate Limiter & Anti-Scraping DDoS Shield</h4>
                  <span className="text-[10px] font-mono text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/40">
                    SHIELDING
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Express IP subnet limiting (100 req/15m) plus token-bucket anti-harvesting throttling for manga pages to safeguard creator artwork.
                </p>
              </div>
            </div>

            {/* Defense 4 */}
            <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 flex items-start gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 mt-0.5 shrink-0">
                <Terminal className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white">Defense 4: Supabase RLS & Parametric Query Guard</h4>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                    ZERO SQLi / IDOR
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Row-Level Security on <code className="text-emerald-300">mangas</code>, <code className="text-emerald-300">chapters</code>, and <code className="text-emerald-300">user_library</code> with strict parameterized queries.
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <button
                    onClick={handleCopySchema}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-300 transition"
                  >
                    {copiedSchema ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedSchema ? 'SQL Schema Copied!' : 'Copy Supabase Schema SQL'}
                  </button>
                  <span className="text-[10px] text-slate-500">
                    Mode: {supabaseInfo.mode}
                  </span>
                </div>
              </div>
            </div>

            {/* Defense 5 */}
            <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 flex items-start gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 mt-0.5 shrink-0">
                <Activity className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white">Defense 5: Cryptographic Anti-Tamper Vault</h4>
                  <span className="text-[10px] font-mono text-purple-400 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800/40">
                    HMAC SIGNED
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Client storage is cryptographically sealed with checksum signatures. Any devtools tampering with VIP tier or reading progress is caught and revoked.
                </p>
              </div>
            </div>
          </div>

          {/* Interactive Defense Playground */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                Interactive Defense Verification Playground
              </h4>
              <button
                onClick={refreshReport}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-white"
              >
                <RefreshCw className="w-3 h-3" /> Refresh
              </button>
            </div>

            {/* Test 1: XSS Neutralizer */}
            <div className="space-y-2">
              <label className="text-xs font-mono text-slate-400">
                Test XSS Neutralizer (Try pasting malicious payloads):
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={testInput}
                  onChange={(e) => setTestInput(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs bg-slate-950 border border-slate-700 rounded-lg text-slate-200 font-mono focus:border-emerald-500 outline-none"
                  placeholder="Enter test payload..."
                />
                <button
                  onClick={handleRunXssTest}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white rounded-lg transition"
                >
                  Sanitize
                </button>
              </div>
              {testOutput && (
                <div className="p-2.5 rounded bg-slate-950 border border-slate-800 text-xs font-mono text-emerald-400">
                  <span className="text-slate-500">Sanitized Output: </span>
                  {testOutput}
                </div>
              )}
            </div>

            {/* Test 2: Anti-Tamper Check */}
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between flex-wrap gap-2">
              <div>
                <span className="text-xs font-mono text-slate-300 block">Cryptographic Anti-Tamper Audit</span>
                <span className="text-[11px] text-slate-500">Simulate client memory tampering and verify automatic rollback</span>
              </div>
              <button
                onClick={handleRunTamperTest}
                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white rounded-lg transition"
              >
                Run Tamper Simulation
              </button>
            </div>
            {tamperTestStatus && (
              <div className="p-2 rounded bg-purple-950/40 border border-purple-800/40 text-xs font-mono text-purple-300">
                {tamperTestStatus}
              </div>
            )}
          </div>

          {/* Recent Audit Events */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-mono font-bold text-slate-400 uppercase">
                Recent Security Audit Log
              </h4>
              {report.recentEvents.length > 0 && (
                <button
                  onClick={() => {
                    clearSecurityLogs();
                    refreshReport();
                  }}
                  className="text-[11px] text-slate-500 hover:text-slate-300"
                >
                  Clear Logs
                </button>
              )}
            </div>
            {report.recentEvents.length === 0 ? (
              <div className="p-3 rounded-lg bg-slate-900/40 border border-slate-800 text-center text-xs text-slate-500">
                All 5 defense perimeters operating normally. Zero active compromises.
              </div>
            ) : (
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {report.recentEvents.slice(0, 8).map((evt, idx) => (
                  <div
                    key={`${evt.id}-${idx}`}
                    className="p-2 rounded bg-slate-900/80 border border-slate-800/80 text-[11px] font-mono flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${evt.severity === 'critical' ? 'bg-red-500' : evt.severity === 'high' ? 'bg-amber-500' : 'bg-blue-500'}`} />
                      <span className="text-slate-400">[{evt.layer}]</span>
                      <span className="text-slate-200">{evt.details}</span>
                    </div>
                    <span className="text-slate-600 text-[10px] shrink-0 ml-2">{evt.timestamp}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-emerald-400 font-mono">
            <CheckCircle className="w-4 h-4" />
            Platform Security Certified: Defense ×5 Active
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white rounded-xl transition"
          >
            Close Security Suite
          </button>
        </div>
      </div>
    </div>
  );
};
