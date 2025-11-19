/**
 * Quran Storage Helpers
 * 
 * Helper functions for storing Quran reading progress in MMKV
 * Replaces AsyncStorage usage for lastReadAyah and lastListenedAyah
 */

import { defaultStorage } from '../../api/client/storage';

// ============================================================================
// TYPES
// ============================================================================

export interface AyahPosition {
  surahNumber: number;
  ayahNumber: number;
}

export interface AyahListenPosition {
  surahNumber: number;
  ayahIndex: number;
}

// ============================================================================
// STORAGE KEYS
// ============================================================================

const STORAGE_KEYS = {
  LAST_READ: 'lastReadAyah',
  LAST_LISTENED: 'lastListenedAyah',
} as const;

// ============================================================================
// LAST READ AYAH
// ============================================================================

export function getLastReadAyah(): AyahPosition | null {
  try {
    const data = defaultStorage.get<AyahPosition>(STORAGE_KEYS.LAST_READ);
    return data || null;
  } catch (error) {
    console.error('Failed to get last read ayah:', error);
    return null;
  }
}

export function setLastReadAyah(position: AyahPosition): void {
  try {
    defaultStorage.set(STORAGE_KEYS.LAST_READ, position);
  } catch (error) {
    console.error('Failed to set last read ayah:', error);
  }
}

export function clearLastReadAyah(): void {
  try {
    defaultStorage.delete(STORAGE_KEYS.LAST_READ);
  } catch (error) {
    console.error('Failed to clear last read ayah:', error);
  }
}

// ============================================================================
// LAST LISTENED AYAH
// ============================================================================

export function getLastListenedAyah(): AyahListenPosition | null {
  try {
    const data = defaultStorage.get<AyahListenPosition>(STORAGE_KEYS.LAST_LISTENED);
    return data || null;
  } catch (error) {
    console.error('Failed to get last listened ayah:', error);
    return null;
  }
}

export function setLastListenedAyah(position: AyahListenPosition): void {
  try {
    defaultStorage.set(STORAGE_KEYS.LAST_LISTENED, position);
  } catch (error) {
    console.error('Failed to set last listened ayah:', error);
  }
}

export function clearLastListenedAyah(): void {
  try {
    defaultStorage.delete(STORAGE_KEYS.LAST_LISTENED);
  } catch (error) {
    console.error('Failed to clear last listened ayah:', error);
  }
}

// ============================================================================
// COMBINED OPERATIONS
// ============================================================================

export function clearAllQuranProgress(): void {
  clearLastReadAyah();
  clearLastListenedAyah();
}

export function getQuranProgress() {
  return {
    lastRead: getLastReadAyah(),
    lastListened: getLastListenedAyah(),
  };
}