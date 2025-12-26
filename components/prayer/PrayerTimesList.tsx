import React, { memo, useCallback, useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { MotiView } from 'moti';
import { format } from 'date-fns';
import Toast from 'react-native-toast-message';
import { useQueryClient } from '@tanstack/react-query';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../stores/useAuthStore';
import { useTodayPrayerLog, usePrayerLog, useSavePrayerLog } from '../../api/services/prayer/queries/prayer-logs';
import { type PrayerLog, LocalPrayerName } from '../../api/services/prayer/types/index';
import { LOGGABLE_PRAYERS, PRAYER_ORDER } from '../../api/services/prayer/types/constants';
import PrayerTimeItem from './PrayerTimeItem';
import SignInModal from '../SignInModal'; // ✅ Add this import

interface PrayerTimesListProps {
  prayerTimes: Record<LocalPrayerName, string> | null;
  selectedDate: Date;
  currentPrayer?: LocalPrayerName | null;
  nextPrayerInfo?: {
    nextPrayer: LocalPrayerName;
    timeUntilNextPrayer: string;
  } | null;
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
 * Check if prayer time has passed (can be logged)
 * @param prayerTime - Prayer time string (HH:MM)
 * @returns True if current time is past prayer time
 */
function canLogPrayer(prayerTime: string): boolean {
  const [hours, minutes] = prayerTime.split(':').map(Number);
  const prayerDate = new Date();
  prayerDate.setHours(hours, minutes, 0, 0);
  
  return new Date() >= prayerDate;
}

/**
 * Prayer Times List with Prayer Logging
 * 
 * Features:
 * - Current prayer highlighted with accent background
 * - Next prayer shows countdown
 * - Uses TanStack Query for prayer logs
 * - Optimistic updates
 * - ✅ Always shows checkboxes (prompts sign-in if needed)
 */
const PrayerTimesList: React.FC<PrayerTimesListProps> = memo(({ 
  prayerTimes, 
  selectedDate,
  currentPrayer,
  nextPrayerInfo,
}) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const { userId } = useAuth();
  
  // ✅ NEW: Sign-in modal state
  const [showSignInModal, setShowSignInModal] = useState(false);
  
  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  const isToday = format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

  // Fetch prayer log for selected date
  const { data: prayerLog } = isToday 
    ? useTodayPrayerLog(userId)
    : usePrayerLog(userId, dateStr);

  // Mutation for saving prayer log
  const { mutate: savePrayerLog } = useSavePrayerLog();
  const queryClient = useQueryClient();

  // Handle prayer toggle
  const handlePrayerToggle = useCallback((prayerName: LocalPrayerName) => {
    // ✅ IMPROVED: Show modal instead of toast
    if (!userId) {
      setShowSignInModal(true);
      return;
    }

    // Skip Syuruk (sunrise)
    if (prayerName === 'Syuruk') return;

    // Check if prayer time has passed (only for today)
    if (isToday && prayerTimes) {
      const prayerTime = prayerTimes[prayerName];
      const isAvailable = canLogPrayer(prayerTime); 
      
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

    const queryKey = ['prayerLogs', userId, dateStr];
    const currentLog = queryClient.getQueryData<PrayerLog>(queryKey);

    const currentPrayers: PrayersPayload = currentLog?.prayers ?? EMPTY_PRAYERS;

    const key = prayerName as keyof PrayersPayload;
    const updatedPrayers: PrayersPayload = {
      ...currentPrayers,
      [key]: !currentPrayers[key],
    };

    savePrayerLog({
      userId,
      date: dateStr,
      prayers: updatedPrayers,
    });
  }, [userId, dateStr, isToday, queryClient, prayerTimes, savePrayerLog]);

  // Empty state
  if (!prayerTimes) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No prayer times available</Text>
      </View>
    );
  }

  return (
    <>
      <View style={styles.container}>
        {PRAYER_ORDER.map((prayerName, index) => {
          const isLoggable = LOGGABLE_PRAYERS.includes(prayerName as any);
          const loggedMap = prayerLog?.prayers as PrayersPayload | undefined;
          const isLogged = isLoggable ? (loggedMap?.[prayerName as keyof PrayersPayload] ?? false) : false;
          
          const isCurrent = currentPrayer === prayerName;
          const isNext = nextPrayerInfo?.nextPrayer === prayerName;
          const countdown = isNext ? nextPrayerInfo?.timeUntilNextPrayer : undefined;
          
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
                showCheckbox={true} 
                isCurrent={isCurrent}
                countdown={countdown}
              />
            </MotiView>
          );
        })}
      </View>

      {/* ✅ NEW: Sign-in modal */}
      <SignInModal 
        visible={showSignInModal}
        onClose={() => setShowSignInModal(false)}
      />
    </>
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
    marginBottom: 12,
    justifyContent: 'center',
    alignItems: 'center'
  },
});

PrayerTimesList.displayName = 'PrayerTimesList';

export default PrayerTimesList;