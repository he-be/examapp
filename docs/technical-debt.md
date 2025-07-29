# 技術的負債と課題の現状分析

**作成日**: 2025-07-29  
**対象プロジェクト**: examapp (LLM Benchmark Test Experience)  
**現在のフェーズ**: Phase 1 完了、CI/CD問題の解決中

## 概要

このドキュメントは、examappプロジェクトの現在の技術的負債、未解決の問題、および今後の改善が必要な領域をまとめたものです。Phase 1の基盤構築が完了した段階での状況を記録しています。

## 🚨 緊急度高：現在発生中の問題

### 1. E2Eテストの不安定性

**問題**: Playwright E2Eテストが一部失敗している

- `/about`ルートで404エラーが発生
- SPAルーティングとCloudflare Workersの設定に不整合

**影響**:

- CI/CDパイプラインが完全に通らない
- デプロイメント品質の保証ができない

**対策案**:

```typescript
// 修正が必要：SPAルーティング対応のテスト
test('should handle about page route', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.goto('/about');
  expect(page.url()).toContain('/about');
});
```

### 2. wrangler.toml設定の警告

**問題**: `Unexpected fields found in assets field: "spa"`

- wranglerの新しいバージョンでのSPA設定形式が変更されている可能性

**対策**: wrangler.tomlの設定を最新形式に更新する必要

## ⚠️ 緊急度中：技術的負債

### 1. テストカバレッジの不足

**現状**:

- 単体テスト: 基本的なテストのみ（storage, dataLoader）
- コンポーネントテスト: 削除済み（Reactルーター問題のため）
- E2Eテスト: 基本的な動作確認のみ

**技術的負債**:

- 複雑なコンポーネントのテストが存在しない
- ビジネスロジックのテストが不十分
- エラーハンドリングのテストが未実装

### 2. ESLintの`any`型警告

**現状**: 15個のESLint警告（`@typescript-eslint/no-explicit-any`）

```typescript
// 問題のあるコード例
export interface BaseQuestion {
  metadata?: Record<string, any>; // ← any使用
}
```

**影響**: 型安全性の低下、予期しないランタイムエラーの可能性

### 3. 未実装の機能アーキテクチャ

**問題**: Phase 2以降の実装に必要な基盤が不完全

- 問題データの読み込み機能（dataLoader）は実装済みだが、実際のデータファイルが存在しない
- テスト実行エンジンのインターフェースは定義済みだが実装なし
- 結果保存・分析機能の設計が曖昧

## 📋 設計上の課題

### 1. データ構造の複雑性

**問題**: 各ベンチマーク（MMLU, GSM-8K等）で異なるデータ構造

```typescript
// 型の複雑性例
export type Question =
  | MMLUQuestion
  | GSM8KQuestion
  | HellaSwagQuestion
  | BigBenchQuestion
  | DROPQuestion;
```

**リスク**: 新しいベンチマーク追加時の型安全性確保が困難

### 2. エラーハンドリングの一貫性

**問題**: 異なる層で異なるエラーハンドリング方式

- Workerレベル: try-catch with HTTP response
- ユーザーインターフェース: ErrorBoundary
- データレイヤー: カスタムError classes

**影響**: デバッグの困難さ、一貫性のないユーザー体験

## 🔧 パフォーマンス上の懸念

### 1. バンドルサイズ

**現状**: `dist/assets/main-j8Bg0OIj.js 236.06 kB │ gzip: 74.89 kB`
**懸念**:

- React + TypeScript + ルーティングライブラリで大きなバンドル
- 問題データの読み込みで追加の負荷

### 2. Cloudflare Workers制限

**制約事項**:

- CPU時間制限（10ms, 有料プランで50ms）
- メモリ制限（128MB）
- リクエストサイズ制限（100MB）

**潜在的問題**: 大量の問題データ処理時の制限抵触リスク

## 📚 ドキュメント・保守性の問題

### 1. API仕様の未文書化

**問題**:

- `/api/feedback`、`/api/health`エンドポイントの詳細仕様が未記録
- データローダーAPIの使用方法が不明確

### 2. デプロイメントプロセス未確立

**現状**: GitHub Actions設定済みだが、実際のデプロイフローが未検証
