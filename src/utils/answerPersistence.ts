import type { UserAnswer, UserProgress, TestResults, BaseQuestion } from '../types';
import { getCurrentProgress, saveProgress, addTestResult, autoSaveProgress } from './storage';
import { createUserAnswer, calculateAnswerStats } from './answerValidator';

// =============================================================================
// 型定義
// =============================================================================

export interface AnswerSubmissionResult {
  userAnswer: UserAnswer;
  wasAlreadyAnswered: boolean;
  progressUpdated: boolean;
  testCompleted: boolean;
  testResults?: TestResults;
}

export interface AnswerPersistenceError extends Error {
  code: 'NO_ACTIVE_TEST' | 'INVALID_QUESTION' | 'STORAGE_ERROR' | 'VALIDATION_ERROR';
  details?: unknown;
}

// =============================================================================
// エラーハンドリング
// =============================================================================

class AnswerPersistenceErrorImpl extends Error implements AnswerPersistenceError {
  constructor(
    message: string,
    public code: AnswerPersistenceError['code'],
    public details?: unknown
  ) {
    super(message);
    this.name = 'AnswerPersistenceError';
  }
}

// =============================================================================
// 回答記録機能
// =============================================================================

/**
 * 回答を記録し、進捗を更新する
 */
export function submitAnswer(
  questionId: string,
  userInput: string | number,
  question: BaseQuestion,
  answerStartTime: number
): AnswerSubmissionResult {
  try {
    // 現在の進捗を取得
    const currentProgress = getCurrentProgress();
    if (!currentProgress) {
      throw new AnswerPersistenceErrorImpl('アクティブなテストが見つかりません', 'NO_ACTIVE_TEST');
    }

    // 既に回答済みかチェック
    const wasAlreadyAnswered = questionId in currentProgress.answers;

    // UserAnswerオブジェクトを作成
    const userAnswer = createUserAnswer(questionId, userInput, question, answerStartTime);

    // 進捗を更新
    const updatedAnswers = {
      ...currentProgress.answers,
      [questionId]: userAnswer,
    };

    const updatedProgress: UserProgress = {
      ...currentProgress,
      answers: updatedAnswers,
    };

    // 自動保存を実行
    autoSaveProgress(updatedProgress);

    // テスト完了チェック
    const testCompleted = checkTestCompletion(updatedProgress);
    let testResults: TestResults | undefined;

    if (testCompleted) {
      // テスト結果を生成
      testResults = generateTestResults(updatedProgress);

      // 結果を履歴に保存
      addTestResult(testResults);

      // 進捗をクリア（テスト完了）
      updatedProgress.isCompleted = true;
      saveProgress(updatedProgress);
    }

    return {
      userAnswer,
      wasAlreadyAnswered,
      progressUpdated: true,
      testCompleted,
      testResults,
    };
  } catch (error) {
    if (error instanceof AnswerPersistenceErrorImpl) {
      throw error;
    }

    throw new AnswerPersistenceErrorImpl(`回答の保存に失敗しました: ${error}`, 'STORAGE_ERROR', {
      originalError: error,
    });
  }
}

/**
 * 複数の回答をバッチで記録
 */
export function submitAnswerBatch(
  submissions: Array<{
    questionId: string;
    userInput: string | number;
    question: BaseQuestion;
    answerStartTime: number;
  }>
): AnswerSubmissionResult[] {
  return submissions.map((submission) =>
    submitAnswer(
      submission.questionId,
      submission.userInput,
      submission.question,
      submission.answerStartTime
    )
  );
}

/**
 * 回答を更新（既存の回答を上書き）
 */
export function updateAnswer(
  questionId: string,
  userInput: string | number,
  question: BaseQuestion,
  answerStartTime: number
): AnswerSubmissionResult {
  // submitAnswerは既に上書きロジックを含んでいるため、同じ関数を使用
  return submitAnswer(questionId, userInput, question, answerStartTime);
}

// =============================================================================
// 回答取得機能
// =============================================================================

/**
 * 特定の問題の回答を取得
 */
export function getAnswer(questionId: string): UserAnswer | null {
  const progress = getCurrentProgress();
  if (!progress) {
    return null;
  }

  return progress.answers[questionId] || null;
}

/**
 * すべての回答を取得
 */
export function getAllAnswers(): Record<string, UserAnswer> {
  const progress = getCurrentProgress();
  if (!progress) {
    return {};
  }

  return progress.answers;
}

/**
 * 回答済みの問題IDリストを取得
 */
export function getAnsweredQuestionIds(): string[] {
  const progress = getCurrentProgress();
  if (!progress) {
    return [];
  }

  return Object.keys(progress.answers);
}

/**
 * 特定の問題が回答済みかチェック
 */
export function isQuestionAnswered(questionId: string): boolean {
  const progress = getCurrentProgress();
  if (!progress) {
    return false;
  }

  return questionId in progress.answers;
}

// =============================================================================
// テスト完了判定機能
// =============================================================================

/**
 * テストが完了しているかチェック
 */
function checkTestCompletion(progress: UserProgress): boolean {
  if (progress.isCompleted) {
    return true;
  }

  // この判定は実際のテスト実装で使用される総問題数と比較する必要がある
  // 現在は簡単な実装として、20問以上回答したら完了とする
  const answeredCount = Object.keys(progress.answers).length;
  return answeredCount >= 20; // この値は実際の実装に応じて調整
}

/**
 * テスト結果を生成
 */
