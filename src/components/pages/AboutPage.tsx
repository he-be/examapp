export function AboutPage() {
  return (
    <div className="container">
      <article style={{ maxWidth: '800px', margin: '0 auto' }}>
        <header style={{ textAlign: 'center', marginBottom: 'var(--spacing-2xl)' }}>
          <h1
            style={{
              fontSize: '2.5rem',
              marginBottom: 'var(--spacing-lg)',
              color: 'var(--color-text)',
            }}
          >
            サイトについて
          </h1>
          <p
            style={{
              fontSize: '1.125rem',
              color: 'var(--color-text-secondary)',
              lineHeight: 1.6,
            }}
          >
            LLM評価テスト体験サイトは、AIリテラシー向上を目的とした教育プラットフォームです。
          </p>
        </header>

        <section className="card" style={{ marginBottom: 'var(--spacing-xl)' }}>
          <h2
            style={{
              fontSize: '1.75rem',
              marginBottom: 'var(--spacing-lg)',
              color: 'var(--color-primary)',
            }}
          >
            プロジェクトの目的
          </h2>
          <p style={{ marginBottom: 'var(--spacing-md)', lineHeight: 1.6 }}>
            大規模言語モデル（LLM）の評価プロセスは、学術論文や技術文書で語られることが多く、
            一般には不透明な領域です。本サイトは、このプロセスを可視化し、
            体験可能なものとすることで、LLMへの理解を深める教育的役割を担います。
          </p>
          <p style={{ lineHeight: 1.6 }}>
            ユーザーがLLMの能力を評価するテストを自ら体験することで、
            その性能と限界を直感的に理解し、AIリテラシーの向上に貢献することが本サイトの主目的です。
          </p>
        </section>

        <section className="card" style={{ marginBottom: 'var(--spacing-xl)' }}>
          <h2
            style={{
              fontSize: '1.75rem',
              marginBottom: 'var(--spacing-lg)',
              color: 'var(--color-primary)',
            }}
          >
            対象ユーザー
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 'var(--spacing-lg)',
            }}
          >
            <div>
              <h3 style={{ color: 'var(--color-text)', marginBottom: 'var(--spacing-sm)' }}>
                一般ユーザー
              </h3>
              <p style={{ fontSize: '0.875rem', lineHeight: 1.5 }}>
                AIやLLMに興味はあるが、専門知識は持たない方。 LLMの能力を直感的に理解したい方。
              </p>
            </div>
            <div>
              <h3 style={{ color: 'var(--color-text)', marginBottom: 'var(--spacing-sm)' }}>
                教育関係者
              </h3>
              <p style={{ fontSize: '0.875rem', lineHeight: 1.5 }}>
                AIに関する授業や教材として本サイトを活用し、 生徒のAIリテラシー向上を目指す方。
              </p>
            </div>
            <div>
              <h3 style={{ color: 'var(--color-text)', marginBottom: 'var(--spacing-sm)' }}>
                開発者・研究者
              </h3>
              <p style={{ fontSize: '0.875rem', lineHeight: 1.5 }}>
                LLM評価の補助ツールとして、 ベンチマークの内容を迅速に確認する目的で利用する方。
              </p>
            </div>
            <div>
              <h3 style={{ color: 'var(--color-text)', marginBottom: 'var(--spacing-sm)' }}>
                学生
              </h3>
              <p style={{ fontSize: '0.875rem', lineHeight: 1.5 }}>
                AIやコンピュータサイエンスを学ぶ学生が、 実践的な体験学習の一環として利用。
              </p>
            </div>
          </div>
        </section>

        <section className="card" style={{ marginBottom: 'var(--spacing-xl)' }}>
          <h2
            style={{
              fontSize: '1.75rem',
              marginBottom: 'var(--spacing-lg)',
              color: 'var(--color-primary)',
            }}
          >
            技術的特徴
          </h2>
          <ul style={{ lineHeight: 1.6, paddingLeft: 'var(--spacing-lg)' }}>
            <li style={{ marginBottom: 'var(--spacing-sm)' }}>
              <strong>Workers-First統合アーキテクチャ:</strong>
              単一のCloudflare Workerですべての処理を統合し、 シンプルで高性能なアーキテクチャを実現
            </li>
            <li style={{ marginBottom: 'var(--spacing-sm)' }}>
              <strong>ステートレス設計:</strong>
              ユーザーの状態はクライアントサイドのlocalStorageで管理し、
              プライバシー保護と簡潔性を両立
            </li>
            <li style={{ marginBottom: 'var(--spacing-sm)' }}>
              <strong>グローバルエッジデリバリー:</strong>
              Cloudflareのグローバルネットワークによる低遅延配信
            </li>
            <li style={{ marginBottom: 'var(--spacing-sm)' }}>
              <strong>アクセシビリティ対応:</strong>
              WCAG 2.1 AAレベルに準拠したユニバーサルデザイン
            </li>
          </ul>
        </section>

        <section className="card" style={{ marginBottom: 'var(--spacing-xl)' }}>
          <h2
            style={{
              fontSize: '1.75rem',
              marginBottom: 'var(--spacing-lg)',
              color: 'var(--color-primary)',
            }}
          >
            利用可能なベンチマーク
          </h2>
          <div style={{ display: 'grid', gap: 'var(--spacing-md)' }}>
            <div>
              <h3 style={{ color: 'var(--color-text)', marginBottom: 'var(--spacing-sm)' }}>
                MMLU (Massive Multitask Language Understanding)
              </h3>
              <p style={{ fontSize: '0.875rem', lineHeight: 1.5 }}>
                57の多様な分野（基礎数学、米国の歴史、コンピュータサイエンス、法律など）から
                出題される多肢選択式クイズ
              </p>
            </div>
            <div>
              <h3 style={{ color: 'var(--color-text)', marginBottom: 'var(--spacing-sm)' }}>
                GSM-8K (Grade School Math 8K)
              </h3>
              <p style={{ fontSize: '0.875rem', lineHeight: 1.5 }}>
                小学校レベルの算数知識で解けるが、多段階の思考・計算を必要とする問題
              </p>
            </div>
            <div>
              <h3 style={{ color: 'var(--color-text)', marginBottom: 'var(--spacing-sm)' }}>
                HellaSwag (Hard Endings for Large Language Models)
              </h3>
              <p style={{ fontSize: '0.875rem', lineHeight: 1.5 }}>
                日常的なシナリオの文脈を提示し、常識的に最もあり得る続きを選択させる問題
              </p>
            </div>
            <div>
              <h3 style={{ color: 'var(--color-text)', marginBottom: 'var(--spacing-sm)' }}>
                BIG-Bench-Hard
              </h3>
              <p style={{ fontSize: '0.875rem', lineHeight: 1.5 }}>
                現在のLLMが特に苦手とする、高度な推論能力を要する23のタスクから代表例を出題
              </p>
            </div>
            <div>
              <h3 style={{ color: 'var(--color-text)', marginBottom: 'var(--spacing-sm)' }}>
                DROP (Discrete Reasoning Over Paragraphs)
              </h3>
              <p style={{ fontSize: '0.875rem', lineHeight: 1.5 }}>
                提示された段落を読み、数値計算や日付比較など、
                テキストから情報を抽出・加工して解答する必要がある問題
              </p>
            </div>
          </div>
        </section>

        <section className="card">
          <h2
            style={{
              fontSize: '1.75rem',
              marginBottom: 'var(--spacing-lg)',
              color: 'var(--color-primary)',
            }}
          >
            プライバシーとデータ管理
          </h2>
          <p style={{ marginBottom: 'var(--spacing-md)', lineHeight: 1.6 }}>
            本サイトではユーザーのプライバシー保護を最優先に考え、
            テストの進捗やスコアなどの個人データは一切サーバーに保存されません。
            すべての情報はブラウザのlocalStorageに保存され、 ユーザーが完全にコントロールできます。
          </p>
          <p style={{ lineHeight: 1.6 }}>
            この設計により、データ漏洩のリスクが構造的に低減され、 安心してご利用いただけます。
          </p>
        </section>
      </article>
    </div>
  );
}
