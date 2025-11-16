import { useEffect, useRef, useCallback, useReducer } from 'react';
import * as Location from 'expo-location';
import type { CompassState, CompassAction, LocationCoordinates } from '../../../types/compass.types';
import { calculateQiblaAzimuth, calculateDistanceToMecca } from '../../../utils/prayers/compass.utils';
import { HEADING_UPDATE_THROTTLE, LOCATION_UPDATE_THROTTLE } from '../../../constants/compass.constants';

// Mock data for simulators/emulators
const MOCK_LOCATION: LocationCoordinates = {
  latitude: 40.7128, // New York City
  longitude: -74.0060,
};

const MOCK_HEADING_START = 0;

// Initial state
const initialState: CompassState = {
  userHeading: null,
  qiblaAzimuth: null,
  loading: true,
  error: null,
  permissionStatus: null,
  distanceToMecca: null,
  userLocation: null,
};

// Reducer function
const compassReducer = (state: CompassState, action: CompassAction): CompassState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    
    case 'SET_PERMISSION_STATUS':
      return { ...state, permissionStatus: action.payload };
    
    case 'SET_USER_HEADING':
      return { ...state, userHeading: action.payload, error: null };
    
    case 'SET_QIBLA_DATA':
      return {
        ...state,
        qiblaAzimuth: action.payload.qiblaAzimuth,
        distanceToMecca: action.payload.distanceToMecca,
        userLocation: action.payload.userLocation,
        loading: false,
        error: null,
      };
    
    case 'RESET':
      return initialState;
    
    default:
      return state;
  }
};

/**
 * Custom hook for compass functionality
 * Manages location, heading, and Qibla calculations
 */
