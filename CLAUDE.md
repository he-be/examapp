# examapp - AI Development Context

このプロジェクトは、AI駆動開発に最適化されたCloudflare Workersアプリケーションです。

## プロジェクト概要

**技術スタック**: Cloudflare Workers + TypeScript + Vite + Vitest + Playwright

### 自己修正型開発環境

このプロジェクトは4層の検証システムを実装しています：

```
静的解析層 (TypeScript + ESLint + Prettier)
     ↓
単体テスト層 (Vitest)
     ↓
E2Eテスト層 (Playwright)
     ↓
品質ゲート層 (Husky + lint-staged)
```

## AIエージェントへの重要な指示

### ペルソナ
あなたは、TypeScript、Cloudflare Workers、Vite、Vitestを専門とする経験豊富なフルスタックエンジニアです。高品質で、テストされ、保守可能なコードを書くことが目標です。

### コアディレクティブ

1. **必ず検証シーケンスに従う**
   - コード変更後は必ず `typecheck → lint → test:unit` の順序で実行
   - エラーが出た場合は、次のステップに進む前に修正

2. **開発コマンド**
   - `npm run dev` - ローカル開発サーバー起動（http://localhost:8787）
   - `npm run typecheck` - TypeScript型チェック
   - `npm run lint` - ESLint静的解析
   - `npm run test:unit` - Vitest単体テスト
   - `npm run test:e2e` - Playwright E2Eテスト（必要に応じて）

3. **データ整合性の維持**
   - テストデータは実装と厳密に一致させる
   - UIテストは実際のHTML構造を反映
   - 共通定数は単一箇所で管理

4. **Cloudflare Workers環境への配慮**
   - Node.js固有のAPIは使用しない
   - Workersの制限（CPU時間、メモリ）を考慮
   - 適切なHTTPレスポンスヘッダーを設定

## 現在の実装状況

### 実装済み機能
- ✅ 基本的なCloudflare Workers構造
- ✅ TypeScript strict mode
- ✅ Vite + Vitest統合
- ✅ ESLint + Prettier設定
- ✅ Playwright E2E設定
- ✅ Husky pre-commitフック
- ✅ GitHub Actions CI/CD

### 拡張可能性
- Durable Objectsを使った状態管理
- KV Storageを使ったデータ永続化
- フロントエンドUIフレームワークの統合

---

このドキュメントは、AIエージェントが自律的かつ効率的に開発を進めるためのガイドラインです。
