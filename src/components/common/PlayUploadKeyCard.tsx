import React, { useState } from 'react';
import {
  Download,
  KeyRound,
  ShieldCheck,
  Copy,
  Check,
  X,
  FileCheck2,
  Lock,
} from 'lucide-react';
import { getInMemoryAccessToken } from '../../services/oververseAuth';
import { safeStorage } from '../../utils/safeStorage';

export const ADMIN_UNLOCK_STORAGE_KEY = 'az_oververse_admin_unlocked_v1';
export const ADMIN_MASTER_SECRET_CACHE_KEY = 'az_oververse_admin_secret_session';

export const PLAY_UPLOAD_KEY_INFO = {
  keystoreFile: 'upload-keystore.jks',
  certificateFile: 'upload_certificate.pem',
  alias: 'upload',
  validityDays: 10000,
  distinguishedName: 'CN=AZ OVERVERSE, O=AZ OVERVERSE, C=ZA',
  packageName: 'com.azoververse.manga',
  sha1: '79:C1:6B:96:71:58:03:E3:7E:2A:5B:C4:2F:C7:E8:43:27:4D:2B:5B',
  sha256:
    '92:36:6C:BF:69:41:4F:63:59:BD:95:CD:14:04:27:CE:EF:2B:13:1C:B8:65:2B:BC:6D:11:6D:74:DF:E5:EA:2C',
} as const;

interface PlayUploadKeyCardProps {
  isAdmin: boolean;
  onDismiss?: () => void;
  compact?: boolean;
}

