import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import React, { useMemo, useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useRouter } from 'expo-router';
import { FontAwesome6 } from '@expo/vector-icons';
import { addDays, subDays, format } from 'date-fns';
import { MotiView } from 'moti';
import PrayerActionsModal from '../../../components/prayer/PrayerActionsModal';
import { RootState, AppDispatch } from '../../../redux/store/store';
import {
  getFormattedDate,
  scaleSize,
} from '../../../utils';
import { usePrayerTimes } from '../../../hooks/usePrayerTimes';
import CurrentPrayerInfo from '../../../components/prayer/CurrentPrayerInfo';
import PrayerTimesList from '../../../components/prayer/PrayerTimesList';
import PrayerLocationModal from '../../../components/prayer/PrayerLocationModal';
import CustomClock from '../../../components/prayer/CustomClock';
import { useTheme } from '../../../context/ThemeContext';
import { fetchPrayerTimesFromFirebase, setSelectedDate } from '../../../redux/slices/prayerSlice';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PrayerTimesSkeleton from '../../../components/prayer/PrayerTimesSkeleton';

const PrayerTab = () => {
  const router = useRouter();
  const { theme } = useTheme();
  const dispatch = useDispatch<AppDispatch>();
  const styles = createStyles(theme);

  const resetOnboarding = async () => {
    await AsyncStorage.removeItem('hasSeenOnboarding');
    alert('Onboarding has been reset.');
  };

  const [isActionsModalVisible, setIsActionsModalVisible] = useState(false);

  const handleCityPress = () => {
    setIsActionsModalVisible(false)
    setIsPrayerLocationModalVisible(true);
  };

  const prayerActions = [
    { icon: 'compass', label: 'Qiblat', onPress: () => {
      setIsActionsModalVisible(false)
      router.push('/qiblat')
    }},
    { icon: 'hands-praying', label: 'Doa', onPress: () => {
      setIsActionsModalVisible(false)
      router.push('/doa') 
    }},
    { icon: 'calendar-alt', label: 'Calendar', onPress: () => {
      setIsActionsModalVisible(false)
      router.push('/monthlyPrayerTimes') 
    }},
    { icon: 'location-dot', label: 'Change City', onPress: handleCityPress },
    { icon: 'chart-simple', label: 'Dashboard', onPress: () => {
      setIsActionsModalVisible(false)
      router.push('/prayerDashboard') 
    }},
    { icon: 'message', label: 'Khutbah', onPress: () => {
      setIsActionsModalVisible(false)
      router.push('/khutbah')
    }}
  ];

  const { prayerTimes, islamicDate, isLoading } = useSelector((state: RootState) => state.prayer);
  const { reminderInterval } = useSelector((state: RootState) => state.userPreferences);

  const today = new Date();
  const [selectedDateLocal, setSelectedDateLocal] = useState<Date>(today);
  const [isPrayerLocationModalVisible, setIsPrayerLocationModalVisible] = useState<boolean>(false);

  const formattedDisplayDate = useMemo(() => getFormattedDate(selectedDateLocal), [selectedDateLocal]);
  const formattedFirebaseDate = useMemo(() => format(selectedDateLocal, 'd/M/yyyy'), [selectedDateLocal]);

  useEffect(() => {
    dispatch(fetchPrayerTimesFromFirebase({ inputDate: formattedFirebaseDate }));
    dispatch(setSelectedDate(selectedDateLocal.toISOString()));
  }, [formattedFirebaseDate]);

  const { currentPrayer, nextPrayerInfo, backgroundImage } = usePrayerTimes(prayerTimes || {}, reminderInterval);

  return (
    <ImageBackground source={backgroundImage} style={styles.backgroundImage}>
      <View style={styles.mainContainer}>
        <View style={styles.centeredView}>
          <View style={styles.dateRow}>
            <TouchableOpacity
              onPress={() => setSelectedDateLocal(subDays(selectedDateLocal, 1))}
            >
              <FontAwesome6 name="chevron-left" size={16} color="black" />
            </TouchableOpacity>

            <Text style={styles.dateText}>{formattedDisplayDate}</Text>

            <TouchableOpacity
              onPress={() => {
                const tomorrow = addDays(today, 1);
                if (selectedDateLocal < tomorrow) {
                  setSelectedDateLocal(addDays(selectedDateLocal, 1));
                }
              }}
            >
              <FontAwesome6 name="chevron-right" size={16} color="black" />
            </TouchableOpacity>
          </View>

          <CustomClock />
          <Text style={styles.islamicDateText}>{islamicDate || 'Loading...'}</Text>
        </View>

        {isLoading ? (
          <PrayerTimesSkeleton />
        ) : (
          <MotiView
            key={formattedFirebaseDate}
            from={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'timing', duration: 250 }}
            style={{ width: '100%', alignItems: 'center' }}
          >
            <CurrentPrayerInfo
              currentPrayer={currentPrayer}
              nextPrayerInfo={nextPrayerInfo}
            />
            <PrayerTimesList prayerTimes={prayerTimes} />
          </MotiView>
        )}
      </View>

      <PrayerLocationModal
        isVisible={isPrayerLocationModalVisible}
        onClose={() => setIsPrayerLocationModalVisible(false)}
      />

      <TouchableOpacity onPress={() => setIsActionsModalVisible(true)} style={styles.fab}>
        <FontAwesome6 name="plus" size={18} color="#fff" />
      </TouchableOpacity>

      {/* <TouchableOpacity onPress={resetOnboarding}>
        <Text style={{ color: 'red' }}>Reset Onboarding</Text>
      </TouchableOpacity> */}

      <PrayerActionsModal
        visible={isActionsModalVisible}
        onClose={() => setIsActionsModalVisible(false)}
        actions={prayerActions}
      />
    </ImageBackground>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    backgroundImage: {
      flex: 1,
      resizeMode: 'cover',
    },
    mainContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    centeredView: {
      alignItems: 'center',
      marginBottom: Platform.OS === 'android' ? 5 : 20,
    },
    dateText: {
      fontFamily: 'Outfit_400Regular',
      fontSize: scaleSize(18),
      color: 'black',
      textAlign: 'center',
    },
    islamicDateText: {
      fontFamily: 'Outfit_400Regular',
      fontSize: scaleSize(14),
      color: 'black',
      textAlign: 'center',
      marginTop: Platform.OS === 'android' ? 5 : -10,
    },
    dateRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 8,
    },
    fab: {
      position: 'absolute',
      bottom: 15,
      right: 20,
      backgroundColor: theme.colors.fab.background, // dark greenish
      width: 52,
      height: 52,
      borderRadius: 27,
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 6,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 3,
    },    
  });

export default PrayerTab;
