import { View, Text, StyleSheet } from 'react-native'
import React, { useContext } from 'react'
import { useLocalSearchParams } from 'expo-router';
import { Doa } from '../../../../utils/types';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../redux/store/store';
import { ThemeContext } from '../../../../context/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import BackArrow from '../../../../components/BackArrow';

const DoaContent = () => {
    const { doas } = useSelector((state: RootState) => state.doas)
    const { id } = useLocalSearchParams<{ id: string }>();
    const doa: Doa | undefined = doas.find((doa: Doa) => doa.number === id);
    const { isDarkMode } = useContext(ThemeContext);
    return (
        <SafeAreaView style={[styles.mainContainer, { backgroundColor: isDarkMode ? "#1E1E1E" : "#4D6561" }]}>
            <View style={styles.contentContainer}>
                <Text style={[styles.titleText, { color: isDarkMode ? '#ECDFCC' : '#FFFFFF'}]}>{doa?.title}</Text>
                <Text style={[styles.arabicText, { color: isDarkMode ? '#ECDFCC' : '#FFFFFF'}]}>{doa?.arabicText}</Text>
                <Text style={[styles.romanizedText, { color: isDarkMode ? '#ECDFCC' : '#FFFFFF'}]}>{doa?.romanizedText}</Text>
                <Text style={[styles.romanizedText, { color: isDarkMode ? '#ECDFCC' : '#FFFFFF'}]}>{doa?.englishTranslation}</Text>
                <Text style={[styles.source, { color: isDarkMode ? '#ECDFCC' : '#FFFFFF'}]}>Source: {doa?.source}</Text>
            </View>

            <View style={styles.arrowContainer}>
                <BackArrow />
            </View>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1, 
        paddingHorizontal: 30
    },
    arrowContainer: {
        position: 'absolute',
        left: 30,
        top: 50
    },
    contentContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 30,
        top: -80
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
    }
})

export default DoaContent