# 🚴‍♂️ VeloBike React Native - Clean Architecture Foundation

## 🎯 Overview

VeloBike là một ứng dụng marketplace xe đạp cũ được xây dựng với **Clean Architecture pattern** và **TypeScript**. Foundation layer này đã được thiết kế hoàn chỉnh để hỗ trợ 12 modules chính của ứng dụng.

## 🏗️ Clean Architecture Structure

```
src/
├── 🟢 domain/              # BUSINESS LOGIC LAYER
│   ├── entities/           # Business entities (User, Listing, Order...)
│   ├── repositories/       # Repository interfaces
│   └── usecases/           # Business use cases
│
├── 🟡 data/                # DATA ACCESS LAYER  
│   ├── apis/               # API clients (HTTP requests)
│   ├── models/             # DTOs from server
│   └── repositories/       # Repository implementations
│
├── 🔵 presentation/        # UI LAYER
│   ├── components/         # React Native components
│   ├── screens/            # App screens
│   ├── navigation/         # Navigation setup
│   └── viewmodels/         # Zustand stores
│
├── ⚫ di/                  # DEPENDENCY INJECTION
├── ⚙️ config/              # App configuration
└── 🛠️ utils/               # Utility functions
```

## 📱 Features Covered by Foundation

### ✅ Đã Implementation
1. **🔐 Authentication System**
   - Login/Register với validation
   - JWT token management
   - Google OAuth support
   - KYC document upload
   - User profile management

2. **🚲 Listing Management**  
   - CRUD operations cho bike listings
   - Search & filtering system
   - Featured listings
   - Nearby listings (geolocation)
   - Premium boost features

3. **🛒 Order Flow (Basic)**
   - Order creation
   - State transitions
   - Role-based operations
   - Tracking system

4. **💬 Message System (Structure)**
   - Conversation management
   - Real-time messaging foundation
   - Chatbot integration

5. **⭐ Supporting Features**
   - Wishlist management
   - Reviews & ratings
   - Notifications system
   - File upload (images/videos)
   - Payment integration (PayOS)

### 🚧 Ready for Implementation
- UI Components & Screens
- Navigation structure
- Real-time Socket.io connection
- Push notifications
- Camera integration
- Maps integration

## 🔧 Tech Stack Implementation

### Core Stack ✅
- **Framework:** React Native (TypeScript support ready)
- **State Management:** Zustand stores implemented
- **Architecture:** Clean Architecture pattern implemented
- **API Client:** Custom HTTP client with error handling

### Dependencies Structure Ready For:
- **Styling:** `twrnc` (TailwindCSS for RN)
- **Icons:** `lucide-react-native`
- **Navigation:** `@react-navigation/*`
- **Forms:** `react-hook-form`
- **Charts:** `react-native-gifted-charts`
- **Gradients:** `react-native-linear-gradient`
- **Toast:** `react-native-toast-message`

## 🏃‍♂️ Quick Start Usage

### 1. Initialize App
```typescript
// App.tsx
import { useAppStore, useAuthStore } from './src';

export default function App() {
  const initializeApp = useAppStore(state => state.initialize);
  const getCurrentUser = useAuthStore(state => state.getCurrentUser);

  useEffect(() => {
    initializeApp();
    getCurrentUser(); // Check if user is logged in
  }, []);

  return (
    <YourNavigationContainer>
      {/* Your app screens */}
    </YourNavigationContainer>
  );
}
```

### 2. Using Authentication
```typescript
// LoginScreen.tsx
import { useAuthStore } from './src';

export const LoginScreen = () => {
  const { login, isLoading, error } = useAuthStore();

  const handleLogin = async () => {
    const success = await login({
      email: 'user@example.com',
      password: 'password123'
    });
    
    if (success) {
      // Navigate to home screen
    }
  };

  return (
    <View>
      {/* Your login UI */}
    </View>
  );
};
```

### 3. Using Listings
```typescript
// HomeScreen.tsx
import { useListingStore } from './src';

export const HomeScreen = () => {
  const { 
    listings, 
    getListings, 
    isLoading, 
    loadMoreListings,
    hasMore 
  } = useListingStore();

  useEffect(() => {
    getListings({
      page: 1,
      limit: 20,
      filters: { type: 'ROAD' }
    });
  }, []);

  return (
    <FlatList
      data={listings}
      onEndReached={hasMore ? loadMoreListings : undefined}
      renderItem={({ item }) => <ListingCard listing={item} />}
    />
  );
};
```

