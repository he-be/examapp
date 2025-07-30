// =============================================================================
// 基本型定義
// =============================================================================

export type TestMode = 'practice' | 'test';
export type TestType = 'mmlu' | 'gsm8k' | 'hellaswag' | 'bigbench' | 'drop';
export type QuestionType = 'multiple-choice' | 'numeric' | 'text';

// =============================================================================
// 問題データ構造
// =============================================================================

/**
 * 共通問題インターフェース
 * すべてのベンチマーク問題の基底となる型
 */
export interface BaseQuestion {
  id: string;
  type: QuestionType;
  question: string;
  correctAnswer: string | number;
  explanation: string;
  metadata?: Record<string, unknown>;
}

/**
 * MMLU問題形式
 * 多肢選択式の問題データ
 */
export interface MMLUQuestion extends BaseQuestion {
  type: 'multiple-choice';
  category: string;
  choices: string[];
  correctAnswer: number; // 選択肢のインデックス
  difficulty: 'easy' | 'medium' | 'hard';
}

/**
 * GSM-8K問題形式
 * 数値入力問題データ
 */
export interface GSM8KQuestion extends BaseQuestion {
  type: 'numeric';
  correctAnswer: number;
  chainOfThought: string[];
  unit?: string;
}

/**
 * HellaSwag問題形式
 * 文脈に続く最も自然な結末を選択
 */
export interface HellaSwagQuestion extends BaseQuestion {
  type: 'multiple-choice';
  context: string;
  choices: string[];
  correctAnswer: number;
}

/**
 * BIG-Bench-Hard問題形式
 * 多様なタスク形式に対応
 */
export interface BigBenchQuestion extends BaseQuestion {
  type: 'multiple-choice';
  choices: string[];
  taskType: string;
  difficulty: 'hard';
  reasoningType: 'logical' | 'mathematical' | 'commonsense' | 'linguistic';
}

/**
 * DROP問題形式
 * 長文読解に基づく質問応答
 */
export interface DROPQuestion extends BaseQuestion {
  type: 'text';
  passage: string;
  questionType: 'numeric' | 'span' | 'date';
  possibleAnswers?: string[];
}

/**
 * 問題データの統合型
 */
export type Question =
  | MMLUQuestion
  | GSM8KQuestion
  | HellaSwagQuestion
  | BigBenchQuestion
  | DROPQuestion;

// =============================================================================
// ユーザー状態管理
// =============================================================================

/**
 * ユーザーの回答データ
 */
export interface UserAnswer {
  questionId: string;
  userAnswer: string | number;
  isCorrect: boolean;
  timeSpent: number; // 秒
  timestamp: number;
}

/**
 * テストの進行状況
 */
export interface UserProgress {
  testId: string;
  testType: TestType;
  mode: TestMode;
  startTime: number;
  currentQuestionIndex: number;
  answers: Record<string, UserAnswer>;
  timeRemaining?: number; // テストモード用
  isCompleted: boolean;
}

/**
 * テスト結果
 */
export interface TestResults {
  testId: string;
  testType: TestType;
  mode: TestMode;
  startTime: number;
  endTime: number;
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  accuracy: number; // パーセンテージ
  totalTimeSpent: number; // 秒
  averageTimePerQuestion: number; // 秒
  answers: UserAnswer[];
  metadata?: {
    categoryBreakdown?: Record<string, { correct: number; total: number }>;
    difficultyBreakdown?: Record<string, { correct: number; total: number }>;
  };
}

/**
 * ユーザー設定
 */
export interface UserPreferences {
  language: 'ja' | 'en';
  theme: 'light' | 'dark';
  fontSize: 'small' | 'medium' | 'large';
  highContrast: boolean;
  autoSave: boolean;
}

/**
 * localStorage に保存されるデータ構造
 */
export interface StoredData {
  llmTestProgress?: UserProgress;
  llmTestHistory: TestResults[];
  userPreferences: UserPreferences;
  version: string; // データスキーマのバージョン
}

// =============================================================================
// API通信用型定義
// =============================================================================

/**
 * フィードバック送信用データ
 */
export interface FeedbackRequest {
  testId: string;
  questionId?: string;
  feedbackText: string;
  userScore?: number;
  metadata?: Record<string, unknown>;
}

/**
 * API成功レスポンス
 */
export interface APISuccessResponse {
  success: true;
  message: string;
  data?: unknown;
}

/**
 * APIエラーレスポンス
 */
export interface APIErrorResponse {
  success: false;
  error: string;
  code?: string;
}

export type APIResponse = APISuccessResponse | APIErrorResponse;

/**
 * ヘルスチェックレスポンス
 */
export interface HealthCheckResponse {
  status: 'ok' | 'error';
  timestamp: number;
  version?: string;
}

// =============================================================================
// UI コンポーネント用型定義
// =============================================================================

/**
 * ベンチマーク情報
 */
export interface BenchmarkInfo {
  id: TestType;
  name: string;
  fullName: string;
  description: string;
  difficulty: string;
  estimatedTime: string;
  questionCount: string;
  color: string;
  isAvailable: boolean;
}

/**
 * テストインターフェースの状態
 */
export interface TestInterfaceState {
  currentQuestion: Question | null;
  currentIndex: number;
  totalQuestions: number;
  timeRemaining?: number;
  isLoading: boolean;
  error?: string;
}

/**
 * 問題レンダラーのプロパティ
 */
export interface QuestionRendererProps {
  question: Question;
  userAnswer?: string | number;
  onAnswer: (answer: string | number) => void;
  showFeedback: boolean;
  disabled?: boolean;
}

// =============================================================================
// エラー型定義
// =============================================================================

export class TestError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'TestError';
  }
}

export class StorageError extends Error {
  constructor(
    message: string,
    public operation: 'read' | 'write' | 'delete',
    public details?: unknown
  ) {
    super(message);
    this.name = 'StorageError';
  }
}

export class NetworkError extends Error {
  constructor(
    message: string,
    public status?: number,
    public details?: unknown
  ) {
    super(message);
    this.name = 'NetworkError';
  }
}
