import { AuthRepository } from '../../repositories/AuthRepository';
import { ApiResponse } from '../../entities/Common';
import { User } from '../../entities/User';

export class VerifyEmailUseCase {
  constructor(private authRepository: AuthRepository) {}

  async execute(
    email: string,
    code: string,
  ): Promise<ApiResponse<{ accessToken?: string; refreshToken?: string; user?: User }>> {
    // Validation
    if (!email || !code) {
      return {
        success: false,
        message: 'Email và mã xác thực là bắt buộc',
      };
    }

    // Code format validation (6 digits)
    if (!/^\d{6}$/.test(code)) {
      return {
        success: false,
        message: 'Mã xác thực phải là 6 chữ số',
      };
    }

    try {
      const result = await this.authRepository.verifyEmail(email, code);

      if (result.success && result.data?.accessToken) {
        // Store tokens (auto-login after verify)
        await this.authRepository.setStoredTokens(
          result.data.accessToken,
          result.data.refreshToken,
        );
      }

      return result;
    } catch (error) {
      return {
        success: false,
        message: 'Xác thực email thất bại. Vui lòng thử lại.',
      };
    }
  }
}
