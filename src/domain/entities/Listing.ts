import { BikeType, BikeCondition, BikeSize, ListingStatus } from '../../config/constants';
import { User } from './User';

export interface Listing {
  _id: string;
  title: string;
  description: string;
  type: BikeType;
  status: ListingStatus;
  
  generalInfo: BikeGeneralInfo;
  specs: BikeSpecs;
  geometry?: BikeGeometry;
  pricing: Pricing;
  media: ListingMedia;
  location: ListingLocation;
  
  // Seller info
  sellerId: string | User; // Can be populated
  
  // Engagement metrics
  views: number;
  saves: number; // wishlist count
  
  // Premium features
  boostedUntil?: Date;
  featured: boolean;
  badge?: string;
  
  // Inspection
  inspectionRequired: boolean;
  inspectionScore?: number;
  inspectionReportId?: string;
  
  // Business logic
  isActive: boolean;
  isAvailable: boolean;
  soldAt?: Date;
  soldToUserId?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface BikeGeneralInfo {
  brand: string;
  model: string;
  year: number;
  size: string; // BikeSize or custom
  condition: BikeCondition;
  
  // Additional info
  color?: string;
  serialNumber?: string;
  assemblyDate?: Date;
  lastServiceDate?: Date;
}

export interface BikeSpecs {
  frameMaterial?: string; // Carbon, Aluminum, Steel, Titanium
  groupset?: string; // Shimano 105, SRAM Rival, etc.
  wheelset?: string;
  brakeType?: string; // Rim, Disc, Hydraulic
  weight?: number; // kg
  
  // Drivetrain
  cassette?: string;
  chainring?: string;
  chain?: string;
  
  // Components
  saddle?: string;
  handlebar?: string;
  stem?: string;
  seatpost?: string;
  pedals?: string;
  
  // Wheels & Tires
  frontWheel?: string;
  rearWheel?: string;
  frontTire?: string;
  rearTire?: string;
  
  // Electronics (for E-bikes)
  motor?: string;
  battery?: string;
  range?: number; // km
}

export interface BikeGeometry {
  stack?: number;
  reach?: number;
  topTubeLength?: number;
  seatTubeLength?: number;
  headTubeAngle?: number;
  seatTubeAngle?: number;
  wheelbase?: number;
  chainstayLength?: number;
}

export interface Pricing {
  amount: number;
  currency: string;
  originalPrice?: number; // for comparison
  negotiable: boolean;
  
  // Pricing breakdown (if seller is transparent)
  components?: {
    frame: number;
    groupset: number;
    wheels: number;
    accessories: number;
  };
}

export interface ListingMedia {
  thumbnails: string[]; // Main images
  spin360Urls?: string[]; // 360-degree view
  videoUrl?: string;
  
  // For organization
  imageGroups?: {
    overview: string[];
    details: string[];
    components: string[];
    defects: string[];
  };
}

export interface ListingLocation {
  coordinates: [number, number]; // [longitude, latitude]
  address: string;
  showExactLocation: boolean;
  
  // For shipping
  pickupAvailable: boolean;
  shippingAvailable: boolean;
  meetupLocations?: string[];
}

// For creating/updating listings
export interface CreateListingData {
  title: string;
  description: string;
  type: BikeType;
  generalInfo: BikeGeneralInfo;
  specs: BikeSpecs;
  geometry?: BikeGeometry;
  pricing: Pricing;
  media: {
    thumbnails: string[];
    spin360Urls?: string[];
    videoUrl?: string;
  };
  location: ListingLocation;
  inspectionRequired: boolean;
}

export interface UpdateListingData extends Partial<CreateListingData> {
  status?: ListingStatus;
}

// For filtering/searching
export interface ListingFilters {
  type?: BikeType | 'ALL';
  brand?: string;
  condition?: BikeCondition;
  minPrice?: number;
  maxPrice?: number;
  location?: string;
  size?: BikeSize[];
  materials?: string[];
  yearRange?: {
    min: number;
    max: number;
  };
  
  // Advanced filters
  hasInspection?: boolean;
  minInspectionScore?: number;
  isFeatured?: boolean;
  sellerId?: string;
  
  // Location-based
  nearCoordinates?: [number, number];
  radius?: number; // km
}

export interface ListingSortOptions {
  field: 'createdAt' | 'price' | 'views' | 'inspectionScore';
  order: 'asc' | 'desc';
}

export interface ListingSearchParams {
  query?: string;
  filters?: ListingFilters;
  sort?: ListingSortOptions;
  page: number;
  limit: number;
}

// Boost listing feature
export interface BoostListingParams {
  listingId: string;
  days: number;
}