import React, { createContext, ReactNode, useEffect, useState } from 'react';
import useLoadQuranData, { Surah, SurahDetails, TranslationDetails } from '../hooks/useLoadQuranData'

export type QuranDataContextProps = {
    surahs: Surah[],
    surahDetails: { [key: number]: SurahDetails };
    translationDetails: { [key: number]: TranslationDetails };
    isLoading: boolean;
}

const defaultValue: QuranDataContextProps = {
    surahs: [],
    surahDetails: {},
    translationDetails: {},
    isLoading: true,
}

const QuranDataContext = createContext<QuranDataContextProps>(defaultValue);

const QuranDataProvider = ({ children }: { children: ReactNode }) => {
  const { surahs, surahDetails, translationDetails, isLoading } = useLoadQuranData();

  return (
    <QuranDataContext.Provider value={{ surahs, surahDetails, translationDetails, isLoading }}>
      {children}
    </QuranDataContext.Provider>
  );
};

export { QuranDataContext, QuranDataProvider }