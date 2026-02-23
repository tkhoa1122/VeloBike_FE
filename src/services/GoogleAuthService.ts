/**
 * Google Sign-In Service for React Native
 */
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { ENV } from '../config/environment';

export class GoogleAuthService {
  
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
      console.error('Google Sign-In error:', error);
      
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log('User cancelled sign in');
      } else if (error.code === statusCodes.IN_PROGRESS) {
        console.log('Sign in in progress');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        console.log('Play services not available');
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