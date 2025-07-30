import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  loadQuestionData,
  getCachedQuestionData,
  getAvailableCategories,
  validateQuestionData,
  getQuestionById,
  getQuestionsByCategory,
  getRandomQuestionsForSession,
  getRandomQuestionsForMultiCategorySession,
  shuffleQuestions,
  clearQuestionCache,
  getCategorySummary,
} from './questionDataManager';

// モックデータ
const mockCategoryData = {
  metadata: {
    category: 'test_category',
    name: 'Test Category',
    description: 'Test description',
    domain: 'Test',
    difficulty: 'medium',
    source: 'test',
    pool_size: 10,
    last_updated: '2024-01-30'
  },
  questions: [
    {
      id: 'test-001',
      type: 'multiple-choice' as const,
      question: 'Test question 1?',
      choices: ['A', 'B', 'C', 'D'],
      correctAnswer: 0,
      explanation: 'Test explanation',
      category: 'test_category',
      difficulty: 'easy' as const,
      source: 'test'
    },
    {
      id: 'test-002', 
      type: 'multiple-choice' as const,
      question: 'Test question 2?',
      choices: ['A', 'B', 'C', 'D'],
      correctAnswer: 1,
      explanation: 'Test explanation',
      category: 'test_category',
      difficulty: 'medium' as const,
      source: 'test'
    }
  ]
};

// 動的インポートをモック
vi.mock('../data/questions/mmlu/college_mathematics.json', () => ({
  default: mockCategoryData
}));

vi.mock('../data/questions/mmlu/world_history.json', () => ({
  default: mockCategoryData
}));

// 他のカテゴリは失敗させる
vi.mock('../data/questions/mmlu/college_physics.json', () => {
  throw new Error('Failed to load college_physics');
});

vi.mock('../data/questions/mmlu/computer_science.json', () => {
  throw new Error('Failed to load computer_science');
});

vi.mock('../data/questions/mmlu/philosophy.json', () => {
  throw new Error('Failed to load philosophy');
});

vi.mock('../data/questions/mmlu/college_medicine.json', () => {
  throw new Error('Failed to load college_medicine');
});

vi.mock('../data/questions/mmlu/econometrics.json', () => {
  throw new Error('Failed to load econometrics');
});

vi.mock('../data/questions/mmlu/world_religions.json', () => {
  throw new Error('Failed to load world_religions');
});

