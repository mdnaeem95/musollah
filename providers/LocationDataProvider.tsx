// LocationDataProvider.tsx
import React, { createContext, useState, useEffect, useCallback, useContext, ReactNode } from 'react';
import { getBidetLocations, getMosqueLocations, getMusollahsLocations } from '../api/firebase';
import { BidetLocation, MosqueLocation, MusollahLocation, Region } from '../components/Map';
import { LocationContext } from './LocationProvider';

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
  loading: false,
}

const LocationDataContext = createContext<LocationDataContextProps>(defaultValue);

const LocationDataProvider = ({ children }: { children: ReactNode }) => {
  const { userLocation } = useContext(LocationContext);
  const [bidetLocations, setBidetLocations] = useState<BidetLocation[]>([]);
  const [mosqueLocations, setMosqueLocations] = useState<MosqueLocation[]>([]);
  const [musollahLocations, setMusollahLocations] = useState<MusollahLocation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchLocations = useCallback(async (region: Region) => {
    setLoading(true);
    try {
      const [bidetData, mosqueData, musollahData] = await Promise.all([
        getBidetLocations(region),
        getMosqueLocations(region),
        getMusollahsLocations(region),
      ]);
      setBidetLocations(bidetData);
      setMosqueLocations(mosqueData);
      setMusollahLocations(musollahData);
    } catch (error) {
      console.error("Error fetching locations: ", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (userLocation) {
      const initialRegion: Region = {
        latitude: userLocation.coords.latitude,
        longitude: userLocation.coords.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };
      fetchLocations(initialRegion);
    }
  }, [userLocation, fetchLocations]);

  return (
    <LocationDataContext.Provider value={{ bidetLocations, mosqueLocations, musollahLocations, loading }}>
      {children}
    </LocationDataContext.Provider>
  );
};

export { LocationDataProvider, LocationDataContext }