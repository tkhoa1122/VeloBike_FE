import { UserRole, KycStatus } from '../../config/constants';

export interface User {
  _id: string;
  email: string;
  fullName: string;
  avatar?: string;
  phone?: string;
  role: UserRole;
  emailVerified: boolean;
  kycStatus: KycStatus;
  
  address?: Address;
  bodyMeasurements?: BodyMeasurements;
  wallet?: Wallet;
  reputation?: Reputation;
  
  // Subscription info
  subscription?: {
    plan: string;
    expiresAt: Date;
    isActive: boolean;
  };
  
  // OAuth info
  googleId?: string;
  facebookId?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface Address {
  street: string;
  district: string;
  city: string;
  province: string;
  zipCode?: string;
  coordinates?: [number, number]; // [longitude, latitude]
}

export interface BodyMeasurements {
  height: number; // cm
  inseam?: number; // cm
  weight?: number; // kg
}

export interface Wallet {
  balance: number;
  currency: string; // VND
  totalEarnings?: number;
  totalSpent?: number;
}

export interface Reputation {
  score: number; // 0-5
  reviewCount: number;
  categories?: {
    itemAccuracy: number;
    communication: number;
    shipping: number;
    packaging: number;
  };
}

// For Auth operations
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  fullName: string;
  role?: UserRole;
}

export interface UpdateProfileData {
  fullName?: string;
  phone?: string;
  address?: Address;
  bodyMeasurements?: BodyMeasurements;
}

export interface KycDocument {
  documentType: 'ID_CARD' | 'PASSPORT' | 'DRIVER_LICENSE';
  frontImage: string; // URL or base64
  backImage?: string; // URL or base64
}

export interface PasswordResetData {
  email: string;
  code: string;
  newPassword: string;
}