### 4. Using Custom API Calls
```typescript
// Custom API usage
import { useCase, repository } from './src';

// Through Use Cases (Recommended)
const result = await useCase.getListings().execute({
  page: 1,
  limit: 20
});

// Direct Repository Access
const listings = await repository.listing().getListings(params);
```

## 🔄 Data Flow Example

```
UI Component → Store Action → Use Case → Repository → API Client → Server
     ↓              ↓           ↓            ↓           ↓
ListingScreen → getListings() → GetListingsUseCase → ListingRepository → ListingApiClient
     ↑              ↑           ↑            ↑           ↑
Update UI ← Store Update ← Mapped Entity ← Domain Entity ← Server Response
```

## 🧪 Testing Ready Structure

### Unit Testing Layers
```typescript
// Domain Layer Tests
describe('LoginUseCase', () => {
  it('should validate credentials', async () => {
    const mockRepo = createMockAuthRepository();
    const useCase = new LoginUseCase(mockRepo);
    // Test business logic
  });
});

// Repository Tests  
describe('AuthRepositoryImpl', () => {
  it('should map server response correctly', async () => {
    const mockApi = createMockApiClient();
    const repo = new AuthRepositoryImpl(mockApi);
    // Test data mapping
  });
});

// Store Tests
describe('AuthStore', () => {
  it('should update state on login', async () => {
    // Test Zustand store behavior
  });
});
```

## 📡 API Integration

### Automatic Error Handling
```typescript
// All API calls include:
- JWT token attachment
- Network error handling  
- 401 → Auto token refresh/logout
- Rate limiting detection
- Vietnamese error messages
- Validation error mapping
```

### Response Mapping
```typescript
// Server DTOs → Domain Entities
ServerUserModel → User Entity
ServerListingModel → Listing Entity
// Handles date conversions, nested objects, etc.
```

## 🚀 Next Implementation Steps

### Phase 1: Basic UI (2-3 days)
1. Setup React Navigation
2. Create basic screen components
3. Implement authentication screens
4. Add Tailwind styling

### Phase 2: Core Features (1 week)
1. Listing browsing & creation screens
2. Search & filter implementation  
3. User profile screens
4. Image upload functionality

### Phase 3: Advanced Features (1 week)
1. Real-time messaging
2. Order management
3. Maps & geolocation
4. Push notifications

### Phase 4: Polish (3-5 days)
1. Animations & transitions
2. Error handling UI
3. Loading states
4. Performance optimization

## 📋 Project Configuration

### Environment Setup Required
```bash
# Install React Native dependencies
npm install @react-navigation/native @react-navigation/native-stack
npm install react-native-screens react-native-safe-area-context
npm install zustand react-hook-form
npm install twrnc lucide-react-native
npm install react-native-linear-gradient
npm install react-native-toast-message
npm install react-native-gifted-charts

# iOS specific (if developing for iOS)
cd ios && pod install && cd ..
```

### API Configuration
```typescript
// Update API_CONFIG in src/config/api.ts
export const API_CONFIG = {
  BASE_URL: 'https://your-api-domain.com/api', // Replace with actual API
  TIMEOUT: 30000,
  // ...
};
```

## 💡 Architecture Benefits

### ✅ Maintainability
- Clear separation of concerns
- Easy to modify business logic without touching UI
- Testable components at each layer

### ✅ Scalability  
- Easy to add new features following same pattern
- Repository pattern allows switching data sources
- DI container manages complex dependencies

### ✅ Team Collaboration
- API team can work independently with clear contracts
- UI team can mock repositories for development
- Business logic is framework-agnostic

### ✅ Quality Assurance
- Type-safe throughout entire app
- Centralized error handling
- Consistent validation patterns

## 🔧 Debugging & Development

### DI Container Usage
```typescript
// Access any component for debugging
const authRepo = container().authRepository;
const listingAPI = container().listingApiClient;
```

### Store Debugging
```typescript
// Zustand devtools support ready
import { subscribeWithSelector } from 'zustand/middleware';
```

---

**🎯 Foundation Status: ✅ Complete**  
**Next Phase: 🎨 UI Implementation**

The foundation provides a solid, scalable base for building the complete VeloBike marketplace experience. All business logic, data handling, and state management are in place - ready for UI development!