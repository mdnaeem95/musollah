import React, { useContext } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'expo-router';
import { RootState } from '../../../../redux/store/store';
import { Bookmark } from '../../../../utils/types';
import PrayerHeader from '../../../../components/PrayerHeader';
import { ThemeContext } from '../../../../context/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';


const BookmarkPage = () => {
    const { bookmarks } = useSelector((state: RootState) => state.quran);  // Retrieve bookmarks from Redux
    const router = useRouter();
    const { isDarkMode } = useContext(ThemeContext);
    
    const DYNAMIC_COLOUR = isDarkMode ? "#1E1E1E" : "#4D6561"
    const DYNAMIC_TEXT_COLOR = isDarkMode ? '#ECDFCC' : '#FFFFFF'

    const handleBookmarkPress = (surahId: number, ayahIndex: number) => {
        // Navigate to the Surah and Ayah
        router.push({
            pathname: `/surahs/${surahId}`,
            params: { ayahIndex },
        });
    };

    const renderBookmarkItem = ({ item }: { item: Bookmark }) => (
        <TouchableOpacity 
            onPress={() => handleBookmarkPress(item.surahNumber, item.ayahNumber)} 
            style={[styles.bookmarkItem, { backgroundColor: isDarkMode ? "#3C3D37" : '#A3C0BB' }]}>
        <View>
            <Text style={[styles.surahName, { color: DYNAMIC_TEXT_COLOR }]}>{item.surahName}</Text>
            <Text style={[styles.ayahInfo, { color: DYNAMIC_TEXT_COLOR }]}>Ayah {item.ayahNumber}</Text>
        </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={[styles.mainContainer, { backgroundColor: DYNAMIC_COLOUR}]}>
            <PrayerHeader 
                title="My Bookmarks" 
                backgroundColor={DYNAMIC_COLOUR} 
            />

            {bookmarks.length === 0 ? (
                <View style={styles.noBookmarksContainer}>
                <Text style={[styles.noBookmarksText, { color: DYNAMIC_TEXT_COLOR }]}>No bookmarks yet</Text>
                </View>
            ) : (
                <FlatList
                data={bookmarks}
                renderItem={renderBookmarkItem}
                keyExtractor={(item) => `${item.surahNumber}-${item.ayahNumber}`}
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    paddingHorizontal: 16
  },
  noBookmarksContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noBookmarksText: {
    fontSize: 18,
    fontFamily: 'Outfit_400Regular'
  },
  bookmarkItem: {
    marginBottom: 10,
    borderRadius: 8,
    padding: 16
  },
  surahName: {
    fontSize: 18,
    fontFamily: 'Outfit_600SemiBold',
    color: '#314340',
  },
  ayahInfo: {
    fontSize: 16,
    fontFamily: 'Outfit_400Regular',
    color: '#314340',
  },
});

export default BookmarkPage;
