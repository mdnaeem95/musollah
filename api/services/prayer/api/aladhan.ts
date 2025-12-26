/**
 * Aladhan API Client
 * 
 * External API calls to Aladhan prayer times service.
 * All responses are validated with Zod schemas.
 * 
 * Features:
 * - Prayer times fetching with Singapore calculation method
 * - Islamic date conversion (Gregorian ↔ Hijri)
 * - Monthly calendar bulk fetching
 * - Comprehensive error handling with custom error types
 * - Response validation via Zod schemas
 * - Performance tracking for all API calls
 * 
 * @version 4.0
 * @since 2025-12-24
 */

import { format } from 'date-fns';
import { PrayerTimesParams, IslamicDateConversion, AladhanResponseSchema, PrayerServiceError, PrayerErrorCode } from '../types/index';
import { ALADHAN_ENDPOINTS, CalculationMethod, School, DATE_FORMATS, ERROR_MESSAGES } from '../types/constants';
import { aladhanClient } from '../../../client/http';
import type { z } from 'zod';
import { logger } from '../../../../services/logging/logger';

type AladhanResponse = z.infer<typeof AladhanResponseSchema>;

// ============================================================================
// PRAYER TIMES
// ============================================================================

/**
 * Fetch prayer times from Aladhan API
 * 
 * Makes HTTP request to Aladhan timings endpoint with location and calculation
 * parameters. Validates response with Zod schema. Logs performance metrics.
 * 
 * @param params - Location and calculation parameters
 * @returns Validated Aladhan API response
 * @throws {PrayerServiceError} On network, API, or validation errors
 * 
 * @example
 * ```ts
 * const response = await fetchPrayerTimesFromAladhan({
 *   latitude: 1.3521,
 *   longitude: 103.8198,
 *   date: '22-12-2025', // Optional
 * });
 * ```
 */
export async function fetchPrayerTimesFromAladhan(
  params: PrayerTimesParams
): Promise<AladhanResponse> {
  const startTime = performance.now();
  
  try {
    const {
      latitude,
      longitude,
      method = CalculationMethod.SINGAPORE,
      school = School.SHAFI,
      date,
    } = params;

    logger.debug('Fetching prayer times from Aladhan API', {
      latitude: latitude.toFixed(4),
      longitude: longitude.toFixed(4),
      method,
      school,
      date: date || 'today',
      endpoint: ALADHAN_ENDPOINTS.TIMINGS,
    });

    // Make API request
    const response = await aladhanClient.get<unknown>(ALADHAN_ENDPOINTS.TIMINGS, {
      params: {
        latitude,
        longitude,
        method,
        school,
        ...(date && { date }), // Optional date parameter
      },
    });

    const requestDuration = performance.now() - startTime;

    logger.debug('Aladhan API response received', {
      statusCode: response.status,
      duration: `${requestDuration.toFixed(0)}ms`,
      hasData: !!response.data,
    });

    // Validate response with Zod
    const validationStart = performance.now();
    const validated = AladhanResponseSchema.parse(response.data);
    const validationDuration = performance.now() - validationStart;

    logger.debug('Aladhan response validated', {
      validationDuration: `${validationDuration.toFixed(0)}ms`,
      responseCode: validated.code,
      responseStatus: validated.status,
    });

    const totalDuration = performance.now() - startTime;

    logger.success('Prayer times fetched from Aladhan', {
      date: validated.data.date.gregorian.date,
      prayers: Object.keys(validated.data.timings).length,
      duration: `${totalDuration.toFixed(0)}ms`,
      method,
      school,
      source: 'Aladhan API',
    });

    return validated;
  } catch (error) {
    const duration = performance.now() - startTime;
    
    logger.error('Failed to fetch prayer times from Aladhan', {
      error: error instanceof Error ? error.message : 'Unknown error',
      duration: `${duration.toFixed(0)}ms`,
      params,
    });

    // Handle Zod validation errors
    if (error && typeof error === 'object' && 'issues' in error) {
      logger.error('Aladhan response validation failed', {
        issues: (error as any).issues,
        duration: `${duration.toFixed(0)}ms`,
      });
      
      throw new PrayerServiceError(
        PrayerErrorCode.VALIDATION_ERROR,
        ERROR_MESSAGES.VALIDATION_ERROR,
        error
      );
    }

    // Handle network errors
    if (error && typeof error === 'object' && 'code' in error) {
      logger.error('Aladhan network error', {
        errorCode: (error as any).code,
        duration: `${duration.toFixed(0)}ms`,
      });
      
      throw new PrayerServiceError(
        PrayerErrorCode.NETWORK_ERROR,
        ERROR_MESSAGES.NETWORK_ERROR,
        error
      );
    }

    // Generic API error
    throw new PrayerServiceError(
      PrayerErrorCode.API_ERROR,
      ERROR_MESSAGES.API_ERROR,
      error
    );
  }
}

