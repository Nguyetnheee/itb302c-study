import { StudySet, QuestionProgress, Attempt, Settings, StudySession, StreakInfo } from './types';
import { createInitialProgress } from './learning-engine';

const KEYS = {
  STUDY_SETS: 'pal_study_sets',
  PROGRESS_PREFIX: 'pal_progress_',
  ATTEMPTS_PREFIX: 'pal_attempts_',
  SETTINGS: 'pal_settings',
  STREAK: 'pal_streak',
  ACTIVE_SESSION_PREFIX: 'pal_active_session_'
};

const DEFAULT_SETTINGS: Settings = {
  questionsPerBatch: 10,
  dailyNewTarget: 10,
  dailyReviewTarget: 20,
  masteryStrictness: 'normal',
  showConfidence: true,
  shuffleOptions: true,
  keyboardShortcuts: true,
  darkMode: false,
  reminderTime: '19:00'
};

export function getSettings(): Settings {
  const data = localStorage.getItem(KEYS.SETTINGS);
  if (!data) return DEFAULT_SETTINGS;
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: Settings): void {
  localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
}

export function getStudySets(): StudySet[] {
  const data = localStorage.getItem(KEYS.STUDY_SETS);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export function saveStudySets(sets: StudySet[]): void {
  localStorage.setItem(KEYS.STUDY_SETS, JSON.stringify(sets));
}

export function getStudySet(id: string): StudySet | undefined {
  return getStudySets().find(set => set.id === id);
}

export function saveStudySet(set: StudySet): void {
  const sets = getStudySets();
  const index = sets.findIndex(s => s.id === set.id);
  if (index !== -1) {
    sets[index] = set;
  } else {
    sets.push(set);
  }
  saveStudySets(sets);

  // Initialize progress mapping for new questions if not present
  const progress = getQuestionProgressMap(set.id);
  let updated = false;
  set.questions.forEach((q) => {
    if (!progress[q.id]) {
      progress[q.id] = createInitialProgress('local-user', q.id);
      updated = true;
    }
  });
  if (updated) {
    saveQuestionProgressMap(set.id, progress);
  }
}

export function deleteStudySet(setId: string): void {
  const sets = getStudySets().filter(s => s.id !== setId);
  saveStudySets(sets);
  localStorage.removeItem(`${KEYS.PROGRESS_PREFIX}${setId}`);
  localStorage.removeItem(`${KEYS.ATTEMPTS_PREFIX}${setId}`);
  localStorage.removeItem(`${KEYS.ACTIVE_SESSION_PREFIX}${setId}`);
}

export function getQuestionProgressMap(setId: string): { [questionId: string]: QuestionProgress } {
  const data = localStorage.getItem(`${KEYS.PROGRESS_PREFIX}${setId}`);
  if (!data) return {};
  try {
    return JSON.parse(data);
  } catch {
    return {};
  }
}

export function saveQuestionProgressMap(setId: string, progressMap: { [questionId: string]: QuestionProgress }): void {
  localStorage.setItem(`${KEYS.PROGRESS_PREFIX}${setId}`, JSON.stringify(progressMap));
}

export function getAttempts(setId: string): Attempt[] {
  const data = localStorage.getItem(`${KEYS.ATTEMPTS_PREFIX}${setId}`);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export function saveAttempt(setId: string, attempt: Attempt): void {
  const attempts = getAttempts(setId);
  attempts.push(attempt);
  localStorage.setItem(`${KEYS.ATTEMPTS_PREFIX}${setId}`, JSON.stringify(attempts));
}

// Active session persistence to resume state
export function getActiveSession(setId: string): StudySession | null {
  const data = localStorage.getItem(`${KEYS.ACTIVE_SESSION_PREFIX}${setId}`);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export function saveActiveSession(setId: string, session: StudySession | null): void {
  if (session) {
    localStorage.setItem(`${KEYS.ACTIVE_SESSION_PREFIX}${setId}`, JSON.stringify(session));
  } else {
    localStorage.removeItem(`${KEYS.ACTIVE_SESSION_PREFIX}${setId}`);
  }
}



export function getStreakInfo(): StreakInfo {
  const data = localStorage.getItem(KEYS.STREAK);
  const defaultStreak: StreakInfo = { currentStreak: 0, longestStreak: 0, totalStudyDaysCount: 0 };
  if (!data) return defaultStreak;
  try {
    return { ...defaultStreak, ...JSON.parse(data) };
  } catch {
    return defaultStreak;
  }
}

export function recordStudyActivity(questionsCompletedCount = 1): StreakInfo {
  const streak = getStreakInfo();
  const todayStr = new Date().toDateString();
  
  if (streak.lastActiveDate === todayStr) {
    // Already active today, do not increment streak again but count the activity
    return streak;
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toDateString();

  if (streak.lastActiveDate === yesterdayStr) {
    // Consequent day! Increment streak
    streak.currentStreak += 1;
  } else {
    // Break in streak, reset to 1
    streak.currentStreak = 1;
  }

  if (streak.currentStreak > streak.longestStreak) {
    streak.longestStreak = streak.currentStreak;
  }

  streak.lastActiveDate = todayStr;
  streak.totalStudyDaysCount += 1;

  localStorage.setItem(KEYS.STREAK, JSON.stringify(streak));
  return streak;
}
