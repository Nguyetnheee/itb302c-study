import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Upload, Settings as SettingsIcon, Award, Flame, 
  HelpCircle, Clock, CheckCircle, BarChart2, Plus, Sparkles, Moon, Sun
} from 'lucide-react';

import Dashboard from './components/Dashboard';
import ImportWorkflow from './components/ImportWorkflow';
import StudySession from './components/StudySession';
import Settings from './components/Settings';

import { StudySet, QuestionProgress, StreakInfo, Settings as SettingsType, Attempt } from './lib/types';
import { 
  getStudySets, saveStudySet, deleteStudySet, 
  getQuestionProgressMap, saveQuestionProgressMap, 
  getAttempts, saveAttempt, 
  getSettings, saveSettings, 
  getStreakInfo, recordStudyActivity,
  getActiveSession, saveActiveSession
} from './lib/storage';
import { buildDemoStudySet, getDemoProgress, DEMO_SET_ID } from './lib/demo-data';
import { PRELOADED_STUDY_SET } from './lib/preloaded-set';

export default function App() {
  const [view, setView] = useState<'dashboard' | 'import' | 'study' | 'settings'>('dashboard');
  
  // Data State
  const [studySets, setStudySets] = useState<StudySet[]>([]);
  const [progressMaps, setProgressMaps] = useState<{ [setId: string]: { [qId: string]: QuestionProgress } }>({});
  const [settings, setSettings] = useState<SettingsType>(getSettings());
  const [streak, setStreak] = useState<StreakInfo>(getStreakInfo());
  
  // Study session variables
  const [activeSetId, setActiveSetId] = useState<string | null>(null);
  const [sessionType, setSessionType] = useState<'learn' | 'quick' | 'mistakes' | 'test'>('learn');
  const [activeBatchIndex, setActiveBatchIndex] = useState<number>(0);
  
  // Post-session statistics overlay
  const [showSummary, setShowSummary] = useState(false);
  const [lastSessionStats, setLastSessionStats] = useState<{
    studiedCount: number;
    correctCount: number;
    accuracy: number;
    masteredCount: number;
    reviewCount: number;
    weakCount: number;
  } | null>(null);

  // Initialize data on load
  useEffect(() => {
    let loadedSets = getStudySets();
    
    // Always sync preloaded set to ensure latest 330 questions and correct multi-select answers
    if (PRELOADED_STUDY_SET && PRELOADED_STUDY_SET.questions) {
      const cleanedSet = {
        ...PRELOADED_STUDY_SET,
        id: 'preloaded-itb302c-coursera',
        title: 'ITB302c - Coursera (Full Set)',
        questions: PRELOADED_STUDY_SET.questions.map((q, idx) => ({ ...q, questionNumber: idx + 1 }))
      };
      saveStudySet(cleanedSet);
      loadedSets = getStudySets(); // reload sets
    }

    setStudySets(loadedSets);

    const maps: { [setId: string]: { [qId: string]: QuestionProgress } } = {};
    loadedSets.forEach((set) => {
      maps[set.id] = getQuestionProgressMap(set.id);
    });
    setProgressMaps(maps);
    
    // Apply initial theme settings
    if (settings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const handleRefreshData = () => {
    const loadedSets = getStudySets();
    setStudySets(loadedSets);
    const maps: { [setId: string]: { [qId: string]: QuestionProgress } } = {};
    loadedSets.forEach((set) => {
      maps[set.id] = getQuestionProgressMap(set.id);
    });
    setProgressMaps(maps);
    setStreak(getStreakInfo());
  };

  // Load Demo Dataset Handler
  const handleLoadDemoData = () => {
    const demoSet = buildDemoStudySet();
    saveStudySet(demoSet);
    
    const demoProgress = getDemoProgress(demoSet.questions);
    saveQuestionProgressMap(demoSet.id, demoProgress);
    
    handleRefreshData();
    setView('dashboard');
  };

  // Save changes to settings
  const handleSaveSettings = (updated: SettingsType) => {
    setSettings(updated);
    saveSettings(updated);
  };

  // Import Study Set Completed
  const handleImportComplete = (newSet: StudySet) => {
    saveStudySet(newSet);
    handleRefreshData();
    setView('dashboard');
  };

  // Delete Study Set Completed
  const handleDeleteSet = (setId: string) => {
    deleteStudySet(setId);
    handleRefreshData();
  };

  // Start study session
  const handleStartSession = (setId: string, type: 'learn' | 'quick' | 'mistakes' | 'test', batchIndex = 0) => {
    setActiveSetId(setId);
    setSessionType(type);
    setActiveBatchIndex(batchIndex);
    setView('study');
    setShowSummary(false);
  };

  // Complete study session callback
  const handleSessionComplete = (sessionAttempts: Attempt[], updatedProgress: { [qId: string]: QuestionProgress }) => {
    if (!activeSetId) return;

    // 1. Record attempts log
    sessionAttempts.forEach((attempt) => {
      saveAttempt(activeSetId, attempt);
    });

    // 2. Save progress updates
    saveQuestionProgressMap(activeSetId, updatedProgress);

    // 3. Record study streak increment
    const updatedStreak = recordStudyActivity(sessionAttempts.length);
    setStreak(updatedStreak);

    // 4. Calculate session stats to display
    const studiedCount = sessionAttempts.length;
    const correctCount = sessionAttempts.filter(a => a.isCorrect).length;
    const accuracy = studiedCount > 0 ? Math.round((correctCount / studiedCount) * 100) : 0;

    let masteredCount = 0;
    let reviewCount = 0;
    let weakCount = 0;

    // Compare original progress vs updated progress
    const originalProgress = progressMaps[activeSetId] || {};
    Object.keys(updatedProgress).forEach((qId) => {
      const orig = originalProgress[qId];
      const curr = updatedProgress[qId];
      if (curr) {
        if (curr.masteryScore === 4 && (!orig || orig.masteryScore < 4)) {
          masteredCount++;
        }
        if (curr.state === 'REVIEW_DUE' && (!orig || orig.state !== 'REVIEW_DUE')) {
          reviewCount++;
        }
        if (curr.masteryScore === 1 && (!orig || orig.masteryScore !== 1)) {
          weakCount++;
        }
      }
    });

    setLastSessionStats({
      studiedCount,
      correctCount,
      accuracy,
      masteredCount,
      reviewCount,
      weakCount
    });

    handleRefreshData();
    setShowSummary(true);
    setView('dashboard');
  };

  // DB Backup Exports Handler
  const handleExportData = () => {
    const database: { [key: string]: string | null } = {};
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('pal_')) {
        database[key] = localStorage.getItem(key);
      }
    });
    
    const blob = new Blob([JSON.stringify(database, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = ` PAL_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
  };

  // DB Backup Imports Handler
  const handleImportData = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const database = JSON.parse(e.target?.result as string);
        if (typeof database === 'object' && database !== null) {
          Object.entries(database).forEach(([key, val]) => {
            if (key.startsWith('pal_') && typeof val === 'string') {
              localStorage.setItem(key, val);
            }
          });
          alert('Database restored successfully! Reloading...');
          window.location.reload();
        } else {
          alert('Invalid backup structure.');
        }
      } catch (err) {
        alert('Failed to parse database backup file.');
      }
    };
    reader.readAsText(file);
  };

  const activeSet = studySets.find(s => s.id === activeSetId);

  return (
    <div className="app-container">
      
      {/* SIDEBAR NAVIGATION */}
      {view !== 'study' && (
        <nav className="sidebar">
          <div className="logo">
            <Sparkles size={24} />
            <span>PAL Engine</span>
          </div>

          <ul className="nav-links">
            <li 
              className={`nav-item ${view === 'dashboard' ? 'active' : ''}`}
              onClick={() => { setView('dashboard'); setShowSummary(false); }}
            >
              <BookOpen size={18} />
              <span>Dashboard</span>
            </li>
            <li 
              className={`nav-item ${view === 'import' ? 'active' : ''}`}
              onClick={() => { setView('import'); setShowSummary(false); }}
            >
              <Upload size={18} />
              <span>Import Set</span>
            </li>
            <li 
              className={`nav-item ${view === 'settings' ? 'active' : ''}`}
              onClick={() => { setView('settings'); setShowSummary(false); }}
            >
              <SettingsIcon size={18} />
              <span>Settings</span>
            </li>
          </ul>

          <div className="sidebar-footer">
            {/* Streak display */}
            <div 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem', 
                background: 'var(--color-warning-light)', 
                color: 'var(--color-warning)',
                padding: '0.75rem', 
                borderRadius: 'var(--radius-md)',
                fontWeight: '700',
                fontSize: '0.9rem'
              }}
            >
              <Flame size={20} fill="var(--color-warning)" />
              <span>{streak.currentStreak} Day Streak</span>
            </div>

            {/* Quick Demo Option */}
            {studySets.length === 0 && (
              <button 
                className="btn btn-secondary" 
                onClick={handleLoadDemoData}
                style={{ fontSize: '0.8rem', padding: '0.5rem', width: '100%' }}
              >
                ⚡ Load Demo Set
              </button>
            )}
          </div>
        </nav>
      )}

      {/* MAIN DYNAMIC CONTENT */}
      <main className="main-content" style={{ padding: view === 'study' ? '0' : '2rem' }}>
        
        {/* SESSION SUMMARY DESSERT BOX */}
        {showSummary && lastSessionStats && view === 'dashboard' && (
          <div 
            className="card animate-fade-in" 
            style={{ 
              borderColor: 'var(--color-success)', 
              background: 'linear-gradient(to bottom, rgba(16, 185, 129, 0.03), var(--bg-card))',
              marginBottom: '2rem',
              padding: '2rem',
              borderRadius: 'var(--radius-xl)'
            }}
          >
            <div className="flex-between">
              <div>
                <span className="badge badge-mastered">Session Completed 🎉</span>
                <h2 style={{ fontFamily: 'var(--font-header)', fontSize: '1.6rem', fontWeight: 800, marginTop: '0.5rem' }}>
                  Great recall progress logged!
                </h2>
              </div>
              <button className="btn btn-secondary" onClick={() => setShowSummary(false)} style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem' }}>
                Dismiss
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '1rem', marginTop: '1.5rem' }}>
              <div className="card" style={{ padding: '0.75rem', textAlign: 'center' }}>
                <span style={{ fontSize: '1.4rem', fontWeight: 800 }}>{lastSessionStats.studiedCount}</span>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Studied</div>
              </div>
              <div className="card" style={{ padding: '0.75rem', textAlign: 'center' }}>
                <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-success)' }}>{lastSessionStats.accuracy}%</span>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Accuracy</div>
              </div>
              <div className="card" style={{ padding: '0.75rem', textAlign: 'center' }}>
                <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-success)' }}>+{lastSessionStats.masteredCount}</span>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Mastered Today</div>
              </div>
              <div className="card" style={{ padding: '0.75rem', textAlign: 'center' }}>
                <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-warning)' }}>+{lastSessionStats.reviewCount}</span>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Reviews Slated</div>
              </div>
              {lastSessionStats.weakCount > 0 && (
                <div className="card" style={{ padding: '0.75rem', textAlign: 'center', borderColor: 'var(--color-error)' }}>
                  <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-error)' }}>{lastSessionStats.weakCount}</span>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Weak Identified</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* CONTROLLER ROUTING */}
        {view === 'dashboard' && (
          <Dashboard 
            studySets={studySets} 
            progressMaps={progressMaps}
            streak={streak}
            settings={settings}
            onSelectSet={setActiveSetId}
            onDeleteSet={handleDeleteSet}
            onStartSession={handleStartSession}
            onNavigateToImport={() => setView('import')}
          />
        )}

        {view === 'import' && (
          <ImportWorkflow 
            onImportComplete={handleImportComplete}
            onCancel={() => setView('dashboard')}
          />
        )}

        {view === 'study' && activeSet && (
          <StudySession 
            setId={activeSet.id}
            sessionType={sessionType}
            batchIndex={activeBatchIndex}
            questions={activeSet.questions}
            progressMap={progressMaps[activeSet.id] || {}}
            settings={settings}
            onSessionComplete={handleSessionComplete}
            onExit={() => { setView('dashboard'); handleRefreshData(); }}
          />
        )}

        {view === 'settings' && (
          <Settings 
            settings={settings}
            onSave={handleSaveSettings}
            onExportData={handleExportData}
            onImportData={handleImportData}
          />
        )}

      </main>
    </div>
  );
}
