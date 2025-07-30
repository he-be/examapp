import React from 'react';

interface QuestionNavigationProps {
  currentIndex: number;
  totalQuestions: number;
  onPrevious: () => void;
  onNext: () => void;
  onGoToQuestion: (index: number) => void;
  answeredQuestions: Set<number>;
  canNavigate?: boolean;
}

export const QuestionNavigation: React.FC<QuestionNavigationProps> = ({
  currentIndex,
  totalQuestions,
  onPrevious,
  onNext,
  onGoToQuestion,
  answeredQuestions,
  canNavigate = true,
}) => {
  const canGoPrevious = currentIndex > 0 && canNavigate;
  const canGoNext = currentIndex < totalQuestions - 1 && canNavigate;

  const getQuestionButtonClass = (index: number): string => {
    const baseClass = 'w-10 h-10 rounded-lg border text-sm font-medium transition-colors ';

    if (index === currentIndex) {
      return baseClass + 'bg-blue-600 text-white border-blue-600';
    } else if (answeredQuestions.has(index)) {
      return baseClass + 'bg-green-100 text-green-800 border-green-300 hover:bg-green-200';
    } else {
      return baseClass + 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50';
    }
  };

  // Generate array of question numbers
  const questionNumbers = Array.from({ length: totalQuestions }, (_, i) => i);

  // For large number of questions, show a condensed view
  const shouldShowCondensed = totalQuestions > 20;

  const getVisibleQuestions = (): number[] => {
    if (!shouldShowCondensed) {
      return questionNumbers;
    }

    // Show first 3, current question area (±2), and last 3
    const visible = new Set<number>();

    // First 3
    for (let i = 0; i < Math.min(3, totalQuestions); i++) {
      visible.add(i);
    }

    // Current area (±2)
    for (
      let i = Math.max(0, currentIndex - 2);
      i <= Math.min(totalQuestions - 1, currentIndex + 2);
      i++
    ) {
      visible.add(i);
    }

    // Last 3
    for (let i = Math.max(0, totalQuestions - 3); i < totalQuestions; i++) {
      visible.add(i);
    }

    return Array.from(visible).sort((a, b) => a - b);
  };

  const visibleQuestions = getVisibleQuestions();

  const renderQuestionButton = (index: number) => (
    <button
      key={index}
      onClick={() => canNavigate && onGoToQuestion(index)}
      disabled={!canNavigate}
      className={getQuestionButtonClass(index)}
      title={`問題 ${index + 1}${answeredQuestions.has(index) ? ' (回答済み)' : ''}`}
    >
      {index + 1}
    </button>
  );

  const renderEllipsis = (key: string) => (
    <span key={key} className="flex items-center justify-center w-10 h-10 text-gray-400">
      ⋯
    </span>
  );

  return (
    <div className="bg-white border-t border-gray-200 p-4">
      <div className="flex flex-col space-y-4">
        {/* Progress Info */}
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>
            問題 {currentIndex + 1} / {totalQuestions}
          </span>
          <span>
            回答済み: {answeredQuestions.size} / {totalQuestions}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }}
          />
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between">
          <button
            onClick={onPrevious}
            disabled={!canGoPrevious}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            前の問題
          </button>

          <button
            onClick={onNext}
            disabled={!canGoNext}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            次の問題
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        {/* Question Grid */}
        <div className="flex flex-wrap gap-2 justify-center">
          {visibleQuestions.map((index, i) => {
            const prevIndex = i > 0 ? visibleQuestions[i - 1] : -1;
            const needsEllipsis = prevIndex >= 0 && index - prevIndex > 1;

            return (
              <React.Fragment key={index}>
                {needsEllipsis && renderEllipsis(`ellipsis-${index}`)}
                {renderQuestionButton(index)}
              </React.Fragment>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-600 rounded"></div>
            <span>現在の問題</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
            <span>回答済み</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-white border border-gray-300 rounded"></div>
            <span>未回答</span>
          </div>
        </div>
      </div>
    </div>
  );
};
