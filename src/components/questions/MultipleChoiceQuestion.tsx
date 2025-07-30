import React from 'react';
import { MMLUQuestion, HellaSwagQuestion, BigBenchQuestion } from '../../types';

interface MultipleChoiceQuestionProps {
  question: MMLUQuestion | HellaSwagQuestion | BigBenchQuestion;
  selectedAnswer?: string | number;
  onAnswerSelect: (answer: string | number) => void;
  showFeedback?: boolean;
  isDisabled?: boolean;
}

export const MultipleChoiceQuestion: React.FC<MultipleChoiceQuestionProps> = ({
  question,
  selectedAnswer,
  onAnswerSelect,
  showFeedback = false,
  isDisabled = false,
}) => {
  const isCorrect = selectedAnswer !== undefined && selectedAnswer === question.correctAnswer;
  const hasAnswered = selectedAnswer !== undefined;

  const getChoiceLabel = (index: number): string => {
    return String.fromCharCode(65 + index); // A, B, C, D...
  };

  const getChoiceClassName = (index: number): string => {
    const baseClass = 'block w-full p-4 text-left border rounded-lg transition-colors ';

    if (!hasAnswered || !showFeedback) {
      return (
        baseClass +
        (selectedAnswer === index
          ? 'border-blue-500 bg-blue-50 hover:bg-blue-100'
          : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50')
      );
    }

    // Show feedback colors
    if (index === question.correctAnswer) {
      return baseClass + 'border-green-500 bg-green-50';
    } else if (selectedAnswer === index) {
      return baseClass + 'border-red-500 bg-red-50';
    } else {
      return baseClass + 'border-gray-300 bg-gray-50 opacity-60';
    }
  };

  return (
    <div className="space-y-4">
      {/* Question Text */}
      <div className="p-6 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-2">問題</h3>
        <p className="text-gray-700 whitespace-pre-wrap">{question.question}</p>
      </div>

      {/* Category Badge (for MMLU) */}
      {'category' in question && (
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-full">
            {question.category}
          </span>
          {'difficulty' in question && (
            <span
              className={`px-3 py-1 text-sm rounded-full ${
                question.difficulty === 'easy'
                  ? 'bg-green-100 text-green-800'
                  : question.difficulty === 'medium'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
              }`}
            >
              {question.difficulty === 'easy'
                ? '易'
                : question.difficulty === 'medium'
                  ? '中'
                  : '難'}
            </span>
          )}
        </div>
      )}

      {/* Answer Choices */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">選択肢を選んでください：</h4>
        {question.choices.map((choice: string, index: number) => (
          <button
            key={index}
            onClick={() => !isDisabled && onAnswerSelect(index)}
            disabled={isDisabled}
            className={getChoiceClassName(index)}
          >
            <div className="flex items-start">
              <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-white border rounded-full mr-3">
                {getChoiceLabel(index)}
              </span>
              <span className="flex-1">{choice}</span>
              {showFeedback && hasAnswered && index === question.correctAnswer && (
                <svg
                  className="w-5 h-5 text-green-600 ml-2 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
              {showFeedback && hasAnswered && selectedAnswer === index && !isCorrect && (
                <svg
                  className="w-5 h-5 text-red-600 ml-2 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Feedback */}
      {showFeedback && hasAnswered && (
        <div
          className={`p-4 rounded-lg ${isCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}
        >
          <p className={`font-medium mb-2 ${isCorrect ? 'text-green-800' : 'text-red-800'}`}>
            {isCorrect ? '正解です！' : '不正解です'}
          </p>
          {question.explanation && <p className="text-gray-700">{question.explanation}</p>}
        </div>
      )}
    </div>
  );
};
