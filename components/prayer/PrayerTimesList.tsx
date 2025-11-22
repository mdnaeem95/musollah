import React, { memo, useCallback } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { MotiView } from 'moti';
import { format } from 'date-fns';
import Toast from 'react-native-toast-message';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../stores/useAuthStore';
import { useTodayPrayerLog, usePrayerLog, useSavePrayerLog } from '../../api/services/prayer/logs';
import PrayerTimeItem from './PrayerTimeItem';
import { PrayerName } from '../../utils/types/prayer.types';
import { isPrayerAvailable } from '../../utils/prayers/prayerTimeUtils';
import { PRAYER_NAMES } from '../../constants/prayer.constants';

interface PrayerTimesListProps {
  prayerTimes: Record<PrayerName, string> | null;
  selectedDate: Date;
}

/** Fixed-shape expected by savePrayerLog */
type PrayersPayload = {
  Subuh: boolean;
  Zohor: boolean;
  Asar: boolean;
  Maghrib: boolean;
  Isyak: boolean;
};

const EMPTY_PRAYERS: PrayersPayload = {
  Subuh: false,
  Zohor: false,
  Asar: false,
  Maghrib: false,
  Isyak: false,
};

/**
 * Prayer Times List with Prayer Logging
 * 
 * Improvements over Redux version:
 * - Uses TanStack Query for prayer logs
 * - Better error handling with Toast
 * - Optimistic updates
 * - Type-safe with proper hooks
 * - Cleaner separation of concerns
 * - Checkbox integrated into PrayerTimeItem for better alignment
 */
const PrayerTimesList: React.FC<PrayerTimesListProps> = memo(({ 
  prayerTimes, 
  selectedDate 
}) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const { userId } = useAuth();
  
  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  const isToday = format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

  // Fetch prayer log for selected date
  const { data: prayerLog } = isToday 
    ? useTodayPrayerLog(userId)
    : usePrayerLog(userId, dateStr);

  // Mutation for saving prayer log
  const { mutate: savePrayerLog } = useSavePrayerLog();

  // Handle prayer toggle
  // ✅ FIX: Only include stable dependencies
  // Read current values inside the callback instead of closing over them
  const handlePrayerToggle = useCallback((prayerName: PrayerName) => {
    if (!userId) {
      Toast.show({
        type: 'info',
        text1: 'Sign in required',
        text2: 'Please sign in to log your prayers',
        position: 'bottom',
      });
      return;
    }

    // Skip Syuruk (sunrise) - should never be called but safety check
    if (prayerName === PrayerName.SYURUK) return;

    // Check if prayer time has passed (only for today)
    if (isToday && prayerTimes) {
      const isAvailable = isPrayerAvailable(prayerName, prayerTimes[prayerName], new Date());
      if (!isAvailable) {
        Toast.show({
          type: 'error',
          text1: 'Prayer time not reached',
          text2: `You can log ${prayerName} after its prayer time`,
          position: 'bottom',
        });
        return;
      }
    }

    // Always start from a full, fixed-shape object
    const currentPrayers: PrayersPayload =
      (prayerLog?.prayers as PrayersPayload | undefined) ?? EMPTY_PRAYERS;

    // Toggle with strong typing (exclude Syuruk)
    const key = prayerName as keyof PrayersPayload;
    const updatedPrayers: PrayersPayload = {
      ...currentPrayers,
      [key]: !currentPrayers[key],
    };

    // Save with optimistic update (mutation handles it)
    savePrayerLog({
      userId,
      date: dateStr,
      prayers: updatedPrayers,
    });
  }, [userId, dateStr, isToday]); 
  // ✅ Only stable primitives: userId, dateStr, isToday
  // ❌ Removed: prayerLog, prayerTimes, savePrayerLog (they're read inside callback)

  // Empty state
  if (!prayerTimes) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No prayer times available</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {PRAYER_NAMES.map((prayerName, index) => {
        const isLoggable = prayerName !== PrayerName.SYURUK;
        const loggedMap = (prayerLog?.prayers as PrayersPayload | undefined);
        const isLogged = isLoggable ? (loggedMap?.[prayerName as keyof PrayersPayload] ?? false) : false;
        
        return (
          <MotiView
            key={prayerName}
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: index * 50 }}
            style={styles.itemContainer}
          >
            <PrayerTimeItem
              name={prayerName}
              time={prayerTimes[prayerName]}
              isLogged={isLogged}
              onToggle={() => handlePrayerToggle(prayerName)}
              isLoggable={isLoggable}
              showCheckbox={!!userId} // Only show checkbox if user is signed in
            />
          </MotiView>
        );
      })}
    </View>
  );
});

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    width: '100%',
  },
  emptyContainer: {
    marginTop: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 16,
    color: theme.colors.text.muted,
  },
  itemContainer: {
    marginBottom: 15,
    justifyContent: 'center',
    alignItems: 'center'
  },
});

PrayerTimesList.displayName = 'PrayerTimesList';

export default PrayerTimesList;