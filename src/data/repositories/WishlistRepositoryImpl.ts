import { WishlistApiClient, WishlistItemResponseModel } from '../apis/WishlistApiClient';
import { Listing } from '../../domain/entities/Listing';
import { ApiResponse, PaginatedResponse } from '../../domain/entities/Common';

// Simplified wishlist item for presentation layer
export interface WishlistEntry {
  _id: string;
  listing: Partial<Listing>;
  addedAt: Date;
}

export class WishlistRepositoryImpl {
  constructor(private wishlistApiClient: WishlistApiClient) {}

  async getWishlist(params?: {
    page?: number;
    limit?: number;
    sort?: string;
  }): Promise<{ success: boolean; data: WishlistEntry[]; totalItems: number }> {
    try {
      const response = await this.wishlistApiClient.getWishlist(params);
      if (response.success) {
        const items = response.data.map(item => this.mapToEntry(item));
        return { success: true, data: items, totalItems: response.totalItems };
      }
      return { success: false, data: [], totalItems: 0 };
    } catch (error) {
      return { success: false, data: [], totalItems: 0 };
    }
  }

  async addToWishlist(listingId: string): Promise<ApiResponse> {
    try {
      return await this.wishlistApiClient.addToWishlist(listingId);
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : 'Failed to add to wishlist' };
    }
  }

  async removeFromWishlist(listingId: string): Promise<ApiResponse> {
    try {
      return await this.wishlistApiClient.removeFromWishlist(listingId);
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : 'Failed to remove from wishlist' };
    }
  }

  async checkInWishlist(listingId: string): Promise<boolean> {
    try {
      const response = await this.wishlistApiClient.checkInWishlist(listingId);
      return response.success && response.inWishlist;
    } catch {
      return false;
    }
  }

  async getWishlistCount(): Promise<number> {
    try {
      const response = await this.wishlistApiClient.getWishlistCount();
      return response.success ? response.count : 0;
    } catch {
      return 0;
    }
  }

  async clearWishlist(): Promise<ApiResponse> {
    try {
      return await this.wishlistApiClient.clearWishlist();
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : 'Failed to clear wishlist' };
    }
  }

  private mapToEntry(item: WishlistItemResponseModel): WishlistEntry {
    const listing = typeof item.listingId === 'string'
      ? { _id: item.listingId } as Partial<Listing>
      : {
          _id: (item.listingId as any)._id,
          title: (item.listingId as any).title,
          description: (item.listingId as any).description,
          type: (item.listingId as any).type,
          status: (item.listingId as any).status,
          generalInfo: (item.listingId as any).generalInfo,
          pricing: (item.listingId as any).pricing,
          media: (item.listingId as any).media,
          location: (item.listingId as any).location,
          views: (item.listingId as any).views,
          saves: (item.listingId as any).saves,
          createdAt: new Date((item.listingId as any).createdAt),
        } as Partial<Listing>;

    return {
      _id: item._id,
      listing,
      addedAt: new Date(item.addedAt),
    };
  }
}
