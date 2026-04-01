import { AuthRepository } from '../../domain/repositories/AuthRepository';
import { User, LoginCredentials, RegisterData, UpdateProfileData, KycDocument } from '../../domain/entities/User';
import { ApiResponse } from '../../domain/entities/Common';
import { AuthApiClient } from '../apis/AuthApiClient';
import { UserModel } from '../models/UserModel';

export class AuthRepositoryImpl implements AuthRepository {
  constructor(private authApiClient: AuthApiClient) {}

  async register(data: RegisterData): Promise<ApiResponse> {
    try {
      const response = await this.authApiClient.register(data);
      return {
        success: response.success,
        message: response.message
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Registration failed'
      };
    }
  }

  async login(credentials: LoginCredentials): Promise<ApiResponse<{ accessToken: string; refreshToken: string; user: User }>> {
    try {
      const response = await this.authApiClient.login(credentials);
      
      if (response.success && response.user) {
        const user = this.mapUserModelToEntity(response.user);
        return {
          success: true,
          data: {
            accessToken: response.accessToken,
            refreshToken: response.refreshToken,
            user
          },
          message: 'Login successful'
        };
      }
      
      return {
        success: false,
        message: response.message || 'Login failed'
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Login failed'
      };
    }
  }

  async googleLogin(googleToken: string): Promise<ApiResponse<{ accessToken: string; refreshToken: string; user: User }>> {
    try {
      const response = await this.authApiClient.googleLogin(googleToken);
      
      if (response.success && response.user) {
        const user = this.mapUserModelToEntity(response.user);
        return {
          success: true,
          data: {
            accessToken: response.accessToken,
            refreshToken: response.refreshToken,
            user
          },
          message: 'Google login successful'
        };
      }
      
      return {
        success: false,
        message: response.message || 'Google login failed'
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Google login failed'
      };
    }
  }

  async logout(): Promise<void> {
    await this.authApiClient.logout();
  }

  async verifyEmail(email: string, code: string): Promise<ApiResponse<{ accessToken?: string; refreshToken?: string; user?: User }>> {
    try {
      const response = await this.authApiClient.verifyEmail(email, code);
      
      if (response.success) {
        const user = response.user ? this.mapUserModelToEntity(response.user) : undefined;
        return {
          success: true,
          data: {
            accessToken: response.accessToken,
            refreshToken: response.refreshToken,
            user
          },
          message: response.message
        };
      }
      
      return {
        success: false,
        message: response.message || 'Email verification failed'
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Email verification failed'
      };
    }
  }

  async resendVerificationCode(email: string): Promise<ApiResponse> {
    try {
      const response = await this.authApiClient.resendVerificationCode(email);
      return response;
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to resend verification code'
      };
    }
  }

  async forgotPassword(email: string): Promise<ApiResponse> {
    try {
      const response = await this.authApiClient.forgotPassword(email);
      return response;
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to send reset password email'
      };
    }
  }

  async resetPassword(email: string, code: string, newPassword: string): Promise<ApiResponse> {
    try {
      const response = await this.authApiClient.resetPassword(email, code, newPassword);
      return response;
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Password reset failed'
      };
    }
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<ApiResponse> {
    try {
      const response = await this.authApiClient.changePassword(currentPassword, newPassword);
      return response;
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Password change failed'
      };
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const response = await this.authApiClient.getCurrentUser();
      
      if (response.success && response.user) {
        return this.mapUserModelToEntity(response.user);
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }

  async updateProfile(data: UpdateProfileData): Promise<ApiResponse<User>> {
    try {
      const response = await this.authApiClient.updateProfile(data);
      
      if (response.success) {
        const user = this.mapUserModelToEntity(response.user);
        return {
          success: true,
          data: user,
          message: 'Profile updated successfully'
        };
      }
      
      return {
        success: false,
        message: 'Profile update failed'
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Profile update failed'
      };
    }
  }

  async submitKYC(document: KycDocument): Promise<ApiResponse> {
    try {
      const response = await this.authApiClient.uploadKYC(document);
      return response;
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'KYC submission failed'
      };
    }
  }

  async getKYCStatus(): Promise<ApiResponse<{ status: string; documents: any[] }>> {
    try {
      const response = await this.authApiClient.getKYCStatus();
      if (response.success) {
        return {
          success: true,
          data: {
            status: response.data?.status || 'NOT_SUBMITTED',
            documents: response.data?.documents || [],
          },
          message: response.message || 'KYC status retrieved',
        };
      }

      return {
        success: false,
        message: response.message || 'Không thể lấy trạng thái KYC',
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Không thể lấy trạng thái KYC',
      };
    }
  }

  // =========================================================================
  // TOKEN MANAGEMENT - Delegates to AuthApiClient (BaseApiClient)
  // =========================================================================

  async getStoredToken(): Promise<string | null> {
    return this.authApiClient.getStoredAccessToken();
  }

  async setStoredTokens(accessToken: string, refreshToken?: string): Promise<void> {
    await this.authApiClient.setStoredTokens(accessToken, refreshToken);
  }

  async clearStoredTokens(): Promise<void> {
    await this.authApiClient.clearStoredTokens();
  }

  async refreshToken(): Promise<ApiResponse<{ accessToken: string }>> {
    try {
      const response = await this.authApiClient.refreshToken();
      
      if (response.success && response.accessToken) {
        return {
          success: true,
          data: { accessToken: response.accessToken },
          message: 'Token refreshed'
        };
      }
      
      return {
        success: false,
        message: 'Token refresh failed'
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Token refresh failed'
      };
    }
  }

  async registerPushToken(pushToken: string): Promise<ApiResponse> {
    try {
      const response = await this.authApiClient.registerPushToken(pushToken);
      return response;
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Push token registration failed'
      };
    }
  }

  async unregisterPushToken(): Promise<ApiResponse> {
    // TODO: Implement when BE endpoint is available
    return {
      success: true,
      message: 'Push token unregistered'
    };
  }

  /**
   * Map UserModel to User entity
   */
  private mapUserModelToEntity(model: UserModel): User {
    return {
      _id: model._id ?? model.id ?? '',
      email: model.email,
      fullName: model.fullName,
      avatar: model.avatar,
      phone: model.phone,
      role: model.role as any,
      emailVerified: model.emailVerified,
      kycStatus: model.kycStatus as any,
      address: model.address,
      bodyMeasurements: model.bodyMeasurements,
      wallet: model.wallet,
      reputation: model.reputation,
      subscription: model.subscription ? {
        plan: model.subscription.plan,
        expiresAt: new Date(model.subscription.expiresAt),
        isActive: model.subscription.isActive
      } : undefined,
      googleId: model.googleId,
      facebookId: model.facebookId,
      createdAt: new Date(model.createdAt),
      updatedAt: new Date(model.updatedAt)
    };
  }
}