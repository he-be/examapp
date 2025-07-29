# LLM評価テスト体験サイト：システム設計書

## 1. 概要

本設計書は、要件定義書に基づいて「LLM評価テスト体験サイト」のシステム設計を詳細に定義します。本システムは、MMLU、GSM-8K等の主要なLLM評価ベンチマークを一般ユーザーが体験できるWebプラットフォームです。

### 1.1 設計原則

- **Workers-First統合アーキテクチャ**: 単一のCloudflare Workerですべてを処理
- **ステートレス設計**: サーバーサイドでの状態保存を行わず、クライアントサイドのlocalStorageで管理
- **グローバルエッジデリバリー**: Cloudflareのグローバルネットワークを活用した低遅延配信

## 2. システムアーキテクチャ

### 2.1 全体アーキテクチャ

```
[ユーザー] ←→ [Cloudflare Edge] ←→ [Cloudflare Worker]
                      ↓
              [静的アセット配信]
                      ↓
              [問題データ(JSON)]
```

### 2.2 コンポーネント構成

#### 2.2.1 フロントエンド層
- **技術スタック**: TypeScript + React/Vue/Svelte
- **責務**: 
  - ユーザーインターフェースの提供
  - テスト進行の管理
  - ローカル状態管理（localStorage）
  - 入力検証と正誤判定

#### 2.2.2 エッジ層（Cloudflare Worker）
- **技術スタック**: TypeScript on Cloudflare Workers Runtime
- **責務**:
  - 静的アセット配信の制御
  - APIエンドポイントの処理
  - リクエストルーティング

#### 2.2.3 データ層
- **問題データ**: 静的JSONファイル（/dist/questions/）
- **ユーザー状態**: ブラウザのlocalStorage

## 3. 詳細設計

### 3.1 フロントエンド設計

#### 3.1.1 ページ構成
```
/                    - トップページ（ベンチマーク一覧）
/test/mmlu          - MMLUテストページ
/test/gsm8k         - GSM-8Kテストページ
/test/hellaswag     - HellaSwagテストページ
/test/bigbench      - BIG-Bench-Hardテストページ
/test/drop          - DROPテストページ
/results            - 結果表示ページ
/about              - サイト説明ページ
```

#### 3.1.2 コンポーネント設計

**主要コンポーネント**:
- `App`: ルートコンポーネント、ルーティング管理
- `TestSelector`: ベンチマーク選択画面
- `TestInterface`: テスト実行インターフェース
- `QuestionRenderer`: 問題表示コンポーネント
- `ResultsDisplay`: 結果表示コンポーネント
- `ProgressTracker`: 進捗管理コンポーネント

**共通コンポーネント**:
- `Header`: ナビゲーションヘッダー
- `Footer`: フッター
- `LoadingSpinner`: ローディング表示
- `ErrorBoundary`: エラーハンドリング

#### 3.1.3 状態管理設計

**グローバル状態**:
```typescript
interface AppState {
  currentTest: TestType | null;
  testMode: 'practice' | 'test';
  userProgress: UserProgress;
  testResults: TestResults[];
}

interface UserProgress {
  testId: string;
  startTime: number;
  currentQuestionIndex: number;
  answers: Record<string, UserAnswer>;
  timeRemaining?: number;
}

interface UserAnswer {
  questionId: string;
  userAnswer: string | number;
  isCorrect: boolean;
  timeSpent: number;
}
```

**localStorage構造**:
```typescript
interface StoredData {
  llmTestProgress: UserProgress;
  llmTestHistory: TestResults[];
  userPreferences: {
    language: 'ja' | 'en';
    theme: 'light' | 'dark';
  };
}
```

### 3.2 バックエンド設計（Cloudflare Worker）

#### 3.2.1 エントリーポイント設計