export const PlayUploadKeyCard: React.FC<PlayUploadKeyCardProps> = ({
  isAdmin,
  onDismiss,
  compact = false,
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [downloadingFile, setDownloadingFile] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  // Defense-in-depth: strictly render nothing for any non-admin visitor
  if (!isAdmin) {
    return null;
  }

  const handleCopy = async (value: string, fieldKey: string) => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = value;
      textarea.setAttribute('readonly', '');
      textarea.className = 'sr-only';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    setCopiedField(fieldKey);
    window.setTimeout(() => {
      setCopiedField((curr) => (curr === fieldKey ? null : curr));
    }, 2200);
  };

  const triggerProtectedAdminDownload = async (endpoint: string, fileName: string) => {
    setDownloadingFile(fileName);
    setDownloadError(null);
    try {
      const headers: Record<string, string> = {};
      const accessToken = getInMemoryAccessToken();
      if (accessToken) {
        headers.Authorization = `Bearer ${accessToken}`;
      }
      const adminSecret = safeStorage.getItem(ADMIN_MASTER_SECRET_CACHE_KEY);
      if (adminSecret) {
        headers['x-az-admin-pass'] = adminSecret;
      }

      const response = await fetch(endpoint, {
        method: 'GET',
        credentials: 'include',
        headers,
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error('Admin verification required to download signing files.');
      }

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = blobUrl;
      anchor.download = fileName;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      window.setTimeout(() => URL.revokeObjectURL(blobUrl), 4000);
    } catch (err: any) {
      setDownloadError(err?.message || 'Admin authorization required.');
    } finally {
      window.setTimeout(() => {
        setDownloadingFile((curr) => (curr === fileName ? null : curr));
      }, 600);
    }
  };

  return (
    <section
      aria-label="Admin-Only Google Play Upload Key and Certificate"
      className={`rounded-2xl border border-amber-500/40 bg-gradient-to-br from-slate-950 via-slate-900/95 to-slate-950 ${
        compact ? 'p-4' : 'p-4 sm:p-5'
      } shadow-xl space-y-4`}
    >
      {/* Header Row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="h-10 w-10 rounded-xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
            <KeyRound className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm sm:text-base font-bold text-white">
                Google Play Upload Key & Certificate
              </h3>
              <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/20 border border-amber-400/40 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                <Lock className="w-3 h-3" />
                Private · Admin Only (Mlungiseni Mbhele)
              </span>
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/15 border border-emerald-500/35 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                <ShieldCheck className="w-3 h-3" />
                Active for All AAB Builds
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
              Package <code className="text-emerald-400 font-mono">{PLAY_UPLOAD_KEY_INFO.packageName}</code> · Alias{' '}
              <code className="text-amber-300 font-mono">{PLAY_UPLOAD_KEY_INFO.alias}</code> · Validity{' '}
              <span className="text-slate-200 font-semibold">10,000 days</span> ·{' '}
              <code className="text-slate-300 font-mono text-[11px]">{PLAY_UPLOAD_KEY_INFO.distinguishedName}</code>
            </p>
          </div>
        </div>

        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="min-h-[36px] min-w-[36px] rounded-xl border border-slate-800 bg-slate-900/80 text-slate-400 hover:text-white flex items-center justify-center transition shrink-0"
            aria-label="Hide upload key panel"
            title="Hide panel"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Download Action Buttons */}
      <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2.5">
        <button
          id="download-upload-certificate-pem-btn"
          type="button"
          onClick={() =>
            triggerProtectedAdminDownload(
              '/api/download-upload-certificate',
              PLAY_UPLOAD_KEY_INFO.certificateFile
            )
          }
          className="min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#FFD700] to-[#FF8C00] hover:brightness-105 text-slate-950 font-black text-xs px-4 py-2.5 shadow-lg shadow-amber-500/20 active:scale-[0.99] transition"
        >
          <FileCheck2 className="w-4 h-4 shrink-0" />
          <span>
            {downloadingFile === PLAY_UPLOAD_KEY_INFO.certificateFile
              ? 'Downloading upload_certificate.pem...'
              : 'Download upload_certificate.pem'}
          </span>
        </button>

        <button
          id="download-upload-keystore-jks-btn"
          type="button"
          onClick={() =>
            triggerProtectedAdminDownload(
              '/api/download-upload-keystore',
              PLAY_UPLOAD_KEY_INFO.keystoreFile
            )
          }
          className="min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl border border-amber-500/50 bg-slate-900 hover:bg-slate-800 text-amber-300 font-bold text-xs px-4 py-2.5 shadow active:scale-[0.99] transition"
        >
          <Download className="w-4 h-4 shrink-0" />
          <span>
            {downloadingFile === PLAY_UPLOAD_KEY_INFO.keystoreFile
              ? 'Downloading upload-keystore.jks...'
              : 'Download upload-keystore.jks'}
          </span>
        </button>
      </div>

      {downloadError && (
        <p className="text-xs text-red-400 font-medium">{downloadError}</p>
      )}

      {/* SHA-1 & SHA-256 Fingerprints */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs">
        <div className="rounded-xl border border-slate-800 bg-slate-950/90 p-3 space-y-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              SHA-1 Certificate Fingerprint
            </span>
            <button
              type="button"
              onClick={() => handleCopy(PLAY_UPLOAD_KEY_INFO.sha1, 'sha1')}
              className="inline-flex items-center gap-1 rounded-lg bg-slate-900 border border-slate-700 px-2 py-0.5 text-[10px] font-bold text-slate-300 hover:text-white transition"
            >
              {copiedField === 'sha1' ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
          <code className="block font-mono text-[11px] text-amber-300 break-all select-all">
            {PLAY_UPLOAD_KEY_INFO.sha1}
          </code>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950/90 p-3 space-y-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              SHA-256 Certificate Fingerprint
            </span>
            <button
              type="button"
              onClick={() => handleCopy(PLAY_UPLOAD_KEY_INFO.sha256, 'sha256')}
              className="inline-flex items-center gap-1 rounded-lg bg-slate-900 border border-slate-700 px-2 py-0.5 text-[10px] font-bold text-slate-300 hover:text-white transition"
            >
              {copiedField === 'sha256' ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
          <code className="block font-mono text-[11px] text-emerald-300 break-all select-all">
            {PLAY_UPLOAD_KEY_INFO.sha256}
          </code>
        </div>
      </div>
    </section>
  );
};
