import {
  TestType,
  TestMode,
  Question,
  UserAnswer,
  UserProgress,
  TestResults,
  TestInterfaceState,
} from '../types';
import { saveProgress, getCurrentProgress, clearProgress, addTestResult } from './storage';

export interface TestState {
  testId: string;
  testType: TestType;
  mode: TestMode;
  questions: Question[];
  currentQuestionIndex: number;
  answers: Record<string, UserAnswer>;
  startTime: number;
  endTime?: number;
  timeRemaining?: number;
  timerInterval?: number;
  isCompleted: boolean;
  isPaused: boolean;
  autoSaveInterval?: number;
}

export interface TestStateCallbacks {
  onQuestionChange?: (index: number, question: Question) => void;
  onAnswerSubmit?: (answer: UserAnswer) => void;
  onTestComplete?: (results: TestResults) => void;
  onTimeUpdate?: (timeRemaining: number) => void;
  onStateChange?: (state: TestState) => void;
}

export class TestStateManager {
  private state: TestState;
  private callbacks: TestStateCallbacks;
  private initialized: boolean = false;

  constructor() {
    this.state = this.createInitialState();
    this.callbacks = {};
  }

  private createInitialState(): TestState {
    return {
      testId: '',
      testType: 'mmlu',
      mode: 'practice',
      questions: [],
      currentQuestionIndex: 0,
      answers: {},
      startTime: 0,
      isCompleted: false,
      isPaused: false,
    };
  }

  // Initialize test with questions and settings
  public async initializeTest(
    testType: TestType,
    mode: TestMode,
    questions: Question[],
    timeLimit?: number
  ): Promise<void> {
    // Clear any existing timers
    this.cleanup();

    const testId = `${testType}_${mode}_${Date.now()}`;

    this.state = {
      testId,
      testType,
      mode,
      questions,
      currentQuestionIndex: 0,
      answers: {},
      startTime: Date.now(),
      timeRemaining: timeLimit,
      isCompleted: false,
      isPaused: false,
    };

    this.initialized = true;

    // Setup timer for test mode
    if (mode === 'test' && timeLimit) {
      this.startTimer();
    }

    // Setup auto-save
    this.setupAutoSave();

    // Save initial progress
    await this.saveCurrentProgress();

    // Notify state change
    this.notifyStateChange();
  }

  // Resume from saved progress
  public async resumeTest(progress: UserProgress): Promise<void> {
    const savedProgress = progress || (await getCurrentProgress());

    if (!savedProgress) {
      throw new Error('No saved progress found');
    }

    this.state = {
      testId: savedProgress.testId,
      testType: savedProgress.testType,
      mode: savedProgress.mode,
      questions: [], // Questions need to be loaded separately
      currentQuestionIndex: savedProgress.currentQuestionIndex,
      answers: savedProgress.answers,
      startTime: savedProgress.startTime,
      timeRemaining: savedProgress.timeRemaining,
      isCompleted: savedProgress.isCompleted,
      isPaused: false,
    };

    this.initialized = true;

    // Resume timer if needed
    if (this.state.mode === 'test' && this.state.timeRemaining && !this.state.isCompleted) {
      this.startTimer();
    }

    // Setup auto-save
    this.setupAutoSave();

    this.notifyStateChange();
  }

  // Navigation methods
  public goToQuestion(index: number): void {
    if (!this.initialized) {
      throw new Error('Test not initialized');
    }

    if (index < 0 || index >= this.state.questions.length) {
      throw new Error('Invalid question index');
    }

    this.state.currentQuestionIndex = index;
    this.saveCurrentProgress();

    const question = this.state.questions[index];
    this.callbacks.onQuestionChange?.(index, question);
    this.notifyStateChange();
  }

  public nextQuestion(): void {
    if (this.state.currentQuestionIndex < this.state.questions.length - 1) {
      this.goToQuestion(this.state.currentQuestionIndex + 1);
    }
  }

  public previousQuestion(): void {
    if (this.state.currentQuestionIndex > 0) {
      this.goToQuestion(this.state.currentQuestionIndex - 1);
    }
  }

  // Answer management
  public submitAnswer(answer: UserAnswer): void {
    if (!this.initialized || this.state.isCompleted) {
      return;
    }

    const questionId = this.state.questions[this.state.currentQuestionIndex].id;

    this.state.answers[questionId] = {
      ...answer,
      questionId,
      timestamp: Date.now(),
    };

    this.saveCurrentProgress();
    this.callbacks.onAnswerSubmit?.(answer);
    this.notifyStateChange();

    // Auto-advance in practice mode
    if (this.state.mode === 'practice') {
      setTimeout(() => {
        if (this.state.currentQuestionIndex < this.state.questions.length - 1) {
          this.nextQuestion();
        }
      }, 1000); // 1 second delay for feedback
    }
  }

  // Test completion
  public async completeTest(): Promise<TestResults> {
    if (!this.initialized) {
      throw new Error('Test not initialized');
    }

    this.state.isCompleted = true;
    this.state.endTime = Date.now();

    // Clear timers
    if (this.state.timerInterval) {
      clearInterval(this.state.timerInterval);
    }

    // Calculate results
    const results = this.calculateResults();

    // Save results
    await addTestResult(results);

    // Clear progress
    await clearProgress();

    // Cleanup
    this.cleanup();

    // Notify completion
    this.callbacks.onTestComplete?.(results);

    return results;
  }

