/**
 * utils/types barrel
 *
 * Re-exports app-wide domain types from their canonical service locations so
 * legacy `utils/types` imports resolve. (Type-only; erased at runtime.)
 */

export type { Doa } from '../../api/services/duas';
export type { FoodAdditive } from '../../functions/src/types';

/** UI-facing surah shape used by the surah list + item (distinct from the
 *  quran service's `Surah`, which stores the Arabic under `name`). */
export interface Surah {
  id?: string;
  number: number;
  arabicName: string;
  englishName: string;
  englishNameTranslation: string;
  englishTranslation?: string;
  arabicText?: string;
  audioLinks?: string;
  numberOfAyahs: number;
  revelationType?: string;
}

/** In-app notification doc (Firestore `notifications` collection). */
export interface Notification {
  id: string;
  targetUserId: string;
  message: string;
  read: boolean;
  createdAt?: any; // Firestore Timestamp
  title?: string;
  type?: string;
}
