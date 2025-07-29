import type { 
  StoredData, 
  UserProgress, 
  TestResults, 
  UserPreferences,
  StorageError 
} from '../types'

// =============================================================================
// 定数定義
// =============================================================================

const STORAGE_KEYS = {
  PROGRESS: 'llmTestProgress',
  HISTORY: 'llmTestHistory', 
  PREFERENCES: 'userPreferences',
  VERSION: 'llmDataVersion'
} as const

const CURRENT_VERSION = '1.0.0'

const DEFAULT_PREFERENCES: UserPreferences = {
  language: 'ja',
  theme: 'light',
  fontSize: 'medium',
  highContrast: false,
  autoSave: true
}

// =============================================================================
// エラーハンドリング
// =============================================================================

class StorageErrorImpl extends Error implements StorageError {
  constructor(
    message: string,
    public operation: 'read' | 'write' | 'delete',
    public details?: any
  ) {
    super(message)
    this.name = 'StorageError'
  }
}

// =============================================================================
// 基本的なlocalStorage操作
// =============================================================================

/**
 * localStorageから安全にデータを読み取る
 */
function safeGetItem<T>(key: string, defaultValue: T): T {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      console.warn('localStorage is not available')
      return defaultValue
    }

    const item = window.localStorage.getItem(key)
    if (item === null) {
      return defaultValue
    }

    return JSON.parse(item)
  } catch (error) {
    console.error(`Failed to read from localStorage (key: ${key}):`, error)
    return defaultValue
  }
}

/**
 * localStorageに安全にデータを書き込む
 */
function safeSetItem<T>(key: string, value: T): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      throw new StorageErrorImpl('localStorage is not available', 'write')
    }

    const serialized = JSON.stringify(value)
    window.localStorage.setItem(key, serialized)
  } catch (error) {
    if (error instanceof DOMException && error.code === 22) {
      // Storage quota exceeded
      throw new StorageErrorImpl(
        'Storage quota exceeded. Please clear some data and try again.',
        'write',
        { originalError: error }
      )
    }
    throw new StorageErrorImpl(
      `Failed to write to localStorage (key: ${key})`,
      'write',
      { originalError: error }
    )
  }
}

/**
 * localStorageから安全にデータを削除する
 */
function safeRemoveItem(key: string): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      throw new StorageErrorImpl('localStorage is not available', 'delete')
    }

    window.localStorage.removeItem(key)
  } catch (error) {
    throw new StorageErrorImpl(
      `Failed to remove from localStorage (key: ${key})`,
      'delete',
      { originalError: error }
    )
  }
}

// =============================================================================
// データマイグレーション
// =============================================================================

/**
 * データスキーマをチェックし、必要に応じてマイグレーションを実行
 */
function migrateDataIfNeeded(): void {
  const storedVersion = safeGetItem(STORAGE_KEYS.VERSION, '')
  
  if (storedVersion !== CURRENT_VERSION) {
    console.log(`Migrating data from version ${storedVersion || 'initial'} to ${CURRENT_VERSION}`)
    
    // 将来のマイグレーション処理をここに実装
    // 現在は初回バージョンなので何もしない
    
    safeSetItem(STORAGE_KEYS.VERSION, CURRENT_VERSION)
  }
}

// =============================================================================
// 進捗管理機能
// =============================================================================

/**
 * 現在のテスト進捗を取得
 */
export function getCurrentProgress(): UserProgress | null {
  migrateDataIfNeeded()
  return safeGetItem<UserProgress | null>(STORAGE_KEYS.PROGRESS, null)
}

/**
 * テスト進捗を保存
 */
export function saveProgress(progress: UserProgress): void {
  try {
    safeSetItem(STORAGE_KEYS.PROGRESS, progress)
  } catch (error) {
    console.error('Failed to save progress:', error)
    throw error
  }
}

/**
 * テスト進捗をクリア
 */
export function clearProgress(): void {
  try {
    safeRemoveItem(STORAGE_KEYS.PROGRESS)
  } catch (error) {
    console.error('Failed to clear progress:', error)
    throw error
  }
}

/**
 * 指定したテストタイプの進行中テストがあるかチェック
 */
export function hasActiveTest(testType?: string): boolean {
  const progress = getCurrentProgress()
  if (!progress || progress.isCompleted) {
    return false
  }
  
  if (testType && progress.testType !== testType) {
    return false
  }
  
  return true
}

// =============================================================================
// テスト履歴管理機能
// =============================================================================

/**
 * テスト履歴を取得
 */
export function getTestHistory(): TestResults[] {
  migrateDataIfNeeded()
  return safeGetItem<TestResults[]>(STORAGE_KEYS.HISTORY, [])
}

/**
 * テスト結果を履歴に追加
 */
export function addTestResult(result: TestResults): void {
  try {
    const history = getTestHistory()
    const updatedHistory = [result, ...history].slice(0, 50) // 最新50件まで保持
    safeSetItem(STORAGE_KEYS.HISTORY, updatedHistory)
  } catch (error) {
    console.error('Failed to add test result:', error)
    throw error
  }
}

