/**
 * Image Processing Utilities
 * Handles image optimization, validation, and compression
 */

import { Platform } from 'react-native';

export interface ImageDimensions {
  width: number;
  height: number;
}

export interface ImageValidationResult {
  valid: boolean;
  errors: string[];
}

// Supported image formats
export const SUPPORTED_IMAGE_FORMATS = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
export const SUPPORTED_VIDEO_FORMATS = ['video/mp4', 'video/quicktime'];

// Validation constraints - optimized for production
export const IMAGE_CONSTRAINTS = {
  MAX_FILE_SIZE: 100 * 1024 * 1024, // 100MB
  MAX_IMAGE_SIZE: 100 * 1024 * 1024, // 100MB for images (eKYC may need large images)
  MAX_VIDEO_SIZE: 500 * 1024 * 1024, // 500MB for videos
  MIN_WIDTH: 50, // Allow small thumbnails/previews
  MIN_HEIGHT: 50,
  MAX_WIDTH: 12000, // Support high-res documents
  MAX_HEIGHT: 12000,
  ASPECT_RATIO_TOLERANCE: 0.1, // 10% tolerance for flexibility
};

/**
 * Get file size from URI
 */
export const getFileSizeFromUri = async (uri: string): Promise<number> => {
  try {
    if (Platform.OS === 'android') {
      // Android: use fetch to get headers
      const response = await fetch(uri, { method: 'HEAD' });
      const size = response.headers.get('content-length');
      return size ? parseInt(size, 10) : 0;
    } else {
      // iOS: could use native modules if needed
      return 0;
    }
  } catch (error) {
    console.warn('Error getting file size:', error);
    return 0;
  }
};

/**
 * Extract MIME type from filename
 */
export const getMimeTypeFromFilename = (filename: string): string => {
  const ext = filename.toLowerCase().split('.').pop();
  const mimeTypes: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    heic: 'image/heic',
    heif: 'image/heic',
    gif: 'image/gif',
    mp4: 'video/mp4',
    mov: 'video/quicktime',
    avi: 'video/x-msvideo',
    pdf: 'application/pdf',
  };
  return mimeTypes[ext!] || 'application/octet-stream';
};

/**
 * Check if MIME type is valid image
 */
export const isValidImageType = (mimeType: string): boolean => {
  return SUPPORTED_IMAGE_FORMATS.includes(mimeType);
};

/**
 * Check if MIME type is valid video
 */
export const isValidVideoType = (mimeType: string): boolean => {
  return SUPPORTED_VIDEO_FORMATS.includes(mimeType);
};

/**
 * Calculate aspect ratio from dimensions
 */
export const calculateAspectRatio = (width: number, height: number): number => {
  return width / height;
};

/**
 * Check if aspect ratio matches (with tolerance)
 */
export const isValidAspectRatio = (
  width: number,
  height: number,
  expectedRatio?: number,
  tolerance: number = IMAGE_CONSTRAINTS.ASPECT_RATIO_TOLERANCE
): boolean => {
  const actualRatio = calculateAspectRatio(width, height);

  // If no expected ratio provided, just accept any reasonable ratio
  if (!expectedRatio) {
    // Avoid extremely wide/tall images
    return actualRatio >= 0.2 && actualRatio <= 5;
  }

  // Check if actual ratio is within tolerance of expected
  const diff = Math.abs(actualRatio - expectedRatio) / expectedRatio;
  return diff <= tolerance;
};

/**
 * Format file size for display
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Validate image dimensions
 */
export const validateImageDimensions = (
  width: number,
  height: number,
  minWidth = IMAGE_CONSTRAINTS.MIN_WIDTH,
  minHeight = IMAGE_CONSTRAINTS.MIN_HEIGHT,
  maxWidth = IMAGE_CONSTRAINTS.MAX_WIDTH,
  maxHeight = IMAGE_CONSTRAINTS.MAX_HEIGHT
): ImageValidationResult => {
  const errors: string[] = [];

  if (width < minWidth || height < minHeight) {
    errors.push(
      `Kích thước ảnh tối thiểu: ${minWidth}x${minHeight}px, hiện tại: ${width}x${height}px`
    );
  }

  if (width > maxWidth || height > maxHeight) {
    errors.push(
      `Kích thước ảnh tối đa: ${maxWidth}x${maxHeight}px, hiện tại: ${width}x${height}px`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Comprehensive file validation
 */
export const validateFile = (
  filename: string,
  mimeType: string,
  fileSize: number,
  width?: number,
  height?: number
): ImageValidationResult => {
  const errors: string[] = [];

  // Check MIME type
  if (!isValidImageType(mimeType) && !isValidVideoType(mimeType)) {
    errors.push(`Định dạng file không được hỗ trợ: ${mimeType}`);
  }

  // Check file size
  const isVideo = isValidVideoType(mimeType);
  const maxSize = isVideo
    ? IMAGE_CONSTRAINTS.MAX_VIDEO_SIZE
    : IMAGE_CONSTRAINTS.MAX_IMAGE_SIZE;

  if (fileSize > maxSize) {
    errors.push(
      `Kích thước file quá lớn: ${formatFileSize(fileSize)}, tối đa: ${formatFileSize(maxSize)}`
    );
  }

  if (fileSize === 0) {
    errors.push('File trống hoặc không hợp lệ');
  }

  // Check image dimensions if provided
  if (width && height && isValidImageType(mimeType)) {
    const dimensionValidation = validateImageDimensions(width, height);
    if (!dimensionValidation.valid) {
      errors.push(...dimensionValidation.errors);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Calculate new dimensions for image scaling (maintains aspect ratio)
 */
export const calculateScaledDimensions = (
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): ImageDimensions => {
  let width = originalWidth;
  let height = originalHeight;

  if (width > maxWidth) {
    const ratio = maxWidth / width;
    width = maxWidth;
    height = height * ratio;
  }

  if (height > maxHeight) {
    const ratio = maxHeight / height;
    height = maxHeight;
    width = width * ratio;
  }

  return {
    width: Math.round(width),
    height: Math.round(height),
  };
};

/**
 * Sanitize filename
 */
export const sanitizeFilename = (filename: string): string => {
  // Remove path separators and invalid characters
  let sanitized = filename.replace(/[^a-zA-Z0-9._-]/g, '_');

  // Limit length
  if (sanitized.length > 255) {
    const ext = sanitized.split('.').pop();
    sanitized = sanitized.substring(0, 250 - (ext?.length || 0)) + '.' + ext;
  }

  return sanitized;
};

/**
 * Generate unique filename
 */
export const generateUniqueFilename = (originalFilename: string, timestamp = Date.now()): string => {
  const ext = originalFilename.split('.').pop();
  const sanitized = originalFilename.replace(/\.[^.]+$/, ''); // Remove extension
  return `${sanitized}_${timestamp}.${ext}`;
};
