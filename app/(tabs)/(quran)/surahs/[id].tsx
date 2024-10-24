import { View, Text, ActivityIndicator, StyleSheet, TouchableOpacity, FlatList, Modal } from 'react-native';
import React, { useRef, useState, useCallback, useContext, useEffect, useLayoutEffect, memo } from 'react';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { AVPlaybackStatus, Audio } from 'expo-av';
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

// Utility functions for bookmarking and marking read Ayahs
const toggleItemInArray = (arr: number[], item: number) => (
    arr.includes(item) ? arr.filter(num => num !== item) : [...arr, item]
);

const SurahTextScreen = () => {
    const router = useRouter();
    const navigation = useNavigation();
    const dispatch = useDispatch<AppDispatch>()

    const soundRef = useRef<Audio.Sound | null>(null);
    const listRef = useRef<FlatList>(null);
    const { id } = useLocalSearchParams<{ id: string, ayahIndex?: string }>();
    const { surahs, isLoading, bookmarks } = useSelector((state: RootState) => state.quran);
    const { isDarkMode, textSize, reciter } = useContext(ThemeContext);

    const surahNum = id ? parseInt(id as string, 10) : 1;
    const surah: Surah | undefined = surahs.find((surah: Surah) => surah.number === surahNum);

    const arabicAyahs = surah?.arabicText ? surah.arabicText.split('|').reverse() : [];
    const englishTranslations = surah?.englishTranslation ? surah.englishTranslation.split('|').reverse() : [];

    const [currentAyahIndex, setCurrentAyahIndex] = useState<number>(arabicAyahs.length - 1);
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const [readAyahs, setReadAyahs] = useState<number[]>([]);
    const [selectedSurah, setSelectedSurah] = useState<number>(surahNum);
    const [isPickerVisible, setPickerVisible] = useState<boolean>(false);
    const [audioLinks, setAudioLinks] = useState<string[]>([]);

    useEffect(() => {
        if (surah?.audioLinks) {
            const updatedLinks = surah.audioLinks
                .split(',')
                .map(link => link.replace('ar.alafasy', reciter))
                .reverse();
            setAudioLinks(updatedLinks);
        }
    }, [reciter, surah]);

    useEffect(() => {
        if (isPlaying) {
            resetAudio().then(() => playAyah(currentAyahIndex));
        }
    }, [audioLinks])

    // Set the dynamic title in the header
    useLayoutEffect(() => {
        if (surah) {
        navigation.setOptions({
            headerTitle: () => (
                <View style={styles.headerContainer}>
                    <Text style={[styles.headerText, { color: isDarkMode ? '#ECDFCC' : '#FFFFFF' }]}>{surah.englishName}</Text>
                    <TouchableOpacity onPress={togglePickerVisibility}>
                        <FontAwesome6 name={isPickerVisible ? "chevron-up" : "chevron-down"} size={20} color={isDarkMode ? '#ECDFCC' : '#FFFFFF'} />
                    </TouchableOpacity>
                </View>
            )
        });
        }
    }, [navigation, surah, isPickerVisible]);

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

    // Helper function to provide layout information for FlatList items
    const getItemLayout = (_: any, index: number) => ({
        length: ITEM_HEIGHT,
        offset: ITEM_HEIGHT * index,
        index,
    });

    // Constant item height (adjust this to the approximate height of each Ayah row)
    const ITEM_HEIGHT = textSize * 6; // Adjust to the actual row height

    const showRemoveBookMarkToast = () => {
        Toast.show({
            type: 'removed',
            text1: 'Ayah has been removed from your bookmarks!',
            visibilityTime: 2000,
            autoHide: true
        })
    }
    
    const playAyah = async (index: number) => {
        const ayahAudioLink = audioLinks[index]?.trim();

        if (!ayahAudioLink) return;

        try {
            if (soundRef.current) {
                await soundRef.current.unloadAsync();
            }

            const { sound } = await Audio.Sound.createAsync(
                { uri: ayahAudioLink },
                { shouldPlay: true }
            );
            soundRef.current = sound;

            await AsyncStorage.setItem('lastListenedAyah', JSON.stringify({
                surahNumber: surahNum,
                ayahIndex: arabicAyahs.length - index
            }))

            sound.setOnPlaybackStatusUpdate(async (status: AVPlaybackStatus) => {
                if (status.isLoaded && status.didJustFinish) {
                    playNextAyah(index - 1);  // Save when stopped
                }
            });
        
            setCurrentAyahIndex(index);
            setIsPlaying(true);
        } catch (error) {
            console.error('Failed to play Ayah:', error);
            setIsPlaying(false);
        }
    };

    const playNextAyah = useCallback(
        async (index: number) => {
            if (index >= audioLinks.length) {
                setIsPlaying(false);
                return;
            }
            playAyah(index);
        },
        [audioLinks]
    );

    // Toggle play/pause for the Ayah
    const togglePlayPause = async (index: number) => {
        if (isPlaying && currentAyahIndex === index) {
            if (soundRef.current) {
                const status = await soundRef.current.getStatusAsync();
                if (status.isLoaded && status.isPlaying) {
                    await soundRef.current.pauseAsync();
                    setIsPlaying(false);
                }
            }
        } else {
            await resetAudio(); // Reset previous audio
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: false,
                playsInSilentModeIOS: true,
                shouldDuckAndroid: true,
                playThroughEarpieceAndroid: false,
                staysActiveInBackground: true,
            });

            playAyah(index); // Start playing from the selected Ayah index
        }
    };

    const resetAudio = async () => {
        if (soundRef.current) {
            await soundRef.current.unloadAsync();
            soundRef.current = null;
        }
        setIsPlaying(false);
    };

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

    const toggleReadAyah = useCallback((ayahNumber: number) => {
        setReadAyahs((prev) => {
            const updatedReadAyahs = toggleItemInArray(prev, ayahNumber);
            
            // Save the last read ayah if marked
            if (updatedReadAyahs.includes(ayahNumber)) {
                const lastReadData = { surahNumber: surahNum, ayahNumber };
                AsyncStorage.setItem('lastReadAyah', JSON.stringify(lastReadData));
            }
    
            return updatedReadAyahs;
        });
    }, []);

    const renderAyah = useCallback(({ item, index }: { item: string, index: number }) => {
        const ayahNumber = arabicAyahs.length - index; // Adjust Ayah number for display
        const isActiveAyah = index === currentAyahIndex;

        const isBookmarked = bookmarks.some(
            (bookmark) => bookmark.surahNumber === surahNum && bookmark.ayahNumber === ayahNumber
        )
        const isRead = readAyahs.includes(ayahNumber);
        
        // Determine the text color based on the theme and whether the Ayah is active
        const ayahTextColor = isActiveAyah
        ? (isDarkMode ? '#F0DBA0' : '#F4E2C1')  // Highlighted text color
        : (isDarkMode ? '#ECDFCC' : '#FFFFFF');  // Regular text color

        return (
            <View key={index} style={[styles.ayahContainer, { height: '100%' }]}>
                <View style={{ flexGrow: 1 }}>
                {/* Top Row with Ayah Number, Share, Play, and Bookmark Icons */}
                <View style={[styles.topRow, { backgroundColor: isDarkMode? "#263837" : "#3A504C"}]}>
                    <View style={styles.ayahNumber}>
                        <Text style={[styles.ayahNumberText, { color: ayahTextColor }]}>{ayahNumber}</Text>
                    </View>

                    <View style={styles.iconGroup}>
                        <TouchableOpacity style={styles.iconButton} onPress={() => togglePlayPause(index)}>
                            <FontAwesome6 name={isPlaying ? "pause" : "play"} size={20} color={ayahTextColor} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => toggleBookmark(ayahNumber)}
                            style={styles.iconButton}
                            >
                            <FontAwesome6
                                name="bookmark"
                                size={20}
                                solid={isBookmarked}
                                color={isBookmarked ? 'white' : 'gray'}
                                />
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => toggleReadAyah(ayahNumber)}
                            style={styles.iconButton}
                            >
                            <FontAwesome6
                                name="check"
                                size={20}
                                solid={isRead}
                                color={isRead ? 'white' : 'gray'}
                                />
                        </TouchableOpacity>
                    </View>
                </View>

                <View >
                    <Text style={[styles.quranText, { color: ayahTextColor, fontSize: textSize, lineHeight: textSize * 2 }]}>{item}</Text>
                    {surah?.englishTranslation && (
                        <View style={styles.translationContainer}>
                            <Text style={[styles.translationText, { color: ayahTextColor }]}>
                                {englishTranslations[index]}
                            </Text>
                        </View>
                    )}
                </View>

                <View style={[styles.separator, { backgroundColor: isDarkMode ? '#ECDFCC' :'#FFFFFF' }]} />
                </View>
            </View>
        )
    }, [arabicAyahs.length, bookmarks, currentAyahIndex, isDarkMode, readAyahs, surah?.englishTranslation, textSize]);

    useEffect(() => {
        if (listRef.current && currentAyahIndex >= 0 && currentAyahIndex < arabicAyahs.length) {
            listRef.current.scrollToIndex({
                index: currentAyahIndex,
                animated: true,
                viewPosition: 0
            });
        }
    }, [currentAyahIndex, arabicAyahs.length]);

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
            <View style={[styles.progressContainer, { backgroundColor: isDarkMode? "#263837" : "#3A504C"}]}>
                <Text style={styles.progressText}>
                    {`${surahNum}. ${surah?.englishName}`}
                </Text>
                <Text style={styles.progressText}>
                    Progress: {`${readAyahs.length}/${audioLinks.length}`}
                </Text>
            </View>
        );
    };

    return (
        <View style={[styles.mainContainer, { backgroundColor: isDarkMode ? "#1E1E1E" : "#4D6561" }]}>
            {/* Progress Tracker */}
            {renderProgressTracker()}

            {isLoading ? (
                <ActivityIndicator />
            ) : (
                <FlashList
                    data={arabicAyahs}
                    renderItem={renderAyah}
                    initialScrollIndex={currentAyahIndex}
                    inverted={true}
                    keyExtractor={(item, index) => index.toString()}
                    contentContainerStyle={styles.listContainer}
                    showsVerticalScrollIndicator={false}
                />
            )}

            {/* Surah Picker */}
            {isPickerVisible && (
                <View style={[styles.pickerContainer, { backgroundColor: isDarkMode ? "#1E1E1E" : "#4D6561" }]}>
                    <Picker
                        selectedValue={selectedSurah}
                        onValueChange={handleSurahChange}
                        style={styles.picker}
                        >
                        {surahs.map((surah) => (
                            <Picker.Item 
                                key={surah.number} 
                                label={`${surah.number}. ${surah.englishName}`} value={surah.number}
                                color={isDarkMode ? '#ECDFCC' : '#FFFFFF' } 
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
    listContainer: {
        paddingTop: 100
    },
    separator: {
        width: '100%',
        height: 1,
    },
});

export default SurahTextScreen;