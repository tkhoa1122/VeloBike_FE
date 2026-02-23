import { create } from 'zustand';
import { User, LoginCredentials, RegisterData } from '../../domain/entities/User';
import { useCase } from '../../di/Container';
import { LoadingState } from '../../domain/entities/Common';
import { GoogleAuthService } from '../../services/GoogleAuthService';

interface AuthState {
  // State
  user: User | null;
  isAuthenticated: boolean;
  loadingState: LoadingState;
  error: string | null;
  
  // Actions
  login: (credentials: LoginCredentials) => Promise<boolean>;
  googleLogin: () => Promise<boolean>;
  register: (data: RegisterData) => Promise<boolean>;
  logout: () => Promise<void>;
  getCurrentUser: () => Promise<void>;
  clearError: () => void;
  
  // UI helpers
  isLoading: () => boolean;
  isLoggedIn: () => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  // Initial state
  user: null,
  isAuthenticated: false,
  loadingState: 'idle',
  error: null,

  // Actions
  login: async (credentials: LoginCredentials): Promise<boolean> => {
    set({ loadingState: 'loading', error: null });
    
    try {
      const result = await useCase.login().execute(credentials);
      
      if (result.success && result.data) {
        set({ 
          user: result.data.user,
          isAuthenticated: true,
          loadingState: 'success',
          error: null 
        });
        return true;
      } else {
        set({ 
          loadingState: 'error', 
          error: result.message,
          isAuthenticated: false,
          user: null 
        });
        return false;
      }
    } catch (error) {
      set({ 
        loadingState: 'error', 
        error: error instanceof Error ? error.message : 'Login failed',
        isAuthenticated: false,
        user: null 
      });
      return false;
    }
  },
  googleLogin: async (): Promise<boolean> => {
    set({ loadingState: 'loading', error: null });
    
    try {
      // Step 1: Google Sign-In
      const googleResult = await GoogleAuthService.signIn();
      if (!googleResult) {
        set({ 
          loadingState: 'error', 
          error: 'Google sign-in cancelled or failed',
          isAuthenticated: false,
          user: null 
        });
        return false;
      }

      // Step 2: Send ID token to backend
      const result = await useCase.googleLogin().execute(googleResult.idToken);
      
      if (result.success && result.data) {
        set({ 
          loadingState: 'success',
          user: result.data.user,
          isAuthenticated: true,
          error: null 
        });
        return true;
      } else {
        set({ 
          loadingState: 'error', 
          error: result.message,
          isAuthenticated: false,
          user: null 
        });
        return false;
      }
    } catch (error) {
      set({ 
        loadingState: 'error', 
        error: error instanceof Error ? error.message : 'Google login failed',
        isAuthenticated: false,
        user: null 
      });
      return false;
    }
  },
  register: async (data: RegisterData): Promise<boolean> => {
    set({ loadingState: 'loading', error: null });
    
    try {
      const result = await useCase.register().execute(data);
      
      if (result.success) {
        set({ 
          loadingState: 'success',
          error: null 
        });
        return true;
      } else {
        set({ 
          loadingState: 'error', 
          error: result.message 
        });
        return false;
      }
    } catch (error) {
      set({ 
        loadingState: 'error', 
        error: error instanceof Error ? error.message : 'Registration failed' 
      });
      return false;
    }
  },

  logout: async (): Promise<void> => {
    set({ loadingState: 'loading', error: null });
    
    try {
      await useCase.logout().execute();
      
      set({ 
        user: null,
        isAuthenticated: false,
        loadingState: 'idle',
        error: null 
      });
    } catch {
      // Even if logout fails on server, clear local state
      set({ 
        user: null,
        isAuthenticated: false,
        loadingState: 'idle',
        error: null 
      });
    }
  },

  getCurrentUser: async (): Promise<void> => {
    // Don't set loading if already loading or if already authenticated
    const { loadingState, isAuthenticated } = get();
    if (loadingState === 'loading' || isAuthenticated) {
      return;
    }
    
    set({ loadingState: 'loading', error: null });
    
    try {
      const user = await useCase.getCurrentUser().execute();
      
      if (user) {
        set({ 
          user,
          isAuthenticated: true,
          loadingState: 'success',
          error: null 
        });
      } else {
        set({ 
          user: null,
          isAuthenticated: false,
          loadingState: 'idle',
          error: null 
        });
      }
    } catch (error) {
      set({ 
        user: null,
        isAuthenticated: false,
        loadingState: 'error',
        error: error instanceof Error ? error.message : 'Failed to get user' 
      });
    }
  },

  clearError: () => {
    set({ error: null });
  },

  // UI helpers
  isLoading: (): boolean => {
    return get().loadingState === 'loading';
  },

  isLoggedIn: (): boolean => {
    return get().isAuthenticated && get().user !== null;
  },
}));

// Selectors for better performance
export const useAuthUser = () => useAuthStore(state => state.user);
export const useIsAuthenticated = () => useAuthStore(state => state.isAuthenticated);
export const useAuthLoading = () => useAuthStore(state => state.loadingState === 'loading');
export const useAuthError = () => useAuthStore(state => state.error);