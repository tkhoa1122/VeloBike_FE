import { User } from './User';
import { Listing } from './Listing';

export interface Wishlist {
  _id: string;
  userId: string | User;
  
  items: WishlistItem[];
  
  // Organization
  tags?: string[]; // Custom tags for organization
  isPublic: boolean;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface WishlistItem {
  listingId: string | Listing;
  addedAt: Date;
  
  // User notes
  notes?: string;
  tags?: string[];
  
  // Price tracking
  priceWhenAdded: number;
  priceAlertEnabled: boolean;
  targetPrice?: number;
  
  // Notifications
  notifyPriceChange: boolean;
  notifyStatusChange: boolean; // Available, sold, etc.
}

// Operations
export interface AddToWishlistData {
  listingId: string;
  notes?: string;
  tags?: string[];
  priceAlertEnabled?: boolean;
  targetPrice?: number;
}

export interface UpdateWishlistItemData {
  notes?: string;
  tags?: string[];
  priceAlertEnabled?: boolean;
  targetPrice?: number;
  notifyPriceChange?: boolean;
  notifyStatusChange?: boolean;
}

export interface WishlistFilters {
  tags?: string[];
  priceRange?: {
    min: number;
    max: number;
  };
  bikeType?: string;
  condition?: string;
  location?: string;
  hasNotes?: boolean;
  hasPriceAlert?: boolean;
}

export interface WishlistSearchParams {
  filters?: WishlistFilters;
  sort?: {
    field: 'addedAt' | 'price' | 'priceChange';
    order: 'asc' | 'desc';
  };
  page: number;
  limit: number;
}

// Wishlist analytics
export interface WishlistStats {
  totalItems: number;
  averagePrice: number;
  totalValue: number;
  
  // Price tracking
  itemsWithPriceAlerts: number;
  priceDropsThisWeek: number;
  bestDeal: {
    listingId: string;
    originalPrice: number;
    currentPrice: number;
    discount: number; // percentage
  } | null;
  
  // Categories
  categoryCounts: Record<string, number>; // bike type counts
  
  // Activity
  recentlyAdded: number; // items added in last 7 days
  recentlyViewed: number; // items viewed in last 7 days
}

// Saved searches (related to wishlist)
export interface SavedSearch {
  _id: string;
  userId: string;
  
  name: string;
  searchQuery: {
    text?: string;
    filters: Record<string, any>;
  };
  
  // Notifications
  notifyNewResults: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  
  // Statistics
  resultCount: number;
  lastChecked: Date;
  
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSavedSearchData {
  name: string;
  searchQuery: SavedSearch['searchQuery'];
  notifyNewResults?: boolean;
  emailNotifications?: boolean;
  pushNotifications?: boolean;
}