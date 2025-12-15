/**
 * Zakat Calculator - Modern Design
 * 
 * Choose between Harta and Fidyah calculators
 * 
 * @version 2.0
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { FontAwesome6 } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { MotiView } from 'moti';
import * as Haptics from 'expo-haptics';

import { useTheme } from '../../../../context/ThemeContext';
import { enter } from '../../../../utils';

// ============================================================================
// TYPES
// ============================================================================

type ZakatCard = {
    id: string;
    icon: string;
    title: string;
    description: string;
    route: string;
    color: string;
};

// ============================================================================
// DATA
// ============================================================================

const ZAKAT_CARDS: ZakatCard[] = [
    {
        id: 'harta',
        icon: 'coins',
        title: 'Zakat Harta',
        description: 'Calculate zakat on wealth including savings, gold, insurance, and shares.',
        route: '/zakat/harta',
        color: '#FFD700', // Gold
    },
    {
        id: 'fidyah',
        icon: 'hand-holding-heart',
        title: 'Zakat Fidyah',
        description: 'Calculate compensation for missed fasts due to illness or other valid reasons.',
        route: '/zakat/fidyah',
        color: '#4CAF50', // Green
    },
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const ZakatIndex = () => {
    const router = useRouter();
    const { theme, isDarkMode } = useTheme();

    const handleCardPress = (route: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        router.push(route as any);
    };

    return (
        <SafeAreaView style={[styles.mainContainer, { backgroundColor: theme.colors.primary }]}>
           <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Header */}
                <MotiView
                    from={{ opacity: 0, translateY: -20 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={enter(0)}
                >
                    <View style={styles.header}>
                        <View style={[styles.headerIcon, { backgroundColor: theme.colors.accent + '15' }]}>
                            <FontAwesome6 name="hand-holding-dollar" size={32} color={theme.colors.accent} />
                        </View>
                        <View style={styles.headerContent}>
                            <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]}>
                                Zakat Calculator
                            </Text>
                            <Text style={[styles.headerSubtitle, { color: theme.colors.text.secondary }]}>
                                Calculate your zakat obligations
                            </Text>
                        </View>
                    </View>
                </MotiView>

                {/* Info Card */}
                <MotiView
                    from={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={enter(0)}
                >
                    <BlurView
                        intensity={20}
                        tint={isDarkMode ? 'dark' : 'light'}
                        style={[styles.infoCard, { backgroundColor: theme.colors.secondary }]}
                    >
                        <View style={[styles.infoIcon, { backgroundColor: theme.colors.text.muted + '15' }]}>
                            <FontAwesome6 name="circle-info" size={18} color={theme.colors.text.muted} />
                        </View>
                        <View style={styles.infoContent}>
                            <Text style={[styles.infoText, { color: theme.colors.text.secondary }]}>
                                Zakat is one of the five pillars of Islam. Choose a calculator to determine your obligations.
                            </Text>
                        </View>
                    </BlurView>
                </MotiView>

                {/* Calculator Cards */}
                <View style={styles.cardsContainer}>
                    {ZAKAT_CARDS.map((card, index) => (
                        <MotiView
                            key={card.id}
                            from={{ opacity: 0, translateY: 20 }}
                            animate={{ opacity: 1, translateY: 0 }}
                            transition={enter(0)}
                        >
                            <TouchableOpacity
                                onPress={() => handleCardPress(card.route)}
                                activeOpacity={0.8}
                            >
                                <BlurView
                                    intensity={20}
                                    tint={isDarkMode ? 'dark' : 'light'}
                                    style={[styles.card, { backgroundColor: theme.colors.secondary }]}
                                >
                                    {/* Icon Badge */}
                                    <View style={[styles.cardIconBadge, { backgroundColor: card.color + '15' }]}>
                                        <FontAwesome6 name={card.icon as any} size={36} color={card.color} />
                                    </View>

                                    {/* Content */}
                                    <View style={styles.cardContent}>
                                        <View style={styles.cardHeader}>
                                            <Text style={[styles.cardTitle, { color: theme.colors.text.primary }]}>
                                                {card.title}
                                            </Text>
                                            <View style={[styles.arrowBadge, { backgroundColor: theme.colors.accent + '15' }]}>
                                                <FontAwesome6
                                                    name="arrow-right"
                                                    size={16}
                                                    color={theme.colors.accent}
                                                />
                                            </View>
                                        </View>
                                        <Text style={[styles.cardDescription, { color: theme.colors.text.secondary }]}>
                                            {card.description}
                                        </Text>
                                    </View>
                                </BlurView>
                            </TouchableOpacity>
                        </MotiView>
                    ))}
                </View>

                {/* Quick Info Section */}
                <MotiView
                    from={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={enter(0)}
                >
                    <BlurView
                        intensity={20}
                        tint={isDarkMode ? 'dark' : 'light'}
                        style={[styles.quickInfoCard, { backgroundColor: theme.colors.secondary }]}
                    >
                        <Text style={[styles.quickInfoTitle, { color: theme.colors.text.primary }]}>
                            Quick Information
                        </Text>

                        <View style={styles.quickInfoItems}>
                            {/* Nisab */}
                            <View style={styles.quickInfoItem}>
                                <View style={[styles.quickInfoIcon, { backgroundColor: theme.colors.accent + '15' }]}>
                                    <FontAwesome6 name="scale-balanced" size={16} color={theme.colors.accent} />
                                </View>
                                <View style={styles.quickInfoText}>
                                    <Text style={[styles.quickInfoLabel, { color: theme.colors.text.primary }]}>
                                        Nisab
                                    </Text>
                                    <Text style={[styles.quickInfoValue, { color: theme.colors.text.secondary }]}>
                                        Minimum wealth threshold
                                    </Text>
                                </View>
                            </View>

                            {/* Rate */}
                            <View style={styles.quickInfoItem}>
                                <View style={[styles.quickInfoIcon, { backgroundColor: theme.colors.accent + '15' }]}>
                                    <FontAwesome6 name="percent" size={16} color={theme.colors.accent} />
                                </View>
                                <View style={styles.quickInfoText}>
                                    <Text style={[styles.quickInfoLabel, { color: theme.colors.text.primary }]}>
                                        Rate
                                    </Text>
                                    <Text style={[styles.quickInfoValue, { color: theme.colors.text.secondary }]}>
                                        2.5% of total wealth
                                    </Text>
                                </View>
                            </View>

                            {/* Haul */}
                            <View style={styles.quickInfoItem}>
                                <View style={[styles.quickInfoIcon, { backgroundColor: theme.colors.accent + '15' }]}>
                                    <FontAwesome6 name="calendar-days" size={16} color={theme.colors.accent} />
                                </View>
                                <View style={styles.quickInfoText}>
                                    <Text style={[styles.quickInfoLabel, { color: theme.colors.text.primary }]}>
                                        Haul
                                    </Text>
                                    <Text style={[styles.quickInfoValue, { color: theme.colors.text.secondary }]}>
                                        One lunar year (354 days)
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </BlurView>
                </MotiView>
            </ScrollView>
        </SafeAreaView>
    );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        gap: 20,
    },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    headerIcon: {
        width: 70,
        height: 70,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    headerContent: {
        flex: 1,
        gap: 4,
    },
    headerTitle: {
        fontSize: 24,
        fontFamily: 'Outfit_700Bold',
    },
    headerSubtitle: {
        fontSize: 15,
        fontFamily: 'Outfit_400Regular',
    },

    // Info Card
    infoCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 14,
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 2,
    },
    infoIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    infoContent: {
        flex: 1,
    },
    infoText: {
        fontSize: 13,
        fontFamily: 'Outfit_400Regular',
        lineHeight: 18,
    },

    // Cards Container
    cardsContainer: {
        gap: 16,
    },

    // Calculator Card
    card: {
        flexDirection: 'row',
        padding: 20,
        borderRadius: 16,
        gap: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    cardIconBadge: {
        width: 70,
        height: 70,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardContent: {
        flex: 1,
        gap: 8,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
    },
    cardTitle: {
        fontSize: 20,
        fontFamily: 'Outfit_700Bold',
    },
    arrowBadge: {
        width: 32,
        height: 32,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardDescription: {
        fontSize: 14,
        fontFamily: 'Outfit_400Regular',
        lineHeight: 20,
    },

    // Quick Info Card
    quickInfoCard: {
        padding: 20,
        borderRadius: 16,
        gap: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    quickInfoTitle: {
        fontSize: 18,
        fontFamily: 'Outfit_700Bold',
    },
    quickInfoItems: {
        gap: 14,
    },
    quickInfoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    quickInfoIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    quickInfoText: {
        flex: 1,
        gap: 2,
    },
    quickInfoLabel: {
        fontSize: 15,
        fontFamily: 'Outfit_600SemiBold',
    },
    quickInfoValue: {
        fontSize: 13,
        fontFamily: 'Outfit_400Regular',
    },
});

export default ZakatIndex;