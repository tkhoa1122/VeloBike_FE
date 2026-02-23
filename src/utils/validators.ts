/**
 * Validation utility functions
 */

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate Vietnamese phone number
 */
export const isValidPhoneNumber = (phone: string): boolean => {
  const cleaned = phone.replace(/\D/g, '');
  
  // Vietnamese phone patterns
  const patterns = [
    /^0\d{9}$/, // 0xxxxxxxxx (10 digits)
    /^84\d{9}$/, // 84xxxxxxxxx (11 digits)
  ];
  
  return patterns.some(pattern => pattern.test(cleaned));
};

/**
 * Validate password strength
 */
export const validatePassword = (password: string): {
  isValid: boolean;
  errors: string[];
  strength: 'weak' | 'medium' | 'strong';
} => {
  const errors: string[] = [];
  let strength: 'weak' | 'medium' | 'strong' = 'weak';
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  // Determine strength
  if (errors.length === 0) {
    if (password.length >= 12) {
      strength = 'strong';
    } else if (password.length >= 10) {
      strength = 'medium';
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    strength
  };
};

/**
 * Validate price
 */
export const isValidPrice = (price: number): boolean => {
  return price > 0 && price <= 1000000000; // Max 1 billion VND
};

/**
 * Validate bike year
 */
export const isValidBikeYear = (year: number): boolean => {
  const currentYear = new Date().getFullYear();
  return year >= 1990 && year <= currentYear + 1;
};

/**
 * Validate file size
 */
export const isValidFileSize = (file: File, maxSizeMB: number): boolean => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
};

/**
 * Validate image file type
 */
export const isValidImageType = (file: File): boolean => {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  return validTypes.includes(file.type);
};

/**
 * Validate video file type
 */
export const isValidVideoType = (file: File): boolean => {
  const validTypes = ['video/mp4', 'video/webm', 'video/ogg'];
  return validTypes.includes(file.type);
};

/**
 * Validate URL format
 */
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Validate latitude longitude
 */
export const isValidCoordinates = (lat: number, lng: number): boolean => {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
};

/**
 * Validate Vietnamese ID card number
 */
export const isValidIdCard = (idCard: string): boolean => {
  const cleaned = idCard.replace(/\D/g, '');
  
  // Old format: 9 digits
  // New format: 12 digits
  return cleaned.length === 9 || cleaned.length === 12;
};

/**
 * Validate listing title
 */
export const validateListingTitle = (title: string): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];
  
  if (!title.trim()) {
    errors.push('Tiêu đề là bắt buộc');
  } else if (title.length < 10) {
    errors.push('Tiêu đề phải có ít nhất 10 ký tự');
  } else if (title.length > 100) {
    errors.push('Tiêu đề không được quá 100 ký tự');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate listing description
 */
export const validateListingDescription = (description: string): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];
  
  if (!description.trim()) {
    errors.push('Mô tả là bắt buộc');
  } else if (description.length < 50) {
    errors.push('Mô tả phải có ít nhất 50 ký tự');
  } else if (description.length > 2000) {
    errors.push('Mô tả không được quá 2000 ký tự');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate bank account number
 */
export const isValidBankAccount = (accountNumber: string): boolean => {
  const cleaned = accountNumber.replace(/\D/g, '');
  return cleaned.length >= 6 && cleaned.length <= 20;
};

/**
 * Sanitize HTML content
 */
export const sanitizeHtml = (html: string): string => {
  // Basic HTML sanitization - remove script tags and attributes
  return html
    .replace(/<script[^>]*>[^<]*<\/script>/gi, '')
    .replace(/<iframe[^>]*>[^<]*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/on\w+='[^']*'/gi, '');
};

/**
 * Check if string contains only Vietnamese characters and common symbols
 */
export const isVietnameseText = (text: string): boolean => {
  const vietnameseRegex = /^[a-zA-ZÀ-ỹ\s\d.,!?()\-]+$/;
  return vietnameseRegex.test(text);
};

/**
 * Validate positive number
 */
export const isPositiveNumber = (value: number): boolean => {
  return !isNaN(value) && value > 0;
};

/**
 * Validate integer
 */
export const isInteger = (value: number): boolean => {
  return Number.isInteger(value);
};