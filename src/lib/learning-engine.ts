import { Question, Choice, QuestionProgress, Attempt, QuestionProgressState } from './types';

// Grades a student's answer against the correct ones
export function gradeAnswer(
  question: Question,
  selectedAnswers: string[] // Choice labels (e.g. ["A", "C"]) or text input for fill-in
): { isCorrect: boolean; isPartiallyCorrect: boolean } {
  const cleanSelected = selectedAnswers.map(s => s.trim().toLowerCase()).filter(Boolean);

  if (question.questionType === 'single' || question.questionType === 'boolean') {
    const correctChoice = question.choices.find(c => c.isCorrect);
    if (!correctChoice) return { isCorrect: false, isPartiallyCorrect: false };
    
    const isCorrect = cleanSelected.length === 1 && cleanSelected[0] === correctChoice.label.toLowerCase();
    return { isCorrect, isPartiallyCorrect: false };
  }

  if (question.questionType === 'multiple') {
    const correctChoices = question.choices.filter(c => c.isCorrect);
    const correctLabels = correctChoices.map(c => c.label.toLowerCase());
    
    if (cleanSelected.length === 0) {
      return { isCorrect: false, isPartiallyCorrect: false };
    }

    // Check if every selected is correct
    const allSelectedAreCorrect = cleanSelected.every(sel => correctLabels.includes(sel));
    
    // Exact match: length is equal AND all selected are correct
    const isCorrect = allSelectedAreCorrect && cleanSelected.length === correctLabels.length;

    // Partially correct: some selected are correct, and no incorrect choices are selected
    const isPartiallyCorrect = !isCorrect && allSelectedAreCorrect && cleanSelected.length > 0;

    return { isCorrect, isPartiallyCorrect };
  }

  if (question.questionType === 'fill' || question.questionType === 'short') {
    // Explanation field contains parsed correct answers. Clean and check.
    const answerText = question.explanation.replace('Correct Answer Context: ', '').trim();
    if (cleanSelected.length === 0) return { isCorrect: false, isPartiallyCorrect: false };
    
    const studentAnswer = cleanSelected[0];
    const cleanCorrect = answerText.toLowerCase();

    // Fuzzy matching: check for exact match, substring match, or similarity threshold
    const isExact = studentAnswer === cleanCorrect;
    
    // Check if they wrote parts of comma-separated correct answers
    const parts = cleanCorrect.split(/[,;|]/).map(p => p.trim());
    const isPartMatch = parts.some(part => studentAnswer === part || (part.length > 3 && (studentAnswer.includes(part) || part.includes(studentAnswer))));

    const isCorrect = isExact || isPartMatch;
    return { isCorrect, isPartiallyCorrect: false };
  }

  return { isCorrect: false, isPartiallyCorrect: false };
}

// Map confidence and correctness to SM-2 quality score (0 to 5)
function getSM2Quality(isCorrect: boolean, confidence: 'guessed' | 'unsure' | 'confident'): number {
  if (isCorrect) {
    if (confidence === 'confident') return 5;
    if (confidence === 'unsure') return 4;
    return 3; // guessed
  } else {
    if (confidence === 'guessed') return 2;
    if (confidence === 'unsure') return 1;
    return 0; // confident error (misconception - dangerous!)
  }
}

// Calculate retention probability using Forgetting Curve model: R = e^(-t/S)
export function estimateRetention(progress: QuestionProgress): number {
  if (!progress.lastAttemptAt) return 0;
  
  const lastTime = new Date(progress.lastAttemptAt).getTime();
  const now = new Date().getTime();
  const timeSinceLastReviewDays = (now - lastTime) / (1000 * 60 * 60 * 24);
  
  // Memory strength S defaults to the reviewInterval (in days) but has a minimum of 0.2 days (approx 5 hours)
  const memoryStrength = Math.max(0.2, progress.reviewInterval);
  
  return Math.exp(-timeSinceLastReviewDays / memoryStrength);
}

// Classify memory state based on estimated retention
export function getMemoryStateLabel(retention: number, progress: QuestionProgress): QuestionProgressState {
  if (progress.masteryScore === 0) return 'NEW';
  if (progress.masteryScore === 4) {
    if (retention >= 0.8) return 'MASTERED';
    if (retention >= 0.5) return 'FAMILIAR'; // fading slightly
    return 'REVIEW_DUE';
  }
  
  if (retention < 0.4) return 'REVIEW_DUE';
  if (progress.masteryScore === 1) return 'WEAK';
  return 'LEARNING';
}

