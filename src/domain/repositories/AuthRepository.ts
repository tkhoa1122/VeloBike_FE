import { User, LoginCredentials, RegisterData, UpdateProfileData, KycDocument } from '../entities/User';
import { ApiResponse } from '../entities/Common';

export interface AuthRepository {
  // Authentication
  register(data: RegisterData): Promise<ApiResponse>;
  login(credentials: LoginCredentials): Promise<ApiResponse<{ token: string; user: User }>>;
  googleLogin(idToken: string): Promise<ApiResponse<{ token: string; user: User }>>;
  logout(): Promise<void>;
  
  // Email verification
  verifyEmail(email: string, code: string): Promise<ApiResponse>;
  resendVerificationCode(email: string): Promise<ApiResponse>;
  
  // Password management
  forgotPassword(email: string): Promise<ApiResponse>;
  resetPassword(token: string, newPassword: string): Promise<ApiResponse>;
  changePassword(currentPassword: string, newPassword: string): Promise<ApiResponse>;
  
  // Profile management
  getCurrentUser(): Promise<User | null>;
  updateProfile(data: UpdateProfileData): Promise<ApiResponse<User>>;
  
  // KYC
  submitKYC(document: KycDocument): Promise<ApiResponse>;
  getKYCStatus(): Promise<ApiResponse<{ status: string; documents: any[] }>>;
  
  // Token management
  getStoredToken(): Promise<string | null>;
  setStoredToken(token: string): Promise<void>;
  clearStoredToken(): Promise<void>;
  refreshToken(): Promise<ApiResponse<{ token: string }>>;
  
  // Device management
  registerPushToken(pushToken: string): Promise<ApiResponse>;
  unregisterPushToken(): Promise<ApiResponse>;
}