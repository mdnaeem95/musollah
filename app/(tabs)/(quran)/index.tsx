// QuranDashboard.tsx
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native'
import React, { useEffect, useState, useRef, useCallback } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import DailyAyah from '../../../components/DailyAyah'
import { FontAwesome6 } from '@expo/vector-icons'
import { useFocusEffect, useRouter } from 'expo-router'
import AsyncStorage from '@react-native-async-storage/async-storage'

const QuranDashboard = () => {
    const router = useRouter();
    const scaleAnim = useRef(new Animated.Value(1)).current; // Animation for button scaling
    const [lastReadAyah, setLastReadAyah] = useState<{}>({});
    const [lastListenedAyah, setLastListenedAyah] = useState<{}>({});

    const handlePressIn = () => {
        Animated.spring(scaleAnim, {
            toValue: 0.95,
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
        <SafeAreaView style={styles.mainContainer}>
            {/* HEADER */}
            <View style={styles.headerContainer}>
                <Text style={styles.headerText}>Quran & Dua</Text>
            </View>

            {/* Grid of Features */}
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
            <View style={styles.cardContainer}>
                <DailyAyah />
            </View>

            {/* Last Read and Last Listened Sections */}
            {lastListenedAyah !== undefined && (
                <Text>last listened avail</Text>
            )}

            {lastReadAyah !== undefined && (
                <Text>last read avail</Text>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
        padding: 16,
        backgroundColor: '#4D6561', // Main background color
    },
    headerContainer: {
        marginTop: 4,
        alignItems: 'center',
    },
    headerText: {
        fontSize: 26,
        fontFamily: 'Outfit_700Bold',
        color: '#FFFFFF',
    },
    gridContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        marginTop: 24,
    },
    gridItem: {
        alignItems: 'center',
        justifyContent: 'center',
        width: '30%',
        marginBottom: 20,
        padding: 16,
        borderRadius: 15,
        backgroundColor: '#3A504C', // Slightly darker shade for buttons
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    iconLabel: {
        fontFamily: 'Outfit_400Regular',
        fontSize: 14,
        marginTop: 8,
        textAlign: 'center',
        color: '#FFFFFF',
    },
    cardContainer: {
        marginVertical: 20,
        padding: 16,
        borderRadius: 15,
        backgroundColor: '#3A504C', // Darker shade for cards
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    lastReadContainer: {
        backgroundColor: '#3A504C', // Darker shade for last read container
        padding: 16,
        borderRadius: 15,
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    lastReadText: {
        fontFamily: 'Outfit_500Medium',
        fontSize: 16,
        color: '#FFFFFF',
        marginLeft: 10,
    },
});

export default QuranDashboard;
