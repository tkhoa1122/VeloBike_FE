import { PaymentRepository } from '../../domain/repositories/PaymentRepository';
import { PaymentApiClient } from '../apis/PaymentApiClient';
import { ApiResponse } from '../../domain/entities/Common';

export class PaymentRepositoryImpl implements PaymentRepository {
  constructor(private apiClient: PaymentApiClient) {}

  async createPaymentLink(orderId: string): Promise<ApiResponse<{
    paymentLink: string;
    orderCode: number;
  }>> {
    try {
      const response = await this.apiClient.createPaymentLink(orderId);

      const paymentLink =
        response.paymentLink ||
        response.checkoutUrl ||
        response.data?.paymentLink ||
        response.data?.checkoutUrl;
      const orderCode = response.orderCode || response.data?.orderCode;

      if (!response.success || !paymentLink || !orderCode) {
        return {
          success: false,
          error: response.message || 'Không thể tạo link thanh toán',
        };
      }

      return {
        success: true,
        data: {
          paymentLink,
          orderCode,
        },
        message: response.message,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Không thể tạo link thanh toán',
      };
    }
  }

  async getWalletBalance(): Promise<ApiResponse<{
    balance: number;
    currency: string;
    pendingAmount: number;
  }>> {
    try {
      const response = await this.apiClient.getWalletBalance();
      return {
        success: response.success,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Không thể lấy số dư ví',
      };
    }
  }

  async requestWithdrawal(data: {
    amount: number;
    bankAccount: {
      bankName: string;
      accountNumber: string;
      accountName: string;
      branch: string;
    };
  }): Promise<ApiResponse> {
    try {
      const response = await this.apiClient.requestWithdrawal(data);
      return {
        success: response.success,
        data: response.data,
        message: response.message,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Không thể tạo yêu cầu rút tiền',
      };
    }
  }

  async getWithdrawalHistory(page?: number, limit?: number): Promise<ApiResponse<any[]>> {
    try {
      const response = await this.apiClient.getWithdrawalHistory({ page, limit });
      return {
        success: response.success,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : 'Không thể tải lịch sử rút tiền',
      };
    }
  }

  async getTransactionHistory(params?: {
    type?: 'PAYMENT' | 'REFUND' | 'WITHDRAWAL' | 'COMMISSION';
    fromDate?: Date;
    toDate?: Date;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<any[]>> {
    try {
      const queryParams = params ? {
        ...params,
        fromDate: params.fromDate?.toISOString(),
        toDate: params.toDate?.toISOString(),
      } : undefined;
      
      const response = await this.apiClient.getTransactionHistory(queryParams);
      return {
        success: response.success,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : 'Không thể tải lịch sử giao dịch',
      };
    }
  }

  async getPaymentMethods(): Promise<ApiResponse<any[]>> {
    // TODO: Implement when backend ready
    return {
      success: true,
      data: [],
    };
  }

  async addPaymentMethod(_data: any): Promise<ApiResponse> {
    // TODO: Implement when backend ready
    return {
      success: false,
      error: 'Chức năng chưa khả dụng',
    };
  }

  async removePaymentMethod(_methodId: string): Promise<ApiResponse> {
    // TODO: Implement when backend ready
    return {
      success: false,
      error: 'Chức năng chưa khả dụng',
    };
  }

  async subscribeToPlan(_planType: string): Promise<ApiResponse<{
    paymentLink: string;
  }>> {
    // TODO: Implement when backend ready
    return {
      success: false,
      error: 'Chức năng chưa khả dụng',
    };
  }

  async cancelSubscription(): Promise<ApiResponse> {
    // TODO: Implement when backend ready
    return {
      success: false,
      error: 'Chức năng chưa khả dụng',
    };
  }

  async requestRefund(orderId: string, reason: string): Promise<ApiResponse> {
    try {
      const response = await this.apiClient.requestRefund(orderId, reason);
      return {
        success: response.success,
        message: response.message,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Không thể yêu cầu hoàn tiền',
      };
    }
  }

  async getRefundStatus(orderId: string): Promise<ApiResponse<{
    status: string;
    amount: number;
    processedAt?: Date;
  }>> {
    try {
      const response = await this.apiClient.getRefundStatus(orderId);
      return {
        success: response.success,
        data: {
          status: response.data.status,
          amount: response.data.amount,
          processedAt: response.data.processedAt ? new Date(response.data.processedAt) : undefined,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Không thể lấy trạng thái hoàn tiền',
      };
    }
  }
}
