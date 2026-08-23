import { Component, type ErrorInfo, type ReactNode } from 'react';

/**
 * Last-resort guard so a render-time crash shows something instead of a blank page.
 *
 * It cannot catch errors thrown while modules are being evaluated (those happen
 * before React mounts — see `lib/env.ts` for the case that used to blank the app),
 * but it does cover everything from the first render onwards.
 */
export default class ErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Keep the component stack in the console: the on-screen message is deliberately
    // short, and the stack is what actually locates the fault.
    console.error('Unhandled render error:', error, info.componentStack);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)] p-6">
        <div className="w-full max-w-xl rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 sm:p-8">
          <p className="text-xs font-semibold tracking-widest text-amber-500 uppercase">Error</p>
          <h1 className="mt-2 text-xl font-semibold text-[var(--color-text)]">
            Something went wrong
          </h1>
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
            The page failed to render. The full stack is in the browser console.
          </p>
          <pre className="mt-4 overflow-x-auto rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-input-bg)] p-3 font-mono text-xs text-[var(--color-text)]">
            {error.message}
          </pre>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-amber-400"
          >
            Reload
          </button>
        </div>
      </div>
    );
  }
}
