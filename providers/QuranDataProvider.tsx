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
  const { surahs, surahDetails, translationDetails, loading: loadLoading } = useLoadQuranData();
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    console.log('Loading Quran data...');
    if (!loadLoading) {
      setLoading(false);
      console.log('Quran data loaded.');
    }
  }, [loadLoading]);

  return (
    <QuranDataContext.Provider value={{ surahs, surahDetails, translationDetails, isLoading }}>
      {children}
    </QuranDataContext.Provider>
  );
};

export { QuranDataContext, QuranDataProvider }