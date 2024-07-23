import { View, Text } from 'react-native'
import React, { ReactNode, createContext, useContext, useState } from 'react'

interface GlobalStateContextProps {
    prayerTimes: any;
    islamicDate: string | null;
    bidetLocations: any[];
    mosqueLocations: any[];
    surahs: any[];
    surahTexts: any[];
    setPrayerTimes: (data: any) => void;
    setIslamicDate: (date: string) => void;
    setBidetLocations: (data: any[]) => void;
    setMosqueLocations: (data: any[]) => void;
    setSurahs: (data: any[]) => void;
    setSurahTexts: (data: any[]) => void;
  }

const GlobalStateContext = createContext<GlobalStateContextProps | undefined>(undefined);

export const useGlobalState = () => {
    const context = useContext(GlobalStateContext);
    if (!context) {
        throw new Error('useGlobalState must be used within a GlobalStateProvider');
    }
    return context;
}

const GlobalStateProvider = ({ children }: { children: ReactNode } ) => {
    const [prayerTimes, setPrayerTimes] = useState<any>(null);
    const [islamicDate, setIslamicDate] = useState<string | null>(null);
    const [bidetLocations, setBidetLocations] = useState<any[]>([]);
    const [mosqueLocations, setMosqueLocations] = useState<any[]>([]);
    const [surahs, setSurahs] = useState<any[]>([]);
    const [surahTexts, setSurahTexts] = useState<any[]>([]);

    return (
        <GlobalStateContext.Provider value={{ 
          prayerTimes, islamicDate, bidetLocations, mosqueLocations, surahs, surahTexts,
          setPrayerTimes, setIslamicDate, setBidetLocations, setMosqueLocations, setSurahs, setSurahTexts
        }}>
          {children}
        </GlobalStateContext.Provider>
      );
}

export default GlobalStateProvider