/**
 * Fetch today's prayer times
 * 
 * Convenience wrapper around fetchPrayerTimesFromAladhan that automatically
 * uses current date and Singapore calculation method.
 * 
 * @param latitude - User latitude
 * @param longitude - User longitude
 * @returns Validated Aladhan API response
 * 
 * @example
 * ```ts
 * const times = await fetchTodayPrayerTimesFromAladhan(1.3521, 103.8198);
 * ```
 */
export async function fetchTodayPrayerTimesFromAladhan(
  latitude: number,
  longitude: number
): Promise<AladhanResponse> {
  const startTime = performance.now();
  
  logger.debug('Fetching today\'s prayer times', {
    latitude: latitude.toFixed(4),
    longitude: longitude.toFixed(4),
  });

  const response = await fetchPrayerTimesFromAladhan({
    latitude,
    longitude,
    method: CalculationMethod.SINGAPORE,
    school: School.SHAFI,
  });

  const duration = performance.now() - startTime;
  
  logger.debug('Today\'s prayer times fetched', {
    duration: `${duration.toFixed(0)}ms`,
  });

  return response;
}

/**
 * Fetch prayer times for a specific date
 * 
 * Converts JavaScript Date to Aladhan API format (DD-MM-YYYY) and fetches
 * prayer times for that specific date.
 * 
 * @param latitude - User latitude
 * @param longitude - User longitude
 * @param date - JavaScript Date object
 * @returns Validated Aladhan API response
 * 
 * @example
 * ```ts
 * const date = new Date('2025-12-25');
 * const times = await fetchPrayerTimesByDateFromAladhan(1.3521, 103.8198, date);
 * ```
 */
export async function fetchPrayerTimesByDateFromAladhan(
  latitude: number,
  longitude: number,
  date: Date
): Promise<AladhanResponse> {
  const startTime = performance.now();
  const formattedDate = format(date, DATE_FORMATS.API); // DD-MM-YYYY
  
  logger.debug('Fetching prayer times for specific date', {
    latitude: latitude.toFixed(4),
    longitude: longitude.toFixed(4),
    dateISO: format(date, 'yyyy-MM-dd'),
    dateFormatted: formattedDate,
  });

  const response = await fetchPrayerTimesFromAladhan({
    latitude,
    longitude,
    date: formattedDate,
    method: CalculationMethod.SINGAPORE,
    school: School.SHAFI,
  });

  const duration = performance.now() - startTime;
  
  logger.debug('Prayer times for date fetched', {
    date: formattedDate,
    duration: `${duration.toFixed(0)}ms`,
  });

  return response;
}

// ============================================================================
// ISLAMIC DATE CONVERSION
// ============================================================================

/**
 * Islamic date response schema (simplified)
 */
interface IslamicDateResponse {
  code: number;
  status: string;
  data: {
    hijri: {
      date: string;
      day: string;
      month: {
        number: number;
        en: string;
        ar?: string;
      };
      year: string;
      holidays?: string[];
    };
    gregorian: {
      date: string;
      day: string;
      month: {
        number: number;
        en: string;
      };
      year: string;
    };
  };
}

/**
 * Convert Gregorian date to Islamic (Hijri) date
 * 
 * Makes request to Aladhan date conversion endpoint. Returns formatted
 * Islamic date with English month names.
 * 
 * @param date - Gregorian date string (DD-MM-YYYY format)
 * @returns Islamic date conversion
 * @throws {PrayerServiceError} On network or API errors
 * 
 * @example
 * ```ts
 * const islamic = await convertToIslamicDate('22-12-2025');
 * console.log(islamic.hijri.formatted); // "15 Ramadan 1446"
 * ```
 */
