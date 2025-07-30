import type {
  BaseQuestion,
  MMLUQuestion,
  GSM8KQuestion,
  BigBenchQuestion,
  DROPQuestion,
  UserAnswer,
} from '../types';

// =============================================================================
// 型定義
// =============================================================================

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  normalizedValue: string | number;
}

export interface ScoringResult {
  isCorrect: boolean;
  score: number; // 0-1の範囲
  feedback?: string;
  partialCredit?: number;
}

export interface TimingResult {
  startTime: number;
  endTime: number;
  timeSpent: number; // 秒
  isWithinTimeLimit?: boolean;
}

// =============================================================================
// 入力検証機能
// =============================================================================

/**
 * 多肢選択式問題の回答を検証
 */
function validateMultipleChoiceAnswer(
  answer: string | number,
  question: MMLUQuestion
): ValidationResult {
  const errors: string[] = [];

  // 数値に変換を試行
  const numericAnswer = typeof answer === 'number' ? answer : parseInt(String(answer), 10);

  if (isNaN(numericAnswer)) {
    errors.push('回答は数値である必要があります');
    return { isValid: false, errors, normalizedValue: answer };
  }

  if (numericAnswer < 0 || numericAnswer >= question.choices.length) {
    errors.push(`回答は0から${question.choices.length - 1}の範囲で選択してください`);
    return { isValid: false, errors, normalizedValue: numericAnswer };
  }

  return {
    isValid: true,
    errors: [],
    normalizedValue: numericAnswer,
  };
}

/**
 * 数値入力問題の回答を検証
 */
function validateNumericAnswer(
  answer: string | number,
  _question: GSM8KQuestion
): ValidationResult {
  const errors: string[] = [];

  // 文字列の場合は数値に変換を試行
  const numericAnswer = typeof answer === 'number' ? answer : parseFloat(String(answer));

  if (isNaN(numericAnswer)) {
    errors.push('回答は有効な数値である必要があります');
    return { isValid: false, errors, normalizedValue: answer };
  }

  if (!isFinite(numericAnswer)) {
    errors.push('回答は有限の数値である必要があります');
    return { isValid: false, errors, normalizedValue: answer };
  }

  // 範囲チェック（非現実的な値を防ぐ）
  if (Math.abs(numericAnswer) > 1e15) {
    errors.push('回答が大きすぎます');
    return { isValid: false, errors, normalizedValue: numericAnswer };
  }

  return {
    isValid: true,
    errors: [],
    normalizedValue: numericAnswer,
  };
}

/**
 * テキスト回答の検証
 */
function validateTextAnswer(
  answer: string | number,
  _question: BigBenchQuestion | DROPQuestion
): ValidationResult {
  const errors: string[] = [];
  const textAnswer = String(answer).trim();

  if (!textAnswer) {
    errors.push('回答を入力してください');
    return { isValid: false, errors, normalizedValue: textAnswer };
  }

  if (textAnswer.length > 1000) {
    errors.push('回答は1000文字以内で入力してください');
    return { isValid: false, errors, normalizedValue: textAnswer };
  }

  // HTMLタグの検出と除去（セキュリティ対策）
  const hasHtmlTags = /<[^>]*>/g.test(textAnswer);
  if (hasHtmlTags) {
    // scriptタグなどの危険なタグは内容も含めて完全に除去
    let sanitizedAnswer = textAnswer
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<[^>]*>/g, '');

    return {
      isValid: true,
      errors: ['HTMLタグは除去されました'],
      normalizedValue: sanitizedAnswer,
    };
  }

  return {
    isValid: true,
    errors: [],
    normalizedValue: textAnswer,
  };
}

/**
 * 回答の入力検証を実行
 */
export function validateAnswer(answer: string | number, question: BaseQuestion): ValidationResult {
  if (answer === null || answer === undefined || answer === '') {
    return {
      isValid: false,
      errors: ['回答が入力されていません'],
      normalizedValue: answer,
    };
  }

  switch (question.type) {
    case 'multiple-choice':
      return validateMultipleChoiceAnswer(answer, question as MMLUQuestion);
    case 'numeric':
      return validateNumericAnswer(answer, question as GSM8KQuestion);
    case 'text':
      return validateTextAnswer(answer, question as BigBenchQuestion | DROPQuestion);
    default:
      return {
        isValid: false,
        errors: ['未対応の問題タイプです'],
        normalizedValue: answer,
      };
  }
}

// =============================================================================
// 正誤判定機能
// =============================================================================

/**
 * 多肢選択式問題の正誤判定
 */
function scoreMultipleChoiceAnswer(userAnswer: number, question: MMLUQuestion): ScoringResult {
  const isCorrect = userAnswer === question.correctAnswer;

  return {
    isCorrect,
    score: isCorrect ? 1 : 0,
    feedback: isCorrect
      ? '正解です！'
      : `不正解です。正解は「${question.choices[question.correctAnswer]}」です。`,
  };
}

/**
 * 数値問題の正誤判定（許容誤差を考慮）
 */
function scoreNumericAnswer(userAnswer: number, question: GSM8KQuestion): ScoringResult {
  const correctAnswer = question.correctAnswer;
  const tolerance = Math.abs(correctAnswer * 0.01); // 1%の許容誤差
  const minTolerance = 0.01; // 最小許容誤差

  const actualTolerance = Math.max(tolerance, minTolerance);
  const difference = Math.abs(userAnswer - correctAnswer);
  const isCorrect = difference <= actualTolerance;

  // 部分点の計算（近い値に対して）
  let partialCredit = 0;
  if (!isCorrect && difference <= actualTolerance * 10) {
    partialCredit = Math.max(0, 1 - difference / (actualTolerance * 10));
  }

  return {
    isCorrect,
    score: isCorrect ? 1 : 0,
    partialCredit,
    feedback: isCorrect
      ? '正解です！'
      : `不正解です。正解は ${correctAnswer}${question.unit || ''} です。`,
  };
}

