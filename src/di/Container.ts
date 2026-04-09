/**
 * Dependency Injection Container
 * Quản lý và khởi tạo tất cả dependencies theo Clean Architecture pattern
 */

// API Clients
import { AuthApiClient } from '../data/apis/AuthApiClient';
import { ListingApiClient } from '../data/apis/ListingApiClient';
import { OrderApiClient } from '../data/apis/OrderApiClient';
import { WishlistApiClient } from '../data/apis/WishlistApiClient';
import { MessageApiClient } from '../data/apis/MessageApiClient';
import { NotificationApiClient } from '../data/apis/NotificationApiClient';
import { PaymentApiClient } from '../data/apis/PaymentApiClient';
import { ReviewApiClient } from '../data/apis/ReviewApiClient';
import { InspectionApiClient } from '../data/apis/InspectionApiClient';
import { UploadApiClient } from '../data/apis/UploadApiClient';
import { DisputeApiClient } from '../data/apis/DisputeApiClient';
import { WalletApiClient } from '../data/apis/WalletApiClient';

// Repository Implementations
import { AuthRepositoryImpl } from '../data/repositories/AuthRepositoryImpl';
import { ListingRepositoryImpl } from '../data/repositories/ListingRepositoryImpl';
import { OrderRepositoryImpl } from '../data/repositories/OrderRepositoryImpl';
import { WishlistRepositoryImpl } from '../data/repositories/WishlistRepositoryImpl';
import { MessageRepositoryImpl } from '../data/repositories/MessageRepositoryImpl';
import { NotificationRepositoryImpl } from '../data/repositories/NotificationRepositoryImpl';
import { PaymentRepositoryImpl } from '../data/repositories/PaymentRepositoryImpl';
import { ReviewRepositoryImpl } from '../data/repositories/ReviewRepositoryImpl';
import { InspectionRepositoryImpl } from '../data/repositories/InspectionRepositoryImpl';
import { UploadRepositoryImpl } from '../data/repositories/UploadRepositoryImpl';
import { DisputeRepositoryImpl } from '../data/repositories/DisputeRepositoryImpl';

// Use Cases
import { LoginUseCase } from '../domain/usecases/auth/LoginUseCase';
import { GoogleLoginUseCase } from '../domain/usecases/auth/GoogleLoginUseCase';
import { RegisterUseCase } from '../domain/usecases/auth/RegisterUseCase';
import { GetCurrentUserUseCase } from '../domain/usecases/auth/GetCurrentUserUseCase';
import { LogoutUseCase } from '../domain/usecases/auth/LogoutUseCase';
import { VerifyEmailUseCase } from '../domain/usecases/auth/VerifyEmailUseCase';
import { ResendVerificationUseCase } from '../domain/usecases/auth/ResendVerificationUseCase';
import { GetListingsUseCase } from '../domain/usecases/listings/GetListingsUseCase';
import { CreateListingUseCase } from '../domain/usecases/listings/CreateListingUseCase';
import { CreatePaymentLinkUseCase } from '../domain/usecases/payment/CreatePaymentLinkUseCase';
import { GetWalletBalanceUseCase } from '../domain/usecases/payment/GetWalletBalanceUseCase';
import { CreateReviewUseCase, GetReviewsForUserUseCase, GetMyReviewsUseCase } from '../domain/usecases/review';
import { GetInspectionByOrderIdUseCase, GetInspectionByListingIdUseCase } from '../domain/usecases/inspection';
import { UploadFileUseCase, UploadMultipleFilesUseCase } from '../domain/usecases/upload';
import { CreateDisputeUseCase, GetMyDisputesUseCase, AddDisputeCommentUseCase } from '../domain/usecases/dispute';

// Repository Interfaces
import { AuthRepository } from '../domain/repositories/AuthRepository';
import { ListingRepository } from '../domain/repositories/ListingRepository';
import { PaymentRepository } from '../domain/repositories/PaymentRepository';
import { ReviewRepository } from '../domain/repositories/ReviewRepository';
import { InspectionRepository } from '../domain/repositories/InspectionRepository';
import { UploadRepository } from '../domain/repositories/UploadRepository';
import { DisputeRepository } from '../domain/repositories/DisputeRepository';

export class DIContainer {
  private static instance: DIContainer;

  // API Clients
  private _authApiClient!: AuthApiClient;
  private _listingApiClient!: ListingApiClient;
  private _orderApiClient!: OrderApiClient;
  private _wishlistApiClient!: WishlistApiClient;
  private _messageApiClient!: MessageApiClient;
  private _notificationApiClient!: NotificationApiClient;
  private _paymentApiClient!: PaymentApiClient;
  private _reviewApiClient!: ReviewApiClient;
  private _inspectionApiClient!: InspectionApiClient;
  private _uploadApiClient!: UploadApiClient;
  private _disputeApiClient!: DisputeApiClient;
  private _walletApiClient!: WalletApiClient;

