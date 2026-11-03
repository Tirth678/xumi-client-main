import { Component, type ErrorInfo, type ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * Last-resort crash guard. Without this, any render error unmounts the whole
 * React tree and visitors get a blank white page with no way to recover.
 */
export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Unhandled UI error:", error, info.componentStack);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleHome = () => {
    window.location.assign("/");
  };

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6 text-foreground">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-card">
          <p className="font-body text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
            XUMI by RoboCraft
          </p>
          <h1 className="mt-2 font-display text-2xl font-black">Something went wrong</h1>
          <p className="mt-3 font-body text-sm text-muted-foreground">
            An unexpected error interrupted the page. Reloading usually fixes it. If you were
            placing a pre-order, check My order first — it may already be saved.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              onClick={this.handleReload}
              className="rounded-xl bg-primary px-5 py-3 font-display text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Reload page
            </button>
            <button
              onClick={this.handleHome}
              className="rounded-xl border border-border px-5 py-3 font-display text-sm font-bold transition-colors hover:bg-secondary"
            >
              Go to home
            </button>
          </div>
          <p className="mt-6 font-body text-xs text-muted-foreground">
            Still stuck? Email{" "}
            <a href="mailto:support@robocraft.com" className="underline">
              support@robocraft.com
            </a>
          </p>
        </div>
      </div>
    );
  }
}
