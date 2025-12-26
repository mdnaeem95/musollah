/**
 * Gold Price API Service - Structured Logging Version
 * 
 * Fetches current gold prices from Metal Price API with multi-layer caching
 * and daily Firestore snapshots. Used for Zakat nisab calculations.
 * 
 * Cache Strategy:
 * - Layer 1: MMKV (instant, 1 day TTL)
 * - Layer 2: Firestore (shared, daily snapshot)
 * - Layer 3: Metal Price API (fallback)
 * 
 * @version 2.0 - Structured logging migration
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { metalPriceClient, handleApiError } from '../../client/http';
import { db } from '../../client/firebase';
import { cache, TTL } from '../../client/storage';
import { logger } from '../../../services/logging/logger';

import { doc, getDoc, setDoc } from '@react-native-firebase/firestore';

// ============================================================================
// TYPES
// ============================================================================

export interface GoldPriceData {
  pricePerGram: number;
  timestamp: string; // ISO string
}

interface MetalPriceAPIResponse {
  success: boolean;
  timestamp: number;
  base: string;
  rates: {
    SGD: number;
  };
}

// ============================================================================
// CONSTANTS
// ============================================================================

const API_KEY = 'ac71d0fa4cfd6f4733484d2a30af6184'; // TODO: move to env
const OUNCES_TO_GRAMS = 31.1035;
const COLLECTION = 'goldPrice';

// ============================================================================
// API FUNCTIONS
// ============================================================================

/**
 * Fetches current gold price from Metal Price API
 * 
 * @async
 * @function fetchGoldPriceFromAPI
 * @returns {Promise<GoldPriceData>} Gold price in SGD per gram with timestamp
 * @throws {Error} If API request fails
 * 
 * Process:
 * 1. Fetches XAU/SGD rate (per troy ounce)
 * 2. Converts to SGD per gram
 * 3. Rounds to 2 decimal places
 * 
 * @example
 * const price = await fetchGoldPriceFromAPI();
 * console.log(`$${price.pricePerGram}/gram`);
 */
async function fetchGoldPriceFromAPI(): Promise<GoldPriceData> {
  const startTime = performance.now();
  
  try {
    logger.debug('Fetching gold price from Metal Price API', {
      base: 'XAU',
      currency: 'SGD',
    });

    const response = await metalPriceClient.get<MetalPriceAPIResponse>('/latest', {
      params: {
        api_key: API_KEY,
        base: 'XAU',
        currencies: 'SGD',
      },
    });

    const pricePerOunce = response.data.rates.SGD;
    const pricePerGram = Number((pricePerOunce / OUNCES_TO_GRAMS).toFixed(2));
    const timestamp = new Date().toISOString();
    const duration = Math.round(performance.now() - startTime);

    logger.success('Gold price fetched from API', {
      pricePerGram,
      pricePerOunce,
      conversionRate: OUNCES_TO_GRAMS,
      timestamp,
      duration: `${duration}ms`,
      source: 'Metal Price API',
    });

    return { pricePerGram, timestamp };
  } catch (error: any) {
    const duration = Math.round(performance.now() - startTime);
    
    logger.error('Failed to fetch gold price from API', {
      error: error.message,
      duration: `${duration}ms`,
      base: 'XAU',
      currency: 'SGD',
    });
    
    handleApiError(error, 'fetchGoldPriceFromAPI');
    throw error;
  }
}

/**
 * Retrieves gold price from Firestore daily snapshot
 * 
 * @async
 * @function getGoldPriceFromFirestore
 * @param {string} todayDate - Date in yyyy-MM-dd format
 * @returns {Promise<GoldPriceData | null>} Price data or null if not found
 * 
 * @example
 * const price = await getGoldPriceFromFirestore('2025-12-24');
 */
async function getGoldPriceFromFirestore(todayDate: string): Promise<GoldPriceData | null> {
  const startTime = performance.now();
  
  try {
    logger.debug('Fetching gold price from Firestore', {
      date: todayDate,
      collection: COLLECTION,
    });

    const ref = doc(db, COLLECTION, todayDate);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      const duration = Math.round(performance.now() - startTime);
      logger.debug('Gold price not found in Firestore', {
        date: todayDate,
        duration: `${duration}ms`,
      });
      return null;
    }

    const data = snap.data() as any;
    const duration = Math.round(performance.now() - startTime);

    // Validate data shape
    if (typeof data?.pricePerGram !== 'number' || typeof data?.timestamp !== 'string') {
      logger.warn('Invalid gold price document shape - ignoring', {
        date: todayDate,
        data,
        expectedShape: {
          pricePerGram: 'number',
          timestamp: 'string (ISO)',
        },
        duration: `${duration}ms`,
      });
      return null;
    }

    const priceData = {
      pricePerGram: data.pricePerGram,
      timestamp: data.timestamp,
    };

    logger.success('Gold price fetched from Firestore', {
      date: todayDate,
      pricePerGram: priceData.pricePerGram,
      timestamp: priceData.timestamp,
      duration: `${duration}ms`,
      source: 'Firestore',
    });

    return priceData;
  } catch (error: any) {
    const duration = Math.round(performance.now() - startTime);
    
    logger.error('Failed to fetch gold price from Firestore', {
      error: error.message,
      date: todayDate,
      collection: COLLECTION,
      duration: `${duration}ms`,
    });
    
    return null;
  }
}

