import type { 
  Question, 
  TestType, 
  MMLUQuestion, 
  GSM8KQuestion, 
  HellaSwagQuestion, 
  BigBenchQuestion, 
  DROPQuestion,
  NetworkError 
} from '../types'

// =============================================================================
// 定数定義
// =============================================================================

const DATA_BASE_URL = '/questions'
const CACHE_DURATION = 1000 * 60 * 60 // 1時間
const MAX_RETRIES = 3
const RETRY_DELAY = 1000 // 1秒

// =============================================================================
// エラーハンドリング
// =============================================================================

class NetworkErrorImpl extends Error implements NetworkError {
  constructor(
    message: string,
    public status?: number,
    public details?: any
  ) {
    super(message)
    this.name = 'NetworkError'
  }
}

// =============================================================================
// キャッシュ管理
// =============================================================================

interface CacheEntry<T> {
  data: T
  timestamp: number
  expires: number
}

class DataCache {
  private cache = new Map<string, CacheEntry<any>>()

  set<T>(key: string, data: T, duration: number = CACHE_DURATION): void {
    const now = Date.now()
    this.cache.set(key, {
      data,
      timestamp: now,
      expires: now + duration
    })
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) {
      return null
    }

    if (Date.now() > entry.expires) {
      this.cache.delete(key)
      return null
    }

    return entry.data as T
  }

  clear(): void {
    this.cache.clear()
  }

  size(): number {
    return this.cache.size
  }

  // 期限切れエントリを削除
  cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expires) {
        this.cache.delete(key)
      }
    }
  }
}

const dataCache = new DataCache()

// =============================================================================
// HTTP リクエスト機能
// =============================================================================

/**
 * リトライ機能付きfetch
 */
