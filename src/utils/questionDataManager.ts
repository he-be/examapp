import type { MMLUQuestion } from '../types';

// =============================================================================
// 型定義
// =============================================================================

export interface QuestionCategory {
  metadata: {
    category: string;
    name: string;
    description: string;
    domain: string;
    difficulty: string;
    source: string;
    pool_size: number;
    last_updated: string;
  };
  questions: MMLUQuestion[];
}

export interface QuestionPool {
  [categoryId: string]: QuestionCategory;
}

export interface SessionQuestions {
  categoryId: string;
  categoryName: string;
  questions: MMLUQuestion[];
  totalInPool: number;
}

export interface QuestionDataError extends Error {
  code: 'LOAD_ERROR' | 'VALIDATION_ERROR' | 'CATEGORY_NOT_FOUND' | 'INSUFFICIENT_QUESTIONS';
  category?: string;
  details?: unknown;
}

// =============================================================================
// エラーハンドリング
// =============================================================================

class QuestionDataErrorImpl extends Error implements QuestionDataError {
  constructor(
    message: string,
    public code: QuestionDataError['code'],
    public category?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'QuestionDataError';
  }
}

// =============================================================================
// データキャッシュ
// =============================================================================

let questionPool: QuestionPool | null = null;
let availableCategories: string[] = [];

// 利用可能なカテゴリリスト
const MMLU_CATEGORIES = [
  'college_mathematics',
  'world_history',
  'college_physics',
  'computer_science',
  'philosophy',
  'college_medicine',
  'econometrics',
  'world_religions',
] as const;

// =============================================================================
// データ読み込み機能
// =============================================================================

/**
 * 問題データを読み込む
 */
export async function loadQuestionData(): Promise<QuestionPool> {
  if (questionPool) {
    return questionPool;
  }

  try {
    const pool: QuestionPool = {};

    for (const categoryId of MMLU_CATEGORIES) {
      try {
        // 動的インポートでJSONデータを読み込み
        const categoryData = await import(`../data/questions/mmlu/${categoryId}.json`);

        // データ検証
        if (!validateCategoryData(categoryData.default)) {
          throw new QuestionDataErrorImpl(
            `Invalid data format for category: ${categoryId}`,
            'VALIDATION_ERROR',
            categoryId
          );
        }

        pool[categoryId] = categoryData.default;
        console.log(`Loaded ${categoryData.default.questions.length} questions for ${categoryId}`);
      } catch (error) {
        console.warn(`Failed to load category ${categoryId}:`, error);
        // 個別カテゴリの読み込み失敗は続行
      }
    }

    if (Object.keys(pool).length === 0) {
      throw new QuestionDataErrorImpl('No question categories could be loaded', 'LOAD_ERROR');
    }

    questionPool = pool;
    availableCategories = Object.keys(pool);

    console.log(`Question pool loaded with ${availableCategories.length} categories`);
    return pool;
  } catch (error) {
    throw new QuestionDataErrorImpl(
      `Failed to load question data: ${error}`,
      'LOAD_ERROR',
      undefined,
      { originalError: error }
    );
  }
}

/**
 * キャッシュされた問題データを取得
 */
export function getCachedQuestionData(): QuestionPool | null {
  return questionPool;
}

/**
 * 利用可能なカテゴリリストを取得
 */
export function getAvailableCategories(): string[] {
  return [...availableCategories];
}

// =============================================================================
// データ検証機能
// =============================================================================

/**
 * カテゴリデータの形式を検証
 */
function validateCategoryData(data: unknown): data is QuestionCategory {
  if (!data || typeof data !== 'object') {
    return false;
  }

  const category = data as Record<string, unknown>;

  // メタデータの検証
  if (!category.metadata || typeof category.metadata !== 'object') {
    return false;
  }

  const metadata = category.metadata as Record<string, unknown>;
  const requiredMetadataFields = [
    'category',
    'name',
    'description',
    'domain',
    'difficulty',
    'source',
    'pool_size',
  ];

  for (const field of requiredMetadataFields) {
    if (!(field in metadata)) {
      return false;
    }
  }

  // 問題データの検証
  if (!Array.isArray(category.questions)) {
    return false;
  }

  // 各問題の基本的な検証
  for (const question of category.questions) {
    if (!validateQuestionFormat(question)) {
      return false;
    }
  }

  return true;
}

/**
 * 個別問題の形式を検証
 */