export async function convertToIslamicDate(
  date: string
): Promise<IslamicDateConversion> {
  const startTime = performance.now();
  
  try {
    logger.debug('Converting Gregorian to Hijri date', {
      gregorianDate: date,
      endpoint: `${ALADHAN_ENDPOINTS.CONVERT_TO_HIJRI}/${date}`,
    });

    const response = await aladhanClient.get<IslamicDateResponse>(
      `${ALADHAN_ENDPOINTS.CONVERT_TO_HIJRI}/${date}`
    );

    const requestDuration = performance.now() - startTime;

    logger.debug('Hijri conversion response received', {
      statusCode: response.status,
      duration: `${requestDuration.toFixed(0)}ms`,
      responseCode: response.data?.code,
    });

    if (!response.data || response.data.code !== 200) {
      logger.error('Invalid Hijri conversion response', {
        responseCode: response.data?.code,
        responseStatus: response.data?.status,
        duration: `${requestDuration.toFixed(0)}ms`,
      });
      
      throw new Error('Invalid response from Aladhan API');
    }

    const { hijri, gregorian } = response.data.data;

    const conversion: IslamicDateConversion = {
      gregorian: gregorian.date,
      hijri: {
        date: hijri.date,
        day: hijri.day,
        month: hijri.month.en,
        year: hijri.year,
        formatted: `${hijri.day} ${hijri.month.en} ${hijri.year}`,
      },
    };

    const totalDuration = performance.now() - startTime;

    logger.success('Hijri date conversion successful', {
      gregorian: conversion.gregorian,
      hijri: conversion.hijri.formatted,
      hijriMonth: hijri.month.en,
      hijriYear: hijri.year,
      duration: `${totalDuration.toFixed(0)}ms`,
      hasHolidays: !!hijri.holidays?.length,
    });

    return conversion;
  } catch (error) {
    const duration = performance.now() - startTime;
    
    logger.error('Failed to convert Hijri date', {
      error: error instanceof Error ? error.message : 'Unknown error',
      gregorianDate: date,
      duration: `${duration.toFixed(0)}ms`,
    });

    // Handle network errors
    if (error && typeof error === 'object' && 'code' in error) {
      logger.error('Hijri conversion network error', {
        errorCode: (error as any).code,
        duration: `${duration.toFixed(0)}ms`,
      });
      
      throw new PrayerServiceError(
        PrayerErrorCode.NETWORK_ERROR,
        ERROR_MESSAGES.NETWORK_ERROR,
        error
      );
    }

    // Generic API error
    throw new PrayerServiceError(
      PrayerErrorCode.API_ERROR,
      ERROR_MESSAGES.API_ERROR,
      error
    );
  }
}

/**
 * Get today's Islamic date
 * 
 * Convenience wrapper around convertToIslamicDate that automatically
 * uses current date.
 * 
 * @returns Today's Islamic date
 * 
 * @example
 * ```ts
 * const today = await getTodayIslamicDate();
 * console.log(today.hijri.formatted); // "15 Ramadan 1446"
 * ```
 */
export async function getTodayIslamicDate(): Promise<IslamicDateConversion> {
  const startTime = performance.now();
  const today = format(new Date(), DATE_FORMATS.API);
  
  logger.debug('Fetching today\'s Hijri date', {
    gregorianDate: today,
  });

  const conversion = await convertToIslamicDate(today);

  const duration = performance.now() - startTime;
  
  logger.debug('Today\'s Hijri date fetched', {
    duration: `${duration.toFixed(0)}ms`,
  });

  return conversion;
}

// ============================================================================
// CALENDAR (Bulk Fetching)
// ============================================================================

/**
 * Fetch prayer times for an entire month
 * 
 * More efficient than fetching day-by-day. Returns array of daily prayer
 * times for all days in the specified month. Validates each day's response.
 * 
 * @param year - Year (e.g., 2025)
 * @param month - Month (1-12)
 * @param latitude - User latitude
 * @param longitude - User longitude
 * @returns Array of daily prayer times
 * 
 * @example
 * ```ts
 * const calendar = await fetchMonthlyCalendar(2025, 12, 1.3521, 103.8198);
 * console.log(calendar.length); // 31 (days in December)
 * ```
 */
