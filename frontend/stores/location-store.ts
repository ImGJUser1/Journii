import { create } from 'zustand';
import * as Location from 'expo-location';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface LocationState {
  // State
  currentLocation: {
    latitude: number;
    longitude: number;
    city?: string;
    country?: string;
    address?: string;
  } | null;
  hasPermission: boolean;
  isTracking: boolean;
  
  // Actions
  requestPermission: () => Promise<boolean>;
  startTracking: () => Promise<void>;
  stopTracking: () => void;
  updateLocation: (location: LocationState['currentLocation']) => void;
  setLocationFromGPS: () => Promise<void>;
}

export const useLocationStore = create<LocationState>()(
  persist(
    (set, get) => ({
      currentLocation: null,
      hasPermission: false,
      isTracking: false,

      requestPermission: async () => {
        const { status } = await Location.requestForegroundPermissionsAsync();
        const granted = status === 'granted';
        set({ hasPermission: granted });
        return granted;
      },

      startTracking: async () => {
        const { hasPermission } = get();
        if (!hasPermission) {
          const granted = await get().requestPermission();
          if (!granted) return;
        }

        await Location.startLocationUpdatesAsync('location-tracking', {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 30000, // 30 seconds
          distanceInterval: 100, // 100 meters
        });

        set({ isTracking: true });
      },

      stopTracking: async () => {
        await Location.stopLocationUpdatesAsync('location-tracking');
        set({ isTracking: false });
      },

      updateLocation: (location) => set({ currentLocation: location }),

      setLocationFromGPS: async () => {
        const { hasPermission } = get();
        if (!hasPermission) {
          const granted = await get().requestPermission();
          if (!granted) throw new Error('Location permission denied');
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
            city: geocode?.city || geocode?.subregion,
            country: geocode?.country,
            address: geocode ? `${geocode.street}, ${geocode.city}` : undefined,
          },
        });
      },
    }),
    {
      name: 'location-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        currentLocation: state.currentLocation,
        hasPermission: state.hasPermission,
      }),
    }
  )
);