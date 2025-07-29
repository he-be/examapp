import { useParams, Link } from 'react-router-dom';

const benchmarkInfo = {
  mmlu: {
    name: 'MMLU',
    fullName: 'Massive Multitask Language Understanding',
    description: '57の多様な分野から出題される多肢選択式クイズ',
  },
  gsm8k: {
    name: 'GSM-8K',
    fullName: 'Grade School Math 8K',
    description: '小学校レベルの算数知識で解ける多段階思考問題',
  },
  hellaswag: {
    name: 'HellaSwag',
    fullName: 'Hard Endings for Large Language Models',
    description: '日常的なシナリオの常識的な結末を選択する問題',
  },
  bigbench: {
    name: 'BIG-Bench-Hard',
    fullName: 'Beyond the Imitation Game Benchmark - Hard',
    description: '現在のLLMが特に苦手とする高度な推論問題',
  },
  drop: {
    name: 'DROP',
    fullName: 'Discrete Reasoning Over Paragraphs',
    description: '長文読解に基づく情報抽出・加工問題',
  },
};

export function TestPage() {
  const { benchmark } = useParams<{ benchmark: string }>();

  if (!benchmark || !benchmarkInfo[benchmark as keyof typeof benchmarkInfo]) {
    return (
      <div className="container">
        <div className="card" style={{ textAlign: 'center' }}>
          <h1 style={{ color: 'var(--color-error)', marginBottom: 'var(--spacing-lg)' }}>
            ベンチマークが見つかりません
          </h1>
          <p style={{ marginBottom: 'var(--spacing-lg)' }}>
            指定されたベンチマークは存在しません。
          </p>
          <Link to="/" className="btn btn-primary">
            ホームに戻る
          </Link>
        </div>
      </div>
    );
  }

  const info = benchmarkInfo[benchmark as keyof typeof benchmarkInfo];

  return (
    <div className="container">
      <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-2xl)' }}>
        <h1
          style={{
            fontSize: '2.5rem',
            marginBottom: 'var(--spacing-md)',
            color: 'var(--color-primary)',
          }}
        >
          {info.name}
        </h1>
        <p
          style={{
            fontSize: '1.125rem',
            color: 'var(--color-text-secondary)',
            marginBottom: 'var(--spacing-sm)',
          }}
        >
          {info.fullName}
        </p>
        <p style={{ fontSize: '1rem', lineHeight: 1.6 }}>{info.description}</p>
      </div>

      <div className="card" style={{ textAlign: 'center' }}>
        <h2 style={{ marginBottom: 'var(--spacing-lg)' }}>実装中</h2>
        <p style={{ marginBottom: 'var(--spacing-lg)' }}>
          {info.name}ベンチマークは現在実装中です。 完成まで今しばらくお待ちください。
        </p>
        <div style={{ display: 'flex', gap: 'var(--spacing-md)', justifyContent: 'center' }}>
          <Link to="/" className="btn btn-secondary">
            ホームに戻る
          </Link>
          <button className="btn btn-primary" disabled>
            テストを開始（準備中）
          </button>
        </div>
      </div>
    </div>
  );
}
