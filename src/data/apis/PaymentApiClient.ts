import { BaseApiClient } from './BaseApiClient';
import { ENDPOINTS } from '../../config/api';

// Response models
export interface PaymentLinkResponseModel {
  success: boolean;
  paymentLink?: string;
  checkoutUrl?: string;
  orderCode?: number;
  data?: {
    paymentLink?: string;
    checkoutUrl?: string;
    orderCode?: number;
  };
  message?: string;
}

export interface WalletBalanceResponseModel {
  success: boolean;
  data: {
    balance: number;
    currency: string;
    pendingAmount: number;
  };
}

export interface WithdrawalResponseModel {
  success: boolean;
  data: {
    _id: string;
    amount: number;
    fee: number;
    netAmount: number;
    status: 'PENDING' | 'APPROVED' | 'COMPLETED' | 'REJECTED';
    bankAccount: {
      bankName: string;
      accountNumber: string;
      accountName: string;
      branch: string;
    };
    createdAt: string;
  };
  message?: string;
}

export interface TransactionResponseModel {
  success: boolean;
  data: Array<{
    _id: string;
    type: 'PAYMENT' | 'REFUND' | 'WITHDRAWAL' | 'COMMISSION';
    amount: number;
    status: string;
    description: string;
    createdAt: string;
  }>;
  totalPages?: number;
  currentPage?: number;
}

export class PaymentApiClient extends BaseApiClient {
  /**
   * Create payment link for order
   */
  async createPaymentLink(orderId: string): Promise<PaymentLinkResponseModel> {
    return this.post(ENDPOINTS.PAYMENT.CREATE_LINK, { orderId });
  }

  /**
   * Get wallet balance
   */
  async getWalletBalance(): Promise<WalletBalanceResponseModel> {
    return this.get(ENDPOINTS.USERS.ME_WALLET);
  }

  /**
   * Request withdrawal
   */
  async requestWithdrawal(data: {
    amount: number;
    bankAccount: {
      bankName: string;
      accountNumber: string;
      accountName: string;
      branch: string;
    };
  }): Promise<WithdrawalResponseModel> {
    return this.post(ENDPOINTS.WALLET.WITHDRAW, data);
  }

  /**
   * Get withdrawal history
   */
  async getWithdrawalHistory(params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<TransactionResponseModel> {
    return this.get(ENDPOINTS.WALLET.WITHDRAWALS, params);
  }

  /**
   * Get transaction history
   */
  async getTransactionHistory(params?: {
    type?: 'PAYMENT' | 'REFUND' | 'WITHDRAWAL' | 'COMMISSION';
    fromDate?: string;
    toDate?: string;
    page?: number;
    limit?: number;
  }): Promise<TransactionResponseModel> {
    return this.get(ENDPOINTS.TRANSACTIONS.MY_TRANSACTIONS, params);
  }

  /**
   * Get payment info by PayOS orderCode
   */
  async getPaymentInfo(orderCode: number | string): Promise<{
    success: boolean;
    data?: any;
    message?: string;
  }> {
    return this.get(ENDPOINTS.PAYMENT.INFO(orderCode));
  }

  /**
   * Simulate payment (dev/test only)
   */
  async simulatePayment(data: { orderCode: number | string; status?: 'PAID' | 'CANCELLED' | 'FAILED' }): Promise<{
    success: boolean;
    message?: string;
    data?: any;
  }> {
    return this.post(ENDPOINTS.PAYMENT.SIMULATE, data);
  }

  /**
   * Request refund for order
   */
  async requestRefund(orderId: string, reason: string): Promise<{
    success: boolean;
    message: string;
  }> {
    return this.post(`/orders/${orderId}/refund`, { reason });
  }

  /**
   * Get refund status
   */
  async getRefundStatus(orderId: string): Promise<{
    success: boolean;
    data: {
      status: string;
      amount: number;
      processedAt?: string;
    };
  }> {
    return this.get(`/orders/${orderId}/refund-status`);
  }
}
