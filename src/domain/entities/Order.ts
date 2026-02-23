import { OrderStatus, PaymentStatus } from '../../config/constants';
import { User } from './User';
import { Listing } from './Listing';

export interface Order {
  _id: string;
  
  // Relationships
  listingId: string | Listing;
  buyerId: string | User;
  sellerId: string | User;
  inspectorId?: string | User;
  
  // Status
  status: OrderStatus;
  
  // Financials
  financials: OrderFinancials;
  
  // Shipping
  shippingAddress: ShippingAddress;
  shippingMethod: ShippingMethod;
  trackingInfo?: TrackingInfo;
  
  // Timeline & History
  timeline: OrderTimelineEvent[];
  
  // Additional data
  notes?: {
    buyerNote?: string;
    sellerNote?: string;
    inspectorNote?: string;
    adminNote?: string;
  };
  
  // Files & Evidence
  attachments?: OrderAttachment[];
  
  // Dispute
  disputeId?: string;
  
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export interface OrderFinancials {
  itemPrice: number;
  inspectionFee: number;
  shippingFee: number;
  platformFee: number;
  totalAmount: number;
  currency: string;
  
  // Payment tracking
  paymentStatus: PaymentStatus;
  paymentIntentId?: string;
  paidAt?: Date;
  
  // Escrow & Payout
  escrowStatus: 'PENDING' | 'LOCKED' | 'RELEASED' | 'REFUNDED';
  escrowedAmount: number;
  
  // Commission breakdown
  commission: {
    rate: number; // percentage
    amount: number;
  };
  
  // Seller payout
  sellerPayout: {
    amount: number;
    status: 'PENDING' | 'PROCESSING' | 'PAID' | 'FAILED';
    paidAt?: Date;
    transactionId?: string;
  };
}

export interface ShippingAddress {
  fullName: string;
  phone: string;
  street: string;
  district: string;
  city: string;
  province: string;
  zipCode?: string;
  coordinates?: [number, number];
  
  // Special instructions
  instructions?: string;
  landmark?: string;
}

export interface ShippingMethod {
  provider: 'GIAO_HANG_NHANH' | 'VIETTEL_POST' | 'VNPOST' | 'SELF_PICKUP';
  service: string; // Standard, Express, etc.
  estimatedDays: number;
  cost: number;
  
  // Pickup info (for self-pickup)
  pickupAddress?: string;
  pickupTime?: Date;
}

export interface TrackingInfo {
  trackingNumber: string;
  carrierTrackingUrl?: string;
  status: 'PICKED_UP' | 'IN_TRANSIT' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'FAILED';
  
  // Tracking events
  events: TrackingEvent[];
  
  // Delivery confirmation
  deliveryConfirmation?: {
    confirmedBy: string; // User ID
    confirmedAt: Date;
    signature?: string; // URL to signature image
    photos?: string[]; // Delivery photos
  };
}

export interface TrackingEvent {
  timestamp: Date;
  status: string;
  description: string;
  location?: string;
}

export interface OrderTimelineEvent {
  status: OrderStatus;
  timestamp: Date;
  actorId: string; // User ID who triggered this state
  actorRole: 'buyer' | 'seller' | 'inspector' | 'system' | 'admin';
  note?: string;
  attachments?: string[]; // URLs to supporting documents/images
}

export interface OrderAttachment {
  type: 'IMAGE' | 'DOCUMENT' | 'VIDEO';
  url: string;
  uploadedBy: string; // User ID
  uploadedAt: Date;
  caption?: string;
}

// For creating orders
export interface CreateOrderData {
  listingId: string;
  shippingAddress: ShippingAddress;
  shippingMethod?: string;
  buyerNote?: string;
}

// For order state transitions
export interface OrderTransitionData {
  orderId: string;
  newState: OrderStatus;
  note?: string;
  attachments?: string[];
}

// For order queries/filters
export interface OrderFilters {
  status?: OrderStatus;
  role?: 'buyer' | 'seller' | 'inspector';
  fromDate?: Date;
  toDate?: Date;
  minAmount?: number;
  maxAmount?: number;
  paymentStatus?: PaymentStatus;
}

export interface OrderSearchParams {
  filters?: OrderFilters;
  sort?: {
    field: 'createdAt' | 'totalAmount' | 'status';
    order: 'asc' | 'desc';
  };
  page: number;
  limit: number;
}

// Inspection related
export interface InspectionRequest {
  orderId: string;
  preferredDate?: Date;
  notes?: string;
  urgency: 'LOW' | 'NORMAL' | 'HIGH';
}

export interface InspectionReport {
  _id: string;
  orderId: string;
  inspectorId: string;
  
  checkpoints: InspectionCheckpoint[];
  overallVerdict: 'PASS' | 'PASS_WITH_NOTES' | 'SUGGEST_ADJUSTMENT' | 'REJECT';
  overallScore: number; // 0-10
  
  inspectorNote: string;
  
  // Media evidence
  photos: string[];
  videos?: string[];
  
  completedAt: Date;
}

export interface InspectionCheckpoint {
  component: string; // Frame, Brakes, Drivetrain, etc.
  status: 'PASS' | 'WARN' | 'FAIL';
  severity?: 'LOW' | 'MEDIUM' | 'HIGH'; // for WARN/FAIL
  observation: string;
  photos?: string[];
  recommendedAction?: string;
}