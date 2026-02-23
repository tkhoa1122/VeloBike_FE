import { AuthRepository } from '../../repositories/AuthRepository';
import { LoginCredentials, User } from '../../entities/User';
import { ApiResponse } from '../../entities/Common';

export class LoginUseCase {
  constructor(private authRepository: AuthRepository) {}

  async execute(credentials: LoginCredentials): Promise<ApiResponse<{ token: string; user: User }>> {
    // Validation
    if (!credentials.email || !credentials.password) {
      return {
        success: false,
        message: 'Email và mật khẩu là bắt buộc',
      };
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(credentials.email)) {
      return {
        success: false,
        message: 'Email không đúng định dạng',
      };
    }

    // Password validation
    if (credentials.password.length < 6) {
      return {
        success: false,
        message: 'Mật khẩu phải có ít nhất 6 ký tự',
      };
    }

    try {
      const result = await this.authRepository.login(credentials);
      
      if (result.success && result.data) {
        // Store token
        await this.authRepository.setStoredToken(result.data.token);
      }
      
      return result;
    } catch (error) {
      return {
        success: false,
        message: 'Đăng nhập thất bại. Vui lòng thử lại.',
      };
    }
  }
}