import { create } from 'zustand';
import { LoadingState } from '../../domain/entities/Common';
import { container } from '../../di/Container';

export interface WalletBalance {
  balance: number;
  currency: string;
  pendingAmount: number;
}

export interface PaymentLink {
  paymentLink: string;
  orderCode: number;
}

interface PaymentState {
  // Wallet
  walletBalance: WalletBalance | null;
  
  // Payment Link
  currentPaymentLink: PaymentLink | null;
  
  // States
  loadingState: LoadingState;
  error: string | null;

  // Actions
  createPaymentLink: (orderId: string) => Promise<PaymentLink | null>;
  getWalletBalance: () => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

export const usePaymentStore = create<PaymentState>((set, get) => ({
  walletBalance: null,
  currentPaymentLink: null,
  loadingState: 'idle',
  error: null,

  createPaymentLink: async (orderId: string): Promise<PaymentLink | null> => {
    set({ loadingState: 'loading', error: null });
    try {
      const useCase = container().createPaymentLinkUseCase;
      const result = await useCase.execute(orderId);
      
      if (result.success && result.data) {
        set({ 
          currentPaymentLink: result.data, 
          loadingState: 'success' 
        });
        return result.data;
      } else {
        set({ 
          loadingState: 'error', 
          error: result.error || 'Không thể tạo link thanh toán' 
        });
        return null;
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Lỗi không xác định';
      set({ loadingState: 'error', error: errorMsg });
      return null;
    }
  },

  getWalletBalance: async (): Promise<void> => {
    set({ loadingState: 'loading', error: null });
    try {
      const useCase = container().getWalletBalanceUseCase;
      const result = await useCase.execute();
      
      if (result.success && result.data) {
        set({ 
          walletBalance: result.data, 
          loadingState: 'success' 
        });
      } else {
        set({ 
          loadingState: 'error', 
          error: result.error || 'Không thể lấy số dư ví' 
        });
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Lỗi không xác định';
      set({ loadingState: 'error', error: errorMsg });
    }
  },

  clearError: () => set({ error: null }),
  
  reset: () => set({
    walletBalance: null,
    currentPaymentLink: null,
    loadingState: 'idle',
    error: null,
  }),
}));

// Selectors
export const useWalletBalance = () => usePaymentStore(s => s.walletBalance);
export const usePaymentLoading = () => usePaymentStore(s => s.loadingState === 'loading');
export const usePaymentError = () => usePaymentStore(s => s.error);
