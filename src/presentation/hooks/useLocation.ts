import { useState, useEffect } from 'react';
import { Platform, PermissionsAndroid, Alert } from 'react-native';
// NOTE: Cần cài: npm install @react-native-community/geolocation
// import Geolocation from '@react-native-community/geolocation';

export interface LocationCoords {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export interface UseLocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

export const useLocation = (options: UseLocationOptions = {}) => {
  const {
    enableHighAccuracy = true,
    timeout = 15000,
    maximumAge = 10000,
  } = options;

  const [location, setLocation] = useState<LocationCoords | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Request location permission
   */
  const requestLocationPermission = async (): Promise<boolean> => {
    if (Platform.OS === 'ios') {
      // iOS: Request in Info.plist
      // NSLocationWhenInUseUsageDescription
      return true;
    }

    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Quyền truy cập vị trí',
          message: 'VeloBike cần quyền truy cập vị trí để tìm xe gần bạn',
          buttonNeutral: 'Hỏi lại sau',
          buttonNegative: 'Hủy',
          buttonPositive: 'OK',
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn('Location permission error:', err);
      return false;
    }
  };

  /**
   * Get current location
   */
  const getCurrentLocation = async (): Promise<LocationCoords | null> => {
    setLoading(true);
    setError(null);

    try {
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        throw new Error('Không có quyền truy cập vị trí');
      }

      // TODO: Uncomment after installing geolocation
      /*
      return new Promise((resolve, reject) => {
        Geolocation.getCurrentPosition(
          (position) => {
            const coords: LocationCoords = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
            };
            setLocation(coords);
            setLoading(false);
            resolve(coords);
          },
          (error) => {
            setError(error.message);
            setLoading(false);
            reject(error);
          },
          {
            enableHighAccuracy,
            timeout,
            maximumAge,
          }
        );
      });
      */

      // Mock location (Saigon center)
      const mockLocation: LocationCoords = {
        latitude: 10.7769,
        longitude: 106.7009,
        accuracy: 10,
      };
      setLocation(mockLocation);
      setLoading(false);
      return mockLocation;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Không thể lấy vị trí';
      setError(errorMsg);
      setLoading(false);
      return null;
    }
  };

  /**
   * Watch location changes
   */
  const watchLocation = () => {
    // TODO: Implement with Geolocation.watchPosition
    console.warn('watchLocation: Not implemented yet');
  };

  /**
   * Calculate distance between two points (Haversine formula)
   */
  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
    const R = 6371; // Earth radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  };

  return {
    location,
    loading,
    error,
    getCurrentLocation,
    watchLocation,
    calculateDistance,
  };
};
