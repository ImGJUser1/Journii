// stores/location-store.ts
import { create } from 'zustand';
import * as Location from 'expo-location';
import { Platform } from 'react-native';

interface LocationState {
  currentLocation: {
    latitude: number;
    longitude: number;
    city: string;
    country: string;
    accuracy: number;
  } | null;
  isLoading: boolean;
  error: string | null;
  permissionStatus: Location.PermissionStatus | null;
  
  // Actions
  requestPermission: () => Promise<boolean>;
  fetchCurrentLocation: () => Promise<void>;
  setLocation: (location: LocationState['currentLocation']) => void;
}

export const useLocationStore = create<LocationState>((set, get) => ({
  currentLocation: null,
  isLoading: false,
  error: null,
  permissionStatus: null,

  requestPermission: async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    set({ permissionStatus: status });
    return status === Location.PermissionStatus.GRANTED;
  },

  fetchCurrentLocation: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const hasPermission = await get().requestPermission();
      if (!hasPermission) {
        throw new Error('Location permission denied');
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      // Reverse geocode to get city/country
      const [geocode] = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      set({
        currentLocation: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          city: geocode.city || geocode.subregion || 'Unknown',
          country: geocode.country || 'Unknown',
          accuracy: location.coords.accuracy || 0,
        },
        isLoading: false,
      });
    } catch (error: any) {
      set({ 
        error: error.message || 'Failed to get location', 
        isLoading: false 
      });
    }
  },

  setLocation: (location) => set({ currentLocation: location }),
}));