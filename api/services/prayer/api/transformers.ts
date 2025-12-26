/**
 * Data Transformers
 * 
 * Functions to transform prayer time data between different formats:
 * - Aladhan API format → Normalized format
 * - Firebase format → Normalized format
 * - Normalized format → Display format
 * 
 * Features:
 * - Format conversions between multiple date systems
 * - Prayer name translations (English ↔ Local)
 * - Time string cleaning and validation
 * - Data sanitization and validation
 * - Multi-source data merging with priority logic
 * 
 * Performance:
 * - All functions are synchronous and lightweight
 * - Logging is minimal to avoid overhead
 * - Validation failures are logged for debugging
 * 
 * @version 4.0
 * @since 2025-12-24
 */

import { format } from 'date-fns';
import { AladhanResponse, DailyPrayerTime, NormalizedPrayerTimes, PRAYER_NAME_MAP, LocalPrayerName } from '../types/index';
import { DATE_FORMATS } from '../types/constants';
import { logger } from '../../../../services/logging/logger';

// ============================================================================
// ALADHAN API → NORMALIZED
// ============================================================================

/**
 * Transform Aladhan API response to normalized format
 * 
 * Converts English prayer names (Fajr, Dhuhr) to local names (Subuh, Zohor)
 * and formats date to ISO standard (YYYY-MM-DD). Cleans time strings by
 * removing timezone information.
 * 
 * @param response - Validated Aladhan API response
 * @returns Normalized prayer times
 * 
 * @example
 * ```ts
 * const aladhanData = await fetchPrayerTimes();
 * const normalized = normalizeAladhanResponse(aladhanData);
 * console.log(normalized.subuh); // "05:30"
 * ```
 */
export function normalizeAladhanResponse(
  response: AladhanResponse
): NormalizedPrayerTimes {
  const { timings, date } = response.data;

  logger.debug('Normalizing Aladhan response', {
    gregorianDate: date.gregorian.date,
    prayers: Object.keys(timings).length,
    source: 'Aladhan API',
  });

  const normalized = {
    date: format(new Date(date.gregorian.date), DATE_FORMATS.ISO), // YYYY-MM-DD
    subuh: cleanTimeString(timings.Fajr),
    syuruk: cleanTimeString(timings.Sunrise),
    zohor: cleanTimeString(timings.Dhuhr),
    asar: cleanTimeString(timings.Asr),
    maghrib: cleanTimeString(timings.Maghrib),
    isyak: cleanTimeString(timings.Isha),
  };

  logger.debug('Aladhan response normalized', {
    date: normalized.date,
    prayers: 6,
    sample: `${normalized.subuh} - ${normalized.isyak}`,
  });

  return normalized;
}

/**
 * Extract prayer timings from Aladhan response
 * 
 * Returns only the timings object, useful for direct mapping.
 * 
 * @param response - Aladhan API response
 * @returns Prayer timings with English names
 * 
 * @example
 * ```ts
 * const timings = extractAladhanTimings(response);
 * console.log(timings.Fajr); // "05:30 (SGT)"
 * ```
 */
export function extractAladhanTimings(response: AladhanResponse) {
  return response.data.timings;
}

// ============================================================================
// FIREBASE → NORMALIZED
// ============================================================================

/**
 * Transform Firebase prayer time to normalized format
 * 
 * Firebase already uses local names (subuh, zohor), just needs date formatting
 * conversion from Firebase format (D/M/YYYY) to ISO format (YYYY-MM-DD).
 * 
 * @param firebaseTime - Firebase daily prayer time
 * @returns Normalized prayer times
 * 
 * @example
 * ```ts
 * const firebaseData = await fetchDailyPrayerTime();
 * const normalized = normalizeFirebaseTime(firebaseData);
 * ```
 */
export function normalizeFirebaseTime(
  firebaseTime: DailyPrayerTime
): NormalizedPrayerTimes {
  logger.debug('Normalizing Firebase time', {
    firebaseDate: firebaseTime.date,
    source: 'Firebase',
  });

  const normalized = {
    date: convertFirebaseDateToISO(firebaseTime.date),
    subuh: cleanTimeString(firebaseTime.subuh),
    syuruk: cleanTimeString(firebaseTime.syuruk),
    zohor: cleanTimeString(firebaseTime.zohor),
    asar: cleanTimeString(firebaseTime.asar),
    maghrib: cleanTimeString(firebaseTime.maghrib),
    isyak: cleanTimeString(firebaseTime.isyak),
  };

  logger.debug('Firebase time normalized', {
    dateISO: normalized.date,
    prayers: 6,
  });

  return normalized;
}

