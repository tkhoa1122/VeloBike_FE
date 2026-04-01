import { BaseApiClient } from './BaseApiClient';
import { ENDPOINTS } from '../../config/api';

export interface WalletBalance {
  balance: number;
  totalEarnings: number;
  totalWithdrawn: number;
  currency?: string;
}

export interface WalletTransaction {
  id: string;
  type: 'PAYMENT_RELEASE' | 'COMMISSION_DEBIT' | 'WITHDRAW' | 'DEPOSIT' | 'PAYMENT_HOLD' | 'REFUND' | 'PLATFORM_FEE' | 'INSPECTION_FEE';
  amount: number;
  status: string;
  description: string;
  createdAt: string;
  relatedOrderId?: {
    _id: string;
    financials?: {
      totalAmount?: number;
    };
  };
  metadata?: {
    breakdown?: {
      itemPrice?: number;
      platformFee?: number;
      commissionRate?: number;
      commissionPercent?: number;
      planName?: string;
      sellerReceived?: number;
    };
    commissionRate?: number;
    commissionPercent?: number;
    planName?: string;
    itemPrice?: number;
  };
}

export interface WalletWithdrawal {
  id: string;
  amount: number;
  fee: number;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  bankAccount: string;         // masked e.g. "***1234"
  bankAccountRaw?: {
    accountName?: string;
    accountNumber?: string;
    bankName?: string;
  };
  requestedAt: string;
  processedAt?: string;
  transferProof?: string;
  note?: string;
}

export interface BankAccount {
  accountName?: string;
  accountNumber?: string;
  bankName?: string;
}

export interface SubscriptionInfo {
  planType: string;
  commissionRate: number;
  commissionPercent: number;
  planDisplayName: string;
  endDate?: string;
  status: string;
}

export class WalletApiClient extends BaseApiClient {
  /** GET /users/me/wallet */
  async getWalletBalance(): Promise<{ success: boolean; data?: WalletBalance }> {
    return this.get(ENDPOINTS.USERS.ME_WALLET);
  }

  /** GET /transactions/my-transactions */
  async getTransactions(params?: { page?: number; limit?: number }): Promise<{
    success: boolean;
    data?: any[];
    totalPages?: number;
    currentPage?: number;
  }> {
    return this.get(ENDPOINTS.TRANSACTIONS.MY_TRANSACTIONS, params);
  }

  /** GET /wallet/withdrawals */
  async getWithdrawals(): Promise<{ success: boolean; data?: any[] }> {
    return this.get(ENDPOINTS.WALLET.WITHDRAWALS);
  }

  /** POST /wallet/withdraw */
  async requestWithdrawal(data: {
    amount: number;
    bankAccount: BankAccount;
  }): Promise<{ success: boolean; message?: string; data?: any }> {
    return this.post(ENDPOINTS.WALLET.WITHDRAW, data);
  }

  /** PUT /wallet/withdrawals/:id/cancel */
  async cancelWithdrawal(id: string): Promise<{ success: boolean; message?: string }> {
    return this.put(`${ENDPOINTS.WALLET.WITHDRAWALS}/${id}/cancel`);
  }

  /** GET /users/me (lấy bankAccount) */
  async getUserProfile(): Promise<{ success: boolean; data?: { bankAccount?: BankAccount } }> {
    return this.get(ENDPOINTS.USERS.ME);
  }

  /** POST /users/me/bank */
  async saveBankAccount(data: BankAccount): Promise<{ success: boolean; message?: string }> {
    return this.post(ENDPOINTS.USERS.BANK, data);
  }

  /** GET /subscriptions/my-subscription */
  async getMySubscription(): Promise<{
    success: boolean;
    data?: { subscription?: any; plan?: any };
  }> {
    return this.get(ENDPOINTS.SUBSCRIPTIONS.MY_SUBSCRIPTION);
  }
}
