import { Component, type ErrorInfo, type ReactNode } from 'react';
import ErrorFallback from './ErrorFallback';

type Props = {
  children: ReactNode;
  fallback?: (reset: () => void) => ReactNode;
  resetKey?: string;
};
type State = { error: Error | null };

/** Catches render errors in a subtree; resets when `resetKey` changes (e.g. the route path). */
export default class ErrorBoundary extends Component<Props, State> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    if (import.meta.env.DEV) console.error('[ErrorBoundary]', error, info.componentStack);
  }

  override componentDidUpdate(prev: Props): void {
    if (this.state.error && prev.resetKey !== this.props.resetKey) this.reset();
  }

  reset = (): void => this.setState({ error: null });

  override render(): ReactNode {
    if (this.state.error) {
      return this.props.fallback ? (
        this.props.fallback(this.reset)
      ) : (
        <ErrorFallback onReset={this.reset} />
      );
    }
    return this.props.children;
  }
}
