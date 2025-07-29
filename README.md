# examapp

AI駆動開発最適化済み Cloudflare Workers プロジェクト

## 🤖 AI-Driven Development Features

- **4層検証システム**: 静的解析 → 単体テスト → E2E → 品質ゲート
- **自己修正型環境**: AIエージェントが自律的に品質チェック
- **統一アーキテクチャ**: Cloudflare Workers単一実装
- **高速フィードバック**: Vite + Miniflare + Vitest統合

## 🚀 Quick Start

```bash
npm install
npm run dev          # 開発サーバー起動 (http://localhost:8787)
```

## 🔧 Development Commands

### 必須検証シーケンス
```bash
npm run typecheck    # TypeScript型チェック
npm run lint         # ESLint静的解析  
npm run test:unit    # Vitest単体テスト
npm run test:e2e     # Playwright E2E（必要に応じて）
```

### その他のコマンド
```bash
npm run build        # プロジェクトビルド
npm run deploy       # Cloudflareにデプロイ
npm run format       # Prettierフォーマット
npm run test:coverage # カバレッジレポート生成
```

## 🛠 Project Structure

```
examapp/
├── src/
│   ├── index.ts           # メインWorkerファイル
│   └── __tests__/
│       └── index.test.ts  # 単体テスト
├── e2e/
│   └── sample.spec.ts     # E2Eテスト
├── .github/workflows/
│   └── ci.yml            # GitHub Actions CI/CD
├── vite.config.ts        # Vite + Vitest設定
├── playwright.config.ts  # Playwright設定
├── wrangler.toml        # Cloudflare Workers設定
└── CLAUDE.md           # AI開発コンテキスト
```

## 🔄 CI/CD Pipeline

GitHub Actionsで以下を自動実行：

1. **静的解析**: TypeScript + ESLint
2. **単体テスト**: Vitest + カバレッジ
3. **E2Eテスト**: Playwright (Chromium)
4. **ビルド**: Vite
5. **デプロイ**: Cloudflare Workers (mainブランチ)

## 🌐 Deployment

1. GitHub Secrets に設定:
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID`

2. mainブランチにプッシュで自動デプロイ

## 📋 AI Agent Guidelines

このプロジェクトは **CLAUDE.md** を参照してAI駆動開発を行ってください：

- 必ず検証シーケンス（typecheck → lint → test:unit）に従う
- テストデータは実装と厳密に一致させる
- エラーは各層で異なる種類の問題を示す

## 🎯 Quality Standards

- ✅ TypeScript strict mode
- ✅ ESLint エラーゼロ  
- ✅ Pre-commitフック
- ✅ 自動テスト実行
- ✅ E2E検証

---

*Generated with AI-Driven Cloudflare Workers Setup Script*
*Based on AUTOMATION_GUIDELINE.md + LESSONS_LEARNED.md*