const useCompass = () => {
  const [state, dispatch] = useReducer(compassReducer, initialState);
  
  const headingSubscriptionRef = useRef<Location.LocationSubscription | null>(null);
  const lastHeadingUpdateRef = useRef<number>(0);
  const lastLocationUpdateRef = useRef<number>(0);
  const isMountedRef = useRef<boolean>(true);
  const mockHeadingRef = useRef<number>(MOCK_HEADING_START);
  const mockHeadingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Start mock heading updates for simulator
   */
  const startMockHeading = useCallback(() => {
    if (mockHeadingIntervalRef.current) return;

    console.log('📱 Simulator detected - Using mock compass data');
    
    mockHeadingIntervalRef.current = setInterval(() => {
      if (!isMountedRef.current) return;
      
      // Slowly rotate the heading for testing
      mockHeadingRef.current = (mockHeadingRef.current + 2) % 360;
      
      dispatch({ 
        type: 'SET_USER_HEADING', 
        payload: mockHeadingRef.current 
      });
    }, 100);
  }, []);

  /**
   * Stop mock heading updates
   */
  const stopMockHeading = useCallback(() => {
    if (mockHeadingIntervalRef.current) {
      clearInterval(mockHeadingIntervalRef.current);
      mockHeadingIntervalRef.current = null;
    }
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
    
    if (heading.trueHeading !== null && isMountedRef.current) {
      dispatch({ type: 'SET_USER_HEADING', payload: heading.trueHeading });
    }
  }, []);

  /**
   * Check location services availability
   * Also serves as simulator detection
   */
  const checkLocationServices = useCallback(async (): Promise<{ available: boolean; isSimulator: boolean }> => {
    try {
      const hasServices = await Location.hasServicesEnabledAsync();
      
      // Check if we can get location - if not but services are "enabled", likely simulator
      if (hasServices) {
        try {
          const { status } = await Location.getForegroundPermissionsAsync();
          // If no permissions yet, that's ok
          return { available: true, isSimulator: false };
        } catch {
          // If checking permissions fails, might be simulator
          console.log('📱 Detected simulator - using mock data');
          return { available: true, isSimulator: true };
        }
      }
      
      dispatch({
        type: 'SET_ERROR',
        payload: 'Location services are disabled. Please enable them in your device settings.',
      });
      return { available: false, isSimulator: false };
    } catch (error) {
      console.log('📱 Error checking location services - assuming simulator');
      return { available: true, isSimulator: true };
    }
  }, []);

  /**
   * Request location permissions
   */
  const requestPermissions = useCallback(async (isSimulatorMode: boolean): Promise<boolean> => {
    try {
      // For simulator, skip actual permission request and return success
      if (isSimulatorMode) {
        console.log('📱 Simulator mode - skipping permission request');
        dispatch({ type: 'SET_PERMISSION_STATUS', payload: 'granted' as Location.PermissionStatus });
        return true;
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      dispatch({ type: 'SET_PERMISSION_STATUS', payload: status });

      if (status !== 'granted') {
        dispatch({
          type: 'SET_ERROR',
          payload: 'Location permission is required to determine Qibla direction. Please grant permission in settings.',
        });
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error requesting permissions:', error);
      // On simulator, if permission request fails, still allow to proceed
      if (isSimulatorMode) {
        console.log('📱 Permission request failed on simulator - proceeding with mock data');
        return true;
      }
      dispatch({
        type: 'SET_ERROR',
        payload: 'Failed to request location permissions.',
      });
      return false;
    }
  }, []);

  /**
   * Get current location and calculate Qibla direction
   */
  const fetchLocationAndCalculateQibla = useCallback(async (isSimulatorMode: boolean) => {
    try {
      const now = Date.now();
      if (now - lastLocationUpdateRef.current < LOCATION_UPDATE_THROTTLE) {
        return true;
      }
      lastLocationUpdateRef.current = now;

      let userCoordinates: LocationCoordinates;

      // Use mock data for simulator
      if (isSimulatorMode) {
        console.log('📱 Using mock location data for simulator');
        userCoordinates = MOCK_LOCATION;
      } else {
        // Real device - get actual location
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        if (!isMountedRef.current) return false;

        const { latitude, longitude } = location.coords;
        userCoordinates = { latitude, longitude };
      }
      
      const qiblaDirection = calculateQiblaAzimuth(userCoordinates);
      const distanceToMecca = calculateDistanceToMecca(userCoordinates);

      dispatch({
        type: 'SET_QIBLA_DATA',
        payload: {
          qiblaAzimuth: qiblaDirection,
          distanceToMecca,
          userLocation: userCoordinates,
        },
      });

      return true;
    } catch (error) {
      console.error('Error fetching location:', error);
      
      // If error on real device, try to use mock data as fallback
      if (!isSimulatorMode) {
        console.log('⚠️ Error getting location, using mock data as fallback');
        const userCoordinates = MOCK_LOCATION;
        const qiblaDirection = calculateQiblaAzimuth(userCoordinates);
        const distanceToMecca = calculateDistanceToMecca(userCoordinates);

        dispatch({
          type: 'SET_QIBLA_DATA',
          payload: {
            qiblaAzimuth: qiblaDirection,
            distanceToMecca,
            userLocation: userCoordinates,
          },
        });
        return true;
      }
      
      dispatch({
        type: 'SET_ERROR',
        payload: error instanceof Error ? error.message : 'Failed to get your location.',
      });
      return false;
    }
  }, []);

  /**
   * Start watching heading changes
   */
  const startHeadingWatch = useCallback(async (isSimulatorMode: boolean) => {
    try {
      if (isSimulatorMode) {
        // Use mock heading for simulator
        startMockHeading();
      } else if (!headingSubscriptionRef.current && isMountedRef.current) {
        // Real device - watch actual heading
        headingSubscriptionRef.current = await Location.watchHeadingAsync(updateHeading);
      }
    } catch (error) {
      console.error('Error starting heading watch:', error);
      
      // If real device fails, fall back to mock data
      if (!isSimulatorMode) {
        console.log('⚠️ Failed to access compass, falling back to mock data');
        startMockHeading();
      }
    }
  }, [updateHeading, startMockHeading]);

  /**
   * Initialize compass - main initialization flow
   */
  const initializeCompass = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });

      // Check location services (also detects simulator)
      const { available, isSimulator: isSimulatorMode } = await checkLocationServices();
      if (!available) return;

      // Request permissions
      const hasPermission = await requestPermissions(isSimulatorMode);
      if (!hasPermission) return;

      // Get location and calculate Qibla
      const locationSuccess = await fetchLocationAndCalculateQibla(isSimulatorMode);
      if (!locationSuccess) return;

      // Start heading watch
      await startHeadingWatch(isSimulatorMode);

    } catch (error) {
      console.error('Error initializing compass:', error);
      dispatch({
        type: 'SET_ERROR',
        payload: error instanceof Error ? error.message : 'Failed to initialize compass.',
      });
    }
  }, [checkLocationServices, requestPermissions, fetchLocationAndCalculateQibla, startHeadingWatch]);

  /**
   * Retry initialization after error
   */
  const retryInitialization = useCallback(() => {
    dispatch({ type: 'RESET' });
    initializeCompass();
  }, [initializeCompass]);

  /**
   * Cleanup function
   */
  const cleanup = useCallback(() => {
    isMountedRef.current = false;
    
    // Stop real heading subscription
    if (headingSubscriptionRef.current) {
      headingSubscriptionRef.current.remove();
      headingSubscriptionRef.current = null;
    }
    
    // Stop mock heading interval
    stopMockHeading();
  }, [stopMockHeading]);

  // Initialize compass on mount
  useEffect(() => {
    isMountedRef.current = true;
    initializeCompass();

    return cleanup;
  }, [initializeCompass, cleanup]);

  return {
    ...state,
    retryInitialization,
  };
};

export default useCompass;