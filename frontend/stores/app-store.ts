import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface UserPreferences {
  interests: string[];
  preferredTransportModes: string[];
  safetyPriority: 'low' | 'medium' | 'high';
  budgetRange: [number, number];
  crowdTolerance: 'low' | 'medium' | 'high';
}

interface UserProfile {
  id: string;
  name: string;
  avatar: string;
  level: number;
  xp: number;
  safetyScore: number;
  preferences: UserPreferences;
}

interface AppState {
  user: UserProfile | null;
  isOnboarded: boolean;
  currentLocation: {
    latitude: number;
    longitude: number;
  } | null;
  
  // Actions
  setUser: (user: UserProfile) => void;
  updateUserPreferences: (preferences: Partial<UserPreferences>) => void;
  setOnboarded: (onboarded: boolean) => void;
  setCurrentLocation: (location: { latitude: number; longitude: number }) => void;
  addXP: (amount: number) => void;
  
  // Persistence
  loadFromStorage: () => Promise<void>;
  saveToStorage: () => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  user: null,
  isOnboarded: false,
  currentLocation: null,

  setUser: (user) => {
    set({ user });
    get().saveToStorage();
  },

  updateUserPreferences: (preferences) => {
    const { user } = get();
    if (user) {
      const updatedUser = {
        ...user,
        preferences: { ...user.preferences, ...preferences },
      };
      set({ user: updatedUser });
      get().saveToStorage();
    }
  },

  setOnboarded: (onboarded) => {
    set({ isOnboarded: onboarded });
    get().saveToStorage();
  },

  setCurrentLocation: (location) => {
    set({ currentLocation: location });
  },

  addXP: (amount) => {
    const { user } = get();
    if (user) {
      const newXP = user.xp + amount;
      const newLevel = Math.floor(newXP / 1000) + 1;
      
      const updatedUser = {
        ...user,
        xp: newXP,
        level: newLevel,
      };
      
      set({ user: updatedUser });
      get().saveToStorage();
    }
  },

  loadFromStorage: async () => {
    try {
      const stored = await AsyncStorage.getItem('app-state');
      if (stored) {
        const { user, isOnboarded } = JSON.parse(stored);
        set({ user, isOnboarded });
      }
    } catch (error) {
      console.error('Failed to load from storage:', error);
    }
  },

  saveToStorage: async () => {
    try {
      const { user, isOnboarded } = get();
      await AsyncStorage.setItem('app-state', JSON.stringify({
        user,
        isOnboarded,
      }));
    } catch (error) {
      console.error('Failed to save to storage:', error);
    }
  },
}));