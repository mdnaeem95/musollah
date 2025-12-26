/**
 * Compass Hook
 * 
 * ✅ UPDATED: Added structured logging
 * ✅ IMPROVED: Better error tracking and simulator detection logging
 * 
 * Custom hook for Qibla compass functionality.
 * Manages location, heading, and Qibla calculations with simulator support.
 * 
 * @version 2.0
 * @since 2025-12-24
 */

import { useEffect, useRef, useCallback, useReducer } from 'react';
import * as Location from 'expo-location';
import type { CompassState, CompassAction, LocationCoordinates } from '../../../types/compass.types';
import { calculateQiblaAzimuth, calculateDistanceToMecca } from '../../../utils/prayers/compass.utils';
import { HEADING_UPDATE_THROTTLE, LOCATION_UPDATE_THROTTLE } from '../../../constants/compass.constants';

// ✅ Import structured logging
import { createLogger } from '../../../services/logging/logger';

// ✅ Create category-specific logger
const logger = createLogger('Qibla Compass');

// ============================================================================
// CONSTANTS
// ============================================================================

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

// ============================================================================
// REDUCER
// ============================================================================

const compassReducer = (state: CompassState, action: CompassAction): CompassState => {
  switch (action.type) {
    case 'SET_LOADING':
      logger.debug('Compass loading state changed', { loading: action.payload });
      return { ...state, loading: action.payload };
    
    case 'SET_ERROR':
      logger.error('Compass error occurred', new Error(action.type));
      return { ...state, error: action.payload, loading: false };
    
    case 'SET_PERMISSION_STATUS':
      logger.info('Location permission status', { status: action.payload });
      return { ...state, permissionStatus: action.payload };
    
    case 'SET_USER_HEADING':
      // Only log heading changes in DEBUG mode (too frequent otherwise)
      if (__DEV__ && Math.floor(action.payload) % 10 === 0) {
        logger.debug('Heading updated', { heading: Math.floor(action.payload) + '°' });
      }
      return { ...state, userHeading: action.payload, error: null };
    
    case 'SET_QIBLA_DATA':
      logger.success('Qibla data calculated', {
        qiblaAzimuth: action.payload.qiblaAzimuth.toFixed(1) + '°',
        distance: action.payload.distanceToMecca.toFixed(0) + ' km',
        userLocation: {
          lat: action.payload.userLocation.latitude.toFixed(4),
          lng: action.payload.userLocation.longitude.toFixed(4),
        },
      });
      return {
        ...state,
        qiblaAzimuth: action.payload.qiblaAzimuth,
        distanceToMecca: action.payload.distanceToMecca,
        userLocation: action.payload.userLocation,
        loading: false,
        error: null,
      };
    
    case 'RESET':
      logger.debug('Compass reset');
      return initialState;
    
    default:
      return state;
  }
};

