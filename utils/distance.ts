// utils/distance.ts
export const getDistanceFromLatLonInKm = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
  };
  
  const deg2rad = (deg: number): number => {
    return deg * (Math.PI / 180);
  };
  
export const haversineDistance = (coords1: { latitude: number, longitude: number }, coords2: { latitude: number, longitude: number }): number => {
  const toRadians = (degree: number) => (degree * Math.PI) / 180;

  const R = 6371;
  const dLat = toRadians(coords2.latitude - coords1.latitude)
  const dLon = toRadians(coords2.longitude - coords1.longitude)
  const lat1 = toRadians(coords1.latitude)
  const lat2 = toRadians(coords2.latitude)

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon /2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}