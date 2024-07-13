import { View, Text, SafeAreaView, ActivityIndicator, StyleSheet, Image, TouchableOpacity, FlatList } from 'react-native'
import React, { useRef, useState, useCallback } from 'react'
import { useLocalSearchParams } from 'expo-router';
import { AVPlaybackStatus, Audio } from 'expo-av';
import { Ayah } from '../../../../hooks/useLoadQuranData';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../redux/store/store';

const SurahTextScreen = () => {
    const { surahDetails, translationDetails, isLoading } = useSelector((state: RootState) => state.quran);
    const [currentAyahIndex, setCurrentAyahIndex] = useState<number>(0);
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const soundRef = useRef<Audio.Sound | null>(null);
    const { id } = useLocalSearchParams<{ id: string }>();
    const surahNum = id ? parseInt(id as string, 10) : 1;
    const surah = surahDetails[surahNum];
    const translation = translationDetails[surahNum];

    const playNextAyah = useCallback(async (index: number) => {
        if (index >= surah!.ayahs.length) {
            setIsPlaying(false);
            return;
        }

        const ayah = surah!.ayahs[index];

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
    }, [surahDetails]);

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

    const renderAyah = useCallback(({ item, index }: { item: Ayah, index: number }) => (
        <View key={item.number} style={styles.ayahContainer}>
            <Text style={styles.quranText}>{item.text}</Text>
            {translationDetails && (
                <View style={styles.translationContainer}>
                    <Text style={styles.translationText}>{translation.ayahs[index]?.text}</Text>
                </View>
            )}
            <View style={styles.separator} />
        </View>
    ), [translationDetails]);

    return (
        <SafeAreaView style={{ backgroundColor: '#4D6561', flex: 1 }}>
            <View style={{ backgroundColor: '#4D6561', flex: 1 }}>
                {isLoading ? (
                    <ActivityIndicator />
                ) : (
                    surah && (
                        <View style={{ justifyContent: 'center', alignItems: 'center' }}>  
                            <View style={{ justifyContent: 'center', alignItems: 'center', paddingVertical: 20, borderRadius: 40, backgroundColor: '#D9D9D9', width: '50%', marginBottom: 20 }}>
                                <Text style={styles.surahName}>{surah.name}</Text>
                                <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', display: 'flex', gap: 10 }}>
                                    <Text style={styles.surahEnglishName}>{surah.englishName}</Text>
                                    <TouchableOpacity onPressIn={togglePlayPause}>
                                        <Image source={isPlaying ? require('../../../../assets/pause.png') : require('../../../../assets/play.png')} style={{ objectFit: 'contain', width: 28, height: 28 }} />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <FlatList 
                                data={surah.ayahs}
                                renderItem={renderAyah}
                                keyExtractor={(item) => item.number.toString()}
                                contentContainerStyle={styles.listContainer}
                                showsVerticalScrollIndicator={false}
                            />
                        </View>
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
        color: '#314340'
    },
    surahAudio: {
        fontFamily: 'Outfit_400Regular',
        fontWeight: '400',
        fontSize: 20,
        lineHeight: 21,
        color: '#000000',
    },
    quranText: {
        fontFamily: 'Amiri_400Regular',
        fontWeight: '400',
        color: '#FFFFFF',
        fontSize: 26,
        lineHeight: 48,
        textAlign: 'right',
        paddingHorizontal: 20
    },
    translationText: {
        fontFamily: 'Outfit_400Regular',
        fontWeight: '400',
        fontSize: 12,
        lineHeight: 15,
        color: '#FFFFFF',
        paddingHorizontal: 20
    },
    ayahContainer: {
        marginBottom: 20,
        gap: 10,
        paddingVertical: 10,
    },
    translationContainer: {
        width: '100%'
    },
    listContainer: {
        paddingTop: 20, 
    },
    separator: {
        width: '100%',
        height: 1,
        backgroundColor: '#FFFFFF'
    }
})


export default SurahTextScreen