# 📚 VeloBike Backend API Documentation

## 🎯 Tổng quan dự án
**VeloBike** là một marketplace cho xe đạp cũ với hệ thống kiểm định và thanh toán an toàn.

**Base URL:** `http://localhost:8000/api` (Development)

## 📂 Project Structure Overview
```
VeloBike_BE/
├── app.ts                 # Entry point - Express server setup
├── package.json           # Dependencies & scripts
├── tsconfig.json         # TypeScript configuration
├── jest.config.js        # Testing configuration
├── type.d.ts             # Global type definitions
├── .env                  # Environment variables (create this)
│
├── controllers/          # Business logic handlers
│   ├── AuthController.ts      # Login, register, profile
│   ├── ListingController.ts   # Bike listings CRUD
│   ├── OrderController.ts     # Order processing
│   ├── PaymentController.ts   # PayOS integration
│   └── ... (20+ controllers)
│
├── models/              # MongoDB schemas
│   ├── User.ts               # User data model
│   ├── Listing.ts            # Bike listing model
│   ├── Order.ts              # Order/transaction model
│   └── ... (15+ models)
│
├── routes/              # API endpoint definitions
│   ├── authRoutes.ts         # /api/auth/*
│   ├── listingRoutes.ts      # /api/listings/*
│   ├── orderRoutes.ts        # /api/orders/*
│   └── ... (20+ route files)
│
├── middleware/          # Express middlewares
│   ├── authMiddleware.ts     # JWT authentication
│   ├── rateLimitMiddleware.ts # Rate limiting
│   └── validationMiddleware.ts # Input validation
│
├── services/           # External service integrations
│   ├── PaymentService.ts     # PayOS payment gateway
│   ├── EmailService.ts       # Email sending
│   ├── ChatbotService.ts     # AI chatbot
│   └── ... (10+ services)
│
└── uploads/           # Temporary file uploads (auto-created)
```

---

## 🔧 Cấu hình cho Frontend

### Headers bắt buộc
```javascript
// Mọi request phải có
{
  "Content-Type": "application/json",
  "Accept": "application/json"
}

// Request cần authentication
{
  "Authorization": "Bearer <jwt_token>",
  "Content-Type": "application/json"
}

// Upload files
{
  "Authorization": "Bearer <jwt_token>",
  "Content-Type": "multipart/form-data"
}
```

### Response Format chuẩn
```javascript
// Success
{
  "success": true,
  "data": {...},
  "message": "Success message"
}

// Error 
{
  "success": false,
  "message": "Error message",
  "errors": [...] // validation errors (nếu có)
}
```

---

## 🔐 AUTHENTICATION & USER MANAGEMENT

### 1. Register
**POST** `/api/auth/register`
```javascript
// Input
{
  "email": "user@example.com",
  "password": "securePassword123",
  "fullName": "Nguyen Van A",
  "role": "BUYER" // BUYER, SELLER, INSPECTOR (optional, default: BUYER)
}

// Output
{
  "success": true,
  "message": "User created successfully. Please check email for verification."
}
```

### 2. Email Verification
**POST** `/api/auth/verify-email`
```javascript
// Input
{
  "email": "user@example.com",
  "code": "123456"
}

// Output
{
  "success": true,
  "message": "Email verified successfully"
}
```

### 3. Login
**POST** `/api/auth/login`
```javascript
// Input
{
  "email": "user@example.com",
  "password": "securePassword123"
}

// Output
{
  "success": true,
  "token": "jwt_token_here",
  "user": {
    "_id": "userId",
    "email": "user@example.com",
    "fullName": "Nguyen Van A",
    "role": "BUYER",
    "emailVerified": true,
    "kycStatus": "PENDING"
  }
}
```

### 4. Google OAuth Login
**POST** `/api/auth/google`
```javascript
// Input
{
  "idToken": "google_id_token"
}

// Output: Same as normal login
```

