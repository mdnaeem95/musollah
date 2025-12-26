/**
 * Date Utilities
 * 
 * Date manipulation and formatting functions for prayer times.
 * 
 * @version 3.0
 * @since 2025-12-22
 */

import {
  format,
  parse,
  addDays,
  subDays,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  isSameDay,
  isToday,
  isTomorrow,
  isYesterday,
  differenceInDays,
  differenceInMinutes,
  differenceInHours,
} from 'date-fns';
import { DATE_FORMATS } from '../types/constants';

// ============================================================================
// DATE FORMATTING
// ============================================================================

/**
 * Format date to ISO string (YYYY-MM-DD)
 * 
 * @param date - Date object
 * @returns ISO date string
 * 
 * @example
 * ```ts
 * formatToISO(new Date('2025-12-22')) // "2025-12-22"
 * ```
 */
export function formatToISO(date: Date): string {
  return format(date, DATE_FORMATS.ISO);
}

/**
 * Format date to display string
 * 
 * @param date - Date object
 * @param formatString - Format pattern (default: "EEE, MMM dd, yyyy")
 * @returns Formatted date string
 * 
 * @example
 * ```ts
 * formatToDisplay(new Date('2025-12-22')) // "Sun, Dec 22, 2025"
 * formatToDisplay(new Date('2025-12-22'), 'dd/MM/yyyy') // "22/12/2025"
 * ```
 */
export function formatToDisplay(
  date: Date,
  formatString: string = 'EEE, MMM dd, yyyy'
): string {
  return format(date, formatString);
}

/**
 * Format date to Firebase format (D/M/YYYY)
 * 
 * @param date - Date object
 * @returns Firebase date string
 * 
 * @example
 * ```ts
 * formatToFirebase(new Date('2025-12-22')) // "22/12/2025"
 * ```
 */
export function formatToFirebase(date: Date): string {
  return format(date, DATE_FORMATS.FIREBASE);
}

/**
 * Format date to Aladhan API format (DD-MM-YYYY)
 * 
 * @param date - Date object
 * @returns Aladhan date string
 * 
 * @example
 * ```ts
 * formatToAladhan(new Date('2025-12-22')) // "22-12-2025"
 * ```
 */
export function formatToAladhan(date: Date): string {
  return format(date, DATE_FORMATS.API);
}

// ============================================================================
// DATE PARSING
// ============================================================================

/**
 * Parse ISO date string to Date object
 * 
 * @param isoDate - ISO date string (YYYY-MM-DD)
 * @returns Date object
 * 
 * @example
 * ```ts
 * parseISODate('2025-12-22') // Date object for Dec 22, 2025
 * ```
 */
export function parseISODate(isoDate: string): Date {
  return parse(isoDate, DATE_FORMATS.ISO, new Date());
}

/**
 * Parse Firebase date string to Date object
 * 
 * @param firebaseDate - Firebase date string (D/M/YYYY)
 * @returns Date object
 * 
 * @example
 * ```ts
 * parseFirebaseDate('22/12/2025') // Date object for Dec 22, 2025
 * ```
 */
export function parseFirebaseDate(firebaseDate: string): Date {
  // Handle both D/M/YYYY and DD/MM/YYYY
  const [day, month, year] = firebaseDate.split('/');
  return new Date(
    parseInt(year, 10),
    parseInt(month, 10) - 1,
    parseInt(day, 10)
  );
}

/**
 * Parse Aladhan date string to Date object
 * 
 * @param aladhanDate - Aladhan date string (DD-MM-YYYY)
 * @returns Date object
 */
export function parseAladhanDate(aladhanDate: string): Date {
  return parse(aladhanDate, DATE_FORMATS.API, new Date());
}

// ============================================================================
// DATE MANIPULATION
// ============================================================================

/**
 * Get today's date
 * 
 * @returns Today's Date object at midnight
 */
