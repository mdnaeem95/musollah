import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { metalPriceClient, handleApiError } from '../../client/http';
import { db } from '../../client/firebase';
import { cache, TTL } from '../../client/storage';

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

    return { pricePerGram, timestamp };
  } catch (error) {
    // If your handleApiError throws, this will never continue.
    // If it doesn't throw, we throw here to avoid returning undefined.
    handleApiError(error, 'fetchGoldPriceFromAPI');
    throw error;
  }
}

async function getGoldPriceFromFirestore(todayDate: string): Promise<GoldPriceData | null> {
  try {
    const ref = doc(db, 'goldPrice', todayDate);
    const snap = await getDoc(ref);

    if (snap.exists()) {
      const data = snap.data() as any;
      console.log('🎯 Fetched gold price from Firestore:', data);

      // Defensive: ensure shape
      if (typeof data?.pricePerGram !== 'number' || typeof data?.timestamp !== 'string') {
        console.warn('⚠️ Invalid gold price doc shape, ignoring:', data);
        return null;
      }

      return {
        pricePerGram: data.pricePerGram,
        timestamp: data.timestamp,
      };
    }

    console.log('📭 No gold price found in Firestore for today');
    return null;
  } catch (error) {
    console.error('❌ Error fetching gold price from Firestore:', error);
    return null;
  }
}

async function storeGoldPriceInFirestore(todayDate: string, data: GoldPriceData): Promise<void> {
  try {
    const ref = doc(db, 'goldPrice', todayDate);
    await setDoc(ref, data);
    console.log('✅ Stored gold price in Firestore');
  } catch (error) {
    console.error('❌ Error storing gold price in Firestore:', error);
    // Don't throw - Firestore storage is optional
  }
}

async function getTodayGoldPrice(): Promise<GoldPriceData> {
  const todayDate = format(new Date(), 'yyyy-MM-dd');
  const cacheKey = `gold-price-${todayDate}`;

  // Layer 1: MMKV
  const cachedPrice = cache.get<GoldPriceData>(cacheKey);
  if (cachedPrice) {
    console.log('⚡ Using cached gold price from MMKV');
    return cachedPrice;
  }

  // Layer 2: Firestore
  const firestorePrice = await getGoldPriceFromFirestore(todayDate);
  if (firestorePrice) {
    cache.set(cacheKey, firestorePrice, TTL.ONE_DAY);
    return firestorePrice;
  }

  // Layer 3: API
  console.log('🌐 Fetching gold price from API');
  const apiPrice = await fetchGoldPriceFromAPI();

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
    staleTime: TTL.ONE_HOUR,
    gcTime: TTL.ONE_DAY,
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
    // Optional: also clear MMKV so invalidate actually forces a refresh
    const todayDate = format(new Date(), 'yyyy-MM-dd');
    cache.clear(`gold-price-${todayDate}`);

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