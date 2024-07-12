// LocationDataProvider.tsx
import React, { createContext, ReactNode, useEffect, useState } from 'react';
import { BidetLocation, MosqueLocation, MusollahLocation } from '../components/Map';
import useLoadMusollahData from '../hooks/useLoadMusollahData';

interface LocationDataContextProps {
  bidetLocations: BidetLocation[];
  mosqueLocations: MosqueLocation[];
  musollahLocations: MusollahLocation[];
  isLoading: boolean;
}

const defaultValue: LocationDataContextProps = {
  bidetLocations: [],
  mosqueLocations: [],
  musollahLocations: [],
  isLoading: true,
}

const LocationDataContext = createContext<LocationDataContextProps>(defaultValue);

const LocationDataProvider = ({ children }: { children: ReactNode }) => {
  const { bidetLocations, mosqueLocations, musollahLocations, loading: fetchLoading } = useLoadMusollahData();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log('Loading user location...');
    if (!fetchLoading) {
      setIsLoading(false);
      console.log('User location loaded.');
    }
  }, [fetchLoading]);

  return (
    <LocationDataContext.Provider value={{ bidetLocations, mosqueLocations, musollahLocations, isLoading }}>
      {children}
    </LocationDataContext.Provider>
  );
};

export { LocationDataProvider, LocationDataContext }