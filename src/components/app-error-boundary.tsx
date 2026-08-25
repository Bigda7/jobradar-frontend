import { Component, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface AppErrorBoundaryProps {
  children: ReactNode;
}

interface AppErrorBoundaryState {
  hasError: boolean;
}

export class AppErrorBoundary extends Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  state: AppErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true };
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <main className="grid min-h-screen place-items-center bg-canvas p-6 text-center text-zinc-100">
        <div className="max-w-md rounded-2xl border border-rose-400/15 bg-rose-400/[0.04] p-7">
          <AlertTriangle className="mx-auto h-7 w-7 text-rose-300" />
          <h1 className="mt-4 text-lg font-semibold">Unable to render JobRadar</h1>
          <p className="mt-2 text-sm leading-6 text-zinc-500">
            The application encountered an unexpected client error. Reload to
            request a fresh application bundle and API state.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-5 inline-flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.04] px-4 py-2 text-sm text-zinc-200 hover:bg-white/[0.07]"
          >
            <RefreshCw className="h-4 w-4" />
            Reload application
          </button>
        </div>
      </main>
    );
  }
}
