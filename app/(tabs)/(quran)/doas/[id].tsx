import { View, Text, StyleSheet } from 'react-native';
import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../../../context/ThemeContext';
import { useDoaBookmarksStore } from '../../../../stores/useDoaBookmarkStore';
import { useDoa } from '../../../../api/services/duas';
import Toast from 'react-native-toast-message';
import BookmarkIcon from '../../../../components/quran/BookmarkIcon';

const DoaContent = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme, textSize } = useTheme();
  
  // Fetch specific doa
  const doa = useDoa(id);
  
  const { 
    addBookmark, 
    removeBookmark, 
    isBookmarked: checkIsBookmarked 
  } = useDoaBookmarksStore();

  const isBookmarked = checkIsBookmarked(id);

  const showAddBookMarkToast = () => {
    Toast.show({
      type: 'success',
      text1: 'Doa has been added to your bookmarks!',
      visibilityTime: 2000,
      autoHide: true,
    });
  };

  const showRemoveBookMarkToast = () => {
    Toast.show({
      type: 'removed',
      text1: 'Doa has been removed from your bookmarks!',
      visibilityTime: 2000,
      autoHide: true,
    });
  };

  const toggleBookmark = () => {
    if (!doa) return;

    if (isBookmarked) {
      removeBookmark(id);
      showRemoveBookMarkToast();
    } else {
      addBookmark(id, doa.title);
      showAddBookMarkToast();
    }
  };

  if (!doa) {
    return (
      <View style={[styles.mainContainer, { backgroundColor: theme.colors.primary }]}>
        <Text style={[styles.errorText, { color: theme.colors.text.primary }]}>
          Doa not found
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.mainContainer, { backgroundColor: theme.colors.primary }]}>
      <View style={{ flexGrow: 1 }}>
        <View style={[styles.contentCard, { backgroundColor: theme.colors.secondary }]}>
          <View style={styles.headerContainer}>
            <Text style={[styles.titleText, { color: theme.colors.text.primary }]}>
              {doa.title}
            </Text>
            <BookmarkIcon isBookmarked={isBookmarked} onToggle={toggleBookmark} size={45} />
          </View>

          <Text
            style={[
              styles.arabicText,
              { 
                color: theme.colors.text.primary, 
                fontSize: textSize, 
                lineHeight: textSize * 2.5 
              },
            ]}
          >
            {doa.arabicText}
          </Text>

          <Text 
            style={[
              styles.romanizedText, 
              { color: theme.colors.text.primary, fontSize: textSize - 10 }
            ]}
          >
            {doa.romanizedText}
          </Text>

          <Text 
            style={[
              styles.translationText, 
              { color: theme.colors.text.primary, fontSize: textSize - 12 }
            ]}
          >
            {doa.englishTranslation}
          </Text>
          
          <Text style={[styles.source, { color: theme.colors.text.secondary }]}>
            Source: {doa.source}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    padding: 20,
  },
  contentCard: {
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4,
    marginBottom: 20,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  titleText: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 28,
    flex: 1,
    textAlign: 'center',
  },
  arabicText: {
    fontFamily: 'Amiri_400Regular',
    textAlign: 'right',
    marginBottom: 20,
  },
  romanizedText: {
    fontFamily: 'Outfit_400Regular',
    marginBottom: 20,
  },
  translationText: {
    fontFamily: 'Outfit_400Regular',
    marginBottom: 20,
  },
  source: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 14,
    textAlign: 'right',
  },
  errorText: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 50,
  },
});

export default DoaContent;