import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldAlert, X, AlertTriangle, CheckCircle2, Send, Loader2 } from 'lucide-react';
import { ReportReason, submitSafetyReport } from '../../services/safetyService';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportedUserId: string;
  reportedUserName?: string;
  messageId?: string | null;
  messageText?: string | null;
  onReportSubmitted?: () => void;
}

const REPORT_REASONS: ReportReason[] = [
  'Spam',
  'Harassment / Bullying',
  'Sexual Content',
  'Hate Speech',
  'Other',
];

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  reportedUserId,
  reportedUserName = 'this user',
  messageId,
  messageText,
  onReportSubmitted,
}) => {
  const [selectedReason, setSelectedReason] = useState<ReportReason>('Spam');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await submitSafetyReport({
        reportedUserId,
        messageId: messageId || null,
        messageText: messageText || null,
        reason: selectedReason,
        details,
      });

      setIsSuccess(true);
      onReportSubmitted?.();

      setTimeout(() => {
        setIsSuccess(false);
        setDetails('');
        onClose();
      }, 2200);
    } catch (err) {
      console.error('Failed to submit report:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-label="Report content or user"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={{ duration: 0.16 }}
          className="relative w-full max-w-md rounded-3xl border border-rose-500/30 bg-slate-950 text-white p-5 sm:p-6 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 transition"
            aria-label="Close report modal"
          >
            <X className="w-5 h-5" />
          </button>

          {isSuccess ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-white">Report Submitted</h3>
              <p className="text-xs text-slate-300 max-w-xs mx-auto leading-relaxed">
                Thanks, we received your report. Our team will review it.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center shrink-0">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white">
                    {messageId ? 'Report Message' : `Report ${reportedUserName}`}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Help us keep the AZ OVERVERSE community safe & respectful
                  </p>
                </div>
              </div>

              {/* Message quote if reporting a message */}
              {messageText && (
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 italic line-clamp-3">
                  &ldquo;{messageText}&rdquo;
                </div>
              )}

              {/* Reasons list */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  Select a Reason
                </label>
                <div className="space-y-1">
                  {REPORT_REASONS.map((reason) => (
                    <label
                      key={reason}
                      className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition text-xs font-medium ${
                        selectedReason === reason
                          ? 'border-amber-400 bg-amber-500/10 text-white'
                          : 'border-slate-800/80 bg-slate-900/60 text-slate-300 hover:bg-slate-900'
                      }`}
                    >
                      <span>{reason}</span>
                      <input
                        type="radio"
                        name="report-reason"
                        value={reason}
                        checked={selectedReason === reason}
                        onChange={() => setSelectedReason(reason)}
                        className="accent-amber-400 w-4 h-4"
                      />
                    </label>
                  ))}
                </div>
              </div>

              {/* Details textarea */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  Explain what happened <span className="font-normal text-slate-500">(optional)</span>
                </label>
                <textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Provide any additional context for our moderation team..."
                  rows={3}
                  maxLength={1000}
                  className="w-full rounded-xl bg-slate-900 border border-slate-800 p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl border border-slate-800 text-slate-300 hover:bg-slate-900 text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 hover:brightness-105 active:scale-95 text-white font-bold text-xs shadow-lg transition flex items-center gap-1.5 disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Submit Report</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
