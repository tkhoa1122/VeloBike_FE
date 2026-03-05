import { User, LoginCredentials, RegisterData, UpdateProfileData, KycDocument } from '../entities/User';
import { ApiResponse } from '../entities/Common';

export interface AuthRepository {
  // Authentication
  register(data: RegisterData): Promise<ApiResponse>;
  login(credentials: LoginCredentials): Promise<ApiResponse<{ accessToken: string; refreshToken: string; user: User }>>;
  googleLogin(googleToken: string): Promise<ApiResponse<{ accessToken: string; refreshToken: string; user: User }>>;
  // facebookLogin: bỏ - không dùng
  logout(): Promise<void>;
  
  // Email verification
  verifyEmail(email: string, code: string): Promise<ApiResponse<{ accessToken?: string; refreshToken?: string; user?: User }>>;
  resendVerificationCode(email: string): Promise<ApiResponse>;
  
  // Password management
  forgotPassword(email: string): Promise<ApiResponse>;
  resetPassword(email: string, code: string, newPassword: string): Promise<ApiResponse>;
  changePassword(currentPassword: string, newPassword: string): Promise<ApiResponse>;
  
  // Profile management
  getCurrentUser(): Promise<User | null>;
  updateProfile(data: UpdateProfileData): Promise<ApiResponse<User>>;
  
  // KYC
  submitKYC(document: KycDocument): Promise<ApiResponse>;
  getKYCStatus(): Promise<ApiResponse<{ status: string; documents: any[] }>>;
  
  // Token management
  getStoredToken(): Promise<string | null>;
  setStoredTokens(accessToken: string, refreshToken?: string): Promise<void>;
  clearStoredTokens(): Promise<void>;
  refreshToken(): Promise<ApiResponse<{ accessToken: string }>>;
  
  // Device management
  registerPushToken(pushToken: string): Promise<ApiResponse>;
  unregisterPushToken(): Promise<ApiResponse>;
}