### 5. Get Profile
**GET** `/api/auth/me` 
```javascript
// Headers: Authorization: Bearer <token>
// Output
{
  "success": true,
  "user": {
    "_id": "userId",
    "email": "user@example.com",
    "fullName": "Nguyen Van A",
    "avatar": "avatar_url",
    "phone": "0123456789",
    "address": {...},
    "role": "BUYER",
    "kycStatus": "VERIFIED",
    "wallet": {
      "balance": 5000000,
      "currency": "VND"
    },
    "reputation": {
      "score": 4.5,
      "reviewCount": 10
    }
  }
}
```

### 6. Update Profile
**PUT** `/api/auth/profile`
```javascript
// Input
{
  "fullName": "New Name",
  "phone": "0987654321", 
  "address": {
    "street": "123 Nguyen Hue",
    "district": "Quan 1",
    "city": "Ho Chi Minh",
    "province": "Ho Chi Minh",
    "zipCode": "70000"
  },
  "bodyMeasurements": {
    "height": 175,
    "inseam": 32,
    "weight": 65
  }
}
```

### 7. KYC Verification
**POST** `/api/auth/kyc-upload`
```javascript
// Content-Type: multipart/form-data
// Fields:
// - documentType: "ID_CARD" | "PASSPORT" | "DRIVER_LICENSE"
// - frontImage: File
// - backImage: File (optional for PASSPORT)
```

---

## 🚲 LISTINGS (Bike Marketplace)

### 1. Get All Listings
**GET** `/api/listings`
```javascript
// Query params
{
  "type": "ROAD|MTB|GRAVEL|TRIATHLON|E_BIKE|ALL",
  "brand": "Trek",
  "minPrice": 1000000,
  "maxPrice": 50000000,
  "condition": "NEW|LIKE_NEW|GOOD|FAIR|PARTS", 
  "location": "Ho Chi Minh",
  "page": 1,
  "limit": 20,
  "sort": "createdAt|-createdAt|pricing.amount|-pricing.amount"
}

// Output
{
  "success": true,
  "count": 15,
  "totalPages": 3,
  "data": [
    {
      "_id": "listingId",
      "title": "Trek Domane SL6 2023",
      "description": "Xe đạp đường phố cao cấp...",
      "type": "ROAD",
      "status": "PUBLISHED",
      "generalInfo": {
        "brand": "Trek",
        "model": "Domane SL6", 
        "year": 2023,
        "size": "56cm",
        "condition": "LIKE_NEW"
      },
      "pricing": {
        "amount": 45000000,
        "currency": "VND",
        "originalPrice": 60000000
      },
      "media": {
        "thumbnails": ["url1", "url2"],
        "spin360Urls": ["360_url1", "360_url2"],
        "videoUrl": "video_url"
      },
      "location": {
        "coordinates": [106.7, 10.8],
        "address": "Ho Chi Minh City"
      },
      "views": 150,
      "boostedUntil": "2026-03-01T00:00:00.000Z",
      "sellerId": {
        "_id": "sellerId",
        "fullName": "Seller Name",
        "reputation": {"score": 4.8, "reviewCount": 25},
        "badge": "PREMIUM" // if seller has subscription
      },
      "createdAt": "2026-02-20T10:00:00.000Z"
    }
  ]
}
```

### 2. Get Featured Listings (Premium Sellers)
**GET** `/api/listings/featured?limit=10`

### 3. Get Listing Detail
**GET** `/api/listings/:id`
```javascript
// Output: Same structure as above + more details
{
  "success": true,
  "data": {
    // ... all fields from list view
    "specs": {
      "frameMaterial": "Carbon",
      "groupset": "Shimano 105",
      "wheelset": "DT Swiss",
      "brakeType": "Disc",
      "weight": 8.5
    },
    "geometry": {
      "stack": 563,
      "reach": 389
    },
    "inspectionRequired": true,
    "inspectionScore": 8.5,
    "inspectionReport": "reportId" // if inspected
  }
}
```

