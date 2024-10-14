import { View, Text, ActivityIndicator, StyleSheet, Image, TouchableOpacity, FlatList, Alert } from 'react-native';
import React, { useRef, useState, useCallback, useContext, useEffect } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { AVPlaybackStatus, Audio } from 'expo-av';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../../../redux/store/store';
import { Bookmark, Surah } from '../../../../utils/types';
import BackArrow from '../../../../components/BackArrow';
import { ThemeContext } from '../../../../context/ThemeContext';
import { addBookmark, removeBookmark } from '../../../../redux/slices/quranSlice';
import { FontAwesome6 } from '@expo/vector-icons';
import { useActionSheet } from '@expo/react-native-action-sheet';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';

const SurahTextScreen = () => {
    const [currentAyahIndex, setCurrentAyahIndex] = useState<number>(0);
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const [surahFinished, setSurahFinished] = useState<boolean>(false);
    const [lastReadAyah, setLastReadAyah] = useState<{ surahNumber: number, ayahNumber: number } | null>(null);
    const soundRef = useRef<Audio.Sound | null>(null);
    const listRef = useRef<FlatList>(null);
    const { id, ayahIndex } = useLocalSearchParams<{ id: string, ayahIndex?: string }>();
    const { surahs, isLoading, bookmarks } = useSelector((state: RootState) => state.quran);
    const { isDarkMode } = useContext(ThemeContext);
    const { showActionSheetWithOptions } = useActionSheet();
    const surahNum = id ? parseInt(id as string, 10) : 1;
    const surah: Surah | undefined = surahs.find((surah: Surah) => surah.number === surahNum);
    const dispatch = useDispatch<AppDispatch>()

    const audioLinks = surah?.audioLinks ? surah.audioLinks.split(',') : [];

    const resetAudio = async () => {
        if (soundRef.current) {
            await soundRef.current.unloadAsync();
            soundRef.current = null;
        }
        setCurrentAyahIndex(0);
        setSurahFinished(false);
    }

    const playNextAyah = useCallback(
        async (index: number) => {
            if (!surah || index >= audioLinks.length) {
                setIsPlaying(false);
                setSurahFinished(true);
                resetAudio();
                return;
            }

            const ayahAudioLink = audioLinks[index].trim();

            try {
                if (soundRef.current) {
                    await soundRef.current.unloadAsync();  // Unload previous sound
                }

                const { sound } = await Audio.Sound.createAsync(
                    { uri: ayahAudioLink },
                    { shouldPlay: true }
                );
                soundRef.current = sound;

                sound.setOnPlaybackStatusUpdate(async (status: AVPlaybackStatus) => {
                    if (status.isLoaded && status.didJustFinish) {
                        playNextAyah(index + 1);  // Play the next Ayah
                    }
                });

                setCurrentAyahIndex(index);  // Track the current Ayah
            } catch (error) {
                console.error('Failed to play Ayah: ', error);
            }
        },
        [surah, audioLinks]
    );

    const togglePlayPause = useCallback(async () => {
        if (surahFinished) {
            await resetAudio();
            playNextAyah(0);
            setIsPlaying(true);
        } else if (soundRef.current) {
            const status = await soundRef.current.getStatusAsync();
            if (status.isLoaded) {
                try {
                    if (status.isPlaying) {
                        await soundRef.current.pauseAsync();
                        setIsPlaying(false);
                    } else {
                        await soundRef.current.playAsync();
                        setIsPlaying(true);
                    }
                } catch (error) {
                    console.error('Error toggling play/pause: ', error);
                }
            }
        } else {
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: false,
                playsInSilentModeIOS: true,
                shouldDuckAndroid: true,
                playThroughEarpieceAndroid: false,
                staysActiveInBackground: true,
            });

            playNextAyah(currentAyahIndex || 0);  // Start playing from the first Ayah
            setIsPlaying(true);
        }
    }, [playNextAyah, currentAyahIndex, surahFinished]);

    // Toggle bookmark for the current Ayah
    const toggleBookmark = (ayahNumber: number) => {
        const isBookmarked = bookmarks.some(
            (bookmark) => bookmark.surahNumber === surahNum && bookmark.ayahNumber === ayahNumber
        );

        const bookmark: Bookmark = {
            surahNumber: surahNum,
            ayahNumber,
            surahName: surah?.englishName || 'Unknown Surah'
        }

        if (isBookmarked) {
            dispatch(removeBookmark(bookmark));
        } else {
            dispatch(addBookmark(bookmark));
        }
    }

    // Function to open action menu for each ayah
    const openAyahOptions = (ayahIndex: number) => {
        const options = ['Cancel', 'Mark as Last Read']
        const cancelButtonIndex = 0;

        showActionSheetWithOptions(
            {
                options,
                cancelButtonIndex
            },
            (buttonIndex) => {
                if (buttonIndex === 1) {
                    // Check if user is authenticated
                    markAsLastRead(surahNum, ayahIndex + 1)
                }
            }
        )
    }

    const markAsLastRead = async (surahNumber: number, ayahNumber: number) => {
        try {
            const lastReadData = {
                surahNumber,
                ayahNumber,
                data: new Date().toISOString()
            };
            await AsyncStorage.setItem('lastReadAyah', JSON.stringify(lastReadData));
            setLastReadAyah({ surahNumber, ayahNumber });  // Update local state
            Alert.alert('Success!', `Marked surah ${surahNumber}, ayah ${ayahNumber} as last read.`)
        } catch (error) {
            console.error('Failed to mark as last read: ', error);
            Alert.alert('Error', 'Failed to mark as last read. Please try again.')
        }
    };

    // Function to load the last read ayah from AsyncStorage
    const loadLastReadAyah = async () => {
        try {
            const storedLastRead = await AsyncStorage.getItem('lastReadAyah');
            if (storedLastRead) {
                const parsedLastRead = JSON.parse(storedLastRead);
                setLastReadAyah(parsedLastRead);
            }
        } catch (error) {
            console.error('Failed to load last read ayah:', error);
        }
    };

    // Load the last read ayah when the component mounts
    useEffect(() => {
        loadLastReadAyah();
    }, []);

    const renderAyah = ({ item, index }: { item: string, index: number }) => {
        const isBookmarked = bookmarks.some(
            (bookmark) => bookmark.surahNumber === surahNum && bookmark.ayahNumber === index + 1
        )
        const isLastRead = lastReadAyah?.surahNumber === surahNum && lastReadAyah?.ayahNumber === index + 1;
        // Determine the text color based on the theme and whether the Ayah is active
        const ayahTextColor = index === currentAyahIndex
        ? (isDarkMode ? '#F0DBA0' : '#F4E2C1')  // Highlighted text color
        : (isDarkMode ? '#ECDFCC' : '#FFFFFF');  // Regular text color

        return (
            <View key={index} style={styles.ayahContainer}>
                {/* Bookmark Icon */}
                <TouchableOpacity onPress={() => toggleBookmark(index + 1)} style={{ paddingLeft: 20 }}>
                    <FontAwesome6 
                        name="bookmark"
                        size={24}
                        solid={isBookmarked}
                        color={isBookmarked ? 'white' : 'gray'}
                    />
                </TouchableOpacity>
                <Text style={[styles.quranText, { color: ayahTextColor }]}>{item}</Text>
                {surah?.englishTranslation && (
                    <View style={styles.translationContainer}>
                        <Text style={[styles.translationText, { color: ayahTextColor }]}>{surah.englishTranslation.split('|')[index]}</Text>
                    </View>
                )}

                {/* Three Dots Icon for extra options */}
                {isLastRead ? (
                    <View style={{ paddingLeft: 20, flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                        <FontAwesome6 name="check-double" size={20} color="#CCC" />
                        <Text style={{ fontFamily: "Outfit_400Regular", color: '#CCC' }}>Last read</Text>
                    </View>
                ): (
                    <TouchableOpacity onPress={() => openAyahOptions(index)} style={{ paddingLeft: 20 }}>
                    <FontAwesome6 name="ellipsis" size={20} color={isDarkMode ? '#ECDFCC' : '#FFFFFF'} />
                </TouchableOpacity>
                )}

                <View style={[styles.separator, { backgroundColor: isDarkMode ? '#ECDFCC' :'#FFFFFF' }]} />
            </View>
        )
    };

    useEffect(() => {
        if (listRef.current) {
            listRef.current.scrollToIndex({
                index: currentAyahIndex,
                animated: true,
                viewPosition: 0.5
            });
        }
    }, [currentAyahIndex]);

    if (!surah) {
        return (
            <SafeAreaView style={{ backgroundColor: '#4D6561', flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 }}>
                <Text style={{ color: '#FFF' }}>Surah not found</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.mainContainer, { backgroundColor: isDarkMode ? "#1E1E1E" : "#4D6561" }]}>
            <View style={[styles.contentContainer, { backgroundColor: isDarkMode ? "#1E1E1E" : "#4D6561" }]}>
                {isLoading ? (
                    <ActivityIndicator />
                ) : (
                    <View style={{ flex: 1 }}>
                        <View style={styles.bodyContainer}>
                            <View style={[styles.headerContainer, { backgroundColor: isDarkMode ? "#ECDFCC" : "#D9D9D9" }]}>
                                <Text style={styles.surahName}>{surah.arabicName}</Text>
                                <View style={styles.ayahContentContainer}>
                                    <Text style={styles.surahEnglishName}>{surah.englishName}</Text>
                                    <TouchableOpacity onPressIn={togglePlayPause}>
                                        <Image 
                                            source={isPlaying ? require('../../../../assets/pause.png') : require('../../../../assets/play.png')} 
                                            style={styles.playIcon} 
                                        />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <FlatList
                                ref={listRef}
                                data={surah.arabicText ? surah.arabicText.split('|') : []}
                                renderItem={renderAyah}
                                initialScrollIndex={currentAyahIndex}
                                windowSize={5}
                                keyExtractor={(item, index) => index.toString()}
                                contentContainerStyle={styles.listContainer}
                                showsVerticalScrollIndicator={false}
                            />
                        </View>

                        <View style={{ position: 'absolute', left: 16 }}>
                            <BackArrow />
                        </View>
                    </View>
                )}
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1, 
        paddingTop: 30
    },
    contentContainer: {
        flex: 1
    },
    bodyContainer: {
        justifyContent: 'center', 
        alignItems: 'center'
    },
    headerContainer: {
        justifyContent: 'center', 
        alignItems: 'center', 
        paddingVertical: 20,
        borderRadius: 40, 
        backgroundColor: '#D9D9D9', 
        width: '50%', 
        marginBottom: 20
    },
    ayahContentContainer: {
        flexDirection: 'row', 
        justifyContent: 'center', 
        alignItems: 'center', 
        display: 'flex', 
        gap: 10
    },
    playIcon: {
        objectFit: 'contain', 
        width: 28, 
        height: 28
    },
    surahName: {
        fontFamily: 'Amiri_400Regular',
        fontWeight: '400',
        fontSize: 30,
        lineHeight: 48,
        color: '#314340',
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
        paddingBottom: 50,
    },
    separator: {
        width: '100%',
        height: 1,
    },
});

export default SurahTextScreen;