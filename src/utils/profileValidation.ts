/**
 * Profile validation utilities
 * Check if user profile is complete before critical actions
 */
import { User } from '../domain/entities/User';

export interface ProfileCompletenessResult {
  isComplete: boolean;
  missingFields: string[];
  message?: string;
}

/**
 * Check if user profile has all required fields
 * Required: fullName, phone, address (street, city)
 */
export const checkProfileCompleteness = (user: User | null): ProfileCompletenessResult => {
  if (!user) {
    return {
      isComplete: false,
      missingFields: ['user'],
      message: 'Vui lòng đăng nhập để tiếp tục',
    };
  }

  const missingFields: string[] = [];

  // Check fullName
  if (!user.fullName || user.fullName.trim() === '') {
    missingFields.push('Họ và tên');
  }

  // Check phone
  if (!user.phone || user.phone.trim() === '') {
    missingFields.push('Số điện thoại');
  }

  // Check address
  if (!user.address || !user.address.street || user.address.street.trim() === '') {
    missingFields.push('Địa chỉ (Đường/Số nhà)');
  }

  if (!user.address || !user.address.city || user.address.city.trim() === '') {
    missingFields.push('Thành phố');
  }

  const isComplete = missingFields.length === 0;

  return {
    isComplete,
    missingFields,
    message: isComplete
      ? undefined
      : `Vui lòng cập nhật đầy đủ thông tin hồ sơ trước khi tiếp tục.\n\nThông tin còn thiếu: ${missingFields.join(', ')}`,
  };
};

/**
 * Get user-friendly message for missing profile fields
 */
export const getProfileIncompleteMessage = (missingFields: string[]): string => {
  if (missingFields.length === 0) {
    return '';
  }

  return `Để tiếp tục, bạn cần cập nhật thông tin sau:\n\n${missingFields.map((field, idx) => `${idx + 1}. ${field}`).join('\n')}\n\nVui lòng vào "Chỉnh sửa hồ sơ" để cập nhật.`;
};
