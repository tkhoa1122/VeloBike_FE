/**
 * User Model - Maps server response to domain entity
 */
export interface UserModel {
  _id: string;
  email: string;
  fullName: string;
  avatar?: string;
  phone?: string;
  role: string;
  emailVerified: boolean;
  kycStatus: string;
  
  address?: {
    street: string;
    district: string;
    city: string;
    province: string;
    zipCode?: string;
    coordinates?: [number, number];
  };
  
  bodyMeasurements?: {
    height: number;
    inseam?: number;
    weight?: number;
  };
  
  wallet?: {
    balance: number;
    currency: string;
    totalEarnings?: number;
    totalSpent?: number;
  };
  
  reputation?: {
    score: number;
    reviewCount: number;
    categories?: {
      itemAccuracy: number;
      communication: number;
      shipping: number;
      packaging: number;
    };
  };
  
  subscription?: {
    plan: string;
    expiresAt: string; // ISO string
    isActive: boolean;
  };
  
  googleId?: string;
  facebookId?: string;
  
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

// Auth response models
export interface LoginResponseModel {
  success: boolean;
  token: string;
  user: UserModel;
  message?: string;
}

export interface RegisterResponseModel {
  success: boolean;
  message: string;
}

export interface ProfileResponseModel {
  success: boolean;
  user: UserModel;
  message?: string;
}