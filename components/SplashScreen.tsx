import { View, Text, ActivityIndicator, StyleSheet } from 'react-native'
import React, { useEffect, useState } from 'react'
import * as SplashScreen from 'expo-splash-screen';
import { Asset } from 'expo-asset';
import { fetchIslamicDate, fetchPrayerTimes } from '../api/prayers';
import { getBidetLocations, getMosqueLocations } from '../api/firebase';
import { fetchSurahText, fetchSurahs } from '../api/surahs';
import { useGlobalState } from './GlobalStateProvider';

interface SplashScreenComponentProps {
    onLoadingComplete: () => void;
}

const SplashScreenComponent = ({ onLoadingComplete }: SplashScreenComponentProps) => {
    const [isLoadingComplete, setIsLoadingComplete] = useState(false);

    const { setPrayerTimes, setIslamicDate, setBidetLocations, setMosqueLocations, setSurahs, setSurahTexts } = useGlobalState();

    useEffect(() => {
        async function loadResourcesAndDataAsync() {
            try {
                SplashScreen.preventAutoHideAsync();

                // Load assets
                const images = [
                    require('../assets/splash.png'),
                ]

                const cacheImages = images.map(image => Asset.fromModule(image).downloadAsync());
                await Promise.all(cacheImages);

                const [prayerTimes, islamicDate, bidetLocations, mosqueLocations, surahs] = await Promise.all([
                    fetchPrayerTimes(),
                    fetchIslamicDate(shortFormattedDate),
                    getBidetLocations(userCoordinates),
                    getMosqueLocations(userCoordinates),
                    fetchSurahs()
                  ]);
          
                  const surahTexts = await Promise.all(surahs.data.map((surah: any) => fetchSurahText(surah.number)));
          
                  setPrayerTimes(prayerTimes.data.timings);
                  setIslamicDate(islamicDate.data.hijri.date);
                  setBidetLocations(bidetLocations);
                  setMosqueLocations(mosqueLocations);
                  setSurahs(surahs.data);
                  setSurahTexts(surahTexts);

                onLoadingComplete();
            } catch (error) {
                console.warn(error);
            } finally {
                setIsLoadingComplete(true);
                SplashScreen.hideAsync();
            }
        }

        loadResourcesAndDataAsync();
    }, [shortFormattedDate, userCoordinates])

    return (
        <View style={styles.container}>
          <Text>Loading...</Text>
          <ActivityIndicator size="large" color="#0000ff" />
        </View>
      );
    };
    
    const styles = StyleSheet.create({
      container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#ffffff',
      },
    });

export default SplashScreenComponent