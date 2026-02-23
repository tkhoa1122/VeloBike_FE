/**
 * App Constants
 */

export const APP_CONFIG = {
  APP_NAME: 'VeloBike',
  VERSION: '1.0.0',
  CURRENCY: 'VND',
  DEFAULT_LANGUAGE: 'vi',
  
  // Pagination
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 50,
  
  // File upload limits
  MAX_IMAGE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_VIDEO_SIZE: 100 * 1024 * 1024, // 100MB
  MAX_IMAGES_PER_LISTING: 20,
  MAX_360_IMAGES: 72,
  
  // Search
  SEARCH_DEBOUNCE_MS: 300,
  NEARBY_RADIUS_KM: 50,
  
  // Cache TTL (Time To Live)
  CACHE_TTL: {
    LISTINGS: 5 * 60 * 1000,      // 5 minutes
    USER_PROFILE: 10 * 60 * 1000, // 10 minutes
    BRANDS: 60 * 60 * 1000,       // 1 hour
  },
} as const;

// Bike related constants
export const BIKE_TYPES = [
  'ROAD',
  'MTB', 
  'GRAVEL',
  'TRIATHLON',
  'E_BIKE',
] as const;
export type BikeType = typeof BIKE_TYPES[number];

export const BIKE_CONDITIONS = [
  'NEW',
  'LIKE_NEW', 
  'GOOD',
  'FAIR',
  'PARTS',
] as const;
export type BikeCondition = typeof BIKE_CONDITIONS[number];

export const BIKE_SIZES = [
  'XS', 'S', 'M', 'L', 'XL', 'XXL',
  '48cm', '50cm', '52cm', '54cm', '56cm', '58cm', '60cm', '62cm'
] as const;
export type BikeSize = typeof BIKE_SIZES[number];

// User roles
export const USER_ROLES = [
  'GUEST',
  'BUYER', 
  'SELLER',
  'INSPECTOR',
  'ADMIN',
] as const;
export type UserRole = typeof USER_ROLES[number];

// KYC Status
export const KYC_STATUS = [
  'NOT_SUBMITTED',
  'PENDING',
  'VERIFIED',
  'REJECTED',
] as const;
export type KycStatus = typeof KYC_STATUS[number];

// Order Status
export const ORDER_STATUS = [
  'CREATED',
  'ESCROW_LOCKED',
  'IN_INSPECTION',
  'INSPECTION_PASSED',
  'INSPECTION_FAILED', 
  'SHIPPING',
  'DELIVERED',
  'COMPLETED',
  'CANCELLED',
  'DISPUTED',
] as const;
export type OrderStatus = typeof ORDER_STATUS[number];

// Listing Status  
export const LISTING_STATUS = [
  'DRAFT',
  'PUBLISHED',
  'SOLD',
  'SUSPENDED',
  'EXPIRED',
] as const;
export type ListingStatus = typeof LISTING_STATUS[number];

// Payment Status
export const PAYMENT_STATUS = [
  'PENDING',
  'COMPLETED',
  'FAILED',
  'CANCELLED',
] as const;
export type PaymentStatus = typeof PAYMENT_STATUS[number];

// Subscription Plans
export const SUBSCRIPTION_PLANS = [
  'FREE',
  'PREMIUM',
] as const;
export type SubscriptionPlanType = typeof SUBSCRIPTION_PLANS[number];

// Notification Types
export const NOTIFICATION_TYPES = [
  'NEW_MESSAGE',
  'ORDER_UPDATE',
  'LISTING_UPDATE', 
  'PAYMENT_RECEIVED',
  'INSPECTION_SCHEDULED',
  'REVIEW_RECEIVED',
  'PRICE_ALERT',
] as const;
export type NotificationType = typeof NOTIFICATION_TYPES[number];

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Không thể kết nối đến máy chủ',
  INVALID_CREDENTIALS: 'Email hoặc mật khẩu không chính xác',
  TOKEN_EXPIRED: 'Phiên đăng nhập đã hết hạn',
  PERMISSION_DENIED: 'Bạn không có quyền thực hiện thao tác này',
  VALIDATION_ERROR: 'Dữ liệu không hợp lệ',
  SERVER_ERROR: 'Lỗi máy chủ, vui lòng thử lại sau',
  FILE_TOO_LARGE: 'File quá lớn',
  UNSUPPORTED_FILE_TYPE: 'Loại file không được hỗ trợ',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  REGISTER_SUCCESS: 'Đăng ký thành công! Vui lòng kiểm tra email để xác thực.',
  LOGIN_SUCCESS: 'Đăng nhập thành công',
  LOGOUT_SUCCESS: 'Đăng xuất thành công',
  PROFILE_UPDATED: 'Cập nhật hồ sơ thành công', 
  LISTING_CREATED: 'Đăng tin thành công',
  ORDER_CREATED: 'Đặt hàng thành công',
  PAYMENT_SUCCESS: 'Thanh toán thành công',
  REVIEW_SUBMITTED: 'Gửi đánh giá thành công',
} as const;

// Vietnamese specific
export const VN_PROVINCES = [
  'An Giang', 'Bà Rịa - Vũng Tàu', 'Bắc Giang', 'Bắc Kạn', 'Bạc Liêu',
  'Bắc Ninh', 'Bến Tre', 'Bình Định', 'Bình Dương', 'Bình Phước',
  'Bình Thuận', 'Cà Mau', 'Cao Bằng', 'Đắk Lắk', 'Đắk Nông',
  'Điện Biên', 'Đồng Nai', 'Đồng Tháp', 'Gia Lai', 'Hà Giang',
  'Hà Nam', 'Hà Tĩnh', 'Hải Dương', 'Hậu Giang', 'Hòa Bình',
  'Hưng Yên', 'Khánh Hòa', 'Kiên Giang', 'Kon Tum', 'Lai Châu',
  'Lâm Đồng', 'Lạng Sơn', 'Lào Cai', 'Long An', 'Nam Định',
  'Nghệ An', 'Ninh Bình', 'Ninh Thuận', 'Phú Thọ', 'Phú Yên',
  'Quảng Bình', 'Quảng Nam', 'Quảng Ngãi', 'Quảng Ninh', 'Quảng Trị',
  'Sóc Trăng', 'Sơn La', 'Tây Ninh', 'Thái Bình', 'Thái Nguyên',
  'Thanh Hóa', 'Thừa Thiên Huế', 'Tiền Giang', 'Trà Vinh', 'Tuyên Quang',
  'Vĩnh Long', 'Vĩnh Phúc', 'Yên Bái',
  // Cities
  'Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ',
] as const;

export const POPULAR_BIKE_BRANDS = [
  'Trek', 'Giant', 'Specialized', 'Cannondale', 'Scott', 'Bianchi',
  'Pinarello', 'Cervelo', 'Merida', 'Fuji', 'Santa Cruz', 'Orbea',
  'Canyon', 'BMC', 'Cube', 'Focus', 'Felt', 'Ridley', 'Look', 'Time',
  'Thăng Long', 'Asama', 'Fornix', 'Fascino', 'Momentum',
] as const;