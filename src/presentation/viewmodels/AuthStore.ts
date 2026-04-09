import { create } from 'zustand';
import { User, LoginCredentials, RegisterData, UpdateProfileData } from '../../domain/entities/User';
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
  verifyEmail: (email: string, code: string) => Promise<boolean>;
  resendVerification: (email: string) => Promise<boolean>;
  logout: () => Promise<void>;
  getCurrentUser: (silent?: boolean, force?: boolean) => Promise<void>;
  forgotPassword: (email: string) => Promise<boolean>;
  updateProfile: (data: UpdateProfileData) => Promise<boolean>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
  submitKycSuccess: () => void;
  upgradeToSellerSuccess: (updatedUser?: User) => void;
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
        // Fetch full profile after login to ensure all fields (address, bodyMeasurements, etc.) are loaded
        try {
          const fullUser = await useCase.getCurrentUser().execute();
          if (fullUser) {
            set({ user: fullUser });
          }
        } catch {
          // Non-critical: keep login user data if full profile fetch fails
        }
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
        // Fetch full profile after login to ensure all fields are loaded
        try {
          const fullUser = await useCase.getCurrentUser().execute();
          if (fullUser) {
            set({ user: fullUser });
          }
        } catch {
          // Non-critical: keep login user data if full profile fetch fails
        }
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

  verifyEmail: async (email: string, code: string): Promise<boolean> => {
    set({ loadingState: 'loading', error: null });

    try {
      const result = await useCase.verifyEmail().execute(email, code);

      if (result.success) {
        // If backend returns user + tokens (auto-login after verify)
        if (result.data?.user) {
          set({
            user: result.data.user,
            isAuthenticated: true,
            loadingState: 'success',
            error: null,
          });
        } else {
          set({ loadingState: 'success', error: null });
        }
        return true;
      } else {
        set({
          loadingState: 'error',
          error: result.message,
        });
        return false;
      }
    } catch (error) {
      set({
        loadingState: 'error',
        error: error instanceof Error ? error.message : 'Email verification failed',
      });
      return false;
    }
  },

  resendVerification: async (email: string): Promise<boolean> => {
    // Don't override main loading state — use separate UX for resend
    try {
      const result = await useCase.resendVerification().execute(email);
      return result.success;
    } catch {
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

  getCurrentUser: async (silent: boolean = false, force: boolean = false): Promise<void> => {
    // Don't set loading if already loading
    const { loadingState, isAuthenticated } = get();
    if (loadingState === 'loading') {
      return;
    }
    
    // Skip refresh if already authenticated and not forced
    if (isAuthenticated && !force) {
      return;
    }
    
    set({ loadingState: 'loading', error: silent ? get().error : null });
    
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
        if (silent && get().user) {
          set({
            loadingState: 'idle',
            error: null,
          });
          return;
        }

        set({ 
          user: null,
          isAuthenticated: false,
          loadingState: 'idle',
          error: null 
        });
      }
    } catch (error) {
      if (silent && get().user) {
        set({
          loadingState: 'idle',
          error: null,
        });
        return;
      }

      set({ 
        user: null,
        isAuthenticated: false,
        loadingState: silent ? 'idle' : 'error',
        error: silent ? null : (error instanceof Error ? error.message : 'Failed to get user') 
      });
    }
  },

  clearError: () => {
    set({ error: null });
  },

  forgotPassword: async (email: string): Promise<boolean> => {
    set({ loadingState: 'loading', error: null });
    try {
      const result = await useCase.auth().forgotPassword(email);
      if (result.success) {
        set({ loadingState: 'success', error: null });
        return true;
      } else {
        set({ loadingState: 'error', error: result.message || 'Không thể gửi email đặt lại mật khẩu' });
        return false;
      }
    } catch (error) {
      set({ loadingState: 'error', error: error instanceof Error ? error.message : 'Gửi yêu cầu thất bại' });
      return false;
    }
  },

  updateProfile: async (data: UpdateProfileData): Promise<boolean> => {
    set({ loadingState: 'loading', error: null });
    try {
      const result = await useCase.auth().updateProfile(data);
      if (result.success && result.data) {
        set({ user: result.data, loadingState: 'success', error: null });
        return true;
      } else {
        set({ loadingState: 'error', error: result.message || 'Cập nhật hồ sơ thất bại' });
        return false;
      }
    } catch (error) {
      set({ loadingState: 'error', error: error instanceof Error ? error.message : 'Cập nhật thất bại' });
      return false;
    }
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<boolean> => {
    set({ loadingState: 'loading', error: null });
    try {
      const result = await useCase.auth().changePassword(currentPassword, newPassword);
      if (result.success) {
        set({ loadingState: 'success', error: null });
        return true;
      } else {
        set({ loadingState: 'error', error: result.message || 'Đổi mật khẩu thất bại' });
        return false;
      }
    } catch (error) {
      set({ loadingState: 'error', error: error instanceof Error ? error.message : 'Đổi mật khẩu thất bại' });
      return false;
    }
  },

  // Update KYC status after successful submission
  submitKycSuccess: (): void => {
    const currentUser = get().user;
    if (currentUser) {
      set({
        user: {
          ...currentUser,
          kycStatus: 'pending',
        },
      });
    }
  },

  // Update user role to seller after upgrade
  upgradeToSellerSuccess: (updatedUser?: User): void => {
    const currentUser = get().user;
    if (updatedUser) {
      set({ user: updatedUser });
    } else if (currentUser) {
      set({
        user: {
          ...currentUser,
          role: 'SELLER',
        },
      });
    }
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