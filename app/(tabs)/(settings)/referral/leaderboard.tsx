import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, ScrollView, Modal } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import { useTheme } from '../../../../context/ThemeContext';
import { getAuth } from '@react-native-firebase/auth';
import { maskEmail } from '../../../../utils';

const LeaderboardScreen = () => {
    const { theme } = useTheme();
    const styles = createStyles(theme);
    const [isModalVisible, setModalVisible] = useState(false);

    const handleOpenModal = () => {
        setModalVisible(true);
      };
    
      const handleCloseModal = () => {
        setModalVisible(false);
      };

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

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    return (
        <View style={styles.mainContainer}>
            <Text style={styles.title}>Top Referrers</Text>
            <FlatList
                data={leaderboard}
                keyExtractor={(item) => item.id}
                renderItem={({ item, index }) => (
                    <View style={[styles.leaderboardItem, item.id === loggedInUserId && styles.highlightedRow]}>
                        <Text style={styles.rank}>{index + 1}.</Text>
                        <Text style={[styles.name, item.id === loggedInUserId && styles.highlightedText]}>{maskEmail(item.email)}</Text>
                        <Text style={styles.count}>{item.referralCount} referrals</Text>
                    </View>
                )}
            />
        </View>
    );
};

const createStyles = (theme: any) => StyleSheet.create({
    mainContainer: {
        flex: 1,
        backgroundColor: theme.colors.primary,
        padding: theme.spacing.large,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    highlightedRow: {
        backgroundColor: theme.colors.highlight, // Highlight color for row
        borderRadius: theme.borderRadius.small,
    },
    title: {
        fontFamily: 'Outfit_600SemiBold',
        fontSize: theme.fontSizes.xlarge,
        color: theme.colors.text.primary,
        textAlign: 'center',
        marginBottom: theme.spacing.large,
    },
    leaderboardItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: theme.spacing.medium,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.text.secondary,
    },
    rank: {
        fontFamily: 'Outfit_500Medium',
        fontSize: theme.fontSizes.medium,
        color: theme.colors.text.secondary,
        width: '10%',
    },
    name: {
        fontFamily: 'Outfit_400Regular',
        fontSize: theme.fontSizes.medium,
        color: theme.colors.text.primary,
        width: '60%',
    },
    highlightedText: {
        fontFamily: 'Outfit_600SemiBold', // Bold or special font
        color: theme.colors.text.highlight, // Highlight color for text
    },
    count: {
        fontFamily: 'Outfit_400Regular',
        fontSize: theme.fontSizes.medium,
        color: theme.colors.text.primary,
        textAlign: 'right',
        width: '30%',
    },
});

export default LeaderboardScreen;
