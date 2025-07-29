import { Link } from 'react-router-dom';

const benchmarks = [
  {
    id: 'mmlu',
    name: 'MMLU',
    fullName: 'Massive Multitask Language Understanding',
    description: '57の多様な分野から出題される多肢選択式クイズ',
    difficulty: '中級',
    estimatedTime: '15-30分',
    questionCount: '10-20問',
    color: '#007acc',
  },
  {
    id: 'gsm8k',
    name: 'GSM-8K',
    fullName: 'Grade School Math 8K',
    description: '小学校レベルの算数知識で解ける多段階思考問題',
    difficulty: '初級',
    estimatedTime: '10-20分',
    questionCount: '10-15問',
    color: '#28a745',
  },
  {
    id: 'hellaswag',
    name: 'HellaSwag',
    fullName: 'Hard Endings for Large Language Models',
    description: '日常的なシナリオの常識的な結末を選択する問題',
    difficulty: '中級',
    estimatedTime: '15-25分',
    questionCount: '15-20問',
    color: '#ffc107',
  },
  {
    id: 'bigbench',
    name: 'BIG-Bench-Hard',
    fullName: 'Beyond the Imitation Game Benchmark - Hard',
    description: '現在のLLMが特に苦手とする高度な推論問題',
    difficulty: '上級',
    estimatedTime: '20-40分',
    questionCount: '10-15問',
    color: '#dc3545',
  },
  {
    id: 'drop',
    name: 'DROP',
    fullName: 'Discrete Reasoning Over Paragraphs',
    description: '長文読解に基づく情報抽出・加工問題',
    difficulty: '中級',
    estimatedTime: '20-35分',
    questionCount: '10-15問',
    color: '#6f42c1',
  },
];

export function HomePage() {
  return (
    <div className="container">
      <section style={{ textAlign: 'center', marginBottom: 'var(--spacing-2xl)' }}>
        <h1
          style={{
            fontSize: '2.5rem',
            marginBottom: 'var(--spacing-lg)',
            color: 'var(--color-text)',
          }}
        >
          LLM評価ベンチマークを体験しよう
        </h1>
        <p
          style={{
            fontSize: '1.125rem',
            color: 'var(--color-text-secondary)',
            maxWidth: '800px',
            margin: '0 auto',
            lineHeight: 1.6,
          }}
        >
          MMLU、GSM-8K等の主要なLLM評価ベンチマークを実際に体験することで、
          AIの能力と限界を直感的に理解できます。練習モードとテストモードを選択して、
          あなた自身のパフォーマンスを測定してみましょう。
        </p>
      </section>

      <section>
        <h2
          style={{
            fontSize: '2rem',
            textAlign: 'center',
            marginBottom: 'var(--spacing-xl)',
            color: 'var(--color-text)',
          }}
        >
          利用可能なベンチマーク
        </h2>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
            gap: 'var(--spacing-lg)',
          }}
        >
          {benchmarks.map((benchmark) => (
            <div
              key={benchmark.id}
              className="card"
              style={{
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              }}
            >
              <div
                style={{
                  borderTop: `4px solid ${benchmark.color}`,
                  marginTop: 'calc(-1 * var(--spacing-lg))',
                  marginBottom: 'var(--spacing-md)',
                }}
              />

              <h3
                style={{
                  fontSize: '1.5rem',
                  marginBottom: 'var(--spacing-sm)',
                  color: benchmark.color,
                }}
              >
                {benchmark.name}
              </h3>

              <p
                style={{
                  fontSize: '0.875rem',
                  color: 'var(--color-text-secondary)',
                  marginBottom: 'var(--spacing-sm)',
                }}
              >
                {benchmark.fullName}
              </p>

              <p
                style={{
                  marginBottom: 'var(--spacing-md)',
                  lineHeight: 1.5,
                }}
              >
                {benchmark.description}
              </p>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 'var(--spacing-sm)',
                  marginBottom: 'var(--spacing-lg)',
                  fontSize: '0.875rem',
                }}
              >
                <div>
                  <strong>難易度:</strong> {benchmark.difficulty}
                </div>
                <div>
                  <strong>所要時間:</strong> {benchmark.estimatedTime}
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <strong>問題数:</strong> {benchmark.questionCount}
                </div>
              </div>

              <Link
                to={`/test/${benchmark.id}`}
                className="btn btn-primary"
                style={{ width: '100%' }}
              >
                {benchmark.name}を体験する
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section
        style={{
          textAlign: 'center',
          marginTop: 'var(--spacing-2xl)',
          padding: 'var(--spacing-xl)',
          background: 'var(--color-surface)',
          borderRadius: 'var(--border-radius)',
        }}
      >
        <h2 style={{ marginBottom: 'var(--spacing-lg)' }}>体験モードについて</h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: 'var(--spacing-lg)',
            maxWidth: '800px',
            margin: '0 auto',
          }}
        >
          <div>
            <h3 style={{ color: 'var(--color-primary)', marginBottom: 'var(--spacing-sm)' }}>
              練習モード
            </h3>
            <p>
              時間制限なしで各問題に即座にフィードバックと解説が表示されます。 学習目的に最適です。
            </p>
          </div>
          <div>
            <h3 style={{ color: 'var(--color-primary)', marginBottom: 'var(--spacing-sm)' }}>
              テストモード
            </h3>
            <p>
              時間制限ありでテスト終了後にスコアサマリーが表示されます。
              実際の評価体験に近い形式です。
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
