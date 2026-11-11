import { Component, type ErrorInfo, type ReactNode } from 'react';
import styles from './ErrorBoundary.module.css';

/** If something throws while rendering, show a way back instead of a blank screen. Data is untouched. */
export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Message and stack only: nothing from storage, so no token or key can end up here.
    console.error(error.message, info.componentStack);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className={styles.wrap} role="alert">
        <h1 className={styles.title}>Something went wrong</h1>
        <p className={styles.body}>Your books are safe on this device. Reloading usually fixes it.</p>
        <button type="button" className={styles.button} onClick={() => window.location.reload()}>
          Reload
        </button>
      </div>
    );
  }
}