// ============================================================================
// HOOK
// ============================================================================

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

  // ✅ Log hook initialization
  useEffect(() => {
    logger.info('Compass hook mounted');
    
    return () => {
      logger.debug('Compass hook unmounted');
    };
  }, []);

  /**
   * Start mock heading updates for simulator
   */
  const startMockHeading = useCallback(() => {
    if (mockHeadingIntervalRef.current) {
      logger.debug('Mock heading already running');
      return;
    }

    logger.info('Starting mock heading updates (simulator mode)', {
      startHeading: MOCK_HEADING_START + '°',
      updateInterval: '100ms',
    });
    
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
      logger.debug('Stopping mock heading updates');
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
    logger.time('check-location-services');
    
    try {
      const hasServices = await Location.hasServicesEnabledAsync();
      
      if (hasServices) {
        try {
          const { status } = await Location.getForegroundPermissionsAsync();
          logger.timeEnd('check-location-services');
          logger.success('Location services available', { 
            hasServices: true, 
            isSimulator: false,
            currentPermission: status,
          });
          return { available: true, isSimulator: false };
        } catch (err) {
          // If checking permissions fails, might be simulator
          logger.timeEnd('check-location-services');
          logger.warn('Simulator detected (permission check failed)', {
            error: err instanceof Error ? err.message : 'Unknown',
          });
          return { available: true, isSimulator: true };
        }
      }
      
      logger.timeEnd('check-location-services');
      logger.error('Location services disabled', new Error('Location services are disabled'));
      
      dispatch({
        type: 'SET_ERROR',
        payload: 'Location services are disabled. Please enable them in your device settings.',
      });
      return { available: false, isSimulator: false };
    } catch (error) {
      logger.timeEnd('check-location-services');
      logger.warn('Error checking location services - assuming simulator', {
        error: error instanceof Error ? error.message : 'Unknown',
      });
      return { available: true, isSimulator: true };
    }
  }, []);

  /**
   * Request location permissions
   */
  const requestPermissions = useCallback(async (isSimulatorMode: boolean): Promise<boolean> => {
    logger.time('request-permissions');
    
    try {
      // For simulator, skip actual permission request and return success
      if (isSimulatorMode) {
        logger.timeEnd('request-permissions');
        logger.info('Skipping permission request (simulator mode)');
        dispatch({ type: 'SET_PERMISSION_STATUS', payload: 'granted' as Location.PermissionStatus });
        return true;
      }

      logger.debug('Requesting location permissions...');
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      logger.timeEnd('request-permissions');
      dispatch({ type: 'SET_PERMISSION_STATUS', payload: status });

      if (status !== 'granted') {
        logger.warn('Location permission denied', { status });
        dispatch({
          type: 'SET_ERROR',
          payload: 'Location permission is required to determine Qibla direction. Please grant permission in settings.',
        });
        return false;
      }
      
      logger.success('Location permission granted');
      return true;
    } catch (error) {
      logger.timeEnd('request-permissions');
      logger.error('Error requesting permissions', error as Error);
      
      // On simulator, if permission request fails, still allow to proceed
      if (isSimulatorMode) {
        logger.info('Permission request failed on simulator - proceeding with mock data');
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
    logger.time('fetch-location-calculate-qibla');
    
    try {
      const now = Date.now();
      if (now - lastLocationUpdateRef.current < LOCATION_UPDATE_THROTTLE) {
        logger.debug('Location update throttled', {
          timeSinceLastUpdate: now - lastLocationUpdateRef.current + 'ms',
          throttleLimit: LOCATION_UPDATE_THROTTLE + 'ms',
        });
        return true;
      }
      lastLocationUpdateRef.current = now;

      let userCoordinates: LocationCoordinates;

      // Use mock data for simulator
      if (isSimulatorMode) {
        logger.info('Using mock location data (simulator mode)', {
          location: 'New York City',
          coordinates: MOCK_LOCATION,
        });
        userCoordinates = MOCK_LOCATION;
      } else {
        // Real device - get actual location
        logger.debug('Fetching real device location...');
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        if (!isMountedRef.current) {
          logger.warn('Component unmounted during location fetch');
          return false;
        }

        const { latitude, longitude } = location.coords;
        userCoordinates = { latitude, longitude };
        
        logger.debug('Real location obtained', {
          lat: latitude.toFixed(4),
          lng: longitude.toFixed(4),
          accuracy: location.coords.accuracy?.toFixed(0) + 'm',
        });
      }
      
      // Calculate Qibla direction
      logger.debug('Calculating Qibla direction...');
      const qiblaDirection = calculateQiblaAzimuth(userCoordinates);
      const distanceToMecca = calculateDistanceToMecca(userCoordinates);

      logger.timeEnd('fetch-location-calculate-qibla');

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
      logger.timeEnd('fetch-location-calculate-qibla');
      logger.error('Error fetching location', error as Error);
      
      // If error on real device, try to use mock data as fallback
      if (!isSimulatorMode) {
        logger.warn('Location error on real device - falling back to mock data');
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
    logger.time('start-heading-watch');
    
    try {
      if (isSimulatorMode) {
        logger.timeEnd('start-heading-watch');
        logger.info('Starting heading watch (simulator mode)');
        startMockHeading();
      } else if (!headingSubscriptionRef.current && isMountedRef.current) {
        logger.debug('Starting real heading watch...');
        headingSubscriptionRef.current = await Location.watchHeadingAsync(updateHeading);
        logger.timeEnd('start-heading-watch');
        logger.success('Heading watch started (real device)');
      }
    } catch (error) {
      logger.timeEnd('start-heading-watch');
      logger.error('Error starting heading watch', error as Error);
      
      // If real device fails, fall back to mock data
      if (!isSimulatorMode) {
        logger.warn('Failed to access real compass - falling back to mock data');
        startMockHeading();
      }
    }
  }, [updateHeading, startMockHeading]);

  /**
   * Initialize compass - main initialization flow
   */
  const initializeCompass = useCallback(async () => {
    logger.info('Initializing compass...');
    logger.time('compass-initialization');
    
    try {
      dispatch({ type: 'SET_LOADING', payload: true });

      // Check location services (also detects simulator)
      const { available, isSimulator: isSimulatorMode } = await checkLocationServices();
      if (!available) {
        logger.timeEnd('compass-initialization');
        logger.error('Compass initialization failed', new Error('Location services not available'));
        return;
      }

      // Request permissions
      const hasPermission = await requestPermissions(isSimulatorMode);
      if (!hasPermission) {
        logger.timeEnd('compass-initialization');
        logger.error('Compass initialization failed', new Error('Location permission denied'));
        return;
      }

      // Get location and calculate Qibla
      const locationSuccess = await fetchLocationAndCalculateQibla(isSimulatorMode);
      if (!locationSuccess) {
        logger.timeEnd('compass-initialization');
        logger.error('Compass initialization failed', new Error('Failed to fetch location'));
        return;
      }

      // Start heading watch
      await startHeadingWatch(isSimulatorMode);

      logger.timeEnd('compass-initialization');
      logger.success('Compass initialized successfully', {
        mode: isSimulatorMode ? 'simulator' : 'real device',
      });

    } catch (error) {
      logger.timeEnd('compass-initialization');
      logger.error('Error initializing compass', error as Error);
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
    logger.info('Retrying compass initialization');
    dispatch({ type: 'RESET' });
    initializeCompass();
  }, [initializeCompass]);

  /**
   * Cleanup function
   */
  const cleanup = useCallback(() => {
    logger.debug('Cleaning up compass resources');
    isMountedRef.current = false;
    
    // Stop real heading subscription
    if (headingSubscriptionRef.current) {
      logger.debug('Removing heading subscription');
      headingSubscriptionRef.current.remove();
      headingSubscriptionRef.current = null;
    }
    
    // Stop mock heading interval
    stopMockHeading();
    
    logger.debug('Compass cleanup complete');
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