export async function fetchMonthlyCalendar(
  year: number,
  month: number,
  latitude: number,
  longitude: number
): Promise<AladhanResponse[]> {
  const startTime = performance.now();
  
  try {
    logger.debug('Fetching monthly calendar from Aladhan', {
      year,
      month,
      latitude: latitude.toFixed(4),
      longitude: longitude.toFixed(4),
      endpoint: ALADHAN_ENDPOINTS.CALENDAR,
    });

    const response = await aladhanClient.get<{ data: unknown[] }>(
      ALADHAN_ENDPOINTS.CALENDAR,
      {
        params: {
          latitude,
          longitude,
          method: CalculationMethod.SINGAPORE,
          school: School.SHAFI,
          month,
          year,
        },
      }
    );

    const requestDuration = performance.now() - startTime;

    logger.debug('Monthly calendar response received', {
      statusCode: response.status,
      duration: `${requestDuration.toFixed(0)}ms`,
      hasData: !!response.data,
      isArray: Array.isArray(response.data?.data),
    });

    if (!response.data || !Array.isArray(response.data.data)) {
      logger.error('Invalid monthly calendar response', {
        hasData: !!response.data,
        dataType: typeof response.data,
        duration: `${requestDuration.toFixed(0)}ms`,
      });
      
      throw new Error('Invalid calendar response');
    }

    logger.debug('Validating monthly calendar data', {
      days: response.data.data.length,
    });

    // Validate each day's prayer times
    const validationStart = performance.now();
    const validated = response.data.data.map((day, index) => {
      try {
        return AladhanResponseSchema.parse({ code: 200, status: 'OK', data: day });
      } catch (validationError) {
        logger.warn('Calendar day validation failed', {
          dayIndex: index,
          error: validationError instanceof Error ? validationError.message : 'Unknown error',
        });
        throw validationError;
      }
    });
    const validationDuration = performance.now() - validationStart;

    logger.debug('Monthly calendar validated', {
      days: validated.length,
      validationDuration: `${validationDuration.toFixed(0)}ms`,
    });

    const totalDuration = performance.now() - startTime;

    logger.success('Monthly calendar fetched', {
      year,
      month,
      days: validated.length,
      duration: `${totalDuration.toFixed(0)}ms`,
      method: CalculationMethod.SINGAPORE,
      source: 'Aladhan API',
    });

    return validated;
  } catch (error) {
    const duration = performance.now() - startTime;
    
    logger.error('Failed to fetch monthly calendar', {
      error: error instanceof Error ? error.message : 'Unknown error',
      year,
      month,
      duration: `${duration.toFixed(0)}ms`,
    });

    throw new PrayerServiceError(
      PrayerErrorCode.API_ERROR,
      ERROR_MESSAGES.API_ERROR,
      error
    );
  }
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Check if Aladhan API is reachable
 * 
 * Makes lightweight request to API status endpoint to verify connectivity.
 * Useful for offline detection and error handling.
 * 
 * @returns True if API is reachable
 * 
 * @example
 * ```ts
 * const isOnline = await checkAladhanApiStatus();
 * if (!isOnline) {
 *   console.log('Aladhan API is unreachable');
 * }
 * ```
 */
export async function checkAladhanApiStatus(): Promise<boolean> {
  const startTime = performance.now();
  
  try {
    logger.debug('Checking Aladhan API status', {
      timeout: '3000ms',
    });

    const response = await aladhanClient.get('/status', {
      timeout: 3000, // 3 second timeout
    });
    
    const duration = performance.now() - startTime;
    const isReachable = response.status === 200;

    logger.debug('Aladhan API status check complete', {
      isReachable,
      statusCode: response.status,
      duration: `${duration.toFixed(0)}ms`,
    });

    return isReachable;
  } catch (error) {
    const duration = performance.now() - startTime;
    
    logger.warn('Aladhan API unreachable', {
      error: error instanceof Error ? error.message : 'Unknown error',
      duration: `${duration.toFixed(0)}ms`,
    });
    
    return false;
  }
}

/**
 * Get API quota/rate limit info (if available)
 * 
 * Note: Aladhan API doesn't currently expose rate limits,
 * but this is a placeholder for future implementation.
 * 
 * @returns Quota info or null if not available
 * 
 * @example
 * ```ts
 * const quota = await getApiQuota();
 * if (quota) {
 *   console.log(`${quota.remaining} requests remaining`);
 * }
 * ```
 */
export async function getApiQuota(): Promise<{
  remaining: number;
  reset: Date;
} | null> {
  logger.debug('API quota not implemented', {
    reason: 'Aladhan API does not expose rate limit headers',
  });
  
  // TODO: Implement when Aladhan adds rate limit headers
  return null;
}