### 4. Create Listing (Seller only)
**POST** `/api/listings`
```javascript
// Headers: Authorization: Bearer <token>
// Input
{
  "title": "Trek Domane SL6 2023",
  "description": "Xe đạp đường phố cao cấp, ít sử dụng",
  "type": "ROAD",
  "generalInfo": {
    "brand": "Trek",
    "model": "Domane SL6",
    "year": 2023,
    "size": "56cm", 
    "condition": "LIKE_NEW"
  },
  "specs": {
    "frameMaterial": "Carbon",
    "groupset": "Shimano 105"
  },
  "pricing": {
    "amount": 45000000,
    "currency": "VND",
    "originalPrice": 60000000
  },
  "media": {
    "thumbnails": ["cloudinary_url1", "cloudinary_url2"],
    "spin360Urls": ["360_url1"],
    "videoUrl": "video_url"
  },
  "location": {
    "coordinates": [106.7, 10.8],
    "address": "Ho Chi Minh City"
  },
  "inspectionRequired": true
}

// Output
{
  "success": true, 
  "data": { /* created listing */ },
  "message": "Listing created successfully"
}
```

### 5. Update Listing
**PUT** `/api/listings/:id`

### 6. Delete Listing
**DELETE** `/api/listings/:id`

### 7. My Listings (Seller)
**GET** `/api/listings/my-listings`

### 8. Boost Listing (Premium feature)
**POST** `/api/listings/:id/boost`
```javascript
// Input
{
  "days": 7 // Number of days to boost
}
```

### 9. Search Nearby
**GET** `/api/listings/nearby?lat=10.8&lon=106.7&radius=50`

---

## 🛒 ORDERS & TRANSACTIONS

### 1. Create Order (Buyer)
**POST** `/api/orders`
```javascript
// Input
{
  "listingId": "listingId",
  "shippingAddress": {
    "fullName": "Nguyen Van B",
    "phone": "0123456789",
    "street": "123 Le Loi",
    "district": "Quan 1", 
    "city": "Ho Chi Minh",
    "province": "Ho Chi Minh",
    "zipCode": "70000"
  }
}

// Output
{
  "success": true,
  "data": {
    "_id": "orderId",
    "listingId": "listingId",
    "buyerId": "buyerId",
    "sellerId": "sellerId", 
    "status": "CREATED",
    "financials": {
      "totalAmount": 45500000,
      "itemPrice": 45000000,
      "inspectionFee": 300000,
      "shippingFee": 150000,
      "platformFee": 50000
    },
    "timeline": [
      {
        "status": "CREATED",
        "timestamp": "2026-02-23T10:00:00.000Z",
        "actorId": "buyerId"
      }
    ]
  }
}
```

### 2. Get Order Detail
**GET** `/api/orders/:id`

### 3. Get My Orders
**GET** `/api/orders/my-orders?role=buyer&status=COMPLETED`

### 4. Transition Order State
**POST** `/api/orders/:id/transition`
```javascript
// Input
{
  "newState": "SHIPPING", // Based on role permissions
  "note": "Package shipped via Giao Hang Nhanh #GHN123"
}
```

**State Machine:**
- **CREATED** → **ESCROW_LOCKED** (after payment)
- **ESCROW_LOCKED** → **IN_INSPECTION** (inspector assigned)
- **IN_INSPECTION** → **INSPECTION_PASSED/FAILED**
- **INSPECTION_PASSED** → **SHIPPING** (seller ships)
- **SHIPPING** → **DELIVERED** (buyer confirms)
- **DELIVERED** → **COMPLETED** (money released)

---

## 💳 PAYMENT & WALLET

### 1. Create Payment Link
**POST** `/api/payment/create-link`
```javascript
// Input
{
  "orderId": "orderId"
}

// Output
{
  "success": true,
  "paymentLink": "https://pay.payos.vn/web/...",
  "orderCode": 123456
}
```

### 2. Payment Webhook (PayOS calls this)
**POST** `/api/payment/webhook`
> ⚠️ **FE không cần gọi endpoint này**

### 3. Request Withdrawal
**POST** `/api/wallet/withdraw`
```javascript
// Input
{
  "amount": 5000000,
  "bankAccount": {
    "bankName": "Vietcombank", 
    "accountNumber": "1234567890",
    "accountName": "NGUYEN VAN A",
    "branch": "Chi nhánh Quận 1"
  }
}
```

### 4. Withdrawal History
**GET** `/api/wallet/withdrawals?page=1&limit=20`

---

## 🔍 INSPECTION SYSTEM

