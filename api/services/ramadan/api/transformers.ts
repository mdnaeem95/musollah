/**
 * Ramadan Data Transformers
 *
 * Functions to transform and compute Ramadan-specific data.
 *
 * @version 1.0
 * @since 2026-02-14
 */

import type {
  RamadanTrackerState,
  RamadanStats,
  FastingDayLog,
  TarawihDayLog,
  QuranJuzLog,
} from '../types';
import { TOTAL_JUZ } from '../types/constants';

// ============================================================================
// STATS COMPUTATION
// ============================================================================

/**
 * Compute comprehensive Ramadan stats from tracker state.
 */
export function computeRamadanStats(
  tracker: RamadanTrackerState,
  currentDay: number
): RamadanStats {
  const fastingLogs = Object.values(tracker.fastingLogs);
  const tarawihLogs = Object.values(tracker.tarawihLogs);
  const quranLogs = Object.values(tracker.quranKhatamLogs);

  // Fasting stats
  const daysFasted = fastingLogs.filter((l) => l.status === 'fasted').length;
  const daysMissed = fastingLogs.filter((l) => l.status === 'missed').length;
  const daysExcused = fastingLogs.filter((l) => l.status === 'excused').length;
  const daysRemaining = Math.max(0, tracker.totalDays - currentDay);

  // Fasting streak (current)
  let fastingStreak = 0;
  for (let d = currentDay; d >= 1; d--) {
    if (tracker.fastingLogs[d]?.status === 'fasted') {
      fastingStreak++;
    } else {
      break;
    }
  }

  // Longest fasting streak
  let longestFastingStreak = 0;
  let tempStreak = 0;
  for (let d = 1; d <= currentDay; d++) {
    if (tracker.fastingLogs[d]?.status === 'fasted') {
      tempStreak++;
      longestFastingStreak = Math.max(longestFastingStreak, tempStreak);
    } else {
      tempStreak = 0;
    }
  }

  // Tarawih stats
  const tarawihCompleted = tarawihLogs.filter((l) => l.prayed).length;
  const tarawihAtMosque = tarawihLogs.filter(
    (l) => l.prayed && l.location === 'mosque'
  ).length;
  const tarawihAtHome = tarawihLogs.filter(
    (l) => l.prayed && l.location === 'home'
  ).length;
  const tarawihMissed = tarawihLogs.filter((l) => !l.prayed).length;

  // Quran stats
  const juzCompleted = quranLogs.filter((l) => l.completed).length;
  const totalPagesRead = quranLogs.reduce((sum, l) => sum + l.pagesRead, 0);
  const quranProgress = Math.round((juzCompleted / TOTAL_JUZ) * 100);

  // Overall score (weighted average)
  const daysElapsed = Math.min(currentDay, tracker.totalDays);
  const fastingScore = daysElapsed > 0 ? (daysFasted / daysElapsed) * 100 : 0;
  const tarawihScore = daysElapsed > 0 ? (tarawihCompleted / daysElapsed) * 100 : 0;
  const quranScore = quranProgress;
  const overallScore = Math.round(
    fastingScore * 0.4 + tarawihScore * 0.3 + quranScore * 0.3
  );

  return {
    daysFasted,
    daysMissed,
    daysExcused,
    daysRemaining,
    qadaDaysNeeded: daysMissed,
    fastingStreak,
    longestFastingStreak,
    tarawihCompleted,
    tarawihAtMosque,
    tarawihAtHome,
    tarawihMissed,
    juzCompleted,
    totalPagesRead,
    quranProgress,
    currentRamadanDay: currentDay,
    daysElapsed,
    overallScore,
  };
}

// ============================================================================
// EXPORT HELPERS
// ============================================================================

/**
 * Format stats for sharing (plain text summary)
 */
export function formatStatsForSharing(
  stats: RamadanStats,
  ramadanYear: number
): string {
  return [
    `Ramadan ${ramadanYear} Progress`,
    `Day ${stats.currentRamadanDay}`,
    '',
    `Fasting: ${stats.daysFasted} days`,
    `Tarawih: ${stats.tarawihCompleted} nights`,
    `Quran: ${stats.juzCompleted}/${TOTAL_JUZ} juz (${stats.quranProgress}%)`,
    stats.fastingStreak > 0 ? `Streak: ${stats.fastingStreak} days` : '',
    '',
    'Tracked with Rihlah',
  ]
    .filter(Boolean)
    .join('\n');
}