/**
 * Stores gold price in Firestore daily snapshot
 * 
 * @async
 * @function storeGoldPriceInFirestore
 * @param {string} todayDate - Date in yyyy-MM-dd format
 * @param {GoldPriceData} data - Price data to store
 * @returns {Promise<void>}
 * 
 * Note: Does not throw on error - Firestore storage is optional
 * 
 * @example
 * await storeGoldPriceInFirestore('2025-12-24', { pricePerGram: 85.50, timestamp: '...' });
 */
async function storeGoldPriceInFirestore(todayDate: string, data: GoldPriceData): Promise<void> {
  const startTime = performance.now();
  
  try {
    logger.debug('Storing gold price in Firestore', {
      date: todayDate,
      pricePerGram: data.pricePerGram,
      collection: COLLECTION,
    });

    const ref = doc(db, COLLECTION, todayDate);
    await setDoc(ref, data);
    
    const duration = Math.round(performance.now() - startTime);

    logger.success('Gold price stored in Firestore', {
      date: todayDate,
      pricePerGram: data.pricePerGram,
      timestamp: data.timestamp,
      duration: `${duration}ms`,
    });
  } catch (error: any) {
    const duration = Math.round(performance.now() - startTime);
    
    logger.error('Failed to store gold price in Firestore', {
      error: error.message,
      date: todayDate,
      collection: COLLECTION,
      duration: `${duration}ms`,
    });
    
    // Don't throw - Firestore storage is optional
  }
}

/**
 * Gets today's gold price with multi-layer caching
 * 
 * @async
 * @function getTodayGoldPrice
 * @returns {Promise<GoldPriceData>} Gold price in SGD per gram
 * @throws {Error} If all layers fail
 * 
 * Strategy:
 * 1. Check MMKV cache (instant)
 * 2. Check Firestore daily snapshot (fast)
 * 3. Fetch from Metal Price API (slow)
 * 4. Cache and store for future use
 * 
 * @example
 * const { pricePerGram } = await getTodayGoldPrice();
 * const nisab = pricePerGram * 85; // 85 grams
 */
async function getTodayGoldPrice(): Promise<GoldPriceData> {
  const startTime = performance.now();
  const todayDate = format(new Date(), 'yyyy-MM-dd');
  const cacheKey = `gold-price-${todayDate}`;

  logger.debug('Getting today\'s gold price', {
    date: todayDate,
    cacheKey,
  });

  // Layer 1: MMKV Cache
  const cachedPrice = cache.get<GoldPriceData>(cacheKey);
  if (cachedPrice) {
    const duration = Math.round(performance.now() - startTime);
    logger.debug('Using cached gold price from MMKV', {
      pricePerGram: cachedPrice.pricePerGram,
      cacheKey,
      source: 'MMKV',
      duration: `${duration}ms`,
    });
    return cachedPrice;
  }

  logger.debug('MMKV cache miss - checking Firestore', { cacheKey });

  // Layer 2: Firestore
  const firestorePrice = await getGoldPriceFromFirestore(todayDate);
  if (firestorePrice) {
    logger.debug('Caching Firestore price to MMKV', {
      pricePerGram: firestorePrice.pricePerGram,
      cacheKey,
      ttl: '1 day',
    });
    cache.set(cacheKey, firestorePrice, TTL.ONE_DAY);
    
    const duration = Math.round(performance.now() - startTime);
    logger.success('Gold price retrieved from Firestore cache', {
      pricePerGram: firestorePrice.pricePerGram,
      duration: `${duration}ms`,
    });
    
    return firestorePrice;
  }

  logger.debug('Firestore cache miss - fetching from API', { date: todayDate });

  // Layer 3: API
  const apiPrice = await fetchGoldPriceFromAPI();
  const duration = Math.round(performance.now() - startTime);

  logger.debug('Caching API price', {
    pricePerGram: apiPrice.pricePerGram,
    cacheKey,
    ttl: '1 day',
  });

  // Cache in MMKV
  cache.set(cacheKey, apiPrice, TTL.ONE_DAY);
  
  // Store in Firestore for future use
  await storeGoldPriceInFirestore(todayDate, apiPrice);

  logger.success('Gold price fetched and cached', {
    pricePerGram: apiPrice.pricePerGram,
    timestamp: apiPrice.timestamp,
    duration: `${duration}ms`,
    source: 'Metal Price API',
    cached: true,
  });

  return apiPrice;
}

