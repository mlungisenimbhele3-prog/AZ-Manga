import React from 'react';
import { CheckCircle2, AlertCircle, Info, X, Heart, Sparkles } from 'lucide-react';

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  type?: 'success' | 'info' | 'favorite' | 'vip' | 'warning';
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0">
      {toasts.map((toast, idx) => {
        let IconComponent = CheckCircle2;
        let iconColor = 'text-emerald-400';
        let borderColor = 'border-emerald-500/30';
        let bgGradient = 'from-emerald-950/90 to-slate-900/90';

        if (toast.type === 'favorite') {
          IconComponent = Heart;
          iconColor = 'text-rose-400 fill-rose-500';
          borderColor = 'border-rose-500/40';
          bgGradient = 'from-rose-950/90 to-slate-900/90';
        } else if (toast.type === 'vip') {
          IconComponent = Sparkles;
          iconColor = 'text-amber-400';
          borderColor = 'border-amber-500/40';
          bgGradient = 'from-amber-950/90 to-slate-900/90';
        } else if (toast.type === 'warning') {
          IconComponent = AlertCircle;
          iconColor = 'text-amber-400';
          borderColor = 'border-amber-500/30';
          bgGradient = 'from-slate-900/95 to-slate-950/95';
        } else if (toast.type === 'info') {
          IconComponent = Info;
          iconColor = 'text-blue-400';
          borderColor = 'border-blue-500/30';
          bgGradient = 'from-blue-950/90 to-slate-900/90';
        }

        return (
          <div
            key={`toast-msg-${toast.id}-${idx}`}
            className={`pointer-events-auto flex items-start gap-3 rounded-2xl border ${borderColor} bg-gradient-to-r ${bgGradient} p-4 shadow-xl backdrop-blur-md text-white transition-all duration-300 animate-in fade-in slide-in-from-bottom-3`}
          >
            <IconComponent className={`w-5 h-5 flex-shrink-0 mt-0.5 ${iconColor}`} />
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold text-white tracking-wide">{toast.title}</h4>
              {toast.description && (
                <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                  {toast.description}
                </p>
              )}
            </div>
            <button
              onClick={() => onDismiss(toast.id)}
              className="text-slate-400 hover:text-white transition p-0.5 rounded-lg"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