// Get the adaptive priority score for a question
export function calculatePriorityScore(progress: QuestionProgress): number {
  const now = new Date().getTime();
  
  // 1. Mastery penalty: Lower mastery score -> higher priority
  const masteryPenalty = (4 - progress.masteryScore) * 25; // 0 to 100

  // 2. Overdue penalty: How long has it been since nextReviewAt?
  let overduePenalty = 0;
  if (progress.nextReviewAt) {
    const nextReviewTime = new Date(progress.nextReviewAt).getTime();
    if (now > nextReviewTime) {
      const daysOverdue = (now - nextReviewTime) / (1000 * 60 * 60 * 24);
      overduePenalty = Math.min(100, daysOverdue * 15); // cap at 100 priority points
    }
  } else if (progress.masteryScore > 0) {
    // Attempted but no nextReviewAt (shouldn't happen, but fallback)
    overduePenalty = 30;
  }

  // 3. Mistake count and streak penalty
  const mistakePenalty = Math.min(60, progress.incorrectCount * 8);
  const consecutiveMistakePenalty = progress.incorrectCountStreak * 15; // heavily prioritize consecutive misses

  // 4. Response time penalty: slow response indicates low confidence / retrieval difficulty
  // If averageResponseTime is high (> 8 seconds / 8000ms), add priority
  const responseTimePenalty = Math.min(30, (progress.averageResponseTime / 1000) * 1.5);

  // 5. Recent success discount
  let recentSuccessDiscount = 0;
  if (progress.correctStreak > 0) {
    recentSuccessDiscount = progress.correctStreak * 10;
  }

  const basePriority = masteryPenalty + overduePenalty + mistakePenalty + consecutiveMistakePenalty + responseTimePenalty - recentSuccessDiscount;
  
  // If unseen (mastery = 0), give a baseline priority
  if (progress.masteryScore === 0) {
    return 10; // lower priority than review items to avoid clogging
  }

  return Math.max(0, basePriority);
}

// Initialize a new progress entry for a question
export function createInitialProgress(userId: string, questionId: string): QuestionProgress {
  return {
    userId,
    questionId,
    state: 'NEW',
    masteryScore: 0,
    correctCount: 0,
    incorrectCount: 0,
    correctStreak: 0,
    averageResponseTime: 0,
    reviewInterval: 0,
    easeFactor: 2.5,
    incorrectCountStreak: 0,
    responseTimeHistory: [],
    confidenceHistory: []
  };
}

// Main logic to update question progress and schedule the next review
export function updateQuestionProgress(
  currentProgress: QuestionProgress,
  isCorrect: boolean,
  confidence: 'guessed' | 'unsure' | 'confident',
  responseTime: number // in ms
): QuestionProgress {
  const now = new Date();
  const progress = { ...currentProgress };

  // Append history
  progress.responseTimeHistory = [...(progress.responseTimeHistory || []), responseTime].slice(-10);
  progress.confidenceHistory = [...(progress.confidenceHistory || []), confidence].slice(-10);
  
  // Recalculate average response time
  const totalTime = progress.responseTimeHistory.reduce((sum, t) => sum + t, 0);
  progress.averageResponseTime = totalTime / progress.responseTimeHistory.length;

  progress.lastAttemptAt = now.toISOString();

  const q = getSM2Quality(isCorrect, confidence);

  if (isCorrect) {
    progress.correctCount += 1;
    progress.correctStreak += 1;
    progress.incorrectCountStreak = 0;
    progress.lastCorrectAt = now.toISOString();

    // Calculate Mastery Score (0 to 4)
    if (confidence === 'guessed') {
      // Guessed questions increase streak but do not progress mastery score beyond level 2 (familiar/attempted)
      progress.masteryScore = Math.min(2, progress.masteryScore + 1);
    } else if (confidence === 'unsure') {
      // Unsure answers progress mastery slower (max level 3)
      progress.masteryScore = Math.min(3, progress.masteryScore + 1);
    } else {
      // Confident answers progress mastery normally
      progress.masteryScore = Math.min(4, progress.masteryScore === 0 ? 2 : progress.masteryScore + 1);
    }

    // Interval scheduling (days)
    // Custom SM-2 style progression matching Quizlet/Anki requirements
    if (progress.correctStreak === 1) {
      progress.reviewInterval = 1; // 1 day
    } else if (progress.correctStreak === 2) {
      progress.reviewInterval = 3; // 3 days
    } else if (progress.correctStreak === 3) {
      progress.reviewInterval = 7; // 7 days
    } else if (progress.correctStreak === 4) {
      progress.reviewInterval = 14; // 14 days
    } else if (progress.correctStreak === 5) {
      progress.reviewInterval = 30; // 30 days
    } else {
      progress.reviewInterval = 60; // 60 days
    }

    // Adjust SM-2 Ease Factor: EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
    progress.easeFactor = Math.max(
      1.3,
      progress.easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
    );

    // Apply ease factor scaling for long streaks
    if (progress.correctStreak > 5) {
      progress.reviewInterval = Math.round(progress.reviewInterval * progress.easeFactor);
    }

  } else {
    // Incorrect answer
    progress.incorrectCount += 1;
    progress.incorrectCountStreak += 1;
    progress.correctStreak = 0;

    // Reset or reduce mastery level on mistakes
    if (confidence === 'confident') {
      // Confident error is a misconception: drop mastery score immediately to 1
      progress.masteryScore = 1;
      progress.easeFactor = Math.max(1.3, progress.easeFactor - 0.2); // drop ease factor significantly
    } else {
      // Otherwise, reduce mastery score by 1
      progress.masteryScore = Math.max(1, progress.masteryScore - 1);
    }

    // Reset review interval to next day
    progress.reviewInterval = 0.5; // review in 12 hours / tomorrow
  }

  // Calculate nextReviewAt
  const nextReviewDate = new Date(now.getTime() + progress.reviewInterval * 24 * 60 * 60 * 1000);
  progress.nextReviewAt = nextReviewDate.toISOString();

  // Update State Label based on retention
  const retention = estimateRetention(progress);
  progress.state = getMemoryStateLabel(retention, progress);

  return progress;
}