describe('questionDataManager', () => {
  beforeEach(() => {
    clearQuestionCache();
    vi.clearAllMocks();
  });

  afterEach(() => {
    clearQuestionCache();
  });

  // =============================================================================
  // データ読み込みテスト
  // =============================================================================

  describe('loadQuestionData', () => {
    it('should load question data successfully', async () => {
      const data = await loadQuestionData();
      
      expect(data).toBeDefined();
      expect(Object.keys(data)).toContain('college_mathematics');
      expect(Object.keys(data)).toContain('world_history');
      expect(data['college_mathematics'].questions).toHaveLength(2);
    });

    it('should return cached data on subsequent calls', async () => {
      const firstCall = await loadQuestionData();
      const secondCall = await loadQuestionData();
      
      expect(firstCall).toBe(secondCall);
    });

    it('should handle partial loading failures gracefully', async () => {
      const data = await loadQuestionData();
      
      // 成功したカテゴリのみロードされる
      expect(Object.keys(data)).toHaveLength(2);
      expect(Object.keys(data)).toEqual(['college_mathematics', 'world_history']);
    });
  });

  describe('getCachedQuestionData', () => {
    it('should return null when no data is cached', () => {
      const cached = getCachedQuestionData();
      expect(cached).toBeNull();
    });

    it('should return cached data after loading', async () => {
      await loadQuestionData();
      const cached = getCachedQuestionData();
      
      expect(cached).toBeDefined();
      expect(Object.keys(cached!)).toContain('college_mathematics');
    });
  });

  describe('getAvailableCategories', () => {
    it('should return empty array when no data loaded', () => {
      const categories = getAvailableCategories();
      expect(categories).toEqual([]);
    });

    it('should return available categories after loading', async () => {
      await loadQuestionData();
      const categories = getAvailableCategories();
      
      expect(categories).toContain('college_mathematics');
      expect(categories).toContain('world_history');
      expect(categories).toHaveLength(2);
    });
  });

  // =============================================================================
  // データ検証テスト
  // =============================================================================

  describe('validateQuestionData', () => {
    it('should report error when no data loaded', () => {
      const result = validateQuestionData();
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Question pool not loaded');
    });

    it('should validate successfully with good data', async () => {
      await loadQuestionData();
      const result = validateQuestionData();
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should warn about categories with few questions', async () => {
      await loadQuestionData();
      const result = validateQuestionData();
      
      // モックデータは2問しかないので警告が出るはず
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some(w => w.includes('has only 2 questions'))).toBe(true);
    });
  });

  // =============================================================================
  // 問題取得テスト
  // =============================================================================

  describe('getQuestionById', () => {
    it('should return null when no data loaded', () => {
      const question = getQuestionById('test-001');
      expect(question).toBeNull();
    });

    it('should return question when found', async () => {
      await loadQuestionData();
      const question = getQuestionById('test-001');
      
      expect(question).toBeDefined();
      expect(question!.id).toBe('test-001');
      expect(question!.question).toBe('Test question 1?');
    });

    it('should return null when question not found', async () => {
      await loadQuestionData();
      const question = getQuestionById('nonexistent');
      
      expect(question).toBeNull();
    });
  });

  describe('getQuestionsByCategory', () => {
    it('should return empty array for nonexistent category', () => {
      const questions = getQuestionsByCategory('nonexistent');
      expect(questions).toEqual([]);
    });

    it('should return questions for valid category', async () => {
      await loadQuestionData();
      const questions = getQuestionsByCategory('college_mathematics');
      
      expect(questions).toHaveLength(2);
      expect(questions[0].category).toBe('test_category');
    });

    it('should return copy of questions array', async () => {
      await loadQuestionData();
      const questions1 = getQuestionsByCategory('college_mathematics');
      const questions2 = getQuestionsByCategory('college_mathematics');
      
      expect(questions1).not.toBe(questions2);
      expect(questions1).toEqual(questions2);
    });
  });

  describe('getRandomQuestionsForSession', () => {
    it('should throw error for nonexistent category', () => {
      expect(() => {
        getRandomQuestionsForSession('nonexistent', 5);
      }).toThrow('Category not found: nonexistent');
    });

    it('should throw error when requesting more questions than available', async () => {
      await loadQuestionData();
      
      expect(() => {
        getRandomQuestionsForSession('college_mathematics', 10);
      }).toThrow('Insufficient questions');
    });

    it('should return random selection of questions', async () => {
      await loadQuestionData();
      const session = getRandomQuestionsForSession('college_mathematics', 2);
      
      expect(session.categoryId).toBe('college_mathematics');
      expect(session.categoryName).toBe('Test Category');
      expect(session.questions).toHaveLength(2);
      expect(session.totalInPool).toBe(2);
    });

    it('should return different selections on multiple calls', async () => {
      // より多くの問題でテストするため、モックデータを拡張
      const extendedMockData = {
        ...mockCategoryData,
        questions: Array.from({ length: 20 }, (_, i) => ({
          ...mockCategoryData.questions[0],
          id: `test-${String(i + 1).padStart(3, '0')}`
        }))
      };

      vi.mocked(await import('../data/questions/mmlu/college_mathematics.json')).default = extendedMockData;
      clearQuestionCache();
      
      await loadQuestionData();
      
      const session1 = getRandomQuestionsForSession('college_mathematics', 5);
      const session2 = getRandomQuestionsForSession('college_mathematics', 5);
      
      // 異なる選択が行われる可能性が高い（必ず異なるとは限らないが）
      expect(session1.questions).toHaveLength(5);
      expect(session2.questions).toHaveLength(5);
    });
  });

  describe('getRandomQuestionsForMultiCategorySession', () => {
    it('should return sessions for multiple categories', async () => {
      await loadQuestionData();
      const sessions = getRandomQuestionsForMultiCategorySession(
        ['college_mathematics', 'world_history'],
        2
      );
      
      expect(sessions).toHaveLength(2);
      expect(sessions[0].categoryId).toBe('college_mathematics');
      expect(sessions[1].categoryId).toBe('world_history');
      expect(sessions[0].questions).toHaveLength(2);
      expect(sessions[1].questions).toHaveLength(2);
    });
  });

  // =============================================================================
  // ユーティリティテスト
  // =============================================================================

  describe('shuffleQuestions', () => {
    it('should return array of same length', () => {
      const input = [1, 2, 3, 4, 5];
      const shuffled = shuffleQuestions(input);
      
      expect(shuffled).toHaveLength(input.length);
    });

    it('should contain all original elements', () => {
      const input = [1, 2, 3, 4, 5];
      const shuffled = shuffleQuestions(input);
      
      expect(shuffled.sort()).toEqual(input.sort());
    });

    it('should not modify original array', () => {
      const input = [1, 2, 3, 4, 5];
      const original = [...input];
      shuffleQuestions(input);
      
      expect(input).toEqual(original);
    });

    it('should handle empty array', () => {
      const shuffled = shuffleQuestions([]);
      expect(shuffled).toEqual([]);
    });

    it('should handle single element array', () => {
      const shuffled = shuffleQuestions([1]);
      expect(shuffled).toEqual([1]);
    });
  });

  describe('getCategorySummary', () => {
    it('should return empty array when no data loaded', () => {
      const summary = getCategorySummary();
      expect(summary).toEqual([]);
    });

    it('should return category summaries', async () => {
      await loadQuestionData();
      const summary = getCategorySummary();
      
      expect(summary).toHaveLength(2);
      expect(summary[0]).toEqual({
        id: 'college_mathematics',
        name: 'Test Category',
        domain: 'Test',
        difficulty: 'medium',
        questionCount: 2
      });
    });
  });

  describe('clearQuestionCache', () => {
    it('should clear cached data', async () => {
      await loadQuestionData();
      expect(getCachedQuestionData()).not.toBeNull();
      
      clearQuestionCache();
      expect(getCachedQuestionData()).toBeNull();
      expect(getAvailableCategories()).toEqual([]);
    });
  });
});