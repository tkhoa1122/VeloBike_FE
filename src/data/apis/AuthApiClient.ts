import { BaseApiClient } from './BaseApiClient';
import { ENDPOINTS } from '../../config/api';
import { 
  LoginResponseModel, 
  RegisterResponseModel, 
  ProfileResponseModel, 
  VerifyEmailResponseModel,
  RefreshTokenResponseModel,
  // AvatarUploadResponseModel, // TODO: BE chưa có route
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
    
    // Store both tokens if login successful
    if (response.success && response.accessToken) {
      await this.setStoredTokens(response.accessToken, response.refreshToken);
    }
    
    return response;
  }

  /**
   * Google OAuth login
   * BE expects field name: googleToken (not idToken)
   */
  async googleLogin(googleToken: string): Promise<LoginResponseModel> {
    const response = await this.post<LoginResponseModel>(ENDPOINTS.AUTH.GOOGLE_LOGIN, { googleToken });
    
    if (response.success && response.accessToken) {
      await this.setStoredTokens(response.accessToken, response.refreshToken);
    }
    
    return response;
  }

  /**
   * Verify email with OTP
   * BE returns tokens after verification
   */
  async verifyEmail(email: string, code: string): Promise<VerifyEmailResponseModel> {
    const response = await this.post<VerifyEmailResponseModel>(ENDPOINTS.AUTH.VERIFY_EMAIL, { email, code });
    
    // Store tokens if returned (auto-login after verification)
    if (response.success && response.accessToken) {
      await this.setStoredTokens(response.accessToken, response.refreshToken);
    }
    
    return response;
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(): Promise<RefreshTokenResponseModel> {
    const refreshToken = await this.getStoredRefreshToken();
    if (!refreshToken) {
      return { success: false, accessToken: '' };
    }
    
    const response = await this.post<RefreshTokenResponseModel>(ENDPOINTS.AUTH.REFRESH_TOKEN, { refreshToken });
    
    if (response.success && response.accessToken) {
      await this.setStoredTokens(response.accessToken);
    }
    
    return response;
  }

  /**
   * Get current user profile
   */
  async getCurrentUser(): Promise<ProfileResponseModel> {
    return this.get(ENDPOINTS.USERS.ME);
  }

  /**
   * Update user profile
   */
  async updateProfile(data: UpdateProfileData): Promise<ProfileResponseModel> {
    return this.put(ENDPOINTS.USERS.ME, data);
  }

  // uploadAvatar: TODO - BE chưa có route /auth/upload-avatar

  /**
   * Upload KYC documents
   */
  async uploadKYC(document: KycDocument): Promise<{ success: boolean; message: string; kycStatus?: string }> {
    const formData = new FormData();
    
    formData.append('documentType', document.documentType);
    
    // Append front image file
    formData.append('frontImage', document.frontImage as any);
    
    // Append back image file (optional)
    if (document.backImage) {
      formData.append('backImage', document.backImage as any);
    }
    
    return this.upload(ENDPOINTS.AUTH.KYC_UPLOAD, formData);
  }

  /**
   * Submit KYC without multipart payload
   */
  async submitKYC(data: {
    idCardFront: string;
    selfie: string;
  }): Promise<{ success: boolean; message?: string; data?: any }> {
    return this.post(ENDPOINTS.KYC.SUBMIT, data);
  }

  /**
   * Get current KYC status
   */
  async getKYCStatus(): Promise<{ success: boolean; data?: any; message?: string }> {
    return this.get(ENDPOINTS.KYC.MY_STATUS);
  }

  /**
   * Logout user - sends refreshToken to server for revocation
   */
  async logout(): Promise<void> {
    try {
      const refreshToken = await this.getStoredRefreshToken();
      await this.post(ENDPOINTS.AUTH.LOGOUT, { refreshToken });
    } catch (error) {
      // Continue with local logout even if server call fails
      console.warn('Server logout failed:', error);
    }
    
    // Clear all local tokens
    await this.clearStoredTokens();
  }

  /**
   * Resend verification code
   */
  async resendVerificationCode(email: string): Promise<{ success: boolean; message: string }> {
    return this.post(ENDPOINTS.AUTH.RESEND_VERIFICATION, { email });
  }

  /**
   * Forgot password
   */
  async forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
    return this.post(ENDPOINTS.AUTH.FORGOT_PASSWORD, { email });
  }

  /**
   * Reset password - BE expects { email, code, newPassword }
   */
  async resetPassword(email: string, code: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    return this.post(ENDPOINTS.AUTH.RESET_PASSWORD, { email, code, newPassword });
  }

  /**
   * Change password
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    return this.post(ENDPOINTS.AUTH.CHANGE_PASSWORD, { currentPassword, newPassword });
  }

  /**
   * Register push token
   */
  async registerPushToken(pushToken: string): Promise<{ success: boolean; message: string }> {
    return this.post(ENDPOINTS.AUTH.PUSH_TOKEN, { pushToken });
  }

  /**
   * Upgrade current user from BUYER to SELLER
   */
  async upgradeToSeller(): Promise<{ success: boolean; message?: string; data?: any }> {
    return this.post(ENDPOINTS.USERS.UPGRADE_TO_SELLER);
  }
}