/**
 * Transform multiple Firebase prayer times
 * 
 * Batch transformation for monthly data. Processes array of Firebase prayer
 * times and returns normalized array.
 * 
 * @param firebaseTimes - Array of Firebase prayer times
 * @returns Array of normalized prayer times
 * 
 * @example
 * ```ts
 * const monthlyData = await fetchMonthlyPrayerTimes(2025, 12);
 * const normalized = normalizeFirebaseTimesBatch(monthlyData);
 * ```
 */
export function normalizeFirebaseTimesBatch(
  firebaseTimes: DailyPrayerTime[]
): NormalizedPrayerTimes[] {
  logger.debug('Normalizing Firebase times batch', {
    count: firebaseTimes.length,
    source: 'Firebase',
  });

  const normalized = firebaseTimes.map(normalizeFirebaseTime);

  logger.debug('Firebase batch normalized', {
    count: normalized.length,
  });

  return normalized;
}

// ============================================================================
// DATE CONVERSIONS
// ============================================================================

/**
 * Convert Firebase date format to ISO format
 * 
 * Firebase: "22/12/2025" (D/M/YYYY)
 * ISO: "2025-12-22" (YYYY-MM-DD)
 * 
 * @param firebaseDate - Firebase date string
 * @returns ISO format date
 * 
 * @example
 * ```ts
 * const iso = convertFirebaseDateToISO('22/12/2025');
 * console.log(iso); // "2025-12-22"
 * ```
 */
export function convertFirebaseDateToISO(firebaseDate: string): string {
  const [day, month, year] = firebaseDate.split('/');
  const iso = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;

  logger.debug('Date converted: Firebase → ISO', {
    from: firebaseDate,
    to: iso,
  });

  return iso;
}

/**
 * Convert ISO date to Firebase format
 * 
 * ISO: "2025-12-22" (YYYY-MM-DD)
 * Firebase: "22/12/2025" (D/M/YYYY)
 * 
 * @param isoDate - ISO format date
 * @returns Firebase date string
 * 
 * @example
 * ```ts
 * const firebase = convertISOToFirebaseDate('2025-12-22');
 * console.log(firebase); // "22/12/2025"
 * ```
 */
export function convertISOToFirebaseDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-');
  const firebase = `${parseInt(day, 10)}/${parseInt(month, 10)}/${year}`;

  logger.debug('Date converted: ISO → Firebase', {
    from: isoDate,
    to: firebase,
  });

  return firebase;
}

/**
 * Convert ISO date to Aladhan API format
 * 
 * ISO: "2025-12-22"
 * Aladhan: "22-12-2025" (DD-MM-YYYY)
 * 
 * @param isoDate - ISO format date
 * @returns Aladhan format date
 * 
 * @example
 * ```ts
 * const aladhan = convertISOToAladhanDate('2025-12-22');
 * console.log(aladhan); // "22-12-2025"
 * ```
 */
export function convertISOToAladhanDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-');
  const aladhan = `${day}-${month}-${year}`;

  logger.debug('Date converted: ISO → Aladhan', {
    from: isoDate,
    to: aladhan,
  });

  return aladhan;
}

// ============================================================================
// TIME STRING UTILITIES
// ============================================================================

/**
 * Clean time string by removing timezone info and extra spaces
 * 
 * Standardizes time format to HH:MM. Removes timezone markers like "(SGT)",
 * trims seconds, and pads hours to 2 digits.
 * 
 * Examples:
 * - "05:30 (SGT)" → "05:30"
 * - "13:15:00" → "13:15"
 * - "  7:45  " → "07:45"
 * 
 * @param time - Time string
 * @returns Cleaned time in HH:MM format
 * 
 * @example
 * ```ts
 * cleanTimeString('05:30 (SGT)'); // "05:30"
 * cleanTimeString('7:45');        // "07:45"
 * ```
 */
export function cleanTimeString(time: string | undefined | null): string {
  if (!time) {
    logger.debug('Empty time string, returning default', {
      input: time,
      output: '00:00',
    });
    return '00:00';
  }

  // Remove timezone info like "(SGT)"
  let cleaned = time.replace(/\s*\([A-Z]+\)\s*$/, '').trim();

  // Remove seconds if present (HH:MM:SS → HH:MM)
  const parts = cleaned.split(':');
  if (parts.length === 3) {
    cleaned = `${parts[0]}:${parts[1]}`;
  }

  // Pad hours if single digit (7:45 → 07:45)
  const [hours, minutes] = cleaned.split(':');
  if (hours && minutes) {
    return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
  }

  logger.warn('Invalid time string format', {
    input: time,
    cleaned,
    output: cleaned || '00:00',
  });

  return cleaned || '00:00';
}

/**
 * Parse time string to Date object
 * 
 * Creates a Date object with today's date and the specified time.
 * Useful for time comparisons and calculations.
 * 
 * @param time - Time string (HH:MM)
 * @returns Date object or null if invalid
 * 
 * @example
 * ```ts
 * const date = parseTimeToDate('13:30');
 * console.log(date.getHours()); // 13
 * ```
 */
