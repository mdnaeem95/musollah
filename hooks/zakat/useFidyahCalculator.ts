/**
 * Fidyah Calculator Hook
 * 
 * ✅ UPDATED: Added structured logging
 * ✅ IMPROVED: Calculation tracking and user action monitoring
 * 
 * Business logic for Fidyah (missed fasts) calculator.
 * Calculates payment based on $1.40 per day rate.
 * 
 * @version 2.0
 * @since 2025-12-24
 */

import { useState, useMemo, useEffect } from 'react';

// ✅ Import structured logging
import { createLogger } from '../../services/logging/logger';

// ✅ Create category-specific logger
const logger = createLogger('Zakat Calculator');

const RATE_PER_DAY = 1.4;

export type FidyahCategory = 'haidOther' | 'illnessOldAge' | 'pregnancyFeeding';

export interface FidyahCalculation {
  haidOther: number;
  illnessOldAge: number;
  pregnancyFeeding: number;
  grandTotal: number;
}

/**
 * Hook for Fidyah calculator
 * Calculates payment for missed fasts across 3 categories
 * 
 * @returns {Object} Calculator state and actions
 */
export function useFidyahCalculator() {
  const [daysHaidOther, setDaysHaidOther] = useState<string>('');
  const [daysIllnessOldAge, setDaysIllnessOldAge] = useState<string>('');
  const [daysPregnancyFeeding, setDaysPregnancyFeeding] = useState<string>('');

  // ✅ Log hook initialization
  useEffect(() => {
    logger.info('Fidyah calculator mounted', {
      ratePerDay: RATE_PER_DAY,
    });
    
    return () => {
      logger.debug('Fidyah calculator unmounted', {
        hadValues: !!(daysHaidOther || daysIllnessOldAge || daysPregnancyFeeding),
      });
    };
  }, []);

  // ✅ Calculate totals with logging
  const calculation = useMemo((): FidyahCalculation => {
    const haidOtherDays = parseFloat(daysHaidOther) || 0;
    const illnessOldAgeDays = parseFloat(daysIllnessOldAge) || 0;
    const pregnancyFeedingDays = parseFloat(daysPregnancyFeeding) || 0;

    const haidOther = haidOtherDays * RATE_PER_DAY;
    const illnessOldAge = illnessOldAgeDays * RATE_PER_DAY;
    const pregnancyFeeding = pregnancyFeedingDays * RATE_PER_DAY;
    const grandTotal = haidOther + illnessOldAge + pregnancyFeeding;

    const totalDays = haidOtherDays + illnessOldAgeDays + pregnancyFeedingDays;

    // ✅ Log calculation when values exist
    if (totalDays > 0) {
      logger.debug('Fidyah calculation updated', {
        categories: {
          haidOther: { days: haidOtherDays, amount: `$${haidOther.toFixed(2)}` },
          illnessOldAge: { days: illnessOldAgeDays, amount: `$${illnessOldAge.toFixed(2)}` },
          pregnancyFeeding: { days: pregnancyFeedingDays, amount: `$${pregnancyFeeding.toFixed(2)}` },
        },
        totalDays,
        grandTotal: `$${grandTotal.toFixed(2)}`,
      });
    }

    return {
      haidOther,
      illnessOldAge,
      pregnancyFeeding,
      grandTotal,
    };
  }, [daysHaidOther, daysIllnessOldAge, daysPregnancyFeeding]);

  // ✅ Wrap setters with logging
  const handleSetDaysHaidOther = (value: string) => {
    const days = parseFloat(value) || 0;
    if (value !== daysHaidOther) {
      logger.debug('Haid/Other days changed', {
        from: daysHaidOther || '0',
        to: value || '0',
        daysCount: days,
        amountImpact: `$${(days * RATE_PER_DAY).toFixed(2)}`,
      });
    }
    setDaysHaidOther(value);
  };

  const handleSetDaysIllnessOldAge = (value: string) => {
    const days = parseFloat(value) || 0;
    if (value !== daysIllnessOldAge) {
      logger.debug('Illness/Old-age days changed', {
        from: daysIllnessOldAge || '0',
        to: value || '0',
        daysCount: days,
        amountImpact: `$${(days * RATE_PER_DAY).toFixed(2)}`,
      });
    }
    setDaysIllnessOldAge(value);
  };

  const handleSetDaysPregnancyFeeding = (value: string) => {
    const days = parseFloat(value) || 0;
    if (value !== daysPregnancyFeeding) {
      logger.debug('Pregnancy/Feeding days changed', {
        from: daysPregnancyFeeding || '0',
        to: value || '0',
        daysCount: days,
        amountImpact: `$${(days * RATE_PER_DAY).toFixed(2)}`,
      });
    }
    setDaysPregnancyFeeding(value);
  };

  // ✅ Reset calculator with logging
  const resetCalculator = () => {
    const totalDays = 
      (parseFloat(daysHaidOther) || 0) +
      (parseFloat(daysIllnessOldAge) || 0) +
      (parseFloat(daysPregnancyFeeding) || 0);

    logger.info('Fidyah calculator reset', {
      previousTotal: `$${calculation.grandTotal.toFixed(2)}`,
      previousTotalDays: totalDays,
    });

    setDaysHaidOther('');
    setDaysIllnessOldAge('');
    setDaysPregnancyFeeding('');

    logger.success('Fidyah calculator cleared');
  };

  return {
    // State
    daysHaidOther,
    daysIllnessOldAge,
    daysPregnancyFeeding,
    ratePerDay: RATE_PER_DAY,
    calculation,

    // Actions
    setDaysHaidOther: handleSetDaysHaidOther,
    setDaysIllnessOldAge: handleSetDaysIllnessOldAge,
    setDaysPregnancyFeeding: handleSetDaysPregnancyFeeding,
    resetCalculator,
  };
}