### 1. Submit Inspection Report (Inspector only)
**POST** `/api/inspections`
```javascript
// Input
{
  "orderId": "orderId",
  "checkpoints": [
    {
      "component": "Frame - Overall Condition",
      "status": "PASS",
      "observation": "Khung xe tốt, không có vết nứt"
    },
    {
      "component": "Front Brake",
      "status": "WARN",
      "severity": "LOW", 
      "observation": "Má phanh còn 40%, nên thay trong 1 tháng"
    }
  ],
  "overallVerdict": "SUGGEST_ADJUSTMENT",
  "overallScore": 7.5,
  "inspectorNote": "Xe tổng thể tốt nhưng cần thay má phanh"
}
```

### 2. Get Inspection Reports
**GET** `/api/inspections?page=1&limit=20`

### 3. Get Report Detail
**GET** `/api/inspections/:id`

---

## 💬 MESSAGING & CHAT

### 1. Get/Create Conversation
**GET** `/api/messages/conversation/:userId?listingId=xxx`

### 2. Send Message
**POST** `/api/messages`
```javascript
// Input
{
  "conversationId": "conversationId",
  "receiverId": "receiverId", 
  "content": "Xe này còn bảo hành không ạ?",
  "attachments": ["image_url"] // optional
}
```

### 3. Get Messages
**GET** `/api/messages/list/:conversationId?page=1&limit=50`

### 4. Get Conversations
**GET** `/api/messages/conversations`

---

## 🤖 CHATBOT AI

### 1. Send Message to Bot
**POST** `/api/chatbot/webhook`
```javascript
// Input
{
  "message": "Tôi cao 1m8 và nặng 65kg thì nên chạy xe đạp nào?",
  "userId": "userId" // optional if using Bearer token
}

// Output
{
  "success": true,
  "reply": "Với chiều cao 1m8, bạn nên chọn xe đạp size L (56-58cm)..."
}
```

### 2. Get Chat History
**GET** `/api/chatbot/history?page=1&limit=20`

---

## ⭐ REVIEWS & RATINGS

### 1. Create Review (Buyer only, after order completion)
**POST** `/api/reviews`
```javascript
// Input
{
  "orderId": "orderId",
  "rating": 5,
  "comment": "Xe đẹp, đúng mô tả, seller nhiệt tình",
  "categories": {
    "itemAccuracy": 5,
    "communication": 5,
    "shipping": 4,
    "packaging": 5
  }
}
```

### 2. Get User Reviews
**GET** `/api/reviews/:userId?page=1&limit=20`

---

## 💤 WISHLIST

### 1. Add to Wishlist
**POST** `/api/wishlist`
```javascript
// Input
{
  "listingId": "listingId"
}
```

### 2. Get Wishlist
**GET** `/api/wishlist?page=1&limit=20`

### 3. Check if in Wishlist
**GET** `/api/wishlist/check/:listingId`

### 4. Remove from Wishlist
**DELETE** `/api/wishlist/:listingId`

### 5. Clear All Wishlist
**DELETE** `/api/wishlist/clear`

---

## 📤 FILE UPLOAD

### 1. Upload Single Image
**POST** `/api/upload`
```javascript
// Content-Type: multipart/form-data
// Field: image (File)

// Output
{
  "success": true,
  "url": "https://res.cloudinary.com/...",
  "publicId": "velobike_listings/abc123"
}
```

### 2. Upload 360° Images
**POST** `/api/upload/360`
```javascript
// Content-Type: multipart/form-data  
// Field: images (File[]) - up to 72 images

// Output
{
  "success": true,
  "urls": ["url1", "url2", ...],
  "publicIds": ["id1", "id2", ...]
}
```

### 3. Get My Images
**GET** `/api/upload/my-images?folder=velobike_listings&limit=50`

### 4. Delete Image
**DELETE** `/api/upload/:publicId`

---

## 📊 ANALYTICS & DASHBOARD

