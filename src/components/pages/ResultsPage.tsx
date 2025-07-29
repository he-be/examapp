import { Link } from 'react-router-dom'

export function ResultsPage() {
  return (
    <div className="container">
      <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-2xl)' }}>
        <h1 style={{ 
          fontSize: '2.5rem', 
          marginBottom: 'var(--spacing-lg)',
          color: 'var(--color-text)'
        }}>
          テスト結果
        </h1>
        <p style={{ 
          fontSize: '1.125rem', 
          color: 'var(--color-text-secondary)',
          lineHeight: 1.6
        }}>
          こちらのページではテスト結果を表示します。
        </p>
      </div>

      <div className="card" style={{ textAlign: 'center' }}>
        <h2 style={{ marginBottom: 'var(--spacing-lg)' }}>
          実装中
        </h2>
        <p style={{ marginBottom: 'var(--spacing-lg)' }}>
          結果表示機能は現在実装中です。
          完成まで今しばらくお待ちください。
        </p>
        <Link to="/" className="btn btn-primary">
          ホームに戻る
        </Link>
      </div>
    </div>
  )
}