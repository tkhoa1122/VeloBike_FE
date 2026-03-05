import { AuthRepository } from '../../repositories/AuthRepository';
import { ApiResponse } from '../../entities/Common';

export class ResendVerificationUseCase {
  constructor(private authRepository: AuthRepository) {}

  async execute(email: string): Promise<ApiResponse> {
    if (!email) {
      return {
        success: false,
        message: 'Email là bắt buộc',
      };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        success: false,
        message: 'Email không đúng định dạng',
      };
    }

    try {
      return await this.authRepository.resendVerificationCode(email);
    } catch (error) {
      return {
        success: false,
        message: 'Gửi lại mã xác thực thất bại. Vui lòng thử lại.',
      };
    }
  }
}
