/**
 * Daily Task Reset Service for Music Mimi ($MIMI) Protocol
 * Handles 24-hour daily reset so tasks can be claimed again every single day.
 */

import { AirdropTask } from '../types/airdrop.ts';

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

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
 * If a task was completed on a previous day (or legacy without date), it resets to false.
 */
export function syncTasksWithDailyReset(
  currentTasks: AirdropTask[],
  defaultTasks: AirdropTask[]
): { tasks: AirdropTask[]; hasResetOccurred: boolean } {
  const todayStr = getTodayDateString();
  let hasResetOccurred = false;

  const synced = defaultTasks.map((defaultTask) => {
    const existing = currentTasks.find((t) => t.id === defaultTask.id);
    if (!existing) {
      return { ...defaultTask, isDailyRepeatable: true, isCompleted: false };
    }

    const isRepeatable = defaultTask.isDailyRepeatable !== false;
    const isFailedForToday = Boolean(existing.isFailedToday && existing.lastFailedDate === todayStr);

    if (isRepeatable) {
      if (existing.isCompleted) {
        // If completed today, keep it completed for today
        if (existing.lastCompletedDate === todayStr) {
          return {
            ...defaultTask,
            ...existing,
            isCompleted: true,
            isFailedToday: false,
            lastCompletedDate: todayStr,
            isDailyRepeatable: true,
          };
        } else {
          // Completed on previous day or legacy record without date
          // Reset so user can do and claim it again TODAY!
          hasResetOccurred = true;
          return {
            ...defaultTask,
            isCompleted: false,
            isFailedToday: false,
            lastCompletedDate: existing.lastCompletedDate,
            lastCompletedTimestamp: existing.lastCompletedTimestamp,
            isDailyRepeatable: true,
          };
        }
      }
    }

    return {
      ...defaultTask,
      ...existing,
      isFailedToday: isFailedForToday,
      isDailyRepeatable: true,
    };
  });

  return { tasks: synced, hasResetOccurred };
}
