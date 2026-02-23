import { 
  Order, 
  CreateOrderData, 
  OrderTransitionData, 
  OrderSearchParams,
  InspectionReport 
} from '../entities/Order';
import { ApiResponse, PaginatedResponse } from '../entities/Common';

export interface OrderRepository {
  // Order management
  createOrder(data: CreateOrderData): Promise<ApiResponse<Order>>;
  getOrderById(id: string): Promise<ApiResponse<Order>>;
  getMyOrders(params: OrderSearchParams): Promise<PaginatedResponse<Order>>;
  
  // Order state transitions
  transitionOrderState(data: OrderTransitionData): Promise<ApiResponse<Order>>;
  cancelOrder(orderId: string, reason: string): Promise<ApiResponse>;
  
  // Role-specific operations
  // Buyer
  confirmDelivery(orderId: string): Promise<ApiResponse>;
  requestReturn(orderId: string, reason: string): Promise<ApiResponse>;
  
  // Seller  
  acceptOrder(orderId: string): Promise<ApiResponse>;
  declineOrder(orderId: string, reason: string): Promise<ApiResponse>;
  markAsShipped(orderId: string, trackingInfo: {
    carrier: string;
    trackingNumber: string;
    estimatedDelivery?: Date;
  }): Promise<ApiResponse>;
  
  // Inspector
  acceptInspection(orderId: string): Promise<ApiResponse>;
  submitInspectionReport(orderId: string, report: Omit<InspectionReport, '_id' | 'orderId' | 'completedAt'>): Promise<ApiResponse>;
  
  // Tracking
  getOrderTracking(orderId: string): Promise<ApiResponse<{
    trackingNumber: string;
    carrier: string;
    status: string;
    events: Array<{
      date: Date;
      status: string;
      location: string;
      description: string;
    }>;
  }>>;
  
  // Statistics
  getOrderStats(period?: 'week' | 'month' | 'year'): Promise<ApiResponse<{
    totalOrders: number;
    totalValue: number;
    averageOrderValue: number;
    completionRate: number;
    statusBreakdown: Record<string, number>;
  }>>;
}