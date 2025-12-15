/**
 * Zakat Harta Calculator - Modern Design
 * 
 * Calculate zakat on wealth (savings, gold, insurance, shares)
 * 
 * @version 2.0
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { MotiView } from 'moti';
import * as Haptics from 'expo-haptics';
import { format } from 'date-fns';

import { useTheme } from '../../../../../context/ThemeContext';
import GuideModal from '../../../../../components/zakat/GuideModal';
import SharesModal from '../../../../../components/zakat/SharesModal';
import InsuranceModal from '../../../../../components/zakat/InsuranceModal';
import GoldModal from '../../../../../components/zakat/GoldModal';
import SavingsModal from '../../../../../components/zakat/SavingsModal';
import EligibilityModal from '../../../../../components/zakat/EligibilityModal';
import ZakatTable from '../../../../../components/zakat/ZakatTable';
import ThemedButton from '../../../../../components/ThemedButton';
import { useZakatHartaCalculator } from '../../../../../hooks/zakat/useZakatHartaCalculator';
import { enter } from '../../../../../utils';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const ZakatHarta = () => {
    const { theme, isDarkMode } = useTheme();

    const {
        // State
        savings,
        savingsInterest,
        gold,
        insurance,
        shares,
        usedGold,
        unusedGold,
        eligibility,
        haulStates,
        totalZakat,
        nisabAmount,
        goldPriceData,
        isLoadingGoldPrice,
        nisabAmountNotWearing,
        urufAmountWearing,

        // Modal state
        isEligibilityModalVisible,
        savingsModalVisible,
        goldModalVisible,
        insuranceModalVisible,
        sharesModalVisible,
        guideModalVisible,

        // Actions
        setSavings,
        setGold,
        setInsurance,
        setShares,
        setIsEligibilityModalVisible,
        setIsSavingsModalVisible,
        setIsGoldModalVisible,
        setIsInsuranceModalVisible,
        setIsSharesModalVisible,
        setIsGuideModalVisible,
        handleEligibilityCalculated,
        handleGoldSave,
    } = useZakatHartaCalculator();

    const renderEligibilityIcon = (isEligible: boolean) => {
        return isEligible ? (
            <FontAwesome6 name="circle-check" size={24} color={theme.colors.text.success || '#4CAF50'} solid />
        ) : (
            <FontAwesome6 name="circle-xmark" size={24} color={theme.colors.text.error || '#ff6b6b'} solid />
        );
    };

    const formattedTimestamp = goldPriceData?.timestamp
        ? format(new Date(goldPriceData.timestamp), 'dd MMM yyyy, hh:mm a')
        : '';

    if (isLoadingGoldPrice) {
        return (
            <View style={[styles.container, { backgroundColor: theme.colors.primary }]}>
                <View style={styles.centeredContent}>
                    <View style={[styles.loadingIcon, { backgroundColor: theme.colors.accent + '15' }]}>
                        <FontAwesome6 name="coins" size={48} color={theme.colors.accent} />
                    </View>
                    <Text style={[styles.loadingTitle, { color: theme.colors.text.primary }]}>
                        Loading Calculator
                    </Text>
                    <Text style={[styles.loadingSubtitle, { color: theme.colors.text.secondary }]}>
                        Fetching current gold prices...
                    </Text>
                </View>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.primary }]}>
            <ScrollView
                contentContainerStyle={styles.scrollContainer}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <MotiView
                    from={{ opacity: 0, translateY: -20 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={enter(0)}
                >
                    <View style={styles.header}>
                        <View style={[styles.headerIcon, { backgroundColor: '#FFD700' + '15' }]}>
                            <FontAwesome6 name="coins" size={28} color="#FFD700" />
                        </View>
                        <View style={styles.headerContent}>
                            <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]}>
                                Zakat Harta
                            </Text>
                            <Text style={[styles.headerSubtitle, { color: theme.colors.text.secondary }]}>
                                Wealth Zakat Calculator
                            </Text>
                        </View>
                    </View>
                </MotiView>

                {/* Nisab Card */}
                <MotiView
                    from={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={enter(0)}
                >
                    <BlurView
                        intensity={20}
                        tint={isDarkMode ? 'dark' : 'light'}
                        style={[styles.nisabCard, { backgroundColor: theme.colors.secondary }]}
                    >
                        <View style={styles.nisabHeader}>
                            <View style={[styles.nisabIcon, { backgroundColor: theme.colors.accent + '15' }]}>
                                <FontAwesome6 name="scale-balanced" size={20} color={theme.colors.accent} />
                            </View>
                            <Text style={[styles.nisabLabel, { color: theme.colors.text.secondary }]}>
                                Nisab Threshold
                            </Text>
                        </View>
                        <Text style={[styles.nisabAmount, { color: theme.colors.accent }]}>
                            ${nisabAmount.toLocaleString()}
                        </Text>
                        {goldPriceData && (
                            <Text style={[styles.nisabSubtext, { color: theme.colors.text.muted }]}>
                                Gold: ${goldPriceData.pricePerGram.toFixed(2)}/gram • Updated {formattedTimestamp}
                            </Text>
                        )}
                    </BlurView>
                </MotiView>

                {/* Zakat Table */}
                <MotiView
                    from={{ opacity: 0, translateY: 20 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={enter(0)}
                >
                    <ZakatTable
                        savings={savings}
                        setSavings={setSavings}
                        gold={gold}
                        setGold={setGold}
                        insurance={insurance}
                        setInsurance={setInsurance}
                        shares={shares}
                        setShares={setShares}
                        eligibility={eligibility}
                        totalZakat={totalZakat}
                        renderEligibilityIcon={renderEligibilityIcon}
                        openModalHandlers={{
                            savings: () => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                setIsSavingsModalVisible(true);
                            },
                            gold: () => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                setIsGoldModalVisible(true);
                            },
                            insurance: () => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                setIsInsuranceModalVisible(true);
                            },
                            shares: () => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                setIsSharesModalVisible(true);
                            },
                        }}
                    />
                </MotiView>

                {/* Action Buttons */}
                <MotiView
                    from={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={enter(0)}
                >
                    <View style={styles.buttonContainer}>
                        <ThemedButton
                            text="Check Eligibility"
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                setIsEligibilityModalVisible(true);
                            }}
                            textStyle={{ color: '#fff' }}
                            style={{ backgroundColor: theme.colors.accent }}
                        />
                        <ThemedButton
                            text="View Guide"
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                setIsGuideModalVisible(true);
                            }}
                            textStyle={{ color: theme.colors.accent }}
                            style={{
                                backgroundColor: theme.colors.secondary,
                                borderWidth: 1.5,
                                borderColor: theme.colors.accent,
                            }}
                        />
                    </View>
                </MotiView>

                {/* Modals */}
                <EligibilityModal
                    isVisible={isEligibilityModalVisible}
                    onClose={() => setIsEligibilityModalVisible(false)}
                    initialEligibility={{
                        savings,
                        goldNotForUse: unusedGold,
                        goldForUse: usedGold,
                        insurance,
                        shares,
                    }}
                    initialHaulStates={haulStates}
                    onCalculate={handleEligibilityCalculated}
                    nisabAmount={nisabAmount}
                    nisabAmountNotWearing={nisabAmountNotWearing}
                    urufAmountWearing={urufAmountWearing}
                />

                <SavingsModal
                    isVisible={savingsModalVisible}
                    onClose={() => setIsSavingsModalVisible(false)}
                    initialSavings={savings}
                    initialInterest={savingsInterest}
                    onSave={setSavings}
                />

                <GoldModal
                    isVisible={goldModalVisible}
                    onClose={() => setIsGoldModalVisible(false)}
                    initialUsedGold={usedGold}
                    initialUnusedGold={unusedGold}
                    onSave={handleGoldSave}
                    currentGoldPrice={goldPriceData?.pricePerGram || 0}
                    formattedTimestamp={formattedTimestamp}
                />

                <InsuranceModal
                    isVisible={insuranceModalVisible}
                    onClose={() => setIsInsuranceModalVisible(false)}
                    initialInsuranceAmount={insurance}
                    onSave={setInsurance}
                />

                <SharesModal
                    isVisible={sharesModalVisible}
                    onClose={() => setIsSharesModalVisible(false)}
                    initialSharesAmount={shares}
                    onSave={setShares}
                />

                <GuideModal
                    isVisible={guideModalVisible}
                    onClose={() => setIsGuideModalVisible(false)}
                />
            </ScrollView>
        </View>
    );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContainer: {
        padding: 20,
        gap: 20,
        paddingBottom: 40,
    },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
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

    // Nisab Card
    nisabCard: {
        padding: 20,
        borderRadius: 16,
        gap: 12,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    nisabHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    nisabIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    nisabLabel: {
        fontSize: 14,
        fontFamily: 'Outfit_500Medium',
    },
    nisabAmount: {
        fontSize: 36,
        fontFamily: 'Outfit_700Bold',
    },
    nisabSubtext: {
        fontSize: 12,
        fontFamily: 'Outfit_400Regular',
    },

    // Loading
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

    // Buttons
    buttonContainer: {
        gap: 12,
    },
});

export default ZakatHarta;