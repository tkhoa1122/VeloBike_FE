import { BaseApiClient } from './BaseApiClient';
import { ENDPOINTS } from '../../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  LoginResponseModel, 
  RegisterResponseModel, 
  ProfileResponseModel, 
  VerifyEmailResponseModel,
  RefreshTokenResponseModel,
  UserModel 
} from '../models/UserModel';
import { LoginCredentials, RegisterData, UpdateProfileData, KycDocument } from '../../domain/entities/User';

const KYC_STATUS_CACHE_KEY = 'kyc_my_status_cache_v1';

export class AuthApiClient extends BaseApiClient {
  private normalizeUploadPart(file: { uri: string; name: string; type: string }, fallbackPrefix: string) {
    const rawUri = String(file?.uri || '').trim();
    const uriFileName = rawUri.split('/').pop()?.split('?')[0] || '';
    const name = String(file?.name || '').trim() || uriFileName || `${fallbackPrefix}_${Date.now()}.jpg`;
    const type = String(file?.type || '').trim() || 'image/jpeg';
    return { uri: rawUri, name, type };
  }
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

  /**
   * Get public user profile by user id
   */
  async getUserById(id: string): Promise<{ success: boolean; data?: any; message?: string }> {
    return this.get(ENDPOINTS.USERS.DETAIL(id));
  }

  async uploadAvatar(file: {
    uri: string;
    name?: string;
    type?: string;
  }): Promise<{ success: boolean; message?: string; data?: any; avatarUrl?: string }> {
    const formData = new FormData();
    const avatar = this.normalizeUploadPart(
      {
        uri: file.uri,
        name: file.name || '',
        type: file.type || '',
      },
      'avatar',
    );
    formData.append('avatar', avatar as any);
    return this.upload(ENDPOINTS.USERS.AVATAR, formData, 'PUT');
  }

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
    idCardFront: { uri: string; name: string; type: string };
    selfie: { uri: string; name: string; type: string };
  }): Promise<{ success: boolean; message?: string; data?: any }> {
    const formData = new FormData();
    const idCardFront = this.normalizeUploadPart(data.idCardFront, 'id_card_front');
    const selfie = this.normalizeUploadPart(data.selfie, 'selfie');
    formData.append('idCardFront', idCardFront as any);
    formData.append('selfie', selfie as any);
    return this.upload(ENDPOINTS.KYC.SUBMIT, formData);
  }

  /**
   * Get current KYC status
   */
  async getKYCStatus(): Promise<{ success: boolean; data?: any; message?: string }> {
    const url = `${this.baseURL}${ENDPOINTS.KYC.MY_STATUS}`;
    const headers = await this.getHeaders();

    const requestHeaders: Record<string, string> = {
      ...headers,
      // Ask intermediaries to revalidate so FE can decide how to handle 304 safely.
      'Cache-Control': 'no-cache',
      Pragma: 'no-cache',
    };

    const readCached = async (): Promise<any | null> => {
      try {
        const raw = await AsyncStorage.getItem(KYC_STATUS_CACHE_KEY);
        return raw ? JSON.parse(raw) : null;
      } catch {
        return null;
      }
    };

    const writeCached = async (data: any): Promise<void> => {
      try {
        await AsyncStorage.setItem(KYC_STATUS_CACHE_KEY, JSON.stringify(data));
      } catch {
        // Ignore cache write failures.
      }
    };

    const parseJsonSafe = async (response: Response): Promise<any | null> => {
      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) return null;
      try {
        return await response.json();
      } catch {
        return null;
      }
    };

    try {
      let response = await fetch(url, {
        method: 'GET',
        headers: requestHeaders,
      });

      // 304 is valid for GET with revalidation. Use cached snapshot if available.
      if (response.status === 304) {
        const cached = await readCached();
        if (cached) {
          return {
            success: true,
            data: cached,
            message: 'KYC status loaded from cache',
          };
        }

        // No local cache yet: force a cache-busted fetch to guarantee a body.
        response = await fetch(`${url}?_t=${Date.now()}`, {
          method: 'GET',
          headers: requestHeaders,
        });
      }

      if (!response.ok) {
        await this.handleErrorResponse(response);
      }

      const payload = await parseJsonSafe(response);
      if (!payload) {
        const cached = await readCached();
        if (cached) {
          return {
            success: true,
            data: cached,
            message: 'KYC status loaded from cache',
          };
        }

        return {
          success: false,
          message: 'Không thể đọc dữ liệu trạng thái KYC',
        };
      }

      if (payload.success && payload.data) {
        await writeCached(payload.data);
      }

      return payload;
    } catch (error) {
      const cached = await readCached();
      if (cached) {
        return {
          success: true,
          data: cached,
          message: 'Tạm dùng dữ liệu KYC đã lưu',
        };
      }

      return {
        success: false,
        message: error instanceof Error ? error.message : 'Không thể lấy trạng thái KYC',
      };
    }
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