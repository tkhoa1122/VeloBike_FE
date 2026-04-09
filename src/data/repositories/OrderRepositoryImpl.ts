import { OrderRepository } from '../../domain/repositories/OrderRepository';
import {
  Order,
  CreateOrderData,
  OrderTransitionData,
  OrderSearchParams,
  InspectionReport,
  OrderTimelineEvent,
  OrderFinancials,
  ShippingAddress,
  ShippingMethod,
  TrackingInfo,
  TrackingEvent,
  OrderAttachment,
} from '../../domain/entities/Order';
import { ApiResponse, PaginatedResponse } from '../../domain/entities/Common';
import { OrderApiClient } from '../apis/OrderApiClient';
import { OrderModel } from '../models/OrderModel';

export class OrderRepositoryImpl implements OrderRepository {
  constructor(private orderApiClient: OrderApiClient) {}

  async createOrder(data: CreateOrderData): Promise<ApiResponse<Order>> {
    try {
      const response = await this.orderApiClient.createOrder(data);
      if (response.success) {
        return {
          success: true,
          data: this.mapOrderModelToEntity(response.data),
          message: 'Order created successfully',
        };
      }
      return { success: false, message: response.message || 'Failed to create order' };
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : 'Failed to create order' };
    }
  }

  async getOrderById(id: string): Promise<ApiResponse<Order>> {
    try {
      const response = await this.orderApiClient.getOrderById(id);
      if (response.success) {
        return {
          success: true,
          data: this.mapOrderModelToEntity(response.data),
          message: 'Order retrieved successfully',
        };
      }
      return { success: false, message: response.message || 'Failed to fetch order' };
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : 'Failed to fetch order' };
    }
  }

  async getMyOrders(params: OrderSearchParams): Promise<PaginatedResponse<Order>> {
    try {
      const response = await this.orderApiClient.getMyOrders(params);
      const mappedData = response.data.map(m => this.mapOrderModelToEntity(m));
      return {
        success: response.success,
        count: response.count,
        page: response.page,
        totalPages: response.totalPages,
        data: mappedData,
        message: response.message,
      };
    } catch (error) {
      return {
        success: false,
        count: 0,
        page: params.page,
        totalPages: 0,
        data: [],
        message: error instanceof Error ? error.message : 'Failed to fetch orders',
      };
    }
  }

  async transitionOrderState(data: OrderTransitionData): Promise<ApiResponse<Order>> {
    try {
      const response = await this.orderApiClient.transitionOrderState(data);
      if (response.success) {
        return {
          success: true,
          data: this.mapOrderModelToEntity(response.data),
          message: 'Order state updated',
        };
      }
      return { success: false, message: response.message || 'Failed to update order' };
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : 'Failed to update order' };
    }
  }

  async cancelOrder(orderId: string, reason: string): Promise<ApiResponse> {
    try {
      return await this.orderApiClient.cancelOrder(orderId, reason);
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : 'Failed to cancel order' };
    }
  }

  async confirmDelivery(orderId: string): Promise<ApiResponse> {
    try {
      return await this.orderApiClient.confirmDelivery(orderId);
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : 'Failed to confirm delivery' };
    }
  }

  async requestReturn(orderId: string, reason: string): Promise<ApiResponse> {
    try {
      return await this.orderApiClient.requestReturn(orderId, reason);
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : 'Failed to request return' };
    }
  }

  async acceptOrder(orderId: string): Promise<ApiResponse> {
    try {
      return await this.orderApiClient.acceptOrder(orderId);
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : 'Failed to accept order' };
    }
  }

  async declineOrder(orderId: string, reason: string): Promise<ApiResponse> {
    try {
      return await this.orderApiClient.declineOrder(orderId, reason);
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : 'Failed to decline order' };
    }
  }

  async markAsShipped(orderId: string, trackingInfo: {
    carrier: string;
    trackingNumber: string;
    estimatedDelivery?: Date;
  }): Promise<ApiResponse> {
    try {
      return await this.orderApiClient.markAsShipped(orderId, trackingInfo);
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : 'Failed to mark as shipped' };
    }
  }

  async acceptInspection(orderId: string): Promise<ApiResponse> {
    try {
      return await this.orderApiClient.acceptInspection(orderId);
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : 'Failed to accept inspection' };
    }
  }

  async submitInspectionReport(orderId: string, report: Omit<InspectionReport, '_id' | 'orderId' | 'completedAt'>): Promise<ApiResponse> {
    try {
      return await this.orderApiClient.submitInspectionReport(orderId, report);
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : 'Failed to submit report' };
    }
  }

  async getOrderTracking(orderId: string): Promise<ApiResponse<{
    trackingNumber: string;
    carrier: string;
    status: string;
    events: Array<{ date: Date; status: string; location: string; description: string }>;
  }>> {
    try {
      const response = await this.orderApiClient.getOrderTracking(orderId);
      if (response.success && response.data) {
        return {
          success: true,
          data: {
            ...response.data,
            events: response.data.events.map(e => ({ ...e, date: new Date(e.date) })),
          },
          message: 'Tracking info retrieved',
        };
      }
      return { success: false, message: 'Failed to get tracking info' };
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : 'Failed to get tracking' };
    }
  }

  async getOrderStats(period?: 'week' | 'month' | 'year'): Promise<ApiResponse<{
    totalOrders: number;
    totalValue: number;
    averageOrderValue: number;
    completionRate: number;
    statusBreakdown: Record<string, number>;
  }>> {
    try {
      const result = await this.orderApiClient.getOrderStats(period);
      return { ...result, message: '' };
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : 'Failed to get stats' };
    }
  }

  // =========================================================================
  // MAPPER
  // =========================================================================

  private mapOrderModelToEntity(model: OrderModel): Order {
    const fallbackShippingMethod: ShippingMethod = {
      provider: (model.shippingInfo?.carrier as any) || 'SELF_PICKUP',
      service: model.shippingInfo?.carrier ? 'Standard' : 'N/A',
      estimatedDays: 0,
      cost: model.financials?.shippingFee ?? 0,
    };

    const fallbackTrackingInfo = model.shippingInfo?.trackingNumber
      ? {
          trackingNumber: model.shippingInfo.trackingNumber,
          carrierTrackingUrl: model.shippingInfo.trackingUrl,
          status: 'IN_TRANSIT' as any,
          events: model.shippingInfo?.shippedAt
            ? [
                {
                  timestamp: new Date(model.shippingInfo.shippedAt),
                  status: 'SHIPPING',
                  description: 'Item shipped',
                  location: model.shippingInfo.carrier,
                },
              ]
            : [],
        }
      : undefined;

    return {
      _id: model._id,
      listingId: model.listingId as any,
      buyerId: model.buyerId as any,
      sellerId: model.sellerId as any,
      inspectorId: model.inspectorId as any,
      status: model.status as any,
      financials: model.financials as OrderFinancials,
      shippingAddress: model.shippingAddress as ShippingAddress,
      shippingMethod: (model.shippingMethod as ShippingMethod) || fallbackShippingMethod,
      trackingInfo: model.trackingInfo
        ? {
            ...model.trackingInfo,
            status: model.trackingInfo.status as any,
            events: model.trackingInfo.events.map(e => ({
              ...e,
              timestamp: new Date(e.timestamp),
            })) as unknown as TrackingEvent[],
            deliveryConfirmation: model.trackingInfo.deliveryConfirmation
              ? {
                  ...model.trackingInfo.deliveryConfirmation,
                  confirmedAt: new Date(model.trackingInfo.deliveryConfirmation.confirmedAt),
                }
              : undefined,
          }
        : fallbackTrackingInfo,
      timeline: model.timeline.map(e => ({
        ...e,
        status: e.status as any,
        timestamp: new Date(e.timestamp),
        actorRole: e.actorRole as any,
      })) as OrderTimelineEvent[],
      notes: model.notes,
      attachments: model.attachments?.map(a => ({
        ...a,
        type: a.type as any,
        uploadedAt: new Date(a.uploadedAt),
      })) as OrderAttachment[],
      disputeId: model.disputeId,
      createdAt: new Date(model.createdAt),
      updatedAt: new Date(model.updatedAt),
      completedAt: model.completedAt ? new Date(model.completedAt) : undefined,
    };
  }
}