```typescript
// src/index.ts の構造
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    
    // APIルーティング
    if (url.pathname.startsWith('/api/')) {
      return handleApiRequest(request, env);
    }
    
    // 静的アセットは自動処理される
    // SPAルーティングも wrangler.toml の spa 設定で処理される
    
    return new Response('Not Found', { status: 404 });
  }
};
```

#### 3.2.2 APIエンドポイント設計

**POST /api/feedback**
- 目的: ユーザーフィードバックの収集
- リクエスト形式:
```typescript
interface FeedbackRequest {
  testId: string;
  questionId?: string;
  feedbackText: string;
  userScore?: number;
  metadata?: Record<string, any>;
}
```

**GET /api/health**
- 目的: システムヘルスチェック
- レスポンス: `{ status: 'ok', timestamp: number }`

### 3.3 データ設計

#### 3.3.1 問題データ構造

**MMLU問題形式**:
```typescript
interface MMLUQuestion {
  id: string;
  category: string;
  question: string;
  choices: string[];
  correctAnswer: number;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
}
```

**GSM-8K問題形式**:
```typescript
interface GSM8KQuestion {
  id: string;
  question: string;
  correctAnswer: number;
  explanation: string;
  chainOfThought: string[];
  unit?: string;
}
```

**共通問題インターフェース**:
```typescript
interface BaseQuestion {
  id: string;
  type: 'multiple-choice' | 'numeric' | 'text';
  question: string;
  correctAnswer: string | number;
  explanation: string;
  metadata?: Record<string, any>;
}
```

#### 3.3.2 ファイル構造

```
/dist/questions/
├── mmlu/
│   ├── mathematics.json
│   ├── history.json
│   └── computer_science.json
├── gsm8k/
│   └── problems.json
├── hellaswag/
│   └── scenarios.json
├── bigbench/
│   └── hard_tasks.json
└── drop/
    └── passages.json
```

## 4. ユーザーインターフェース設計

### 4.1 画面遷移フロー

```
[トップページ] → [テスト選択] → [モード選択] → [テスト実行] → [結果表示]
      ↓              ↓              ↓              ↓
   [サイト説明]   [テスト詳細]   [設定変更]    [復習モード]
```

### 4.2 レスポンシブデザイン

**ブレークポイント**:
- Mobile: ~768px
- Tablet: 768px~1024px  
- Desktop: 1024px~

**主要レイアウト**:
- モバイル: 単一カラム、タッチ操作最適化
- タブレット: 2カラム、タッチ＋マウス対応
- デスクトップ: 3カラム、キーボードショートカット対応

### 4.3 アクセシビリティ設計

**WCAG 2.1 AA準拠**:
- セマンティックHTML使用
- キーボードナビゲーション対応
- スクリーンリーダー対応
- 色覚多様性への配慮
- 適切なコントラスト比の確保

## 5. パフォーマンス設計

### 5.1 フロントエンド最適化

**バンドル最適化**:
- コード分割（Route-based splitting）
- Tree shaking
- 動的インポート
- 画像最適化

**キャッシュ戦略**:
- 静的アセット: 長期キャッシュ（1年）
- 問題データ: 中期キャッシュ（1日）
- APIレスポンス: 短期キャッシュ（5分）

### 5.2 エッジ最適化

**Cloudflare最適化**:
- 自動圧縮（Gzip/Brotli）
- 画像最適化（Polish）
- ミニフィケーション
- HTTP/2 Push

**目標パフォーマンス**:
- LCP: < 2.5秒
- FID: < 100ms
- CLS: < 0.1

## 6. セキュリティ設計

### 6.1 フロントエンドセキュリティ

**入力検証**:
- クライアントサイド検証
- XSS対策（DOMPurify使用）
- CSRF対策（SameSite Cookie）

**データ保護**:
- localStorage暗号化（機密データなし）
- セッション管理（タイムアウト設定）

### 6.2 エッジセキュリティ

**Cloudflareセキュリティ**:
- DDoS保護（自動）
- WAF（Web Application Firewall）
- Rate Limiting
- Bot Management

