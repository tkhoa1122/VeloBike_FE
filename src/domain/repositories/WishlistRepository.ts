import { 
  Wishlist, 
  WishlistItem, 
  AddToWishlistData,
  UpdateWishlistItemData,
  WishlistSearchParams,
  WishlistStats 
} from '../entities/Wishlist';
import { ApiResponse, PaginatedResponse } from '../entities/Common';

export interface WishlistRepository {
  // Wishlist management
  getWishlist(params?: WishlistSearchParams): Promise<PaginatedResponse<WishlistItem>>;
  addToWishlist(data: AddToWishlistData): Promise<ApiResponse<WishlistItem>>;
  removeFromWishlist(listingId: string): Promise<ApiResponse>;
  updateWishlistItem(listingId: string, data: UpdateWishlistItemData): Promise<ApiResponse<WishlistItem>>;
  clearWishlist(): Promise<ApiResponse>;
  
  // Check operations
  isInWishlist(listingId: string): Promise<ApiResponse<{ inWishlist: boolean }>>;
  
  // Analytics
  getWishlistStats(): Promise<ApiResponse<WishlistStats>>;
  
  // Import/Export
  exportWishlist(): Promise<ApiResponse<{ url: string }>>;
  importWishlist(data: any[]): Promise<ApiResponse>;
}