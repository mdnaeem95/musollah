import type { PermissionStatus } from 'expo-location';

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
}

export interface CompassState {
  userHeading: number | null;
  qiblaAzimuth: number | null;
  loading: boolean;
  error: string | null;
  permissionStatus: PermissionStatus | null; // ✅ was Location.PermissionStatus
  distanceToMecca: number | null;
  userLocation: LocationCoordinates | null;
}

export interface CompassValues {
  angle: number;
  proximityToQibla: number;
  isClose: boolean;
}

export interface FormattedDistance {
  km: number;
  miles: number;
}

export interface CompassProps {
  onQiblaFound?: () => void;
  enableVibration?: boolean;
  enablePulseAnimation?: boolean;
}

export type CompassAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_PERMISSION_STATUS'; payload: PermissionStatus } // ✅ was Location.PermissionStatus
  | { type: 'SET_USER_HEADING'; payload: number }
  | {
      type: 'SET_QIBLA_DATA';
      payload: {
        qiblaAzimuth: number;
        distanceToMecca: number;
        userLocation: LocationCoordinates;
      };
    }
  | { type: 'RESET' };
