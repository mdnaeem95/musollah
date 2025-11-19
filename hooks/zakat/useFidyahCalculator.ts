import { useState, useMemo } from 'react';

const RATE_PER_DAY = 1.4;

export type FidyahCategory = 'haidOther' | 'illnessOldAge' | 'pregnancyFeeding';

export interface FidyahCalculation {
  haidOther: number;
  illnessOldAge: number;
  pregnancyFeeding: number;
  grandTotal: number;
}

export function useFidyahCalculator() {
  const [daysHaidOther, setDaysHaidOther] = useState<string>('');
  const [daysIllnessOldAge, setDaysIllnessOldAge] = useState<string>('');
  const [daysPregnancyFeeding, setDaysPregnancyFeeding] = useState<string>('');

  // Calculate totals
  const calculation = useMemo((): FidyahCalculation => {
    const haidOther = (parseFloat(daysHaidOther) || 0) * RATE_PER_DAY;
    const illnessOldAge = (parseFloat(daysIllnessOldAge) || 0) * RATE_PER_DAY;
    const pregnancyFeeding = (parseFloat(daysPregnancyFeeding) || 0) * RATE_PER_DAY;
    const grandTotal = haidOther + illnessOldAge + pregnancyFeeding;

    return {
      haidOther,
      illnessOldAge,
      pregnancyFeeding,
      grandTotal,
    };
  }, [daysHaidOther, daysIllnessOldAge, daysPregnancyFeeding]);

  const resetCalculator = () => {
    setDaysHaidOther('');
    setDaysIllnessOldAge('');
    setDaysPregnancyFeeding('');
  };

  return {
    // State
    daysHaidOther,
    daysIllnessOldAge,
    daysPregnancyFeeding,
    ratePerDay: RATE_PER_DAY,
    calculation,

    // Actions
    setDaysHaidOther,
    setDaysIllnessOldAge,
    setDaysPregnancyFeeding,
    resetCalculator,
  };
}