function validateQuestionFormat(question: unknown): question is MMLUQuestion {
  if (!question || typeof question !== 'object') {
    return false;
  }

  const q = question as Record<string, unknown>;

  const requiredFields = ['id', 'type', 'question', 'choices', 'correctAnswer', 'category'];

  for (const field of requiredFields) {
    if (!(field in q)) {
      return false;
    }
  }

  // 型チェック
  if (q.type !== 'multiple-choice') {
    return false;
  }

  if (!Array.isArray(q.choices) || q.choices.length !== 4) {
    return false;
  }

  if (typeof q.correctAnswer !== 'number' || q.correctAnswer < 0 || q.correctAnswer > 3) {
    return false;
  }

  return true;
}

/**
 * 問題データの整合性をチェック
 */
export function validateQuestionData(): { valid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!questionPool) {
    errors.push('Question pool not loaded');
    return { valid: false, errors, warnings };
  }

  for (const [categoryId, categoryData] of Object.entries(questionPool)) {
    const questions = categoryData.questions;

    // 重複ID検証
    const questionIds = questions.map((q) => q.id);
    const uniqueIds = new Set(questionIds);
    if (questionIds.length !== uniqueIds.size) {
      errors.push(`Duplicate question IDs found in category: ${categoryId}`);
    }

    // 問題数検証
    if (questions.length < 10) {
      warnings.push(`Category ${categoryId} has only ${questions.length} questions`);
    }

    // correctAnswerの検証
    for (const question of questions) {
      if (question.correctAnswer >= question.choices.length) {
        errors.push(`Invalid correctAnswer index in question: ${question.id}`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

// =============================================================================
// 問題選択機能
// =============================================================================

/**
 * IDで問題を取得
 */
export function getQuestionById(questionId: string): MMLUQuestion | null {
  if (!questionPool) {
    return null;
  }

  for (const categoryData of Object.values(questionPool)) {
    const question = categoryData.questions.find((q) => q.id === questionId);
    if (question) {
      return question;
    }
  }

  return null;
}

/**
 * カテゴリ別に問題を取得
 */
export function getQuestionsByCategory(categoryId: string): MMLUQuestion[] {
  if (!questionPool || !questionPool[categoryId]) {
    return [];
  }

  return [...questionPool[categoryId].questions];
}

/**
 * セッション用にランダムに問題を選択
 */
export function getRandomQuestionsForSession(
  categoryId: string,
  count: number = 20 // 12から20に変更
): SessionQuestions {
  if (!questionPool || !questionPool[categoryId]) {
    throw new QuestionDataErrorImpl(
      `Category not found: ${categoryId}`,
      'CATEGORY_NOT_FOUND',
      categoryId
    );
  }

  const categoryData = questionPool[categoryId];
  const allQuestions = [...categoryData.questions];

  if (allQuestions.length < count) {
    throw new QuestionDataErrorImpl(
      `Insufficient questions in category ${categoryId}: requested ${count}, available ${allQuestions.length}`,
      'INSUFFICIENT_QUESTIONS',
      categoryId
    );
  }

  // Fisher-Yates シャッフルアルゴリズム
  const shuffled = shuffleQuestions(allQuestions);
  const selectedQuestions = shuffled.slice(0, count);

  return {
    categoryId,
    categoryName: categoryData.metadata.name,
    questions: selectedQuestions,
    totalInPool: allQuestions.length,
  };
}

/**
 * 複数カテゴリからセッション用問題を取得
 */
export function getRandomQuestionsForMultiCategorySession(
  categoryIds: string[],
  questionsPerCategory: number = 20 // 12から20に変更
): SessionQuestions[] {
  return categoryIds.map((categoryId) =>
    getRandomQuestionsForSession(categoryId, questionsPerCategory)
  );
}

// =============================================================================
// ユーティリティ機能
// =============================================================================

/**
 * 配列をシャッフル（Fisher-Yates アルゴリズム）
 */
export function shuffleQuestions<T>(array: T[]): T[] {
  const shuffled = [...array];

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}

/**
 * 問題キャッシュをクリア
 */
export function clearQuestionCache(): void {
  questionPool = null;
  availableCategories = [];
  console.log('Question cache cleared');
}

/**
 * カテゴリ情報のサマリーを取得
 */
export function getCategorySummary(): Array<{
  id: string;
  name: string;
  domain: string;
  difficulty: string;
  questionCount: number;
}> {
  if (!questionPool) {
    return [];
  }

  return Object.entries(questionPool).map(([id, data]) => ({
    id,
    name: data.metadata.name,
    domain: data.metadata.domain,
    difficulty: data.metadata.difficulty,
    questionCount: data.questions.length,
  }));
}
