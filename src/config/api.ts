/**
 * API Configuration
 */
import { ENV } from './environment';

export const API_CONFIG = {
  BASE_URL: ENV.API_BASE_URL,
  
  TIMEOUT: 30000, // 30 seconds
  
  // Rate limiting info for client-side handling
  RATE_LIMITS: {
    GENERAL: { requests: 100, window: 15 * 60 * 1000 }, // 100 req/15min
    AUTH: { requests: 10, window: 15 * 60 * 1000 },     // 10 req/15min
    PAYMENT: { requests: 5, window: 15 * 60 * 1000 },   // 5 req/15min
    UPLOAD: { requests: 20, window: 15 * 60 * 1000 },   // 20 req/15min
  }
} as const;

export const ENDPOINTS = {
  // Auth
  AUTH: {
    REGISTER: '/auth/register',
    LOGIN: '/auth/login',
    GOOGLE_LOGIN: '/auth/google',
    REFRESH_TOKEN: '/auth/refresh-token',
    VERIFY_EMAIL: '/auth/verify-email',
    ME: '/auth/me',
    PROFILE: '/auth/profile',
    // UPLOAD_AVATAR: '/auth/upload-avatar', // TODO: BE chưa có route
    CHANGE_PASSWORD: '/auth/change-password',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    KYC_UPLOAD: '/auth/kyc-upload',
    LOGOUT: '/auth/logout',
    RESEND_VERIFICATION: '/auth/resend-verification',
    PUSH_TOKEN: '/auth/push-token',
  },
  
  // Listings
  LISTINGS: {
    LIST: '/listings',
    DETAIL: (id: string) => `/listings/${id}`,
    CREATE: '/listings',
    UPDATE: (id: string) => `/listings/${id}`,
    DELETE: (id: string) => `/listings/${id}`,
    MY_LISTINGS: '/listings/my-listings',
    FEATURED: '/listings/featured',
    BOOST: (id: string) => `/listings/${id}/boost`,
    NEARBY: '/listings/nearby',
  },
  
  // Orders
  ORDERS: {
    CREATE: '/orders',
    DETAIL: (id: string) => `/orders/${id}`,
    MY_ORDERS: '/orders/my-orders',
    TRANSITION: (id: string) => `/orders/${id}/transition`,
  },
  
  // Payment & Wallet
  PAYMENT: {
    CREATE_LINK: '/payment/create-link',
    WEBHOOK: '/payment/webhook',
  },
  WALLET: {
    WITHDRAW: '/wallet/withdraw',
    WITHDRAWALS: '/wallet/withdrawals',
  },
  
  // Messaging
  MESSAGES: {
    CONVERSATION: (userId: string) => `/messages/conversation/${userId}`,
    SEND: '/messages',
    LIST: (conversationId: string) => `/messages/list/${conversationId}`,
    CONVERSATIONS: '/messages/conversations',
    MARK_READ: (messageId: string) => `/messages/${messageId}/read`,
  },
  
  // Wishlist
  WISHLIST: {
    ADD: '/wishlist',
    LIST: '/wishlist',
    CHECK: (listingId: string) => `/wishlist/check/${listingId}`,
    REMOVE: (listingId: string) => `/wishlist/${listingId}`,
    COUNT: '/wishlist/count',
    CLEAR: '/wishlist/clear',
  },
  
  // Upload
  UPLOAD: {
    SINGLE: '/upload',
    SPIN_360: '/upload/360',
    MY_IMAGES: '/upload/my-images',
    DELETE: (publicId: string) => `/upload/${publicId}`,
  },
  
  // Other endpoints...
  REVIEWS: '/reviews',
  NOTIFICATIONS: {
    LIST: '/notifications',
    MARK_READ: (id: string) => `/notifications/${id}/read`,
    MARK_ALL_READ: '/notifications/read-all',
  },
  ANALYTICS: {
    SELLER: '/analytics/seller/dashboard',
    PERFORMANCE: '/analytics/seller/performance',
    LISTING: (id: string) => `/analytics/listing/${id}`,
  },
  SUBSCRIPTIONS: {
    PLANS: '/subscriptions/plans',
    MY_SUBSCRIPTION: '/subscriptions/my-subscription',
    CHECK_QUOTA: '/subscriptions/check-quota',
    SUBSCRIBE: '/subscriptions/subscribe',
  },
  CHATBOT: {
    MESSAGE: '/chatbot/webhook',
    HISTORY: '/chatbot/history',
  },
  INSPECTIONS: '/inspections',
  LOGISTICS: {
    CALCULATE_SHIPPING: '/logistics/calculate-shipping',
    CREATE_SHIPPING: '/logistics/create-shipping',
    TRACK: (trackingNumber: string) => `/logistics/track/${trackingNumber}`,
  },
  DISPUTES: '/disputes',
  ALERTS: '/alerts',
} as const;

export const SOCKET_EVENTS = {
  // Listen events
  MESSAGE: 'message',
  ORDER_UPDATE: 'orderUpdate', 
  NOTIFICATION: 'notification',
  USER_ONLINE: 'userOnline',
  USER_OFFLINE: 'userOffline',
  
  // Emit events
  JOIN_CONVERSATION: 'joinConversation',
  JOIN_ORDER: 'joinOrder',
  TYPING: 'typing',
  ONLINE: 'online',
} as const;