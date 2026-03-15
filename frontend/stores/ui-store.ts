import { create } from 'zustand';

interface UIState {
  // Theme
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: UIState['theme']) => void;
  
  // Bottom sheet
  activeBottomSheet: string | null;
  bottomSheetData: any;
  openBottomSheet: (id: string, data?: any) => void;
  closeBottomSheet: () => void;
  
  // Toast notifications
  toasts: Array<{
    id: string;
    type: 'success' | 'error' | 'info' | 'warning';
    message: string;
    duration?: number;
  }>;
  showToast: (toast: Omit<UIState['toasts'][0], 'id'>) => void;
  dismissToast: (id: string) => void;
  
  // Loading states
  globalLoading: boolean;
  setGlobalLoading: (value: boolean) => void;
  
  // Network
  isOffline: boolean;
  setIsOffline: (value: boolean) => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  theme: 'system',
  setTheme: (theme) => set({ theme }),
  
  activeBottomSheet: null,
  bottomSheetData: null,
  openBottomSheet: (id, data) => set({ activeBottomSheet: id, bottomSheetData: data }),
  closeBottomSheet: () => set({ activeBottomSheet: null, bottomSheetData: null }),
  
  toasts: [],
  showToast: (toast) => {
    const id = Math.random().toString(36).substring(7);
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id }],
    }));
    
    // Auto dismiss
    setTimeout(() => {
      get().dismissToast(id);
    }, toast.duration || 3000);
  },
  dismissToast: (id) => set((state) => ({
    toasts: state.toasts.filter((t) => t.id !== id),
  })),
  
  globalLoading: false,
  setGlobalLoading: (value) => set({ globalLoading: value }),
  
  isOffline: false,
  setIsOffline: (value) => set({ isOffline: value }),
}));