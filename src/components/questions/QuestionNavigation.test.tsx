import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QuestionNavigation } from './QuestionNavigation';

describe('QuestionNavigation', () => {
  const mockOnPrevious = vi.fn();
  const mockOnNext = vi.fn();
  const mockOnGoToQuestion = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const defaultProps = {
    currentIndex: 2,
    totalQuestions: 10,
    onPrevious: mockOnPrevious,
    onNext: mockOnNext,
    onGoToQuestion: mockOnGoToQuestion,
    answeredQuestions: new Set([0, 1, 2]),
    canNavigate: true,
  };

  it('renders current progress correctly', () => {
    render(<QuestionNavigation {...defaultProps} />);

    expect(screen.getByText('問題 3 / 10')).toBeInTheDocument();
    expect(screen.getByText('回答済み: 3 / 10')).toBeInTheDocument();
  });

  it('renders progress bar with correct width', () => {
    render(<QuestionNavigation {...defaultProps} />);

    const progressBar = document.querySelector('.bg-blue-600');
    expect(progressBar).toHaveStyle({ width: '30%' });
  });

  it('handles previous button click', () => {
    render(<QuestionNavigation {...defaultProps} />);

    const previousButton = screen.getByText('前の問題');
    fireEvent.click(previousButton);

    expect(mockOnPrevious).toHaveBeenCalledTimes(1);
  });

  it('handles next button click', () => {
    render(<QuestionNavigation {...defaultProps} />);

    const nextButton = screen.getByText('次の問題');
    fireEvent.click(nextButton);

    expect(mockOnNext).toHaveBeenCalledTimes(1);
  });

  it('disables previous button at first question', () => {
    render(<QuestionNavigation {...{ ...defaultProps, currentIndex: 0 }} />);

    const previousButton = screen.getByText('前の問題');
    expect(previousButton).toBeDisabled();
  });

  it('disables next button at last question', () => {
    render(<QuestionNavigation {...{ ...defaultProps, currentIndex: 9 }} />);

    const nextButton = screen.getByText('次の問題');
    expect(nextButton).toBeDisabled();
  });

  it('handles question number button clicks', () => {
    render(<QuestionNavigation {...defaultProps} />);

    const questionButton = screen.getByText('5');
    fireEvent.click(questionButton);

    expect(mockOnGoToQuestion).toHaveBeenCalledWith(4); // 0-indexed
  });

  it('highlights current question', () => {
    render(<QuestionNavigation {...defaultProps} />);

    const currentButton = screen.getByText('3'); // currentIndex 2 + 1
    expect(currentButton).toHaveClass('bg-blue-600', 'text-white');
  });

  it('highlights answered questions', () => {
    render(<QuestionNavigation {...defaultProps} />);

    const answeredButton = screen.getByText('1'); // index 0
    expect(answeredButton).toHaveClass('bg-green-100', 'text-green-800');
  });

  it('shows unanswered questions correctly', () => {
    render(<QuestionNavigation {...defaultProps} />);

    const unansweredButton = screen.getByText('5'); // index 4, not in answeredQuestions
    expect(unansweredButton).toHaveClass('bg-white', 'text-gray-700');
  });

  it('disables navigation when canNavigate is false', () => {
    render(<QuestionNavigation {...{ ...defaultProps, canNavigate: false }} />);

    const previousButton = screen.getByText('前の問題');
    const nextButton = screen.getByText('次の問題');
    const questionButton = screen.getByText('5');

    expect(previousButton).toBeDisabled();
    expect(nextButton).toBeDisabled();
    expect(questionButton).toBeDisabled();

    fireEvent.click(questionButton);
    expect(mockOnGoToQuestion).not.toHaveBeenCalled();
  });

  it('shows condensed view for large number of questions', () => {
    const manyQuestionsProps = {
      ...defaultProps,
      totalQuestions: 50,
      currentIndex: 25,
      answeredQuestions: new Set([0, 1, 2, 24, 25, 26]),
    };

    render(<QuestionNavigation {...manyQuestionsProps} />);

    // Should show first 3, current area (±2), and last 3
    expect(screen.getByText('1')).toBeInTheDocument(); // First
    expect(screen.getByText('2')).toBeInTheDocument(); // First
    expect(screen.getByText('3')).toBeInTheDocument(); // First

    expect(screen.getByText('24')).toBeInTheDocument(); // Current - 2
    expect(screen.getByText('26')).toBeInTheDocument(); // Current
    expect(screen.getByText('28')).toBeInTheDocument(); // Current + 2

    expect(screen.getByText('48')).toBeInTheDocument(); // Last
    expect(screen.getByText('49')).toBeInTheDocument(); // Last
    expect(screen.getByText('50')).toBeInTheDocument(); // Last

    // Should show ellipsis between sections
    expect(screen.getAllByText('⋯')).toHaveLength(2);
  });

  it('shows legend correctly', () => {
    render(<QuestionNavigation {...defaultProps} />);

    expect(screen.getByText('現在の問題')).toBeInTheDocument();
    expect(screen.getByText('回答済み')).toBeInTheDocument();
    expect(screen.getByText('未回答')).toBeInTheDocument();
  });

  it('handles edge case with single question', () => {
    const singleQuestionProps = {
      ...defaultProps,
      totalQuestions: 1,
      currentIndex: 0,
      answeredQuestions: new Set([0]),
    };

    render(<QuestionNavigation {...singleQuestionProps} />);

    expect(screen.getByText('問題 1 / 1')).toBeInTheDocument();
    expect(screen.getByText('回答済み: 1 / 1')).toBeInTheDocument();

    const previousButton = screen.getByText('前の問題');
    const nextButton = screen.getByText('次の問題');

    expect(previousButton).toBeDisabled();
    expect(nextButton).toBeDisabled();
  });

  it('handles empty answered questions set', () => {
    const noAnswersProps = {
      ...defaultProps,
      answeredQuestions: new Set<number>(),
    };

    render(<QuestionNavigation {...noAnswersProps} />);

    expect(screen.getByText('回答済み: 0 / 10')).toBeInTheDocument();

    // All non-current questions should be unanswered style
    const questionButton = screen.getByText('1'); // index 0
    expect(questionButton).toHaveClass('bg-white', 'text-gray-700');
  });
});
