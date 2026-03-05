import { BaseApiClient } from './BaseApiClient';
import { ENDPOINTS } from '../../config/api';
import { ListingModel } from '../models/ListingModel';

// Response models
export interface WishlistItemResponseModel {
  _id: string;
  listingId: ListingModel | string;
  addedAt: string;
}

export interface WishlistListResponseModel {
  success: boolean;
  data: WishlistItemResponseModel[];
  totalItems: number;
  message?: string;
}

export interface WishlistCheckResponseModel {
  success: boolean;
  inWishlist: boolean;
}

export interface WishlistCountResponseModel {
  success: boolean;
  count: number;
}

export class WishlistApiClient extends BaseApiClient {
  /**
   * Get user's wishlist
   */
  async getWishlist(params?: {
    page?: number;
    limit?: number;
    sort?: string;
  }): Promise<WishlistListResponseModel> {
    return this.get(ENDPOINTS.WISHLIST.LIST, params);
  }

  /**
   * Add listing to wishlist
   */
  async addToWishlist(listingId: string): Promise<{ success: boolean; message: string }> {
    return this.post(ENDPOINTS.WISHLIST.ADD, { listingId });
  }

  /**
   * Remove listing from wishlist
   */
  async removeFromWishlist(listingId: string): Promise<{ success: boolean; message: string }> {
    return this.delete(ENDPOINTS.WISHLIST.REMOVE(listingId));
  }

  /**
   * Check if listing is in wishlist
   */
  async checkInWishlist(listingId: string): Promise<WishlistCheckResponseModel> {
    return this.get(ENDPOINTS.WISHLIST.CHECK(listingId));
  }

  /**
   * Get wishlist count
   */
  async getWishlistCount(): Promise<WishlistCountResponseModel> {
    return this.get(ENDPOINTS.WISHLIST.COUNT);
  }

  /**
   * Clear all wishlist items
   */
  async clearWishlist(): Promise<{ success: boolean; message: string }> {
    return this.delete(ENDPOINTS.WISHLIST.CLEAR);
  }
}