  // Repository Implementations
  private _authRepository!: AuthRepositoryImpl;
  private _listingRepository!: ListingRepositoryImpl;
  private _orderRepository!: OrderRepositoryImpl;
  private _wishlistRepository!: WishlistRepositoryImpl;
  private _messageRepository!: MessageRepositoryImpl;
  private _notificationRepository!: NotificationRepositoryImpl;
  private _paymentRepository!: PaymentRepositoryImpl;
  private _reviewRepository!: ReviewRepositoryImpl;
  private _inspectionRepository!: InspectionRepositoryImpl;
  private _uploadRepository!: UploadRepositoryImpl;
  private _disputeRepository!: DisputeRepositoryImpl;

  // Use Cases
  private _loginUseCase!: LoginUseCase;
  private _googleLoginUseCase!: GoogleLoginUseCase;
  private _registerUseCase!: RegisterUseCase;
  private _getCurrentUserUseCase!: GetCurrentUserUseCase;
  private _logoutUseCase!: LogoutUseCase;
  private _verifyEmailUseCase!: VerifyEmailUseCase;
  private _resendVerificationUseCase!: ResendVerificationUseCase;
  private _getListingsUseCase!: GetListingsUseCase;
  private _createListingUseCase!: CreateListingUseCase;
  private _createPaymentLinkUseCase!: CreatePaymentLinkUseCase;
  private _getWalletBalanceUseCase!: GetWalletBalanceUseCase;
  private _createReviewUseCase!: CreateReviewUseCase;
  private _getReviewsForUserUseCase!: GetReviewsForUserUseCase;
  private _getMyReviewsUseCase!: GetMyReviewsUseCase;
  private _getInspectionByOrderIdUseCase!: GetInspectionByOrderIdUseCase;
  private _getInspectionByListingIdUseCase!: GetInspectionByListingIdUseCase;
  private _uploadFileUseCase!: UploadFileUseCase;
  private _uploadMultipleFilesUseCase!: UploadMultipleFilesUseCase;
  private _createDisputeUseCase!: CreateDisputeUseCase;
  private _getMyDisputesUseCase!: GetMyDisputesUseCase;
  private _addDisputeCommentUseCase!: AddDisputeCommentUseCase;

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
    this._wishlistApiClient = new WishlistApiClient();
    this._messageApiClient = new MessageApiClient();
    this._notificationApiClient = new NotificationApiClient();
    this._paymentApiClient = new PaymentApiClient();
    this._reviewApiClient = new ReviewApiClient();
    this._inspectionApiClient = new InspectionApiClient();
    this._uploadApiClient = new UploadApiClient();
    this._disputeApiClient = new DisputeApiClient();
    this._walletApiClient = new WalletApiClient();
  }

  /**
   * Initialize Repository Implementations
   */
  private initializeRepositories(): void {
    this._authRepository = new AuthRepositoryImpl(this._authApiClient);
    this._listingRepository = new ListingRepositoryImpl(this._listingApiClient);
    this._orderRepository = new OrderRepositoryImpl(this._orderApiClient);
    this._wishlistRepository = new WishlistRepositoryImpl(this._wishlistApiClient);
    this._messageRepository = new MessageRepositoryImpl(this._messageApiClient);
    this._notificationRepository = new NotificationRepositoryImpl(this._notificationApiClient);
    this._paymentRepository = new PaymentRepositoryImpl(this._paymentApiClient);
    this._reviewRepository = new ReviewRepositoryImpl(this._reviewApiClient);
    this._inspectionRepository = new InspectionRepositoryImpl(this._inspectionApiClient);
    this._uploadRepository = new UploadRepositoryImpl(this._uploadApiClient);
    this._disputeRepository = new DisputeRepositoryImpl(this._disputeApiClient);
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
    this._verifyEmailUseCase = new VerifyEmailUseCase(this._authRepository);
    this._resendVerificationUseCase = new ResendVerificationUseCase(this._authRepository);

    // Listing use cases
    this._getListingsUseCase = new GetListingsUseCase(this._listingRepository);
    this._createListingUseCase = new CreateListingUseCase(this._listingRepository);

    // Payment use cases
    this._createPaymentLinkUseCase = new CreatePaymentLinkUseCase(this._paymentRepository);
    this._getWalletBalanceUseCase = new GetWalletBalanceUseCase(this._paymentRepository);

    // Review use cases
    this._createReviewUseCase = new CreateReviewUseCase(this._reviewRepository);
    this._getReviewsForUserUseCase = new GetReviewsForUserUseCase(this._reviewRepository);
    this._getMyReviewsUseCase = new GetMyReviewsUseCase(this._reviewRepository);

    // Inspection use cases
    this._getInspectionByOrderIdUseCase = new GetInspectionByOrderIdUseCase(this._inspectionRepository);
    this._getInspectionByListingIdUseCase = new GetInspectionByListingIdUseCase(this._inspectionRepository);

    // Upload use cases
    this._uploadFileUseCase = new UploadFileUseCase(this._uploadRepository);
    this._uploadMultipleFilesUseCase = new UploadMultipleFilesUseCase(this._uploadRepository);

    // Dispute use cases
    this._createDisputeUseCase = new CreateDisputeUseCase(this._disputeRepository);
    this._getMyDisputesUseCase = new GetMyDisputesUseCase(this._disputeRepository);
    this._addDisputeCommentUseCase = new AddDisputeCommentUseCase(this._disputeRepository);
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

  get reviewApiClient(): ReviewApiClient {
    return this._reviewApiClient;
  }

  get uploadApiClient(): UploadApiClient {
    return this._uploadApiClient;
  }

  // Repository interfaces (for direct use if needed)
  get authRepository(): AuthRepository {
    return this._authRepository;
  }

  get listingRepository(): ListingRepository {
    return this._listingRepository;
  }

  get orderRepository(): OrderRepositoryImpl {
    return this._orderRepository;
  }

  get wishlistRepository(): WishlistRepositoryImpl {
    return this._wishlistRepository;
  }

  get messageRepository(): MessageRepositoryImpl {
    return this._messageRepository;
  }

  get notificationRepository(): NotificationRepositoryImpl {
    return this._notificationRepository;
  }

  get paymentRepository(): PaymentRepository {
    return this._paymentRepository;
  }

  get reviewRepository(): ReviewRepository {
    return this._reviewRepository;
  }

  get inspectionRepository(): InspectionRepository {
    return this._inspectionRepository;
  }

  get uploadRepository(): UploadRepository {
    return this._uploadRepository;
  }

  get disputeRepository(): DisputeRepository {
    return this._disputeRepository;
  }

  get walletApiClient(): WalletApiClient {
    return this._walletApiClient;
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

  get verifyEmailUseCase(): VerifyEmailUseCase {
    return this._verifyEmailUseCase;
  }

  get resendVerificationUseCase(): ResendVerificationUseCase {
    return this._resendVerificationUseCase;
  }

  // Listing Use Cases
  get getListingsUseCase(): GetListingsUseCase {
    return this._getListingsUseCase;
  }

  get createListingUseCase(): CreateListingUseCase {
    return this._createListingUseCase;
  }

  // Payment Use Cases
  get createPaymentLinkUseCase(): CreatePaymentLinkUseCase {
    return this._createPaymentLinkUseCase;
  }

  get getWalletBalanceUseCase(): GetWalletBalanceUseCase {
    return this._getWalletBalanceUseCase;
  }

  // Review Use Cases
  get createReviewUseCase(): CreateReviewUseCase {
    return this._createReviewUseCase;
  }

  get getReviewsForUserUseCase(): GetReviewsForUserUseCase {
    return this._getReviewsForUserUseCase;
  }

  get getMyReviewsUseCase(): GetMyReviewsUseCase {
    return this._getMyReviewsUseCase;
  }

  // Inspection Use Cases
  get getInspectionByOrderIdUseCase(): GetInspectionByOrderIdUseCase {
    return this._getInspectionByOrderIdUseCase;
  }

  get getInspectionByListingIdUseCase(): GetInspectionByListingIdUseCase {
    return this._getInspectionByListingIdUseCase;
  }

  // Upload Use Cases
  get uploadFileUseCase(): UploadFileUseCase {
    return this._uploadFileUseCase;
  }

  get uploadMultipleFilesUseCase(): UploadMultipleFilesUseCase {
    return this._uploadMultipleFilesUseCase;
  }

  // Dispute Use Cases
  get createDisputeUseCase(): CreateDisputeUseCase {
    return this._createDisputeUseCase;
  }

  get getMyDisputesUseCase(): GetMyDisputesUseCase {
    return this._getMyDisputesUseCase;
  }

  get addDisputeCommentUseCase(): AddDisputeCommentUseCase {
    return this._addDisputeCommentUseCase;
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
    this._verifyEmailUseCase = new VerifyEmailUseCase(this._authRepository);
    this._resendVerificationUseCase = new ResendVerificationUseCase(this._authRepository);
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
  verifyEmail: () => container().verifyEmailUseCase,
  resendVerification: () => container().resendVerificationUseCase,
  
  // Listings
  getListings: () => container().getListingsUseCase,
  createListing: () => container().createListingUseCase,

  // Direct repository access (for methods without dedicated use cases)
  listing: () => container().listingRepository,
  auth: () => container().authRepository,
};

/**
 * Get repository
 */
export const repository = {
  auth: () => container().authRepository,
  listing: () => container().listingRepository,
  order: () => container().orderRepository,
  wishlist: () => container().wishlistRepository,
  message: () => container().messageRepository,
  notification: () => container().notificationRepository,
  payment: () => container().paymentRepository,
  review: () => container().reviewRepository,
  inspection: () => container().inspectionRepository,
  upload: () => container().uploadRepository,
  dispute: () => container().disputeRepository,
};

export default DIContainer;