import React, { useState } from 'react';
import { 
  BookOpen, Calendar, Award, RotateCcw, AlertTriangle, Play, CheckCircle, 
  HelpCircle, Trash2, ChevronRight, BarChart2, Plus, LogOut, Flame, Clock, 
  ChevronDown, ChevronUp, Lock, RefreshCw, Star
} from 'lucide-react';
import { StudySet, QuestionProgress, StreakInfo, Settings } from '../lib/types';
import { getMemoryStateLabel, estimateRetention } from '../lib/learning-engine';

interface DashboardProps {
  studySets: StudySet[];
  progressMaps: { [setId: string]: { [qId: string]: QuestionProgress } };
  streak: StreakInfo;
  settings: Settings;
  onSelectSet: (setId: string) => void;
  onDeleteSet: (setId: string) => void;
  onStartSession: (setId: string, type: 'learn' | 'quick' | 'mistakes' | 'test', batchIndex?: number) => void;
  onNavigateToImport: () => void;
}

export default function Dashboard({
  studySets,
  progressMaps,
  streak,
  settings,
  onSelectSet,
  onDeleteSet,
  onStartSession,
  onNavigateToImport
}: DashboardProps) {
  const [selectedSetIdForDetails, setSelectedSetIdForDetails] = useState<string | null>(null);

  // Greeting based on current time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  // Compute stats across all study sets for the user
  const totalSets = studySets.length;
  let totalQuestions = 0;
  let totalMastered = 0;
  let totalLearning = 0;
  let totalWeak = 0;
  let totalReviewDue = 0;
  let totalAttemptsCount = 0;
  let correctAttemptsCount = 0;

  // Track breakdown by topic across all sets
  const topicMastery: { [topic: string]: { total: number; mastered: number } } = {};
  // Forgetting curve buckets
  let strongMemoryCount = 0;
  let fadingMemoryCount = 0;
  let reviewSoonCount = 0;
  let overdueCount = 0;

  studySets.forEach((set) => {
    const progressMap = progressMaps[set.id] || {};
    totalQuestions += set.questions.length;
    
    set.questions.forEach((q) => {
      const progress = progressMap[q.id];
      const topic = q.topic || 'General';
      if (!topicMastery[topic]) {
        topicMastery[topic] = { total: 0, mastered: 0 };
      }
      topicMastery[topic].total += 1;

      if (progress) {
        totalAttemptsCount += progress.correctCount + progress.incorrectCount;
        correctAttemptsCount += progress.correctCount;

        const retention = estimateRetention(progress);
        const state = getMemoryStateLabel(retention, progress);

        if (progress.masteryScore === 4) {
          totalMastered++;
          topicMastery[topic].mastered += 1;
        } else if (progress.masteryScore === 1) {
          totalWeak++;
        } else if (progress.masteryScore > 0) {
          totalLearning++;
        }

        if (state === 'REVIEW_DUE') {
          totalReviewDue++;
        }

        // Forgetting Curve model categorization
        if (progress.masteryScore > 0) {
          if (retention >= 0.8) strongMemoryCount++;
          else if (retention >= 0.5) fadingMemoryCount++;
          else if (retention >= 0.3) reviewSoonCount++;
          else overdueCount++;
        }
      }
    });
  });

  const overallAccuracy = totalAttemptsCount > 0 
    ? Math.round((correctAttemptsCount / totalAttemptsCount) * 100) 
    : 0;

  const activeSetDetails = studySets.find(s => s.id === selectedSetIdForDetails);

  // Return counts for a single set
  const getSetStats = (set: StudySet) => {
    const progressMap = progressMaps[set.id] || {};
    let mastered = 0;
    let learning = 0;
    let newQ = 0;
    let reviewDue = 0;
    let weak = 0;

    set.questions.forEach((q) => {
      const progress = progressMap[q.id];
      if (!progress || progress.masteryScore === 0) {
        newQ++;
      } else {
        const retention = estimateRetention(progress);
        const state = getMemoryStateLabel(retention, progress);
        if (progress.masteryScore === 4) mastered++;
        else if (progress.masteryScore === 1) weak++;
        else learning++;

        if (state === 'REVIEW_DUE') reviewDue++;
      }
    });

    return { mastered, learning, newQ, reviewDue, weak, total: set.questions.length };
  };

  // Build the list of batches for a selected study set
  const renderBatchProgression = (set: StudySet) => {
    const progressMap = progressMaps[set.id] || {};
    const size = settings.questionsPerBatch;
    const totalQuestionsCount = set.questions.length;
    const totalBatches = Math.ceil(totalQuestionsCount / size);
    const batches = [];

    // Evaluate progression
    let allPreviousBatchesMastered = true;

    for (let b = 0; b < totalBatches; b++) {
      const startIdx = b * size;
      const endIdx = Math.min(startIdx + size, totalQuestionsCount);
      const batchQuestions = set.questions.slice(startIdx, endIdx);
      
      let masteredCount = 0;
      let weakCount = 0;
      
      batchQuestions.forEach((q) => {
        const progress = progressMap[q.id];
        if (progress && progress.masteryScore === 4) {
          masteredCount++;
        }
        if (progress && progress.masteryScore === 1) {
          weakCount++;
        }
      });

      const totalInBatch = batchQuestions.length;
      const isMastered = masteredCount === totalInBatch;
      const isUnlocked = allPreviousBatchesMastered;

      batches.push({
        index: b,
        title: `Batch ${b + 1}`,
        range: `Questions ${startIdx + 1}–${endIdx}`,
        masteredCount,
        totalInBatch,
        weakCount,
        isMastered,
        isUnlocked
      });

      // Strict gating rule: This batch must be 100% mastered to unlock the next one!
      if (!isMastered) {
        allPreviousBatchesMastered = false;
      }
    }

    return (
      <div className="batch-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
        <h3 style={{ fontFamily: 'var(--font-header)', fontSize: '1.2rem', marginBottom: '0.5rem' }}>Learning Batches</h3>
        {batches.map((batch) => (
          <div 
            key={batch.index} 
            className={`card flex-between ${batch.isUnlocked ? '' : 'disabled-card'}`}
            style={{ 
              padding: '1.25rem', 
              opacity: batch.isUnlocked ? 1 : 0.6,
              background: batch.isMastered ? 'linear-gradient(to right, rgba(16, 185, 129, 0.05), var(--bg-card))' : 'var(--bg-card)',
              borderColor: batch.isMastered ? 'var(--color-success)' : 'var(--border-color)',
              position: 'relative'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontWeight: '700', fontSize: '1.1rem' }}>{batch.title}</span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>({batch.range})</span>
                {batch.isMastered && (
                  <span className="badge badge-mastered" style={{ padding: '0.15rem 0.5rem', fontSize: '0.65rem' }}>Mastered</span>
                )}
              </div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                {batch.masteredCount} / {batch.totalInBatch} questions mastered
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {!batch.isUnlocked ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-tertiary)' }}>
                  <Lock size={16} />
                  <span style={{ fontSize: '0.85rem' }}>Locked</span>
                </div>
              ) : batch.isMastered ? (
                <button 
                  className="btn btn-secondary" 
                  onClick={() => onStartSession(set.id, 'learn', batch.index)}
                  style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                >
                  <RefreshCw size={14} /> Re-study
                </button>
              ) : (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {batch.weakCount > 0 && (
                    <button 
                      className="btn btn-danger" 
                      onClick={() => onStartSession(set.id, 'mistakes', batch.index)}
                      style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', gap: '0.25rem' }}
                    >
                      <AlertTriangle size={14} /> Review {batch.weakCount} Weak
                    </button>
                  )}
                  <button 
                    className="btn btn-primary" 
                    onClick={() => onStartSession(set.id, 'learn', batch.index)}
                    style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                  >
                    <Play size={14} /> Start Batch
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* HEADER SECTION */}
      <div className="flex-between" style={{ flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-header)', fontSize: '2.2rem', fontWeight: 800 }}>
            {getGreeting()}, Learner 👋
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Ready to challenge your active recall and spaced intervals today?
          </p>
        </div>
        <button className="btn btn-primary" onClick={onNavigateToImport}>
          <Plus size={18} /> Upload Question Bank
        </button>
      </div>

      {/* TODAY'S TARGET SUMMARY PANEL */}
      {totalSets > 0 && !activeSetDetails && (
        <div 
          className="card glass-card" 
          style={{ 
            background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.08), rgba(6, 182, 212, 0.05))',
            borderColor: 'rgba(79, 70, 229, 0.2)',
            padding: '2rem',
            borderRadius: 'var(--radius-xl)'
          }}
        >
          <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div className="badge badge-learning" style={{ background: 'var(--color-accent-light)' }}>
                Today's Learning Plan
              </div>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 700, marginTop: '0.25rem' }}>
                Review Queue Pending
              </h2>
              <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--color-warning)' }} />
                  <span style={{ fontSize: '0.95rem' }}><strong>{totalReviewDue}</strong> Review Due</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--color-error)' }} />
                  <span style={{ fontSize: '0.95rem' }}><strong>{totalWeak}</strong> Weak Questions</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--color-accent)' }} />
                  <span style={{ fontSize: '0.95rem' }}><strong>{totalLearning}</strong> Active Learning</span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                <Clock size={14} />
                <span>Estimated Session Time: ~{Math.max(5, Math.round((totalReviewDue * 1.5) + (totalWeak * 2)))} minutes</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              {totalReviewDue > 0 && (
                <button 
                  className="btn btn-primary btn-lg" 
                  onClick={() => onStartSession(studySets[0].id, 'quick')}
                  style={{ padding: '1rem 2rem', fontSize: '1.1rem' }}
                >
                  <Play size={20} /> START TODAY'S SESSION
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* DETAILED PROGRESS ANALYTICS VIEW */}
      {activeSetDetails ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Back Action */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button 
              className="btn btn-secondary" 
              onClick={() => setSelectedSetIdForDetails(null)}
              style={{ padding: '0.5rem 1rem' }}
            >
              ← Back to Overview
            </button>
            <button 
              className="btn btn-danger" 
              onClick={() => {
                if (window.confirm(`Are you sure you want to delete the study set "${activeSetDetails.title}"? This will erase all history and progress.`)) {
                  onDeleteSet(activeSetDetails.id);
                  setSelectedSetIdForDetails(null);
                }
              }}
              style={{ padding: '0.5rem 1rem', display: 'flex', gap: '0.25rem', alignItems: 'center' }}
            >
              <Trash2 size={14} /> Delete Study Set
            </button>
          </div>

          <div className="card glass-card" style={{ padding: '2rem' }}>
            <h2 style={{ fontFamily: 'var(--font-header)', fontSize: '1.8rem', fontWeight: 800 }}>{activeSetDetails.title}</h2>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{activeSetDetails.description}</p>
            
            {/* Stats summary */}
            {(() => {
              const stats = getSetStats(activeSetDetails);
              const progressPct = stats.total > 0 ? Math.round((stats.mastered / stats.total) * 100) : 0;
              return (
                <div style={{ marginTop: '1.5rem' }}>
                  <div className="flex-between" style={{ marginBottom: '0.5rem', fontWeight: '600' }}>
                    <span>Mastery Progress</span>
                    <span>{progressPct}% ({stats.mastered} / {stats.total} Mastered)</span>
                  </div>
                  <div className="progress-container" style={{ height: '12px' }}>
                    <div className="progress-bar progress-bar-success" style={{ width: `${progressPct}%` }} />
                  </div>
                  
                  {/* Grid breakdown boxes */}
                  <div className="grid-cols-3" style={{ marginTop: '1.5rem' }}>
                    <div className="card" style={{ padding: '1rem', textAlign: 'center' }}>
                      <span style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--color-success)' }}>{stats.mastered}</span>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Mastered</div>
                    </div>
                    <div className="card" style={{ padding: '1rem', textAlign: 'center' }}>
                      <span style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--color-accent)' }}>{stats.learning}</span>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Learning</div>
                    </div>
                    <div className="card" style={{ padding: '1rem', textAlign: 'center' }}>
                      <span style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--color-warning)' }}>{stats.reviewDue}</span>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Review Due</div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Batches strict gates visualization */}
          {renderBatchProgression(activeSetDetails)}

          {/* Test practice options */}
          <div className="card" style={{ marginTop: '1rem' }}>
            <h3 style={{ fontFamily: 'var(--font-header)', fontSize: '1.2rem', marginBottom: '1rem' }}>Adaptive Practices</h3>
            <div className="grid-cols-3" style={{ gap: '1rem' }}>
              <div 
                className="card" 
                style={{ cursor: 'pointer', padding: '1.25rem', transition: 'all var(--transition-fast)' }}
                onClick={() => onStartSession(activeSetDetails.id, 'quick')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-warning)' }}>
                  <Clock size={18} />
                  <span style={{ fontWeight: '600' }}>Quick Review</span>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                  Practice 5–10 high-priority active recall cards.
                </p>
              </div>

              <div 
                className="card" 
                style={{ cursor: 'pointer', padding: '1.25rem', transition: 'all var(--transition-fast)' }}
                onClick={() => onStartSession(activeSetDetails.id, 'mistakes')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-error)' }}>
                  <AlertTriangle size={18} />
                  <span style={{ fontWeight: '600' }}>Practice Mistakes</span>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                  Drill down into questions frequently answered incorrectly.
                </p>
              </div>

              <div 
                className="card" 
                style={{ cursor: 'pointer', padding: '1.25rem', transition: 'all var(--transition-fast)' }}
                onClick={() => onStartSession(activeSetDetails.id, 'test')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-accent)' }}>
                  <BookOpen size={18} />
                  <span style={{ fontWeight: '600' }}>Exam Simulation</span>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                  Simulated exam mode with final block grading.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* STANDARD OVERVIEW DASHBOARD */
        <>
          {/* STATS OVERVIEW CARDS */}
          {totalSets > 0 && (
            <div className="grid-cols-3">
              <div className="card flex-between" style={{ padding: '1.5rem' }}>
                <div>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Streak Record</span>
                  <h3 style={{ fontSize: '1.8rem', fontWeight: '800', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Flame size={28} color="var(--color-warning)" fill="var(--color-warning)" /> {streak.currentStreak} Days
                  </h3>
                </div>
                <div style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem', textAlign: 'right' }}>
                  Longest: {streak.longestStreak} days
                </div>
              </div>

              <div className="card flex-between" style={{ padding: '1.5rem' }}>
                <div>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Total Mastered</span>
                  <h3 style={{ fontSize: '1.8rem', fontWeight: '800', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Award size={28} color="var(--color-success)" /> {totalMastered} Questions
                  </h3>
                </div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  {totalQuestions > 0 ? Math.round((totalMastered / totalQuestions) * 100) : 0}% of set
                </div>
              </div>

              <div className="card flex-between" style={{ padding: '1.5rem' }}>
                <div>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Overall Accuracy</span>
                  <h3 style={{ fontSize: '1.8rem', fontWeight: '800', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CheckCircle size={28} color="var(--color-accent)" /> {overallAccuracy}%
                  </h3>
                </div>
                <div style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem' }}>
                  {totalAttemptsCount} answers logged
                </div>
              </div>
            </div>
          )}

          {/* TWO COLUMN CONTENT VIEW (STUDY SETS vs ANALYTICS) */}
          {totalSets > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: '7fr 5fr', gap: '2rem' }}>
              
              {/* Study Sets List Column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <h2 style={{ fontFamily: 'var(--font-header)', fontSize: '1.4rem' }}>My Study Sets</h2>
                {studySets.map((set) => {
                  const stats = getSetStats(set);
                  const progressPct = stats.total > 0 ? Math.round((stats.mastered / stats.total) * 100) : 0;
                  return (
                    <div 
                      key={set.id} 
                      className="card" 
                      style={{ cursor: 'pointer', transition: 'all var(--transition-fast)' }}
                      onClick={() => setSelectedSetIdForDetails(set.id)}
                    >
                      <div className="flex-between">
                        <div>
                          <h3 style={{ fontSize: '1.2rem', fontWeight: '700' }}>{set.title}</h3>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            {stats.total} questions &bull; Created {new Date(set.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <ChevronRight size={18} color="var(--text-tertiary)" />
                      </div>

                      <div style={{ marginTop: '1.25rem' }}>
                        <div className="flex-between" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                          <span>Mastery Progress</span>
                          <span>{progressPct}% ({stats.mastered} Mastered)</span>
                        </div>
                        <div className="progress-container">
                          <div className="progress-bar progress-bar-success" style={{ width: `${progressPct}%` }} />
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', fontSize: '0.75rem' }}>
                          <span style={{ color: 'var(--color-success)' }}>{stats.mastered} Mastered</span>
                          <span style={{ color: 'var(--color-accent)' }}>{stats.learning} Learning</span>
                          {stats.reviewDue > 0 && <span style={{ color: 'var(--color-warning)' }}>{stats.reviewDue} Due</span>}
                          {stats.weak > 0 && <span style={{ color: 'var(--color-error)' }}>{stats.weak} Weak</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Memory analytics panel column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <h2 style={{ fontFamily: 'var(--font-header)', fontSize: '1.4rem' }}>Memory Overviews</h2>
                
                {/* Forgetting curve buckets chart */}
                <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: '600' }}>Retention Distribution</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div>
                      <div className="flex-between" style={{ fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                        <span>Strong Memory (R &ge; 80%)</span>
                        <strong style={{ color: 'var(--color-success)' }}>{strongMemoryCount}</strong>
                      </div>
                      <div className="progress-container" style={{ height: '6px' }}>
                        <div className="progress-bar progress-bar-success" style={{ width: `${totalQuestions > 0 ? (strongMemoryCount / totalQuestions) * 100 : 0}%` }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex-between" style={{ fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                        <span>Fading (50% &le; R &lt; 80%)</span>
                        <strong style={{ color: 'var(--color-info)' }}>{fadingMemoryCount}</strong>
                      </div>
                      <div className="progress-container" style={{ height: '6px' }}>
                        <div className="progress-bar" style={{ width: `${totalQuestions > 0 ? (fadingMemoryCount / totalQuestions) * 100 : 0}%`, background: 'var(--color-info)' }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex-between" style={{ fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                        <span>Review Soon (30% &le; R &lt; 50%)</span>
                        <strong style={{ color: 'var(--color-warning)' }}>{reviewSoonCount}</strong>
                      </div>
                      <div className="progress-container" style={{ height: '6px' }}>
                        <div className="progress-bar" style={{ width: `${totalQuestions > 0 ? (reviewSoonCount / totalQuestions) * 100 : 0}%`, background: 'var(--color-warning)' }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex-between" style={{ fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                        <span>Overdue (R &lt; 30%)</span>
                        <strong style={{ color: 'var(--color-error)' }}>{overdueCount}</strong>
                      </div>
                      <div className="progress-container" style={{ height: '6px' }}>
                        <div className="progress-bar" style={{ width: `${totalQuestions > 0 ? (overdueCount / totalQuestions) * 100 : 0}%`, background: 'var(--color-error)' }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Topic Breakdown chart */}
                <div className="card">
                  <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem' }}>Mastery by Topic</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {Object.entries(topicMastery).map(([topic, data]) => {
                      const pct = Math.round((data.mastered / data.total) * 100);
                      return (
                        <div key={topic}>
                          <div className="flex-between" style={{ fontSize: '0.8rem', marginBottom: '0.15rem' }}>
                            <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '70%' }}>{topic}</span>
                            <span>{pct}% ({data.mastered}/{data.total})</span>
                          </div>
                          <div className="progress-container" style={{ height: '4px' }}>
                            <div className="progress-bar progress-bar-success" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

            </div>
          ) : (
            /* EMPTY STATE SCREEN */
            <div 
              className="card flex-center" 
              style={{ 
                flexDirection: 'column', 
                padding: '4rem 2rem', 
                textAlign: 'center',
                background: 'linear-gradient(to bottom, var(--bg-card), rgba(79, 70, 229, 0.02))',
                borderRadius: 'var(--radius-xl)'
              }}
            >
              <div 
                style={{ 
                  width: '80px', 
                  height: '80px', 
                  borderRadius: '50%', 
                  backgroundColor: 'var(--color-accent-light)',
                  color: 'var(--color-accent)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1.5rem'
                }}
              >
                <BookOpen size={40} />
              </div>
              <h2 style={{ fontFamily: 'var(--font-header)', fontSize: '1.8rem', fontWeight: 800 }}>
                Turn your question bank into a learning system.
              </h2>
              <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', margin: '0.5rem auto 1.5rem' }}>
                Upload your PDF, CSV, TXT, or paste lecture quizzes. We'll segment them into structured batches and optimize review intervals automatically.
              </p>
              <button className="btn btn-primary" onClick={onNavigateToImport}>
                UPLOAD QUESTION BANK
              </button>
            </div>
          )}
        </>
      )}

    </div>
  );
}
