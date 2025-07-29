import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="container" style={{ padding: 'var(--spacing-xl)' }}>
          <div className="card" style={{ textAlign: 'center' }}>
            <h1 style={{ color: 'var(--color-error)', marginBottom: 'var(--spacing-lg)' }}>
              申し訳ございません
            </h1>
            <p style={{ marginBottom: 'var(--spacing-lg)' }}>
              予期しないエラーが発生しました。ページを再読み込みしてお試しください。
            </p>
            <button className="btn btn-primary" onClick={() => globalThis.location.reload()}>
              ページを再読み込み
            </button>
            {import.meta.env.DEV && this.state.error && (
              <details style={{ marginTop: 'var(--spacing-lg)', textAlign: 'left' }}>
                <summary>詳細なエラー情報（開発モード）</summary>
                <pre
                  style={{
                    background: 'var(--color-surface)',
                    padding: 'var(--spacing-md)',
                    borderRadius: 'var(--border-radius)',
                    overflow: 'auto',
                    fontSize: '0.875rem',
                  }}
                >
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
