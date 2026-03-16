/**
 * Environment Configuration
 * Centralized config for different environments
 */
import { Platform } from 'react-native';

const DEV_API_HOST = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';

export const ENV = {
  // Environment detection
  IS_DEV: __DEV__,
  
  // API Configuration
  API_BASE_URL: __DEV__ 
    ? `http://${DEV_API_HOST}:5000/api`
    : 'https://api.velobike.com/api',
    
  // Frontend URL
  APP_URL: __DEV__
    ? 'http://localhost:3000'
    : 'https://velobike.app',
    
  // Google OAuth - React Native
  // Web client (type 3) from velobike-9d912 Firebase project
  GOOGLE_CLIENT_ID: __DEV__
    ? '682683625862-kr755p90024ou1her2hbglpusrq6cm7j.apps.googleusercontent.com'
    : '682683625862-kr755p90024ou1her2hbglpusrq6cm7j.apps.googleusercontent.com',
  
  // Google Web Client ID (cho backend communication)
  GOOGLE_WEB_CLIENT_ID: '682683625862-kr755p90024ou1her2hbglpusrq6cm7j.apps.googleusercontent.com',
    
  // Other OAuth providers
  FACEBOOK_APP_ID: __DEV__
    ? 'your_facebook_app_id' 
    : 'your_facebook_app_id',
    
  // Analytics & Tracking
  GOOGLE_ANALYTICS_ID: __DEV__
    ? undefined
    : 'G-XXXXXXXXXX',
    
  // Payment Gateway
  PAYOS_CLIENT_ID: __DEV__
    ? 'fcdb04a3-9714-4250-9294-c3a3a1afa31f'
    : 'fcdb04a3-9714-4250-9294-c3a3a1afa31f',
    
  // Socket.io
  SOCKET_URL: __DEV__
    ? `http://${DEV_API_HOST}:5000`
    : 'https://api.velobike.com',
    
  // Cloudinary (for image uploads)
  CLOUDINARY_CLOUD_NAME: 'dujwzskla',
  CLOUDINARY_UPLOAD_PRESET: __DEV__
    ? 'velobike_dev'
    : 'velobike_prod',
    
  // Firebase (for push notifications)
  FIREBASE_PROJECT_ID: 'velobike-9d912',
  
  // FPT AI (for chatbot)
  FPT_AI_API_KEY: 'IXNxf5eMiCTBKkPGnSIvqWE6TjUIRlCz',
  FPT_AI_BASE_URL: 'https://api.fpt.ai',
  
  // Gemini AI (for chatbot)
  GEMINI_API_KEY: 'AIzaSyAo1DvtcBAhD6RHN0X-_A3qKfxLoO41bU8',
    
} as const;

/**
 * Feature flags for development/production
 */
export const APP_FEATURES = {
  ENABLE_LOGGING: __DEV__,
  ENABLE_DEBUG_TOOLS: __DEV__,
  ENABLE_CRASHLYTICS: !__DEV__,
  ENABLE_ANALYTICS: !__DEV__,
  ENABLE_PUSH_NOTIFICATIONS: true,
  ENABLE_BIOMETRIC_AUTH: true,
  ENABLE_DARK_MODE: true,
} as const;

export type Environment = typeof ENV;
export type AppFeatures = typeof APP_FEATURES;