// ============================================================================
// TANSTACK QUERY HOOKS
// ============================================================================

const GOLD_QUERY_KEYS = {
  all: ['gold'] as const,
  price: ['gold', 'price'] as const,
  todayPrice: ['gold', 'price', 'today'] as const,
};

/**
 * Hook to fetch today's gold price
 * 
 * @function useGoldPrice
 * @returns {UseQueryResult<GoldPriceData>} Query result with gold price
 * 
 * Cache:
 * - Stale time: 1 hour (price doesn't change often)
 * - GC time: 1 day (keep in memory)
 * - Refetch: On window focus and mount
 * 
 * @example
 * const { data: goldPrice, isLoading } = useGoldPrice();
 * const nisab = goldPrice ? goldPrice.pricePerGram * 85 : 0;
 */
export function useGoldPrice() {
  return useQuery({
    queryKey: GOLD_QUERY_KEYS.todayPrice,
    queryFn: getTodayGoldPrice,
    staleTime: TTL.ONE_HOUR,
    gcTime: TTL.ONE_DAY,
    retry: 2,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });
}

/**
 * Hook to prefetch gold price
 * 
 * @function usePrefetchGoldPrice
 * @returns {Function} Prefetch function
 * 
 * @example
 * const prefetch = usePrefetchGoldPrice();
 * await prefetch(); // Loads price into cache
 */
export function usePrefetchGoldPrice() {
  const queryClient = useQueryClient();
  const startTime = performance.now();

  return async () => {
    logger.debug('Prefetching gold price');

    await queryClient.prefetchQuery({
      queryKey: GOLD_QUERY_KEYS.todayPrice,
      queryFn: getTodayGoldPrice,
      staleTime: TTL.ONE_HOUR,
    });

    const duration = Math.round(performance.now() - startTime);
    logger.success('Gold price prefetched', {
      duration: `${duration}ms`,
    });
  };
}

/**
 * Hook to invalidate gold price cache
 * 
 * @function useInvalidateGoldPrice
 * @returns {Function} Invalidate function
 * 
 * @example
 * const invalidate = useInvalidateGoldPrice();
 * invalidate(); // Forces fresh fetch
 */
export function useInvalidateGoldPrice() {
  const queryClient = useQueryClient();

  return () => {
    const todayDate = format(new Date(), 'yyyy-MM-dd');
    const cacheKey = `gold-price-${todayDate}`;

    logger.info('Invalidating gold price cache', {
      date: todayDate,
      cacheKey,
    });

    // Clear MMKV cache
    cache.clear(cacheKey);

    // Invalidate TanStack Query cache
    queryClient.invalidateQueries({
      queryKey: GOLD_QUERY_KEYS.price,
    });

    logger.success('Gold price cache invalidated');
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Formats gold price for display
 * 
 * @function formatGoldPrice
 * @param {number} price - Price per gram in SGD
 * @returns {string} Formatted price (e.g., "$85.50")
 * 
 * @example
 * formatGoldPrice(85.5); // "$85.50"
 */
export function formatGoldPrice(price: number): string {
  const formatted = `$${price.toFixed(2)}`;
  
  logger.debug('Gold price formatted', {
    input: price,
    output: formatted,
  });
  
  return formatted;
}

/**
 * Calculates total gold value
 * 
 * @function calculateGoldValue
 * @param {number} pricePerGram - Price per gram in SGD
 * @param {number} grams - Weight in grams
 * @returns {number} Total value in SGD
 * 
 * @example
 * calculateGoldValue(85.50, 100); // 8550.00 (100g × $85.50)
 */
export function calculateGoldValue(pricePerGram: number, grams: number): number {
  const value = Number((pricePerGram * grams).toFixed(2));
  
  logger.debug('Gold value calculated', {
    pricePerGram,
    grams,
    value,
    calculation: `${pricePerGram} × ${grams} = ${value}`,
  });
  
  return value;
}

/**
 * Calculates price change between two prices
 * 
 * @function getPriceChange
 * @param {number} currentPrice - Current price per gram
 * @param {number} previousPrice - Previous price per gram
 * @returns {Object} Change amount, percentage, and direction
 * 
 * @example
 * getPriceChange(85.50, 84.00);
 * // { amount: 1.50, percentage: 1.79, direction: 'up' }
 */
export function getPriceChange(
  currentPrice: number,
  previousPrice: number
): {
  amount: number;
  percentage: number;
  direction: 'up' | 'down' | 'neutral';
} {
  const amount = currentPrice - previousPrice;
  const percentage = (amount / previousPrice) * 100;

  const result = {
    amount: Number(amount.toFixed(2)),
    percentage: Number(percentage.toFixed(2)),
    direction: (amount > 0 ? 'up' : amount < 0 ? 'down' : 'neutral') as 'up' | 'down' | 'neutral',
  };

  logger.debug('Price change calculated', {
    currentPrice,
    previousPrice,
    change: result,
  });

  return result;
}