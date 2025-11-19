import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import { getAuth } from '@react-native-firebase/auth';
import { useTheme } from '../../../../context/ThemeContext';
import SignInModal from '../../../../components/SignInModal';
import { generateReferralCode } from '../../../../utils';
import { differenceInDays } from 'date-fns';
import DeviceInfo from 'react-native-device-info';
import { useRouter } from 'expo-router';
import ThemedButton from '../../../../components/ThemedButton';
import BannerAdComponent from '../../../../components/BannerAd';

const ReferralScreen = () => {
    const router = useRouter();
    const { theme } = useTheme();
    const styles = createStyles(theme);

    const [referralCode, setReferralCode] = useState<string | null>(null);
    const [userReferralCode, setUserReferralCode] = useState<string>(''); // For input field
    const [loading, setLoading] = useState<boolean>(true);
    const [userLoggedIn, setUserLoggedIn] = useState<boolean>(false); // Tracks user's login status
    const [isAuthModalVisible, setAuthModalVisible] = useState<boolean>(false); // State for modal visibility
    const [isNewUser, setIsNewUser] = useState<boolean>(false); // Tracks if the user is new
    const [invitedBy, setInvitedBy] = useState<string | null>(null); 

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

                        console.log('user data: ', userData)

                        // Check if the user is new (created within the last 7 days)
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

    const handleAuthModalToggle = () => {
        setAuthModalVisible(!isAuthModalVisible);
    };

    const handleGenerateReferralCode = async () => {
        try {
            const auth = getAuth();
            const currentUser = auth.currentUser;

            if (currentUser) {
                const userId = currentUser.uid;
                const userRef = firestore().collection('users').doc(userId);

                // Generate a unique referral code
                const referralCode = generateReferralCode(userId);

                // Update the user's record in Firestore
                await userRef.update({ referralCode });

                // Update the local state with the new referral code
                setReferralCode(referralCode);
            }
        } catch (error) {
            console.error('Error generating referral code:', error);
        }
    };

    const handleSubmitReferralCode = async () => {
        setLoading(true);

        try {
            const auth = getAuth();
            const currentUser = auth.currentUser;

            if (!currentUser) {
                Alert.alert('Error', 'You must be signed in to enter a referral code.');
                setLoading(false);
                return;
            }

            // Prevent self-referral
            if (userReferralCode.trim() === referralCode) {
                Alert.alert('Error', 'You cannot use your own referral code.');
                setLoading(false);
                return;
            }

            // Retrieve unique device ID
            const deviceId = DeviceInfo.getUniqueId();

            // Check if the device ID has already been used for a referral
            const deviceQuery = await firestore()
                .collection('referrals')
                .where('deviceId', '==', deviceId)
                .limit(1)
                .get();

            if (!deviceQuery.empty) {
                Alert.alert('Error', 'This device has already been used for a referral.');
                setLoading(false);
                return;
            }

            // Query Firestore to validate the referral code
            const referrerQuery = await firestore()
                .collection('users')
                .where('referralCode', '==', userReferralCode.trim())
                .limit(1)
                .get();

            if (!referrerQuery.empty) {
                const referrerDoc = referrerQuery.docs[0];
                const referrerId = referrerDoc.id;

                // Update the current user's invitedBy field
                await firestore().collection('users').doc(currentUser.uid).update({
                    invitedBy: userReferralCode,
                });

                // Increment the referrer's referral count
                await firestore().collection('users').doc(referrerId).update({
                    referralCount: firestore.FieldValue.increment(1),
                });

                // Record the referral usage in a new Firestore collection
                await firestore().collection('referrals').add({
                    deviceId,
                    referredBy: referrerId,
                    referredUserId: currentUser.uid,
                    timestamp: firestore.FieldValue.serverTimestamp(),
                });

                // Update the local state
                setInvitedBy(userReferralCode);

                Alert.alert('Success', 'Referral code applied successfully!');
            } else {
                Alert.alert('Error', 'Invalid referral code. Please try again.');
            }
        } catch (error) {
            console.error('Error handling referral code:', error);
            Alert.alert('Error', 'An error occurred while processing the referral code.');
        }

        setLoading(false);
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    return (
        <View style={styles.mainContainer}>
            <View style={styles.container}>
                <Text style={styles.title}>Referral Program</Text>

                <View style={styles.contentContainer}>
                    {userLoggedIn ? (
                        referralCode ? (
                            <View style={styles.cardContainer}>
                                <Text style={styles.cardTitle}>Your Referral Code</Text>
                                <Text style={styles.referralCode}>{referralCode}</Text>
                            </View>
                        ) : (
                            <View style={styles.cardContainer}>
                                <Text style={styles.cardTitle}>No Referral Code</Text>
                                <Text style={styles.cardDescription}>
                                    You currently don’t have a referral code. Tap the button below to generate one.
                                </Text>
                                <TouchableOpacity
                                    style={styles.generateButton}
                                    onPress={handleGenerateReferralCode}
                                >
                                    <Text style={styles.generateButtonText}>Generate Code</Text>
                                </TouchableOpacity>
                            </View>
                        )
                    ) : (
                        <View style={styles.cardContainer}>
                            <Text style={styles.cardTitle}>Join the Referral Program</Text>
                            <Text style={styles.cardDescription}>
                                You need to have an account to join the referral program. Please sign in or sign up to
                                participate.
                            </Text>
                            <TouchableOpacity style={styles.loginButton} onPress={handleAuthModalToggle}>
                                <Text style={styles.loginButtonText}>Sign In / Sign Up</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                {/* Enter Referral Code Section */}
                {userLoggedIn && isNewUser && !invitedBy && (
                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Have a referral code? Enter it below:</Text>
                        <TextInput
                            style={styles.inputField}
                            placeholder="Enter Referral Code"
                            placeholderTextColor={theme.colors.text.secondary}
                            value={userReferralCode}
                            onChangeText={setUserReferralCode}
                        />
                        <TouchableOpacity
                            style={[styles.submitButton, !userReferralCode.trim() && styles.disabledButton]}
                            onPress={handleSubmitReferralCode}
                            disabled={!userReferralCode.trim()}
                        >
                            <Text style={styles.submitButtonText}>Submit</Text>
                        </TouchableOpacity>
                    </View>
                )}

                <ThemedButton 
                    text="View Leaderboard"
                    onPress={() => router.push('/referral/leaderboard')}
                />

                {/* Sign In Modal */}
                <SignInModal isVisible={isAuthModalVisible} onClose={() => setAuthModalVisible(false)} />
            </View>

            {/* Banner Ad */}
            <BannerAdComponent />
        </View>
        
    );
};

const createStyles = (theme: any) => StyleSheet.create({
    mainContainer: {
        flex: 1,
        backgroundColor: theme.colors.primary,
    },
    container: {
        flex: 1,
        padding: theme.spacing.large,
        gap: theme.spacing.large
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontFamily: 'Outfit_500Medium',
        fontSize: theme.fontSizes.xlarge,
        color: theme.colors.text.secondary,
        textAlign: 'center',
    },
    contentContainer: {
        backgroundColor: theme.colors.secondary,
        borderRadius: theme.borderRadius.large,
        padding: theme.spacing.large,
        alignItems: 'center',
        ...theme.shadows.default,
    },
    cardContainer: {
        backgroundColor: theme.colors.tertiary,
        borderRadius: theme.borderRadius.large,
        padding: theme.spacing.large,
        alignItems: 'center',
        width: '100%',
        marginBottom: theme.spacing.large,
        ...theme.shadows.default,
    },
    cardTitle: {
        fontFamily: 'Outfit_500Medium',
        fontSize: theme.fontSizes.large,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.medium,
        textAlign: 'center',
    },
    cardDescription: {
        fontFamily: 'Outfit_400Regular',
        fontSize: theme.fontSizes.medium,
        color: theme.colors.text.secondary,
        marginBottom: theme.spacing.large,
        textAlign: 'center',
    },
    referralCode: {
        fontFamily: 'Outfit_600SemiBold',
        fontSize: theme.fontSizes.xlarge,
        color: theme.colors.text.highlight,
        marginTop: theme.spacing.medium,
    },
    generateButton: {
        backgroundColor: theme.colors.primary,
        paddingVertical: theme.spacing.medium,
        paddingHorizontal: theme.spacing.large,
        borderRadius: theme.borderRadius.small,
        marginTop: theme.spacing.medium,
        alignItems: 'center',
    },
    generateButtonText: {
        color: theme.colors.text.secondary,
        fontFamily: 'Outfit_500Medium',
        fontSize: theme.fontSizes.medium,
    },
    loginButton: {
        backgroundColor: theme.colors.primary,
        paddingVertical: theme.spacing.medium,
        paddingHorizontal: theme.spacing.large,
        borderRadius: theme.borderRadius.small,
        marginTop: theme.spacing.medium,
        alignItems: 'center',
    },
    loginButtonText: {
        color: theme.colors.text.secondary,
        fontFamily: 'Outfit_500Medium',
        fontSize: theme.fontSizes.medium,
    },
    inputContainer: {
        marginTop: theme.spacing.large,
        width: '100%',
        alignItems: 'center',
    },
    inputLabel: {
        fontFamily: 'Outfit_400Regular',
        fontSize: theme.fontSizes.medium,
        color: theme.colors.text.secondary,
        marginBottom: theme.spacing.medium,
    },
    inputField: {
        width: '100%',
        borderWidth: 1,
        borderColor: theme.colors.text.secondary,
        borderRadius: theme.borderRadius.small,
        padding: theme.spacing.medium,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.medium,
    },
    submitButton: {
        backgroundColor: theme.colors.primary,
        paddingVertical: theme.spacing.medium,
        paddingHorizontal: theme.spacing.large,
        borderRadius: theme.borderRadius.small,
        alignItems: 'center',
    },
    disabledButton: {
        backgroundColor: theme.colors.disabled,
    },
    submitButtonText: {
        color: theme.colors.text.secondary,
        fontFamily: 'Outfit_500Medium',
        fontSize: theme.fontSizes.medium,
    },
    leaderboardButton: {
        marginTop: theme.spacing.large,
        backgroundColor: theme.colors.primary,
        paddingVertical: theme.spacing.medium,
        paddingHorizontal: theme.spacing.large,
        borderRadius: theme.borderRadius.small,
        alignItems: 'center',
    },
    leaderboardButtonText: {
        color: theme.colors.text.secondary,
        fontFamily: 'Outfit_500Medium',
        fontSize: theme.fontSizes.medium,
    },
    adContainer: {
        alignItems: 'center',
        width: '100%', // Ensure the container doesn't exceed the screen width
        overflow: 'hidden', // Prevent any overflow
    },
});

export default ReferralScreen;