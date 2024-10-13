import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import DailyAyah from '../../../components/DailyAyah'
import { FontAwesome6 } from '@expo/vector-icons'
import { useRouter } from 'expo-router'

const QuranDashboard = () => {
    const router = useRouter();

    return (
        <SafeAreaView style={styles.mainContainer}>
            {/* HEADER */}
            <View style={styles.headerContainer}>
                <Text style={styles.headerText}>Quran & Dua</Text>
            </View>

            {/* Daily Ayah Section */}
            <View>
                <DailyAyah />
            </View>

            {/* Grid of Features */}
            <View style={styles.gridContainer}>
                <TouchableOpacity style={styles.gridItem} onPress={() => router.push('/surahs')}>
                    <FontAwesome6 name="book-quran" size={30} color="#FFF" />
                    <Text style={styles.iconLabel}>Quran</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.gridItem} onPress={() => router.push('/doas')}>
                    <FontAwesome6 name="hands-praying" size={30} color="#FFF" />
                    <Text style={styles.iconLabel}>Duas</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.gridItem} onPress={() => router.push('/bookmarks')}>
                    <FontAwesome6 name="bookmark" size={30} color="#FFF" solid />
                    <Text style={styles.iconLabel}>Bookmarks</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
        paddingHorizontal: 16,
        backgroundColor: '#4D6561',
    },
    headerContainer: {
        alignItems: 'center'
    },
    headerText: {
        fontSize: 24,
        fontFamily: 'Outfit_600SemiBold',
        color: '#FFFFFF'
    },
    gridContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        flexWrap: 'wrap',
        marginBottom: 30,
        marginTop: 20
    },
    gridItem: {
        alignItems: 'center',
        justifyContent: 'center',
        width: '30%',
        marginBottom: 20
    },
    iconLabel: {
        fontFamily:  'Outfit_400Regular',
        fontSize: 14,
        marginTop: 8,
        textAlign: 'center',
        color: '#FFF'
    }
})

export default QuranDashboard