import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import React, { useContext } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { Doa, DoaBookmark } from '../../../../utils/types';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../../../redux/store/store';
import { ThemeContext } from '../../../../context/ThemeContext';
import { addBookmark, removeBookmark } from '../../../../redux/slices/doasSlice';
import { FontAwesome6 } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

const DoaContent = () => {
    const { doas, bookmarks } = useSelector((state: RootState) => state.doas);
    const { id } = useLocalSearchParams<{ id: string }>();
    const { isDarkMode, textSize } = useContext(ThemeContext);
    const doa: Doa | undefined = doas.find((doa: Doa) => doa.number === id);
    const dispatch = useDispatch<AppDispatch>();

    const DYNAMIC_BACKGROUND = isDarkMode ? "#1E1E1E" : "#4D6561";
    const DYNAMIC_TEXT_COLOR = isDarkMode ? '#ECDFCC' : '#FFFFFF';
    const contentCardBackground = isDarkMode ? '#2A2A2A' : '#3A504C';
    const DYNAMIC_LINE_HEIGHT = textSize * 2.5

    // Check if the current doa is bookmarked
    const isBookmarked = bookmarks.some((bookmark) => bookmark.doaId === id);

    const showAddBookMarkToast = () => {
        Toast.show({
            type: 'success',
            text1: 'Doa has been added to your bookmarks!',
            visibilityTime: 2000,
            autoHide: true
        });
    };

    const showRemoveBookMarkToast = () => {
        Toast.show({
            type: 'removed',
            text1: 'Doa has been removed from your bookmarks!',
            visibilityTime: 2000,
            autoHide: true
        });
    };

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
        <View style={[styles.mainContainer, { backgroundColor: DYNAMIC_BACKGROUND }]}>
            <View style={{ flexGrow: 1 }}>
                <View style={[styles.contentCard, { backgroundColor: contentCardBackground }]}>
                    <View style={styles.headerContainer}>
                        <Text style={[styles.titleText, { color: DYNAMIC_TEXT_COLOR }]}>{doa?.title}</Text>
                        <TouchableOpacity onPress={toggleBookmark}>
                            <FontAwesome6
                                name="bookmark"
                                size={28}
                                color={isBookmarked ? '#ECDFCC' : DYNAMIC_TEXT_COLOR}
                                solid={isBookmarked}
                            />
                        </TouchableOpacity>
                    </View>

                    <Text style={[styles.arabicText, { color: DYNAMIC_TEXT_COLOR, fontSize: textSize, lineHeight: DYNAMIC_LINE_HEIGHT }]}>
                        {doa?.arabicText}
                    </Text>
                    <View style={styles.divider} />
                    <Text style={[styles.romanizedText, { color: DYNAMIC_TEXT_COLOR, fontSize: textSize - 10 }]}>
                        {doa?.romanizedText}
                    </Text>
                    <View style={styles.divider} />
                    <Text style={[styles.translationText, { color: DYNAMIC_TEXT_COLOR, fontSize: textSize - 12 }]}>
                        {doa?.englishTranslation}
                    </Text>
                    <Text style={[styles.source, { color: DYNAMIC_TEXT_COLOR }]}>
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
        backgroundColor: '#3A504C',
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
        fontSize: 16,
        marginBottom: 20,
    },
    source: {
        fontFamily: 'Outfit_400Regular',
        fontSize: 14,
        textAlign: 'right',
    },
    divider: {
        height: 1,
        backgroundColor: '#6A807B',
        marginVertical: 10,
    }
});

export default DoaContent;
