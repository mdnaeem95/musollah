import React from 'react';
import MapView, { Marker } from 'react-native-maps';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Restaurant } from '../../utils/types';
import { Region } from '../../components/musollah/Map';
import { useRouter } from 'expo-router';

const { width, height } = Dimensions.get('window');

interface Props {
  region: Region | undefined;
  restaurants: Restaurant[];
}

const RestaurantMap: React.FC<Props> = ({ region, restaurants }) => {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        region={region}
        initialRegion={{
          latitude: 1.3521,
          longitude: 103.8198,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        zoomEnabled
        showsUserLocation
      >
        {restaurants.map((restaurant) => (
          <Marker
            key={restaurant.id}
            coordinate={restaurant.coordinates}
            title={restaurant.name}
            description={restaurant.address}
            onCalloutPress={() => router.push(`${restaurant.id}`)}
          />
        ))}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: width - 32,
    height: height * 0.3,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
  },
  map: {
    flex: 1,
  },
});

export default RestaurantMap;
