import React from 'react';
import { Question, GSM8KQuestion, DROPQuestion } from '../../types';
import { MultipleChoiceQuestion } from './MultipleChoiceQuestion';
import { NumericInputQuestion } from './NumericInputQuestion';
import { LongTextQuestion } from './LongTextQuestion';

interface QuestionDisplayProps {
  question: Question;
  selectedAnswer?: string | number;
  onAnswerSelect: (answer: string | number) => void;
  showFeedback?: boolean;
  isDisabled?: boolean;
}

export const QuestionDisplay: React.FC<QuestionDisplayProps> = ({
  question,
  selectedAnswer,
  onAnswerSelect,
  showFeedback = false,
  isDisabled = false,
}) => {
  // Render appropriate component based on question type
  switch (question.type) {
    case 'multiple-choice':
      return (
        <MultipleChoiceQuestion
          question={question}
          selectedAnswer={selectedAnswer}
          onAnswerSelect={onAnswerSelect}
          showFeedback={showFeedback}
          isDisabled={isDisabled}
        />
      );

    case 'numeric':
      return (
        <NumericInputQuestion
          question={question as GSM8KQuestion}
          selectedAnswer={selectedAnswer}
          onAnswerSelect={onAnswerSelect}
          showFeedback={showFeedback}
          isDisabled={isDisabled}
        />
      );

    case 'text':
      return (
        <LongTextQuestion
          question={question as DROPQuestion}
          selectedAnswer={selectedAnswer}
          onAnswerSelect={onAnswerSelect}
          showFeedback={showFeedback}
          isDisabled={isDisabled}
        />
      );

    default:
      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600">Unknown question type: {(question as any).type}</p>
        </div>
      );
  }
};