// Generate the learning queue for a student's daily study session
export function getDailySessionQuestions(
  questions: Question[],
  progressMap: { [questionId: string]: QuestionProgress },
  unlockedBatchIndices: number[], // index of active unlocked batch (0-indexed)
  questionsPerBatch = 10,
  dailyReviewTarget = 30
): {
  sessionQuestions: Question[];
  overdueCount: number;
  weakCount: number;
  newCount: number;
} {
  const now = new Date().getTime();
  
  const overdue: Question[] = [];
  const weak: Question[] = [];
  const newQuestions: Question[] = [];
  const rest: Question[] = [];

  // Categorize questions
  questions.forEach((q) => {
    const progress = progressMap[q.id];
    const qBatchIndex = Math.floor((q.questionNumber - 1) / questionsPerBatch);
    
    // Check if this question is part of the unlocked batches
    const isUnlocked = unlockedBatchIndices.includes(qBatchIndex);

    if (!isUnlocked) return; // Locked batch questions are strictly skipped

    if (!progress || progress.masteryScore === 0) {
      newQuestions.push(q);
    } else {
      const nextReview = progress.nextReviewAt ? new Date(progress.nextReviewAt).getTime() : 0;
      const isOverdue = now > nextReview;

      if (isOverdue) {
        overdue.push(q);
      } else if (progress.masteryScore === 1) {
        weak.push(q);
      } else {
        rest.push(q);
      }
    }
  });

  // Priority Gating: If review backlog is large, restrict adding new questions.
  // "If Review Due > 30: reduce number of new questions."
  const totalReviewsPending = overdue.length + weak.length;
  let allowedNewCount = 10;
  if (totalReviewsPending > dailyReviewTarget) {
    allowedNewCount = 2; // severe reduction to focus on backlog
  } else if (totalReviewsPending > 15) {
    allowedNewCount = 5; // moderate reduction
  }

  // Rank overdue and weak questions using priority score
  const getScore = (qId: string) => {
    const prog = progressMap[qId];
    return prog ? calculatePriorityScore(prog) : 0;
  };

  overdue.sort((a, b) => getScore(b.id) - getScore(a.id));
  weak.sort((a, b) => getScore(b.id) - getScore(a.id));

  // Build the session list
  const selectedQuestions: Question[] = [];

  // 1. Add overdue questions (up to a limit to prevent burnout)
  const maxOverdueInSession = Math.min(overdue.length, dailyReviewTarget);
  for (let i = 0; i < maxOverdueInSession; i++) {
    selectedQuestions.push(overdue[i]);
  }

  // 2. Add weak questions
  const maxWeakInSession = Math.min(weak.length, 10);
  for (let i = 0; i < maxWeakInSession; i++) {
    if (!selectedQuestions.includes(weak[i])) {
      selectedQuestions.push(weak[i]);
    }
  }

  // 3. Add new questions from the active batch (up to our gate limits)
  // Ensure we sort new questions by question number so they are introduced sequentially
  newQuestions.sort((a, b) => a.questionNumber - b.questionNumber);
  const actualNewToAdd = Math.min(newQuestions.length, allowedNewCount);
  for (let i = 0; i < actualNewToAdd; i++) {
    selectedQuestions.push(newQuestions[i]);
  }

  // Fallback: If session is completely empty (all mastered and nothing due),
  // pick a few lowest-retention mastered questions to refresh them!
  if (selectedQuestions.length === 0 && rest.length > 0) {
    rest.sort((a, b) => {
      const pA = progressMap[a.id];
      const pB = progressMap[b.id];
      return estimateRetention(pA) - estimateRetention(pB); // lowest retention first
    });
    for (let i = 0; i < Math.min(rest.length, 5); i++) {
      selectedQuestions.push(rest[i]);
    }
  }

  return {
    sessionQuestions: selectedQuestions,
    overdueCount: overdue.length,
    weakCount: weak.length,
    newCount: actualNewToAdd
  };
}