/**
 * テキスト回答の正誤判定（完全一致またはキーワード一致）
 */
function scoreTextAnswer(
  userAnswer: string,
  question: BigBenchQuestion | DROPQuestion
): ScoringResult {
  const correctAnswer = String(question.correctAnswer).toLowerCase().trim();
  const normalizedUserAnswer = userAnswer.toLowerCase().trim();

  // 完全一致チェック
  if (normalizedUserAnswer === correctAnswer) {
    return {
      isCorrect: true,
      score: 1,
      feedback: '正解です！',
    };
  }

  // キーワード一致チェック（DROPの場合）
  if (
    'possibleAnswers' in question &&
    question.possibleAnswers &&
    Array.isArray(question.possibleAnswers)
  ) {
    const possibleAnswers = question.possibleAnswers.map((ans: string) => ans.toLowerCase().trim());
    const isAccepted = possibleAnswers.some((ans: string) => normalizedUserAnswer === ans);

    if (isAccepted) {
      return {
        isCorrect: true,
        score: 1,
        feedback: '正解です！',
      };
    }
  }

  // 部分一致による部分点（キーワードが含まれている場合）
  const keywords = correctAnswer.split(/\s+/).filter((word) => word.length > 2);
  const matchingKeywords = keywords.filter((keyword) => normalizedUserAnswer.includes(keyword));

  const partialCredit = keywords.length > 0 ? matchingKeywords.length / keywords.length : 0;

  return {
    isCorrect: false,
    score: 0,
    partialCredit: partialCredit > 0.2 ? partialCredit : 0, // 20%以上の一致で部分点
    feedback: `不正解です。正解は「${question.correctAnswer}」です。`,
  };
}

/**
 * 回答の正誤判定を実行
 */
export function scoreAnswer(userAnswer: string | number, question: BaseQuestion): ScoringResult {
  const validation = validateAnswer(userAnswer, question);

  if (!validation.isValid) {
    return {
      isCorrect: false,
      score: 0,
      feedback: `入力エラー: ${validation.errors.join(', ')}`,
    };
  }

  switch (question.type) {
    case 'multiple-choice':
      return scoreMultipleChoiceAnswer(
        validation.normalizedValue as number,
        question as MMLUQuestion
      );
    case 'numeric':
      return scoreNumericAnswer(validation.normalizedValue as number, question as GSM8KQuestion);
    case 'text':
      return scoreTextAnswer(
        validation.normalizedValue as string,
        question as BigBenchQuestion | DROPQuestion
      );
    default:
      return {
        isCorrect: false,
        score: 0,
        feedback: '未対応の問題タイプです',
      };
  }
}

// =============================================================================
// 回答時間計測機能
// =============================================================================

/**
 * 回答開始時刻を記録
 */
export function startAnswerTiming(): number {
  return Date.now();
}

/**
 * 回答時間を計算
 */
export function calculateAnswerTime(startTime: number, endTime?: number): TimingResult {
  const actualEndTime = endTime || Date.now();
  const timeSpent = Math.round((actualEndTime - startTime) / 1000); // 秒単位

  return {
    startTime,
    endTime: actualEndTime,
    timeSpent: Math.max(timeSpent, 1), // 最低1秒
  };
}

/**
 * 制限時間内かどうかをチェック
 */
export function checkTimeLimit(timing: TimingResult, timeLimitSeconds?: number): TimingResult {
  if (!timeLimitSeconds) {
    return timing;
  }

  return {
    ...timing,
    isWithinTimeLimit: timing.timeSpent <= timeLimitSeconds,
  };
}

// =============================================================================
// UserAnswer作成機能
// =============================================================================

/**
 * UserAnswerオブジェクトを作成
 */
export function createUserAnswer(
  questionId: string,
  userInput: string | number,
  question: BaseQuestion,
  startTime: number,
  endTime?: number
): UserAnswer {
  const scoring = scoreAnswer(userInput, question);
  const timing = calculateAnswerTime(startTime, endTime);

  return {
    questionId,
    userAnswer: scoring.isCorrect ? userInput : userInput, // 常に元の入力を保存
    isCorrect: scoring.isCorrect,
    timeSpent: timing.timeSpent,
    timestamp: timing.endTime,
  };
}

// =============================================================================
// バリデーションユーティリティ
// =============================================================================

/**
 * 複数の回答をバッチで検証
 */
export function validateAnswerBatch(
  answers: Array<{ answer: string | number; question: BaseQuestion }>
): ValidationResult[] {
  return answers.map(({ answer, question }) => validateAnswer(answer, question));
}

/**
 * 回答の統計情報を計算
 */
export function calculateAnswerStats(answers: UserAnswer[]): {
  totalAnswers: number;
  correctAnswers: number;
  accuracy: number;
  averageTime: number;
  totalTime: number;
} {
  const totalAnswers = answers.length;
  const correctAnswers = answers.filter((answer) => answer.isCorrect).length;
  const totalTime = answers.reduce((sum, answer) => sum + answer.timeSpent, 0);
  const averageTime = totalAnswers > 0 ? totalTime / totalAnswers : 0;
  const accuracy = totalAnswers > 0 ? (correctAnswers / totalAnswers) * 100 : 0;

  return {
    totalAnswers,
    correctAnswers,
    accuracy: Math.round(accuracy * 100) / 100, // 小数点2位まで
    averageTime: Math.round(averageTime * 100) / 100,
    totalTime,
  };
}
