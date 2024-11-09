import { View, Text, StyleSheet, ImageBackground, Dimensions } from 'react-native'
import React, { useEffect, useMemo, useState } from 'react'
import Clock from 'react-live-clock';
import { useSelector } from 'react-redux';
import { useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';

import PrayerTimeItem from '../../../components/PrayerTimeItem';
import ExpandableButton from '../../../components/ExpandableButton';
import PrayerLocationModal from '../../../components/PrayerLocationModal';

import SubuhBackground from '../../../assets/prayerBackgroundImages/subuhBackground.png';
import ZuhurBackground from '../../../assets/prayerBackgroundImages/zuhurBackground.png';
import AsrBackground from '../../../assets/prayerBackgroundImages/asarBackground.png';
import MaghribBackground from '../../../assets/prayerBackgroundImages/maghribBackground.png';
import IshaBackground from '../../../assets/prayerBackgroundImages/isyaBackground.png';

import { RootState } from '../../../redux/store/store';
import { PrayerTimes } from '../../../utils/types';
import { getFormattedDate, getPrayerTimesInfo } from '../../../utils';

// Constants for background images
const prayerBackgrounds = {
  Subuh: SubuhBackground,
  Zohor: ZuhurBackground,
  Asar: AsrBackground,
  Maghrib: MaghribBackground,
  Isyak: IshaBackground,
}

// Constants for screen width
const screenWidth = Dimensions.get('window').width;

const PrayerTab = () => {
  const router = useRouter();
  const { prayerTimes, islamicDate, isLoading, selectedDate } = useSelector((state: RootState) => state.prayer);
  const { reminderInterval } = useSelector((state: RootState) => state.userPreferences);
  const desiredPrayers: (keyof PrayerTimes)[] = ['Subuh', 'Zohor', 'Asar', 'Maghrib', 'Isyak'];
  const scheduledReminders = new Set<string>();

  const [isPrayerLocationModalVisible, setIsPrayerLocationModalVisible] = useState<boolean>(false);
  const [currentPrayer, setCurrentPrayer] = useState<string>('');
  const [nextPrayerInfo, setNextPrayerInfo] = useState<{ nextPrayer: string, timeUntilNextPrayer: string } | null>(null);
  const [notificationsScheduled, setNotificationsScheduled] = useState<boolean>(false); // Track if notifications are scheduled

  // Format the selected date
  const formattedDate = useMemo(() => {
    const date = selectedDate ? new Date(selectedDate) : new Date();
    return getFormattedDate(date);
  }, [selectedDate]);

  // Get background image based on current prayer session
  //@ts-ignore
  const backgroundImage = useMemo(() => prayerBackgrounds[currentPrayer] || SubuhBackground, [currentPrayer])

  // Update current and next prayer info and schedule notifications once prayer times are fetched
  useEffect(() => {
    // Always update the current and next prayer info
    if (prayerTimes) {
      const { currentPrayer, nextPrayer, timeUntilNextPrayer } = getPrayerTimesInfo(prayerTimes, new Date());
      setCurrentPrayer(currentPrayer);
      setNextPrayerInfo({ nextPrayer, timeUntilNextPrayer });
    } else {
      setCurrentPrayer('');
      setNextPrayerInfo(null);
    }
  }, [prayerTimes, notificationsScheduled, reminderInterval]);

  // Handle city press to open location modal
  const handleCityPress = () => {
    setIsPrayerLocationModalVisible(true);
  }

  // Recalculate the next prayer info every minute to keep it updated
  useEffect(() => {
    const intervalId = setInterval(() => {
      if (prayerTimes) {
        const { currentPrayer, nextPrayer, timeUntilNextPrayer } = getPrayerTimesInfo(prayerTimes, new Date());
        setCurrentPrayer(currentPrayer);
        setNextPrayerInfo({ nextPrayer, timeUntilNextPrayer });
      }
    }, 60000); // Update every 1 minute

    return () => clearInterval(intervalId); // Cleanup the interval when the component unmounts
  }, [prayerTimes]);

  return (
    <ImageBackground source={backgroundImage} style={styles.backgroundImage}>
      <View style={styles.mainContainer}>
        <View style={styles.centeredView}>
          <Text style={[styles.dateText, { marginBottom: -30 }]}>
            {selectedDate ? getFormattedDate(new Date(selectedDate)) : formattedDate}
          </Text>
          <Text style={styles.clockText}>
            <Clock format={'HH:mm'} timezone={'Asia/Singapore'} element={Text} ticking={true} interval={60} />
          </Text>
          <Text style={[styles.dateText, { marginTop: -25 }]}>{islamicDate}</Text>
        </View>

        <View style={styles.bottomView}>
          {prayerTimes && (
            <>
              <Text style={styles.currentText}>{currentPrayer}</Text>
              <Text style={[styles.dateText, styles.spacing]}>
                {nextPrayerInfo?.timeUntilNextPrayer} until {nextPrayerInfo?.nextPrayer}
              </Text>
            </>
          )}
        </View>

        <View style={styles.prayerTimesContainer}>
          {prayerTimes ? (
            <>
              {desiredPrayers.map((prayer) => (
                <PrayerTimeItem key={prayer} name={prayer as string} time={prayerTimes[prayer]} />
              ))}
            </>
          ) : (
            <Text>Loading...</Text>
          )}
        </View>
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
    </ImageBackground>
  );
};

function scaleSize(size: number) {
  const scaleFactor = screenWidth / 375; // Base screen width (iPhone standard)
  return size * scaleFactor;
}

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
  bottomView: {
    alignItems: 'flex-start',
  },
  dateText: {
    fontFamily: 'Outfit_400Regular',
    fontSize: scaleSize(16),
    lineHeight: scaleSize(21) * 1.3,
    color: '#000000',
    textAlign: 'center',
  },
  clockText: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: scaleSize(64),
    lineHeight: scaleSize(96) * 1.5,
    color: '#000000',
    textAlign: 'center',
  },
  currentText: {
    fontFamily: 'Outfit_400Regular',
    fontSize: scaleSize(30),
    lineHeight: scaleSize(46),
    color: '#000000',
    alignSelf: 'center'
  },
  spacing: {
    marginTop: 5,
  },
  prayerTimesContainer: {
    marginTop: 20,
    marginBottom: 20,
    gap: 15,
  },
});

export default PrayerTab;