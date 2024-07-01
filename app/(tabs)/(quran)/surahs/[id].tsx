import { View, Text, SafeAreaView, ScrollView, ActivityIndicator, StyleSheet, Image, TouchableOpacity } from 'react-native'
import React, { useEffect, useRef, useState } from 'react'
import { useLocalSearchParams } from 'expo-router';
import { fetchSurahText } from '../../../../api/surahs';
import { AVPlaybackStatus, Audio } from 'expo-av';

type Ayah = {
    number: number;
    text: string;
    audio: string;
}

type SurahDetails = {
    number: number;
    name: string;
    englishName: string;
    englishNameTranslation: string;
    revelationType: string;
    ayahs: Ayah[];
}

const SurahTextScreen = () => {
    const [surahDetails, setSurahDetails] = useState<SurahDetails | null>(null);
    const [currentAyahIndex, setCurrentAyahIndex] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(true);
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const soundRef = useRef<Audio.Sound | null>(null);
    const { id } = useLocalSearchParams<{ id: string }>();
    const surahNum = id ? parseInt(id as string, 10) : 1;

    useEffect(() => {
        const loadSurahText = async () => {
            try {
                const data = await fetchSurahText(surahNum);
                setSurahDetails(data.data);
            } catch (error) {
                console.error('Failed to load surah text: ', error)
            } finally {
                setLoading(false);
            }
        }

        loadSurahText();
    }, [surahNum]);

    const playNextAyah = async (index: number) => {
        if (index >= surahDetails!.ayahs.length) {
            setIsPlaying(false);
            return
        }

        const ayah = surahDetails!.ayahs[index];
        // console.log(ayah);
        try {
            if (soundRef.current) {
                await soundRef.current.unloadAsync();
            }

            const { sound } = await Audio.Sound.createAsync(
                { uri: ayah.audio },
                { shouldPlay: true }
            );
            soundRef.current = sound;

            sound.setOnPlaybackStatusUpdate((status: AVPlaybackStatus) => {
                if (status.isLoaded && !status.isPlaying && !status.isBuffering && (status as any).didJustFinish) {
                    playNextAyah(index + 1);
                }
            });

            setCurrentAyahIndex(index);
        } catch (error) {
            console.error('Failed to play recitation: ', error);
        }
    }

    const togglePlayPause = async () => {
        if (soundRef.current) {
            if (isPlaying) {
                await soundRef.current.pauseAsync();
                setIsPlaying(false);
            } else {
                await soundRef.current.playAsync();
                setIsPlaying(true);
            }
        } else {    
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: false,
                playsInSilentModeIOS: true,
                shouldDuckAndroid: true,
                playThroughEarpieceAndroid: false,
                staysActiveInBackground: true,
            });

            playNextAyah(0);
            setIsPlaying(true);
        }
    }

    return (
        <SafeAreaView style={{ backgroundColor: '#4D6561' }}>
            <View style={{ backgroundColor: '#4D6561', height: '100%' }}>
                {loading ? (
                    <ActivityIndicator />
                ) : (
                    surahDetails && (
                        <>
                            <View style={{ justifyContent: 'center', alignItems: 'center', gap: 2, top: 10 }}>
                                <Text style={styles.surahName}>{surahDetails.name}</Text>
                                <Text style={styles.surahEnglishName}>{surahDetails.englishName}</Text>
                            </View>

                            <View style={{ width: '100%', height: 28, backgroundColor: '#D0D0D0', top: 30, flexDirection: 'row', alignItems: 'center' }}>
                                <Text style={styles.surahAudio}>{surahNum}. {surahDetails.englishName}</Text>
                                <TouchableOpacity style={{ left: 20 }} onPress={togglePlayPause}>
                                    <Image source={isPlaying ? require('../../../../assets/pause.png') : require('../../../../assets/play.png')} style={{ objectFit: 'contain', width: 18, height: 18 }} />
                                </TouchableOpacity>
                            </View>
                            <ScrollView style={{ overflow: 'hidden', top: 50, right: 10, width: 383 }} showsVerticalScrollIndicator={false}>
                            {surahDetails.ayahs.map((ayah) => (
                                <View key={ayah.number} style={{ marginBottom: 20 }}>
                                    <Text style={styles.quranText}>{ayah.text}</Text>
                                </View>
                            ))}
                            </ScrollView>
                        </>
                    )
                )}
            </View>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    surahName: {
        fontFamily: 'Amiri_400Regular',
        fontWeight: '400',
        fontSize: 30,
        lineHeight: 48
    },
    surahEnglishName: {
        fontFamily: 'Outfit_500Medium',
        fontWeight: '500',
        fontSize: 20,
        lineHeight: 30,
        color: '#D7E4E2'
    },
    surahAudio: {
        fontFamily: 'Outfit_400Regular',
        fontWeight: '400',
        fontSize: 14,
        lineHeight: 15,
        color: '#000000',
        left: 10
    },
    quranText: {
        fontFamily: 'Amiri_400Regular',
        fontWeight: '400',
        color: '#FFFFFF',
        fontSize: 30,
        lineHeight: 48,
        textAlign: 'right'
    }
})

export default SurahTextScreen