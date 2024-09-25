import { View, Text, SafeAreaView, ActivityIndicator, StyleSheet, Image, TouchableOpacity, FlatList } from 'react-native';
import React, { useRef, useState, useCallback } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { AVPlaybackStatus, Audio } from 'expo-av';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../redux/store/store';
import { Surah } from '../../../../utils/types';

const SurahTextScreen = () => {
    const { surahs, isLoading } = useSelector((state: RootState) => state.quran);
    const [currentAyahIndex, setCurrentAyahIndex] = useState<number>(0);
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const soundRef = useRef<Audio.Sound | null>(null);
    const { id } = useLocalSearchParams<{ id: string }>();
    const surahNum = id ? parseInt(id as string, 10) : 1;
    const surah: Surah | undefined = surahs.find((surah: Surah) => surah.number === surahNum);

    if (surah) {
        console.log("Surah found:", surah);
        console.log("Arabic Text:", surah.arabicText);
        console.log("English Translation:", surah.englishTranslation);
    } else {
        console.log("Surah not found");
    }

    const playNextAyah = useCallback(async (index: number) => {
        if (!surah || index >= surah.numberOfAyahs) {
            setIsPlaying(false);
            return;
        }

        const audioLinks = surah.audioLinks ? surah.audioLinks.split(',') : [];
        const ayahAudioLink = audioLinks[index];

        try {
            if (soundRef.current) {
                await soundRef.current.unloadAsync();
            }

            const { sound } = await Audio.Sound.createAsync(
                { uri: ayahAudioLink },
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
    }, [surah]);

    const togglePlayPause = useCallback(async () => {
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
    }, [isPlaying, playNextAyah]);

    const renderAyah = ({ item, index }: { item: string, index: number }) => (
        <View key={index} style={styles.ayahContainer}>
            <Text style={styles.quranText}>{item}</Text>
            {surah && surah.englishTranslation && (
                <View style={styles.translationContainer}>
                    <Text style={styles.translationText}>{surah.englishTranslation.split('|')[index]}</Text>
                </View>
            )}
            <View style={styles.separator} />
        </View>
    );

    if (!surah) {
        return (
            <SafeAreaView style={{ backgroundColor: '#4D6561', flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 }}>
                <Text style={{ color: '#FFF' }}>Surah not found</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={{ backgroundColor: '#4D6561', flex: 1, paddingTop: 30 }}>
            <View style={{ backgroundColor: '#4D6561', flex: 1 }}>
                {isLoading ? (
                    <ActivityIndicator />
                ) : (
                    <View style={{ flex: 1 }}>
                        <View style={{ justifyContent: 'center', alignItems: 'center' }}>
                            <View style={{ justifyContent: 'center', alignItems: 'center', paddingVertical: 20, borderRadius: 40, backgroundColor: '#D9D9D9', width: '50%', marginBottom: 20 }}>
                                <Text style={styles.surahName}>{surah.arabicName}</Text>
                                <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', display: 'flex', gap: 10 }}>
                                    <Text style={styles.surahEnglishName}>{surah.englishName}</Text>
                                    <TouchableOpacity onPressIn={togglePlayPause}>
                                        <Image source={isPlaying ? require('../../../../assets/pause.png') : require('../../../../assets/play.png')} style={{ objectFit: 'contain', width: 28, height: 28 }} />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <FlatList
                                data={surah.arabicText ? surah.arabicText.split('|') : []}
                                renderItem={renderAyah}
                                keyExtractor={(item, index) => index.toString()}
                                contentContainerStyle={styles.listContainer}
                                showsVerticalScrollIndicator={false}
                                />
                        </View>
                    </View>
                )}
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    surahName: {
        fontFamily: 'Amiri_400Regular',
        fontWeight: '400',
        fontSize: 30,
        lineHeight: 48,
    },
    surahEnglishName: {
        fontFamily: 'Outfit_500Medium',
        fontWeight: '500',
        fontSize: 20,
        lineHeight: 30,
        color: '#314340',
    },
    quranText: {
        fontFamily: 'Amiri_400Regular',
        fontWeight: '400',
        color: '#FFFFFF',
        fontSize: 26,
        lineHeight: 48,
        textAlign: 'right',
        paddingHorizontal: 20,
    },
    translationText: {
        fontFamily: 'Outfit_400Regular',
        fontWeight: '400',
        fontSize: 12,
        lineHeight: 15,
        color: '#FFFFFF',
        paddingHorizontal: 20,
    },
    ayahContainer: {
        marginBottom: 20,
        gap: 10,
        paddingVertical: 10,
    },
    translationContainer: {
        width: '100%',
    },
    listContainer: {
        paddingBottom: 50
    },
    separator: {
        width: '100%',
        height: 1,
        backgroundColor: '#FFFFFF',
    },
});

export default SurahTextScreen;
