import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  loadQuestionData,
  getCategorySummary,
  getRandomQuestionsForSession,
} from '../../utils/questionDataManager';
import type { SessionQuestions, CategorySummary } from '../../types';

const benchmarkInfo = {
  mmlu: {
    name: 'MMLU',
    fullName: 'Massive Multitask Language Understanding',
    description: '57の多様な分野から出題される多肢選択式クイズ',
  },
  gsm8k: {
    name: 'GSM-8K',
    fullName: 'Grade School Math 8K',
    description: '小学校レベルの算数知識で解ける多段階思考問題',
  },
  hellaswag: {
    name: 'HellaSwag',
    fullName: 'Hard Endings for Large Language Models',
    description: '日常的なシナリオの常識的な結末を選択する問題',
  },
  bigbench: {
    name: 'BIG-Bench-Hard',
    fullName: 'Beyond the Imitation Game Benchmark - Hard',
    description: '現在のLLMが特に苦手とする高度な推論問題',
  },
  drop: {
    name: 'DROP',
    fullName: 'Discrete Reasoning Over Paragraphs',
    description: '長文読解に基づく情報抽出・加工問題',
  },
};

// =============================================================================
// MMLU Test Page Component
// =============================================================================

const MMLUTestPage: React.FC = () => {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [currentSession, setCurrentSession] = useState<SessionQuestions | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});
  const [showFeedback, setShowFeedback] = useState(false);
  const [practiceMode, setPracticeMode] = useState(true);
  const [testStarted, setTestStarted] = useState(false);
  const [testCompleted, setTestCompleted] = useState(false);

  // Load available categories
  const [categorySummary, setCategorySummary] = useState<CategorySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoading(true);
        await loadQuestionData();
        const summary = getCategorySummary();
        setCategorySummary(summary);
        setError(null);
      } catch (error) {
        console.error('Failed to load MMLU categories:', error);
        setError('Failed to load MMLU categories. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadCategories();
  }, []);

  const startTest = () => {
    if (selectedCategories.length === 0) return;

    try {
      // Verify question data is loaded before starting
      if (categorySummary.length === 0) {
        setError('Question data is still loading. Please wait a moment and try again.');
        return;
      }

      // For now, start with single category - use available question count
      const selectedCategoryId = selectedCategories[0];
      const categoryInfo = categorySummary.find((cat) => cat.id === selectedCategoryId);
      const availableQuestions = categoryInfo?.questionCount || 0;

      if (availableQuestions === 0) {
        setError(
          `No questions available for category "${categoryInfo?.name || selectedCategoryId}". Please select a different category.`
        );
        return;
      }

      const questionsToUse = Math.min(20, availableQuestions); // Use up to 20 questions, but no more than available

      const session = getRandomQuestionsForSession(selectedCategoryId, questionsToUse);
      setCurrentSession(session);
      setCurrentQuestionIndex(0);
      setUserAnswers({});
      setShowFeedback(false);
      setTestStarted(true);
    } catch (error) {
      console.error('Failed to start MMLU test:', error);
      if (error instanceof Error) {
        if (error.message.includes('Category not found')) {
          setError(
            `The selected category "${selectedCategories[0]}" is not available yet. Please select a different category.`
          );
        } else if (error.message.includes('Insufficient questions')) {
          setError(
            'Not enough questions available for this category. Please select a different category.'
          );
        } else {
          setError('Failed to start test. Please try again or select a different category.');
        }
      } else {
        setError('Failed to start test. Please try again.');
      }
    }
  };

  const handleAnswerSelect = (questionId: string, answerIndex: number) => {
    const newAnswers = {
      ...userAnswers,
      [questionId]: answerIndex,
    };
    setUserAnswers(newAnswers);

    if (practiceMode) {
      setShowFeedback(true);
    }

    // Check if test is completed (all questions answered)
    if (currentSession && Object.keys(newAnswers).length === currentSession.questions.length) {
      setTestCompleted(true);
    }
  };

  const nextQuestion = () => {
    if (!currentSession || currentQuestionIndex >= currentSession.questions.length - 1) return;

    setCurrentQuestionIndex((prev) => prev + 1);
    setShowFeedback(false);
  };

  const previousQuestion = () => {
    if (currentQuestionIndex <= 0) return;

    setCurrentQuestionIndex((prev) => prev - 1);
    setShowFeedback(false);
  };

  const resetTest = () => {
    setTestStarted(false);
    setCurrentSession(null);
    setCurrentQuestionIndex(0);
    setUserAnswers({});
    setShowFeedback(false);
    setTestCompleted(false);
  };

  const calculateResults = () => {
    if (!currentSession) return { correct: 0, total: 0, percentage: 0 };

    let correct = 0;
    currentSession.questions.forEach((question) => {
      const userAnswer = userAnswers[question.id];
      if (userAnswer === question.correctAnswer) {
        correct++;
      }
    });

    const total = currentSession.questions.length;
    const percentage = Math.round((correct / total) * 100);

    return { correct, total, percentage };
  };

  if (loading) {
    return (
      <div className="container">
        <div className="card" style={{ textAlign: 'center' }}>
          <p>Loading MMLU categories...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="card" style={{ textAlign: 'center' }}>
          <h2 style={{ color: 'var(--color-error)', marginBottom: 'var(--spacing-lg)' }}>Error</h2>
          <p style={{ marginBottom: 'var(--spacing-lg)' }}>{error}</p>
          <Link to="/" className="btn btn-primary">
            ホームに戻る
          </Link>
        </div>
      </div>
    );
  }

  if (!testStarted) {
    return (
      <div className="container">
        <div className="mmlu-test-setup">
          <h1 style={{ textAlign: 'center', marginBottom: 'var(--spacing-lg)' }}>
            MMLU Benchmark Test
          </h1>
          <p style={{ textAlign: 'center', marginBottom: 'var(--spacing-xl)' }}>
            Test your knowledge across multiple academic disciplines with questions from the Massive
            Multitask Language Understanding (MMLU) benchmark.
          </p>

          <div className="card" style={{ marginBottom: 'var(--spacing-lg)' }}>
            <h3>Test Mode</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                <input
                  type="radio"
                  name="mode"
                  checked={practiceMode}
                  onChange={() => setPracticeMode(true)}
                />
                Practice Mode (with immediate feedback)
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                <input
                  type="radio"
                  name="mode"
                  checked={!practiceMode}
                  onChange={() => setPracticeMode(false)}
                />
                Test Mode (feedback at the end)
              </label>
            </div>
          </div>

          <div className="card">
            <h3>Select Categories</h3>
            <div style={{ display: 'grid', gap: 'var(--spacing-md)' }}>
              {categorySummary.map((category) => (
                <div key={category.id} className="category-option">
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 'var(--spacing-sm)',
                      padding: 'var(--spacing-sm)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--border-radius)',
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(category.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedCategories((prev) => [...prev, category.id]);
                        } else {
                          setSelectedCategories((prev) => prev.filter((id) => id !== category.id));
                        }
                      }}
                      style={{ marginTop: '0.2rem' }}
                    />
                    <div className="category-info">
                      <h4 style={{ margin: 0, marginBottom: 'var(--spacing-xs)' }}>
                        {category.name}
                      </h4>
                      <p
                        className="category-meta"
                        style={{
                          margin: 0,
                          fontSize: '0.875rem',
                          color: 'var(--color-text-secondary)',
                        }}
                      >
                        Domain: {category.domain} | Difficulty: {category.difficulty} | Questions:{' '}
                        {category.questionCount}
                      </p>
                    </div>
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: 'var(--spacing-xl)' }}>
            <button
              onClick={startTest}
              disabled={selectedCategories.length === 0}
              className="btn btn-primary"
              style={{
                padding: 'var(--spacing-md) var(--spacing-lg)',
                fontSize: '1.125rem',
              }}
            >
              Start Test ({selectedCategories.length} category
              {selectedCategories.length !== 1 ? 's' : ''} selected)
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show completion screen when test is completed
  if (testCompleted && currentSession) {
    const results = calculateResults();

    return (
      <div className="container">
        <div className="mmlu-test-completion">
          <div className="card" style={{ textAlign: 'center', marginBottom: 'var(--spacing-lg)' }}>
            <h1
              style={{
                fontSize: '2.5rem',
                marginBottom: 'var(--spacing-lg)',
                color:
                  results.percentage >= 70
                    ? 'var(--color-success)'
                    : results.percentage >= 50
                      ? 'var(--color-warning, #f59e0b)'
                      : 'var(--color-error)',
              }}
            >
              🎉 Test Completed!
            </h1>

            <div
              style={{
                fontSize: '1.5rem',
                marginBottom: 'var(--spacing-xl)',
                color: 'var(--color-text-primary)',
              }}
            >
              <strong>{currentSession.categoryName}</strong>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: 'var(--spacing-lg)',
                marginBottom: 'var(--spacing-xl)',
              }}
            >
              <div className="result-stat">
                <div
                  style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--color-primary)' }}
                >
                  {results.correct}/{results.total}
                </div>
                <div style={{ color: 'var(--color-text-secondary)' }}>Correct</div>
              </div>

              <div className="result-stat">
                <div
                  style={{
                    fontSize: '2rem',
                    fontWeight: 'bold',
                    color:
                      results.percentage >= 70
                        ? 'var(--color-success)'
                        : results.percentage >= 50
                          ? 'var(--color-warning, #f59e0b)'
                          : 'var(--color-error)',
                  }}
                >
                  {results.percentage}%
                </div>
                <div style={{ color: 'var(--color-text-secondary)' }}>Accuracy</div>
              </div>
            </div>

            <div
              style={{
                padding: 'var(--spacing-md)',
                backgroundColor:
                  results.percentage >= 70
                    ? 'var(--color-success-light, #e8f5e8)'
                    : results.percentage >= 50
                      ? 'var(--color-warning-light, #fef3c7)'
                      : 'var(--color-error-light, #fce8e8)',
                borderRadius: 'var(--border-radius)',
                marginBottom: 'var(--spacing-xl)',
              }}
            >
              <p style={{ margin: 0, fontWeight: 'bold' }}>
                {results.percentage >= 70
                  ? 'Excellent work! 🌟'
                  : results.percentage >= 50
                    ? 'Good effort! 👍'
                    : 'Keep practicing! 💪'}
              </p>
              <p style={{ margin: 0 }}>
                {results.percentage >= 70
                  ? 'You have a strong understanding of this topic.'
                  : results.percentage >= 50
                    ? "You're on the right track, but there's room for improvement."
                    : 'Consider reviewing the material and trying again.'}
              </p>
            </div>

            <div
              style={{
                display: 'flex',
                gap: 'var(--spacing-md)',
                justifyContent: 'center',
                flexWrap: 'wrap',
              }}
            >
              <button onClick={resetTest} className="btn btn-primary">
                Take Another Test
              </button>
              <Link to="/" className="btn btn-secondary">
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!currentSession) {
    return (
      <div className="container">
        <div className="card" style={{ textAlign: 'center' }}>
          <p>Loading test session...</p>
        </div>
      </div>
    );
  }

  const currentQuestion = currentSession.questions[currentQuestionIndex];
  const userAnswer = userAnswers[currentQuestion.id];
  const isCorrect = userAnswer === currentQuestion.correctAnswer;

  return (
    <div className="container">
      <div className="mmlu-test-session">
        <div className="card" style={{ marginBottom: 'var(--spacing-lg)' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 'var(--spacing-md)',
            }}
          >
            <h2 style={{ margin: 0 }}>{currentSession.categoryName}</h2>
            <button onClick={resetTest} className="btn btn-secondary">
              Reset Test
            </button>
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div className="progress">
              Question {currentQuestionIndex + 1} of {currentSession.questions.length}
            </div>
            <div
              style={{
                backgroundColor: 'var(--color-primary)',
                color: 'white',
                padding: 'var(--spacing-xs) var(--spacing-sm)',
                borderRadius: 'var(--border-radius)',
                fontSize: '0.875rem',
              }}
            >
              {practiceMode ? 'Practice Mode' : 'Test Mode'}
            </div>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 'var(--spacing-lg)' }}>
          <h3 style={{ marginBottom: 'var(--spacing-lg)' }}>
            Q{currentQuestionIndex + 1}: {currentQuestion.question}
          </h3>

          <div className="answer-choices" style={{ display: 'grid', gap: 'var(--spacing-sm)' }}>
            {currentQuestion.choices.map((choice, index) => (
              <label
                key={index}
                className={`choice-option`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--spacing-sm)',
                  padding: 'var(--spacing-md)',
                  border: '2px solid',
                  borderColor:
                    showFeedback && index === currentQuestion.correctAnswer
                      ? 'var(--color-success)'
                      : showFeedback &&
                          index === userAnswer &&
                          index !== currentQuestion.correctAnswer
                        ? 'var(--color-error)'
                        : 'var(--color-border)',
                  borderRadius: 'var(--border-radius)',
                  backgroundColor:
                    showFeedback && index === currentQuestion.correctAnswer
                      ? 'var(--color-success-light, #e8f5e8)'
                      : showFeedback &&
                          index === userAnswer &&
                          index !== currentQuestion.correctAnswer
                        ? 'var(--color-error-light, #fce8e8)'
                        : 'transparent',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="radio"
                  name={`question-${currentQuestion.id}`}
                  value={index}
                  checked={userAnswer === index}
                  onChange={() => handleAnswerSelect(currentQuestion.id, index)}
                  disabled={showFeedback && practiceMode}
                />
                <span className="choice-text">{choice}</span>
              </label>
            ))}
          </div>

          {showFeedback && practiceMode && (
            <div
              className={`feedback`}
              style={{
                marginTop: 'var(--spacing-lg)',
                padding: 'var(--spacing-md)',
                borderRadius: 'var(--border-radius)',
                backgroundColor: isCorrect
                  ? 'var(--color-success-light, #e8f5e8)'
                  : 'var(--color-error-light, #fce8e8)',
                border: `1px solid ${isCorrect ? 'var(--color-success)' : 'var(--color-error)'}`,
              }}
            >
              <p style={{ margin: 0, marginBottom: 'var(--spacing-sm)' }}>
                <strong>{isCorrect ? '✓ Correct!' : '✗ Incorrect'}</strong>
              </p>
              <p style={{ margin: 0 }}>
                <strong>Explanation:</strong> {currentQuestion.explanation}
              </p>
            </div>
          )}
        </div>

        <div className="card">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <button
              onClick={previousQuestion}
              disabled={currentQuestionIndex === 0}
              className="btn btn-secondary"
            >
              ← Previous
            </button>

            <span
              style={{
                padding: 'var(--spacing-sm) var(--spacing-md)',
                backgroundColor: 'var(--color-background-alt, #f5f5f5)',
                borderRadius: 'var(--border-radius)',
                fontWeight: 'bold',
              }}
            >
              {currentQuestionIndex + 1} / {currentSession.questions.length}
            </span>

            <button
              onClick={nextQuestion}
              disabled={currentQuestionIndex >= currentSession.questions.length - 1}
              className="btn btn-primary"
            >
              Next →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// Main Test Page Component
