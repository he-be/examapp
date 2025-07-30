import React, { useState, useEffect } from 'react';
import { DROPQuestion } from '../../types';

interface LongTextQuestionProps {
  question: DROPQuestion;
  selectedAnswer?: string | number;
  onAnswerSelect: (answer: string | number) => void;
  showFeedback?: boolean;
  isDisabled?: boolean;
}

export const LongTextQuestion: React.FC<LongTextQuestionProps> = ({
  question,
  selectedAnswer,
  onAnswerSelect,
  showFeedback = false,
  isDisabled = false,
}) => {
  const [inputValue, setInputValue] = useState<string>(
    selectedAnswer !== undefined ? String(selectedAnswer) : ''
  );

  useEffect(() => {
    if (selectedAnswer !== undefined) {
      setInputValue(String(selectedAnswer));
    }
  }, [selectedAnswer]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
  };

  const handleSubmit = () => {
    if (inputValue.trim()) {
      onAnswerSelect(inputValue.trim());
    }
  };

  const isCorrect =
    selectedAnswer !== undefined &&
    String(selectedAnswer).toLowerCase().trim() ===
      String(question.correctAnswer).toLowerCase().trim();
  const hasAnswered = selectedAnswer !== undefined;

  return (
    <div className="space-y-4">
      {/* Passage */}
      {question.passage && (
        <div className="p-6 bg-gray-50 rounded-lg border-l-4 border-blue-500">
          <h3 className="text-lg font-medium text-gray-900 mb-3">文章</h3>
          <div className="prose max-w-none">
            {question.passage.split('\n').map((paragraph, index) => (
              <p key={index} className="text-gray-700 mb-3 last:mb-0">
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Question */}
      <div className="p-6 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-2">問題</h3>
        <p className="text-gray-700 whitespace-pre-wrap">{question.question}</p>
      </div>

      {/* Category Badge */}
      <div className="flex items-center gap-2">
        <span className="px-3 py-1 text-sm bg-orange-100 text-orange-800 rounded-full">
          読解推論
        </span>
        <span className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-full">DROP</span>
      </div>

      {/* Answer Input */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">
          文章を読んで質問に答えてください：
        </label>
        <div className="space-y-3">
          <textarea
            value={inputValue}
            onChange={handleInputChange}
            disabled={isDisabled}
            placeholder="ここに回答を入力してください..."
            rows={4}
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 resize-vertical ${
              hasAnswered && showFeedback
                ? isCorrect
                  ? 'border-green-500 focus:ring-green-500'
                  : 'border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:ring-blue-500'
            }`}
          />
          {!hasAnswered && (
            <button
              onClick={handleSubmit}
              disabled={isDisabled || !inputValue.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              回答を提出
            </button>
          )}
        </div>
      </div>

      {/* Answer Guidelines */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="text-sm font-medium text-blue-800 mb-2">回答のヒント</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• 文章の内容に基づいて正確に答えてください</li>
          <li>• 具体的で簡潔な回答を心がけてください</li>
          <li>• 数値の場合は正確な値を答えてください</li>
          <li>• 文章中の表現をそのまま使っても構いません</li>
        </ul>
      </div>

      {/* Feedback */}
      {showFeedback && hasAnswered && (
        <div
          className={`p-4 rounded-lg ${isCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}
        >
          <p className={`font-medium mb-2 ${isCorrect ? 'text-green-800' : 'text-red-800'}`}>
            {isCorrect ? '正解です！' : '不正解です'}
          </p>
          <div className="space-y-2">
            <p className="text-gray-700">
              <span className="font-medium">正解:</span> {question.correctAnswer}
            </p>
            {question.explanation && (
              <p className="text-gray-700">
                <span className="font-medium">解説:</span> {question.explanation}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
