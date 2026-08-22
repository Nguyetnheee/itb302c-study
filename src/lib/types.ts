export type QuestionType = 'single' | 'multiple' | 'fill' | 'boolean' | 'short';

export type QuestionProgressState = 'NEW' | 'LEARNING' | 'WEAK' | 'FAMILIAR' | 'MASTERED' | 'REVIEW_DUE';

export interface Choice {
  id: string;
  label: string; // "A", "B", "C", "D", etc.
  text: string;
  isCorrect: boolean;
}

export interface Question {
  id: string;
  questionNumber: number;
  questionText: string;
  questionType: QuestionType;
  choices: Choice[];
  explanation: string;
  topic: string;
  confidence: number;
  warnings: string[];
}

export interface QuestionProgress {
  userId: string;
  questionId: string;
  state: QuestionProgressState;
  masteryScore: number; // 0 = unseen, 1 = attempted incorrectly, 2 = first correct, 3 = second correct, 4 = mastered
  correctCount: number;
  incorrectCount: number;
  correctStreak: number;
  averageResponseTime: number; // in milliseconds
  lastAttemptAt?: string;
  lastCorrectAt?: string;
  lastReviewedAt?: string;
  nextReviewAt?: string;
  reviewInterval: number; // in days
  easeFactor: number; // standard SM-2 ease factor (starts at 2.5)
  incorrectCountStreak: number; // number of consecutive times answered incorrectly
  responseTimeHistory: number[];
  confidenceHistory: string[];
}

export interface Attempt {
  id: string;
  userId: string;
  questionId: string;
  selectedAnswers: string[]; // choice labels or text input
  isCorrect: boolean;
  isPartiallyCorrect: boolean;
  responseTime: number; // in milliseconds
  confidence: 'guessed' | 'unsure' | 'confident';
  createdAt: string;
}

export interface StudySet {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  questions: Question[];
}

export interface StudySession {
  id: string;
  studySetId: string;
  type: 'learn' | 'test' | 'mistakes' | 'quick' | 'exam';
  batchIndex: number;
  questions: string[]; // list of questionIds
  currentQuestionIndex: number;
  attempts: Attempt[];
  round: number; // 1 = Learn, 2 = Active Recall, 3 = Weak Review, 4 = Mastery Test
  roundQuestions: string[]; // subset of questionIds for current round
  completed: boolean;
  accuracy: number;
  startedAt: string;
}

export interface Settings {
  questionsPerBatch: number;
  dailyNewTarget: number;
  dailyReviewTarget: number;
  masteryStrictness: 'strict' | 'normal' | 'relaxed'; // normal = 2 correct, strict = 3 correct, relaxed = 1 correct
  showConfidence: boolean;
  shuffleOptions: boolean;
  keyboardShortcuts: boolean;
  darkMode: boolean;
  reminderTime: string;
}

export interface DailyPlan {
  newCount: number;
  reviewCount: number;
  weakCount: number;
  estimatedMinutes: number;
}

export interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate?: string;
  totalStudyDaysCount: number;
}
