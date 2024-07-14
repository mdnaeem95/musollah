import { useContext } from 'react';
import { useQuery } from 'react-query';
import { LocationContext } from '../providers/LocationProvider';
import { BidetLocation, MosqueLocation, MusollahLocation, Region } from '../components/Map';
import { getBidetLocations, getMosqueLocations, getMusollahsLocations } from '../api/firebase/index';

const useLoadMusollahData = () => {
  const { userLocation } = useContext(LocationContext);

  const fetchLocations = async () => {
    if (!userLocation) throw new Error('User location not available');

    const region: Region = {
      latitude: userLocation.coords.latitude,
      longitude: userLocation.coords.longitude,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    };

    const [bidetData, mosqueData, musollahData] = await Promise.all([
      getBidetLocations(region),
      getMosqueLocations(region),
      getMusollahsLocations(region),
    ]);

    return { bidetData, mosqueData, musollahData };
  };

  const { data, error, isLoading } = useQuery('musollahLocations', fetchLocations, {
    enabled: !!userLocation,
  });

  return {
    bidetLocations: data?.bidetData ?? [],
    mosqueLocations: data?.mosqueData ?? [],
    musollahLocations: data?.musollahData ?? [],
    isLoading,
    error,
  };
};

export default useLoadMusollahData;
