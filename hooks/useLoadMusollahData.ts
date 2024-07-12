import { useState, useEffect, useContext, useCallback } from 'react';
import { LocationContext } from '../providers/LocationProvider'
import { BidetLocation, MosqueLocation, MusollahLocation, Region } from '../components/Map'
import { getBidetLocations, getMosqueLocations, getMusollahsLocations } from '../api/firebase/index'

const useLoadMusollahData = () => {
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

      return { bidetLocations, mosqueLocations, musollahLocations, loading };
}

export default useLoadMusollahData;