export function getToday(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

/**
 * Get tomorrow's date
 * 
 * @returns Tomorrow's Date object
 */
export function getTomorrow(): Date {
  return addDays(getToday(), 1);
}

/**
 * Get yesterday's date
 * 
 * @returns Yesterday's Date object
 */
export function getYesterday(): Date {
  return subDays(getToday(), 1);
}

/**
 * Add days to a date
 * 
 * @param date - Starting date
 * @param days - Number of days to add
 * @returns New date
 * 
 * @example
 * ```ts
 * addDaysToDate(new Date('2025-12-22'), 3) // Dec 25, 2025
 * ```
 */
export function addDaysToDate(date: Date, days: number): Date {
  return addDays(date, days);
}

/**
 * Subtract days from a date
 * 
 * @param date - Starting date
 * @param days - Number of days to subtract
 * @returns New date
 */
export function subtractDaysFromDate(date: Date, days: number): Date {
  return subDays(date, days);
}

// ============================================================================
// DATE RANGES
// ============================================================================

/**
 * Get start of week (Monday)
 * 
 * @param date - Reference date
 * @returns Start of week
 * 
 * @example
 * ```ts
 * getWeekStart(new Date('2025-12-22')) // Monday of that week
 * ```
 */
export function getWeekStart(date: Date = new Date()): Date {
  return startOfWeek(date, { weekStartsOn: 1 }); // Monday
}

/**
 * Get end of week (Sunday)
 * 
 * @param date - Reference date
 * @returns End of week
 */
export function getWeekEnd(date: Date = new Date()): Date {
  return endOfWeek(date, { weekStartsOn: 1 }); // Sunday
}

/**
 * Get date range for a week
 * 
 * @param date - Reference date
 * @returns Array of [start, end] dates
 * 
 * @example
 * ```ts
 * const [start, end] = getWeekRange(new Date());
 * // [Monday, Sunday] of that week
 * ```
 */
export function getWeekRange(date: Date = new Date()): [Date, Date] {
  return [getWeekStart(date), getWeekEnd(date)];
}

/**
 * Get start of month
 * 
 * @param date - Reference date
 * @returns First day of month
 */
export function getMonthStart(date: Date = new Date()): Date {
  return startOfMonth(date);
}

/**
 * Get end of month
 * 
 * @param date - Reference date
 * @returns Last day of month
 */
export function getMonthEnd(date: Date = new Date()): Date {
  return endOfMonth(date);
}

/**
 * Get all dates in a week
 * 
 * @param date - Reference date
 * @returns Array of 7 dates (Mon-Sun)
 * 
 * @example
 * ```ts
 * getDatesInWeek(new Date('2025-12-22'))
 * // [Dec 16, Dec 17, ..., Dec 22]
 * ```
 */
export function getDatesInWeek(date: Date = new Date()): Date[] {
  const start = getWeekStart(date);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

/**
 * Get all dates in a month
 * 
 * @param year - Year
 * @param month - Month (1-12)
 * @returns Array of dates
 * 
 * @example
 * ```ts
 * getDatesInMonth(2025, 12) // All days in December 2025
 * ```
 */
export function getDatesInMonth(year: number, month: number): Date[] {
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = endOfMonth(firstDay);
  const days = differenceInDays(lastDay, firstDay) + 1;

  return Array.from({ length: days }, (_, i) => addDays(firstDay, i));
}

// ============================================================================
// DATE COMPARISONS
// ============================================================================

/**
 * Check if two dates are the same day
 * 
 * @param date1 - First date
 * @param date2 - Second date
 * @returns True if same day
 */
export function isSameDate(date1: Date, date2: Date): boolean {
  return isSameDay(date1, date2);
}

/**
 * Check if date is today
 * 
 * @param date - Date to check
 * @returns True if today
 */
export function isTodayDate(date: Date): boolean {
  return isToday(date);
}

/**
 * Check if date is tomorrow
 * 
 * @param date - Date to check
 * @returns True if tomorrow
 */
export function isTomorrowDate(date: Date): boolean {
  return isTomorrow(date);
}

/**
 * Check if date is yesterday
 * 
 * @param date - Date to check
 * @returns True if yesterday
 */
export function isYesterdayDate(date: Date): boolean {
  return isYesterday(date);
}

/**
 * Check if date is in the past
 * 
 * @param date - Date to check
 * @returns True if before today
 */
export function isPast(date: Date): boolean {
  return date < getToday();
}

/**
 * Check if date is in the future
 * 
 * @param date - Date to check
 * @returns True if after today
 */
export function isFuture(date: Date): boolean {
  return date > getTomorrow();
}

// ============================================================================
// TIME DIFFERENCES
// ============================================================================

/**
 * Get difference in days between two dates
 * 
 * @param date1 - First date
 * @param date2 - Second date
 * @returns Number of days
 * 
 * @example
 * ```ts
 * getDaysDifference(new Date('2025-12-25'), new Date('2025-12-22'))
 * // 3 days
 * ```
 */
export function getDaysDifference(date1: Date, date2: Date): number {
  return differenceInDays(date1, date2);
}

/**
 * Get difference in hours between two dates
 * 
 * @param date1 - First date
 * @param date2 - Second date
 * @returns Number of hours
 */
export function getHoursDifference(date1: Date, date2: Date): number {
  return differenceInHours(date1, date2);
}

/**
 * Get difference in minutes between two dates
 * 
 * @param date1 - First date
 * @param date2 - Second date
 * @returns Number of minutes
 */
export function getMinutesDifference(date1: Date, date2: Date): number {
  return differenceInMinutes(date1, date2);
}

// ============================================================================
// TIME OF DAY
// ============================================================================

/**
 * Get current hour (0-23)
 * 
 * @returns Current hour
 */
export function getCurrentHour(): number {
  return new Date().getHours();
}

/**
 * Get current minute (0-59)
 * 
 * @returns Current minute
 */
export function getCurrentMinute(): number {
  return new Date().getMinutes();
}

/**
 * Check if current time is within a range
 * 
 * @param startTime - Start time (HH:MM)
 * @param endTime - End time (HH:MM)
 * @returns True if current time is between start and end
 * 
 * @example
 * ```ts
 * isTimeInRange('09:00', '17:00') // True if between 9am-5pm
 * ```
 */
export function isTimeInRange(startTime: string, endTime: string): boolean {
  const now = new Date();
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);

  const start = new Date();
  start.setHours(startHour, startMin, 0, 0);

  const end = new Date();
  end.setHours(endHour, endMin, 0, 0);

  return now >= start && now <= end;
}

// ============================================================================
// RELATIVE TIME FORMATTING
// ============================================================================

/**
 * Get relative time string
 * 
 * @param date - Date to compare
 * @returns Relative string (e.g., "Today", "Tomorrow", "2 days ago")
 * 
 * @example
 * ```ts
 * getRelativeDateString(new Date()) // "Today"
 * getRelativeDateString(getTomorrow()) // "Tomorrow"
 * getRelativeDateString(subDays(new Date(), 2)) // "2 days ago"
 * ```
 */
export function getRelativeDateString(date: Date): string {
  if (isToday(date)) return 'Today';
  if (isTomorrow(date)) return 'Tomorrow';
  if (isYesterday(date)) return 'Yesterday';

  const daysDiff = differenceInDays(date, new Date());

  if (daysDiff > 0 && daysDiff <= 7) {
    return `In ${daysDiff} day${daysDiff === 1 ? '' : 's'}`;
  }

  if (daysDiff < 0 && daysDiff >= -7) {
    return `${Math.abs(daysDiff)} day${Math.abs(daysDiff) === 1 ? '' : 's'} ago`;
  }

  return formatToDisplay(date, 'MMM dd, yyyy');
}

/**
 * Get time until a specific time
 * 
 * @param targetTime - Target time (HH:MM)
 * @returns Human-readable time string (e.g., "2h 15m")
 * 
 * @example
 * ```ts
 * getTimeUntil('14:30') // "2h 15m" (if current time is 12:15)
 * ```
 */
export function getTimeUntil(targetTime: string): string {
  const [hours, minutes] = targetTime.split(':').map(Number);

  const now = new Date();
  const target = new Date();
  target.setHours(hours, minutes, 0, 0);

  // If target is earlier today, it's tomorrow
  if (target < now) {
    target.setDate(target.getDate() + 1);
  }

  const diffMinutes = differenceInMinutes(target, now);

  const h = Math.floor(diffMinutes / 60);
  const m = diffMinutes % 60;

  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validate date string format
 * 
 * @param dateString - Date string to validate
 * @param formatString - Expected format
 * @returns True if valid
 * 
 * @example
 * ```ts
 * isValidDateString('2025-12-22', 'yyyy-MM-dd') // true
 * isValidDateString('22-12-2025', 'yyyy-MM-dd') // false
 * ```
 */
export function isValidDateString(
  dateString: string,
  formatString: string = DATE_FORMATS.ISO
): boolean {
  try {
    const parsed = parse(dateString, formatString, new Date());
    return !isNaN(parsed.getTime());
  } catch {
    return false;
  }
}

/**
 * Validate time string format (HH:MM)
 * 
 * @param timeString - Time string to validate
 * @returns True if valid
 * 
 * @example
 * ```ts
 * isValidTimeString('14:30') // true
 * isValidTimeString('25:00') // false
 * ```
 */
export function isValidTimeString(timeString: string): boolean {
  const timePattern = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timePattern.test(timeString);
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Get current timestamp in milliseconds
 * 
 * @returns Timestamp
 */
export function getCurrentTimestamp(): number {
  return Date.now();
}

/**
 * Get current ISO timestamp
 * 
 * @returns ISO timestamp string
 */
export function getCurrentISOTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Sleep for a duration
 * 
 * @param ms - Milliseconds to sleep
 * @returns Promise that resolves after duration
 * 
 * @example
 * ```ts
 * await sleep(1000); // Wait 1 second
 * ```
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}