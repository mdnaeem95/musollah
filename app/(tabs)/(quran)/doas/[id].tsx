import { View, Text, StyleSheet } from 'react-native';
import React, { useContext } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { Doa, DoaBookmark } from '../../../../utils/types';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../../../redux/store/store';
import { ThemeContext } from '../../../../context/ThemeContext';
import { addBookmark, removeBookmark } from '../../../../redux/slices/doasSlice';
import Toast from 'react-native-toast-message';
import BookmarkIcon from '../../../../components/BookmarkIcon';

const DoaContent = () => {
  const { doas, bookmarks } = useSelector((state: RootState) => state.doas);
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme, isDarkMode, textSize } = useContext(ThemeContext);
  const activeTheme = isDarkMode ? theme.dark : theme.light;

  const doa: Doa | undefined = doas.find((doa: Doa) => doa.number === id);
  const dispatch = useDispatch<AppDispatch>();

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

  const isBookmarked = bookmarks.some((bookmark) => bookmark.doaId === id);

  // Handle bookmark toggle
  const toggleBookmark = () => {
    const bookmark: DoaBookmark = {
      doaId: id as string,
      doaTitle: doa?.title || 'Unknown Doa',
    };

    if (isBookmarked) {
      dispatch(removeBookmark(bookmark));
      showRemoveBookMarkToast();
    } else {
      dispatch(addBookmark(bookmark));
      showAddBookMarkToast();
    }
  };

  return (
    <View style={[styles.mainContainer, { backgroundColor: activeTheme.colors.primary }]}>
      <View style={{ flexGrow: 1 }}>
        <View style={[styles.contentCard, { backgroundColor: activeTheme.colors.secondary }]}>
          <View style={styles.headerContainer}>
            <Text style={[styles.titleText, { color: activeTheme.colors.text.primary }]}>{doa?.title}</Text>
            <BookmarkIcon isBookmarked={isBookmarked} onToggle={toggleBookmark} size={45} />
          </View>

          <Text
            style={[
              styles.arabicText,
              { color: activeTheme.colors.text.primary, fontSize: textSize, lineHeight: textSize * 2.5 },
            ]}
          >
            {doa?.arabicText}
          </Text>

          <Text style={[styles.romanizedText, { color: activeTheme.colors.text.primary, fontSize: textSize - 10 }]}>
            {doa?.romanizedText}
          </Text>

          <Text style={[styles.translationText, { color: activeTheme.colors.text.primary, fontSize: textSize - 12 }]}>
            {doa?.englishTranslation}
          </Text>
          <Text style={[styles.source, { color: activeTheme.colors.text.secondary }]}>
            Source: {doa?.source}
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
});

export default DoaContent;
