/**
 * Prayer hooks barrel export
 * Simplifies imports across the app
 */

// Date management
export { usePrayerDateNavigation } from './usePrayerDateNavigation';

// Modal management
export { usePrayerModals } from './usePrayerModals';

// Actions
export { usePrayerActions } from './usePrayerActions';
export type { PrayerAction } from './usePrayerActions';

// Prayer times calculation
export { usePrayerTimesOptimized } from './usePrayerTimesOptimized';

// Data fetching
export {
  usePrayerQuery,
  usePrefetchPrayerTimes,
  useInvalidatePrayerCache,
} from './usePrayerQuery';

// Usage:
// import { usePrayerDateNavigation, usePrayerModals } from '@/hooks/prayer';