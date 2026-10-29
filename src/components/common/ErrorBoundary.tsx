import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RefreshCw } from 'lucide-react';
import { APP_LOGO_SRC } from './KAAfricaLogo';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorMessage: '',
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      errorMessage: error?.message || 'Unexpected rendering error',
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[AZ OVERVERSE ErrorBoundary]:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, errorMessage: '' });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-[60vh] w-full items-center justify-center bg-[#0a0d14] p-6 text-center text-white">
          <div className="max-w-md rounded-2xl border border-slate-800 bg-slate-950 p-6 sm:p-8 space-y-5 shadow-2xl">
            <img
              src={APP_LOGO_SRC}
              alt="AZ OVERVERSE"
              className="mx-auto h-14 w-14 rounded-full bg-black object-contain"
            />
            <div className="space-y-1.5">
              <h2 className="text-xl font-bold text-white">View Interrupted</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                A temporary rendering issue was caught safely so your reading progress and account remain intact.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={this.handleReset}
                className="min-h-[44px] w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 px-5 py-2.5 text-xs font-bold text-black transition"
              >
                <RefreshCw className="w-3.5 h-3.5 shrink-0" />
                <span>Try Again</span>
              </button>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="min-h-[44px] w-full sm:w-auto rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 px-5 py-2.5 text-xs font-semibold text-slate-200 transition"
              >
                Reload App
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
