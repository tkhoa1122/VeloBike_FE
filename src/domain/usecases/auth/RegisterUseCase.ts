import { AuthRepository } from '../../repositories/AuthRepository';
import { RegisterData } from '../../entities/User';
import { ApiResponse } from '../../entities/Common';

export class RegisterUseCase {
  constructor(private authRepository: AuthRepository) {}

  async execute(data: RegisterData): Promise<ApiResponse> {
    // Validation
    const validation = this.validateRegistrationData(data);
    if (!validation.isValid) {
      return {
        success: false,
        message: validation.message!,
      };
    }

    try {
      return await this.authRepository.register(data);
    } catch (error) {
      return {
        success: false,
        message: 'Đăng ký thất bại. Vui lòng thử lại.',
      };
    }
  }

  private validateRegistrationData(data: RegisterData): {
    isValid: boolean;
    message?: string;
  } {
    // Required fields
    if (!data.email || !data.password || !data.fullName) {
      return {
        isValid: false,
        message: 'Vui lòng điền đầy đủ thông tin',
      };
    }

    // Email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      return {
        isValid: false,
        message: 'Email không đúng định dạng',
      };
    }

    // Password strength
    if (data.password.length < 8) {
      return {
        isValid: false,
        message: 'Mật khẩu phải có ít nhất 8 ký tự',
      };
    }

    // Check password complexity
    const hasUpperCase = /[A-Z]/.test(data.password);
    const hasLowerCase = /[a-z]/.test(data.password);
    const hasNumbers = /\d/.test(data.password);
    
    if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
      return {
        isValid: false,
        message: 'Mật khẩu phải có ít nhất 1 chữ hoa, 1 chữ thường và 1 số',
      };
    }

    // Full name validation
    if (data.fullName.trim().length < 2) {
      return {
        isValid: false,
        message: 'Họ tên phải có ít nhất 2 ký tự',
      };
    }

    return { isValid: true };
  }
}