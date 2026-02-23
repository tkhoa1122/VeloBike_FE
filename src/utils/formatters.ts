/**
 * Utility functions for formatting data
 */

/**
 * Format currency (Vietnamese Dong)
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
};

/**
 * Format currency without symbol
 */
export const formatNumber = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN').format(amount);
};

/**
 * Format price range
 */
export const formatPriceRange = (min: number, max: number): string => {
  return `${formatCurrency(min)} - ${formatCurrency(max)}`;
};

/**
 * Format date in Vietnamese
 */
export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
};

/**
 * Format datetime in Vietnamese
 */
export const formatDateTime = (date: Date): string => {
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

/**
 * Format relative time (e.g., "2 giờ trước")
 */
export const formatRelativeTime = (date: Date): string => {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);
  const diffInMonths = Math.floor(diffInDays / 30);
  const diffInYears = Math.floor(diffInDays / 365);

  if (diffInMinutes < 1) {
    return 'Vừa xong';
  }
  if (diffInMinutes < 60) {
    return `${diffInMinutes} phút trước`;
  }
  if (diffInHours < 24) {
    return `${diffInHours} giờ trước`;
  }
  if (diffInDays < 30) {
    return `${diffInDays} ngày trước`;
  }
  if (diffInMonths < 12) {
    return `${diffInMonths} tháng trước`;
  }
  return `${diffInYears} năm trước`;
};

/**
 * Format file size
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Format phone number (Vietnamese format)
 */
export const formatPhoneNumber = (phone: string): string => {
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Check if it's a Vietnamese phone number
  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3');
  }
  if (cleaned.length === 11 && cleaned.startsWith('84')) {
    return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{3})/, '+$1 $2 $3 $4');
  }
  
  return phone; // Return original if doesn't match pattern
};

/**
 * Format distance
 */
export const formatDistance = (meters: number): string => {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
};

/**
 * Format bike condition for display
 */
export const formatBikeCondition = (condition: string): string => {
  const conditions = {
    'NEW': 'Mới',
    'LIKE_NEW': 'Như mới',
    'GOOD': 'Tốt',
    'FAIR': 'Khá',
    'PARTS': 'Phụ tung'
  };
  return conditions[condition as keyof typeof conditions] || condition;
};

/**
 * Format bike type for display
 */
export const formatBikeType = (type: string): string => {
  const types = {
    'ROAD': 'Xe đua',
    'MTB': 'Xe địa hình',
    'GRAVEL': 'Xe gravel',
    'TRIATHLON': 'Xe triathlon',
    'E_BIKE': 'Xe điện'
  };
  return types[type as keyof typeof types] || type;
};

/**
 * Format user role for display
 */
export const formatUserRole = (role: string): string => {
  const roles = {
    'GUEST': 'Khách',
    'BUYER': 'Người mua',
    'SELLER': 'Người bán',
    'INSPECTOR': 'Kiểm định viên',
    'ADMIN': 'Quản trị viên'
  };
  return roles[role as keyof typeof roles] || role;
};

/**
 * Format order status for display
 */
export const formatOrderStatus = (status: string): string => {
  const statuses = {
    'CREATED': 'Đã tạo',
    'ESCROW_LOCKED': 'Đã thanh toán',
    'IN_INSPECTION': 'Đang kiểm định',
    'INSPECTION_PASSED': 'Kiểm định đạt',
    'INSPECTION_FAILED': 'Kiểm định không đạt',
    'SHIPPING': 'Đang vận chuyển',
    'DELIVERED': 'Đã giao',
    'COMPLETED': 'Hoàn thành',
    'CANCELLED': 'Đã hủy',
    'DISPUTED': 'Đang tranh chấp'
  };
  return statuses[status as keyof typeof statuses] || status;
};

/**
 * Truncate text with ellipsis
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength) + '...';
};

/**
 * Format percentage
 */
export const formatPercentage = (value: number): string => {
  return `${(value * 100).toFixed(1)}%`;
};

/**
 * Format review rating
 */
export const formatRating = (rating: number): string => {
  return `${rating.toFixed(1)} ⭐`;
};

/**
 * Format weight
 */
export const formatWeight = (kg: number): string => {
  return `${kg} kg`;
};

/**
 * Format dimension
 */
export const formatDimension = (value: number, unit: string = 'cm'): string => {
  return `${value} ${unit}`;
};