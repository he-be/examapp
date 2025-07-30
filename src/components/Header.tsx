import { Link, useLocation } from 'react-router-dom';

export function Header() {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <header className="header">
      <div className="container">
        <nav role="navigation" aria-label="メインナビゲーション">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 'var(--spacing-md)',
            }}
          >
            <Link
              to="/"
              style={{
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: 'var(--color-primary)',
                textDecoration: 'none',
              }}
            >
              LLM評価テスト体験サイト
            </Link>

            <div
              style={{
                display: 'flex',
                gap: 'var(--spacing-lg)',
                alignItems: 'center',
              }}
            >
              <Link
                to="/"
                style={{
                  textDecoration: 'none',
                  color: isActive('/') ? 'var(--color-primary)' : 'var(--color-text)',
                  fontWeight: isActive('/') ? 'bold' : 'normal',
                }}
              >
                ホーム
              </Link>
              <Link
                to="/about"
                style={{
                  textDecoration: 'none',
                  color: isActive('/about') ? 'var(--color-primary)' : 'var(--color-text)',
                  fontWeight: isActive('/about') ? 'bold' : 'normal',
                }}
              >
                サイトについて
              </Link>
            </div>
          </div>
        </nav>
      </div>
    </header>
  );
}
