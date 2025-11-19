import React from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { format } from 'date-fns';
import GuideModal from '../../../../../components/zakat/GuideModal';
import SharesModal from '../../../../../components/zakat/SharesModal';
import InsuranceModal from '../../../../../components/zakat/InsuranceModal';
import GoldModal from '../../../../../components/zakat/GoldModal';
import SavingsModal from '../../../../../components/zakat/SavingsModal';
import EligibilityModal from '../../../../../components/zakat/EligibilityModal';
import ZakatTable from '../../../../../components/zakat/ZakatTable';
import ThemedButton from '../../../../../components/ThemedButton';
import { useTheme } from '../../../../../context/ThemeContext';
import { useZakatHartaCalculator } from '../../../../../hooks/zakat/useZakatHartaCalculator';

const ZakatHarta = () => {
  const { theme } = useTheme();
  const styles = createStyles(theme);

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
      <FontAwesome6 name="check" size={24} color={theme.colors.text.success} />
    ) : (
      <FontAwesome6 name="xmark" size={24} color={theme.colors.text.error} />
    );
  };

  const formattedTimestamp = goldPriceData?.timestamp
    ? format(new Date(goldPriceData.timestamp), 'dd MMM yyyy, hh:mm a')
    : '';

  if (isLoadingGoldPrice) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={theme.colors.accent} />
        <Text style={[styles.loadingText, { color: theme.colors.text.secondary }]}>
          Loading gold prices...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Nisab Display */}
      <View style={styles.nisabContainer}>
        <View style={styles.nisabHeader}>
          <FontAwesome6 name="scale-balanced" size={20} color={theme.colors.accent} />
          <Text style={styles.nisabLabel}>Nisab for this month</Text>
        </View>
        <Text style={styles.nisabAmount}>${nisabAmount.toLocaleString()}</Text>
        {goldPriceData && (
          <Text style={styles.nisabSubtext}>
            Based on current gold price: ${goldPriceData.pricePerGram.toFixed(2)}/gram
          </Text>
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
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
            savings: () => setIsSavingsModalVisible(true),
            gold: () => setIsGoldModalVisible(true),
            insurance: () => setIsInsuranceModalVisible(true),
            shares: () => setIsSharesModalVisible(true),
          }}
        />

        <View style={styles.buttonContainer}>
          <ThemedButton
            text="Check Eligibility"
            onPress={() => setIsEligibilityModalVisible(true)}
            textStyle={{ color: theme.colors.text.primary }}
            style={{ backgroundColor: theme.colors.accent }}
          />
          <ThemedButton
            text="Guide"
            onPress={() => setIsGuideModalVisible(true)}
            textStyle={{ color: theme.colors.accent }}
            style={{ backgroundColor: theme.colors.secondary }}
          />
        </View>

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

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      padding: theme.spacing.medium,
      backgroundColor: theme.colors.primary,
    },
    centered: {
      justifyContent: 'center',
      alignItems: 'center',
      gap: theme.spacing.medium,
    },
    nisabContainer: {
      marginBottom: theme.spacing.medium,
      padding: theme.spacing.medium,
      backgroundColor: theme.colors.secondary,
      borderRadius: theme.borderRadius.medium,
      alignItems: 'center',
      ...theme.shadows.default,
    },
    nisabHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.small,
      marginBottom: theme.spacing.small,
    },
    nisabLabel: {
      fontSize: theme.fontSizes.medium,
      fontFamily: 'Outfit_400Regular',
      color: theme.colors.text.muted,
    },
    nisabAmount: {
      fontSize: theme.fontSizes.xxxLarge,
      fontFamily: 'Outfit_700Bold',
      color: theme.colors.accent,
      marginBottom: theme.spacing.xSmall,
    },
    nisabSubtext: {
      fontSize: theme.fontSizes.small,
      fontFamily: 'Outfit_400Regular',
      color: theme.colors.text.muted,
    },
    loadingText: {
      fontSize: theme.fontSizes.medium,
      fontFamily: 'Outfit_400Regular',
    },
    scrollContainer: {
      gap: theme.spacing.medium,
      paddingBottom: theme.spacing.large,
    },
    buttonContainer: {
      gap: theme.spacing.medium,
      marginTop: theme.spacing.small,
    },
  });

export default ZakatHarta;