  // Timer management
  private startTimer(): void {
    if (!this.state.timeRemaining) return;

    this.state.timerInterval = window.setInterval(() => {
      if (this.state.isPaused || !this.state.timeRemaining) return;

      this.state.timeRemaining--;
      this.callbacks.onTimeUpdate?.(this.state.timeRemaining);

      if (this.state.timeRemaining <= 0) {
        this.completeTest();
      }
    }, 1000);
  }

  public pauseTest(): void {
    this.state.isPaused = true;
    this.saveCurrentProgress();
    this.notifyStateChange();
  }

  public resumeTimer(): void {
    this.state.isPaused = false;
    this.notifyStateChange();
  }

  // Auto-save functionality
  private setupAutoSave(): void {
    this.state.autoSaveInterval = window.setInterval(() => {
      if (!this.state.isPaused && !this.state.isCompleted) {
        this.saveCurrentProgress();
      }
    }, 30000); // Auto-save every 30 seconds
  }

  private async saveCurrentProgress(): Promise<void> {
    const progress: UserProgress = {
      testId: this.state.testId,
      testType: this.state.testType,
      mode: this.state.mode,
      startTime: this.state.startTime,
      currentQuestionIndex: this.state.currentQuestionIndex,
      answers: this.state.answers,
      timeRemaining: this.state.timeRemaining,
      isCompleted: this.state.isCompleted,
    };

    await saveProgress(progress);
  }

  // Results calculation
  private calculateResults(): TestResults {
    const answersArray = Object.values(this.state.answers);
    let correctCount = 0;
    let incorrectCount = 0;

    // Count correct/incorrect answers
    answersArray.forEach((answer) => {
      if (answer.isCorrect) {
        correctCount++;
      } else {
        incorrectCount++;
      }
    });

    const totalQuestions = this.state.questions.length;
    const accuracy = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;
    const totalTimeSpent = (this.state.endTime || Date.now()) - this.state.startTime;
    const averageTimePerQuestion =
      answersArray.length > 0 ? totalTimeSpent / answersArray.length / 1000 : 0;

    // Calculate category breakdown for MMLU
    const categoryBreakdown: Record<string, { correct: number; total: number }> = {};

    if (this.state.testType === 'mmlu') {
      this.state.questions.forEach((question) => {
        if ('category' in question) {
          const category = question.category;
          if (!categoryBreakdown[category]) {
            categoryBreakdown[category] = { correct: 0, total: 0 };
          }
          categoryBreakdown[category].total++;

          const answer = this.state.answers[question.id];
          if (answer?.isCorrect) {
            categoryBreakdown[category].correct++;
          }
        }
      });
    }

    return {
      testId: this.state.testId,
      testType: this.state.testType,
      mode: this.state.mode,
      startTime: this.state.startTime,
      endTime: this.state.endTime || Date.now(),
      totalQuestions,
      correctAnswers: correctCount,
      incorrectAnswers: incorrectCount,
      accuracy,
      totalTimeSpent: totalTimeSpent / 1000, // Convert to seconds
      averageTimePerQuestion,
      answers: answersArray,
      metadata: {
        categoryBreakdown:
          Object.keys(categoryBreakdown).length > 0 ? categoryBreakdown : undefined,
      },
    };
  }

  // State getters
  public getState(): TestState {
    return { ...this.state };
  }

  public getCurrentQuestion(): Question | null {
    if (!this.initialized || this.state.questions.length === 0) {
      return null;
    }
    return this.state.questions[this.state.currentQuestionIndex];
  }

  public getProgress(): { answered: number; total: number; percentage: number } {
    const answered = Object.keys(this.state.answers).length;
    const total = this.state.questions.length;
    const percentage = total > 0 ? (answered / total) * 100 : 0;

    return { answered, total, percentage };
  }

  public getTestInterfaceState(): TestInterfaceState {
    const currentQuestion = this.getCurrentQuestion();

    return {
      currentQuestion,
      currentIndex: this.state.currentQuestionIndex,
      totalQuestions: this.state.questions.length,
      timeRemaining: this.state.timeRemaining,
      isLoading: false,
      error: undefined,
    };
  }

  // Callbacks
  public setCallbacks(callbacks: TestStateCallbacks): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  private notifyStateChange(): void {
    this.callbacks.onStateChange?.(this.getState());
  }

  // Cleanup
  public cleanup(): void {
    if (this.state.timerInterval) {
      clearInterval(this.state.timerInterval);
    }
    if (this.state.autoSaveInterval) {
      clearInterval(this.state.autoSaveInterval);
    }
    this.initialized = false;
  }
}

// Singleton instance
let testStateManagerInstance: TestStateManager | null = null;

export function getTestStateManager(): TestStateManager {
  if (!testStateManagerInstance) {
    testStateManagerInstance = new TestStateManager();
  }
  return testStateManagerInstance;
}

export function resetTestStateManager(): void {
  if (testStateManagerInstance) {
    testStateManagerInstance.cleanup();
    testStateManagerInstance = null;
  }
}
