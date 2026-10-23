/**
 * Daily Task Reset Service for Music Mimi ($MIMI) Protocol
 * Handles 24-hour daily reset so tasks can be claimed again every single day.
 * When tasks reset, math quiz questions automatically rotate to a new, different question set!
 */

import { AirdropTask } from '../types/airdrop.ts';
import { generateDailyMathQuizTasks, getTodayDateString } from './mathTasksData.ts';

export { getTodayDateString };

export function getTimeUntilNextReset(): {
  hours: number;
  minutes: number;
  seconds: number;
  formatted: string;
} {
  const now = new Date();
  // Next local midnight (00:00:00 of tomorrow)
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
  const diffMs = Math.max(0, tomorrow.getTime() - now.getTime());
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
  const formatted = `${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m`;
  return { hours, minutes, seconds, formatted };
}

/**
 * Syncs saved tasks against default tasks and applies daily reset logic.
 * When daily reset occurs:
 * 1. Tasks are refreshed so user can claim daily repeatable tasks again.
 * 2. Math quiz questions automatically rotate to brand new, different questions seeded by the new date!
 */
export function syncTasksWithDailyReset(
  currentTasks: AirdropTask[],
  defaultTasks: AirdropTask[],
  overrideTodayDate?: string
): { tasks: AirdropTask[]; hasResetOccurred: boolean } {
  const todayStr = overrideTodayDate || getTodayDateString();
  let hasResetOccurred = false;

  // Generate today's fresh questions seeded by today's date
  const todayMathTasks = generateDailyMathQuizTasks(todayStr);

  const synced = defaultTasks.map((defaultTask) => {
    const isMathTask = defaultTask.category === 'math' || defaultTask.quizData;
    const taskDef = isMathTask
      ? (todayMathTasks.find((m) => m.id === defaultTask.id) || defaultTask)
      : defaultTask;

    const existing = currentTasks.find((t) => t.id === defaultTask.id);
    if (!existing) {
      return { ...taskDef, isDailyRepeatable: true, isCompleted: false, isFailedToday: false };
    }

    const isRepeatable = defaultTask.isDailyRepeatable !== false;

    // Check if task needs daily reset (previous day completion, previous day failure, or old quiz question date)
    const isOldQuizDate = isMathTask && Boolean(!existing.quizData?.dateGenerated || existing.quizData.dateGenerated !== todayStr);
    const isCompletedOnPreviousDay = Boolean(existing.isCompleted && existing.lastCompletedDate !== todayStr);
    const isFailedOnPreviousDay = Boolean(existing.isFailedToday && existing.lastFailedDate !== todayStr);

    if (isRepeatable && (isOldQuizDate || isCompletedOnPreviousDay || isFailedOnPreviousDay)) {
      hasResetOccurred = true;

      // On reset: Questions rotate to the new day's questions, completion & failure states reset!
      return {
        ...taskDef,
        isCompleted: false,
        isFailedToday: false,
        lastCompletedDate: existing.lastCompletedDate,
        lastCompletedTimestamp: existing.lastCompletedTimestamp,
        isDailyRepeatable: true,
      };
    }

    // Within the same day:
    const isFailedForToday = Boolean(existing.isFailedToday && existing.lastFailedDate === todayStr);
    const isCompletedForToday = Boolean(existing.isCompleted && existing.lastCompletedDate === todayStr);

    return {
      ...taskDef,
      ...existing,
      // Keep question fresh for today
      quizData: existing.quizData && existing.quizData.dateGenerated === todayStr ? existing.quizData : taskDef.quizData,
      title: existing.quizData && existing.quizData.dateGenerated === todayStr ? existing.title : taskDef.title,
      titleEn: existing.quizData && existing.quizData.dateGenerated === todayStr ? existing.titleEn : taskDef.titleEn,
      description: existing.quizData && existing.quizData.dateGenerated === todayStr ? existing.description : taskDef.description,
      descriptionEn: existing.quizData && existing.quizData.dateGenerated === todayStr ? existing.descriptionEn : taskDef.descriptionEn,
      isCompleted: isCompletedForToday,
      isFailedToday: isFailedForToday,
      isDailyRepeatable: true,
    };
  });

  return { tasks: synced, hasResetOccurred };
}