export function parseTimeToDate(time: string | null | undefined): Date | null {
  if (!time) return null;

  const cleaned = cleanTimeString(time);
  const [hours, minutes] = cleaned.split(':').map(Number);

  if (isNaN(hours) || isNaN(minutes)) {
    logger.warn('Failed to parse time to date', {
      input: time,
      cleaned,
      hours,
      minutes,
    });
    return null;
  }

  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
}

/**
 * Format time for display
 * 
 * Converts between 24-hour and 12-hour format based on user preference.
 * 
 * @param time - Time string (HH:MM)
 * @param use24Hour - Use 24-hour format (default: false)
 * @returns Formatted time
 * 
 * @example
 * ```ts
 * formatTimeForDisplay("13:30", false) // "1:30 PM"
 * formatTimeForDisplay("13:30", true)  // "13:30"
 * ```
 */
export function formatTimeForDisplay(
  time: string,
  use24Hour: boolean = false
): string {
  if (use24Hour) {
    return cleanTimeString(time);
  }

  const [hours, minutes] = cleanTimeString(time).split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;

  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

// ============================================================================
// PRAYER NAME CONVERSIONS
// ============================================================================

/**
 * Convert English prayer name to local name
 * 
 * @param englishName - Prayer name from Aladhan API
 * @returns Local prayer name
 * 
 * @example
 * ```ts
 * convertPrayerName('Fajr') // "Subuh"
 * convertPrayerName('Dhuhr') // "Zohor"
 * ```
 */
export function convertPrayerName(
  englishName: keyof typeof PRAYER_NAME_MAP
): LocalPrayerName {
  return PRAYER_NAME_MAP[englishName];
}

/**
 * Convert local prayer name to English
 * 
 * Reverse of convertPrayerName. Useful for API requests.
 * 
 * @param localName - Local prayer name
 * @returns English prayer name or undefined
 * 
 * @example
 * ```ts
 * convertPrayerNameToEnglish('Subuh') // "Fajr"
 * ```
 */
export function convertPrayerNameToEnglish(
  localName: LocalPrayerName
): keyof typeof PRAYER_NAME_MAP | undefined {
  const entries = Object.entries(PRAYER_NAME_MAP) as [
    keyof typeof PRAYER_NAME_MAP,
    LocalPrayerName
  ][];

  const found = entries.find(([, value]) => value === localName);
  return found?.[0];
}

// ============================================================================
// ISLAMIC DATE FORMATTING
// ============================================================================

/**
 * Format Islamic date for display
 * 
 * Combines Hijri date components into readable string format.
 * 
 * @param hijriDate - Hijri date object
 * @returns Formatted string
 * 
 * @example
 * ```ts
 * formatIslamicDate({ day: "15", month: "Ramadan", year: "1446" })
 * // "15 Ramadan 1446"
 * ```
 */
export function formatIslamicDate(hijriDate: {
  day: string;
  month: string;
  year: string;
}): string {
  return `${hijriDate.day} ${hijriDate.month} ${hijriDate.year}`;
}

// ============================================================================
// BATCH OPERATIONS
// ============================================================================

/**
 * Merge prayer times from multiple sources
 * 
 * Prioritizes Firebase over Aladhan (more accurate for Singapore). Uses
 * first available source and logs decision for debugging.
 * 
 * @param firebaseTime - Firebase prayer times (priority)
 * @param aladhanResponse - Aladhan fallback
 * @returns Merged normalized prayer times
 * 
 * @example
 * ```ts
 * const times = mergePrayerTimes(firebaseData, aladhanData);
 * // Uses Firebase if available, falls back to Aladhan
 * ```
 */
export function mergePrayerTimes(
  firebaseTime: DailyPrayerTime | null,
  aladhanResponse: AladhanResponse | null
): NormalizedPrayerTimes | null {
  if (firebaseTime) {
    logger.debug('Using Firebase prayer times', {
      source: 'Firebase',
      priority: 'primary',
      date: firebaseTime.date,
    });
    return normalizeFirebaseTime(firebaseTime);
  }

  if (aladhanResponse) {
    logger.debug('Using Aladhan prayer times', {
      source: 'Aladhan API',
      priority: 'fallback',
      reason: 'Firebase data not available',
    });
    return normalizeAladhanResponse(aladhanResponse);
  }

  logger.warn('No prayer time data available from any source', {
    firebase: !!firebaseTime,
    aladhan: !!aladhanResponse,
  });
  
  return null;
}

/**
 * Create empty prayer times object
 * 
 * Useful for placeholder/default states when no data is available.
 * 
 * @param date - Date string (YYYY-MM-DD)
 * @returns Empty normalized prayer times
 * 
 * @example
 * ```ts
 * const placeholder = createEmptyPrayerTimes('2025-12-22');
 * console.log(placeholder.subuh); // "--:--"
 * ```
 */
export function createEmptyPrayerTimes(date: string): NormalizedPrayerTimes {
  logger.debug('Creating empty prayer times', {
    date,
    reason: 'placeholder/fallback',
  });

  return {
    date,
    subuh: '--:--',
    syuruk: '--:--',
    zohor: '--:--',
    asar: '--:--',
    maghrib: '--:--',
    isyak: '--:--',
  };
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Check if prayer times are valid
 * 
 * Validates that all times are in correct format (HH:MM) and in logical
 * chronological order. Logs validation failures for debugging.
 * 
 * @param times - Normalized prayer times
 * @returns True if valid
 * 
 * @example
 * ```ts
 * const isValid = validatePrayerTimes(times);
 * if (!isValid) {
 *   console.log('Prayer times failed validation');
 * }
 * ```
 */
export function validatePrayerTimes(times: NormalizedPrayerTimes): boolean {
  const timePattern = /^\d{2}:\d{2}$/;

  // Check format
  const allValidFormat =
    timePattern.test(times.subuh) &&
    timePattern.test(times.syuruk) &&
    timePattern.test(times.zohor) &&
    timePattern.test(times.asar) &&
    timePattern.test(times.maghrib) &&
    timePattern.test(times.isyak);

  if (!allValidFormat) {
    logger.warn('Invalid prayer time format', {
      date: times.date,
      formats: {
        subuh: times.subuh,
        syuruk: times.syuruk,
        zohor: times.zohor,
        asar: times.asar,
        maghrib: times.maghrib,
        isyak: times.isyak,
      },
      validPattern: 'HH:MM',
    });
    return false;
  }

  // Check chronological order
  const subuhDate = parseTimeToDate(times.subuh);
  const syurukDate = parseTimeToDate(times.syuruk);
  const zohorDate = parseTimeToDate(times.zohor);
  const asarDate = parseTimeToDate(times.asar);
  const maghribDate = parseTimeToDate(times.maghrib);
  const isakDate = parseTimeToDate(times.isyak);

  if (
    !subuhDate ||
    !syurukDate ||
    !zohorDate ||
    !asarDate ||
    !maghribDate ||
    !isakDate
  ) {
    logger.warn('Failed to parse prayer times for validation', {
      date: times.date,
    });
    return false;
  }

  const isChronological =
    subuhDate < syurukDate &&
    syurukDate < zohorDate &&
    zohorDate < asarDate &&
    asarDate < maghribDate &&
    maghribDate < isakDate;

  if (!isChronological) {
    logger.warn('Prayer times not in chronological order', {
      date: times.date,
      times: {
        subuh: times.subuh,
        syuruk: times.syuruk,
        zohor: times.zohor,
        asar: times.asar,
        maghrib: times.maghrib,
        isyak: times.isyak,
      },
    });
    return false;
  }

  logger.debug('Prayer times validated successfully', {
    date: times.date,
    hasValidFormat: true,
    isChronological: true,
  });

  return true;
}

/**
 * Sanitize prayer times
 * 
 * Cleans and validates prayer times, replacing invalid values with placeholders.
 * Ensures all required fields are present with valid formatting.
 * 
 * @param times - Raw prayer times (partial)
 * @returns Sanitized prayer times (complete)
 * 
 * @example
 * ```ts
 * const sanitized = sanitizePrayerTimes(rawData);
 * // Ensures all fields are valid, replaces missing with defaults
 * ```
 */
export function sanitizePrayerTimes(
  times: Partial<NormalizedPrayerTimes>
): NormalizedPrayerTimes {
  const hadMissingFields = !times.date || !times.subuh || !times.syuruk || 
                          !times.zohor || !times.asar || !times.maghrib || 
                          !times.isyak;

  if (hadMissingFields) {
    logger.debug('Sanitizing prayer times with missing fields', {
      providedFields: Object.keys(times).length,
      requiredFields: 7,
      missingFields: ['date', 'subuh', 'syuruk', 'zohor', 'asar', 'maghrib', 'isyak']
        .filter(field => !times[field as keyof typeof times]),
    });
  }

  const sanitized = {
    date: times.date || format(new Date(), DATE_FORMATS.ISO),
    subuh: cleanTimeString(times.subuh),
    syuruk: cleanTimeString(times.syuruk),
    zohor: cleanTimeString(times.zohor),
    asar: cleanTimeString(times.asar),
    maghrib: cleanTimeString(times.maghrib),
    isyak: cleanTimeString(times.isyak),
  };

  if (hadMissingFields) {
    logger.debug('Prayer times sanitized', {
      date: sanitized.date,
      allFieldsPresent: true,
    });
  }

  return sanitized;
}