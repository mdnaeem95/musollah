import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import React, { useContext } from 'react'
import { useLocalSearchParams } from 'expo-router';
import { Doa, DoaBookmark } from '../../../../utils/types';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../../../redux/store/store';
import { ThemeContext } from '../../../../context/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import PrayerHeader from '../../../../components/PrayerHeader';
import { addBookmark, removeBookmark } from '../../../../redux/slices/doasSlice'
import { FontAwesome6 } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

const DoaContent = () => {
    const { doas, bookmarks } = useSelector((state: RootState) => state.doas)
    const { id } = useLocalSearchParams<{ id: string }>();
    const { isDarkMode } = useContext(ThemeContext);
    const doa: Doa | undefined = doas.find((doa: Doa) => doa.number === id);
    const dispatch = useDispatch<AppDispatch>()

    const DYNAMIC_BACKGROUND = isDarkMode ? "#1E1E1E" : "#F0F4F3";
    const DYNAMIC_TEXT_COLOR = isDarkMode ? '#ECDFCC' : '#1E1E1E';

    // Check if the current doa is bookmarked
    const isBookmarked = bookmarks.some((bookmark) => bookmark.doaId === id);

    const showAddBookMarkToast = () => {
        Toast.show({
            type: 'success',
            text1: 'Doa has been added to your bookmarks!',
            visibilityTime: 2000,
            autoHide: true
        })
    }

    const showRemoveBookMarkToast = () => {
        Toast.show({
            type: 'removed',
            text1: 'Doa has been removed from your bookmarks!',
            visibilityTime: 2000,
            autoHide: true
        })
    }

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
        <SafeAreaView style={[styles.mainContainer, { backgroundColor: DYNAMIC_BACKGROUND }]}>
            <PrayerHeader title="" backgroundColor={DYNAMIC_BACKGROUND} />
            <View style={styles.contentContainer}>
                <Text style={[styles.titleText, { color: DYNAMIC_TEXT_COLOR}]}>{doa?.title}</Text>
                <Text style={[styles.arabicText, { color: DYNAMIC_TEXT_COLOR}]}>{doa?.arabicText}</Text>
                <Text style={[styles.romanizedText, { color: DYNAMIC_TEXT_COLOR}]}>{doa?.romanizedText}</Text>
                <Text style={[styles.romanizedText, { color: DYNAMIC_TEXT_COLOR}]}>{doa?.englishTranslation}</Text>
                <Text style={[styles.source, { color: DYNAMIC_TEXT_COLOR}]}>Source: {doa?.source}</Text>
            </View>

            {/* Bottom Icons */}
            <View style={styles.footerIcons}>
                <TouchableOpacity onPress={toggleBookmark}>
                    <FontAwesome6 name="bookmark" size={28} color={DYNAMIC_TEXT_COLOR} solid={isBookmarked} />
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1, 
        padding: 16
    },
    contentContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 30,
        marginTop: 10
    },
    titleText: {
        fontFamily: 'Outfit_600SemiBold',
        fontSize: 30,
        textAlign: 'center'
    },
    arabicText: {
        fontFamily: 'Amiri_400Regular',
        fontSize: 30,
        lineHeight: 60,
        textAlign: 'right',
        paddingHorizontal: 20,
    },
    romanizedText: {
        fontFamily: 'Outfit_400Regular',
        fontSize: 18,
    },
    source: {
        fontFamily: 'Outfit_400Regular',
        fontSize: 14,  
    },
    footerIcons: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingBottom: 20,
    }
})

export default DoaContent