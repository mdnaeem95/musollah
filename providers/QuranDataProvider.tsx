import React, { createContext, ReactNode } from 'react';
import useLoadQuranData, { Surah, SurahDetails, TranslationDetails } from '../hooks/useLoadQuranData'

export type QuranDataContextProps = {
    surahs: Surah[],
    surahDetails: { [key: number]: SurahDetails };
    translationDetails: { [key: number]: TranslationDetails };
    loading: boolean;
}

const defaultValue: QuranDataContextProps = {
    surahs: [],
    surahDetails: {},
    translationDetails: {},
    loading: true,
}

const QuranDataContext = createContext<QuranDataContextProps>(defaultValue);

const QuranDataProvider = ({ children }: { children: ReactNode }) => {
  const { surahs, surahDetails, translationDetails, loading } = useLoadQuranData();

  return (
    <QuranDataContext.Provider value={{ surahs, surahDetails, translationDetails, loading }}>
      {children}
    </QuranDataContext.Provider>
  );
};

export { QuranDataContext, QuranDataProvider }