/**
 * Google Login Use Case
 */
import { User } from '../../entities/User';
import { AuthRepository } from '../../repositories/AuthRepository';
import { ApiResponse } from '../../entities/Common';

export class GoogleLoginUseCase {
  constructor(private authRepository: AuthRepository) {}

  async execute(idToken: string): Promise<ApiResponse<{ token: string; user: User }>> {
    try {
      const result = await this.authRepository.googleLogin(idToken);
      return result;
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Google login failed'
      };
    }
  }
}