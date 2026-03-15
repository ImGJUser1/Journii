// stores/ui-store.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface UIState {
  // Theme
  isDarkMode: boolean;
  theme: 'light' | 'dark' | 'system';
  
  // UI State
  isOnline: boolean;
  isLoading: boolean;
  toasts: Toast[];
  
  // Navigation
  currentRoute: string | null;
  
  // Actions
  setTheme: (theme: UIState['theme']) => void;
  toggleDarkMode: () => void;
  setOnline: (isOnline: boolean) => void;
  setLoading: (isLoading: boolean) => void;
  showToast: (toast: Omit<Toast, 'id'>) => void;
  hideToast: (id: string) => void;
  setCurrentRoute: (route: string) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      isDarkMode: true,
      theme: 'dark',
      isOnline: true,
      isLoading: false,
      toasts: [],
      currentRoute: null,

      setTheme: (theme) => set({ theme }),
      
      toggleDarkMode: () => set((state) => ({ 
        isDarkMode: !state.isDarkMode 
      })),
      
      setOnline: (isOnline) => set({ isOnline }),
      
      setLoading: (isLoading) => set({ isLoading }),
      
      showToast: (toast) => {
        const id = Math.random().toString(36).substr(2, 9);
        const duration = toast.duration || 3000;
        
        set((state) => ({
          toasts: [...state.toasts, { ...toast, id }],
        }));

        // Auto-hide after duration
        setTimeout(() => {
          get().hideToast(id);
        }, duration);
      },
      
      hideToast: (id) => set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      })),
      
      setCurrentRoute: (route) => set({ currentRoute: route }),
    }),
    {
      name: 'ui-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ 
        isDarkMode: state.isDarkMode, 
        theme: state.theme 
      }),
    }
  )
);