/**
 * Google Login Use Case
 */
import { User } from '../../entities/User';
import { AuthRepository } from '../../repositories/AuthRepository';
import { ApiResponse } from '../../entities/Common';

export class GoogleLoginUseCase {
  constructor(private authRepository: AuthRepository) {}

  async execute(googleToken: string): Promise<ApiResponse<{ accessToken: string; refreshToken: string; user: User }>> {
    try {
      const result = await this.authRepository.googleLogin(googleToken);
      
      if (result.success && result.data) {
        // Store dual tokens (accessToken + refreshToken)
        await this.authRepository.setStoredTokens(result.data.accessToken, result.data.refreshToken);
      }
      
      return result;
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Google login failed'
      };
    }
  }
}