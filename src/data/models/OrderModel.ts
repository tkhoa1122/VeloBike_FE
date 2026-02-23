/**
 * Order Model - Maps server response to domain entity
 */
export interface OrderModel {
  _id: string;
  
  listingId: string | ListingModel;
  buyerId: string | UserModel;
  sellerId: string | UserModel;
  inspectorId?: string | UserModel;
  
  status: string;
  
  financials: {
    itemPrice: number;
    inspectionFee: number;
    shippingFee: number;
    platformFee: number;
    totalAmount: number;
    currency: string;
    paymentStatus: string;
    paymentIntentId?: string;
    paidAt?: string;
    escrowStatus: string;
    escrowedAmount: number;
    commission: {
      rate: number;
      amount: number;
    };
    sellerPayout: {
      amount: number;
      status: string;
      paidAt?: string;
      transactionId?: string;
    };
  };
  
  shippingAddress: {
    fullName: string;
    phone: string;
    street: string;
    district: string;
    city: string;
    province: string;
    zipCode?: string;
    coordinates?: [number, number];
    instructions?: string;
    landmark?: string;
  };
  
  shippingMethod: {
    provider: string;
    service: string;
    estimatedDays: number;
    cost: number;
    pickupAddress?: string;
    pickupTime?: string;
  };
  
  trackingInfo?: {
    trackingNumber: string;
    carrierTrackingUrl?: string;
    status: string;
    events: Array<{
      timestamp: string;
      status: string;
      description: string;
      location?: string;
    }>;
    deliveryConfirmation?: {
      confirmedBy: string;
      confirmedAt: string;
      signature?: string;
      photos?: string[];
    };
  };
  
  timeline: Array<{
    status: string;
    timestamp: string;
    actorId: string;
    actorRole: string;
    note?: string;
    attachments?: string[];
  }>;
  
  notes?: {
    buyerNote?: string;
    sellerNote?: string;
    inspectorNote?: string;
    adminNote?: string;
  };
  
  attachments?: Array<{
    type: string;
    url: string;
    uploadedBy: string;
    uploadedAt: string;
    caption?: string;
  }>;
  
  disputeId?: string;
  
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

// Import other models (if needed for reference)
import { ListingModel } from './ListingModel';
import { UserModel } from './UserModel';

// Order list response
export interface OrderListResponseModel {
  success: boolean;
  count: number;
  page: number;
  totalPages: number;
  data: OrderModel[];
  message?: string;
}

// Single order response
export interface OrderResponseModel {
  success: boolean;
  data: OrderModel;
  message?: string;
}