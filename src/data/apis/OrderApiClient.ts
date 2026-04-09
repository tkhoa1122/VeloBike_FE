import { BaseApiClient } from './BaseApiClient';
import { ENDPOINTS } from '../../config/api';
import { OrderListResponseModel, OrderResponseModel } from '../models/OrderModel';
import { 
  CreateOrderData, 
  OrderTransitionData, 
  OrderSearchParams 
} from '../../domain/entities/Order';

export class OrderApiClient extends BaseApiClient {
  /**
   * Create new order
   */
  async createOrder(data: CreateOrderData): Promise<OrderResponseModel> {
    return this.post(ENDPOINTS.ORDERS.CREATE, data);
  }

  /**
   * Get order by ID
   */
  async getOrderById(id: string): Promise<OrderResponseModel> {
    return this.get(ENDPOINTS.ORDERS.DETAIL(id));
  }

  /**
   * Get user's orders
   */
  async getMyOrders(params: OrderSearchParams): Promise<OrderListResponseModel> {
    const queryParams = this.buildOrderQueryParams(params);
    return this.get(ENDPOINTS.ORDERS.MY_ORDERS, queryParams);
  }

  /**
   * Transition order to new state
   */
  async transitionOrderState(data: OrderTransitionData): Promise<OrderResponseModel> {
    return this.post(ENDPOINTS.ORDERS.TRANSITION(data.orderId), {
      newState: data.newState,
      note: data.note,
      attachments: data.attachments
    });
  }

  /**
   * Cancel order
   */
  async cancelOrder(orderId: string, reason: string): Promise<{ success: boolean; message: string }> {
    return this.put(ENDPOINTS.ORDERS.UPDATE_STATUS(orderId), {
      status: 'CANCELLED',
      note: reason,
    });
  }

  /**
   * Buyer: Confirm delivery
   */
  async confirmDelivery(orderId: string): Promise<{ success: boolean; message: string }> {
    return this.put(ENDPOINTS.ORDERS.UPDATE_STATUS(orderId), {
      status: 'DELIVERED',
      note: 'Buyer confirmed delivery',
    });
  }

  /**
   * Buyer: Request return
   */
  async requestReturn(orderId: string, reason: string): Promise<{ success: boolean; message: string }> {
    return this.post(ENDPOINTS.ORDERS.TRANSITION(orderId), {
      newState: 'DISPUTED',
      note: reason,
    });
  }

  /**
   * Seller: Accept order
   */
  async acceptOrder(orderId: string): Promise<{ success: boolean; message: string }> {
    return this.post(ENDPOINTS.ORDERS.TRANSITION(orderId), {
      newState: 'ESCROW_LOCKED',
      note: 'Seller accepted order',
    });
  }

  /**
   * Seller: Decline order
   */
  async declineOrder(orderId: string, reason: string): Promise<{ success: boolean; message: string }> {
    return this.put(ENDPOINTS.ORDERS.UPDATE_STATUS(orderId), {
      status: 'CANCELLED',
      note: reason,
    });
  }

  /**
   * Seller: Mark as shipped
   */
  async markAsShipped(orderId: string, trackingInfo: {
    carrier: string;
    trackingNumber: string;
    estimatedDelivery?: Date;
  }): Promise<{ success: boolean; message: string }> {
    return this.put(ENDPOINTS.ORDERS.UPDATE_STATUS(orderId), {
      status: 'SHIPPING',
      trackingInfo,
    });
  }

  /**
   * Inspector: Accept inspection
   */
  async acceptInspection(orderId: string): Promise<{ success: boolean; message: string }> {
    return this.post(ENDPOINTS.ORDERS.TRANSITION(orderId), {
      newState: 'IN_INSPECTION',
      note: 'Inspection accepted',
    });
  }

  /**
   * Inspector: Submit inspection report
   */
  async submitInspectionReport(orderId: string, report: any): Promise<{ success: boolean; message: string }> {
    return this.post('/inspections', {
      orderId,
      ...report
    });
  }

  /**
   * Get order tracking information
   */
  async getOrderTracking(orderId: string): Promise<{
    success: boolean;
    data: {
      trackingNumber: string;
      carrier: string;
      status: string;
      events: Array<{
        date: Date;
        status: string;
        location: string;
        description: string;
      }>;
    };
  }> {
    return this.get(ENDPOINTS.ORDERS.TIMELINE(orderId));
  }

  /**
   * Get order statistics
   */
  async getOrderStats(period: 'week' | 'month' | 'year' = 'month'): Promise<{
    success: boolean;
    data: {
      totalOrders: number;
      totalValue: number;
      averageOrderValue: number;
      completionRate: number;
      statusBreakdown: Record<string, number>;
    };
  }> {
    return this.get('/dashboard/seller/performance', { period });
  }

  /**
   * Get order timeline
   */
  async getOrderTimeline(orderId: string): Promise<{ success: boolean; data: any[] }> {
    return this.get(ENDPOINTS.ORDERS.TIMELINE(orderId));
  }

  /**
   * Update shipping address for buyer
   */
  async updateShippingAddress(orderId: string, shippingAddress: Record<string, any>): Promise<{ success: boolean; message?: string; data?: any }> {
    return this.put(ENDPOINTS.ORDERS.UPDATE_SHIPPING_ADDRESS(orderId), shippingAddress);
  }

  /**
   * Calculate shipping estimate (same flow as Web FE)
   */
  async getShippingEstimate(
    listingId: string,
    buyerCity: string,
    buyerProvince: string = ''
  ): Promise<{
    success: boolean;
    data?: {
      distanceKm: number;
      baseFee: number;
      weightFee: number;
      bulkySurcharge: number;
      total: number;
      weightKg: number;
      note?: string;
    };
    message?: string;
  }> {
    return this.get(ENDPOINTS.ORDERS.SHIPPING_ESTIMATE, {
      listingId,
      buyerCity,
      buyerProvince,
    });
  }

  /**
   * Get escrow status
   */
  async getEscrowStatus(orderId: string): Promise<{ success: boolean; data: any }> {
    return this.get(ENDPOINTS.ORDERS.ESCROW_STATUS(orderId));
  }

  /**
   * Helper: Build query parameters for order search
   */
  private buildOrderQueryParams(params: OrderSearchParams): Record<string, any> {
    const queryParams: Record<string, any> = {
      page: params.page,
      limit: params.limit,
    };

    // Add filters
    if (params.filters) {
      Object.entries(params.filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (key === 'fromDate' || key === 'toDate') {
            queryParams[key] = (value as Date).toISOString();
          } else {
            queryParams[key] = value;
          }
        }
      });
    }

    // Add sorting
    if (params.sort) {
      queryParams.sort = `${params.sort.order === 'desc' ? '-' : ''}${params.sort.field}`;
    }

    return queryParams;
  }
}