import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  submitAnswer,
  submitAnswerBatch,
  updateAnswer,
  getAnswer,
  getAllAnswers,
  getAnsweredQuestionIds,
  isQuestionAnswered,
  getCurrentTestStats,
  getStatsByQuestionType,
  deleteAnswer,
  clearAllAnswers,
  validateAnswerData,
  exportAnswerData,
} from './answerPersistence';
import type { UserProgress, MMLUQuestion, GSM8KQuestion } from '../types';

// モックの設定
vi.mock('./storage', () => ({
  getCurrentProgress: vi.fn(),
  saveProgress: vi.fn(),
  addTestResult: vi.fn(),
  autoSaveProgress: vi.fn(),
}));

vi.mock('./answerValidator', () => ({
  createUserAnswer: vi.fn(),
  scoreAnswer: vi.fn(),
  calculateAnswerStats: vi.fn(),
  startAnswerTiming: vi.fn(),
  calculateAnswerTime: vi.fn(),
}));

import * as storage from './storage';
import * as validator from './answerValidator';

describe('answerPersistence', () => {
  // =============================================================================
  // テストデータ
  // =============================================================================

  const mockProgress: UserProgress = {
    testId: 'test-123',
    testType: 'mmlu',
    mode: 'practice',
    startTime: Date.now() - 60000,
    currentQuestionIndex: 0,
    answers: {},
    isCompleted: false,
  };

  const mmlumQuestion: MMLUQuestion = {
    id: 'mmlu-1',
    type: 'multiple-choice',
    question: 'What is the capital of Japan?',
    choices: ['Tokyo', 'Osaka', 'Kyoto', 'Nagoya'],
    correctAnswer: 0,
    explanation: 'Tokyo is the capital of Japan.',
    category: 'geography',
    difficulty: 'easy',
  };

  const gsm8kQuestion: GSM8KQuestion = {
    id: 'gsm8k-1',
    type: 'numeric',
    question: 'What is 15 + 27?',
    correctAnswer: 42,
    explanation: '15 + 27 = 42',
    chainOfThought: ['15 + 27', '= 42'],
  };

  const mockUserAnswer = {
    questionId: 'mmlu-1',
    userAnswer: 0,
    isCorrect: true,
    timeSpent: 10,
    timestamp: Date.now(),
  };

  // =============================================================================
  // セットアップ・ティアダウン
  // =============================================================================

  beforeEach(() => {
    vi.clearAllMocks();

    // デフォルトのモック動作を設定
    vi.mocked(storage.getCurrentProgress).mockReturnValue(mockProgress);
    vi.mocked(validator.createUserAnswer).mockReturnValue(mockUserAnswer);
    vi.mocked(validator.calculateAnswerStats).mockReturnValue({
      totalAnswers: 1,
      correctAnswers: 1,
      accuracy: 100,
      averageTime: 10,
      totalTime: 10,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // =============================================================================
  // 回答記録テスト
  // =============================================================================

  describe('submitAnswer', () => {
    it('successfully submits answer for active test', () => {
      const result = submitAnswer('mmlu-1', 0, mmlumQuestion, Date.now() - 5000);

      expect(result.userAnswer).toEqual(mockUserAnswer);
      expect(result.wasAlreadyAnswered).toBe(false);
      expect(result.progressUpdated).toBe(true);
      expect(result.testCompleted).toBe(false);
      expect(storage.autoSaveProgress).toHaveBeenCalled();
    });

    it('detects already answered questions', () => {
      const progressWithAnswer = {
        ...mockProgress,
        answers: { 'mmlu-1': mockUserAnswer },
      };
      vi.mocked(storage.getCurrentProgress).mockReturnValue(progressWithAnswer);

      const result = submitAnswer('mmlu-1', 1, mmlumQuestion, Date.now() - 5000);

      expect(result.wasAlreadyAnswered).toBe(true);
    });

    it('throws error when no active test', () => {
      vi.mocked(storage.getCurrentProgress).mockReturnValue(null);

      expect(() => {
        submitAnswer('mmlu-1', 0, mmlumQuestion, Date.now() - 5000);
      }).toThrow('アクティブなテストが見つかりません');
    });

    it('completes test when enough answers submitted', () => {
      // 19個の既存回答を持つ進捗をセットアップ（20個目で完了）
      const existingAnswers: Record<string, typeof mockUserAnswer> = {};
      for (let i = 0; i < 19; i++) {
        existingAnswers[`q-${i}`] = { ...mockUserAnswer, questionId: `q-${i}` };
      }

      const nearCompleteProgress = {
        ...mockProgress,
        answers: existingAnswers,
      };
      vi.mocked(storage.getCurrentProgress).mockReturnValue(nearCompleteProgress);

      const result = submitAnswer('mmlu-1', 0, mmlumQuestion, Date.now() - 5000);

      expect(result.testCompleted).toBe(true);
      expect(result.testResults).toBeDefined();
      expect(storage.addTestResult).toHaveBeenCalled();
    });

    it('handles storage errors gracefully', () => {
      vi.mocked(storage.autoSaveProgress).mockImplementation(() => {
        throw new Error('Storage full');
      });

      expect(() => {
        submitAnswer('mmlu-1', 0, mmlumQuestion, Date.now() - 5000);
      }).toThrow('回答の保存に失敗しました');
    });
  });

  describe('submitAnswerBatch', () => {
    it('submits multiple answers successfully', () => {
      const submissions = [
        {
          questionId: 'mmlu-1',
          userInput: 0,
          question: mmlumQuestion,
          answerStartTime: Date.now() - 5000,
        },
        {
          questionId: 'gsm8k-1',
          userInput: 42,
          question: gsm8kQuestion,
          answerStartTime: Date.now() - 3000,
        },
      ];

      const results = submitAnswerBatch(submissions);

      expect(results).toHaveLength(2);
      expect(results[0].progressUpdated).toBe(true);
      expect(results[1].progressUpdated).toBe(true);
    });

    it('handles empty batch', () => {
      const results = submitAnswerBatch([]);
      expect(results).toHaveLength(0);
    });
  });

  describe('updateAnswer', () => {
    it('updates existing answer', () => {
      const progressWithAnswer = {
        ...mockProgress,
        answers: { 'mmlu-1': mockUserAnswer },
      };
      vi.mocked(storage.getCurrentProgress).mockReturnValue(progressWithAnswer);

      const result = updateAnswer('mmlu-1', 1, mmlumQuestion, Date.now() - 5000);
      expect(result.wasAlreadyAnswered).toBe(true);
    });
  });

  // =============================================================================
  // 回答取得テスト
  // =============================================================================

  describe('getAnswer', () => {
    it('returns existing answer', () => {
      const progressWithAnswer = {
        ...mockProgress,
        answers: { 'mmlu-1': mockUserAnswer },
      };
      vi.mocked(storage.getCurrentProgress).mockReturnValue(progressWithAnswer);

      const answer = getAnswer('mmlu-1');
      expect(answer).toEqual(mockUserAnswer);
    });

    it('returns null for non-existent answer', () => {
      const answer = getAnswer('non-existent');
      expect(answer).toBeNull();
    });

    it('returns null when no active test', () => {
      vi.mocked(storage.getCurrentProgress).mockReturnValue(null);

      const answer = getAnswer('mmlu-1');
      expect(answer).toBeNull();
    });
  });

  describe('getAllAnswers', () => {
    it('returns all answers from active test', () => {
      const answers = { 'mmlu-1': mockUserAnswer };
      const progressWithAnswers = {
        ...mockProgress,
        answers,
      };
      vi.mocked(storage.getCurrentProgress).mockReturnValue(progressWithAnswers);

      const result = getAllAnswers();
      expect(result).toEqual(answers);
    });

    it('returns empty object when no active test', () => {
      vi.mocked(storage.getCurrentProgress).mockReturnValue(null);

      const result = getAllAnswers();
      expect(result).toEqual({});
    });
  });

  describe('getAnsweredQuestionIds', () => {
    it('returns list of answered question IDs', () => {
      const answers = {
        'mmlu-1': mockUserAnswer,
        'gsm8k-1': { ...mockUserAnswer, questionId: 'gsm8k-1' },
      };
      const progressWithAnswers = {
        ...mockProgress,
        answers,
      };
      vi.mocked(storage.getCurrentProgress).mockReturnValue(progressWithAnswers);

      const ids = getAnsweredQuestionIds();
      expect(ids).toEqual(['mmlu-1', 'gsm8k-1']);
    });

    it('returns empty array when no active test', () => {
      vi.mocked(storage.getCurrentProgress).mockReturnValue(null);

      const ids = getAnsweredQuestionIds();
      expect(ids).toEqual([]);
    });
  });

  describe('isQuestionAnswered', () => {
    it('returns true for answered question', () => {
      const progressWithAnswer = {
        ...mockProgress,
        answers: { 'mmlu-1': mockUserAnswer },
      };
      vi.mocked(storage.getCurrentProgress).mockReturnValue(progressWithAnswer);

      const result = isQuestionAnswered('mmlu-1');
      expect(result).toBe(true);
    });

    it('returns false for unanswered question', () => {
      const result = isQuestionAnswered('non-existent');
      expect(result).toBe(false);
    });

    it('returns false when no active test', () => {
      vi.mocked(storage.getCurrentProgress).mockReturnValue(null);

      const result = isQuestionAnswered('mmlu-1');
      expect(result).toBe(false);
    });
  });

  // =============================================================================
  // 統計機能テスト
  // =============================================================================

  describe('getCurrentTestStats', () => {
    it('returns stats for active test', () => {
      const progressWithAnswers = {
        ...mockProgress,
        answers: { 'mmlu-1': mockUserAnswer },
      };
      vi.mocked(storage.getCurrentProgress).mockReturnValue(progressWithAnswers);

      const stats = getCurrentTestStats();
      expect(stats).toEqual({
        totalAnswered: 1,
        correctAnswers: 1,
        accuracy: 100,
        averageTime: 10,
        totalTime: 10,
      });
    });

    it('returns null when no active test', () => {
      vi.mocked(storage.getCurrentProgress).mockReturnValue(null);

      const stats = getCurrentTestStats();
      expect(stats).toBeNull();
    });

    it('handles empty answers', () => {
      const stats = getCurrentTestStats();
      expect(stats).toEqual({
        totalAnswered: 0,
        correctAnswers: 0,
        accuracy: 0,
        averageTime: 0,
        totalTime: 0,
      });
    });
  });

  describe('getStatsByQuestionType', () => {
    it('returns stats by question type', () => {
      const progressWithAnswers = {
        ...mockProgress,
        answers: { 'mmlu-1': mockUserAnswer },
      };
      vi.mocked(storage.getCurrentProgress).mockReturnValue(progressWithAnswers);

      const stats = getStatsByQuestionType();
      expect(stats.all).toBeDefined();
      expect(stats.all.total).toBe(1);
      expect(stats.all.correct).toBe(1);
    });

    it('returns empty stats when no active test', () => {
      vi.mocked(storage.getCurrentProgress).mockReturnValue(null);

      const stats = getStatsByQuestionType();
      expect(stats).toEqual({});
    });
  });

  // =============================================================================
  // 回答削除テスト
  // =============================================================================

  describe('deleteAnswer', () => {
    it('deletes existing answer', () => {
      const progressWithAnswer = {
        ...mockProgress,
        answers: { 'mmlu-1': mockUserAnswer },
      };
      vi.mocked(storage.getCurrentProgress).mockReturnValue(progressWithAnswer);

      const result = deleteAnswer('mmlu-1');
      expect(result).toBe(true);
      expect(storage.autoSaveProgress).toHaveBeenCalled();
    });

    it('returns false for non-existent answer', () => {
      const result = deleteAnswer('non-existent');
      expect(result).toBe(false);
    });

    it('returns false when no active test', () => {
      vi.mocked(storage.getCurrentProgress).mockReturnValue(null);

      const result = deleteAnswer('mmlu-1');
      expect(result).toBe(false);
    });

    it('handles storage errors', () => {
      const progressWithAnswer = {
        ...mockProgress,
        answers: { 'mmlu-1': mockUserAnswer },
      };
      vi.mocked(storage.getCurrentProgress).mockReturnValue(progressWithAnswer);
      vi.mocked(storage.autoSaveProgress).mockImplementation(() => {
        throw new Error('Storage error');
      });

      const result = deleteAnswer('mmlu-1');
      expect(result).toBe(false);
    });
  });

  describe('clearAllAnswers', () => {
    it('clears all answers', () => {
      const progressWithAnswers = {
        ...mockProgress,
        answers: { 'mmlu-1': mockUserAnswer },
      };
      vi.mocked(storage.getCurrentProgress).mockReturnValue(progressWithAnswers);

      const result = clearAllAnswers();
      expect(result).toBe(true);
      expect(storage.autoSaveProgress).toHaveBeenCalledWith(
        expect.objectContaining({
          answers: {},
          currentQuestionIndex: 0,
          isCompleted: false,
        })
      );
    });

    it('returns false when no active test', () => {
      vi.mocked(storage.getCurrentProgress).mockReturnValue(null);

      const result = clearAllAnswers();
      expect(result).toBe(false);
    });

    it('handles storage errors', () => {
      vi.mocked(storage.autoSaveProgress).mockImplementation(() => {
        throw new Error('Storage error');
      });

      const result = clearAllAnswers();
      expect(result).toBe(false);
    });
  });

  // =============================================================================
  // デバッグ・検証機能テスト
  // =============================================================================

  describe('validateAnswerData', () => {
    it('validates correct answer data', () => {
      const progressWithAnswer = {
        ...mockProgress,
        answers: { 'mmlu-1': mockUserAnswer },
      };
      vi.mocked(storage.getCurrentProgress).mockReturnValue(progressWithAnswer);

      const result = validateAnswerData();
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('detects missing questionId', () => {
      const invalidAnswer = { ...mockUserAnswer, questionId: '' };
      const progressWithInvalidAnswer = {
        ...mockProgress,
        answers: { 'mmlu-1': invalidAnswer },
      };
      vi.mocked(storage.getCurrentProgress).mockReturnValue(progressWithInvalidAnswer);

      const result = validateAnswerData();
      expect(result.valid).toBe(false);
      expect(result.errors.some((err) => err.includes('questionId is missing'))).toBe(true);
    });

    it('detects invalid timeSpent', () => {
      const invalidAnswer = { ...mockUserAnswer, timeSpent: -5 };
      const progressWithInvalidAnswer = {
        ...mockProgress,
        answers: { 'mmlu-1': invalidAnswer },
      };
      vi.mocked(storage.getCurrentProgress).mockReturnValue(progressWithInvalidAnswer);

      const result = validateAnswerData();
      expect(result.valid).toBe(false);
      expect(result.errors.some((err) => err.includes('invalid timeSpent'))).toBe(true);
    });

    it('handles no active test gracefully', () => {
      vi.mocked(storage.getCurrentProgress).mockReturnValue(null);

      const result = validateAnswerData();
      expect(result.valid).toBe(true);
      expect(result.warnings).toContain('アクティブなテストが見つかりません');
    });
  });

  describe('exportAnswerData', () => {
    it('exports complete answer data', () => {
      const progressWithAnswer = {
        ...mockProgress,
        answers: { 'mmlu-1': mockUserAnswer },
      };
      vi.mocked(storage.getCurrentProgress).mockReturnValue(progressWithAnswer);

      const exportData = exportAnswerData();

      expect(exportData.progress).toEqual(progressWithAnswer);
      expect(exportData.stats).toBeDefined();
      expect(exportData.validation).toBeDefined();
    });

    it('exports data when no active test', () => {
      vi.mocked(storage.getCurrentProgress).mockReturnValue(null);

      const exportData = exportAnswerData();

      expect(exportData.progress).toBeNull();
      expect(exportData.stats).toBeNull();
      expect(exportData.validation).toBeDefined();
    });
  });
});
