import { useState, useEffect, useMemo } from 'react';
import { useGoldPrice } from '../../api/services/gold';

const NISAB_AMOUNT_NOT_WEARING = 86; // grams
const URUF_AMOUNT_WEARING = 860; // grams

export interface Eligibility {
  savings: { eligible: boolean; amount: string };
  gold: { eligible: boolean; notForUse: string; forUse: string };
  insurance: { eligible: boolean; amount: string };
  shares: { eligible: boolean; amount: string };
}

export interface HaulStates {
  savingsHaul: boolean;
  goldNotWearingHaul: boolean;
  goldWearingHaul: boolean;
}

export function useZakatHartaCalculator() {
  // Fetch gold price using existing service
  const { data: goldPriceData, isLoading: isLoadingGoldPrice } = useGoldPrice();

  // Form state
  const [savings, setSavings] = useState<string>('');
  const [savingsInterest, setSavingsInterest] = useState<string>('0');
  const [gold, setGold] = useState<string>('');
  const [insurance, setInsurance] = useState<string>('');
  const [shares, setShares] = useState<string>('');
  const [usedGold, setUsedGold] = useState<string>('0');
  const [unusedGold, setUnusedGold] = useState<string>('0');

  // Modal visibility
  const [isEligibilityModalVisible, setIsEligibilityModalVisible] = useState(false);
  const [savingsModalVisible, setIsSavingsModalVisible] = useState(false);
  const [goldModalVisible, setIsGoldModalVisible] = useState(false);
  const [insuranceModalVisible, setIsInsuranceModalVisible] = useState(false);
  const [sharesModalVisible, setIsSharesModalVisible] = useState(false);
  const [guideModalVisible, setIsGuideModalVisible] = useState(false);

  // Eligibility state
  const [eligibility, setEligibility] = useState<Eligibility>({
    savings: { eligible: false, amount: '0' },
    gold: { eligible: false, notForUse: '0', forUse: '0' },
    insurance: { eligible: false, amount: '0' },
    shares: { eligible: false, amount: '0' },
  });

  const [haulStates, setHaulStates] = useState<HaulStates>({
    savingsHaul: false,
    goldNotWearingHaul: false,
    goldWearingHaul: false,
  });

  // Calculate nisab amount based on gold price
  const nisabAmount = useMemo(() => {
    if (!goldPriceData) return 10975; // Default fallback
    return Math.round(goldPriceData.pricePerGram * NISAB_AMOUNT_NOT_WEARING);
  }, [goldPriceData]);

  // Calculate total zakat
  const totalZakat = useMemo(() => {
    const zakatSavings = parseFloat(savings) || 0;
    const zakatGold = parseFloat(gold) || 0;
    const zakatInsurance = eligibility.insurance.eligible
      ? parseFloat(eligibility.insurance.amount) || 0
      : 0;
    const zakatShares = eligibility.shares.eligible
      ? parseFloat(eligibility.shares.amount) || 0
      : 0;

    return zakatSavings + zakatGold + zakatInsurance + zakatShares;
  }, [savings, gold, eligibility]);

  // Auto-fill when eligibility is calculated
  const handleEligibilityCalculated = (newEligibility: Eligibility) => {
    setEligibility(newEligibility);
    setSavings(newEligibility.savings.amount);
    setUnusedGold(newEligibility.gold.notForUse);
    setUsedGold(newEligibility.gold.forUse);
    setInsurance(newEligibility.insurance.amount);
    setShares(newEligibility.shares.amount);
  };

  const handleGoldSave = (used: string, unused: string) => {
    setUsedGold(used);
    setUnusedGold(unused);
  };

  return {
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

    // Modal state
    isEligibilityModalVisible,
    savingsModalVisible,
    goldModalVisible,
    insuranceModalVisible,
    sharesModalVisible,
    guideModalVisible,

    // Constants
    nisabAmountNotWearing: NISAB_AMOUNT_NOT_WEARING,
    urufAmountWearing: URUF_AMOUNT_WEARING,

    // Actions
    setSavings,
    setSavingsInterest,
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
  };
}