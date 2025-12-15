import React, { createContext, useContext, useState } from 'react';

type PlanForm = {
    daysToFinish: number;
    planType: 'ayahs' | 'surahs' | 'juz';
    commitmentLevel?: 'low' | 'medium' | 'high';
};

const defaultState: PlanForm = {
    daysToFinish: 30,
    planType: 'ayahs',
}

const PlanContext = createContext<{
    plan: PlanForm;
    setPlan: (update: Partial<PlanForm>) => void;
} | null>(null);

export const PlanProvider = ({ children }: { children: React.ReactNode }) => {
    const [plan, setPlanState] = useState<PlanForm>(defaultState);
    const setPlan = (update: Partial<PlanForm>) =>
        setPlanState((prev) => ({ ...prev, ...update }));

    return (
        <PlanContext.Provider value={{ plan, setPlan }}>
            {children}
        </PlanContext.Provider>
    );
};

export const usePlan = () => useContext(PlanContext);