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
  PaymentWebView: { paymentLink: string; orderCode: number; orderId: string };
  PaymentSuccess: { orderId: string };
  Orders: undefined;
  OrderDetail: { orderId: string };
  Chat: { conversationId?: string; participantName: string; participantAvatar?: string; listingTitle?: string; listingImage?: string };
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
  PaymentWebView: { paymentLink: string; orderCode: number; orderId: string };
  PaymentSuccess: { orderId: string };
  Orders: undefined;
  OrderDetail: { orderId: string };
  Chat: { conversationId?: string; participantName: string; participantAvatar?: string; listingTitle?: string; listingImage?: string };
};

// =============================================================================
// MESSAGES STACK (inside Messages tab)
// =============================================================================
export type MessagesStackParamList = {
  Messages: undefined;
  Chat: { conversationId?: string; participantName: string; participantAvatar?: string; listingTitle?: string; listingImage?: string };
};

// =============================================================================
// PROFILE STACK (inside Profile tab)
// =============================================================================
export type ProfileStackParamList = {
  Profile: undefined;
  EditProfile: undefined;
  KycVerification: undefined;
  Orders: undefined;
  OrderDetail: { orderId: string };
  Notifications: undefined;
  Settings: undefined;
};

