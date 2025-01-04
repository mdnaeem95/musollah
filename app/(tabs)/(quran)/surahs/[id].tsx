import { View, Text, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
import React, { useRef, useState, useCallback, useContext, useEffect, useLayoutEffect } from 'react';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../../../redux/store/store';
import { Bookmark, Surah } from '../../../../utils/types';
import { ThemeContext } from '../../../../context/ThemeContext';
import { addBookmark, removeBookmark } from '../../../../redux/slices/quranSlice';
import { FontAwesome6 } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FlashList } from '@shopify/flash-list';
import TrackPlayer, { Event } from 'react-native-track-player';
import { PlayPauseButton } from '../../../../components/AyahPlayPauseButton';
import { FloatingPlayer } from '../../../../components/FloatingPlayer';
import { reciterOptions } from '../../../../utils/constants';
import BookmarkIcon from '../../../../components/BookmarkIcon';

// Utility functions for bookmarking and marking read Ayahs
const toggleItemInArray = (arr: number[], item: number) => (
    arr.includes(item) ? arr.filter(num => num !== item) : [...arr, item]
);

const SurahTextScreen = () => {
    const router = useRouter();
    const navigation = useNavigation();
    const dispatch = useDispatch<AppDispatch>()
    const listRef = useRef<FlashList<any>>(null);
    const { ayahIndex } = useLocalSearchParams();
    const { id } = useLocalSearchParams<{ id: string, ayahIndex?: string }>();
    const { surahs, isLoading, bookmarks } = useSelector((state: RootState) => state.quran);

    const surahNum = id ? parseInt(id as string, 10) : 1;
    const surah: Surah | undefined = surahs.find((surah: Surah) => surah.number === surahNum);

    const arabicAyahs = surah?.arabicText ? surah.arabicText.split('|') : [];
    const englishTranslations = surah?.englishTranslation ? surah.englishTranslation.split('|') : [];
    const initialLinks = surah?.audioLinks ? surah.audioLinks.split(',').map(link => link.replace('ar.alafasy', reciter)): [];

    const [currentAyahIndex, setCurrentAyahIndex] = useState<number>(0);
    const [readAyahs, setReadAyahs] = useState<number[]>([]);
    const [selectedSurah, setSelectedSurah] = useState<number>(surahNum);
    const [isPickerVisible, setPickerVisible] = useState<boolean>(false);
    const [audioLinks, setAudioLinks] = useState<string[]>(initialLinks);

    const { theme, isDarkMode, textSize, reciter } = useContext(ThemeContext);
    const activeTheme = isDarkMode ? theme.dark : theme.light;
    
    const generateTracks = (surah: Surah, reciter: string) => {
        return surah.arabicText.split('|').map((ayah, index) => {
        const rawUrl = surah.audioLinks.split(',')[index]?.replace('ar.alafasy', reciter);
        const trimmedUrl = rawUrl?.trim(); // Ensure no extra spaces
        return {
            id: `${surah.number}-${index + 1}`,
            url: trimmedUrl || '',
            title: `${surah.englishName}, Ayah ${index + 1}`,
            artist: reciterOptions.find(option => option.value === reciter)?.label || 'Unknown Reciter',
        }
        });
    };
    
    // Add tracks and handle autoplay
    useEffect(() => {
        const setupTracks = async () => {
            try {
                const tracks = generateTracks(surah!, reciter);
                await TrackPlayer.reset();
                await TrackPlayer.add(tracks);
            } catch (error) {
                console.error('Error setting up tracks:', error);
            }
        };
        setupTracks();
    }, [surah, reciter]);

    // Load `readAyahs` from AsyncStorage when the Surah screen loads
    useEffect(() => {
        const loadReadAyahs = async () => {
            const savedReadAyahs = await AsyncStorage.getItem(`readAyahs_${surahNum}`);
            if (savedReadAyahs) {
                setReadAyahs(JSON.parse(savedReadAyahs));
            }
        };

        loadReadAyahs();
    }, [surahNum]);

    // Save `readAyahs` to AsyncStorage whenever it changes
    useEffect(() => {
        AsyncStorage.setItem(`readAyahs_${surahNum}`, JSON.stringify(readAyahs));
    }, [readAyahs, surahNum]);

    useEffect(() => {
        //@ts-ignore
        const onTrackChange = TrackPlayer.addEventListener('playback-track-changed', async ({ nextTrack }) => {
            if (nextTrack !== null) {
                setCurrentAyahIndex(nextTrack); 

                const queue = await TrackPlayer.getQueue();
                const activeTrack = queue[nextTrack];

                if (activeTrack) {
                    // Save the last listened Ayah to AsyncStorage
                    await AsyncStorage.setItem('lastListenedAyah', JSON.stringify({
                        surahNumber: parseInt(activeTrack.id.split('-')[0], 10), // Extract Surah number from ID
                        ayahIndex: parseInt(activeTrack.id.split('-')[1], 10), // Extract Ayah index from ID
                    }));
    
                    console.log('Saved last listened Ayah:', activeTrack.title);
                }

                listRef.current?.scrollToIndex({
                    index: nextTrack,
                    animated: true,
                    viewPosition: 0.5, 
                });
            }
        });

        const onQueueEnd = TrackPlayer.addEventListener(Event.PlaybackQueueEnded, async ({ position }) => {
            if (position !== null) {
                const queue = await TrackPlayer.getQueue();
                if (queue.length > 0) {
                        await TrackPlayer.skip(0);
                        setCurrentAyahIndex(0); 
                }
                listRef.current?.scrollToIndex({
                    index: 0
                })
            }
        });

        return () => {
            onTrackChange.remove();
            onQueueEnd.remove();
        };
    }, []);
      
    // Set the dynamic title in the header
    useLayoutEffect(() => {
        if (surah) {
            navigation.setOptions({
                headerTitle: () => (
                    <View style={styles.headerContainer}>
                        <Text style={[styles.headerText, { color: activeTheme.colors.text.primary }]}>
                            {surah.englishName}
                        </Text>
                        <TouchableOpacity onPress={togglePickerVisibility}>
                            <FontAwesome6
                                name={isPickerVisible ? "chevron-up" : "chevron-down"}
                                size={20}
                                color={activeTheme.colors.text.primary}
                            />
                        </TouchableOpacity>
                    </View>
                ),
            });
        }
    }, [navigation, surah, isPickerVisible, activeTheme]);

    const togglePickerVisibility = () => {
        setPickerVisible(prev => !prev);
    };

    const handleSurahChange = (surahNumber: number) => {
        if (surahNumber !== surahNum) {
            setSelectedSurah(surahNumber);
            setPickerVisible(false); // Close the picker after selecting a Surah
            router.replace(`/surahs/${surahNumber}`);
        }
    };

    const showAddBookMarkToast = () => {
        Toast.show({
            type: 'success',
            text1: 'Ayah has been added to your bookmarks!',
            visibilityTime: 2000,
            autoHide: true
        })
    }

    const showRemoveBookMarkToast = () => {
        Toast.show({
            type: 'removed',
            text1: 'Ayah has been removed from your bookmarks!',
            visibilityTime: 2000,
            autoHide: true
        })
    }

    const toggleBookmark = useCallback((ayahNumber: number) => {
        const isBookmarked = bookmarks.some(
            (bookmark) => bookmark.surahNumber === surahNum && bookmark.ayahNumber === ayahNumber
        );

        const bookmark: Bookmark = {
            surahNumber: surahNum,
            ayahNumber,
            surahName: surah?.englishName || 'Unknown Surah'
        };

        if (isBookmarked) {
            dispatch(removeBookmark(bookmark));
            showRemoveBookMarkToast();
        } else {
            dispatch(addBookmark(bookmark));
            showAddBookMarkToast();
        }
    }, [bookmarks, surahNum, dispatch, surah]);

    const toggleReadAyah = useCallback(async (ayahNumber: number) => {
        setReadAyahs((prev) => {
            const updatedReadAyahs = toggleItemInArray(prev, ayahNumber);
    
            // Update daily ayah progress
            AsyncStorage.getItem('readAyahsToday').then((data) => {
                const readAyahsToday = data ? JSON.parse(data) : [];
                const uniqueDailyAyahs = new Set([...readAyahsToday, `${surahNum}:${ayahNumber}`]);
                AsyncStorage.setItem('readAyahsToday', JSON.stringify(Array.from(uniqueDailyAyahs)));
            });
    
            // Update overall ayah progress
            AsyncStorage.getItem('readAyahsOverall').then((data) => {
                const readAyahsOverall = data ? JSON.parse(data) : [];
                const uniqueOverallAyahs = new Set([...readAyahsOverall, `${surahNum}:${ayahNumber}`]);
                AsyncStorage.setItem('readAyahsOverall', JSON.stringify(Array.from(uniqueOverallAyahs)));
            });
    
            // Check if the surah is fully read for both daily and overall tracking
            if (updatedReadAyahs.length === arabicAyahs.length) {
                // Daily surah progress
                AsyncStorage.getItem('readSurahsToday').then((data) => {
                    const readSurahsToday = data ? JSON.parse(data) : [];
                    if (!readSurahsToday.includes(surahNum)) {
                        readSurahsToday.push(surahNum);
                        AsyncStorage.setItem('readSurahsToday', JSON.stringify(readSurahsToday));
                    }
                });
    
                // Overall surah progress
                AsyncStorage.getItem('readSurahsOverall').then((data) => {
                    const readSurahsOverall = data ? JSON.parse(data) : [];
                    if (!readSurahsOverall.includes(surahNum)) {
                        readSurahsOverall.push(surahNum);
                        AsyncStorage.setItem('readSurahsOverall', JSON.stringify(readSurahsOverall));
                    }
                });
            }
    
            return updatedReadAyahs;
        });
    }, [arabicAyahs.length, surahNum]);       

    const renderAyah = useCallback(
        ({ item, index }: { item: string, index: number }) => {
            const ayahNumber = index + 1; // Adjust Ayah number for display
            const isActiveAyah = index === currentAyahIndex;
    
            const isBookmarked = bookmarks.some(
                (bookmark) => bookmark.surahNumber === surahNum && bookmark.ayahNumber === ayahNumber
            );
            const isRead = readAyahs.includes(ayahNumber);
    
            // Determine the text color based on the theme and whether the Ayah is active
            const ayahTextColor = isActiveAyah
                ? activeTheme.colors.accent // Highlighted text color
                : activeTheme.colors.text.primary; // Regular text color
    
            return (
                <View key={index} style={[styles.ayahContainer, { height: '100%' }]}>
                    <View style={{ flexGrow: 1 }}>
                        {/* Top Row with Ayah Number, Share, Play, and Bookmark Icons */}
                        <View
                            style={[
                                styles.topRow,
                                { backgroundColor: activeTheme.colors.secondary },
                            ]}
                        >
                            <View style={styles.ayahNumber}>
                                <Text
                                    style={[
                                        styles.ayahNumberText,
                                        { color: ayahTextColor },
                                    ]}
                                >
                                    {ayahNumber}
                                </Text>
                            </View>
    
                            <View style={styles.iconGroup}>
                                <PlayPauseButton
                                    color={ayahTextColor}
                                    isActiveAyah={isActiveAyah}
                                    trackIndex={index}
                                    currentAyahIndex={currentAyahIndex}
                                />
                                <BookmarkIcon
                                    isBookmarked={isBookmarked}
                                    onToggle={() => toggleBookmark(ayahNumber)}
                                    size={45} // Adjust size as needed
                                />
                                <TouchableOpacity
                                    onPress={() => toggleReadAyah(ayahNumber)}
                                    style={styles.iconButton}
                                >
                                    <FontAwesome6
                                        name="check"
                                        size={20}
                                        solid={isRead}
                                        color={
                                            isRead
                                                ? activeTheme.colors.text.primary
                                                : activeTheme.colors.text.muted
                                        }
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>
    
                        <View>
                            <Text
                                style={[
                                    styles.quranText,
                                    {
                                        color: ayahTextColor,
                                        fontSize: textSize,
                                        lineHeight: textSize * 2.5,
                                    },
                                ]}
                            >
                                {item}
                            </Text>
                            {surah?.englishTranslation && (
                                <View style={styles.translationContainer}>
                                    <Text
                                        style={[
                                            styles.translationText,
                                            { color: activeTheme.colors.text.secondary },
                                        ]}
                                    >
                                        {englishTranslations[index]}
                                    </Text>
                                </View>
                            )}
                        </View>
    
                        <View
                            style={[
                                styles.separator,
                                { backgroundColor: activeTheme.colors.text.secondary },
                            ]}
                        />
                    </View>
                </View>
            );
        },
        [
            arabicAyahs.length,
            bookmarks,
            currentAyahIndex,
            readAyahs,
            surah?.englishTranslation,
            textSize,
            activeTheme,
        ]
    );

    useEffect(() => {
        const scrollToAyah = () => {
            if (ayahIndex && listRef.current) {
                // Scroll to the ayah index if provided
                listRef.current.scrollToIndex({
                    index: Number(ayahIndex) - 1, // -1 to adjust for 0-based index
                    animated: true,
                    viewPosition: 0.5, // Center the Ayah in the viewport
                });
        }};
        
        const timeoutId = setTimeout(scrollToAyah, 300);

        return () => clearTimeout(timeoutId);
    }, [ayahIndex, arabicAyahs.length]);

    if (!surah) {
        return (
            <SafeAreaView style={{ backgroundColor: '#4D6561', flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 }}>
                <Text style={{ color: '#FFF' }}>Surah not found</Text>
            </SafeAreaView>
        );
    }

    // Render the progress tracker
    const renderProgressTracker = () => {
        return (
            <View
                style={[
                    styles.progressContainer,
                    { backgroundColor: activeTheme.colors.secondary },
                ]}
            >
                <Text
                    style={[
                        styles.progressText,
                        { color: activeTheme.colors.text.primary },
                    ]}
                >
                    {`${surahNum}. ${surah?.englishName}`}
                </Text>
                <Text
                    style={[
                        styles.progressText,
                        { color: activeTheme.colors.text.primary },
                    ]}
                >
                    Progress: {`${readAyahs.length}/${audioLinks.length}`}
                </Text>
            </View>
        );
    };
    
    return (
        <View style={[styles.mainContainer, { backgroundColor: activeTheme.colors.primary }]}>
            {/* Progress Tracker */}
            {renderProgressTracker()}

            {isLoading ? (
                <ActivityIndicator />
            ) : (
                <FlashList
                    ref={listRef}
                    estimatedItemSize={219}
                    data={arabicAyahs}
                    renderItem={renderAyah}
                    keyExtractor={(item, index) => index.toString()}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 80 }}
                />

            )}

            <FloatingPlayer style={styles.floatingPlayer} />

            {/* Surah Picker */}
            {isPickerVisible && (
                <View style={[styles.pickerContainer, { backgroundColor: activeTheme.colors.modalBackground }]}>
                    <Picker
                        selectedValue={selectedSurah}
                        onValueChange={handleSurahChange}
                        style={styles.picker}
                        >
                        {surahs.map((surah) => (
                            <Picker.Item 
                                key={surah.number} 
                                label={`${surah.number}. ${surah.englishName}`} value={surah.number}
                                color={activeTheme.colors.text.primary} 
                            />
                        ))}
                    </Picker>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
    },
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10
    },
    chevronButton: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerText: {
        color: '#FFFFFF',
        fontSize: 20,
        fontFamily: 'Outfit_700Bold',
        marginLeft: 5,
    },
    pickerContainer: {
        position: 'absolute',
        top: 5, // Adjust based on your layout
        left: 0,
        right: 0,
        zIndex: 10,
        backgroundColor: '#FFFFFF',
        borderRadius: 5,
        padding: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
    picker: {
        width: '100%',
    },
    progressContainer: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        backgroundColor: '#3A504C',
        flexDirection: 'row',
        justifyContent: 'space-between'
    },
    progressText: {
        fontFamily: 'Outfit_500Regular',
        fontSize: 16,
        color: '#ECDFCC',
    },
    topRow: {
        flex: 1,
        marginHorizontal: 16,
        padding: 10,
        borderRadius: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 15,
        backgroundColor: '#3A504C'
    },
    ayahNumber: {
        backgroundColor: '#6A807B',
        borderRadius: 12,
        paddingVertical: 4,
        paddingHorizontal: 8,
    },
    ayahNumberText: {
        fontFamily: 'Outfit_500Medium',
        fontSize: 14,
        color: '#FFFFFF',
    },
    iconGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10
    },
    iconButton: {
        paddingHorizontal: 5,
        paddingVertical: 5,
    },
    quranText: {
        fontFamily: 'Amiri_400Regular',
        fontWeight: '400',
        paddingTop: 10,
        paddingBottom: 10,
        textAlign: 'right',
        paddingHorizontal: 20,
    },
    translationText: {
        fontFamily: 'Outfit_400Regular',
        fontWeight: '400',
        fontSize: 12,
        lineHeight: 15,
        paddingHorizontal: 20,
        paddingBottom: 20
    },
    ayahContainer: {
        flex: 1,
        paddingVertical: 10,
        marginBottom: 10 
    },
    translationContainer: {
        width: '100%',
    },
    separator: {
        width: '100%',
        height: 1,
    },
    floatingPlayer: {
        position: 'absolute',
        bottom: 0, // Place it directly above the tab bar
        left: 0,
        right: 0,
        height: 60, // Adjust height as needed for the player
        backgroundColor: '#252525', // Matches the FloatingPlayer background
        zIndex: 10, // Ensure it appears above other elements
        paddingHorizontal: 16,
        justifyContent: 'center',
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
    },
});

export default SurahTextScreen;