**APIセキュリティ**:
- CORS設定
- Content-Type検証
- リクエストサイズ制限

## 7. 監視・運用設計

### 7.1 ログ設計

**フロントエンドログ**:
- エラーログ（コンソール出力）
- ユーザーアクションログ（分析用）
- パフォーマンスメトリクス

**バックエンドログ**:
- APIアクセスログ
- エラーログ
- パフォーマンスメトリクス

### 7.2 監視項目

**可用性監視**:
- エンドポイント死活監視
- レスポンス時間監視
- エラー率監視

**パフォーマンス監視**:
- Web Vitals
- リソース使用量
- キャッシュヒット率

## 8. デプロイ設計

### 8.1 CI/CDパイプライン

**GitHub Actions ワークフロー**:
1. コードチェックアウト
2. 依存関係インストール
3. リント・テスト実行
4. ビルド実行
5. Cloudflare Workersデプロイ

**環境管理**:
- Development: 開発用ブランチ
- Staging: mainブランチ（自動デプロイ）
- Production: タグベースデプロイ

### 8.2 設定管理

**wrangler.toml設定**:
```toml
name = "llm-test-experience"
compatibility_date = "2025-04-08"
main = "src/index.ts"

[assets]
directory = "./dist"
spa = "./dist/index.html"

[dev]
port = 8787
ip = "0.0.0.0"
```

## 9. テスト設計

### 9.1 テスト戦略

**単体テスト**:
- コンポーネントテスト（Jest + Testing Library）
- ユーティリティ関数テスト
- API関数テスト

**統合テスト**:
- ページ遷移テスト
- API統合テスト
- localStorage連携テスト

**E2Eテスト**:
- ユーザーシナリオテスト（Playwright）
- クロスブラウザテスト
- パフォーマンステスト

### 9.2 テスト環境

**ローカル開発**:
- `wrangler dev` でローカルWorker起動
- Hot reload対応
- デバッグ機能

**ステージング**:
- 本番同等環境
- 自動テスト実行
- パフォーマンス計測

## 10. 国際化設計

### 10.1 多言語対応

**対応言語**:
- 日本語（初期リリース）
- 英語（将来対応）

**実装方式**:
- i18next使用
- 言語ファイル分離
- 動的言語切り替え

### 10.2 ローカライゼーション

**地域対応**:
- 日付・時刻フォーマット
- 数値フォーマット
- 通貨表示（将来機能）

## 11. 拡張性設計

### 11.1 新ベンチマーク追加

**プラグイン設計**:
- ベンチマーク抽象化
- 設定ベース追加
- 動的ロード対応

### 11.2 機能拡張

**将来機能**:
- ユーザーアカウント（D1データベース使用）
- ランキング機能
- ソーシャル機能
- カスタムテスト作成

## 12. 制約事項

### 12.1 技術的制約

- Cloudflare Workers実行時間制限（CPU時間）
- localStorage容量制限（5-10MB）
- ステートレス設計による機能制限

### 12.2 機能的制約

- クロスデバイス同期不可
- オフライン機能なし
- リアルタイム協調機能なし

## 13. 移行・展開計画

### 13.1 段階的リリース

**Phase 1**: 基本機能（MMLU、GSM-8K）
**Phase 2**: 追加ベンチマーク（HellaSwag、BIG-Bench-Hard、DROP）
**Phase 3**: 高度な機能（分析、比較）
**Phase 4**: ソーシャル機能（将来）

### 13.2 リスク管理

**技術リスク**:
- Cloudflareプラットフォーム変更
- ブラウザ互換性問題
- パフォーマンス劣化

**対策**:
- 定期的なプラットフォーム情報確認
- クロスブラウザテスト強化
- 継続的パフォーマンス監視

---

本設計書は、要件定義書に基づいてLLM評価テスト体験サイトの技術的実装を詳細に定義しています。実装チームは本設計書を基に、段階的な開発を進めることができます。