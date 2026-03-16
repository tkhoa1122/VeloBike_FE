/**
 * Google Sign-In Service for React Native
 */
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { ENV } from '../config/environment';

export class GoogleAuthService {
  private static isDeveloperConfigError(error: any): boolean {
    return (
      error?.code === 'DEVELOPER_ERROR' ||
      String(error?.message || '').toUpperCase().includes('DEVELOPER_ERROR')
    );
  }

  private static getReadableError(error: any): string {
    if (error?.code === statusCodes.SIGN_IN_CANCELLED) {
      return 'Đăng nhập Google đã bị hủy';
    }
    if (error?.code === statusCodes.IN_PROGRESS) {
      return 'Đăng nhập Google đang được xử lý';
    }
    if (error?.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      return 'Thiết bị chưa có Google Play Services';
    }
    if (this.isDeveloperConfigError(error)) {
      return 'Google Sign-In chưa cấu hình đúng (OAuth client/SHA-1/package name)';
    }
    return error?.message || 'Đăng nhập Google thất bại';
  }
  
  /**
   * Configure Google Sign-In
   */
  static configure() {
    GoogleSignin.configure({
      webClientId: ENV.GOOGLE_CLIENT_ID,
      offlineAccess: true,
      hostedDomain: '', // Optional
      forceCodeForRefreshToken: true,
    });
  }

  /**
   * Sign in with Google
   */
  static async signIn(): Promise<{ idToken: string; user: any } | null> {
    try {
      // Check if device supports Google Play Services
      await GoogleSignin.hasPlayServices();
      
      // Get user info
      const userInfo = await GoogleSignin.signIn();
      
      if (!userInfo.data?.idToken) {
        throw new Error('No ID token received');
      }
      
      return {
        idToken: userInfo.data.idToken,
        user: userInfo.data.user
      };
    } catch (error: any) {
      // Use warn (not error) to avoid React Native redbox in development for handled auth errors.
      console.warn('Google Sign-In warning:', this.getReadableError(error));
      
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log('User cancelled sign in');
      } else if (error.code === statusCodes.IN_PROGRESS) {
        console.log('Sign in in progress');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        console.log('Play services not available');
      } else if (this.isDeveloperConfigError(error)) {
        console.log('Google OAuth config mismatch (SHA/package/client)');
      } else {
        console.log('Other error occurred');
      }
      
      return null;
    }
  }

  /**
   * Sign out
   */
  static async signOut(): Promise<void> {
    try {
      await GoogleSignin.signOut();
    } catch (error) {
      console.error('Google Sign-Out error:', error);
    }
  }

  /**
   * Check if user is signed in
   */
  static async isSignedIn(): Promise<boolean> {
    try {
      const isSignedIn = await GoogleSignin.getCurrentUser();
      return isSignedIn !== null;
    } catch (error) {
      console.error('Check sign-in status error:', error);
      return false;
    }
  }

  /**
   * Get current user
   */
  static async getCurrentUser(): Promise<any | null> {
    try {
      return await GoogleSignin.getCurrentUser();
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }
}