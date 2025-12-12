/**
 * Food Additives Database - Modern Design
 * 
 * Search halal food additives by E-code
 * 
 * @version 2.0
 */

import React from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { BlurView } from 'expo-blur';
import { MotiView } from 'moti';
import * as Haptics from 'expo-haptics';

import { useTheme } from '../../../../context/ThemeContext';
import { useFoodAdditivesPage } from '../../../../hooks/foodAdditives/useFoodAdditivesPage';
import { FoodAdditive } from '../../../../utils/types';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const FoodAdditivesPage = () => {
    const { theme, isDarkMode } = useTheme();

    const {
        searchQuery,
        filteredAdditives,
        isLoading,
        error,
        handleSearchChange,
        navigateToScanner,
    } = useFoodAdditivesPage();

    const getStatusBadgeColor = (status: string) => {
        if (status.toLowerCase().includes('ok') || status.toLowerCase() === 'halal') {
            return theme.colors.text.success || '#4CAF50';
        }
        if (status.toLowerCase().includes('not ok') || status.toLowerCase().includes('haram')) {
            return theme.colors.text.error || '#ff6b6b';
        }
        return theme.colors.text.error || '#FFC107';
    };

    const getStatusIcon = (status: string) => {
        if (status.toLowerCase().includes('ok') || status.toLowerCase() === 'halal') {
            return 'circle-check';
        }
        if (status.toLowerCase().includes('not ok') || status.toLowerCase().includes('haram')) {
            return 'circle-xmark';
        }
        return 'circle-question';
    };

    const renderFoodAdditive = ({ item, index }: { item: FoodAdditive; index: number }) => {
        const statusColor = getStatusBadgeColor(item.status);
        const statusIcon = getStatusIcon(item.status);

        return (
            <MotiView
                from={{ opacity: 0, translateX: -20 }}
                animate={{ opacity: 1, translateX: 0 }}
                transition={{
                    type: 'spring',
                    delay: index * 50,
                    damping: 20,
                }}
            >
                <BlurView
                    intensity={20}
                    tint={isDarkMode ? 'dark' : 'light'}
                    style={[styles.additiveCard, { backgroundColor: theme.colors.secondary }]}
                >
                    {/* Header Row */}
                    <View style={styles.cardHeader}>
                        {/* E-Code Badge */}
                        <View style={[styles.eCodeBadge, { backgroundColor: theme.colors.accent + '15' }]}>
                            <FontAwesome6 name="barcode" size={16} color={theme.colors.accent} />
                            <Text style={[styles.eCodeText, { color: theme.colors.accent }]}>
                                E{item.eCode}
                            </Text>
                        </View>

                        {/* Status Badge */}
                        <View style={[styles.statusBadge, { backgroundColor: statusColor + '15' }]}>
                            <FontAwesome6 name={statusIcon} size={14} color={statusColor} solid />
                            <Text style={[styles.statusText, { color: statusColor }]}>
                                {item.status}
                            </Text>
                        </View>
                    </View>

                    {/* Chemical Name */}
                    <Text style={[styles.chemicalName, { color: theme.colors.text.primary }]}>
                        {item.chemicalName}
                    </Text>

                    {/* Category (if available) */}
                    {item.category && (
                        <View style={[styles.categoryTag, { backgroundColor: theme.colors.primary + '50' }]}>
                            <FontAwesome6 name="tag" size={12} color={theme.colors.text.secondary} />
                            <Text style={[styles.categoryText, { color: theme.colors.text.secondary }]}>
                                {item.category}
                            </Text>
                        </View>
                    )}

                    {/* Description */}
                    <Text style={[styles.description, { color: theme.colors.text.secondary }]}>
                        {item.description}
                    </Text>
                </BlurView>
            </MotiView>
        );
    };

    if (isLoading) {
        return (
            <View style={[styles.mainContainer, { backgroundColor: theme.colors.primary }]}>
                <View style={styles.centeredContent}>
                    <View style={[styles.loadingIcon, { backgroundColor: theme.colors.accent + '15' }]}>
                        <FontAwesome6 name="flask" size={48} color={theme.colors.accent} />
                    </View>
                    <Text style={[styles.loadingTitle, { color: theme.colors.text.primary }]}>
                        Loading Database
                    </Text>
                    <Text style={[styles.loadingSubtitle, { color: theme.colors.text.secondary }]}>
                        Fetching food additive information...
                    </Text>
                </View>
            </View>
        );
    }

    if (error) {
        return (
            <View style={[styles.mainContainer, { backgroundColor: theme.colors.primary }]}>
                <View style={styles.centeredContent}>
                    <View style={[styles.errorIcon, { backgroundColor: '#ff6b6b15' }]}>
                        <FontAwesome6 name="triangle-exclamation" size={48} color="#ff6b6b" />
                    </View>
                    <Text style={[styles.errorTitle, { color: theme.colors.text.primary }]}>
                        Something Went Wrong
                    </Text>
                    <Text style={[styles.errorSubtitle, { color: theme.colors.text.secondary }]}>
                        Failed to load food additives database
                    </Text>
                    <TouchableOpacity
                        style={[styles.retryButton, { backgroundColor: theme.colors.accent }]}
                        onPress={() => window.location.reload()}
                        activeOpacity={0.8}
                    >
                        <FontAwesome6 name="rotate-right" size={16} color="#fff" />
                        <Text style={styles.retryButtonText}>Try Again</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <View style={[styles.mainContainer, { backgroundColor: theme.colors.primary }]}>
            {/* Header */}
            <MotiView
                from={{ opacity: 0, translateY: -20 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: 'spring', damping: 20 }}
            >
                <View style={styles.header}>
                    <View style={[styles.headerIcon, { backgroundColor: theme.colors.accent + '15' }]}>
                        <FontAwesome6 name="flask-vial" size={28} color={theme.colors.accent} />
                    </View>
                    <View style={styles.headerContent}>
                        <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]}>
                            Food Additives
                        </Text>
                        <Text style={[styles.headerSubtitle, { color: theme.colors.text.secondary }]}>
                            Search halal E-codes database
                        </Text>
                    </View>
                </View>
            </MotiView>

            {/* Info Card */}
            <MotiView
                from={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', delay: 100, damping: 20 }}
            >
                <BlurView
                    intensity={20}
                    tint={isDarkMode ? 'dark' : 'light'}
                    style={[styles.infoCard, { backgroundColor: theme.colors.secondary }]}
                >
                    <View style={[styles.infoIcon, { backgroundColor: theme.colors.text.muted + '15' }]}>
                        <FontAwesome6 name="circle-info" size={18} color={theme.colors.text.muted} />
                    </View>
                    <Text style={[styles.infoText, { color: theme.colors.text.secondary }]}>
                        Search by E-code number or chemical name to check halal status
                    </Text>
                </BlurView>
            </MotiView>

            {/* Search Bar */}
            <MotiView
                from={{ opacity: 0, translateY: -20 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: 'spring', delay: 150, damping: 20 }}
            >
                <BlurView
                    intensity={20}
                    tint={isDarkMode ? 'dark' : 'light'}
                    style={[styles.searchContainer, { backgroundColor: theme.colors.secondary }]}
                >
                    <View style={[styles.searchIconBadge, { backgroundColor: theme.colors.accent }]}>
                        <FontAwesome6 name="magnifying-glass" size={16} color="#fff" />
                    </View>
                    <TextInput
                        style={[styles.searchInput, { color: theme.colors.text.primary }]}
                        placeholder="Search E-code or name..."
                        placeholderTextColor={theme.colors.text.muted}
                        value={searchQuery}
                        onChangeText={(text) => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            handleSearchChange(text);
                        }}
                        autoCapitalize="none"
                        autoCorrect={false}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity
                            style={styles.clearButton}
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                handleSearchChange('');
                            }}
                        >
                            <FontAwesome6 name="circle-xmark" size={20} color={theme.colors.text.muted} solid />
                        </TouchableOpacity>
                    )}
                </BlurView>
            </MotiView>

            {/* Results Count */}
            {searchQuery.length > 0 && (
                <MotiView
                    from={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ type: 'timing', duration: 200 }}
                >
                    <Text style={[styles.resultsCount, { color: theme.colors.text.muted }]}>
                        {filteredAdditives.length} result{filteredAdditives.length !== 1 ? 's' : ''} found
                    </Text>
                </MotiView>
            )}

            {/* Additives List */}
            {filteredAdditives.length > 0 ? (
                <FlashList
                    estimatedItemSize={180}
                    data={filteredAdditives}
                    keyExtractor={(item) => item.id}
                    renderItem={renderFoodAdditive}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.listContent}
                />
            ) : searchQuery.length > 0 ? (
                <MotiView
                    from={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', damping: 15 }}
                    style={styles.noResultsWrapper}
                >
                    <BlurView
                        intensity={20}
                        tint={isDarkMode ? 'dark' : 'light'}
                        style={[styles.noResultsCard, { backgroundColor: theme.colors.secondary }]}
                    >
                        <View style={[styles.noResultsIcon, { backgroundColor: theme.colors.muted + '20' }]}>
                            <FontAwesome6 name="magnifying-glass" size={48} color={theme.colors.muted} />
                        </View>
                        <Text style={[styles.noResultsTitle, { color: theme.colors.text.primary }]}>
                            No Results Found
                        </Text>
                        <Text style={[styles.noResultsSubtitle, { color: theme.colors.text.secondary }]}>
                            No additives match "{searchQuery}"
                        </Text>
                        <Text style={[styles.noResultsHint, { color: theme.colors.text.muted }]}>
                            Try a different E-code or chemical name
                        </Text>
                    </BlurView>
                </MotiView>
            ) : (
                <MotiView
                    from={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', damping: 15 }}
                    style={styles.noResultsWrapper}
                >
                    <BlurView
                        intensity={20}
                        tint={isDarkMode ? 'dark' : 'light'}
                        style={[styles.noResultsCard, { backgroundColor: theme.colors.secondary }]}
                    >
                        <View style={[styles.noResultsIcon, { backgroundColor: theme.colors.accent + '15' }]}>
                            <FontAwesome6 name="flask" size={48} color={theme.colors.accent} />
                        </View>
                        <Text style={[styles.noResultsTitle, { color: theme.colors.text.primary }]}>
                            Search Additives
                        </Text>
                        <Text style={[styles.noResultsSubtitle, { color: theme.colors.text.secondary }]}>
                            Enter an E-code or chemical name to begin
                        </Text>
                    </BlurView>
                </MotiView>
            )}
        </View>
    );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
        padding: 20,
    },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        marginBottom: 16,
    },
    headerIcon: {
        width: 60,
        height: 60,
        borderRadius: 16,
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
        fontSize: 14,
        fontFamily: 'Outfit_400Regular',
    },

    // Info Card
    infoCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 14,
        borderRadius: 12,
        marginBottom: 16,
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
    infoText: {
        flex: 1,
        fontSize: 13,
        fontFamily: 'Outfit_400Regular',
        lineHeight: 18,
    },

    // Search Bar
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 12,
        borderRadius: 16,
        marginBottom: 12,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    searchIconBadge: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        fontFamily: 'Outfit_400Regular',
    },
    clearButton: {
        padding: 4,
    },

    // Results Count
    resultsCount: {
        fontSize: 13,
        fontFamily: 'Outfit_500Medium',
        marginBottom: 12,
        paddingHorizontal: 4,
    },

    // List
    listContent: {
        paddingBottom: 20,
    },

    // Additive Card
    additiveCard: {
        padding: 16,
        borderRadius: 14,
        marginBottom: 12,
        gap: 12,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        flexWrap: 'wrap', 
    },
    eCodeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
    },
    eCodeText: {
        fontSize: 16,
        fontFamily: 'Outfit_700Bold',
        letterSpacing: 0.5,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
        flexShrink: 1,             // ✅ allow badge to shrink to available width
        maxWidth: '100%', 
    },
    statusText: {
        fontSize: 13,
        fontFamily: 'Outfit_600SemiBold',
        flexShrink: 1,
    },
    chemicalName: {
        fontSize: 17,
        fontFamily: 'Outfit_600SemiBold',
        lineHeight: 24,
    },
    categoryTag: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
    },
    categoryText: {
        fontSize: 12,
        fontFamily: 'Outfit_500Medium',
    },
    description: {
        fontSize: 14,
        fontFamily: 'Outfit_400Regular',
        lineHeight: 20,
    },

    // Centered Content (Loading/Error)
    centeredContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 16,
        padding: 40,
    },
    loadingIcon: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingTitle: {
        fontSize: 20,
        fontFamily: 'Outfit_700Bold',
    },
    loadingSubtitle: {
        fontSize: 15,
        fontFamily: 'Outfit_400Regular',
        textAlign: 'center',
    },
    errorIcon: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorTitle: {
        fontSize: 20,
        fontFamily: 'Outfit_700Bold',
        textAlign: 'center',
    },
    errorSubtitle: {
        fontSize: 15,
        fontFamily: 'Outfit_400Regular',
        textAlign: 'center',
    },
    retryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 12,
        marginTop: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 3,
    },
    retryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontFamily: 'Outfit_600SemiBold',
    },

    // No Results
    noResultsWrapper: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
    },
    noResultsCard: {
        padding: 40,
        borderRadius: 16,
        alignItems: 'center',
        gap: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    noResultsIcon: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
    noResultsTitle: {
        fontSize: 20,
        fontFamily: 'Outfit_700Bold',
        textAlign: 'center',
    },
    noResultsSubtitle: {
        fontSize: 15,
        fontFamily: 'Outfit_500Medium',
        textAlign: 'center',
    },
    noResultsHint: {
        fontSize: 13,
        fontFamily: 'Outfit_400Regular',
        textAlign: 'center',
    },
});

export default FoodAdditivesPage;