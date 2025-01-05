import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';
import { useRouter } from 'expo-router';
import { RootState } from '../../../../redux/store/store';
import { Bookmark } from '../../../../utils/types';
import { useTheme } from '../../../../context/ThemeContext';
import { FontAwesome6 } from '@expo/vector-icons';

const BookmarkPage = () => {
  const { bookmarks: quranBookmarks } = useSelector((state: RootState) => state.quran); // Retrieve bookmarks from Redux
  const { bookmarks: doaBookmarks } = useSelector((state: RootState) => state.doas);
  const [isQuranExpanded, setIsQuranExpanded] = useState<boolean>(false);
  const [isDoasExpanded, setIsDoasExpanded] = useState<boolean>(false);
  const router = useRouter();
  const { theme } = useTheme();

  const toggleQuranFolder = () => setIsQuranExpanded(!isQuranExpanded);
  const toggleDoasFolder = () => setIsDoasExpanded(!isDoasExpanded);

  const handleBookmarkPress = (surahId: number, ayahIndex: number) => {
    router.push({
      pathname: `/surahs/${surahId}`,
      params: { ayahIndex: ayahIndex },
    });
  };

  const handleDoaBookmarkPress = (doaId: string) => {
    router.push(`/doas/${doaId}`);
  };

  const renderQuranBookmarkItem = ({ item }: { item: Bookmark }) => (
    <TouchableOpacity
      onPress={() => handleBookmarkPress(item.surahNumber, item.ayahNumber)}
      style={[styles.bookmarkItem, { backgroundColor: theme.colors.secondary }]}
    >
      <View>
        <Text style={[styles.surahName, { color: theme.colors.text.primary }]}>{item.surahName}</Text>
        <Text style={[styles.ayahInfo, { color: theme.colors.text.secondary }]}>Ayah {item.ayahNumber}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderDoaBookmarkItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      onPress={() => handleDoaBookmarkPress(item.doaId)}
      style={[styles.bookmarkItem, { backgroundColor: theme.colors.secondary }]}
    >
      <Text style={[styles.surahName, { color: theme.colors.text.primary }]}>{item.doaTitle}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.mainContainer, { backgroundColor: theme.colors.primary }]}>
      {/* Quran Folder */}
      <TouchableOpacity onPress={toggleQuranFolder} style={[styles.folderHeader, { backgroundColor: theme.colors.secondary }]}>
        <FontAwesome6 name={isQuranExpanded ? "folder-open" : "folder"} size={20} color={theme.colors.text.primary} />
        <Text style={[styles.folderTitle, { color: theme.colors.text.primary }]}>Quran ({quranBookmarks.length})</Text>
        <FontAwesome6 name={isQuranExpanded ? "chevron-up" : "chevron-down"} size={20} color={theme.colors.text.primary} />
      </TouchableOpacity>

      {isQuranExpanded && (
        <FlatList
          data={quranBookmarks}
          renderItem={renderQuranBookmarkItem}
          keyExtractor={(item) => `${item.surahNumber}-${item.ayahNumber}`}
        />
      )}

      {/* Doas Folder */}
      <TouchableOpacity onPress={toggleDoasFolder} style={[styles.folderHeader, { backgroundColor: theme.colors.secondary }]}>
        <FontAwesome6 name={isDoasExpanded ? "folder-open" : "folder"} size={20} color={theme.colors.text.primary} />
        <Text style={[styles.folderTitle, { color: theme.colors.text.primary }]}>Doas ({doaBookmarks.length})</Text>
        <FontAwesome6 name={isDoasExpanded ? "chevron-up" : "chevron-down"} size={20} color={theme.colors.text.primary} />
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
  },
  folderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  folderTitle: {
    fontSize: 18,
    fontFamily: 'Outfit_400Regular',
  },
  bookmarkItem: {
    marginBottom: 10,
    borderRadius: 8,
    padding: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  surahName: {
    fontSize: 18,
    fontFamily: 'Outfit_600SemiBold',
  },
  ayahInfo: {
    fontSize: 16,
    fontFamily: 'Outfit_400Regular',
  },
});

export default BookmarkPage;
