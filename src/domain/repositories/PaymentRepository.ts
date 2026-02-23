import { ApiResponse } from '../entities/Common';

export interface PaymentRepository {
  // Payment processing
  createPaymentLink(orderId: string): Promise<ApiResponse<{
    paymentLink: string;
    orderCode: number;
  }>>;
  
  // Wallet operations
  getWalletBalance(): Promise<ApiResponse<{
    balance: number;
    currency: string;
    pendingAmount: number;
  }>>;
  
  // Withdrawals
  requestWithdrawal(data: {
    amount: number;
    bankAccount: {
      bankName: string;
      accountNumber: string;
      accountName: string;
      branch: string;
    };
  }): Promise<ApiResponse>;
  
  getWithdrawalHistory(page?: number, limit?: number): Promise<ApiResponse<any[]>>;
  
  // Transaction history
  getTransactionHistory(params?: {
    type?: 'PAYMENT' | 'REFUND' | 'WITHDRAWAL' | 'COMMISSION';
    fromDate?: Date;
    toDate?: Date;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<any[]>>;
  
  // Payment methods
  getPaymentMethods(): Promise<ApiResponse<any[]>>;
  addPaymentMethod(data: any): Promise<ApiResponse>;
  removePaymentMethod(methodId: string): Promise<ApiResponse>;
  
  // Subscription payments
  subscribeToPlan(planType: string): Promise<ApiResponse<{
    paymentLink: string;
  }>>;
  cancelSubscription(): Promise<ApiResponse>;
  
  // Refunds
  requestRefund(orderId: string, reason: string): Promise<ApiResponse>;
  getRefundStatus(orderId: string): Promise<ApiResponse<{
    status: string;
    amount: number;
    processedAt?: Date;
  }>>;
}