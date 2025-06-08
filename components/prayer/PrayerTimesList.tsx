import React, { memo, useCallback } from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { MotiView } from 'moti';
import { FontAwesome6 } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useSelector, useDispatch } from 'react-redux';
import { format } from 'date-fns';
import PrayerTimeItem from './PrayerTimeItem';
import { PrayerName } from '../../utils/types/prayer.types';
import { AppDispatch } from '../../redux/store/store';
import { selectPrayerLog, savePrayerLog } from '../../redux/slices/prayerSlice';
import { isPrayerAvailable } from '../../utils/prayers/prayerTimeUtils';
import { PRAYER_NAMES } from '../..//constants/prayer.constants';
import { getAuth } from '@react-native-firebase/auth';
import Toast from 'react-native-toast-message';

interface PrayerTimesListProps {
  prayerTimes: Record<PrayerName, string> | null;
  selectedDate: Date;
}

const PrayerTimesList: React.FC<PrayerTimesListProps> = memo(({ 
  prayerTimes, 
  selectedDate 
}) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const dispatch = useDispatch<AppDispatch>();
  const auth = getAuth();
  const currentUser = auth.currentUser;
  
  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  const prayerLog = useSelector(selectPrayerLog(dateStr));
  const isToday = format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

  const handlePrayerToggle = useCallback(async (prayerName: PrayerName) => {
    if (!currentUser) {
      Toast.show({
        type: 'info',
        text1: 'Sign in required',
        text2: 'Please sign in to log your prayers',
      });
      return;
    }

    if (prayerName === PrayerName.SYURUK) return;

    // Check if prayer time has passed (only for today)
    if (isToday && prayerTimes) {
      const isAvailable = isPrayerAvailable(prayerName, prayerTimes[prayerName], new Date());
      if (!isAvailable) {
        Toast.show({
          type: 'error',
          text1: 'Prayer time not reached',
          text2: `You can log ${prayerName} after its prayer time`,
        });
        return;
      }
    }

    const currentPrayers = prayerLog?.prayers || {};
    const updatedPrayers = {
      ...currentPrayers,
      [prayerName]: !currentPrayers[prayerName as keyof typeof currentPrayers],
    };

    dispatch(savePrayerLog({
      userId: currentUser.uid,
      date: dateStr,
      prayers: updatedPrayers,
    }));
  }, [currentUser, dispatch, dateStr, prayerLog, isToday, prayerTimes]);

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
        const isLogged = prayerLog?.prayers[prayerName as keyof typeof prayerLog.prayers] || false;
        
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
              {isLoggable && currentUser && (
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

export default PrayerTimesList;