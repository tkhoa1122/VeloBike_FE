/**
 * VeloBike React Native App - Foundation Export Index
 * 
 * This file exports all the foundation components following Clean Architecture pattern
 */

// =============================================================================
// DOMAIN LAYER EXPORTS
// =============================================================================

// Entities
export * from './domain/entities/User';
export * from './domain/entities/Listing';
export * from './domain/entities/Order';
export * from './domain/entities/Message';
export * from './domain/entities/Notification';
export * from './domain/entities/Review';
export * from './domain/entities/Wishlist';
export * from './domain/entities/Common';

// Repository Interfaces
export * from './domain/repositories/AuthRepository';
export * from './domain/repositories/ListingRepository';
export * from './domain/repositories/OrderRepository';
export * from './domain/repositories/MessageRepository';
export * from './domain/repositories/WishlistRepository';
export * from './domain/repositories/NotificationRepository';
export * from './domain/repositories/ReviewRepository';
export * from './domain/repositories/UploadRepository';
export * from './domain/repositories/PaymentRepository';

// Use Cases
export * from './domain/usecases/auth/LoginUseCase';
export * from './domain/usecases/auth/GoogleLoginUseCase';
export * from './domain/usecases/auth/RegisterUseCase';
export * from './domain/usecases/auth/GetCurrentUserUseCase';
export * from './domain/usecases/auth/LogoutUseCase';
export * from './domain/usecases/listings/GetListingsUseCase';
export * from './domain/usecases/listings/CreateListingUseCase';

// =============================================================================
// DATA LAYER EXPORTS
// =============================================================================

// Models (DTOs)
export * from './data/models/UserModel';
export * from './data/models/ListingModel';
export * from './data/models/OrderModel';

// API Clients
export * from './data/apis/BaseApiClient';
export * from './data/apis/AuthApiClient';
export * from './data/apis/ListingApiClient';
export * from './data/apis/OrderApiClient';

// Repository Implementations
export * from './data/repositories/AuthRepositoryImpl';
export * from './data/repositories/ListingRepositoryImpl';

// =============================================================================
// PRESENTATION LAYER EXPORTS
// =============================================================================

// Stores (Zustand)
export * from './presentation/viewmodels/AuthStore';
export * from './presentation/viewmodels/ListingStore';
export * from './presentation/viewmodels/AppStore';

// =============================================================================
// SERVICES EXPORTS
// =============================================================================

export * from './services/GoogleAuthService';

// =============================================================================
// DEPENDENCY INJECTION EXPORTS
// =============================================================================

export * from './di/Container';

// =============================================================================
// CONFIG & UTILS EXPORTS
// =============================================================================

// Configuration
export * from './config/api';
export * from './config/constants';
export * from './config/environment';

// Utilities
export * from './utils/formatters';
export * from './utils/validators';
export * from './utils/helpers';

// =============================================================================
// CONVENIENCE RE-EXPORTS
// =============================================================================

// Most commonly used exports for easy importing
export {
  // DI Container
  container,
  useCase,
  repository,
  DIContainer,
} from './di/Container';

export {
  // Primary Stores
  useAuthStore,
} from './presentation/viewmodels/AuthStore';

export {
  useListingStore,
} from './presentation/viewmodels/ListingStore';

export {
  useAppStore,
} from './presentation/viewmodels/AppStore';

export {
  // Config
  API_CONFIG,
  ENDPOINTS,
} from './config/api';

export {
  APP_CONFIG,
  BIKE_TYPES,
  BIKE_CONDITIONS,
  USER_ROLES,
  ORDER_STATUS,
} from './config/constants';

export {
  ENV,
  APP_FEATURES,
} from './config/environment';

export {
  // Common Formatters
  formatCurrency,
  formatDate,
  formatRelativeTime,
  formatBikeType,
  formatBikeCondition,
  formatOrderStatus,
} from './utils/formatters';

export {
  // Common Validators
  isValidEmail,
  isValidPhoneNumber,
  validatePassword,
  isValidPrice,
} from './utils/validators';

export {
  // Common Helpers
  debounce,
  throttle,
  isEmpty,
  calculateDistance,
} from './utils/helpers';

export {
  // Google Auth Service
  GoogleAuthService,
} from './services/GoogleAuthService';

export default {
  // Domain
  entities: {},
  repositories: {},
  usecases: {},
  
  // Data
  apis: {},
  models: {},
  
  // Presentation
  stores: {},
  
  // Infrastructure
  di: {},
  config: {},
  utils: {},
};