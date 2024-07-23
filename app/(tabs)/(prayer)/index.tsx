import { View, Text, StyleSheet, ImageBackground, Dimensions } from 'react-native'
import React, { useCallback, useMemo } from 'react'

import Clock from 'react-live-clock';
import { getFormattedDate } from '../../../utils';
import PrayerTimeItem from '../../../components/PrayerTimeItem';
import { useRouter } from 'expo-router';

import SubuhBackground from '../../../assets/subuh-background.png';
import ZuhurBackground from '../../../assets/zuhr-background.png';
import MaghribBackground from '../../../assets/maghrib-background.png';
import IshaBackground from '../../../assets/isya-background.png';
import AsrBackground from '../../../assets/asar-background.png';

import { useSelector } from 'react-redux';
import { RootState } from '../../../redux/store/store';
import RoundButton from '../../../components/RoundButton';

interface PrayerTimes {
  Fajr: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
  [key: string]: string;
}

const PrayerTab = () => {
  const router = useRouter();
  const { prayerTimes, islamicDate, currentPrayer, nextPrayerInfo, isLoading } = useSelector((state: RootState) => state.prayer);
  const desiredPrayers: (keyof PrayerTimes)[] = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha']

  const currentDate = useMemo(() => new Date(), []);
  const formattedDate = useMemo(() => getFormattedDate(currentDate), [currentDate]);
  
  const getBackgroundImage = () => {
    switch (currentPrayer) {
      case 'Subuh':
        return SubuhBackground;
      case 'Zuhur':
        return ZuhurBackground;
      case 'Asr':
        return AsrBackground;
      case 'Maghrib':
        return MaghribBackground;
      case 'Isha':
        return IshaBackground;
      default:
        return SubuhBackground;
    }
  }

  const getTextStyle = () => {
    return currentPrayer === 'Isha' ? styles.ishaText: {};
  }

  const handleQiblatPress = useCallback(() => {
    router.push("/qiblat")
  }, [router]);

  const handleDoaPress = useCallback(() => {
    router.push("/doa")
  }, [router]);

  return (
    <ImageBackground source={getBackgroundImage()} style={styles.backgroundImage} >
        <View style={styles.mainContainer}>
          <View style={styles.centeredView}>
            <Text style={[styles.dateText, getTextStyle(), { marginBottom: -30 }]}>{formattedDate}</Text>
            <Text style={styles.clockText}>
              <Clock 
                format={'HH:mm'} 
                timezone={'Asia/Singapore'} 
                element={Text} 
                ticking={true} 
                interval={60}
              />
            </Text>
            <Text style={[styles.dateText, getTextStyle(), { marginTop: -25 }]}>{islamicDate}</Text>
          </View>

          <View style={styles.bottomView}>
            <Text style={[styles.nextPrayerText, getTextStyle()]}>{currentPrayer}</Text>
            <Text style={[styles.dateText, getTextStyle(), styles.spacing]}>{nextPrayerInfo?.timeUntilNextPrayer} until {nextPrayerInfo?.nextPrayer}</Text>
          </View>

          <View style={styles.prayerTimesContainer}>
            {prayerTimes ? (
              <>
                {desiredPrayers.map((prayer) => (
                  <PrayerTimeItem key={prayer} name={prayer as string} time={prayerTimes[prayer]} style={getTextStyle()} />
                ))}
              </>
            ) : (
              <Text>Loading...</Text>
            )} 
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <RoundButton
            iconName="compass"
            onPress={handleQiblatPress}
            style={{ top: screenHeight * 0.10 }}
            size={24} 
          />

          <RoundButton
            iconName="hands-praying"
            onPress={handleDoaPress}
            style={{ top: screenHeight * 0.15 }}
            size={24} 
          />
        </View>
    </ImageBackground>
  )
}

// Get screen width for scaling
const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;

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
    alignItems: 'center'
  },
  centeredView: {
    alignItems: 'center',
    marginBottom: 50,
  },
  bottomView: {
     alignItems: 'flex-start'
  },
  dateText: {
    fontFamily: 'Outfit_400Regular',
    fontSize: scaleSize(16),
    lineHeight: scaleSize(21) * 1.3,
    color: '#314340',
    textAlign: 'center',
  },
  clockText: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: scaleSize(64),
    lineHeight: scaleSize(96) * 1.5,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  nextPrayerText: {
    fontFamily: 'Outfit_400Regular',
    fontSize: scaleSize(24),
    lineHeight: scaleSize(36),
    color: '#314340'
  },
  spacing: {
    marginTop: 5
  },
  ishaText: {
    color: '#C3F0E9'
  },
  prayerTimesContainer: {
    marginTop: 40,
    marginBottom: 20,
    gap: 15
  },
  buttonContainer: {
    position: 'absolute',
    right: 20,
    top: -20
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DFF3E3',
    borderRadius: 25,
    padding: 10,
    marginBottom: -30
  }
})

export default PrayerTab