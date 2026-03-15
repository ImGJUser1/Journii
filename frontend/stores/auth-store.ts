import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { apiClient } from '@/services/api/client';

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  avatar_url?: string;
  bio?: string;
  phone?: string;
  preferences: Record<string, any>;
  languages: string[];
  xp_points: number;
  level: number;
  badges: string[];
  is_verified: boolean;
  is_premium: boolean;
  safety_score: number;
}

interface AuthState {
  // State
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  onboardingCompleted: boolean;
  
  // Actions
  setUser: (user: User | null) => void;
  setAuthenticated: (value: boolean) => void;
  setLoading: (value: boolean) => void;
  completeOnboarding: () => void;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
  
  // Computed
  get isGuest(): boolean;
  get canAccessPremium(): boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      onboardingCompleted: false,

      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setAuthenticated: (value) => set({ isAuthenticated: value }),
      setLoading: (value) => set({ isLoading: value }),
      
      completeOnboarding: () => set({ onboardingCompleted: true }),
      
      logout: async () => {
        await SecureStore.deleteItemAsync('access_token');
        await SecureStore.deleteItemAsync('refresh_token');
        set({ user: null, isAuthenticated: false });
      },
      
      updateUser: (updates) => {
        const current = get().user;
        if (current) {
          set({ user: { ...current, ...updates } });
        }
      },

      get isGuest() {
        return !get().isAuthenticated;
      },
      
      get canAccessPremium() {
        return get().user?.is_premium || false;
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ 
        onboardingCompleted: state.onboardingCompleted,
        // Don't persist user - get from secure storage/API
      }),
    }
  )
);