import { View, Text, StyleSheet, ImageBackground, Button } from 'react-native'
import React, { useEffect, useMemo, useState } from 'react'
import Clock from 'react-live-clock';
import { useSelector } from 'react-redux';
import { useRouter } from 'expo-router';
import * as Sentry from '@sentry/react-native'

import ExpandableButton from '../../../components/prayer/ExpandableButton';

import { RootState } from '../../../redux/store/store';
import { getFormattedDate, scaleSize } from '../../../utils';
import { usePrayerTimes } from '../../../hooks/usePrayerTimes'
import CurrentPrayerInfo from '../../../components/prayer/CurrentPrayerInfo';
import PrayerTimesList from '../../../components/prayer/PrayerTimesList';
import PrayerLocationModal from '../../../components/prayer/PrayerLocationModal';

const PrayerTab = () => {
  const router = useRouter();
  const { prayerTimes, islamicDate, isLoading, selectedDate } = useSelector((state: RootState) => state.prayer);
  const { reminderInterval } = useSelector((state: RootState) => state.userPreferences);
  const { currentPrayer, nextPrayerInfo, fetchAndScheduleNotifications, backgroundImage } = usePrayerTimes(prayerTimes, reminderInterval)
  const [isPrayerLocationModalVisible, setIsPrayerLocationModalVisible] = useState<boolean>(false);

  // Format the selected date
  const formattedDate = useMemo(() => {
    const date = selectedDate ? new Date(selectedDate) : new Date();
    return getFormattedDate(date);
  }, [selectedDate])

  // Handle city press to open location modal
  const handleCityPress = () => {
    setIsPrayerLocationModalVisible(true);
  }

  useEffect(() => {
    fetchAndScheduleNotifications();
  }, [fetchAndScheduleNotifications])

  return (
    <ImageBackground source={backgroundImage} style={styles.backgroundImage}>
      <View style={styles.mainContainer}>
        <View style={styles.centeredView}>
          <Text style={styles.dateText}>
            {selectedDate ? getFormattedDate(new Date(selectedDate)) : formattedDate}
          </Text>
          <Text style={styles.clockText}>
            <Clock format={'HH:mm'} timezone={'Asia/Singapore'} element={Text} ticking={true} interval={60} />
          </Text>
          <Text style={styles.islamicDateText}>{islamicDate}</Text>
        </View>

        <CurrentPrayerInfo
          currentPrayer={currentPrayer}
          nextPrayerInfo={nextPrayerInfo}
        />

        <PrayerTimesList prayerTimes={prayerTimes} />
      </View>

      {/* Include the City Selection Modal */}
      <PrayerLocationModal isVisible={isPrayerLocationModalVisible} onClose={() => setIsPrayerLocationModalVisible(false)} />

      <ExpandableButton
        onQiblatPress={() => router.push('/qiblat')}
        onDoaPress={() => router.push('/doa')}
        onCalendarPress={() => router.push('/monthlyPrayerTimes')}
        onCityPress={handleCityPress}
        onDashboardPress={() => router.push('/prayerDashboard')}
      />

  <Button title='Try!' onPress={() => Sentry.captureException(new Error('First error')) }/>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
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
    marginBottom: 20,
  },
  dateText: {
    fontFamily: 'Outfit_400Regular',
    fontSize: scaleSize(18),
    color: '#000000',
    textAlign: 'center',
  },
  islamicDateText: {
    fontFamily: 'Outfit_400Regular',
    fontSize: scaleSize(14),
    color: '#000000',
    textAlign: 'center',
    marginTop: -10,
  },
  clockText: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: scaleSize(60),
    color: '#000000',
    textAlign: 'center',
  },
});

export default PrayerTab;