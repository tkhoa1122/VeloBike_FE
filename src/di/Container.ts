/**
 * Dependency Injection Container
 * Quản lý và khởi tạo tất cả dependencies theo Clean Architecture pattern
 */

// API Clients
import { AuthApiClient } from '../data/apis/AuthApiClient';
import { ListingApiClient } from '../data/apis/ListingApiClient';
import { OrderApiClient } from '../data/apis/OrderApiClient';

// Repository Implementations
import { AuthRepositoryImpl } from '../data/repositories/AuthRepositoryImpl';
import { ListingRepositoryImpl } from '../data/repositories/ListingRepositoryImpl';

// Use Cases
import { LoginUseCase } from '../domain/usecases/auth/LoginUseCase';
import { GoogleLoginUseCase } from '../domain/usecases/auth/GoogleLoginUseCase';
import { RegisterUseCase } from '../domain/usecases/auth/RegisterUseCase';
import { GetCurrentUserUseCase } from '../domain/usecases/auth/GetCurrentUserUseCase';
import { LogoutUseCase } from '../domain/usecases/auth/LogoutUseCase';
import { GetListingsUseCase } from '../domain/usecases/listings/GetListingsUseCase';
import { CreateListingUseCase } from '../domain/usecases/listings/CreateListingUseCase';

// Repository Interfaces
import { AuthRepository } from '../domain/repositories/AuthRepository';
import { ListingRepository } from '../domain/repositories/ListingRepository';

export class DIContainer {
  private static instance: DIContainer;

  // API Clients
  private _authApiClient!: AuthApiClient;
  private _listingApiClient!: ListingApiClient;
  private _orderApiClient!: OrderApiClient;

  // Repository Implementations
  private _authRepository!: AuthRepositoryImpl;
  private _listingRepository!: ListingRepositoryImpl;

  // Use Cases
  private _loginUseCase!: LoginUseCase;
  private _googleLoginUseCase!: GoogleLoginUseCase;
  private _registerUseCase!: RegisterUseCase;
  private _getCurrentUserUseCase!: GetCurrentUserUseCase;
  private _logoutUseCase!: LogoutUseCase;
  private _getListingsUseCase!: GetListingsUseCase;
  private _createListingUseCase!: CreateListingUseCase;

  private constructor() {
    this.initializeApiClients();
    this.initializeRepositories();
    this.initializeUseCases();
  }

  /**
   * Singleton pattern - Get instance
   */
  static getInstance(): DIContainer {
    if (!DIContainer.instance) {
      DIContainer.instance = new DIContainer();
    }
    return DIContainer.instance;
  }

  /**
   * Initialize API Clients
   */
  private initializeApiClients(): void {
    this._authApiClient = new AuthApiClient();
    this._listingApiClient = new ListingApiClient();
    this._orderApiClient = new OrderApiClient();
  }

  /**
   * Initialize Repository Implementations
   */
  private initializeRepositories(): void {
    this._authRepository = new AuthRepositoryImpl(this._authApiClient);
    this._listingRepository = new ListingRepositoryImpl(this._listingApiClient);
  }

  /**
   * Initialize Use Cases
   */
  private initializeUseCases(): void {
    // Auth use cases
    this._loginUseCase = new LoginUseCase(this._authRepository);
    this._googleLoginUseCase = new GoogleLoginUseCase(this._authRepository);
    this._registerUseCase = new RegisterUseCase(this._authRepository);
    this._getCurrentUserUseCase = new GetCurrentUserUseCase(this._authRepository);
    this._logoutUseCase = new LogoutUseCase(this._authRepository);

    // Listing use cases
    this._getListingsUseCase = new GetListingsUseCase(this._listingRepository);
    this._createListingUseCase = new CreateListingUseCase(this._listingRepository);
  }

  /**
   * Reset container (useful for testing)
   */
  static reset(): void {
    DIContainer.instance = null as any;
  }

  // =============================================================================
  // PUBLIC GETTERS - Use these in presentation layer
  // =============================================================================

  // API Clients (if needed directly)
  get authApiClient(): AuthApiClient {
    return this._authApiClient;
  }

  get listingApiClient(): ListingApiClient {
    return this._listingApiClient;
  }

  get orderApiClient(): OrderApiClient {
    return this._orderApiClient;
  }

  // Repository interfaces (for direct use if needed)
  get authRepository(): AuthRepository {
    return this._authRepository;
  }

  get listingRepository(): ListingRepository {
    return this._listingRepository;
  }

  // Auth Use Cases
  get loginUseCase(): LoginUseCase {
    return this._loginUseCase;
  }

  get googleLoginUseCase(): GoogleLoginUseCase {
    return this._googleLoginUseCase;
  }

  get registerUseCase(): RegisterUseCase {
    return this._registerUseCase;
  }

  get getCurrentUserUseCase(): GetCurrentUserUseCase {
    return this._getCurrentUserUseCase;
  }

  get logoutUseCase(): LogoutUseCase {
    return this._logoutUseCase;
  }

  // Listing Use Cases
  get getListingsUseCase(): GetListingsUseCase {
    return this._getListingsUseCase;
  }

  get createListingUseCase(): CreateListingUseCase {
    return this._createListingUseCase;
  }

  // =============================================================================
  // LAZY INITIALIZATION HELPERS (for future use cases)
  // =============================================================================

  /**
   * Get or create use case instance
   */
  getUseCase<T>(UseCaseClass: new (...args: any[]) => T, ...dependencies: any[]): T {
    // This could be enhanced to cache instances
    return new UseCaseClass(...dependencies);
  }

  /**
   * Register external dependencies (for testing or different environments)
   */
  registerAuthRepository(repository: AuthRepository): void {
    this._authRepository = repository as AuthRepositoryImpl;
    // Re-initialize dependent use cases
    this._loginUseCase = new LoginUseCase(this._authRepository);
    this._googleLoginUseCase = new GoogleLoginUseCase(this._authRepository);
    this._registerUseCase = new RegisterUseCase(this._authRepository);
    this._getCurrentUserUseCase = new GetCurrentUserUseCase(this._authRepository);
    this._logoutUseCase = new LogoutUseCase(this._authRepository);
  }

  registerListingRepository(repository: ListingRepository): void {
    this._listingRepository = repository as ListingRepositoryImpl;
    // Re-initialize dependent use cases
    this._getListingsUseCase = new GetListingsUseCase(this._listingRepository);
    this._createListingUseCase = new CreateListingUseCase(this._listingRepository);
  }
}

// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================

/**
 * Get DI Container instance
 */
export const container = () => DIContainer.getInstance();

/**
 * Get specific use case
 */
export const useCase = {
  // Auth
  login: () => container().loginUseCase,
  googleLogin: () => container().googleLoginUseCase,
  register: () => container().registerUseCase,
  getCurrentUser: () => container().getCurrentUserUseCase,
  logout: () => container().logoutUseCase,
  
  // Listings
  getListings: () => container().getListingsUseCase,
  createListing: () => container().createListingUseCase,
};

/**
 * Get repository
 */
export const repository = {
  auth: () => container().authRepository,
  listing: () => container().listingRepository,
};

export default DIContainer;