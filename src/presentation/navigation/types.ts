/**
 * Navigation Type Definitions
 */
import type { NavigatorScreenParams } from '@react-navigation/native';

// =============================================================================
// ROOT STACK
// =============================================================================
export type RootStackParamList = {
  Welcome: undefined;
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
};

// =============================================================================
// AUTH STACK
// =============================================================================
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  VerifyEmail: { email: string };
  ForgotPassword: undefined;
};

// =============================================================================
// MAIN BOTTOM TABS
// =============================================================================
export type MainTabParamList = {
  HomeTab: NavigatorScreenParams<HomeStackParamList>;
  SearchTab: NavigatorScreenParams<SearchStackParamList>;
  Wishlist: undefined;
  MessagesTab: NavigatorScreenParams<MessagesStackParamList>;
  /** Trợ lý AI — cùng API POST /chatbot/webhook, GET /chatbot/history, GET /chatbot/quota (VeloBike BE) */
  AiAssistantTab: undefined;
  ProfileTab: NavigatorScreenParams<ProfileStackParamList>;
};

// =============================================================================
// HOME STACK (inside Home tab)
// =============================================================================
export type HomeStackParamList = {
  Home: undefined;
  ListingDetail: { listingId: string };
  CreateOrder: { listingId: string };
  Payment: { orderId: string };
  // orderId optional (dùng cho order), type phân biệt order vs subscription
  PaymentWebView: { paymentLink: string; orderCode: number; orderId?: string; type?: 'order' | 'subscription' };
  PaymentSuccess: { orderId: string; orderCode?: number };
  Orders: undefined;
  OrderDetail: { orderId: string; initialOrder?: any };
  Chat: {
    conversationId?: string;
    /** Người bán (khi người mua bắt đầu chat) */
    sellerId?: string;
    /** Người mua (khi người bán bắt đầu chat) */
    buyerId?: string;
    /** Đối tác khi mở từ danh sách hội thoại */
    peerUserId?: string;
    participantName: string;
    participantAvatar?: string;
    listingTitle?: string;
    listingImage?: string;
    listingId?: string;
    orderId?: string;
  };
  Notifications: undefined;
};

// =============================================================================
// SEARCH STACK (inside Search tab)
// =============================================================================
export type SearchStackParamList = {
  Search: undefined;
  ListingDetail: { listingId: string };
  CreateOrder: { listingId: string };
  Payment: { orderId: string };
  PaymentWebView: { paymentLink: string; orderCode: number; orderId?: string; type?: 'order' | 'subscription' };
  PaymentSuccess: { orderId: string; orderCode?: number };
  Orders: undefined;
  OrderDetail: { orderId: string; initialOrder?: any };
  Chat: {
    conversationId?: string;
    /** Người bán (khi người mua bắt đầu chat) */
    sellerId?: string;
    /** Người mua (khi người bán bắt đầu chat) */
    buyerId?: string;
    /** Đối tác khi mở từ danh sách hội thoại */
    peerUserId?: string;
    participantName: string;
    participantAvatar?: string;
    listingTitle?: string;
    listingImage?: string;
    listingId?: string;
    orderId?: string;
  };
};

// =============================================================================
// MESSAGES STACK (inside Messages tab)
// =============================================================================
export type MessagesStackParamList = {
  Messages: undefined;
  Chat: {
    conversationId?: string;
    /** Người bán (khi người mua bắt đầu chat) */
    sellerId?: string;
    /** Người mua (khi người bán bắt đầu chat) */
    buyerId?: string;
    /** Đối tác khi mở từ danh sách hội thoại */
    peerUserId?: string;
    participantName: string;
    participantAvatar?: string;
    listingTitle?: string;
    listingImage?: string;
    listingId?: string;
    orderId?: string;
  };
};

// =============================================================================
// PROFILE STACK (inside Profile tab)
// =============================================================================
export type ProfileStackParamList = {
  Profile: undefined;
  EditProfile: undefined;
  KycVerification: undefined;
  Orders: undefined;
  OrderDetail: { orderId: string; initialOrder?: any };
  Payment: { orderId: string };
  PaymentWebView: { paymentLink: string; orderCode: number; orderId?: string; type?: 'order' | 'subscription' };
  PaymentSuccess: { orderId: string; orderCode?: number };
  SubscriptionSuccess: { orderCode: number }; // ✅ Màn hình thành công sau thanh toán gói
  Notifications: undefined;
  Settings: undefined;
  SubscriptionPlans: undefined;
  ManageSubscription: undefined;
  Chat: {
    conversationId?: string;
    /** Người bán (khi người mua bắt đầu chat) */
    sellerId?: string;
    /** Người mua (khi người bán bắt đầu chat) */
    buyerId?: string;
    /** Đối tác khi mở từ danh sách hội thoại */
    peerUserId?: string;
    participantName: string;
    participantAvatar?: string;
    listingTitle?: string;
    listingImage?: string;
    listingId?: string;
    orderId?: string;
  };
  CreateOrder: { listingId: string };
  // Buyer screens
  BuyerWallet: undefined;
  BuyerPaymentHistory: undefined;
  // Seller screens
  SellerDashboard: undefined;
  SellerListings: undefined;
  SellerCreateListing: undefined;
  SellerOrders: undefined;
  SellerWallet: undefined;
  /** Đánh giá người mua dành cho shop */
  SellerReceivedReviews: undefined;
  /** Xem chi tiết tin (cùng stack Profile — seller xem tin của mình) */
  ListingDetail: { listingId: string };
};