async function fetchWithRetry(
  url: string, 
  options: Record<string, unknown> = {}, 
  retries: number = MAX_RETRIES
): Promise<Response> {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    })

    if (!response.ok) {
      throw new NetworkErrorImpl(
        `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        { url }
      )
    }

    return response
  } catch (error) {
    if (retries > 0 && (error instanceof TypeError || error instanceof NetworkErrorImpl)) {
      console.warn(`Request failed, retrying... (${retries} attempts left)`)
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY))
      return fetchWithRetry(url, options, retries - 1)
    }
    throw error
  }
}

/**
 * JSONデータを安全に取得
 */
async function fetchJSON<T>(url: string): Promise<T> {
  try {
    const response = await fetchWithRetry(url)
    const data = await response.json()
    return data
  } catch (error) {
    if (error instanceof NetworkErrorImpl) {
      throw error
    }
    throw new NetworkErrorImpl(
      `Failed to fetch or parse JSON from ${url}`,
      undefined,
      { originalError: error }
    )
  }
}

// =============================================================================
// データ検証機能
// =============================================================================

/**
 * 問題データの基本構造を検証
 */
function validateQuestionStructure(question: any): question is Question {
  if (!question || typeof question !== 'object') {
    return false
  }

  const required = ['id', 'type', 'question', 'correctAnswer', 'explanation']
  for (const field of required) {
    if (!(field in question)) {
      console.error(`Missing required field: ${field}`)
      return false
    }
  }

  if (!['multiple-choice', 'numeric', 'text'].includes(question.type)) {
    console.error(`Invalid question type: ${question.type}`)
    return false
  }

  return true
}

/**
 * MMLU問題データの検証
 */
function validateMMLUQuestion(question: any): question is MMLUQuestion {
  if (!validateQuestionStructure(question)) return false
  
  if (question.type !== 'multiple-choice') return false
  if (!Array.isArray(question.choices) || question.choices.length === 0) return false
  if (typeof question.correctAnswer !== 'number') return false
  if (question.correctAnswer < 0 || question.correctAnswer >= question.choices.length) return false
  if (!question.category || typeof question.category !== 'string') return false

  return true
}

/**
 * GSM-8K問題データの検証
 */
function validateGSM8KQuestion(question: any): question is GSM8KQuestion {
  if (!validateQuestionStructure(question)) return false
  
  if (question.type !== 'numeric') return false
  if (typeof question.correctAnswer !== 'number') return false
  if (!Array.isArray(question.chainOfThought)) return false

  return true
}

/**
 * ベンチマーク別のデータ検証
 */
function validateQuestionsByType(questions: any[], testType: TestType): boolean {
  if (!Array.isArray(questions) || questions.length === 0) {
    console.error('Questions must be a non-empty array')
    return false
  }

  const validators: Record<TestType, (q: any) => boolean> = {
    mmlu: validateMMLUQuestion,
    gsm8k: validateGSM8KQuestion,
    hellaswag: validateQuestionStructure, // 基本検証のみ（後で拡張）
    bigbench: validateQuestionStructure,  // 基本検証のみ（後で拡張）
    drop: validateQuestionStructure       // 基本検証のみ（後で拡張）
  }

  const validator = validators[testType]
  if (!validator) {
    console.error(`No validator found for test type: ${testType}`)
    return false
  }

  const invalidQuestions = questions.filter((q, index) => {
    const isValid = validator(q)
    if (!isValid) {
      console.error(`Invalid question at index ${index}:`, q)
    }
    return !isValid
  })

  if (invalidQuestions.length > 0) {
    console.error(`Found ${invalidQuestions.length} invalid questions`)
    return false
  }

  return true
}

// =============================================================================
// データローダー機能
// =============================================================================

/**
 * MMLU問題データを読み込み
 */
export async function loadMMLUQuestions(category?: string): Promise<MMLUQuestion[]> {
  const cacheKey = `mmlu:${category || 'all'}`
  const cached = dataCache.get<MMLUQuestion[]>(cacheKey)
  
  if (cached) {
    return cached
  }

  try {
    const url = category 
      ? `${DATA_BASE_URL}/mmlu/${category}.json`
      : `${DATA_BASE_URL}/mmlu/all.json`
    
    const questions = await fetchJSON<MMLUQuestion[]>(url)
    
    if (!validateQuestionsByType(questions, 'mmlu')) {
      throw new Error('Invalid MMLU question data structure')
    }

    dataCache.set(cacheKey, questions)
    return questions
  } catch (error) {
    console.error('Failed to load MMLU questions:', error)
    throw error
  }
}

/**
 * GSM-8K問題データを読み込み
 */
export async function loadGSM8KQuestions(): Promise<GSM8KQuestion[]> {
  const cacheKey = 'gsm8k:all'
  const cached = dataCache.get<GSM8KQuestion[]>(cacheKey)
  
  if (cached) {
    return cached
  }

  try {
    const url = `${DATA_BASE_URL}/gsm8k/problems.json`
    const questions = await fetchJSON<GSM8KQuestion[]>(url)
    
    if (!validateQuestionsByType(questions, 'gsm8k')) {
      throw new Error('Invalid GSM-8K question data structure')
    }

    dataCache.set(cacheKey, questions)
    return questions
  } catch (error) {
    console.error('Failed to load GSM-8K questions:', error)
    throw error
  }
}

/**
 * HellaSwag問題データを読み込み
 */
export async function loadHellaSwagQuestions(): Promise<HellaSwagQuestion[]> {
  const cacheKey = 'hellaswag:all'
  const cached = dataCache.get<HellaSwagQuestion[]>(cacheKey)
  
  if (cached) {
    return cached
  }

  try {
    const url = `${DATA_BASE_URL}/hellaswag/scenarios.json`
    const questions = await fetchJSON<HellaSwagQuestion[]>(url)
    
    if (!validateQuestionsByType(questions, 'hellaswag')) {
      throw new Error('Invalid HellaSwag question data structure')
    }

    dataCache.set(cacheKey, questions)
    return questions
  } catch (error) {
    console.error('Failed to load HellaSwag questions:', error)
    throw error
  }
}

/**
 * BIG-Bench-Hard問題データを読み込み
 */
export async function loadBigBenchQuestions(): Promise<BigBenchQuestion[]> {
  const cacheKey = 'bigbench:all'
  const cached = dataCache.get<BigBenchQuestion[]>(cacheKey)
  
  if (cached) {
    return cached
  }

  try {
    const url = `${DATA_BASE_URL}/bigbench/hard_tasks.json`
    const questions = await fetchJSON<BigBenchQuestion[]>(url)
    
    if (!validateQuestionsByType(questions, 'bigbench')) {
      throw new Error('Invalid BIG-Bench-Hard question data structure')
    }

    dataCache.set(cacheKey, questions)
    return questions
  } catch (error) {
    console.error('Failed to load BIG-Bench-Hard questions:', error)
    throw error
  }
}

/**
 * DROP問題データを読み込み
 */
export async function loadDROPQuestions(): Promise<DROPQuestion[]> {
  const cacheKey = 'drop:all'
  const cached = dataCache.get<DROPQuestion[]>(cacheKey)
  
  if (cached) {
    return cached
  }

  try {
    const url = `${DATA_BASE_URL}/drop/passages.json`
    const questions = await fetchJSON<DROPQuestion[]>(url)
    
    if (!validateQuestionsByType(questions, 'drop')) {
      throw new Error('Invalid DROP question data structure')
    }

    dataCache.set(cacheKey, questions)
    return questions
  } catch (error) {
    console.error('Failed to load DROP questions:', error)
    throw error
  }
}

// =============================================================================
// 統合ローダー機能
// =============================================================================

/**
 * テストタイプに応じて問題データを読み込み
 */
export async function loadQuestionsByType(
  testType: TestType, 
  options?: { category?: string; limit?: number }
): Promise<Question[]> {
  let questions: Question[]

  switch (testType) {
    case 'mmlu':
      questions = await loadMMLUQuestions(options?.category)
      break
    case 'gsm8k':
      questions = await loadGSM8KQuestions()
      break
    case 'hellaswag':
      questions = await loadHellaSwagQuestions()
      break
    case 'bigbench':
      questions = await loadBigBenchQuestions()
      break
    case 'drop':
      questions = await loadDROPQuestions()
      break
    default:
      throw new Error(`Unsupported test type: ${testType}`)
  }

  // 問題数の制限
  if (options?.limit && options.limit > 0) {
    questions = questions.slice(0, options.limit)
  }

  return questions
}

/**
 * ランダムに問題を選択
 */
export function shuffleQuestions(questions: Question[]): Question[] {
  const shuffled = [...questions]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

/**
 * 問題をランダムに選択して読み込み
 */
export async function loadRandomQuestions(
  testType: TestType, 
  count: number, 
  options?: { category?: string }
): Promise<Question[]> {
  const allQuestions = await loadQuestionsByType(testType, options)
  const shuffled = shuffleQuestions(allQuestions)
  return shuffled.slice(0, count)
}

// =============================================================================
// キャッシュ管理API
// =============================================================================

/**
 * キャッシュをクリア
 */
export function clearDataCache(): void {
  dataCache.clear()
}

/**
 * キャッシュの統計情報を取得
 */
export function getCacheStats(): { size: number; entries: string[] } {
  return {
    size: dataCache.size(),
    entries: Array.from((dataCache as any).cache.keys())
  }
}

/**
 * 期限切れキャッシュをクリーンアップ
 */
export function cleanupCache(): void {
  dataCache.cleanup()
}

// =============================================================================
// データ事前読み込み機能
// =============================================================================

/**
 * すべてのベンチマークデータを事前読み込み
 */
export async function preloadAllData(): Promise<void> {
  const loadPromises = [
    loadMMLUQuestions().catch(error => console.warn('Failed to preload MMLU:', error)),
    loadGSM8KQuestions().catch(error => console.warn('Failed to preload GSM-8K:', error)),
    loadHellaSwagQuestions().catch(error => console.warn('Failed to preload HellaSwag:', error)),
    loadBigBenchQuestions().catch(error => console.warn('Failed to preload BIG-Bench-Hard:', error)),
    loadDROPQuestions().catch(error => console.warn('Failed to preload DROP:', error))
  ]

  await Promise.allSettled(loadPromises)
  console.log('Data preloading completed')
}

// =============================================================================
// ヘルスチェック機能
// =============================================================================

/**
 * データソースの利用可能性をチェック
 */
export async function checkDataAvailability(): Promise<Record<TestType, boolean>> {
  const results: Record<TestType, boolean> = {
    mmlu: false,
    gsm8k: false,
    hellaswag: false,
    bigbench: false,
    drop: false
  }

  const checkPromises = Object.keys(results).map(async (testType) => {
    try {
      await loadQuestionsByType(testType as TestType, { limit: 1 })
      results[testType as TestType] = true
    } catch (error) {
      console.warn(`Data not available for ${testType}:`, error)
      results[testType as TestType] = false
    }
  })

  await Promise.allSettled(checkPromises)
  return results
}