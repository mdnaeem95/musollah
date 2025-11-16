import React, { memo, useCallback } from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { MotiView } from 'moti';
import { FontAwesome6 } from '@expo/vector-icons';
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

/** Convenience type: only loggable prayers (exclude Syuruk) */
type LoggablePrayer = Exclude<PrayerName, PrayerName.SYURUK>;

/**
 * Prayer Times List with Prayer Logging
 * 
 * Improvements over Redux version:
 * - Uses TanStack Query for prayer logs
 * - Better error handling with Toast
 * - Optimistic updates
 * - Type-safe with proper hooks
 * - Cleaner separation of concerns
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

    // Skip Syuruk (sunrise)
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
    const key = prayerName as keyof PrayersPayload; // Subuh | Zohor | Asar | Maghrib | Isyak
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
  }, [userId, dateStr, prayerLog, isToday, prayerTimes, savePrayerLog]);

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
          >
            <View style={styles.prayerRow}>
              <PrayerTimeItem
                name={prayerName}
                time={prayerTimes[prayerName]}
              />
              {isLoggable && userId && (
                <TouchableOpacity
                  onPress={() => handlePrayerToggle(prayerName)}
                  style={styles.checkButton}
                  accessibilityLabel={`Mark ${prayerName} as ${isLogged ? 'not completed' : 'completed'}`}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: isLogged }}
                >
                  <FontAwesome6
                    name={isLogged ? 'check-circle' : 'circle'}
                    size={24}
                    color={isLogged ? theme.colors.text.success : theme.colors.text.muted}
                  />
                </TouchableOpacity>
              )}
            </View>
          </MotiView>
        );
      })}
    </View>
  );
});

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    marginTop: 20,
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
  prayerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  checkButton: {
    marginLeft: 15,
    padding: 5,
  },
});

PrayerTimesList.displayName = 'PrayerTimesList';

export default PrayerTimesList;
