// LocationDataProvider.tsx
import React, { createContext, ReactNode } from 'react';
import { BidetLocation, MosqueLocation, MusollahLocation } from '../components/Map';
import useLoadMusollahData from '../hooks/useLoadMusollahData';

interface LocationDataContextProps {
  bidetLocations: BidetLocation[];
  mosqueLocations: MosqueLocation[];
  musollahLocations: MusollahLocation[];
  loading: boolean;
}

const defaultValue: LocationDataContextProps = {
  bidetLocations: [],
  mosqueLocations: [],
  musollahLocations: [],
  loading: true,
}

const LocationDataContext = createContext<LocationDataContextProps>(defaultValue);

const LocationDataProvider = ({ children }: { children: ReactNode }) => {
  const { bidetLocations, mosqueLocations, musollahLocations, loading } = useLoadMusollahData();
  return (
    <LocationDataContext.Provider value={{ bidetLocations, mosqueLocations, musollahLocations, loading }}>
      {children}
    </LocationDataContext.Provider>
  );
};

export { LocationDataProvider, LocationDataContext }