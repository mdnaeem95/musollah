import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import React, { useEffect, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import DailyAyah from '../../../components/DailyAyah'
import { FontAwesome6 } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import AsyncStorage from '@react-native-async-storage/async-storage'

const QuranDashboard = () => {
    const router = useRouter();
    const [lastRead, setLastRead] = useState<{ surahNumber: number; ayahNumber: number } | null>(null);

    // Load the last read ayah from AsyncStorage
    const loadLastReadAyah = async () => {
        try {
            const storedLastRead = await AsyncStorage.getItem('lastReadAyah');
            if (storedLastRead) {
                const parsedLastRead = JSON.parse(storedLastRead);
                setLastRead(parsedLastRead);
            }
        } catch (error) {
            console.error('Failed to load last read ayah:', error);
        }
    };

    useEffect(() => {
        loadLastReadAyah(); // Fetch last read ayah when the component mounts
    }, []);

    return (
        <SafeAreaView style={styles.mainContainer}>
            {/* HEADER */}
            <View style={styles.headerContainer}>
                <Text style={styles.headerText}>Quran & Dua</Text>
            </View>

            {/* Grid of Features */}
            <View style={styles.gridContainer}>
                <TouchableOpacity style={styles.gridItem} onPress={() => router.push('/surahs')}>
                    <FontAwesome6 name="book-quran" size={28} color="#FFF" />
                    <Text style={styles.iconLabel}>Quran</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.gridItem} onPress={() => router.push('/doas')}>
                    <FontAwesome6 name="hands-praying" size={28} color="#FFF" />
                    <Text style={styles.iconLabel}>Duas</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.gridItem} onPress={() => router.push('/bookmarks')}>
                    <FontAwesome6 name="bookmark" size={28} color="#FFF" solid />
                    <Text style={styles.iconLabel}>Bookmarks</Text>
                </TouchableOpacity>
            </View>

            {/* Daily Ayah Section */}
            <View>
                <DailyAyah />
            </View>

            {/* Last Read Ayah Section */}
            {lastRead && (
                <TouchableOpacity style={styles.lastReadContainer} onPress={() => router.push(`/surahs/${lastRead.surahNumber}`)}>
                    <FontAwesome6 name="book-open" size={24} color="#FFF"/>
                    <Text style={styles.lastReadText}>
                        Last Read: Surah {lastRead.surahNumber}, Ayah {lastRead.ayahNumber}
                    </Text>
                </TouchableOpacity>
            )}
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
        marginTop: 10,
        alignItems: 'center'
    },
    headerText: {
        fontSize: 24,
        fontFamily: 'Outfit_600SemiBold',
        color: '#FFFFFF'
    },
    gridContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        marginTop: 20
    },
    gridItem: {
        alignItems: 'center',
        justifyContent: 'center',
        width: '30%',
    },
    iconLabel: {
        fontFamily:  'Outfit_400Regular',
        fontSize: 14,
        marginTop: 8,
        textAlign: 'center',
        color: '#FFF'
    },
    lastReadContainer: {
        backgroundColor: '#405754',
        padding: 16,
        borderRadius: 10,
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 20,
    },
    lastReadText: {
        fontFamily: 'Outfit_500Medium',
        fontSize: 16,
        color: '#FFFFFF',
        marginLeft: 10,
    },
})

export default QuranDashboard