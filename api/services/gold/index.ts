import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { metalPriceClient, handleApiError } from '../../client/http';
import { db } from '../../client/firebase';
import { cache, TTL } from '../../client/storage';

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

const API_KEY = 'ac71d0fa4cfd6f4733484d2a30af6184'; // Move to env later
const OUNCES_TO_GRAMS = 31.1035;

// ============================================================================
// API FUNCTIONS
// ============================================================================

async function fetchGoldPriceFromAPI(): Promise<GoldPriceData> {
  try {
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

    return {
      pricePerGram,
      timestamp,
    };
  } catch (error) {
    handleApiError(error, 'fetchGoldPriceFromAPI');
  }
}

async function getGoldPriceFromFirestore(
  todayDate: string
): Promise<GoldPriceData | null> {
  try {
    const doc = await db.collection('goldPrice').doc(todayDate).get();

    if (doc.exists()) {
      const data = doc.data();
      console.log('🎯 Fetched gold price from Firestore:', data);
      return {
        pricePerGram: data?.pricePerGram,
        timestamp: data?.timestamp,
      };
    }

    console.log('📭 No gold price found in Firestore for today');
    return null;
  } catch (error) {
    console.error('❌ Error fetching gold price from Firestore:', error);
    return null;
  }
}

async function storeGoldPriceInFirestore(
  todayDate: string,
  data: GoldPriceData
): Promise<void> {
  try {
    await db.collection('goldPrice').doc(todayDate).set(data);
    console.log('✅ Stored gold price in Firestore');
  } catch (error) {
    console.error('❌ Error storing gold price in Firestore:', error);
    // Don't throw - Firestore storage is optional
  }
}

async function getTodayGoldPrice(): Promise<GoldPriceData> {
  const todayDate = format(new Date(), 'yyyy-MM-dd');
  const cacheKey = `gold-price-${todayDate}`;

  // Layer 1: Check MMKV cache
  const cachedPrice = cache.get<GoldPriceData>(cacheKey);
  if (cachedPrice) {
    console.log('⚡ Using cached gold price from MMKV');
    return cachedPrice;
  }

  // Layer 2: Check Firestore
  const firestorePrice = await getGoldPriceFromFirestore(todayDate);
  if (firestorePrice) {
    // Cache in MMKV for instant access
    cache.set(cacheKey, firestorePrice, TTL.ONE_DAY);
    return firestorePrice;
  }

  // Layer 3: Fetch from API
  console.log('🌐 Fetching gold price from API');
  const apiPrice = await fetchGoldPriceFromAPI();

  // Store in both caches
  cache.set(cacheKey, apiPrice, TTL.ONE_DAY);
  await storeGoldPriceInFirestore(todayDate, apiPrice);

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

export function useGoldPrice() {
  return useQuery({
    queryKey: GOLD_QUERY_KEYS.todayPrice,
    queryFn: getTodayGoldPrice,
    staleTime: TTL.ONE_HOUR, // Consider fresh for 1 hour
    gcTime: TTL.ONE_DAY, // Keep in memory for 1 day
    retry: 2,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });
}

export function usePrefetchGoldPrice() {
  const queryClient = useQueryClient();

  return async () => {
    await queryClient.prefetchQuery({
      queryKey: GOLD_QUERY_KEYS.todayPrice,
      queryFn: getTodayGoldPrice,
      staleTime: TTL.ONE_HOUR,
    });
  };
}

export function useInvalidateGoldPrice() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({
      queryKey: GOLD_QUERY_KEYS.price,
    });
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export function formatGoldPrice(price: number): string {
  return `$${price.toFixed(2)}`;
}

export function calculateGoldValue(pricePerGram: number, grams: number): number {
  return Number((pricePerGram * grams).toFixed(2));
}

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
  
  return {
    amount: Number(amount.toFixed(2)),
    percentage: Number(percentage.toFixed(2)),
    direction: amount > 0 ? 'up' : amount < 0 ? 'down' : 'neutral',
  };
}