### 1. Seller Analytics
**GET** `/api/analytics/seller/dashboard`
```javascript
// Output
{
  "success": true,
  "data": {
    "overview": {
      "totalListings": 25,
      "totalViews": 1500,
      "totalSales": 8,
      "totalRevenue": 180000000,
      "averageOrderValue": 22500000,
      "conversionRate": 0.53
    },
    "listingsByStatus": {
      "PUBLISHED": 15,
      "SOLD": 8,
      "DRAFT": 2
    },
    "topListings": [...],
    "recentTransactions": [...]
  }
}
```

### 2. Seller Performance
**GET** `/api/analytics/seller/performance?period=30d`

### 3. Listing Analytics
**GET** `/api/analytics/listing/:id`

---

## 💰 SUBSCRIPTION PLANS

### 1. Get All Plans
**GET** `/api/subscriptions/plans`
```javascript
// Output
{
  "success": true,
  "data": [
    {
      "name": "FREE",
      "displayName": "Gói Miễn Phí",
      "price": 0,
      "duration": 30,
      "commissionRate": 0.05,
      "maxListingsPerMonth": 3,
      "features": ["Đăng bán tối đa 3 xe/tháng", "Hỗ trợ cơ bản"]
    },
    {
      "name": "PREMIUM", 
      "displayName": "Gói Premium",
      "price": 299000,
      "duration": 30,
      "commissionRate": 0.03,
      "maxListingsPerMonth": -1,
      "features": ["Không giới hạn tin đăng", "Badge đặc biệt", "Ưu tiên hiển thị"],
      "badge": {
        "text": "PREMIUM",
        "color": "#FFD700"
      }
    }
  ]
}
```

### 2. Get My Subscription
**GET** `/api/subscriptions/my-subscription`

### 3. Check Listing Quota
**GET** `/api/subscriptions/check-quota`

### 4. Subscribe to Plan
**POST** `/api/subscriptions/subscribe`
```javascript
// Input
{
  "planType": "PREMIUM"
}
```

---

## 🔔 NOTIFICATIONS

### 1. Get Notifications
**GET** `/api/notifications?page=1&limit=20`

### 2. Mark as Read
**PUT** `/api/notifications/:id/read`

### 3. Mark All as Read
**PUT** `/api/notifications/read-all`

---

## 🚚 LOGISTICS & SHIPPING

### 1. Calculate Shipping Cost
**POST** `/api/logistics/calculate-shipping`
```javascript
// Input
{
  "fromAddress": "Ho Chi Minh",
  "toAddress": "Ha Noi", 
  "weight": 12, // kg
  "dimensions": {
    "length": 140, // cm
    "width": 25,
    "height": 80
  }
}
```

### 2. Create Shipping Order
**POST** `/api/logistics/create-shipping`

### 3. Track Package
**GET** `/api/logistics/track/:trackingNumber`

---

## ⚖️ DISPUTES & REPORTS

### 1. Create Dispute
**POST** `/api/disputes`
```javascript
// Input
{
  "orderId": "orderId",
  "reason": "ITEM_NOT_AS_DESCRIBED",
  "description": "Xe bị hư phanh nhưng không nói trước",
  "evidence": ["image_url1", "image_url2"]
}
```

### 2. Get My Disputes  
**GET** `/api/disputes?status=OPEN&page=1`

### 3. Add Comment to Dispute
**POST** `/api/disputes/:id/comments`

---

## 📈 PRICE ALERTS

### 1. Create Price Alert
**POST** `/api/alerts`
```javascript
// Input
{
  "searchCriteria": {
    "brand": "Trek", 
    "type": "ROAD",
    "maxPrice": 40000000
  },
  "alertPrice": 35000000,
  "alertEmail": true
}
```

### 2. Get My Alerts
**GET** `/api/alerts`

### 3. Delete Alert
**DELETE** `/api/alerts/:id`

---

## 🔐 Authorization Levels

| Role | Description | Key Permissions |
|------|-------------|-----------------|
| **GUEST** | Chưa xác thực email | Xem listings, đăng ký |
| **BUYER** | Người mua | Đặt mua, chat, review, wishlist |
| **SELLER** | Người bán | Tất cả BUYER + đăng bán, quản lý orders |
| **INSPECTOR** | Kiểm định viên | Tất cả BUYER + tạo inspection reports |
| **ADMIN** | Quản trị viên | Full access, admin dashboard |

