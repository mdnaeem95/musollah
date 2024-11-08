// QuranDashboard.tsx
import { View, Text, StyleSheet, TouchableOpacity, Animated, ScrollView } from 'react-native'
import React, { useState, useRef, useCallback } from 'react'
import DailyAyah from '../../../components/DailyAyah'
import { FontAwesome6 } from '@expo/vector-icons'
import { useFocusEffect, useRouter } from 'expo-router'
import AsyncStorage from '@react-native-async-storage/async-storage'

const QuranDashboard = () => {
    const router = useRouter();
    const scaleAnim = useRef(new Animated.Value(1)).current; // Animation for button scaling
    const [lastReadAyah, setLastReadAyah] = useState<{ayahNumber: number, surahNumber: number}>({
        ayahNumber: 0,
        surahNumber: 0
    });
    const [lastListenedAyah, setLastListenedAyah] = useState<{ayahIndex: number, surahNumber: number}>({
        ayahIndex: 0,
        surahNumber: 0
    });

    const handlePressIn = () => {
        Animated.spring(scaleAnim, {
            toValue: 0.9,
            useNativeDriver: true,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 3,
            tension: 40,
            useNativeDriver: true,
        }).start();
    };

    useFocusEffect(useCallback(() => {
        const loadLastStates = async () => {
            const lastListened = await AsyncStorage.getItem('lastListenedAyah');
            const lastRead = await AsyncStorage.getItem('lastReadAyah');
            console.log(lastRead)
    
            if (lastListened) {
                const { surahNumber, ayahIndex } = JSON.parse(lastListened);
                setLastListenedAyah({ surahNumber, ayahIndex });
                console.log(lastListenedAyah)
            }
    
            if (lastRead) {
                const { surahNumber, ayahNumber } = JSON.parse(lastRead);
                setLastReadAyah({ surahNumber, ayahNumber });
                console.log(lastReadAyah)
            }
        };
        loadLastStates();
    }, [])
    )

    return (
        <View style={styles.mainContainer}>
            {/* Grid of Features */}
            <ScrollView contentContainerStyle={styles.scrollContainer}>
            <View style={styles.gridContainer}>
                {['/surahs', '/doas', '/bookmarks'].map((route, index) => (
                    <TouchableOpacity
                        key={index}
                        style={styles.gridItem}
                        onPress={() => router.push(route)}
                        activeOpacity={0.7}
                        onPressIn={handlePressIn}
                        onPressOut={handlePressOut}
                    >
                        <Animated.View style={{ transform: [{ scale: scaleAnim }], alignItems: 'center' }}>
                            <FontAwesome6 
                                name={index === 0 ? "book-quran" : index === 1 ? "hands-praying" : "bookmark"} 
                                size={28} 
                                color="#FFFFFF" 
                                solid 
                            />
                            <Text style={styles.iconLabel}>
                                {index === 0 ? 'Quran' : index === 1 ? 'Duas' : 'Bookmarks'}
                            </Text>
                        </Animated.View>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Daily Ayah Section */}
            <DailyAyah />

            {/* Last Read and Last Listened Sections */}
            {lastListenedAyah && (
                <TouchableOpacity 
                    style={styles.ayahContainer} 
                    onPress={() => router.push({
                        pathname: `/surahs/${lastListenedAyah.surahNumber}`,
                        params: { ayahIndex: lastListenedAyah.ayahIndex }
                    })}
                >
                    <Text style={styles.ayahHeaderText}>Last Listened</Text>
                    <Text style={styles.ayahDetailText}>
                        Surah {lastListenedAyah.surahNumber}, Ayah {lastListenedAyah.ayahIndex}
                    </Text>
                </TouchableOpacity>
            )}

            {lastReadAyah && (
                <TouchableOpacity 
                    style={styles.ayahContainer} 
                    onPress={() => router.push({
                        pathname: `/surahs/${lastReadAyah.surahNumber}`,
                        params: { ayahIndex: lastReadAyah.ayahNumber }
                    })}
                >
                    <Text style={styles.ayahHeaderText}>Last Read</Text>
                    <Text style={styles.ayahDetailText}>
                        Surah {lastReadAyah.surahNumber}, Ayah {lastReadAyah.ayahNumber}
                    </Text>
                </TouchableOpacity>
            )}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
        backgroundColor: '#2E3D3A', // Main background color
    },
    scrollContainer: {
        padding: 16
    },
    gridContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        marginTop: 20,
    },
    gridItem: {
        alignItems: 'center',
        justifyContent: 'center',
        width: '30%',
        marginBottom: 20,
        padding: 16,
        borderRadius: 12,
        backgroundColor: '#3D4F4C', // Slightly darker shade for buttons
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 5,
    },
    iconLabel: {
        fontFamily: 'Outfit_400Regular',
        fontSize: 14,
        marginTop: 8,
        textAlign: 'center',
        color: '#F4E2C1',
    },
    lastReadText: {
        fontFamily: 'Outfit_500Medium',
        fontSize: 16,
        color: '#FFFFFF',
        marginLeft: 10,
    },
    ayahContainer: {
        marginTop: 16,
        padding: 16,
        borderRadius: 15,
        backgroundColor: '#3D4F4C',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
    },
    ayahHeaderText: {
        fontSize: 18,
        fontFamily: 'Outfit_600SemiBold',
        color: '#ECDFCC',
        marginBottom: 4,
    },
    ayahDetailText: {
        fontSize: 16,
        fontFamily: 'Outfit_400Regular',
        color: '#FFFFFF',
    },
});

export default QuranDashboard;
