import React, { useContext, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'expo-router';
import { RootState } from '../../../../redux/store/store';
import { Bookmark } from '../../../../utils/types';
import PrayerHeader from '../../../../components/PrayerHeader';
import { ThemeContext } from '../../../../context/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome6 } from '@expo/vector-icons';


const BookmarkPage = () => {
    const { bookmarks: quranBookmarks } = useSelector((state: RootState) => state.quran);  // Retrieve bookmarks from Redux
    const { bookmarks: doaBookmarks } = useSelector((state: RootState) => state.doas);
    const [isQuranExpanded, setIsQuranExpanded] = useState<boolean>(false);
    const [isDoasExpanded, setIsDoasExpanded] = useState<boolean>(false);
    const router = useRouter();
    const { isDarkMode } = useContext(ThemeContext);

    const toggleQuranFolder = () => setIsQuranExpanded(!isQuranExpanded);
    const toggleDoasFolder = () => setIsDoasExpanded(!isDoasExpanded);
    
    const DYNAMIC_COLOUR = isDarkMode ? "#2E3D3A" : "#4D6561"
    const DYNAMIC_TEXT_COLOR = isDarkMode ? '#ECDFCC' : '#FFFFFF'

    const handleBookmarkPress = (surahId: number, ayahIndex: number) => {
        // Navigate to the Surah and Ayah
        router.push({
            pathname: `/surahs/${surahId}`,
            params: { ayahIndex: ayahIndex },
        });
    };

    const handleDoaBookmarkPress = (doaId: string) => {
      // Navigate to the Doa page
      router.push(`/doas/${doaId}`);
    };

    const renderQuranBookmarkItem = ({ item }: { item: Bookmark }) => (
        <TouchableOpacity 
            onPress={() => handleBookmarkPress(item.surahNumber, item.ayahNumber)} 
            style={[styles.bookmarkItem, { backgroundColor: isDarkMode ? '#3A504C' : '#A3C0BB', }]}>
        <View>
            <Text style={[styles.surahName, { color: DYNAMIC_TEXT_COLOR }]}>{item.surahName}</Text>
            <Text style={[styles.ayahInfo, { color: DYNAMIC_TEXT_COLOR }]}>Ayah {item.ayahNumber}</Text>
        </View>
        </TouchableOpacity>
    );

    const renderDoaBookmarkItem = ({ item }: { item: any }) => (
      <TouchableOpacity 
        onPress={() => handleDoaBookmarkPress(item.doaId)} 
        style={[styles.bookmarkItem, { backgroundColor: isDarkMode ? '#3A504C' : '#A3C0BB' }]}
      >
        <Text style={[styles.surahName, { color: DYNAMIC_TEXT_COLOR }]}>{item.doaTitle}</Text>
      </TouchableOpacity>
    );

    return (
        <View style={[styles.mainContainer, { backgroundColor: DYNAMIC_COLOUR}]}>
            {/* QURAN FOLDER */}
            <TouchableOpacity onPress={toggleQuranFolder} style={styles.folderHeader}>
              <FontAwesome6 name={isQuranExpanded ? "folder-open" : "folder"} size={20} color={DYNAMIC_TEXT_COLOR} />
              <Text style={[styles.folderTitle, { color: DYNAMIC_TEXT_COLOR }]}>Quran ({quranBookmarks.length})</Text>
              <FontAwesome6 name={isQuranExpanded ? "chevron-up" : "chevron-down"} size={20} color={DYNAMIC_TEXT_COLOR} />
            </TouchableOpacity>

            {isQuranExpanded && (
              <FlatList
                data={quranBookmarks}
                renderItem={renderQuranBookmarkItem}
                keyExtractor={(item) => `${item.surahNumber}-${item.ayahNumber}`}
              />
            )}

            {/* Doas Folder */}
            <TouchableOpacity onPress={toggleDoasFolder} style={styles.folderHeader}>
              <FontAwesome6 name={isDoasExpanded ? "folder-open" : "folder"} size={20} color={DYNAMIC_TEXT_COLOR} />
              <Text style={[styles.folderTitle, { color: DYNAMIC_TEXT_COLOR }]}>Doas ({doaBookmarks.length})</Text>
              <FontAwesome6 name={isDoasExpanded ? "chevron-up" : "chevron-down"} size={20} color={DYNAMIC_TEXT_COLOR} />
            </TouchableOpacity>

            {isDoasExpanded && (
              <FlatList
                data={doaBookmarks}
                renderItem={renderDoaBookmarkItem}
                keyExtractor={(item) => item.doaId}
              />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    padding: 16,
    backgroundColor: '#2E3D3A',
  },
  folderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#3A504C',
    borderRadius: 10,
    marginBottom: 12,
    shadowColor: '#000', // Subtle shadow for depth
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3, // For Android shadow
  },
  folderTitle: {
    fontSize: 18,
    color: '#FFF',
    fontFamily: 'Outfit_400Regular'
  },
  bookmarkItem: {
    marginBottom: 10,
    borderRadius: 8,
    padding: 16,
    backgroundColor: '#314441',
    shadowColor: '#000', // Subtle shadow for depth
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3, // For Android shadow
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
