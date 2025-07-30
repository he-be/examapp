import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QuestionDisplay } from './QuestionDisplay';
import { MMLUQuestion, GSM8KQuestion, DROPQuestion } from '../../types';

describe('QuestionDisplay', () => {
  const mockOnAnswerSelect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const sampleMMLUQuestion: MMLUQuestion = {
    id: 'mmlu-1',
    type: 'multiple-choice',
    question: 'What is 2 + 2?',
    choices: ['3', '4', '5', '6'],
    correctAnswer: 1,
    category: 'mathematics',
    difficulty: 'easy',
    explanation: '2 + 2 = 4',
  };

  const sampleGSM8KQuestion: GSM8KQuestion = {
    id: 'gsm8k-1',
    type: 'numeric',
    question: 'If you have 10 apples and eat 3, how many are left?',
    correctAnswer: 7,
    unit: 'apples',
    explanation: '10 - 3 = 7',
    chainOfThought: ['Start with 10 apples', 'Subtract 3 eaten apples', '10 - 3 = 7'],
  };

  const sampleDROPQuestion: DROPQuestion = {
    id: 'drop-1',
    type: 'text',
    question: "What is the main character's name?",
    passage: 'John walked to the store. He bought some milk and bread.',
    correctAnswer: 'John',
    explanation: 'The passage mentions John as the person who walked to the store.',
    questionType: 'span',
  };

  describe('Multiple Choice Questions', () => {
    it('renders MMLU question correctly', () => {
      render(<QuestionDisplay question={sampleMMLUQuestion} onAnswerSelect={mockOnAnswerSelect} />);

      expect(screen.getByText('What is 2 + 2?')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('4')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('6')).toBeInTheDocument();
      expect(screen.getByText('mathematics')).toBeInTheDocument();
    });

    it('handles answer selection', () => {
      render(<QuestionDisplay question={sampleMMLUQuestion} onAnswerSelect={mockOnAnswerSelect} />);

      const choiceButton = screen.getByText('4').closest('button');
      fireEvent.click(choiceButton!);

      expect(mockOnAnswerSelect).toHaveBeenCalledWith(1);
    });

    it('shows feedback when enabled', () => {
      render(
        <QuestionDisplay
          question={sampleMMLUQuestion}
          selectedAnswer={1}
          onAnswerSelect={mockOnAnswerSelect}
          showFeedback={true}
        />
      );

      expect(screen.getByText('正解です！')).toBeInTheDocument();
      expect(screen.getByText('2 + 2 = 4')).toBeInTheDocument();
    });

    it('shows incorrect feedback', () => {
      render(
        <QuestionDisplay
          question={sampleMMLUQuestion}
          selectedAnswer={0}
          onAnswerSelect={mockOnAnswerSelect}
          showFeedback={true}
        />
      );

      expect(screen.getByText('不正解です')).toBeInTheDocument();
    });

    it('disables interaction when disabled', () => {
      render(
        <QuestionDisplay
          question={sampleMMLUQuestion}
          onAnswerSelect={mockOnAnswerSelect}
          isDisabled={true}
        />
      );

      const choiceButton = screen.getByText('4').closest('button');
      fireEvent.click(choiceButton!);

      expect(mockOnAnswerSelect).not.toHaveBeenCalled();
    });
  });

  describe('Numeric Input Questions', () => {
    it('renders GSM8K question correctly', () => {
      render(
        <QuestionDisplay question={sampleGSM8KQuestion} onAnswerSelect={mockOnAnswerSelect} />
      );

      expect(
        screen.getByText('If you have 10 apples and eat 3, how many are left?')
      ).toBeInTheDocument();
      expect(screen.getByText('apples')).toBeInTheDocument();
      expect(screen.getByText('数学的推論')).toBeInTheDocument();
      expect(screen.getByText('GSM-8K')).toBeInTheDocument();
    });

    it('handles numeric input', () => {
      render(
        <QuestionDisplay question={sampleGSM8KQuestion} onAnswerSelect={mockOnAnswerSelect} />
      );

      const input = screen.getByPlaceholderText('例: 42, 3.14, -10');
      fireEvent.change(input, { target: { value: '7' } });

      const submitButton = screen.getByText('回答');
      fireEvent.click(submitButton);

      expect(mockOnAnswerSelect).toHaveBeenCalledWith(7);
    });

    it('shows chain of thought when expanded', () => {
      render(
        <QuestionDisplay question={sampleGSM8KQuestion} onAnswerSelect={mockOnAnswerSelect} />
      );

      const expandButton = screen.getByText('解法の手順を見る');
      fireEvent.click(expandButton);

      expect(screen.getByText('Start with 10 apples')).toBeInTheDocument();
      expect(screen.getByText('Subtract 3 eaten apples')).toBeInTheDocument();
      expect(screen.getByText('10 - 3 = 7')).toBeInTheDocument();
    });

    it('validates numeric input', () => {
      render(
        <QuestionDisplay question={sampleGSM8KQuestion} onAnswerSelect={mockOnAnswerSelect} />
      );

      const input = screen.getByPlaceholderText('例: 42, 3.14, -10');

      // Should accept valid numbers
      fireEvent.change(input, { target: { value: '123' } });
      expect(input).toHaveValue('123');

      fireEvent.change(input, { target: { value: '-45.67' } });
      expect(input).toHaveValue('-45.67');

      // Should reject invalid input
      fireEvent.change(input, { target: { value: 'abc' } });
      expect(input).toHaveValue('-45.67'); // Should not change
    });
  });

  describe('Long Text Questions', () => {
    it('renders DROP question correctly', () => {
      render(<QuestionDisplay question={sampleDROPQuestion} onAnswerSelect={mockOnAnswerSelect} />);

      expect(screen.getByText("What is the main character's name?")).toBeInTheDocument();
      expect(
        screen.getByText('John walked to the store. He bought some milk and bread.')
      ).toBeInTheDocument();
      expect(screen.getByText('読解推論')).toBeInTheDocument();
      expect(screen.getByText('DROP')).toBeInTheDocument();
    });

    it('handles text input', () => {
      render(<QuestionDisplay question={sampleDROPQuestion} onAnswerSelect={mockOnAnswerSelect} />);

      const textarea = screen.getByPlaceholderText('ここに回答を入力してください...');
      fireEvent.change(textarea, { target: { value: 'John' } });

      const submitButton = screen.getByText('回答を提出');
      fireEvent.click(submitButton);

      expect(mockOnAnswerSelect).toHaveBeenCalledWith('John');
    });

    it('shows answer guidelines', () => {
      render(<QuestionDisplay question={sampleDROPQuestion} onAnswerSelect={mockOnAnswerSelect} />);

      expect(screen.getByText('回答のヒント')).toBeInTheDocument();
      expect(screen.getByText('• 文章の内容に基づいて正確に答えてください')).toBeInTheDocument();
    });
  });

  describe('Unknown Question Type', () => {
    it('shows error for unknown question type', () => {
      const unknownQuestion = {
        id: 'unknown-1',
        type: 'unknown',
        question: 'Unknown question',
        correctAnswer: 'answer',
        explanation: 'explanation',
      } as any;

      render(<QuestionDisplay question={unknownQuestion} onAnswerSelect={mockOnAnswerSelect} />);

      expect(screen.getByText('Unknown question type: unknown')).toBeInTheDocument();
    });
  });
});
