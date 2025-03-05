import { View, Text, StyleSheet, ImageBackground, Platform, ScrollView, SafeAreaView } from 'react-native'
import React, { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'expo-router';

import ExpandableButton from '../../../components/prayer/ExpandableButton';

import { AppDispatch, RootState } from '../../../redux/store/store';
import { getFormattedDate, scaleSize } from '../../../utils';
import { usePrayerTimes } from '../../../hooks/usePrayerTimes'
import CurrentPrayerInfo from '../../../components/prayer/CurrentPrayerInfo';
import PrayerTimesList from '../../../components/prayer/PrayerTimesList';
import PrayerLocationModal from '../../../components/prayer/PrayerLocationModal';

import CustomClock from '../../../components/prayer/CustomClock';
import { useTheme } from '../../../context/ThemeContext';
import RamadanPrayerTimes from '../../../components/prayer/RamadanPrayerTimes';
import LocationInfo from '../../../components/prayer/LocationInfo';
import QuickAccessButtons from '../../../components/prayer/QuickAccessButtons';
import FastTracker from '../../../components/prayer/FastTracker';
import PuasaDoaCarousel from '../../../components/prayer/PuasaDoaCarousel';
import TerawihLocator from '../../../components/prayer/TerawihLocator';
import LastReadQuran from '../../../components/prayer/LastReadQuran';

import { ExtensionStorage } from "@bacons/apple-targets";
import { fetchPrayerTimesFromFirebase } from '../../../redux/slices/prayerSlice';
import { format } from 'date-fns';

const PrayerTab = () => {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const { prayerTimes, islamicDate, isLoading, selectedDate } = useSelector((state: RootState) => state.prayer);
  const { reminderInterval, ramadanMode } = useSelector((state: RootState) => state.userPreferences);
  const { currentPrayer, nextPrayerInfo, fetchAndScheduleNotifications, backgroundImage } = usePrayerTimes(prayerTimes, reminderInterval)
  const [isPrayerLocationModalVisible, setIsPrayerLocationModalVisible] = useState<boolean>(false);

  const widgetStorage = new ExtensionStorage("group.com.rihlah.prayerTimesWidget");

  useEffect(() => {
    const fetchAndStorePrayerTimes = async () => {
      try {
        // ✅ Step 1: Get today’s date in `d/M/yyyy` format
        const todayDate = format(new Date(), "d/M/yyyy");
        console.log("📅 Fetching prayer times for:", todayDate);

        // ✅ Step 2: Fetch prayer times from Firebase
        const response = await dispatch(fetchPrayerTimesFromFirebase({ inputDate: todayDate })).unwrap();

        if (response) {
          console.log("🟢 Fetched Prayer Times:", response);

          // ✅ Step 3: Store in widget storage
          widgetStorage.set("prayerTimesToday", JSON.stringify(response));
          console.log("📌 Stored in widget storage:", response);

          // ✅ Step 4: Reload the widget
          ExtensionStorage.reloadWidget();
          console.log("🔄 Widget reloaded!");
        } else {
          console.warn("❌ No prayer times fetched!");
        }
      } catch (error) {
        console.error("❌ Error fetching/storing prayer times:", error);
      }
    };

    fetchAndStorePrayerTimes();
  }, [dispatch]);

  // Add inside PrayerTab component
  useEffect(() => {
    fetchAndScheduleNotifications();
  }, [fetchAndScheduleNotifications]);

  // Format the selected date
  const formattedDate = useMemo(() => {
    const date = selectedDate ? new Date(selectedDate) : new Date();
    return getFormattedDate(date);
  }, [selectedDate])

  // Handle city press to open location modal
  const handleCityPress = () => {
    setIsPrayerLocationModalVisible(true);
  }

  if (ramadanMode) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.outerContainer}>
            {/* Left container (half the screen) with clock and current prayer info */}
            <View style={styles.leftContainer}>
              <LocationInfo />
              <View style={styles.prayerSessionContainer}>
                <CurrentPrayerInfo
                  currentPrayer={currentPrayer}
                  nextPrayerInfo={nextPrayerInfo}
                  isRamadanMode
                />
              </View>
            </View>

            {/* Right container placeholder - add additional components here in the future */}
            <View style={styles.rightContainer}>
              <QuickAccessButtons />
            </View>
          </View>
          <RamadanPrayerTimes />
          <TerawihLocator />
          <FastTracker />
          <PuasaDoaCarousel />
          <LastReadQuran />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <ImageBackground source={backgroundImage} style={styles.backgroundImage}>
      <View style={styles.mainContainer}>
        <View style={styles.centeredView}>
          <Text style={styles.dateText}>
            {selectedDate ? getFormattedDate(new Date(selectedDate)) : formattedDate}
          </Text>
          <CustomClock />
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
    </ImageBackground>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
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
    color: '#000000',
    textAlign: 'center',
  },
  islamicDateText: {
    fontFamily: 'Outfit_400Regular',
    fontSize: scaleSize(14),
    color: '#000000',
    textAlign: 'center',
    marginTop: Platform.OS === 'android' ? 5 : -10,
  },
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.primary,
  },
  contentContainer: {
    padding: theme.spacing.medium,
  },
  outerContainer: {
    flexDirection: 'row',
    padding: theme.spacing.medium,
    justifyContent: 'space-between',
  },
  leftContainer: {
    width: '35%',
    backgroundColor: theme.colors.secondary,
    borderRadius: theme.borderRadius.medium,
    padding: theme.spacing.medium,
    ...theme.shadows.default,
  },
  rightContainer: {
    width: '60%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clockContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.medium,
  },
  prayerSessionContainer: {
    alignItems: 'center',
  },
});

export default PrayerTab;