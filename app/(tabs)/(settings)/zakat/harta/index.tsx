import React, { useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { format } from 'date-fns';
import { getGoldPrice } from '../../../../../api/gold';
import GuideModal from '../../../../../components/zakat/GuideModal';
import SharesModal from '../../../../../components/zakat/SharesModal';
import InsuranceModal from '../../../../../components/zakat/InsuranceModal';
import GoldModal from '../../../../../components/zakat/GoldModal';
import SavingsModal from '../../../../../components/zakat/SavingsModal';
import EligibilityModal from '../../../../../components/zakat/EligibilityModal';
import ZakatTable from '../../../../../components/zakat/ZakatTable';
import ThemedButton from '../../../../../components/ThemedButton';
import { useTheme } from '../../../../../context/ThemeContext';

const nisabAmountNotWearing = 86;  // 86 grams for gold not meant for wearing
const urufAmountWearing = 860;    // 860 grams for gold meant for wearing

const ZakatHarta = () => {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  const [savings, setSavings] = useState<string>('');
  const [savingsInterest, setSavingsInterest] = useState<string>('0');
  const [gold, setGold] = useState<string>('');
  const [insurance, setInsurance] = useState<string>('');
  const [shares, setShares] = useState<string>('');
  const [totalZakat, setTotalZakat] = useState<number>(0);
  const [nisabAmount, setNisabAmount] = useState(10358);

  const [currentGoldPrice, setCurrentGoldPrice] = useState<number>(0);
  const [goldPriceTimeStamp, setGoldPriceTimeStamp] = useState('');

  const [isEligibilityModalVisible, setIsEligibilityModalVisible] = useState(false);
  const [savingsModalVisible, setIsSavingsModalVisible] = useState(false);
  const [goldModalVisible, setIsGoldModalVisible] = useState(false);
  const [insuranceModalVisible, setIsInsuranceModalVisible] = useState(false);
  const [sharesModalVisible, setIsSharesModalVisible] = useState(false);
  const [guideModalVisible, setIsGuideModalVisible] = useState(false);

  const [usedGold, setUsedGold] = useState<string>('0');
  const [unusedGold, setUnusedGold] = useState<string>('0');

  const [eligibility, setEligibility] = useState({
    savings: { eligible: false, amount: '0' },
    gold: { eligible: false, notForUse: '0', forUse: '0' },
    insurance: { eligible: false, amount: '0' },
    shares: { eligible: false, amount: '0' },
  });
  
  const [haulStates, setHaulStates] = useState({
    savingsHaul: false,
    goldNotWearingHaul: false,
    goldWearingHaul: false,
  });

  const fetchGoldPrice = async () => {
    try {
      const { pricePerGram, timestamp } = await getGoldPrice();
      setCurrentGoldPrice(pricePerGram);
      setGoldPriceTimeStamp(timestamp);
    } catch (error) {
      console.error('Error fetching gold price:', error);
    }
  };

  useEffect(() => {
    fetchGoldPrice();
  }, []);

  useEffect(() => {
    calculateZakat();
  }, [savings, gold, insurance, shares]);

  const calculateZakat = () => {
    const zakatSavings = parseFloat(savings) || 0;
    const zakatGold = parseFloat(gold) || 0;
    const zakatInsurance = eligibility.insurance.eligible ? parseFloat(eligibility.insurance.amount) || 0 : 0;
    const zakatShares = eligibility.shares.eligible ? parseFloat(eligibility.shares.amount) || 0 : 0;
  
    const total = (zakatSavings + zakatGold + zakatInsurance + zakatShares);
    setTotalZakat(total);
  };

  const parseDate = (timestamp: any) => {
    const date = new Date(timestamp);
    return isNaN(date.getTime()) ? 'Invalid Date' : format(date, 'dd MMM yyyy, hh:mm a');
  };

  const formattedTimestamp = parseDate(goldPriceTimeStamp);

  const renderEligibilityIcon = (isEligible: boolean) => {
    return isEligible ? (
      <FontAwesome6 name="check" size={24} color={theme.colors.text.success} />
    ) : (
      <FontAwesome6 name="xmark" size={24} color={theme.colors.text.error} />
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.nisabContainer}>
        <Text style={styles.nisabText}>
          Nisab for this month: ${nisabAmount}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
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

        <View style={{ width: '95%', gap: 20, alignItems: 'center', justifyContent: 'center', marginHorizontal: 5 }}>
          <ThemedButton text="Check Eligibility" onPress={() => setIsEligibilityModalVisible(true)} textStyle={{ color: theme.colors.accent }} style={{ backgroundColor: theme.colors.secondary }} />
          <ThemedButton text="Guide" onPress={() => setIsGuideModalVisible(true)} textStyle={{ color: theme.colors.accent }} style={{ backgroundColor: theme.colors.secondary }} />
        </View>

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
          onCalculate={(newEligibility) => {
            setEligibility(newEligibility)

            // Auto-fill the input fields with eligibility amounts
            setSavings(newEligibility.savings.amount);
            setUnusedGold(newEligibility.gold.notForUse);
            setUsedGold(newEligibility.gold.forUse);
            setInsurance(newEligibility.insurance.amount);
            setShares(newEligibility.shares.amount);
          }}
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
          onSave={(used, unused) => {
            setUsedGold(used);
            setUnusedGold(unused);
          }}
          currentGoldPrice={currentGoldPrice}
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
    nisabContainer: {
      marginBottom: theme.spacing.large,
      paddingHorizontal: theme.spacing.small,
      alignItems: 'center',
    },
    nisabText: {
      fontSize: theme.fontSizes.large,
      fontFamily: 'Outfit_500Medium',
      color: theme.colors.text.primary,
    },
    scrollContainer: {
      gap: theme.spacing.small,
    },
  });

export default ZakatHarta;