---

## 🔌 WebSocket Events (Socket.io)

### Connection
```javascript
const socket = io('http://localhost:8000', {
  auth: {
    token: 'jwt_token_here'
  }
});
```

### Events to Listen
```javascript
// New message received
socket.on('message', (data) => {
  console.log('New message:', data);
});

// Order status updated  
socket.on('orderUpdate', (data) => {
  console.log('Order updated:', data);
});

// New notification
socket.on('notification', (data) => {
  console.log('Notification:', data);
});

// User online status
socket.on('userOnline', (userId) => {
  console.log(`User ${userId} is online`);
});
```

### Events to Emit
```javascript
// Join conversation room
socket.emit('joinConversation', conversationId);

// Send typing indicator
socket.emit('typing', { conversationId, isTyping: true });
```

---

## ⚠️ Lưu ý quan trọng cho FE

### 1. Error Handling
```javascript
// Luôn kiểm tra response status
if (!response.ok) {
  const error = await response.json();
  throw new Error(error.message);
}

// Common HTTP status codes
// 401: Token hết hạn → redirect to login
// 403: Không có permission → show error
// 404: Resource not found
// 422: Validation errors → show field errors
// 429: Rate limit → show "too many requests" 
// 500: Server error → show generic error
```

### 2. Token Management
```javascript
// Token refresh không tự động, cần handle 401
if (response.status === 401) {
  // Clear token và redirect về login
  localStorage.removeItem('token');
  window.location.href = '/login';
}
```

### 3. Image Upload Flow
```javascript
// 1. Upload image first
const uploadResponse = await fetch('/api/upload', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData
});
const { url } = await uploadResponse.json();

// 2. Use URL in listing
const listingData = {
  title: "...",
  media: {
    thumbnails: [url] // Use uploaded URL
  }
};
```

### 4. Pagination Pattern
```javascript
// All list endpoints support pagination
const response = await fetch(`/api/listings?page=1&limit=20`);
const data = await response.json();

// Check if there are more pages
const hasMore = data.page < data.totalPages;
```

### 5. Rate Limiting
- **General**: 100 requests/15 minutes
- **Auth endpoints**: 10 requests/15 minutes  
- **Payment**: 5 requests/15 minutes
- **Upload**: 20 requests/15 minutes

### 6. WebSocket Connection
```javascript
// Kết nối khi user login
socket.connect();

// Ngắt kết nối khi user logout
socket.disconnect();

// Reconnect khi app resume từ background
```

### 7. Performance Tips
- Sử dụng pagination cho tất cả danh sách
- Cache listings data trong memory (5-10 phút)
- Lazy load images với placeholder
- Debounce search input (300ms)
- Optimize image uploads (resize trước khi upload)

### 8. Security Best Practices
- Không bao giờ lưu password trong code
- Validate input ở client nhưng trust server validation
- Sanitize HTML content khi hiển thị
- Check permissions ở UI level nhưung rely on server auth

---

## 🚀 Setup & Start Server

### Prerequisites (Yêu cầu hệ thống)
```bash
# 1. Node.js (v18+ recommended)
node --version  # Check version

# 2. MongoDB (Local hoặc MongoDB Atlas)
# Download: https://www.mongodb.com/try/download/community

# 3. Redis (Optional - for caching)
# Download: https://redis.io/downloads
# Windows: https://github.com/tporadowski/redis/releases
```

### Step 1: Clone & Install Dependencies
```bash
# Clone repository
git clone <repository_url>
cd VeloBike_BE

# Install dependencies
npm install
```

### Step 2: Environment Setup
Tạo file `.env` trong thư mục root với nội dung:
```bash
# Server Config
NODE_ENV=development
PORT=8000

# Database
MONGODB_URI=mongodb://localhost:27017/velobike
REDIS_URL=redis://localhost:6379

# JWT Authentication
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_random
JWT_EXPIRES_IN=7d

# PayOS Payment Gateway
PAYOS_CLIENT_ID=your_payos_client_id
PAYOS_API_KEY=your_payos_api_key
PAYOS_CHECKSUM_KEY=your_payos_checksum_key

# Cloudinary Image Storage
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id

# Email Service (Gmail recommended)
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587

# FPT AI Chatbot
FPT_AI_ENDPOINT=your_fpt_ai_endpoint  
FPT_AI_API_KEY=your_fpt_ai_key

# Webhook URLs (for payment return)
PAYMENT_RETURN_URL=http://localhost:3000/payment/success
PAYMENT_CANCEL_URL=http://localhost:3000/payment/cancel
```

