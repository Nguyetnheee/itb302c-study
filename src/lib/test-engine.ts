import { gradeAnswer, updateQuestionProgress } from './learning-engine';
import { parseQuestionBank, getSimilarity } from './parser';
import { Question, Choice, QuestionProgress } from './types';

// Simple Assertion Helper
function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
  console.log(`[PASS] ${message}`);
}

export function runTests() {
  console.log('=== Running Core PAL Engine Tests ===');

  try {
    // Test 1: Multiple-answer grading
    const dummyChoiceQ: Question = {
      id: 'q-1',
      questionNumber: 1,
      questionText: 'Select all that apply.',
      questionType: 'multiple',
      choices: [
        { id: 'c1', label: 'A', text: 'Option A', isCorrect: false },
        { id: 'c2', label: 'B', text: 'Option B', isCorrect: true },
        { id: 'c3', label: 'C', text: 'Option C', isCorrect: true },
        { id: 'c4', label: 'D', text: 'Option D', isCorrect: true },
      ],
      explanation: 'Correct is B, C, D',
      topic: 'Test',
      confidence: 100,
      warnings: []
    };

    // Exactly correct selection
    const gradeCorrect = gradeAnswer(dummyChoiceQ, ['B', 'C', 'D']);
    assert(gradeCorrect.isCorrect === true && gradeCorrect.isPartiallyCorrect === false, 
      'Grading: Exact match of multiple choices is Correct');

    // Partially correct selection (subset)
    const gradePartial = gradeAnswer(dummyChoiceQ, ['B', 'C']);
    assert(gradePartial.isCorrect === false && gradePartial.isPartiallyCorrect === true, 
      'Grading: Partial subset selection is marked Partially Correct');

    // Incorrect selection (includes an wrong choice)
    const gradeIncorrect = gradeAnswer(dummyChoiceQ, ['A', 'B', 'C']);
    assert(gradeIncorrect.isCorrect === false && gradeIncorrect.isPartiallyCorrect === false, 
      'Grading: Selecting incorrect items is Incorrect');

    // Test 2: Mastery score progress levels on correct recall
    let progress: QuestionProgress = {
      userId: 'test-user',
      questionId: 'q-1',
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

    // First correct with confidence
    progress = updateQuestionProgress(progress, true, 'confident', 2000);
    assert(progress.masteryScore === 2, 'Mastery: First confident correct moves score to level 2');
    assert(progress.correctStreak === 1, 'Mastery: Correct streak starts at 1');
    assert(progress.reviewInterval === 1, 'SM-2: First interval set to 1 day');

    // Second correct with confidence
    progress = updateQuestionProgress(progress, true, 'confident', 1500);
    assert(progress.masteryScore === 3, 'Mastery: Second confident correct moves score to level 3');
    assert(progress.reviewInterval === 3, 'SM-2: Second interval set to 3 days');

    // Third correct with confidence -> Mastered
    progress = updateQuestionProgress(progress, true, 'confident', 1200);
    assert(progress.masteryScore === 4, 'Mastery: Third confident correct moves score to level 4 (Mastered)');
    assert(progress.reviewInterval === 7, 'SM-2: Third interval set to 7 days');

    // Test 3: Confidence impacts
    let progressGuess = { ...progress, masteryScore: 0, correctStreak: 0, reviewInterval: 0 };
    progressGuess = updateQuestionProgress(progressGuess, true, 'guessed', 2000);
    assert(progressGuess.masteryScore === 1 || progressGuess.masteryScore === 2, 
      'Mastery: Guessed correct answers cap or gain lower levels');

    // Test 4: Misconceptions
    let progressMisconception = { ...progress }; // starting at Mastered (level 4)
    progressMisconception = updateQuestionProgress(progressMisconception, false, 'confident', 1800);
    assert(progressMisconception.masteryScore === 1, 'Mastery: Confident error (misconception) drops mastery to level 1');
    assert(progressMisconception.correctStreak === 0, 'Mastery: Incorrect resets correct streak to 0');
    assert(progressMisconception.reviewInterval === 0.5, 'SM-2: Spaced review scheduled for tomorrow');

    // Test 5: String Text Similarity
    const simHigh = getSimilarity('What are the responsibilities of a BI?', 'What are the responsibilities of a BI?');
    assert(simHigh === 1.0, 'Parser: Exact text similarity is 1.0');

    const simMed = getSimilarity('Data Warehouse Schema', 'What is Data Warehousing schema');
    assert(simMed > 0.4 && simMed < 0.9, 'Parser: Partial matching strings yield mid range similarity');

    console.log('=== All Engine Tests Passed Successfully! 🏆 ===');
  } catch (error) {
    console.error('Test Suite Failed:', error);
  }
}
