import { View, Text, SafeAreaView, StyleSheet, ImageBackground } from 'react-native'
import React, { useEffect, useState } from 'react'

import Clock from 'react-live-clock';
import { formatIslamicDate, getFormattedDate, getPrayerTimesInfo, getShortFormattedDate } from '../../utils';
import { fetchIslamicDate, fetchPrayerTimes } from '../../api/prayers';
import PrayerTimeItem from '../../components/PrayerTimeItem';

import SubuhBackground from '../../assets/subuh-background.png';
import ZuhurBackground from '../../assets/zuhr-background.png';
import MaghribBackground from '../../assets/maghrib-background.png';
import IshaBackground from '../../assets/isya-background.png';

interface PrayerTimes {
  Fajr: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
}

const PrayerTab = () => {
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimes | null>(null);
  const [islamicDate, setIslamicDate] = useState<string | null>(null);
  const [currentPrayer, setCurrentPrayer] = useState<string | null>(null);
  const [nextPrayerInfo, setNextPrayerInfo] = useState<{ nextPrayer: string, timeUntilNextPrayer: string } | null>(null);
  const desiredPrayers: (keyof PrayerTimes)[] = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha']

  const currentDate = new Date();
  const formattedDate = getFormattedDate(currentDate);
  const shortFormattedDate = getShortFormattedDate(currentDate);

  useEffect(() => {
    const getPrayerTimes = async () => {
      try {
        const data = await fetchPrayerTimes();
        const { Fajr, Dhuhr, Asr, Maghrib, Isha } = data.data.timings;
        setPrayerTimes({ Fajr, Dhuhr, Asr, Maghrib, Isha });

        const islamicDateData = await fetchIslamicDate(shortFormattedDate);
        const formattedIslamicDate = formatIslamicDate(islamicDateData.data.hijri.date)
        setIslamicDate(formattedIslamicDate);

        const { currentPrayer, nextPrayer, timeUntilNextPrayer } = getPrayerTimesInfo({ Fajr, Dhuhr, Asr, Maghrib, Isha }, currentDate);
        setCurrentPrayer(currentPrayer);
        setNextPrayerInfo({ nextPrayer, timeUntilNextPrayer });
      } catch (error) {
        console.log(error)
      }
    }

    getPrayerTimes();
  }, [])

  const getBackgroundImage = () => {
    switch (currentPrayer) {
      case 'Subuh':
        return SubuhBackground;
      case 'Zuhur':
        return ZuhurBackground;
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

  return (
    <ImageBackground source={getBackgroundImage()} style={styles.backgroundImage} >
        <View style={{ flex: 1, height: '100%', width: '100%', alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ alignItems: 'center', justifyContent: 'center', top: -50 }}>
            <Text style={[styles.dateText, getTextStyle()]}>{formattedDate}</Text>
            <Text style={styles.clockText}>
              <Clock format={'HH:mm'} timezone={'Asia/Singapore'} element={Text} ticking={true} interval={60}  />
            </Text>
            <Text style={[styles.dateText, getTextStyle()]}>{islamicDate}</Text>
          </View>

          <View>
            <Text style={[styles.nextPrayerText, getTextStyle()]}>{currentPrayer}</Text>
            <Text style={[styles.dateText, getTextStyle(), { top: 5 }]}>{nextPrayerInfo?.timeUntilNextPrayer} until {nextPrayerInfo?.nextPrayer}</Text>
          </View>

          <View style={{ gap: 20, top: 40 }}>
            {prayerTimes ? (
              <>
                {desiredPrayers.map((prayer) => (
                  <PrayerTimeItem key={prayer} name={prayer} time={prayerTimes[prayer]} style={getTextStyle()} />
                ))}
              </>
            ) : (
              <Text>Loading...</Text>
            )}
          </View>
        </View>
    </ImageBackground>
  )
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    resizeMode: 'cover',
    justifyContent: 'center'
  },
  dateText: {
    fontFamily: 'Outfit_400Regular',
    fontWeight: 400,
    fontSize: 14,
    lineHeight: 21,
    color: '#314340',
    marginVertical: -7
  },
  clockText: {
    fontFamily: 'Outfit_600SemiBold',
    fontWeight: 600,
    fontSize: 64,
    lineHeight: 96,
    color: '#FFFFFF'
  },
  nextPrayerText: {
    fontFamily: 'Outfit_400Regular',
    fontWeight: 400,
    fontSize: 24,
    lineHeight: 36,
    color: '#314340'
  },
  ishaText: {
    color: '#C3F0E9'
  }
})

export default PrayerTab