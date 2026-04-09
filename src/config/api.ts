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
    FACEBOOK_LOGIN: '/auth/facebook',
    REFRESH_TOKEN: '/auth/refresh-token',
    VERIFY_EMAIL: '/auth/verify-email',
    // Keep ME/PROFILE keys for backward compatibility, BE now serves user profile under /users/me
    ME: '/users/me',
    PROFILE: '/users/me',
    // UPLOAD_AVATAR: '/auth/upload-avatar', // TODO: BE chưa có route
    CHANGE_PASSWORD: '/auth/change-password',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    LOGOUT_ALL: '/auth/logout-all',
    SESSIONS: '/auth/sessions',
    KYC_SUBMIT: '/auth/kyc-submit',
    KYC_UPLOAD: '/auth/kyc-upload',
    LOGOUT: '/auth/logout',
    RESEND_VERIFICATION: '/auth/resend-verification',
    PUSH_TOKEN: '/auth/push-token',
  },

  USERS: {
    ME: '/users/me',
    AVATAR: '/users/me/avatar',
    DETAIL: (id: string) => `/users/${id}`,
    BANK: '/users/me/bank',
    ME_WALLET: '/users/me/wallet',
    UPGRADE_TO_SELLER: '/users/me/upgrade-to-seller',
  },

  KYC: {
    SUBMIT: '/kyc/submit',
    MY_STATUS: '/kyc/my-status',
    WEBHOOK: '/kyc/webhook',
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
    MY_ORDERS: '/orders',
    LIST: '/orders',
    SHIPPING_ESTIMATE: '/orders/shipping-estimate',
    TIMELINE: (id: string) => `/orders/${id}/timeline`,
    UPDATE_STATUS: (id: string) => `/orders/${id}/status`,
    UPDATE_SHIPPING_ADDRESS: (id: string) => `/orders/${id}/shipping-address`,
    ESCROW_STATUS: (id: string) => `/orders/${id}/escrow-status`,
    TRANSITION: (id: string) => `/orders/${id}/transition`,
  },
  
  // Payment & Wallet
  PAYMENT: {
    CREATE_LINK: '/payment/create-link',
    WEBHOOK: '/payment/webhook',
    INFO: (orderCode: number | string) => `/payment/info/${orderCode}`,
    SIMULATE: '/payment/simulate-payment',
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
    CREATE_PAYMENT_LINK: '/subscriptions/create-payment-link',
    SUBSCRIBE: '/subscriptions/subscribe',
    TEST_PAYMENT_SUCCESS: '/subscriptions/test-payment-success',
    WEBHOOK: '/subscriptions/webhook',
  },
  CHATBOT: {
    MESSAGE: '/chatbot/webhook',
    HISTORY: '/chatbot/history',
    QUOTA: '/chatbot/quota',
  },
  INSPECTIONS: '/inspections',
  LOGISTICS: {
    CALCULATE_FEE: '/logistics/calculate-fee',
    CREATE_SHIPMENT: '/logistics/create-shipment',
    TRACKING: (trackingNumber: string) => `/logistics/tracking/${trackingNumber}`,
    // Compatibility aliases
    CALCULATE_SHIPPING: '/logistics/calculate-fee',
    CREATE_SHIPPING: '/logistics/create-shipment',
    TRACK: (trackingNumber: string) => `/logistics/tracking/${trackingNumber}`,
  },
  DISPUTES: {
    LIST: '/disputes',
    DETAIL: (id: string) => `/disputes/${id}`,
    EVIDENCE: (id: string) => `/disputes/${id}/evidence`,
  },
  ALERTS: '/alerts',
  TRANSACTIONS: {
    MY_TRANSACTIONS: '/transactions/my-transactions',
    DETAIL: (id: string) => `/transactions/${id}`,
    STATS: '/transactions/stats',
  },
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