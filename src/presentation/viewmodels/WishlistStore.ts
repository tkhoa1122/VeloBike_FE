import { create } from 'zustand';
import { LoadingState } from '../../domain/entities/Common';
import { Listing } from '../../domain/entities/Listing';
import { container } from '../../di/Container';

export interface WishlistEntry {
  _id: string;
  listing: Partial<Listing>;
  addedAt: Date;
}

interface WishlistState {
  items: WishlistEntry[];
  totalItems: number;
  loadingState: LoadingState;
  error: string | null;
  
  // Quick-check cache: listingId -> inWishlist
  wishlistCache: Record<string, boolean>;

  // Actions
  getWishlist: (params?: { page?: number; limit?: number; sort?: string }) => Promise<void>;
  addToWishlist: (listingId: string) => Promise<boolean>;
  removeFromWishlist: (listingId: string) => Promise<boolean>;
  checkInWishlist: (listingId: string) => Promise<boolean>;
  getWishlistCount: () => Promise<number>;
  clearWishlist: () => Promise<boolean>;
  clearError: () => void;
}

export const useWishlistStore = create<WishlistState>((set, get) => ({
  items: [],
  totalItems: 0,
  loadingState: 'idle',
  error: null,
  wishlistCache: {},

  getWishlist: async (params?): Promise<void> => {
    set({ loadingState: 'loading', error: null });
    try {
      const repo = container().wishlistRepository;
      const result = await repo.getWishlist(params);
      if (result.success) {
        // Build cache from items
        const cache: Record<string, boolean> = {};
        result.data.forEach(item => {
          const id = item.listing?._id;
          if (id) cache[id] = true;
        });
        set({
          items: result.data,
          totalItems: result.totalItems,
          wishlistCache: cache,
          loadingState: 'success',
        });
      } else {
        set({ loadingState: 'error', error: 'Không thể tải danh sách yêu thích' });
      }
    } catch (error) {
      set({ loadingState: 'error', error: error instanceof Error ? error.message : 'Lỗi tải wishlist' });
    }
  },

  addToWishlist: async (listingId: string): Promise<boolean> => {
    try {
      const repo = container().wishlistRepository;
      const result = await repo.addToWishlist(listingId);
      if (result.success) {
        set(s => ({
          wishlistCache: { ...s.wishlistCache, [listingId]: true },
          totalItems: s.totalItems + 1,
        }));
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },

  removeFromWishlist: async (listingId: string): Promise<boolean> => {
    try {
      const repo = container().wishlistRepository;
      const result = await repo.removeFromWishlist(listingId);
      if (result.success) {
        set(s => {
          const cache = { ...s.wishlistCache };
          delete cache[listingId];
          return {
            items: s.items.filter(i => i.listing?._id !== listingId),
            wishlistCache: cache,
            totalItems: Math.max(0, s.totalItems - 1),
          };
        });
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },

  checkInWishlist: async (listingId: string): Promise<boolean> => {
    const cached = get().wishlistCache[listingId];
    if (cached !== undefined) return cached;
    
    try {
      const repo = container().wishlistRepository;
      const inWishlist = await repo.checkInWishlist(listingId);
      set(s => ({ wishlistCache: { ...s.wishlistCache, [listingId]: inWishlist } }));
      return inWishlist;
    } catch {
      return false;
    }
  },

  getWishlistCount: async (): Promise<number> => {
    try {
      const repo = container().wishlistRepository;
      const count = await repo.getWishlistCount();
      set({ totalItems: count });
      return count;
    } catch {
      return 0;
    }
  },

  clearWishlist: async (): Promise<boolean> => {
    try {
      const repo = container().wishlistRepository;
      const result = await repo.clearWishlist();
      if (result.success) {
        set({ items: [], totalItems: 0, wishlistCache: {} });
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },

  clearError: () => set({ error: null }),
}));

// Selectors
export const useWishlistItems = () => useWishlistStore(s => s.items);
export const useWishlistCount = () => useWishlistStore(s => s.totalItems);
export const useWishlistLoading = () => useWishlistStore(s => s.loadingState === 'loading');
