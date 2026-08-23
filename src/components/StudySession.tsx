import React, { useState, useEffect, useRef } from 'react';
import { 
  Check, X, Eye, HelpCircle, Award, RefreshCw, LogOut, ArrowRight, 
  Settings2, Star, Keyboard, HelpCircle as HintIcon, Sparkles, CheckSquare
} from 'lucide-react';
import { Question, Choice, Attempt, StudySession as SessionType, QuestionProgress, Settings } from '../lib/types';
import { gradeAnswer, updateQuestionProgress } from '../lib/learning-engine';

interface StudySessionProps {
  setId: string;
  sessionType: 'learn' | 'quick' | 'mistakes' | 'test';
  batchIndex?: number;
  questions: Question[];
  progressMap: { [qId: string]: QuestionProgress };
  settings: Settings;
  onSessionComplete: (attempts: Attempt[], updatedProgress: { [qId: string]: QuestionProgress }) => void;
  onExit: () => void;
}

export default function StudySession({
  setId,
  sessionType,
  batchIndex = 0,
  questions,
  progressMap,
  settings,
  onSessionComplete,
  onExit
}: StudySessionProps) {
  // 1. Session Setup
  const batchSize = settings.questionsPerBatch;
  
  // Get active session questions based on batch or type
  const getSessionQuestions = (): Question[] => {
    if (sessionType === 'learn') {
      const start = batchIndex * batchSize;
      const end = start + batchSize;
      return questions.slice(start, end);
    }
    if (sessionType === 'mistakes') {
      // Return weak questions (mastery score 1)
      return questions.filter(q => {
        const p = progressMap[q.id];
        return p && p.masteryScore === 1;
      });
    }
    if (sessionType === 'quick') {
      // 5-10 high priority questions
      const ranked = [...questions].sort((a, b) => {
        const pA = progressMap[a.id];
        const pB = progressMap[b.id];
        const scoreA = pA ? pA.incorrectCount * 5 + (4 - pA.masteryScore) * 10 : 0;
        const scoreB = pB ? pB.incorrectCount * 5 + (4 - pB.masteryScore) * 10 : 0;
        return scoreB - scoreA;
      });
      return ranked.slice(0, 8);
    }
    // Default test mode: randomized selections
    return [...questions].sort(() => 0.5 - Math.random()).slice(0, 15);
  };

  const [sessionQuestions] = useState<Question[]>(getSessionQuestions);
  
  // Round management (Max 2 rounds: Round 1 = Learn & Rate Confidence, Round 2 = Review Unsure / Incorrect)
  const isMultiRound = sessionType === 'learn';
  const [round, setRound] = useState(1);
  const [roundQuestions, setRoundQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);

  // Question Interaction States
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [textInput, setTextInput] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; isPartiallyCorrect: boolean } | null>(null);
  const [confidence, setConfidence] = useState<'guessed' | 'unsure' | 'confident' | null>(null);
  
  // Timer tracking
  const startTimeRef = useRef<number>(Date.now());
  const [responseTime, setResponseTime] = useState(0);

  // Cumulative Session Logging
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [sessionProgressMap, setSessionProgressMap] = useState<{ [qId: string]: QuestionProgress }>({ ...progressMap });
  const [reviewRequiredIds, setReviewRequiredIds] = useState<string[]>([]); // Holds question IDs that were wrong OR not 'confident'

  const activeQuestion = roundQuestions[currentIdx];

  // Set up questions for the active round
  useEffect(() => {
    if (sessionQuestions.length === 0) return;
    
    if (isMultiRound) {
      if (round === 1) {
        setRoundQuestions(sessionQuestions);
      } else if (round === 2) {
        const needsReview = sessionQuestions.filter(q => reviewRequiredIds.includes(q.id));
        setRoundQuestions(needsReview.sort(() => Math.random() - 0.5));
      }
    } else {
      setRoundQuestions(sessionQuestions);
    }
    
    setCurrentIdx(0);
    resetQuestionState();
  }, [round, sessionQuestions]);

  // Restart response timer on question change
  useEffect(() => {
    startTimeRef.current = Date.now();
  }, [currentIdx, round]);

  const resetQuestionState = () => {
    setSelectedLabels([]);
    setTextInput('');
    setSubmitted(false);
    setFeedback(null);
    setConfidence(null);
  };

  // Grading execution
  const handleSubmitAnswer = () => {
    if (submitted || !activeQuestion) return;

    const elapsed = Date.now() - startTimeRef.current;
    setResponseTime(elapsed);

    // Collect answers
    const answers = activeQuestion.choices.length > 0 
      ? selectedLabels 
      : [textInput];

    const result = gradeAnswer(activeQuestion, answers);
    setFeedback(result);

    const isTestMode = !isMultiRound;

    if (isTestMode || !result.isCorrect) {
      // If test mode OR incorrect answer, automatically log attempt and queue for Round 2
      const attempt: Attempt = {
        id: Math.random().toString(36).substring(2, 9),
        userId: 'local-user',
        questionId: activeQuestion.id,
        selectedAnswers: answers,
        isCorrect: result.isCorrect,
        isPartiallyCorrect: result.isPartiallyCorrect,
        responseTime: elapsed,
        confidence: 'guessed',
        createdAt: new Date().toISOString()
      };

      setAttempts(prev => [...prev, attempt]);
      
      const currentProg = sessionProgressMap[activeQuestion.id] || {
        userId: 'local-user',
        questionId: activeQuestion.id,
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

      const updated = updateQuestionProgress(currentProg, result.isCorrect, 'guessed', elapsed);
      setSessionProgressMap(prev => ({ ...prev, [activeQuestion.id]: updated }));

      if (!result.isCorrect) {
        setReviewRequiredIds(prev => {
          if (!prev.includes(activeQuestion.id)) return [...prev, activeQuestion.id];
          return prev;
        });
      }

      setConfidence('guessed');
      setSubmitted(true);
    } else {
      // Correct answer in Learn mode: wait for user confidence rating
      setSubmitted(true);
    }
  };

  // Save attempt with confidence rating for CORRECT answers
  const handleSelectConfidence = (level: 'guessed' | 'unsure' | 'confident') => {
    setConfidence(level);
    if (!activeQuestion || !feedback) return;

    const answers = activeQuestion.choices.length > 0 ? selectedLabels : [textInput];
    
    const attempt: Attempt = {
      id: Math.random().toString(36).substring(2, 9),
      userId: 'local-user',
      questionId: activeQuestion.id,
      selectedAnswers: answers,
      isCorrect: feedback.isCorrect,
      isPartiallyCorrect: feedback.isPartiallyCorrect,
      responseTime,
      confidence: level,
      createdAt: new Date().toISOString()
    };

    setAttempts(prev => [...prev, attempt]);

    // Update progress mapper
    const currentProg = sessionProgressMap[activeQuestion.id];
    const updated = updateQuestionProgress(currentProg, feedback.isCorrect, level, responseTime);
    setSessionProgressMap(prev => ({ ...prev, [activeQuestion.id]: updated }));

    // Rule: If NOT 'confident', question MUST reappear in Round 2!
    if (level !== 'confident') {
      setReviewRequiredIds(prev => {
        if (!prev.includes(activeQuestion.id)) return [...prev, activeQuestion.id];
        return prev;
      });
    } else {
      // If correct and confident, remove from review list
      setReviewRequiredIds(prev => prev.filter(id => id !== activeQuestion.id));
    }

    // Auto-advance to next question!
    handleNextQuestion();
  };

  const handleNextQuestion = () => {
    if (currentIdx + 1 < roundQuestions.length) {
      setCurrentIdx(prev => prev + 1);
      resetQuestionState();
    } else {
      handleRoundOrSessionComplete();
    }
  };

  const handleRoundOrSessionComplete = () => {
    if (isMultiRound) {
      if (round === 1) {
        // Evaluate questions that were wrong or not confident
        const needsReview = sessionQuestions.filter(q => reviewRequiredIds.includes(q.id));
        if (needsReview.length > 0) {
          setRound(2);
        } else {
          // All questions answered correctly & confident in Round 1!
          onSessionComplete(attempts, sessionProgressMap);
        }
      } else {
        // Round 2 complete! Finalize study session.
        onSessionComplete(attempts, sessionProgressMap);
      }
    } else {
      onSessionComplete(attempts, sessionProgressMap);
    }
  };

  // Keyboard Navigation Handling
  useEffect(() => {
    if (!settings.keyboardShortcuts || !activeQuestion) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const isTestMode = !isMultiRound || round === 4;

      if (!submitted) {
        // Selection bindings (1-6 keys for multiple/single choices)
        if (['1', '2', '3', '4', '5', '6'].includes(e.key)) {
          const index = parseInt(e.key, 10) - 1;
          if (index < activeQuestion.choices.length) {
            const label = activeQuestion.choices[index].label;
            
            if (activeQuestion.questionType === 'multiple') {
              setSelectedLabels(prev => 
                prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]
              );
            } else {
              setSelectedLabels([label]);
            }
          }
        }
        
        // Enter submits the form
        if (e.key === 'Enter') {
          // Only submit if user selected something or wrote something
          if (selectedLabels.length > 0 || textInput.trim() !== '') {
            handleSubmitAnswer();
          }
        }
      } else {
        // After submit
        if (!feedback?.isCorrect || !isMultiRound) {
          // If incorrect or test mode, enter advances to next question directly
          if (e.key === 'Enter') {
            handleNextQuestion();
          }
        } else {
          // If correct in Learn mode, 1/2/3 rates confidence & auto-advances
          if (e.key === '1') handleSelectConfidence('guessed');
          else if (e.key === '2') handleSelectConfidence('unsure');
          else if (e.key === '3') handleSelectConfidence('confident');
          else if (e.key === 'Enter') handleNextQuestion();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [submitted, selectedLabels, textInput, activeQuestion, round, confidence, settings.keyboardShortcuts]);

  if (sessionQuestions.length === 0) {
    return (
      <div className="card flex-center" style={{ flexDirection: 'column', padding: '3rem', textAlign: 'center' }}>
        <HintIcon size={40} color="var(--color-warning)" />
        <h3 style={{ marginTop: '1rem' }}>No questions match this review mode.</h3>
        <button className="btn btn-secondary" onClick={onExit} style={{ marginTop: '1rem' }}>
          Back to Dashboard
        </button>
      </div>
    );
  }

  if (!activeQuestion) return null;

  // Round Headers
  const getRoundTitle = () => {
    if (!isMultiRound) {
      if (sessionType === 'test') return 'Exam Practice Mode';
      if (sessionType === 'mistakes') return 'Mistake Drill Review';
      return 'Quick recall';
    }
    switch (round) {
      case 1: return 'Vòng 1 — Học & Đánh giá tự tin';
      case 2: return `Vòng 2 — Ôn lại câu chưa tự tin / làm sai (${roundQuestions.length} câu)`;
      default: return 'Vòng 1 — Học';
    }
  };

  const progressPct = roundQuestions.length > 0 
    ? Math.round((currentIdx / roundQuestions.length) * 100) 
    : 0;

  return (
    <div className="flex-center" style={{ minHeight: '80vh', padding: '1rem 0' }}>
      <div 
        className="card animate-fade-in" 
        style={{ 
          width: '100%', 
          maxWidth: '720px', 
          padding: '2.5rem',
          boxShadow: 'var(--shadow-lg)',
          borderRadius: 'var(--radius-xl)'
        }}
      >
        
        {/* SESSION HEADER INFO */}
        <div className="flex-between" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <span className="badge badge-learning" style={{ fontSize: '0.7rem' }}>{getRoundTitle()}</span>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <span>Question {currentIdx + 1} of {roundQuestions.length}</span>
              {isMultiRound && <span style={{ color: 'var(--text-tertiary)' }}>&bull; Batch {batchIndex + 1}</span>}
            </div>
          </div>
          <button className="btn btn-secondary" onClick={onExit} style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', gap: '0.25rem' }}>
            <LogOut size={12} /> Exit
          </button>
        </div>

        {/* PROGRESS RATIO */}
        <div style={{ marginBottom: '2rem' }}>
          <div className="progress-container" style={{ height: '6px' }}>
            <div className="progress-bar" style={{ width: `${progressPct}%` }} />
          </div>
        </div>

        {/* ACTIVE QUESTION BODY */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', minHeight: '180px' }}>
          <div style={{ display: 'flex', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            <span className="badge badge-new" style={{ padding: '0.1rem 0.5rem', fontSize: '0.65rem' }}>{activeQuestion.topic}</span>
          </div>

          <h2 style={{ fontFamily: 'var(--font-header)', fontSize: '1.4rem', fontWeight: '700', lineHeight: '1.4' }}>
            {activeQuestion.questionText}
          </h2>

          {/* choices list if single or multiple */}
          {activeQuestion.choices.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
              {activeQuestion.choices.map((choice, idx) => {
                const label = choice.label;
                const isSelected = selectedLabels.includes(label);
                
                // Styling logic based on submission
                let borderStyle = '1px solid var(--border-color)';
                let bgStyle = 'var(--bg-card)';
                
                if (submitted) {
                  const isTestRound = !isMultiRound || round === 4;
                  if (isTestRound) {
                    // Test modes: Highlight selections only
                    if (isSelected) {
                      borderStyle = '2px solid var(--color-accent)';
                      bgStyle = 'var(--color-accent-light)';
                    }
                  } else {
                    // Practice modes: Highlight correct vs incorrect choices
                    if (choice.isCorrect) {
                      borderStyle = '2px solid var(--color-success)';
                      bgStyle = 'var(--color-success-light)';
                    } else if (isSelected) {
                      borderStyle = '2px solid var(--color-error)';
                      bgStyle = 'var(--color-error-light)';
                    }
                  }
                } else if (isSelected) {
                  borderStyle = '2px solid var(--color-accent)';
                  bgStyle = 'var(--color-accent-light)';
                }

                return (
                  <button 
                    key={choice.id} 
                    className="card flex-between"
                    onClick={() => {
                      if (submitted) return;
                      if (activeQuestion.questionType === 'multiple') {
                        setSelectedLabels(prev => 
                          prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]
                        );
                      } else {
                        setSelectedLabels([label]);
                      }
                    }}
                    style={{ 
                      padding: '1rem 1.25rem', 
                      borderRadius: 'var(--radius-md)', 
                      cursor: submitted ? 'default' : 'pointer',
                      border: borderStyle,
                      background: bgStyle,
                      textAlign: 'left',
                      width: '100%',
                      gap: '1rem'
                    }}
                  >
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                      <span style={{ 
                        width: '24px', 
                        height: '24px', 
                        borderRadius: '6px', 
                        backgroundColor: isSelected ? 'var(--color-accent)' : 'var(--border-color)',
                        color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: '700',
                        fontSize: '0.85rem'
                      }}>
                        {label}
                      </span>
                      <span style={{ fontSize: '0.95rem', color: 'var(--text-primary)', fontWeight: '500' }}>{choice.text}</span>
                    </div>

                    {/* Indicator Icon */}
                    {settings.keyboardShortcuts && !submitted && (
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', border: '1px solid var(--border-color)', padding: '0.1rem 0.35rem', borderRadius: '4px', alignSelf: 'center' }}>
                        {idx + 1}
                      </span>
                    )}

                    {submitted && !isMultiRound && choice.isCorrect && (
                      <Check size={16} color="var(--color-success)" style={{ alignSelf: 'center' }} />
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            /* TEXT FIELD FOR FILL-IN QUESTIONS */
            <div style={{ marginTop: '1rem' }}>
              <input 
                type="text" 
                className="input" 
                placeholder="Type your active recall answer..." 
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                disabled={submitted}
                style={{ padding: '1rem', fontSize: '1.05rem' }}
              />
            </div>
          )}

        </div>

        {/* FEEDBACK STATE / ANSWER EXPLANATIONS */}
        {submitted && feedback && (
          <div 
            className="animate-fade-in" 
            style={{ 
              marginTop: '2rem', 
              padding: '1.25rem 1.5rem', 
              borderRadius: 'var(--radius-md)',
              borderLeft: `4px solid ${feedback.isCorrect ? 'var(--color-success)' : 'var(--color-error)'}`,
              background: feedback.isCorrect ? 'rgba(16, 185, 129, 0.02)' : 'rgba(239, 68, 68, 0.02)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: feedback.isCorrect ? 'var(--color-success)' : 'var(--color-error)', fontWeight: '700' }}>
              {feedback.isCorrect ? (
                <>
                  <Check size={18} />
                  <span>Correct Answer!</span>
                </>
              ) : (
                <>
                  <X size={18} />
                  <span>Incorrect</span>
                </>
              )}
            </div>

            {/* If incorrect, show the differences */}
            {!feedback.isCorrect && (!isMultiRound || round !== 4) && (
              <div style={{ marginTop: '0.75rem', fontSize: '0.9rem' }}>
                <div style={{ color: 'var(--text-secondary)' }}>
                  Your answer: <strong style={{ color: 'var(--color-error)' }}>{selectedLabels.join(', ') || textInput || '(empty)'}</strong>
                </div>
                <div style={{ color: 'var(--text-primary)', marginTop: '0.25rem' }}>
                  Correct answer context: <strong style={{ color: 'var(--color-success)' }}>
                    {activeQuestion.choices.filter(c => c.isCorrect).map(c => c.label).join(', ') || 
                     activeQuestion.explanation.replace('Correct Answer Context: ', '')}
                  </strong>
                </div>
              </div>
            )}

            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.75rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
              <strong>Explanation:</strong> {activeQuestion.explanation}
            </div>
          </div>
        )}

        {/* BUTTON FOOTER TRIGGERS */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
          {!submitted ? (
            <button 
              className="btn btn-primary"
              onClick={handleSubmitAnswer}
              disabled={activeQuestion.choices.length > 0 ? selectedLabels.length === 0 : !textInput.trim()}
              style={{ padding: '0.75rem 2.5rem' }}
            >
              Submit Answer <ArrowRight size={16} />
            </button>
          ) : (
            // If answer is INCORRECT or test mode -> show Next Question button directly (no confidence prompt)
            (!feedback?.isCorrect || !isMultiRound) ? (
              <button className="btn btn-primary" onClick={handleNextQuestion} style={{ padding: '0.75rem 2.5rem' }}>
                Next Question <ArrowRight size={16} />
              </button>
            ) : (
              // If answer is CORRECT -> rate confidence (1: guessed, 2: unsure, 3: confident)
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)' }}>How confident were you?</span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                  <button className="btn btn-secondary" onClick={() => handleSelectConfidence('guessed')}>
                    I guessed {settings.keyboardShortcuts && <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>&bull; 1</span>}
                  </button>
                  <button className="btn btn-secondary" onClick={() => handleSelectConfidence('unsure')}>
                    Not sure {settings.keyboardShortcuts && <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>&bull; 2</span>}
                  </button>
                  <button className="btn btn-primary" onClick={() => handleSelectConfidence('confident')}>
                    Confident {settings.keyboardShortcuts && <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>&bull; 3</span>}
                  </button>
                </div>
              </div>
            )
          )}
        </div>

        {/* Shortcut Keyboard Legend */}
        {settings.keyboardShortcuts && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-tertiary)', fontSize: '0.75rem', marginTop: '1.5rem', justifyContent: 'center' }}>
            <Keyboard size={12} />
            <span>Shortcuts: [1-4] choice selects, [Enter] submits/proceeds</span>
          </div>
        )}

      </div>
    </div>
  );
}
