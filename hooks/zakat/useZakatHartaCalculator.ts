/**
 * Zakat Harta (Wealth) Calculator Hook
 * 
 * ✅ UPDATED: Added structured logging
 * ✅ IMPROVED: Gold price tracking, eligibility calculation monitoring, modal state tracking
 * 
 * Business logic for Zakat Harta calculator.
 * Calculates zakat on savings, gold, insurance, and shares.
 * Integrates with real-time gold prices and nisab calculation.
 * 
 * @version 2.0
 * @since 2025-12-24
 */

import { useState, useEffect, useMemo } from 'react';
import { useGoldPrice } from '../../api/services/gold';

// ✅ Import structured logging
import { createLogger } from '../../services/logging/logger';

// ✅ Create category-specific logger
const logger = createLogger('Zakat Calculator');

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

/**
 * Hook for Zakat Harta calculator
 * Handles wealth calculation with gold price integration
 * 
 * @returns {Object} Calculator state and actions
 */
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

  // ✅ Log hook initialization
  useEffect(() => {
    logger.info('Zakat Harta calculator mounted', {
      nisabNotWearing: `${NISAB_AMOUNT_NOT_WEARING}g`,
      urufWearing: `${URUF_AMOUNT_WEARING}g`,
    });
    
    return () => {
      logger.debug('Zakat Harta calculator unmounted', {
        hadValues: !!(savings || gold || insurance || shares),
        totalZakat: totalZakat > 0 ? `$${totalZakat.toFixed(2)}` : '$0.00',
      });
    };
  }, []);

  // ✅ Track gold price loading
  useEffect(() => {
    if (isLoadingGoldPrice) {
      logger.debug('Loading gold price data...');
    } else if (goldPriceData) {
      logger.success('Gold price loaded', {
        pricePerGram: `$${goldPriceData.pricePerGram.toFixed(2)}`,
        calculatedNisab: `$${nisabAmount}`,
        source: 'Metal Price API',
      });
    }
  }, [goldPriceData, isLoadingGoldPrice]);

  // Calculate nisab amount based on gold price
  const nisabAmount = useMemo(() => {
    if (!goldPriceData) {
      logger.debug('Using fallback nisab amount', {
        fallback: '$10,975',
        reason: 'Gold price data not available',
      });
      return 10975; // Default fallback
    }
    
    const calculated = Math.round(goldPriceData.pricePerGram * NISAB_AMOUNT_NOT_WEARING);
    
    logger.debug('Nisab amount calculated', {
      pricePerGram: `$${goldPriceData.pricePerGram.toFixed(2)}`,
      nisabGrams: `${NISAB_AMOUNT_NOT_WEARING}g`,
      calculatedAmount: `$${calculated}`,
    });
    
    return calculated;
  }, [goldPriceData]);

  // ✅ Calculate total zakat with logging
  const totalZakat = useMemo(() => {
    const zakatSavings = parseFloat(savings) || 0;
    const zakatGold = parseFloat(gold) || 0;
    const zakatInsurance = eligibility.insurance.eligible
      ? parseFloat(eligibility.insurance.amount) || 0
      : 0;
    const zakatShares = eligibility.shares.eligible
      ? parseFloat(eligibility.shares.amount) || 0
      : 0;

    const total = zakatSavings + zakatGold + zakatInsurance + zakatShares;

    // ✅ Log calculation when values exist
    if (total > 0) {
      logger.debug('Zakat calculation updated', {
        breakdown: {
          savings: `$${zakatSavings.toFixed(2)}`,
          gold: `$${zakatGold.toFixed(2)}`,
          insurance: `$${zakatInsurance.toFixed(2)}`,
          shares: `$${zakatShares.toFixed(2)}`,
        },
        total: `$${total.toFixed(2)}`,
        meetsNisab: total >= nisabAmount,
      });
    }

    return total;
  }, [savings, gold, eligibility, nisabAmount]);

  // ✅ Track eligibility calculation
  const handleEligibilityCalculated = (newEligibility: Eligibility) => {
    logger.info('Eligibility calculated', {
      savings: {
        eligible: newEligibility.savings.eligible,
        amount: newEligibility.savings.amount,
      },
      gold: {
        eligible: newEligibility.gold.eligible,
        notForUse: newEligibility.gold.notForUse,
        forUse: newEligibility.gold.forUse,
      },
      insurance: {
        eligible: newEligibility.insurance.eligible,
        amount: newEligibility.insurance.amount,
      },
      shares: {
        eligible: newEligibility.shares.eligible,
        amount: newEligibility.shares.amount,
      },
    });

    setEligibility(newEligibility);
    setSavings(newEligibility.savings.amount);
    setUnusedGold(newEligibility.gold.notForUse);
    setUsedGold(newEligibility.gold.forUse);
    setInsurance(newEligibility.insurance.amount);
    setShares(newEligibility.shares.amount);

    logger.success('Form auto-filled from eligibility', {
      filledFields: [
        newEligibility.savings.eligible && 'savings',
        newEligibility.gold.eligible && 'gold',
        newEligibility.insurance.eligible && 'insurance',
        newEligibility.shares.eligible && 'shares',
      ].filter(Boolean),
    });
  };

  // ✅ Track gold input
  const handleGoldSave = (used: string, unused: string) => {
    logger.info('Gold amounts saved', {
      usedGold: used || '0',
      unusedGold: unused || '0',
      totalGoldGrams: (parseFloat(used) || 0) + (parseFloat(unused) || 0),
    });

    setUsedGold(used);
    setUnusedGold(unused);
  };

  // ✅ Wrap modal setters with logging
  const handleSetEligibilityModalVisible = (visible: boolean) => {
    logger.debug('Eligibility modal toggled', { visible });
    setIsEligibilityModalVisible(visible);
  };

  const handleSetSavingsModalVisible = (visible: boolean) => {
    logger.debug('Savings modal toggled', { visible });
    setIsSavingsModalVisible(visible);
  };

  const handleSetGoldModalVisible = (visible: boolean) => {
    logger.debug('Gold modal toggled', { visible });
    setIsGoldModalVisible(visible);
  };

  const handleSetInsuranceModalVisible = (visible: boolean) => {
    logger.debug('Insurance modal toggled', { visible });
    setIsInsuranceModalVisible(visible);
  };

  const handleSetSharesModalVisible = (visible: boolean) => {
    logger.debug('Shares modal toggled', { visible });
    setIsSharesModalVisible(visible);
  };

  const handleSetGuideModalVisible = (visible: boolean) => {
    logger.debug('Guide modal toggled', { visible });
    setIsGuideModalVisible(visible);
  };

  // ✅ Wrap form field setters with logging
  const handleSetSavings = (value: string) => {
    if (value !== savings) {
      logger.debug('Savings amount changed', {
        from: savings || '0',
        to: value || '0',
      });
    }
    setSavings(value);
  };

  const handleSetSavingsInterest = (value: string) => {
    if (value !== savingsInterest) {
      logger.debug('Savings interest changed', {
        from: savingsInterest || '0',
        to: value || '0',
      });
    }
    setSavingsInterest(value);
  };

  const handleSetGold = (value: string) => {
    if (value !== gold) {
      logger.debug('Gold zakat amount changed', {
        from: gold || '0',
        to: value || '0',
      });
    }
    setGold(value);
  };

  const handleSetInsurance = (value: string) => {
    if (value !== insurance) {
      logger.debug('Insurance amount changed', {
        from: insurance || '0',
        to: value || '0',
      });
    }
    setInsurance(value);
  };

  const handleSetShares = (value: string) => {
    if (value !== shares) {
      logger.debug('Shares amount changed', {
        from: shares || '0',
        to: value || '0',
      });
    }
    setShares(value);
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
    setSavings: handleSetSavings,
    setSavingsInterest: handleSetSavingsInterest,
    setGold: handleSetGold,
    setInsurance: handleSetInsurance,
    setShares: handleSetShares,
    setIsEligibilityModalVisible: handleSetEligibilityModalVisible,
    setIsSavingsModalVisible: handleSetSavingsModalVisible,
    setIsGoldModalVisible: handleSetGoldModalVisible,
    setIsInsuranceModalVisible: handleSetInsuranceModalVisible,
    setIsSharesModalVisible: handleSetSharesModalVisible,
    setIsGuideModalVisible: handleSetGuideModalVisible,
    handleEligibilityCalculated,
    handleGoldSave,
  };
}