function generateTestResults(progress: UserProgress): TestResults {
  const answers = Object.values(progress.answers);
  const stats = calculateAnswerStats(answers);
  const endTime = Date.now();

  // カテゴリ別・難易度別の集計（MMLU用）
  const categoryBreakdown: Record<string, { correct: number; total: number }> = {};
  const difficultyBreakdown: Record<string, { correct: number; total: number }> = {};

  // 実際の問題データと照合して集計を行う
  // ここでは簡単な実装として基本統計のみ生成

  return {
    testId: progress.testId,
    testType: progress.testType,
    mode: progress.mode,
    startTime: progress.startTime,
    endTime,
    totalQuestions: stats.totalAnswers,
    correctAnswers: stats.correctAnswers,
    incorrectAnswers: stats.totalAnswers - stats.correctAnswers,
    accuracy: stats.accuracy,
    totalTimeSpent: stats.totalTime,
    averageTimePerQuestion: stats.averageTime,
    answers,
    metadata: {
      categoryBreakdown,
      difficultyBreakdown,
    },
  };
}

// =============================================================================
// 回答統計機能
// =============================================================================

/**
 * 現在のテストの統計情報を取得
 */
export function getCurrentTestStats(): {
  totalAnswered: number;
  correctAnswers: number;
  accuracy: number;
  averageTime: number;
  totalTime: number;
} | null {
  const progress = getCurrentProgress();
  if (!progress) {
    return null;
  }

  const answers = Object.values(progress.answers);
  if (answers.length === 0) {
    return {
      totalAnswered: 0,
      correctAnswers: 0,
      accuracy: 0,
      averageTime: 0,
      totalTime: 0,
    };
  }

  const stats = calculateAnswerStats(answers);
  return {
    totalAnswered: stats.totalAnswers,
    correctAnswers: stats.correctAnswers,
    accuracy: stats.accuracy,
    averageTime: stats.averageTime,
    totalTime: stats.totalTime,
  };
}

/**
 * 問題タイプ別の統計を取得
 */
export function getStatsByQuestionType(): Record<
  string,
  {
    total: number;
    correct: number;
    accuracy: number;
    averageTime: number;
  }
> {
  const progress = getCurrentProgress();
  if (!progress) {
    return {};
  }

  const answers = Object.values(progress.answers);

  // 問題タイプごとに分類（実際の実装では問題データと照合）
  // ここでは簡単な実装として全体統計を返す
  const stats = calculateAnswerStats(answers);

  return {
    all: {
      total: stats.totalAnswers,
      correct: stats.correctAnswers,
      accuracy: stats.accuracy,
      averageTime: stats.averageTime,
    },
  };
}

// =============================================================================
// 回答削除機能
// =============================================================================

/**
 * 特定の問題の回答を削除
 */
export function deleteAnswer(questionId: string): boolean {
  try {
    const progress = getCurrentProgress();
    if (!progress) {
      return false;
    }

    if (!(questionId in progress.answers)) {
      return false; // 回答が存在しない
    }

    const updatedAnswers = { ...progress.answers };
    delete updatedAnswers[questionId];

    const updatedProgress: UserProgress = {
      ...progress,
      answers: updatedAnswers,
      isCompleted: false, // 回答を削除したので未完了に戻す
    };

    autoSaveProgress(updatedProgress);
    return true;
  } catch (error) {
    console.error('Failed to delete answer:', error);
    return false;
  }
}

/**
 * すべての回答を削除
 */
export function clearAllAnswers(): boolean {
  try {
    const progress = getCurrentProgress();
    if (!progress) {
      return false;
    }

    const updatedProgress: UserProgress = {
      ...progress,
      answers: {},
      currentQuestionIndex: 0,
      isCompleted: false,
    };

    autoSaveProgress(updatedProgress);
    return true;
  } catch (error) {
    console.error('Failed to clear all answers:', error);
    return false;
  }
}

// =============================================================================
// デバッグ・開発支援機能
// =============================================================================

/**
 * 回答データの整合性をチェック
 */
export function validateAnswerData(): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    const progress = getCurrentProgress();
    if (!progress) {
      warnings.push('アクティブなテストが見つかりません');
      return { valid: true, errors, warnings };
    }

    const answers = Object.values(progress.answers);

    // 基本的な検証
    answers.forEach((answer, index) => {
      if (!answer.questionId) {
        errors.push(`Answer ${index}: questionId is missing`);
      }
      if (typeof answer.timeSpent !== 'number' || answer.timeSpent < 0) {
        errors.push(`Answer ${index}: invalid timeSpent value`);
      }
      if (typeof answer.timestamp !== 'number') {
        errors.push(`Answer ${index}: invalid timestamp value`);
      }
    });

    // 重複チェック
    const questionIds = answers.map((a) => a.questionId);
    const uniqueIds = new Set(questionIds);
    if (questionIds.length !== uniqueIds.size) {
      warnings.push('重複した問題IDが見つかりました');
    }
  } catch (error) {
    errors.push(`Validation error: ${error}`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * 回答データをエクスポート（開発・デバッグ用）
 */
export function exportAnswerData(): {
  progress: UserProgress | null;
  stats: ReturnType<typeof getCurrentTestStats>;
  validation: ReturnType<typeof validateAnswerData>;
} {
  return {
    progress: getCurrentProgress(),
    stats: getCurrentTestStats(),
    validation: validateAnswerData(),
  };
}
