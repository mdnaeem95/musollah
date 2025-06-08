import { useState, useEffect, useRef, useCallback } from "react";
import * as Location from 'expo-location';

// Constants
const KAABA_COORDINATES = {
  latitude: 21.4225,
  longitude: 39.8262,
} as const;

const HEADING_UPDATE_THROTTLE = 100; // milliseconds
const LOCATION_UPDATE_THROTTLE = 5000; // 5 seconds

// Types
interface CompassState {
  userHeading: number | null;
  qiblaAzimuth: number | null;
  loading: boolean;
  error: string | null;
  permissionStatus: Location.PermissionStatus | null;
}

interface LocationCoordinates {
  latitude: number;
  longitude: number;
}

// Custom hook
const useCompass = () => {
  const [state, setState] = useState<CompassState>({
    userHeading: null,
    qiblaAzimuth: null,
    loading: true,
    error: null,
    permissionStatus: null,
  });

  const headingSubscriptionRef = useRef<Location.LocationSubscription | null>(null);
  const lastHeadingUpdateRef = useRef<number>(0);
  const lastLocationUpdateRef = useRef<number>(0);

  /**
   * Calculate the azimuth (bearing) from user location to Kaaba
   * Using the forward azimuth formula from spherical trigonometry
   */
  const calculateQiblaAzimuth = useCallback((userCoordinates: LocationCoordinates): number => {
    const { latitude: userLat, longitude: userLon } = userCoordinates;
    const { latitude: kaabaLat, longitude: kaabaLon } = KAABA_COORDINATES;

    // Convert degrees to radians
    const userLatRad = (userLat * Math.PI) / 180;
    const kaabaLatRad = (kaabaLat * Math.PI) / 180;
    const deltaLonRad = ((kaabaLon - userLon) * Math.PI) / 180;

    // Calculate azimuth using forward azimuth formula
    const y = Math.sin(deltaLonRad) * Math.cos(kaabaLatRad);
    const x = Math.cos(userLatRad) * Math.sin(kaabaLatRad) - 
              Math.sin(userLatRad) * Math.cos(kaabaLatRad) * Math.cos(deltaLonRad);

    let azimuth = Math.atan2(y, x) * (180 / Math.PI);
    
    // Normalize to 0-360 degrees
    azimuth = (azimuth + 360) % 360;
    
    return azimuth;
  }, []);

  /**
   * Throttled heading update to prevent excessive re-renders
   */
  const updateHeading = useCallback((heading: Location.LocationHeadingObject) => {
    const now = Date.now();
    if (now - lastHeadingUpdateRef.current < HEADING_UPDATE_THROTTLE) {
      return;
    }
    
    lastHeadingUpdateRef.current = now;
    
    if (heading.trueHeading !== null) {
      setState(prev => ({
        ...prev,
        userHeading: heading.trueHeading,
        error: null,
      }));
    }
  }, []);

  /**
   * Get user location and calculate Qibla direction
   */
  const initializeCompass = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      // Request permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      setState(prev => ({ ...prev, permissionStatus: status }));

      if (status !== 'granted') {
        throw new Error('Location permission is required to determine Qibla direction');
      }

      // Get current location with throttling
      const now = Date.now();
      if (now - lastLocationUpdateRef.current < LOCATION_UPDATE_THROTTLE) {
        return;
      }
      lastLocationUpdateRef.current = now;

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = location.coords;
      const qiblaDirection = calculateQiblaAzimuth({ latitude, longitude });

      setState(prev => ({
        ...prev,
        qiblaAzimuth: qiblaDirection,
        loading: false,
        error: null,
      }));

      // Start watching heading changes
      if (!headingSubscriptionRef.current) {
        headingSubscriptionRef.current = await Location.watchHeadingAsync(updateHeading);
      }

    } catch (error) {
      console.error('Error initializing compass:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to access location or compass',
      }));
    }
  }, [calculateQiblaAzimuth, updateHeading]);

  /**
   * Retry initialization after error
   */
  const retryInitialization = useCallback(() => {
    initializeCompass();
  }, [initializeCompass]);

  /**
   * Check if device has compass capability
   */
  const checkCompassAvailability = useCallback(async () => {
    try {
      const hasCompass = await Location.hasServicesEnabledAsync();
      if (!hasCompass) {
        setState(prev => ({
          ...prev,
          error: 'Compass services are not available on this device',
          loading: false,
        }));
        return false;
      }
      return true;
    } catch {
      setState(prev => ({
        ...prev,
        error: 'Unable to check compass availability',
        loading: false,
      }));
      return false;
    }
  }, []);

  // Initialize compass on mount
  useEffect(() => {
    let isMounted = true;

    const initialize = async () => {
      const hasCompass = await checkCompassAvailability();
      if (hasCompass && isMounted) {
        await initializeCompass();
      }
    };

    initialize();

    // Cleanup function
    return () => {
      isMounted = false;
      if (headingSubscriptionRef.current) {
        headingSubscriptionRef.current.remove();
        headingSubscriptionRef.current = null;
      }
    };
  }, [initializeCompass, checkCompassAvailability]);

  return {
    ...state,
    retryInitialization,
  };
};

export default useCompass;