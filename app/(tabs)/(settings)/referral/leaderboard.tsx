/**
 * Referral Leaderboard - Modern Design
 * 
 * Top referrers ranking
 * 
 * @version 2.0
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import { getAuth } from '@react-native-firebase/auth';
import { FontAwesome6 } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { MotiView } from 'moti';

import { useTheme } from '../../../../context/ThemeContext';
import { enter, maskEmail } from '../../../../utils';

// Medal colors for top 3
const MEDAL_COLORS = {
    1: '#FFD700', // Gold
    2: '#C0C0C0', // Silver
    3: '#CD7F32', // Bronze
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const LeaderboardScreen = () => {
    const { theme, isDarkMode } = useTheme();

    const [leaderboard, setLeaderboard] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [loggedInUserId, setLoggedInUserId] = useState<string | null>(null);

    useEffect(() => {
        const fetchLeaderboardData = async () => {
            setLoading(true);
            try {
                const auth = getAuth();
                const currentUser = auth.currentUser;

                if (currentUser) {
                    setLoggedInUserId(currentUser.uid);
                }

                const leaderboardQuery = await firestore()
                    .collection('users')
                    .orderBy('referralCount', 'desc')
                    .limit(10)
                    .get();

                const leaderboardData = leaderboardQuery.docs.map((doc) => ({
                    id: doc.id,
                    email: doc.data()?.email || 'Anonymous',
                    referralCount: doc.data()?.referralCount || 0,
                }));

                setLeaderboard(leaderboardData);
            } catch (error) {
                console.error('Error fetching leaderboard:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchLeaderboardData();
    }, []);

    const renderItem = ({ item, index }: { item: any; index: number }) => {
        const rank = index + 1;
        const isCurrentUser = item.id === loggedInUserId;
        const isTopThree = rank <= 3;
        const medalColor = MEDAL_COLORS[rank as keyof typeof MEDAL_COLORS];

        return (
            <MotiView
                from={{ opacity: 0, translateX: -20 }}
                animate={{ opacity: 1, translateX: 0 }}
                transition={enter(0)}
            >
                <BlurView
                    intensity={20}
                    tint={isDarkMode ? 'dark' : 'light'}
                    style={[
                        styles.leaderboardItem,
                        { backgroundColor: theme.colors.secondary },
                        isCurrentUser && [
                            styles.currentUserItem,
                            { backgroundColor: theme.colors.accent + '20' },
                        ],
                    ]}
                >
                    {/* Rank/Medal */}
                    <View style={[
                        styles.rankBadge,
                        { backgroundColor: isTopThree ? medalColor + '20' : theme.colors.primary + '50' },
                    ]}>
                        {isTopThree ? (
                            <FontAwesome6 name="medal" size={20} color={medalColor} solid />
                        ) : (
                            <Text style={[styles.rankText, { color: theme.colors.text.secondary }]}>
                                {rank}
                            </Text>
                        )}
                    </View>

                    {/* User Info */}
                    <View style={styles.userInfo}>
                        <Text
                            style={[
                                styles.email,
                                { color: theme.colors.text.primary },
                                isCurrentUser && [
                                    styles.currentUserText,
                                    { color: theme.colors.accent },
                                ],
                            ]}
                            numberOfLines={1}
                        >
                            {maskEmail(item.email)}
                        </Text>
                        {isCurrentUser && (
                            <Text style={[styles.youLabel, { color: theme.colors.accent }]}>
                                (You)
                            </Text>
                        )}
                    </View>

                    {/* Count */}
                    <View style={[styles.countBadge, { backgroundColor: theme.colors.accent + '15' }]}>
                        <FontAwesome6 name="users" size={14} color={theme.colors.accent} />
                        <Text style={[styles.countText, { color: theme.colors.accent }]}>
                            {item.referralCount}
                        </Text>
                    </View>
                </BlurView>
            </MotiView>
        );
    };

    if (loading) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: theme.colors.primary }]}>
                <View style={[styles.loadingIcon, { backgroundColor: theme.colors.accent + '15' }]}>
                    <ActivityIndicator size="large" color={theme.colors.accent} />
                </View>
                <Text style={[styles.loadingText, { color: theme.colors.text.secondary }]}>
                    Loading leaderboard...
                </Text>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.primary }]}>
            {/* Header */}
            <MotiView
                from={{ opacity: 0, translateY: -20 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={enter(0)}
            >
                <View style={styles.header}>
                    <View style={[styles.headerIcon, { backgroundColor: theme.colors.accent + '15' }]}>
                        <FontAwesome6 name="trophy" size={32} color={theme.colors.accent} />
                    </View>
                    <View style={styles.headerContent}>
                        <Text style={[styles.title, { color: theme.colors.text.primary }]}>
                            Leaderboard
                        </Text>
                        <Text style={[styles.subtitle, { color: theme.colors.text.secondary }]}>
                            Top {leaderboard.length} referrers
                        </Text>
                    </View>
                </View>
            </MotiView>

            {/* Leaderboard List */}
            <FlatList
                data={leaderboard}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <MotiView
                        from={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={enter(0)}
                    >
                        <BlurView
                            intensity={20}
                            tint={isDarkMode ? 'dark' : 'light'}
                            style={[styles.emptyCard, { backgroundColor: theme.colors.secondary }]}
                        >
                            <View style={[styles.emptyIcon, { backgroundColor: theme.colors.muted + '20' }]}>
                                <FontAwesome6 name="inbox" size={48} color={theme.colors.muted} />
                            </View>
                            <Text style={[styles.emptyTitle, { color: theme.colors.text.primary }]}>
                                No Data Yet
                            </Text>
                            <Text style={[styles.emptyText, { color: theme.colors.text.secondary }]}>
                                Be the first to invite friends and top the leaderboard!
                            </Text>
                        </BlurView>
                    </MotiView>
                }
            />
        </View>
    );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
    },

    // Loading
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 20,
    },
    loadingIcon: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        fontSize: 16,
        fontFamily: 'Outfit_500Medium',
    },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        marginBottom: 24,
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
    title: {
        fontSize: 28,
        fontFamily: 'Outfit_700Bold',
    },
    subtitle: {
        fontSize: 15,
        fontFamily: 'Outfit_400Regular',
    },

    // List
    listContent: {
        gap: 12,
        paddingBottom: 20,
    },

    // Leaderboard Item
    leaderboardItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        padding: 14,
        borderRadius: 14,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    currentUserItem: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 5,
    },
    rankBadge: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    rankText: {
        fontSize: 18,
        fontFamily: 'Outfit_700Bold',
    },
    userInfo: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    email: {
        fontSize: 15,
        fontFamily: 'Outfit_500Medium',
    },
    currentUserText: {
        fontFamily: 'Outfit_700Bold',
    },
    youLabel: {
        fontSize: 13,
        fontFamily: 'Outfit_600SemiBold',
    },
    countBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
    },
    countText: {
        fontSize: 15,
        fontFamily: 'Outfit_700Bold',
    },

    // Empty State
    emptyCard: {
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
    emptyIcon: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyTitle: {
        fontSize: 20,
        fontFamily: 'Outfit_700Bold',
    },
    emptyText: {
        fontSize: 15,
        fontFamily: 'Outfit_400Regular',
        textAlign: 'center',
        lineHeight: 22,
    },
});

export default LeaderboardScreen;