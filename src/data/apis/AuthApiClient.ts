import { BaseApiClient } from './BaseApiClient';
import { ENDPOINTS } from '../../config/api';
import { 
  LoginResponseModel, 
  RegisterResponseModel, 
  ProfileResponseModel, 
  UserModel 
} from '../models/UserModel';
import { LoginCredentials, RegisterData, UpdateProfileData, KycDocument } from '../../domain/entities/User';

export class AuthApiClient extends BaseApiClient {
  /**
   * Register new user
   */
  async register(data: RegisterData): Promise<RegisterResponseModel> {
    return this.post(ENDPOINTS.AUTH.REGISTER, data);
  }

  /**
   * Login user
   */
  async login(credentials: LoginCredentials): Promise<LoginResponseModel> {
    const response = await this.post<LoginResponseModel>(ENDPOINTS.AUTH.LOGIN, credentials);
    
    // Store token if login successful
    if (response.success && response.token) {
      await this.setStoredToken(response.token);
    }
    
    return response;
  }

  /**
   * Google OAuth login  
   */
  async googleLogin(idToken: string): Promise<LoginResponseModel> {
    const response = await this.post<LoginResponseModel>(ENDPOINTS.AUTH.GOOGLE_LOGIN, { idToken });
    
    if (response.success && response.token) {
      await this.setStoredToken(response.token);
    }
    
    return response;
  }

  /**
   * Verify email with OTP
   */
  async verifyEmail(email: string, code: string): Promise<{ success: boolean; message: string }> {
    return this.post(ENDPOINTS.AUTH.VERIFY_EMAIL, { email, code });
  }

  /**
   * Get current user profile
   */
  async getCurrentUser(): Promise<ProfileResponseModel> {
    return this.get(ENDPOINTS.AUTH.ME);
  }

  /**
   * Update user profile
   */
  async updateProfile(data: UpdateProfileData): Promise<ProfileResponseModel> {
    return this.put(ENDPOINTS.AUTH.PROFILE, data);
  }

  /**
   * Upload KYC documents
   */
  async uploadKYC(document: KycDocument): Promise<{ success: boolean; message: string }> {
    const formData = new FormData();
    
    formData.append('documentType', document.documentType);
    
    // Handle file upload - convert base64 to File if needed
    if (typeof document.frontImage === 'string' && document.frontImage.startsWith('data:')) {
      const frontFile = this.dataURLtoFile(document.frontImage, 'front_document.jpg');
      formData.append('frontImage', frontFile);
    } else {
      formData.append('frontImage', document.frontImage as any);
    }
    
    if (document.backImage) {
      if (typeof document.backImage === 'string' && document.backImage.startsWith('data:')) {
        const backFile = this.dataURLtoFile(document.backImage, 'back_document.jpg');
        formData.append('backImage', backFile);
      } else {
        formData.append('backImage', document.backImage as any);
      }
    }
    
    return this.upload(ENDPOINTS.AUTH.KYC_UPLOAD, formData);
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      // Optional: Call server logout for audit trail
      await this.post('/auth/logout');
    } catch (error) {
      // Continue with local logout even if server call fails
      console.warn('Server logout failed:', error);
    }
    
    // Clear local token
    await this.clearStoredToken();
  }

  /**
   * Resend verification code
   */
  async resendVerificationCode(email: string): Promise<{ success: boolean; message: string }> {
    return this.post('/auth/resend-verification', { email });
  }

  /**
   * Forgot password
   */
  async forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
    return this.post('/auth/forgot-password', { email });
  }

  /**
   * Reset password
   */
  async resetPassword(token: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    return this.post('/auth/reset-password', { token, newPassword });
  }

  /**
   * Change password
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    return this.post('/auth/change-password', { currentPassword, newPassword });
  }

  /**
   * Register push token
   */
  async registerPushToken(pushToken: string): Promise<{ success: boolean; message: string }> {
    return this.post('/auth/push-token', { pushToken });
  }

  /**
   * Helper: Convert dataURL to File object
   */
  private dataURLtoFile(dataurl: string, filename: string): File {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)![1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    
    return new File([u8arr], filename, { type: mime });
  }
}