// =============================================================================

export function TestPage() {
  const { benchmark } = useParams<{ benchmark: string }>();

  if (!benchmark || !benchmarkInfo[benchmark as keyof typeof benchmarkInfo]) {
    return (
      <div className="container">
        <div className="card" style={{ textAlign: 'center' }}>
          <h1 style={{ color: 'var(--color-error)', marginBottom: 'var(--spacing-lg)' }}>
            ベンチマークが見つかりません
          </h1>
          <p style={{ marginBottom: 'var(--spacing-lg)' }}>
            指定されたベンチマークは存在しません。
          </p>
          <Link to="/" className="btn btn-primary">
            ホームに戻る
          </Link>
        </div>
      </div>
    );
  }

  // Route to MMLU test page
  if (benchmark === 'mmlu') {
    return <MMLUTestPage />;
  }

  const info = benchmarkInfo[benchmark as keyof typeof benchmarkInfo];

  return (
    <div className="container">
      <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-2xl)' }}>
        <h1
          style={{
            fontSize: '2.5rem',
            marginBottom: 'var(--spacing-md)',
            color: 'var(--color-primary)',
          }}
        >
          {info.name}
        </h1>
        <p
          style={{
            fontSize: '1.125rem',
            color: 'var(--color-text-secondary)',
            marginBottom: 'var(--spacing-sm)',
          }}
        >
          {info.fullName}
        </p>
        <p style={{ fontSize: '1rem', lineHeight: 1.6 }}>{info.description}</p>
      </div>

      <div className="card" style={{ textAlign: 'center' }}>
        <h2 style={{ marginBottom: 'var(--spacing-lg)' }}>実装中</h2>
        <p style={{ marginBottom: 'var(--spacing-lg)' }}>
          {info.name}ベンチマークは現在実装中です。 完成まで今しばらくお待ちください。
        </p>
        <div style={{ display: 'flex', gap: 'var(--spacing-md)', justifyContent: 'center' }}>
          <Link to="/" className="btn btn-secondary">
            ホームに戻る
          </Link>
          <button className="btn btn-primary" disabled>
            テストを開始（準備中）
          </button>
        </div>
      </div>
    </div>
  );
}