/**
 * 指定したテストタイプの履歴を取得
 */
export function getTestHistoryByType(testType: string): TestResults[] {
  return getTestHistory().filter(result => result.testType === testType)
}

/**
 * 最新のテスト結果を取得
 */
export function getLatestTestResult(testType?: string): TestResults | null {
  const history = testType ? getTestHistoryByType(testType) : getTestHistory()
  return history.length > 0 ? history[0] : null
}

/**
 * テスト履歴をクリア
 */
export function clearTestHistory(): void {
  try {
    safeSetItem(STORAGE_KEYS.HISTORY, [])
  } catch (error) {
    console.error('Failed to clear test history:', error)
    throw error
  }
}

// =============================================================================
// ユーザー設定管理機能
// =============================================================================

/**
 * ユーザー設定を取得
 */
export function getUserPreferences(): UserPreferences {
  migrateDataIfNeeded()
  return safeGetItem<UserPreferences>(STORAGE_KEYS.PREFERENCES, DEFAULT_PREFERENCES)
}

/**
 * ユーザー設定を保存
 */
export function saveUserPreferences(preferences: Partial<UserPreferences>): void {
  try {
    const current = getUserPreferences()
    const updated = { ...current, ...preferences }
    safeSetItem(STORAGE_KEYS.PREFERENCES, updated)
  } catch (error) {
    console.error('Failed to save user preferences:', error)
    throw error
  }
}

/**
 * ユーザー設定をリセット
 */
export function resetUserPreferences(): void {
  try {
    safeSetItem(STORAGE_KEYS.PREFERENCES, DEFAULT_PREFERENCES)
  } catch (error) {
    console.error('Failed to reset user preferences:', error)
    throw error
  }
}

// =============================================================================
// 統合データ管理機能
// =============================================================================

/**
 * すべてのストレージデータを取得
 */
export function getAllStoredData(): StoredData {
  return {
    llmTestProgress: getCurrentProgress() || undefined,
    llmTestHistory: getTestHistory(),
    userPreferences: getUserPreferences(),
    version: CURRENT_VERSION
  }
}

/**
 * すべてのストレージデータをクリア
 */
export function clearAllData(): void {
  try {
    clearProgress()
    clearTestHistory()
    resetUserPreferences()
    safeSetItem(STORAGE_KEYS.VERSION, CURRENT_VERSION)
  } catch (error) {
    console.error('Failed to clear all data:', error)
    throw error
  }
}

/**
 * ストレージ使用量を取得（概算）
 */
export function getStorageUsage(): { used: number; total: number; percentage: number } {
  if (typeof window === 'undefined' || !window.localStorage) {
    return { used: 0, total: 0, percentage: 0 }
  }

  try {
    let totalSize = 0
    for (const key in window.localStorage) {
      if (Object.prototype.hasOwnProperty.call(window.localStorage, key)) {
        totalSize += window.localStorage[key].length + key.length
      }
    }

    // Most browsers limit localStorage to ~5-10MB
    const estimatedTotal = 5 * 1024 * 1024 // 5MB in bytes
    const percentage = Math.round((totalSize / estimatedTotal) * 100)

    return {
      used: totalSize,
      total: estimatedTotal,
      percentage: Math.min(percentage, 100)
    }
  } catch (error) {
    console.error('Failed to calculate storage usage:', error)
    return { used: 0, total: 0, percentage: 0 }
  }
}

// =============================================================================
// セッション管理機能
// =============================================================================

/**
 * セッションタイムアウトをチェック（24時間）
 */
export function checkSessionTimeout(): boolean {
  const progress = getCurrentProgress()
  if (!progress) return false

  const now = Date.now()
  const sessionTimeout = 24 * 60 * 60 * 1000 // 24時間
  
  if (now - progress.startTime > sessionTimeout) {
    console.log('Session timeout detected, clearing progress')
    clearProgress()
    return true
  }
  
  return false
}

/**
 * 自動保存の設定に基づいて進捗を保存
 */
export function autoSaveProgress(progress: UserProgress): void {
  const preferences = getUserPreferences()
  if (preferences.autoSave) {
    saveProgress(progress)
  }
}

// =============================================================================
// データ検証機能
// =============================================================================

/**
 * 保存されたデータの整合性をチェック
 */
export function validateStoredData(): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  try {
    // 進捗データの検証
    const progress = getCurrentProgress()
    if (progress) {
      if (!progress.testId || !progress.testType) {
        errors.push('Invalid progress data: missing required fields')
      }
      if (progress.currentQuestionIndex < 0) {
        errors.push('Invalid progress data: negative question index')
      }
    }

    // 履歴データの検証
    const history = getTestHistory()
    if (!Array.isArray(history)) {
      errors.push('Invalid history data: not an array')
    }

    // 設定データの検証
    const preferences = getUserPreferences()
    if (!preferences.language || !preferences.theme) {
      errors.push('Invalid preferences data: missing required fields')
    }

  } catch (error) {
    errors.push(`Data validation error: ${error}`)
  }

  return {
    valid: errors.length === 0,
    errors
  }
}