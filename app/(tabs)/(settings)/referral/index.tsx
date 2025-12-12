/**
 * Referral Program - Modern Design
 * 
 * Generate and share referral codes
 * 
 * @version 2.0
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Alert, Share } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import { getAuth } from '@react-native-firebase/auth';
import { FontAwesome6 } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { MotiView } from 'moti';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import { differenceInDays } from 'date-fns';
import DeviceInfo from 'react-native-device-info';
import { useRouter } from 'expo-router';

import { useTheme } from '../../../../context/ThemeContext';
import SignInModal from '../../../../components/SignInModal';
import ThemedButton from '../../../../components/ThemedButton';
import BannerAdComponent from '../../../../components/BannerAd';
import { generateReferralCode } from '../../../../utils';
import { calculateContrastColor } from '../../../../utils';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const ReferralScreen = () => {
    const router = useRouter();
    const { theme, isDarkMode } = useTheme();

    const [referralCode, setReferralCode] = useState<string | null>(null);
    const [userReferralCode, setUserReferralCode] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(true);
    const [userLoggedIn, setUserLoggedIn] = useState<boolean>(false);
    const [isAuthModalVisible, setAuthModalVisible] = useState<boolean>(false);
    const [isNewUser, setIsNewUser] = useState<boolean>(false);
    const [invitedBy, setInvitedBy] = useState<string | null>(null);
    const [referralCount, setReferralCount] = useState<number>(0);

    useEffect(() => {
        const checkAuthStatus = async () => {
            const auth = getAuth();
            const currentUser = auth.currentUser;

            if (currentUser) {
                setUserLoggedIn(true);
                try {
                    const userRef = firestore().collection('users').doc(currentUser.uid);
                    const doc = await userRef.get();

                    if (doc.exists()) {
                        const userData = doc.data();
                        setReferralCode(userData?.referralCode || null);
                        setInvitedBy(userData?.invitedBy || null);
                        setReferralCount(userData?.referralCount || 0);

                        if (userData?.createdAt) {
                            const createdAt = userData.createdAt.toDate();
                            const daysSinceCreated = differenceInDays(new Date(), createdAt);
                            setIsNewUser(daysSinceCreated <= 7);
                        }
                    }
                } catch (error) {
                    console.error('Error fetching referral code:', error);
                }
            } else {
                setUserLoggedIn(false);
            }

            setLoading(false);
        };

        checkAuthStatus();
    }, []);

    const handleGenerateReferralCode = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        
        try {
            const auth = getAuth();
            const currentUser = auth.currentUser;

            if (currentUser) {
                const userId = currentUser.uid;
                const userRef = firestore().collection('users').doc(userId);
                const referralCode = generateReferralCode(userId);

                await userRef.update({ referralCode });
                setReferralCode(referralCode);
                
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
        } catch (error) {
            console.error('Error generating referral code:', error);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
    };

    const handleCopyCode = async () => {
        if (referralCode) {
            await Clipboard.setStringAsync(referralCode);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert('Copied!', 'Referral code copied to clipboard');
        }
    };

    const handleShareCode = async () => {
        if (referralCode) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            try {
                await Share.share({
                    message: `Join me on Musollah! Use my referral code: ${referralCode}`,
                });
            } catch (error) {
                console.error('Error sharing:', error);
            }
        }
    };

    const handleSubmitReferralCode = async () => {
        setLoading(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        try {
            const auth = getAuth();
            const currentUser = auth.currentUser;

            if (!currentUser) {
                Alert.alert('Error', 'You must be signed in to enter a referral code.');
                setLoading(false);
                return;
            }

            if (userReferralCode.trim() === referralCode) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                Alert.alert('Error', 'You cannot use your own referral code.');
                setLoading(false);
                return;
            }

            const deviceId = DeviceInfo.getUniqueId();

            const deviceQuery = await firestore()
                .collection('referrals')
                .where('deviceId', '==', deviceId)
                .limit(1)
                .get();

            if (!deviceQuery.empty) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                Alert.alert('Error', 'This device has already been used for a referral.');
                setLoading(false);
                return;
            }

            const referrerQuery = await firestore()
                .collection('users')
                .where('referralCode', '==', userReferralCode.trim())
                .limit(1)
                .get();

            if (!referrerQuery.empty) {
                const referrerDoc = referrerQuery.docs[0];
                const referrerId = referrerDoc.id;

                await firestore().collection('users').doc(currentUser.uid).update({
                    invitedBy: userReferralCode,
                });

                await firestore().collection('users').doc(referrerId).update({
                    referralCount: firestore.FieldValue.increment(1),
                });

                await firestore().collection('referrals').add({
                    deviceId,
                    referredBy: referrerId,
                    referredUserId: currentUser.uid,
                    timestamp: firestore.FieldValue.serverTimestamp(),
                });

                setInvitedBy(userReferralCode);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                Alert.alert('Success', 'Referral code applied successfully!');
            } else {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                Alert.alert('Error', 'Invalid referral code. Please try again.');
            }
        } catch (error) {
            console.error('Error handling referral code:', error);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert('Error', 'An error occurred while processing the referral code.');
        }

        setLoading(false);
    };

    if (loading) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: theme.colors.primary }]}>
                <View style={[styles.loadingIcon, { backgroundColor: theme.colors.accent + '15' }]}>
                    <ActivityIndicator size="large" color={theme.colors.accent} />
                </View>
                <Text style={[styles.loadingText, { color: theme.colors.text.secondary }]}>
                    Loading...
                </Text>
            </View>
        );
    }

    return (
        <View style={[styles.mainContainer, { backgroundColor: theme.colors.primary }]}>
            <View style={styles.container}>
                {/* Header */}
                <MotiView
                    from={{ opacity: 0, translateY: -20 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ type: 'spring', damping: 20 }}
                >
                    <View style={styles.header}>
                        <View style={[styles.headerIcon, { backgroundColor: theme.colors.accent + '15' }]}>
                            <FontAwesome6 name="gift" size={32} color={theme.colors.accent} />
                        </View>
                        <View style={styles.headerContent}>
                            <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]}>
                                Referral Program
                            </Text>
                            <Text style={[styles.headerSubtitle, { color: theme.colors.text.secondary }]}>
                                Invite friends and earn rewards
                            </Text>
                        </View>
                    </View>
                </MotiView>

                {/* Main Content */}
                <MotiView
                    from={{ opacity: 0, translateY: -20 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ type: 'spring', delay: 100, damping: 20 }}
                >
                    {userLoggedIn ? (
                        referralCode ? (
                            // Has Referral Code
                            <BlurView
                                intensity={20}
                                tint={isDarkMode ? 'dark' : 'light'}
                                style={[styles.codeCard, { backgroundColor: theme.colors.secondary }]}
                            >
                                {/* Stats */}
                                <View style={styles.statsContainer}>
                                    <View style={[styles.statCard, { backgroundColor: theme.colors.accent + '15' }]}>
                                        <FontAwesome6 name="users" size={24} color={theme.colors.accent} />
                                        <Text style={[styles.statValue, { color: theme.colors.accent }]}>
                                            {referralCount}
                                        </Text>
                                        <Text style={[styles.statLabel, { color: theme.colors.text.secondary }]}>
                                            Referrals
                                        </Text>
                                    </View>
                                </View>

                                {/* Code Display */}
                                <View style={styles.codeSection}>
                                    <Text style={[styles.codeLabel, { color: theme.colors.text.secondary }]}>
                                        Your Referral Code
                                    </Text>
                                    <View style={[styles.codeBox, { backgroundColor: theme.colors.primary + '50' }]}>
                                        <FontAwesome6 name="ticket" size={20} color={theme.colors.accent} />
                                        <Text style={[styles.codeText, { color: theme.colors.accent }]}>
                                            {referralCode}
                                        </Text>
                                    </View>
                                </View>

                                {/* Action Buttons */}
                                <View style={styles.actionButtons}>
                                    <TouchableOpacity
                                        style={[styles.actionButton, { backgroundColor: theme.colors.accent }]}
                                        onPress={handleCopyCode}
                                        activeOpacity={0.8}
                                    >
                                        <FontAwesome6
                                            name="copy"
                                            size={16}
                                            color={calculateContrastColor(theme.colors.accent)}
                                        />
                                        <Text style={[styles.actionButtonText, { color: calculateContrastColor(theme.colors.accent) }]}>
                                            Copy
                                        </Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[styles.actionButton, { backgroundColor: theme.colors.text.success }]}
                                        onPress={handleShareCode}
                                        activeOpacity={0.8}
                                    >
                                        <FontAwesome6
                                            name="share-nodes"
                                            size={16}
                                            color="#fff"
                                        />
                                        <Text style={[styles.actionButtonText, { color: '#fff' }]}>
                                            Share
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </BlurView>
                        ) : (
                            // No Code Yet
                            <BlurView
                                intensity={20}
                                tint={isDarkMode ? 'dark' : 'light'}
                                style={[styles.emptyCard, { backgroundColor: theme.colors.secondary }]}
                            >
                                <View style={[styles.emptyIcon, { backgroundColor: theme.colors.accent + '15' }]}>
                                    <FontAwesome6 name="ticket" size={48} color={theme.colors.accent} />
                                </View>
                                <Text style={[styles.emptyTitle, { color: theme.colors.text.primary }]}>
                                    No Referral Code
                                </Text>
                                <Text style={[styles.emptyDescription, { color: theme.colors.text.secondary }]}>
                                    Generate your unique referral code to start inviting friends
                                </Text>
                                <TouchableOpacity
                                    style={[styles.generateButton, { backgroundColor: theme.colors.accent }]}
                                    onPress={handleGenerateReferralCode}
                                    activeOpacity={0.8}
                                >
                                    <FontAwesome6
                                        name="wand-magic-sparkles"
                                        size={16}
                                        color={calculateContrastColor(theme.colors.accent)}
                                    />
                                    <Text style={[styles.generateButtonText, { color: calculateContrastColor(theme.colors.accent) }]}>
                                        Generate Code
                                    </Text>
                                </TouchableOpacity>
                            </BlurView>
                        )
                    ) : (
                        // Not Logged In
                        <BlurView
                            intensity={20}
                            tint={isDarkMode ? 'dark' : 'light'}
                            style={[styles.emptyCard, { backgroundColor: theme.colors.secondary }]}
                        >
                            <View style={[styles.emptyIcon, { backgroundColor: theme.colors.text.error + '15' }]}>
                                <FontAwesome6 name="user-lock" size={48} color={theme.colors.text.error} />
                            </View>
                            <Text style={[styles.emptyTitle, { color: theme.colors.text.primary }]}>
                                Join the Program
                            </Text>
                            <Text style={[styles.emptyDescription, { color: theme.colors.text.secondary }]}>
                                Sign in or create an account to participate in our referral program
                            </Text>
                            <TouchableOpacity
                                style={[styles.generateButton, { backgroundColor: theme.colors.accent }]}
                                onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                    setAuthModalVisible(true);
                                }}
                                activeOpacity={0.8}
                            >
                                <FontAwesome6
                                    name="arrow-right"
                                    size={16}
                                    color={calculateContrastColor(theme.colors.accent)}
                                />
                                <Text style={[styles.generateButtonText, { color: calculateContrastColor(theme.colors.accent) }]}>
                                    Sign In / Sign Up
                                </Text>
                            </TouchableOpacity>
                        </BlurView>
                    )}
                </MotiView>

                {/* Enter Code Section (New Users) */}
                {userLoggedIn && isNewUser && !invitedBy && (
                    <MotiView
                        from={{ opacity: 0, translateY: -20 }}
                        animate={{ opacity: 1, translateY: 0 }}
                        transition={{ type: 'spring', delay: 200, damping: 20 }}
                    >
                        <BlurView
                            intensity={20}
                            tint={isDarkMode ? 'dark' : 'light'}
                            style={[styles.inputCard, { backgroundColor: theme.colors.secondary }]}
                        >
                            <View style={styles.inputHeader}>
                                <View style={[styles.inputIcon, { backgroundColor: theme.colors.text.muted + '15' }]}>
                                    <FontAwesome6 name="ticket-simple" size={18} color={theme.colors.text.muted} />
                                </View>
                                <Text style={[styles.inputTitle, { color: theme.colors.text.primary }]}>
                                    Have a Referral Code?
                                </Text>
                            </View>
                            <View style={[styles.inputWrapper, { backgroundColor: theme.colors.primary + '50' }]}>
                                <TextInput
                                    style={[styles.input, { color: theme.colors.text.primary }]}
                                    placeholder="Enter code here..."
                                    placeholderTextColor={theme.colors.text.muted}
                                    value={userReferralCode}
                                    onChangeText={setUserReferralCode}
                                    autoCapitalize="characters"
                                />
                            </View>
                            <TouchableOpacity
                                style={[
                                    styles.submitButton,
                                    { backgroundColor: theme.colors.accent },
                                    !userReferralCode.trim() && styles.disabledButton,
                                ]}
                                onPress={handleSubmitReferralCode}
                                disabled={!userReferralCode.trim()}
                                activeOpacity={0.8}
                            >
                                <FontAwesome6
                                    name="check"
                                    size={16}
                                    color={calculateContrastColor(theme.colors.accent)}
                                />
                                <Text style={[styles.submitButtonText, { color: calculateContrastColor(theme.colors.accent) }]}>
                                    Submit Code
                                </Text>
                            </TouchableOpacity>
                        </BlurView>
                    </MotiView>
                )}

                {/* Leaderboard Button */}
                <MotiView
                    from={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', delay: 300, damping: 20 }}
                >
                    <ThemedButton
                        text="View Leaderboard"
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                            router.push('/referral/leaderboard');
                        }}
                    />
                </MotiView>
            </View>

            {/* Banner Ad */}
            <BannerAdComponent />

            {/* Sign In Modal */}
            <SignInModal isVisible={isAuthModalVisible} onClose={() => setAuthModalVisible(false)} />
        </View>
    );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
    },
    container: {
        flex: 1,
        padding: 20,
        gap: 20,
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
        marginBottom: 4,
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

    // Code Card
    codeCard: {
        borderRadius: 16,
        padding: 24,
        gap: 24,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
    },
    statCard: {
        alignItems: 'center',
        gap: 8,
        padding: 20,
        borderRadius: 14,
        minWidth: 120,
    },
    statValue: {
        fontSize: 32,
        fontFamily: 'Outfit_700Bold',
    },
    statLabel: {
        fontSize: 14,
        fontFamily: 'Outfit_500Medium',
    },
    codeSection: {
        gap: 12,
    },
    codeLabel: {
        fontSize: 14,
        fontFamily: 'Outfit_500Medium',
        textAlign: 'center',
    },
    codeBox: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        padding: 16,
        borderRadius: 12,
    },
    codeText: {
        fontSize: 24,
        fontFamily: 'Outfit_700Bold',
        letterSpacing: 2,
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 3,
    },
    actionButtonText: {
        fontSize: 15,
        fontFamily: 'Outfit_600SemiBold',
    },

    // Empty Card
    emptyCard: {
        borderRadius: 16,
        padding: 32,
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
        fontSize: 22,
        fontFamily: 'Outfit_700Bold',
        textAlign: 'center',
    },
    emptyDescription: {
        fontSize: 15,
        fontFamily: 'Outfit_400Regular',
        textAlign: 'center',
        lineHeight: 22,
    },
    generateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        paddingVertical: 14,
        paddingHorizontal: 32,
        borderRadius: 12,
        marginTop: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 3,
    },
    generateButtonText: {
        fontSize: 16,
        fontFamily: 'Outfit_600SemiBold',
    },

    // Input Card
    inputCard: {
        borderRadius: 16,
        padding: 20,
        gap: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    inputHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    inputIcon: {
        width: 40,
        height: 40,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    inputTitle: {
        fontSize: 18,
        fontFamily: 'Outfit_600SemiBold',
    },
    inputWrapper: {
        borderRadius: 12,
        padding: 14,
    },
    input: {
        fontSize: 16,
        fontFamily: 'Outfit_500Medium',
        textAlign: 'center',
        letterSpacing: 2,
    },
    submitButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        paddingVertical: 14,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 3,
    },
    disabledButton: {
        opacity: 0.5,
    },
    submitButtonText: {
        fontSize: 16,
        fontFamily: 'Outfit_600SemiBold',
    },
});

export default ReferralScreen;