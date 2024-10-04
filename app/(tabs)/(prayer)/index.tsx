import { View, Text, StyleSheet, ImageBackground, Dimensions, Modal, TouchableOpacity } from 'react-native'
import React, { useEffect, useMemo, useState } from 'react'
import { Calendar } from 'react-native-calendars';
import Clock from 'react-live-clock';
import { useDispatch, useSelector } from 'react-redux';
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

import { AppDispatch, RootState } from '../../../redux/store/store';
import { fetchPrayerTimesByDate } from '../../../redux/slices/prayerSlice';
import { CalendarObject, PrayerTimes } from '../../../utils/types';
import { getFormattedDate, getPrayerTimesInfo } from '../../../utils';

// Constants for background images
const prayerBackgrounds = {
  Fajr: SubuhBackground,
  Dhuhr: ZuhurBackground,
  Asr: AsrBackground,
  Maghrib: MaghribBackground,
  Isha: IshaBackground,
}

// Constants for screen width
const screenWidth = Dimensions.get('window').width;

const PrayerTab = () => {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { prayerTimes, islamicDate, isLoading, selectedDate } = useSelector((state: RootState) => state.prayer);
  const desiredPrayers: (keyof PrayerTimes)[] = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

  const [isPrayerLocationModalVisible, setIsPrayerLocationModalVisible] = useState<boolean>(false);
  const [isCalendarVisible, setIsCalendarVisible] = useState<boolean>(false);
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

  // Function to schedule notifications for the day
  const schedulePrayerNotifications = async (prayerTimes: PrayerTimes) => {
    try {
      // Cancel any existing notifications to avoid duplicates
      await Notifications.cancelAllScheduledNotificationsAsync();

      const today = new Date();
      Object.entries(prayerTimes).forEach(async ([prayerName, prayerTime]) => {
        const [hour, minute] = prayerTime.split(':').map(Number);
        const prayerDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hour, minute);

        if (prayerDate > today) {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: `Time for ${prayerName}`,
              body: `It's time for ${prayerName} prayer.`,
              sound: true,
            },
            trigger: prayerDate,
          });
          console.log(`${prayerName} notification scheduled for ${prayerDate}`);
        }
      });

      // Mark notifications as scheduled for the day
      setNotificationsScheduled(true);

    } catch (error) {
      console.error('Error scheduling prayer notifications:', error);
    }
  };

  // Handle day press in calendar
  const handleDayPress = (day: CalendarObject) => {
    try {
      dispatch(fetchPrayerTimesByDate(day.dateString));
      setIsCalendarVisible(false);
    } catch (error) {
      console.error('Error fetching prayer times by date: ', error);
    }
  };

  // Handle city press to open location modal
  const handleCityPress = () => {
    setIsPrayerLocationModalVisible(true);
  }

  // Update current and next prayer info and schedule notifications once prayer times are fetched
  useEffect(() => {
    console.log('Inside useEffect. PrayerTimes:', prayerTimes, 'Notifications Scheduled:', notificationsScheduled);

    // Always update the current and next prayer info
    if (prayerTimes) {
      const { currentPrayer, nextPrayer, timeUntilNextPrayer } = getPrayerTimesInfo(prayerTimes, new Date());

      console.log('Setting Current Prayer:', currentPrayer, 'Next Prayer:', nextPrayer, 'Time Until Next Prayer:', timeUntilNextPrayer);

      setCurrentPrayer(currentPrayer);
      setNextPrayerInfo({ nextPrayer, timeUntilNextPrayer });

      // Only schedule notifications if they haven't been scheduled yet
      if (!notificationsScheduled) {
        schedulePrayerNotifications(prayerTimes);
      }
    } else {
      setCurrentPrayer('');
      setNextPrayerInfo(null);
    }
  }, [prayerTimes, notificationsScheduled]);

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

      <Modal transparent={true} visible={isCalendarVisible} onRequestClose={() => setIsCalendarVisible(false)}>
        <View style={styles.modalBackground}>
          <View style={styles.calendarContainer}>
            <Calendar onDayPress={handleDayPress} />
            <TouchableOpacity onPress={() => setIsCalendarVisible(false)} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Include the City Selection Modal */}
      <PrayerLocationModal isVisible={isPrayerLocationModalVisible} onClose={() => setIsPrayerLocationModalVisible(false)} />

      <ExpandableButton
        onQiblatPress={() => router.push('/qiblat')}
        onDoaPress={() => router.push('/doa')}
        onCalendarPress={() => setIsCalendarVisible(!isCalendarVisible)}
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
  },
  spacing: {
    marginTop: 5,
  },
  prayerTimesContainer: {
    marginTop: 20,
    marginBottom: 20,
    gap: 15,
  },
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  calendarContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  closeButton: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#314340',
    borderRadius: 5,
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
  },
});

export default PrayerTab;