### Step 3: Start Required Services

#### 3.1 Start MongoDB
```bash
# Nếu cài local MongoDB
mongod --dbpath /path/to/your/db

# Hoặc sử dụng MongoDB Atlas (cloud)
# → Chỉ cần update MONGODB_URI trong .env
```

#### 3.2 Start Redis (Optional)
```bash
# Windows
redis-server

# macOS/Linux  
redis-server /usr/local/etc/redis.conf

# Hoặc Docker
docker run -d -p 6379:6379 redis:latest
```

### Step 4: Start VeloBike Backend Server

#### Development Mode (Recommended)
```bash
# Auto-reload khi code thay đổi
npm run dev

# Server sẽ chạy tại: http://localhost:8000
# API Docs: http://localhost:8000/api-docs
```

#### Production Mode
```bash
# Build TypeScript to JavaScript
npm run build

# Start production server
npm start
```

### Step 5: Verify Server is Running
```bash
# Test API health
curl http://localhost:8000/api/health

# Expected response:
{
  "success": true,
  "message": "VeloBike API is running",
  "timestamp": "2026-02-23T10:30:00.000Z"
}
```

### Available NPM Scripts
```bash
npm run dev          # Start development server with hot-reload
npm run build        # Build TypeScript to dist/ folder
npm start           # Start production server (requires build first)
npm run test        # Run Jest tests
npm run test:watch  # Run tests in watch mode
npm run lint        # Check code style with ESLint
npm run lint:fix    # Fix ESLint errors automatically
```

### Quick Start (TL;DR)
```bash
# 1. Install dependencies
npm install

# 2. Copy .env.example to .env và fill values
cp .env.example .env  # (nếu có file example)

# 3. Start MongoDB và Redis
mongod
redis-server

# 4. Start development server
npm run dev

# ✅ API ready at: http://localhost:8000
# ✅ Docs at: http://localhost:8000/api-docs
```

### API Documentation (Swagger)
- **URL**: http://localhost:8000/api-docs
- Live API documentation với Swagger UI

### 🔧 Troubleshooting Common Issues

#### 1. MongoDB Connection Error
```bash
# Error: "MongoNetworkError: failed to connect to server"
# Solution:
- Check MongoDB is running: `ps aux | grep mongod`
- Check port 27017 is open: `lsof -i :27017`
- Update MONGODB_URI in .env if using different port/host
```

#### 2. Redis Connection Error (Optional)
```bash
# Error: "Error: Redis connection failed"  
# Solution:
- Start Redis: `redis-server`
- Or comment out Redis config if not using caching
```

#### 3. Port Already in Use
```bash
# Error: "EADDRINUSE: address already in use :::8000"
# Solution:
- Kill existing process: `lsof -ti:8000 | xargs kill -9`
- Or change PORT in .env file
```

#### 4. TypeScript Compilation Errors
```bash
# Error: TypeScript compilation issues
# Solution:
- Clear node_modules: `rm -rf node_modules && npm install`
- Check TypeScript version: `npx tsc --version`
- Build manually: `npm run build`
```

#### 5. Missing Environment Variables
```bash
# Error: "JWT_SECRET is not defined"
# Solution:
- Copy all required variables from setup guide above
- Double-check .env file exists in root directory
- Restart server after adding variables
```

### 🚀 Docker Setup (Alternative)
```bash
# If you prefer Docker
docker-compose up -d

# This will start:
# - VeloBike Backend API (port 8000)  
# - MongoDB (port 27017)
# - Redis (port 6379)
```

---

## 📞 Support

Nếu có thắc mắc về API, liên hệ Backend team hoặc tham khảo Swagger docs tại `/api-docs`.

**Happy Coding! 🚴‍♂️**