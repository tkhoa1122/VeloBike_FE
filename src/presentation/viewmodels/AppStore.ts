import { create } from 'zustand';
import { AppSettings, FeatureFlags } from '../../domain/entities/Common';

interface AppState {
  // App-wide state
  isInitialized: boolean;
  isOnline: boolean;
  settings: AppSettings;
  featureFlags: FeatureFlags;
  
  // Navigation state
  currentScreen: string;
  navigationParams: Record<string, any>;
  
  // Modal/Overlay state
  showLoginModal: boolean;
  showLocationPermissionModal: boolean;
  
  // Actions
  initialize: () => Promise<void>;
  setOnlineStatus: (isOnline: boolean) => void;
  setCurrentScreen: (screen: string, params?: Record<string, any>) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  toggleLoginModal: (show: boolean) => void;
  toggleLocationPermissionModal: (show: boolean) => void;
}

// Default settings
const defaultSettings: AppSettings = {
  language: 'vi',
  currency: 'VND',
  theme: 'light',
  notifications: {
    push: true,
    email: true,
    marketing: false
  },
  location: {
    enabled: false,
    accuracy: 'high'
  },
  privacy: {
    analytics: true,
    crashReporting: true,
    personalizedAds: false
  }
};

// Default feature flags
const defaultFeatureFlags: FeatureFlags = {
  chatbot: true,
  videoChat: false,
  liveStreaming: false,
  socialLogin: true,
  biometricAuth: false,
  paymentInstallment: false,
  inspectionAR: false,
  listingBoost: true
};

export const useAppStore = create<AppState>((set, get) => ({
  // Initial state
  isInitialized: false,
  isOnline: true,
  settings: defaultSettings,
  featureFlags: defaultFeatureFlags,
  currentScreen: 'Home',
  navigationParams: {},
  showLoginModal: false,
  showLocationPermissionModal: false,

  // Actions
  initialize: async (): Promise<void> => {
    try {
      // Load saved settings from storage
      // This would use AsyncStorage in React Native
      const savedSettings = await loadSettingsFromStorage();
      if (savedSettings) {
        set({ settings: { ...defaultSettings, ...savedSettings } });
      }
      
      // Load feature flags from server or config
      const flags = await loadFeatureFlags();
      if (flags) {
        set({ featureFlags: flags });
      }
      
      set({ isInitialized: true });
    } catch (error) {
      console.warn('Failed to initialize app:', error);
      set({ isInitialized: true }); // Continue with defaults
    }
  },

  setOnlineStatus: (isOnline: boolean): void => {
    set({ isOnline });
  },

  setCurrentScreen: (screen: string, params: Record<string, any> = {}): void => {
    set({ currentScreen: screen, navigationParams: params });
  },

  updateSettings: (newSettings: Partial<AppSettings>): void => {
    set(state => {
      const updatedSettings = { ...state.settings, ...newSettings };
      
      // Save to storage
      saveSettingsToStorage(updatedSettings);
      
      return { settings: updatedSettings };
    });
  },

  toggleLoginModal: (show: boolean): void => {
    set({ showLoginModal: show });
  },

  toggleLocationPermissionModal: (show: boolean): void => {
    set({ showLocationPermissionModal: show });
  },
}));

// Helper functions (would be implemented with AsyncStorage in React Native)
async function loadSettingsFromStorage(): Promise<Partial<AppSettings> | null> {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = localStorage.getItem('app_settings');
      return saved ? JSON.parse(saved) : null;
    }
    return null;
  } catch (error) {
    console.warn('Error loading settings:', error);
    return null;
  }
}

async function saveSettingsToStorage(settings: AppSettings): Promise<void> {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('app_settings', JSON.stringify(settings));
    }
  } catch (error) {
    console.warn('Error saving settings:', error);
  }
}

async function loadFeatureFlags(): Promise<FeatureFlags | null> {
  // This would typically fetch from server or config
  // For now, return defaults
  return defaultFeatureFlags;
}

// Selectors
export const useIsAppInitialized = () => useAppStore(state => state.isInitialized);
export const useIsOnline = () => useAppStore(state => state.isOnline);
export const useAppSettings = () => useAppStore(state => state.settings);
export const useFeatureFlags = () => useAppStore(state => state.featureFlags);
export const useCurrentScreen = () => useAppStore(state => state.currentScreen);