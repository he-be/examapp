import { describe, it, expect } from 'vitest';
import {
  validateAnswer,
  scoreAnswer,
  startAnswerTiming,
  calculateAnswerTime,
  checkTimeLimit,
  createUserAnswer,
  validateAnswerBatch,
  calculateAnswerStats,
} from './answerValidator';
import type { MMLUQuestion, GSM8KQuestion, DROPQuestion, UserAnswer } from '../types';

describe('answerValidator', () => {
  // =============================================================================
  // テストデータ
  // =============================================================================

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
    unit: '',
  };

  const dropQuestion: DROPQuestion = {
    id: 'drop-1',
    type: 'text',
    question: 'What is the largest planet in our solar system?',
    correctAnswer: 'Jupiter',
    explanation: 'Jupiter is the largest planet.',
    passage: 'Jupiter is the fifth planet from the Sun and the largest in the Solar System.',
    questionType: 'span',
    possibleAnswers: ['Jupiter', 'jupiter'],
  };

  // =============================================================================
  // 入力検証テスト
  // =============================================================================

  describe('validateAnswer', () => {
    describe('multiple-choice questions', () => {
      it('validates correct numeric answers', () => {
        const result = validateAnswer(0, mmlumQuestion);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
        expect(result.normalizedValue).toBe(0);
      });

      it('validates string numeric answers', () => {
        const result = validateAnswer('2', mmlumQuestion);
        expect(result.isValid).toBe(true);
        expect(result.normalizedValue).toBe(2);
      });

      it('rejects non-numeric answers', () => {
        const result = validateAnswer('abc', mmlumQuestion);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('回答は数値である必要があります');
      });

      it('rejects out-of-range answers', () => {
        const result = validateAnswer(5, mmlumQuestion);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('回答は0から3の範囲で選択してください');
      });

      it('rejects negative answers', () => {
        const result = validateAnswer(-1, mmlumQuestion);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('回答は0から3の範囲で選択してください');
      });
    });

    describe('numeric questions', () => {
      it('validates correct numeric answers', () => {
        const result = validateAnswer(42, gsm8kQuestion);
        expect(result.isValid).toBe(true);
        expect(result.normalizedValue).toBe(42);
      });

      it('validates string numeric answers', () => {
        const result = validateAnswer('42.5', gsm8kQuestion);
        expect(result.isValid).toBe(true);
        expect(result.normalizedValue).toBe(42.5);
      });

      it('rejects non-numeric strings', () => {
        const result = validateAnswer('not a number', gsm8kQuestion);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('回答は有効な数値である必要があります');
      });

      it('rejects infinite values', () => {
        const result = validateAnswer(Infinity, gsm8kQuestion);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('回答は有限の数値である必要があります');
      });

      it('rejects extremely large values', () => {
        const result = validateAnswer(1e16, gsm8kQuestion);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('回答が大きすぎます');
      });
    });

    describe('text questions', () => {
      it('validates normal text answers', () => {
        const result = validateAnswer('Jupiter', dropQuestion);
        expect(result.isValid).toBe(true);
        expect(result.normalizedValue).toBe('Jupiter');
      });

      it('trims whitespace', () => {
        const result = validateAnswer('  Jupiter  ', dropQuestion);
        expect(result.isValid).toBe(true);
        expect(result.normalizedValue).toBe('Jupiter');
      });

      it('rejects empty answers', () => {
        const result = validateAnswer('', dropQuestion);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('回答が入力されていません');
      });

      it('rejects overly long answers', () => {
        const longAnswer = 'a'.repeat(1001);
        const result = validateAnswer(longAnswer, dropQuestion);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('回答は1000文字以内で入力してください');
      });

      it('sanitizes HTML tags', () => {
        const result = validateAnswer('<script>alert("hack")</script>Jupiter', dropQuestion);
        expect(result.isValid).toBe(true);
        expect(result.normalizedValue).toBe('Jupiter');
        expect(result.errors).toContain('HTMLタグは除去されました');
      });
    });

    it('rejects null/undefined answers', () => {
      const result = validateAnswer('', mmlumQuestion);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('回答が入力されていません');
    });
  });

  // =============================================================================
  // 正誤判定テスト
  // =============================================================================

  describe('scoreAnswer', () => {
    describe('multiple-choice questions', () => {
      it('scores correct answers as 1', () => {
        const result = scoreAnswer(0, mmlumQuestion);
        expect(result.isCorrect).toBe(true);
        expect(result.score).toBe(1);
        expect(result.feedback).toContain('正解');
      });

      it('scores incorrect answers as 0', () => {
        const result = scoreAnswer(1, mmlumQuestion);
        expect(result.isCorrect).toBe(false);
        expect(result.score).toBe(0);
        expect(result.feedback).toContain('不正解');
        expect(result.feedback).toContain('Tokyo');
      });
    });

    describe('numeric questions', () => {
      it('scores exact answers as correct', () => {
        const result = scoreAnswer(42, gsm8kQuestion);
        expect(result.isCorrect).toBe(true);
        expect(result.score).toBe(1);
      });

      it('accepts answers within tolerance', () => {
        const result = scoreAnswer(42.004, gsm8kQuestion); // Within 1% tolerance
        expect(result.isCorrect).toBe(true);
        expect(result.score).toBe(1);
      });

      it('rejects answers outside tolerance', () => {
        const result = scoreAnswer(45, gsm8kQuestion);
        expect(result.isCorrect).toBe(false);
        expect(result.score).toBe(0);
      });

      it('provides partial credit for close answers', () => {
        const result = scoreAnswer(43, gsm8kQuestion);
        expect(result.isCorrect).toBe(false);
        expect(result.score).toBe(0);
        expect(result.partialCredit).toBeGreaterThan(0);
      });
    });

    describe('text questions', () => {
      it('scores exact matches as correct', () => {
        const result = scoreAnswer('Jupiter', dropQuestion);
        expect(result.isCorrect).toBe(true);
        expect(result.score).toBe(1);
      });

      it('handles case insensitive matching', () => {
        const result = scoreAnswer('jupiter', dropQuestion);
        expect(result.isCorrect).toBe(true);
        expect(result.score).toBe(1);
      });

      it('accepts possible answers', () => {
        const result = scoreAnswer('jupiter', dropQuestion);
        expect(result.isCorrect).toBe(true);
      });

      it('provides partial credit for keyword matches', () => {
        const complexQuestion: DROPQuestion = {
          ...dropQuestion,
          correctAnswer: 'The largest planet is Jupiter',
        };
        const result = scoreAnswer('Jupiter is big', complexQuestion);
        expect(result.isCorrect).toBe(false);
        expect(result.partialCredit).toBeGreaterThan(0);
      });

      it('rejects answers with no keyword matches', () => {
        const result = scoreAnswer('Mars', dropQuestion);
        expect(result.isCorrect).toBe(false);
        expect(result.score).toBe(0);
        expect(result.partialCredit || 0).toBe(0);
      });
    });

    it('handles validation errors', () => {
      const result = scoreAnswer('invalid', mmlumQuestion);
      expect(result.isCorrect).toBe(false);
      expect(result.score).toBe(0);
      expect(result.feedback).toContain('入力エラー');
    });
  });

  // =============================================================================
  // 時間計測テスト
  // =============================================================================

  describe('timing functions', () => {
    it('startAnswerTiming returns current timestamp', () => {
      const before = Date.now();
      const startTime = startAnswerTiming();
      const after = Date.now();

      expect(startTime).toBeGreaterThanOrEqual(before);
      expect(startTime).toBeLessThanOrEqual(after);
    });

    it('calculateAnswerTime computes correct duration', () => {
      const startTime = 1000000;
      const endTime = 1005000; // 5 seconds later

      const result = calculateAnswerTime(startTime, endTime);
      expect(result.startTime).toBe(startTime);
      expect(result.endTime).toBe(endTime);
      expect(result.timeSpent).toBe(5);
    });

    it('calculateAnswerTime uses current time if no endTime provided', () => {
      const startTime = Date.now() - 2000; // 2 seconds ago
      const result = calculateAnswerTime(startTime);

      expect(result.timeSpent).toBeGreaterThanOrEqual(2);
      expect(result.timeSpent).toBeLessThanOrEqual(3);
    });

    it('calculateAnswerTime enforces minimum 1 second', () => {
      const startTime = Date.now();
      const endTime = startTime + 500; // 0.5 seconds

      const result = calculateAnswerTime(startTime, endTime);
      expect(result.timeSpent).toBe(1);
    });

    it('checkTimeLimit marks answers within limit', () => {
      const timing = {
        startTime: 1000000,
        endTime: 1003000,
        timeSpent: 3,
      };

      const result = checkTimeLimit(timing, 5);
      expect(result.isWithinTimeLimit).toBe(true);
    });

    it('checkTimeLimit marks answers over limit', () => {
      const timing = {
        startTime: 1000000,
        endTime: 1007000,
        timeSpent: 7,
      };

      const result = checkTimeLimit(timing, 5);
      expect(result.isWithinTimeLimit).toBe(false);
    });
  });

  // =============================================================================
  // UserAnswer作成テスト
  // =============================================================================

  describe('createUserAnswer', () => {
    it('creates correct UserAnswer object', () => {
      const questionId = 'test-1';
      const userInput = 0;
      const startTime = Date.now() - 3000;

      const result = createUserAnswer(questionId, userInput, mmlumQuestion, startTime);

      expect(result.questionId).toBe(questionId);
      expect(result.userAnswer).toBe(userInput);
      expect(result.isCorrect).toBe(true);
      expect(result.timeSpent).toBeGreaterThanOrEqual(3);
      expect(result.timestamp).toBeGreaterThan(startTime);
    });

    it('preserves original input even for incorrect answers', () => {
      const userInput = 'wrong answer';
      const result = createUserAnswer('test-1', userInput, mmlumQuestion, Date.now());

      expect(result.userAnswer).toBe(userInput);
      expect(result.isCorrect).toBe(false);
    });
  });

  // =============================================================================
  // バッチ処理テスト
  // =============================================================================

  describe('validateAnswerBatch', () => {
    it('validates multiple answers', () => {
      const answers = [
        { answer: 0, question: mmlumQuestion },
        { answer: 42, question: gsm8kQuestion },
        { answer: 'Jupiter', question: dropQuestion },
      ];

      const results = validateAnswerBatch(answers);

      expect(results).toHaveLength(3);
      expect(results[0].isValid).toBe(true);
      expect(results[1].isValid).toBe(true);
      expect(results[2].isValid).toBe(true);
    });

    it('handles mixed valid and invalid answers', () => {
      const answers = [
        { answer: 0, question: mmlumQuestion },
        { answer: 'invalid', question: gsm8kQuestion },
      ];

      const results = validateAnswerBatch(answers);

      expect(results[0].isValid).toBe(true);
      expect(results[1].isValid).toBe(false);
    });
  });

  // =============================================================================
  // 統計計算テスト
  // =============================================================================

  describe('calculateAnswerStats', () => {
    const sampleAnswers: UserAnswer[] = [
      {
        questionId: '1',
        userAnswer: 0,
        isCorrect: true,
        timeSpent: 10,
        timestamp: Date.now(),
      },
      {
        questionId: '2',
        userAnswer: 42,
        isCorrect: true,
        timeSpent: 15,
        timestamp: Date.now(),
      },
      {
        questionId: '3',
        userAnswer: 'wrong',
        isCorrect: false,
        timeSpent: 20,
        timestamp: Date.now(),
      },
    ];

    it('calculates correct statistics', () => {
      const stats = calculateAnswerStats(sampleAnswers);

      expect(stats.totalAnswers).toBe(3);
      expect(stats.correctAnswers).toBe(2);
      expect(stats.accuracy).toBe(66.67);
      expect(stats.averageTime).toBe(15);
      expect(stats.totalTime).toBe(45);
    });

    it('handles empty answers array', () => {
      const stats = calculateAnswerStats([]);

      expect(stats.totalAnswers).toBe(0);
      expect(stats.correctAnswers).toBe(0);
      expect(stats.accuracy).toBe(0);
      expect(stats.averageTime).toBe(0);
      expect(stats.totalTime).toBe(0);
    });

    it('handles single answer', () => {
      const stats = calculateAnswerStats([sampleAnswers[0]]);

      expect(stats.totalAnswers).toBe(1);
      expect(stats.correctAnswers).toBe(1);
      expect(stats.accuracy).toBe(100);
      expect(stats.averageTime).toBe(10);
      expect(stats.totalTime).toBe(10);
    });
  });
});
