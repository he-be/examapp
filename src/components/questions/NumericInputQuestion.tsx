import React, { useState, useEffect } from 'react';
import { GSM8KQuestion } from '../../types';

interface NumericInputQuestionProps {
  question: GSM8KQuestion;
  selectedAnswer?: string | number;
  onAnswerSelect: (answer: string | number) => void;
  showFeedback?: boolean;
  isDisabled?: boolean;
}

export const NumericInputQuestion: React.FC<NumericInputQuestionProps> = ({
  question,
  selectedAnswer,
  onAnswerSelect,
  showFeedback = false,
  isDisabled = false,
}) => {
  const [inputValue, setInputValue] = useState<string>(
    selectedAnswer !== undefined ? String(selectedAnswer) : ''
  );
  const [showSteps, setShowSteps] = useState(false);

  useEffect(() => {
    if (selectedAnswer !== undefined) {
      setInputValue(String(selectedAnswer));
    }
  }, [selectedAnswer]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow numbers, decimal point, and negative sign
    if (/^-?\d*\.?\d*$/.test(value) || value === '') {
      setInputValue(value);
    }
  };

  const handleSubmit = () => {
    const numericValue = parseFloat(inputValue);
    if (!isNaN(numericValue)) {
      onAnswerSelect(numericValue);
    }
  };

  const isCorrect =
    selectedAnswer !== undefined &&
    Math.abs(Number(selectedAnswer) - Number(question.correctAnswer)) < 0.001;
  const hasAnswered = selectedAnswer !== undefined;

  return (
    <div className="space-y-4">
      {/* Question Text */}
      <div className="p-6 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-2">問題</h3>
        <p className="text-gray-700 whitespace-pre-wrap">{question.question}</p>
      </div>

      {/* Category Badge */}
      <div className="flex items-center gap-2">
        <span className="px-3 py-1 text-sm bg-purple-100 text-purple-800 rounded-full">
          数学的推論
        </span>
        <span className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-full">GSM-8K</span>
      </div>

      {/* Input Field */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">数値で回答してください：</label>
        <div className="flex gap-3">
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            disabled={isDisabled}
            placeholder="例: 42, 3.14, -10"
            className={`flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
              hasAnswered && showFeedback
                ? isCorrect
                  ? 'border-green-500 focus:ring-green-500'
                  : 'border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:ring-blue-500'
            }`}
          />
          {question.unit && (
            <span className="flex items-center px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-700">
              {question.unit}
            </span>
          )}
          {!hasAnswered && (
            <button
              onClick={handleSubmit}
              disabled={isDisabled || !inputValue}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              回答
            </button>
          )}
        </div>
      </div>

      {/* Chain of Thought Steps */}
      {question.chainOfThought && question.chainOfThought.length > 0 && (
        <div className="border-t pt-4">
          <button
            onClick={() => setShowSteps(!showSteps)}
            className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
          >
            <svg
              className={`w-4 h-4 transition-transform ${showSteps ? 'rotate-90' : ''}`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                clipRule="evenodd"
              />
            </svg>
            解法の手順を見る
          </button>

          {showSteps && (
            <div className="mt-4 space-y-3">
              {question.chainOfThought.map((step, index) => (
                <div key={index} className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </span>
                  <p className="text-gray-700">{step}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Feedback */}
      {showFeedback && hasAnswered && (
        <div
          className={`p-4 rounded-lg ${isCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}
        >
          <p className={`font-medium mb-2 ${isCorrect ? 'text-green-800' : 'text-red-800'}`}>
            {isCorrect ? '正解です！' : '不正解です'}
          </p>
          <p className="text-gray-700">
            正解: {question.correctAnswer}
            {question.unit ? ` ${question.unit}` : ''}
          </p>
          {question.explanation && <p className="mt-2 text-gray-700">{question.explanation}</p>}
        </div>
      )}
    </div>
  );
};
