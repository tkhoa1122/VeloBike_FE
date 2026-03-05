# 📱 VeloBike Mobile API Endpoints

**Base URL:** `http://localhost:5000/api`
**Current Version:** v1.0.0
**Last Updated:** March 2, 2026

## 📝 **Request Headers**

### Standard Headers
```javascript
{
  "Content-Type": "application/json",
  "Accept": "application/json"
}
```

### Authenticated Requests  
```javascript
{
  "Authorization": "Bearer <jwt_access_token>",
  "Content-Type": "application/json",
  "Accept": "application/json"
}
```

### File Upload
```javascript
{
  "Authorization": "Bearer <jwt_access_token>",
  "Content-Type": "multipart/form-data"
}
```

---

## 🔐 **AUTHENTICATION ENDPOINTS**

### **1. Register New User**
**POST** `/api/auth/register`
```javascript
// INPUT
{
  "email": "user@example.com",
  "password": "securePassword123", 
  "fullName": "Nguyen Van A",
  "role": "BUYER" // Optional: BUYER, SELLER, INSPECTOR
}

// OUTPUT
{
  "success": true,
  "message": "Tài khoản đã được tạo. Vui lòng kiểm tra email để xác thực.",
  "user": {
    "id": "676abc123def456789",
    "email": "user@example.com",
    "fullName": "Nguyen Van A", 
    "role": "BUYER",
    "emailVerified": false
  }
}
```

### **2. Verify Email**
**POST** `/api/auth/verify-email`
```javascript
// INPUT
{
  "email": "user@example.com",
  "code": "123456"
}

// OUTPUT
{
  "success": true,
  "message": "Email verified",
  "accessToken": "jwt_access_token_here",
  "refreshToken": "jwt_refresh_token_here",
  "user": {
    "id": "676abc123def456789",
    "email": "user@example.com",
    "fullName": "Nguyen Van A",
    "emailVerified": true
  }
}
```

### **3. Login (Email/Password)**
**POST** `/api/auth/login`
```javascript
// INPUT
{
  "email": "user@example.com",
  "password": "securePassword123"
}

// OUTPUT
{
  "success": true,
  "accessToken": "jwt_access_token_here",
  "refreshToken": "jwt_refresh_token_here",
  "user": {
    "id": "676abc123def456789",
    "email": "user@example.com", 
    "fullName": "Nguyen Van A",
    "role": "BUYER",
    "emailVerified": true
  }
}
```

### **4. Google OAuth Login**
**POST** `/api/auth/google`
```javascript
// INPUT
{
  "googleToken": "google_id_token_from_oauth"
}

// OUTPUT - Same as normal login
{
  "success": true,
  "accessToken": "jwt_access_token_here",
  "refreshToken": "jwt_refresh_token_here", 
  "user": {
    "id": "676abc123def456789",
    "email": "user@gmail.com",
    "fullName": "Google User",
    "role": "BUYER"
  }
}
```

### **5. Facebook OAuth Login**
**POST** `/api/auth/facebook`
```javascript
// INPUT
{
  "facebookToken": "facebook_access_token",
  "userID": "facebook_user_id"
}

// OUTPUT - Same structure as other logins
```

### **6. Refresh Access Token**
**POST** `/api/auth/refresh-token`
```javascript
// INPUT
{
  "refreshToken": "jwt_refresh_token_here"
}

// OUTPUT
{
  "success": true,
  "accessToken": "new_jwt_access_token",
  "user": {
    "id": "676abc123def456789",
    "email": "user@example.com",
    "fullName": "Nguyen Van A",
    "role": "BUYER"
  }
}
```

### **7. Get Current User Profile**
**GET** `/api/auth/me`
```javascript
// Headers: Authorization: Bearer <token>
// OUTPUT
{
  "success": true,
  "user": {
    "_id": "676abc123def456789",
    "email": "user@example.com",
    "fullName": "Nguyen Van A",
    "avatar": "https://cloudinary.com/image.jpg",
    "phone": "0123456789",
    "address": {
      "street": "123 Nguyen Hue",
      "district": "Quan 1",
      "city": "Ho Chi Minh", 
      "province": "Ho Chi Minh",
      "zipCode": "70000"
    },
    "role": "BUYER",
    "kycStatus": "VERIFIED",
    "bodyMeasurements": {
      "height": 175,
      "inseam": 32,
      "weight": 65
    },
    "wallet": {
      "balance": 5000000,
      "currency": "VND"
    },
    "reputation": {
      "score": 4.5,
      "reviewCount": 10
    },
    "createdAt": "2026-01-15T10:30:00.000Z"
  }
}
```

### **8. Update Profile**
**PUT** `/api/auth/profile`
```javascript
// INPUT
{
  "fullName": "New Name",
  "phone": "0987654321",
  "address": {
    "street": "456 Le Loi",
    "district": "Quan 1", 
    "city": "Ho Chi Minh",
    "province": "Ho Chi Minh",
    "zipCode": "70000"
  },
  "bodyMeasurements": {
    "height": 170,
    "inseam": 30,
    "weight": 60
  }
}

// OUTPUT
{
  "success": true,
  "message": "Profile updated successfully",
  "user": { /* Updated user object */ }
}
```

### **9. Upload Avatar**
**POST** `/api/auth/upload-avatar`
```javascript
// Content-Type: multipart/form-data
// Field: avatar (File)

// OUTPUT
{
  "success": true,
  "message": "Avatar uploaded successfully", 
  "avatarUrl": "https://cloudinary.com/new-avatar.jpg"
}
```

### **10. Change Password**
**POST** `/api/auth/change-password` 
```javascript
// INPUT
{
  "currentPassword": "oldPassword123",
  "newPassword": "newSecurePassword456"
}

// OUTPUT
{
  "success": true,
  "message": "Password updated successfully"
}
```

### **11. Forgot Password**
**POST** `/api/auth/forgot-password`
```javascript
// INPUT
{
  "email": "user@example.com"
}

// OUTPUT
{
  "success": true,
  "message": "Reset OTP sent to email"
}
```

### **12. Reset Password**
**POST** `/api/auth/reset-password`
```javascript
// INPUT
{
  "email": "user@example.com",
  "code": "123456",
  "newPassword": "newSecurePassword789"
}

// OUTPUT
{
  "success": true,
  "message": "Password reset successfully"
}
```

### **13. KYC Upload** 
**POST** `/api/auth/kyc-upload`
```javascript
// Content-Type: multipart/form-data
// Fields:
// - documentType: "ID_CARD" | "PASSPORT" | "DRIVER_LICENSE"  
// - frontImage: File
// - backImage: File (optional for PASSPORT)

// OUTPUT
{
  "success": true,
  "message": "KYC documents uploaded successfully",
  "kycStatus": "PENDING"
}
```

### **14. Logout**
**POST** `/api/auth/logout`
```javascript
// INPUT
{
  "refreshToken": "jwt_refresh_token_here"
}

// OUTPUT
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## 🚲 **MARKETPLACE ENDPOINTS (LISTINGS)**

### **1. Get All Listings**
**GET** `/api/listings?type=ROAD&brand=Trek&minPrice=1000000&maxPrice=50000000&page=1&limit=20&sort=-createdAt`
```javascript
// Query Parameters:
// - type: ROAD|MTB|GRAVEL|TRIATHLON|E_BIKE|ALL
// - brand: String (filter by brand)  
// - minPrice: Number (minimum price in VND)
// - maxPrice: Number (maximum price in VND)
// - condition: NEW|LIKE_NEW|GOOD|FAIR|PARTS
// - location: String (city/province)
// - page: Number (default: 1)
// - limit: Number (default: 20, max: 50)
// - sort: createdAt|-createdAt|pricing.amount|-pricing.amount

// OUTPUT
{
  "success": true,
  "count": 15,
  "totalPages": 3,
  "currentPage": 1,
  "data": [
    {
      "_id": "676listing123",
      "title": "Trek Domane SL6 2023",
      "description": "Xe đạp đường phố cao cấp, ít sử dụng...",
      "type": "ROAD",
      "status": "PUBLISHED",
      "generalInfo": {
        "brand": "Trek", 
        "model": "Domane SL6",
        "year": 2023,
        "size": "56cm",
        "condition": "LIKE_NEW"
      },
      "specs": {
        "frameMaterial": "Carbon",
        "groupset": "Shimano 105",
        "wheelset": "DT Swiss",
        "brakeType": "Disc",
        "weight": 8.5
      },
      "pricing": {
        "amount": 45000000,
        "currency": "VND",
        "originalPrice": 60000000
      },
      "media": {
        "thumbnails": ["url1.jpg", "url2.jpg"],
        "spin360Urls": ["360_url1.jpg"],
        "videoUrl": "video_demo.mp4"
      },
      "location": {
        "coordinates": [106.7, 10.8],
        "address": "Ho Chi Minh City"
      },
      "views": 150,
      "boostedUntil": "2026-03-15T00:00:00.000Z",
      "sellerId": {
        "_id": "seller123",
        "fullName": "Seller Name",
        "reputation": {
          "score": 4.8,
          "reviewCount": 25
        },
        "badge": "PREMIUM" // If seller has subscription
      },
      "createdAt": "2026-02-20T10:00:00.000Z"
    }
  ]
}
```

### **2. Get Featured Listings (Premium Sellers)**
**GET** `/api/listings/featured?limit=10`
```javascript
// OUTPUT - Same structure as above, but only PREMIUM seller listings
```

### **3. Get Listing Detail**
**GET** `/api/listings/:id`
```javascript
// OUTPUT
{
  "success": true,
  "data": {
    "_id": "676listing123",
    "title": "Trek Domane SL6 2023",
    // ... all fields from list view plus:
    "specs": {
      "frameMaterial": "Carbon",
      "groupset": "Shimano 105", 
      "wheelset": "DT Swiss",
      "brakeType": "Disc",
      "suspensionType": null,
      "wheelSize": "700c",
      "weight": 8.5
    },
    "geometry": {
      "stack": 563,
      "reach": 389
    },
    "inspectionRequired": true,
    "inspectionScore": 8.5,
    "inspectionReport": "inspection_id_here" // if inspected
  }
}
```

### **4. Search Nearby Listings**
**GET** `/api/listings/nearby?lat=10.8&lon=106.7&radius=50&limit=20`
```javascript
// Query Parameters:
// - lat: Number (latitude)
// - lon: Number (longitude)  
// - radius: Number (radius in kilometers)
// - limit: Number (max results)

// OUTPUT - Same structure as get all listings
```

### **5. Create New Listing (Sellers only)**
**POST** `/api/listings`
```javascript
// INPUT
{
  "title": "Trek Domane SL6 2023",
  "description": "Xe đạp đường phố cao cấp, ít sử dụng...",
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
    "groupset": "Shimano 105",
    "wheelset": "DT Swiss", 
    "brakeType": "Disc",
    "weight": 8.5
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

// OUTPUT
{
  "success": true,
  "message": "Listing created successfully", 
  "data": { /* Created listing object */ }
}
```

### **6. Update Listing**
**PUT** `/api/listings/:id`
```javascript
// INPUT - Same as create listing
// OUTPUT - Updated listing object
```

### **7. Delete Listing**
**DELETE** `/api/listings/:id`
```javascript
// OUTPUT
{
  "success": true,
  "message": "Listing deleted successfully"
}
```

### **8. Get My Listings (Sellers)**
**GET** `/api/listings/my-listings?status=PUBLISHED&page=1&limit=20`
```javascript
// Query Parameters:
// - status: DRAFT|PUBLISHED|SOLD|REJECTED
// - page: Number
// - limit: Number

// OUTPUT - Array of seller's listings
```

### **9. Boost Listing (Premium feature)**
**POST** `/api/listings/:id/boost`
```javascript
// INPUT
{
  "days": 7 // Number of days to boost
}

// OUTPUT
{
  "success": true,
  "message": "Listing boosted successfully",
  "boostedUntil": "2026-03-10T10:00:00.000Z"
}
```

---

## 🛒 **ORDER MANAGEMENT ENDPOINTS**

### **1. Create Order (Buyers)**
**POST** `/api/orders`
```javascript
// INPUT
{
  "listingId": "676listing123",
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

// OUTPUT
{
  "success": true,
  "data": {
    "_id": "676order123",
    "listingId": "676listing123",
    "buyerId": "buyer123", 
    "sellerId": "seller123",
    "status": "CREATED",
    "shippingAddress": { /* Address object */ },
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
        "timestamp": "2026-03-02T10:00:00.000Z",
        "actorId": "buyer123"
      }
    ],
    "createdAt": "2026-03-02T10:00:00.000Z"
  }
}
```

### **2. Get Order Details**
**GET** `/api/orders/:id`
```javascript
// OUTPUT
{
  "success": true,
  "data": {
    "_id": "676order123",
    "listingId": { /* Populated listing object */ },
    "buyerId": { /* Populated buyer object */ },
    "sellerId": { /* Populated seller object */ },
    "status": "IN_INSPECTION",
    "shippingAddress": { /* Address object */ },
    "financials": { /* Financial breakdown */ },
    "timeline": [
      {
        "status": "CREATED", 
        "timestamp": "2026-03-02T10:00:00.000Z",
        "actorId": "buyer123",
        "note": "Order created"
      },
      {
        "status": "ESCROW_LOCKED",
        "timestamp": "2026-03-02T11:00:00.000Z", 
        "actorId": "buyer123",
        "note": "Payment confirmed"
      }
    ]
  }
}
```

### **3. Get My Orders**
**GET** `/api/orders/my-orders?role=buyer&status=COMPLETED&page=1&limit=20`
```javascript
// Query Parameters:
// - role: buyer|seller (filter by user's role in orders)
// - status: CREATED|ESCROW_LOCKED|IN_INSPECTION|COMPLETED|etc
// - page: Number
// - limit: Number  

// OUTPUT - Array of user's orders
```

### **4. Update Order Status**
**POST** `/api/orders/:id/transition`
```javascript
// INPUT
{
  "newState": "SHIPPING", // Valid transitions based on current status
  "note": "Package shipped via Giao Hang Nhanh #GHN123"
}

// OUTPUT
{
  "success": true,
  "order": { /* Updated order object */ }
}

// Valid State Transitions:
// CREATED → ESCROW_LOCKED (after payment)
// ESCROW_LOCKED → IN_INSPECTION (inspector assigned)
// IN_INSPECTION → INSPECTION_PASSED/FAILED
// INSPECTION_PASSED → SHIPPING (seller ships)
// SHIPPING → DELIVERED (buyer confirms)
// DELIVERED → COMPLETED (money released)
```

---

## 💳 **PAYMENT ENDPOINTS**

### **1. Create Payment Link**
**POST** `/api/payment/create-link`
```javascript
// INPUT  
{
  "orderId": "676order123"
}

// OUTPUT
{
  "success": true,
  "paymentLink": "https://pay.payos.vn/web/676order123",
  "orderCode": 123456789
}
```

### **2. Payment Webhook (PayOS calls this)** 
**POST** `/api/payment/webhook`
> ⚠️ **Note:** FE không cần gọi endpoint này. PayOS tự động gọi khi payment complete.

---

## 🔍 **INSPECTION ENDPOINTS**

### **1. Submit Inspection Report (Inspectors only)**
**POST** `/api/inspections`
```javascript
// INPUT
{
  "orderId": "676order123", 
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
    },
    {
      "component": "Chain",
      "status": "FAIL", 
      "severity": "MEDIUM",
      "observation": "Xích đã kéo dài 0.75%, cần thay ngay"
    }
  ],
  "overallVerdict": "SUGGEST_ADJUSTMENT",
  "overallScore": 7.5,
  "inspectorNote": "Xe tổng thể tốt nhưng cần thay xích và má phanh"
}

// OUTPUT
{
  "success": true,
  "message": "Inspection report submitted successfully",
  "data": { /* Inspection report object */ }
}
```

### **2. Get Inspection Reports**
**GET** `/api/inspections?page=1&limit=20`
```javascript
// OUTPUT - Array of inspection reports
```

### **3. Get Inspection Report Details**
**GET** `/api/inspections/:id`
```javascript
// OUTPUT - Full inspection report with all checkpoints
```

---

## 💬 **MESSAGING ENDPOINTS** 

### **1. Get/Create Conversation**
**GET** `/api/messages/conversation/:userId?listingId=676listing123&orderId=676order123`
```javascript
// OUTPUT
{
  "success": true,
  "data": {
    "_id": "676conversation123",
    "participants": ["user1", "user2"],
    "listingId": "676listing123", // Optional context
    "orderId": "676order123", // Optional context
    "lastMessage": {
      "content": "Xe này còn bảo hành không ạ?",
      "timestamp": "2026-03-02T10:30:00.000Z"
    },
    "unreadCount": 2,
    "createdAt": "2026-03-01T15:00:00.000Z"
  }
}
```

### **2. Send Message**
**POST** `/api/messages`
```javascript
// INPUT
{
  "conversationId": "676conversation123",
  "receiverId": "receiverUserId", 
  "content": "Xe này còn bảo hành không ạ?",
  "attachments": ["image_url1", "image_url2"] // Optional
}

// OUTPUT
{
  "success": true,
  "data": {
    "_id": "676message123",
    "conversationId": "676conversation123",
    "senderId": "senderUserId",
    "receiverId": "receiverUserId",
    "content": "Xe này còn bảo hành không ạ?", 
    "attachments": ["image_url1"],
    "timestamp": "2026-03-02T10:30:00.000Z",
    "readStatus": "SENT" // SENT, DELIVERED, READ
  }
}
```

### **3. Get Messages in Conversation**
**GET** `/api/messages/list/:conversationId?page=1&limit=50`
```javascript
// OUTPUT
{
  "success": true,
  "data": [
    {
      "_id": "676message123",
      "senderId": { /* Populated sender info */ },
      "content": "Xe này còn bảo hành không ạ?",
      "attachments": ["image_url"],
      "timestamp": "2026-03-02T10:30:00.000Z",
      "readStatus": "READ"
    }
  ],
  "totalPages": 3,
  "currentPage": 1
}
```

### **4. Get All Conversations**
**GET** `/api/messages/conversations?page=1&limit=20`
```javascript
// OUTPUT - Array of user's conversations with last message preview
```

### **5. Mark Message as Read**
**PUT** `/api/messages/:messageId/read`
```javascript
// OUTPUT
{
  "success": true,
  "message": "Message marked as read"
}
```

---

## 🤖 **CHATBOT ENDPOINTS**

### **1. Send Message to AI Bot**
**POST** `/api/chatbot/webhook`
```javascript
// INPUT
{
  "message": "Tôi cao 1m8 và nặng 65kg thì nên chạy xe đạp nào?",
  "userId": "userId123" // Optional if using Bearer token
}

// OUTPUT
{
  "success": true,
  "reply": "Với chiều cao 1m8, bạn nên chọn xe đạp size L (56-58cm). Dựa vào cân nặng 65kg, xe đạp road bike hoặc gravel bike sẽ phù hợp..."
}
```

### **2. Get Chatbot History**
**GET** `/api/chatbot/history?page=1&limit=20`
```javascript
// OUTPUT - Array of previous chatbot conversations
```

---

## ⭐ **REVIEWS & RATINGS ENDPOINTS**

### **1. Create Review (Buyers only, after order completion)**
**POST** `/api/reviews`
```javascript
// INPUT
{
  "orderId": "676order123",
  "rating": 5,
  "comment": "Xe đẹp, đúng mô tả, seller nhiệt tình", 
  "categories": {
    "itemAccuracy": 5,
    "communication": 5,
    "shipping": 4,
    "packaging": 5
  }
}

// OUTPUT
{
  "success": true,
  "message": "Review created successfully",
  "data": { /* Review object */ }
}
```

### **2. Get Reviews for User**
**GET** `/api/reviews/:userId?page=1&limit=20`
```javascript
// OUTPUT
{
  "success": true,
  "data": [
    {
      "_id": "676review123",
      "orderId": "676order123",
      "buyerId": { /* Buyer info */ },
      "sellerId": { /* Seller info */ },
      "rating": 5,
      "comment": "Xe đẹp, đúng mô tả, seller nhiệt tình",
      "categories": {
        "itemAccuracy": 5,
        "communication": 5, 
        "shipping": 4,
        "packaging": 5
      },
      "createdAt": "2026-03-02T15:00:00.000Z"
    }
  ],
  "averageRating": 4.8,
  "totalReviews": 25
}
```

---

## 💝 **WISHLIST ENDPOINTS**

### **1. Add to Wishlist**
**POST** `/api/wishlist`
```javascript
// INPUT
{
  "listingId": "676listing123"
}

// OUTPUT
{
  "success": true,
  "message": "Added to wishlist"
}
```

### **2. Get Wishlist**
**GET** `/api/wishlist?page=1&limit=20&sort=-addedAt`
```javascript
// OUTPUT
{
  "success": true,
  "data": [
    {
      "_id": "676wishlist123",
      "listingId": { /* Populated listing object */ },
      "addedAt": "2026-03-01T10:00:00.000Z"
    }
  ],
  "totalItems": 5
}
```

### **3. Check if Listing is in Wishlist**
**GET** `/api/wishlist/check/:listingId`
```javascript
// OUTPUT
{
  "success": true,
  "inWishlist": true
}
```

### **4. Remove from Wishlist**
**DELETE** `/api/wishlist/:listingId`
```javascript
// OUTPUT
{
  "success": true,
  "message": "Removed from wishlist"
}
```

### **5. Get Wishlist Count**
**GET** `/api/wishlist/count`
```javascript
// OUTPUT
{
  "success": true,
  "count": 5
}
```

### **6. Clear All Wishlist**
**DELETE** `/api/wishlist/clear`
```javascript
// OUTPUT
{
  "success": true,
  "message": "Wishlist cleared"
}
```

---

## 📤 **FILE UPLOAD ENDPOINTS**

### **1. Upload Single Image**
**POST** `/api/upload`
```javascript
// Content-Type: multipart/form-data
// Field: image (File)

// OUTPUT
{
  "success": true,
  "url": "https://res.cloudinary.com/velobike/...",
  "publicId": "velobike_listings/abc123"
}
```

### **2. Upload 360° Images** 
**POST** `/api/upload/360`
```javascript
// Content-Type: multipart/form-data
// Field: images (File[]) - up to 72 images

// OUTPUT
{
  "success": true,
  "urls": ["url1", "url2", "url3", ...],
  "publicIds": ["id1", "id2", "id3", ...]
}
```

### **3. Get My Images**
**GET** `/api/upload/my-images?folder=velobike_listings&limit=50`
```javascript
// OUTPUT
{
  "success": true,
  "data": [
    {
      "publicId": "velobike_listings/abc123",
      "url": "https://res.cloudinary.com/...",
      "uploadedAt": "2026-03-02T10:00:00.000Z"
    }
  ]
}
```

### **4. Delete Image**
**DELETE** `/api/upload/:publicId`
```javascript
// OUTPUT
{
  "success": true,
  "message": "Image deleted successfully"
}
```

---

## 🔔 **NOTIFICATIONS ENDPOINTS**

### **1. Get Notifications**
**GET** `/api/notifications?page=1&limit=20&type=ORDER_UPDATE`
```javascript
// Query Parameters:
// - page: Number
// - limit: Number
// - type: ORDER_UPDATE|MESSAGE|PAYMENT|SYSTEM
// - isRead: true|false

// OUTPUT
{
  "success": true,
  "data": [
    {
      "_id": "676notif123",
      "userId": "user123",
      "type": "ORDER_UPDATE",
      "title": "Đơn hàng đã được giao",
      "message": "Đơn hàng #676order123 đã được giao thành công",
      "data": {
        "orderId": "676order123",
        "status": "DELIVERED"
      },
      "isRead": false,
      "createdAt": "2026-03-02T14:30:00.000Z"
    }
  ],
  "unreadCount": 3
}
```

### **2. Mark Notification as Read**
**PUT** `/api/notifications/:id/read`
```javascript
// OUTPUT
{
  "success": true,
  "message": "Notification marked as read"
}
```

### **3. Mark All Notifications as Read**
**PUT** `/api/notifications/read-all`
```javascript
// OUTPUT
{
  "success": true,
  "message": "All notifications marked as read"
}
```

---

## 💰 **SELLER SUBSCRIPTION ENDPOINTS**

### **1. Get All Subscription Plans**
**GET** `/api/subscriptions/plans`
```javascript
// OUTPUT
{
  "success": true,
  "data": [
    {
      "name": "FREE",
      "displayName": "Gói Miễn Phí", 
      "price": 0,
      "duration": 30,
      "commissionRate": 0.12,
      "maxListingsPerMonth": 2,
      "features": ["2 tin đăng/tháng", "Phí hoa hồng 12%", "Hỗ trợ cơ bản"],
      "boostPerWeek": 0,
      "freeInspectionsPerMonth": 0,
      "badge": null
    },
    {
      "name": "PREMIUM",
      "displayName": "Gói Cao Cấp",
      "price": 599000,
      "duration": 30,
      "commissionRate": 0.05,
      "maxListingsPerMonth": -1,
      "features": [
        "Không giới hạn tin đăng",
        "Phí hoa hồng 5%",
        "Badge 'Premium Seller' 👑"
      ],
      "boostPerWeek": 3,
      "freeInspectionsPerMonth": 2,
      "badge": {
        "text": "Premium Seller 👑",
        "color": "#FFD700"
      }
    }
  ]
}
```

### **2. Get My Subscription**
**GET** `/api/subscriptions/my-subscription`
```javascript
// OUTPUT
{
  "success": true,
  "data": {
    "planType": "PRO",
    "displayName": "Gói Chuyên Nghiệp",
    "price": 299000,
    "status": "ACTIVE",
    "currentPeriodStart": "2026-03-01T00:00:00.000Z",
    "currentPeriodEnd": "2026-03-31T23:59:59.000Z",
    "usageStats": {
      "listingsUsed": 8,
      "listingsLimit": 30,
      "boostsUsed": 2,
      "boostsLimit": 4
    }
  }
}
```

### **3. Check Listing Quota**
**GET** `/api/subscriptions/check-quota`
```javascript
// OUTPUT
{
  "success": true,
  "data": {
    "canCreate": true,
    "reason": "Within quota limit",
    "used": 8,
    "limit": 30,
    "planType": "PRO"
  }
}
```

### **4. Subscribe to Plan**
**POST** `/api/subscriptions/subscribe`
```javascript
// INPUT
{
  "planType": "PRO"
}

// OUTPUT
{
  "success": true,
  "message": "Subscription created successfully",
  "paymentLink": "https://pay.payos.vn/subscription/...",
  "data": { /* Subscription object */ }
}
```

---

## 📊 **ANALYTICS ENDPOINTS (Sellers)**

### **1. Get Seller Dashboard Analytics**
**GET** `/api/analytics/seller/dashboard`
```javascript
// OUTPUT
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
    "topListings": [
      {
        "listingId": "676listing123",
        "title": "Trek Domane SL6 2023",
        "views": 250,
        "inquiries": 12,
        "revenue": 45000000
      }
    ],
    "recentTransactions": [ /* Array of recent sales */ ]
  }
}
```

### **2. Get Seller Performance**
**GET** `/api/analytics/seller/performance?period=30d`
```javascript
// Query Parameters:
// - period: 7d|30d|90d

// OUTPUT - Performance metrics over time
```

### **3. Get Listing Analytics**
**GET** `/api/analytics/listing/:id`
```javascript
// OUTPUT
{
  "success": true,
  "data": {
    "listingId": "676listing123",
    "totalViews": 250,
    "uniqueViews": 180,
    "inquiries": 15,
    "wishlists": 8,
    "viewsOverTime": [
      { "date": "2026-03-01", "views": 50 },
      { "date": "2026-03-02", "views": 75 }
    ]
  }
}
```

---

## 💳 **WALLET & FINANCE ENDPOINTS**

### **1. Request Withdrawal**
**POST** `/api/wallet/withdraw`
```javascript
// INPUT
{
  "amount": 5000000,
  "bankAccount": {
    "bankName": "Vietcombank",
    "accountNumber": "1234567890", 
    "accountName": "NGUYEN VAN A",
    "branch": "Chi nhánh Quận 1"
  }
}

// OUTPUT
{
  "success": true,
  "message": "Withdrawal request submitted successfully",
  "data": {
    "_id": "676withdrawal123",
    "amount": 5000000,
    "fee": 0, // Free because amount >= 1,000,000
    "netAmount": 5000000,
    "status": "PENDING",
    "bankAccount": { /* Bank details */ }
  }
}
```

### **2. Get Withdrawal History**
**GET** `/api/wallet/withdrawals?page=1&limit=20&status=COMPLETED`
```javascript
// Query Parameters:
// - page: Number
// - limit: Number  
// - status: PENDING|APPROVED|COMPLETED|REJECTED

// OUTPUT - Array of withdrawal requests
```

---

## 🚚 **LOGISTICS ENDPOINTS**

### **1. Calculate Shipping Cost**
**POST** `/api/logistics/calculate-shipping`
```javascript
// INPUT
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

// OUTPUT
{
  "success": true,
  "data": {
    "cost": 150000,
    "currency": "VND",
    "estimatedDays": "2-3",
    "carrier": "Giao Hang Nhanh"
  }
}
```

### **2. Create Shipping Order**
**POST** `/api/logistics/create-shipping`
```javascript
// INPUT - Shipping details for order
// OUTPUT - Tracking number and shipping info
```

### **3. Track Package**
**GET** `/api/logistics/track/:trackingNumber`
```javascript
// OUTPUT - Package tracking status and location updates
```

---

## ⚖️ **DISPUTE ENDPOINTS**

### **1. Create Dispute**
**POST** `/api/disputes`
```javascript
// INPUT
{
  "orderId": "676order123",
  "reason": "ITEM_NOT_AS_DESCRIBED",
  "description": "Xe bị hư phanh nhưng không nói trước",
  "evidence": ["image_url1", "image_url2"]
}

// OUTPUT
{
  "success": true,
  "message": "Dispute created successfully",
  "data": { /* Dispute object */ }
}
```

### **2. Get My Disputes**
**GET** `/api/disputes?status=OPEN&page=1&limit=20`
```javascript
// OUTPUT - Array of user's disputes
```

### **3. Add Comment to Dispute**
**POST** `/api/disputes/:id/comments`
```javascript
// INPUT
{
  "comment": "Tôi có thêm chứng cứ về vấn đề phanh",
  "attachments": ["evidence_image.jpg"]
}

// OUTPUT
{
  "success": true,
  "message": "Comment added successfully"
}
```

---

## 🚨 **PRICE ALERTS ENDPOINTS**

### **1. Create Price Alert**
**POST** `/api/alerts`
```javascript
// INPUT
{
  "searchCriteria": {
    "brand": "Trek",
    "type": "ROAD", 
    "location": "Ho Chi Minh",
    "maxPrice": 40000000
  },
  "alertPrice": 35000000,
  "alertEmail": true,
  "alertPush": true
}

// OUTPUT
{
  "success": true,
  "message": "Price alert created successfully",
  "data": { /* Alert object */ }
}
```

### **2. Get My Alerts**
**GET** `/api/alerts?page=1&limit=20&active=true`
```javascript
// OUTPUT - Array of user's price alerts
```

### **3. Update Alert**
**PUT** `/api/alerts/:id`
```javascript
// INPUT - Updated alert criteria
```

### **4. Delete Alert**
**DELETE** `/api/alerts/:id`
```javascript
// OUTPUT
{
  "success": true,
  "message": "Alert deleted successfully" 
}
```

---

## 🔗 **WEBSOCKET EVENTS (Socket.io)**

### **Connection**
```javascript
const socket = io('http://localhost:5000', {
  auth: {
    token: 'jwt_access_token_here'
  }
});
```

### **Events to Listen (Receive)**
```javascript
// New message received
socket.on('message', (data) => {
  console.log('New message:', data);
  // data: { conversationId, message, sender }
});

// Order status updated
socket.on('orderUpdate', (data) => {
  console.log('Order updated:', data);
  // data: { orderId, status, note }
});

// New notification
socket.on('notification', (data) => {
  console.log('Notification:', data);
  // data: { type, title, message, data }
});

// User online status
socket.on('userOnline', (userId) => {
  console.log(`User ${userId} is online`);
});

// User offline status 
socket.on('userOffline', (userId) => {
  console.log(`User ${userId} went offline`);
});

// Typing indicator
socket.on('typing', (data) => {
  console.log('User typing:', data);
  // data: { conversationId, userId, isTyping }
});
```

### **Events to Emit (Send)**
```javascript
// Join conversation room
socket.emit('joinConversation', conversationId);

// Join order room for updates
socket.emit('joinOrder', orderId);

// Send typing indicator
socket.emit('typing', { 
  conversationId: 'conv123',
  isTyping: true 
});

// Mark user as online
socket.emit('online', userId);
```

---

## ⚠️ **ERROR HANDLING**

### **Standard Error Response Format**
```javascript
{
  "success": false,
  "message": "Error description",
  "errors": [ /* Array of validation errors (if applicable) */ ],
  "code": "ERROR_CODE" // Optional error code
}
```

### **HTTP Status Codes**
- **200** - Success
- **201** - Created successfully
- **400** - Bad request / Validation error
- **401** - Unauthorized (invalid/expired token)
- **403** - Forbidden (insufficient permissions)
- **404** - Resource not found
- **409** - Conflict (duplicate resource)
- **422** - Validation failed
- **429** - Too many requests (rate limited)
- **500** - Internal server error

### **Rate Limiting**
- **General**: 100 requests per 15 minutes
- **Auth endpoints**: 10 requests per 15 minutes
- **Payment endpoints**: 5 requests per 15 minutes  
- **Upload endpoints**: 20 requests per 15 minutes
- **Search endpoints**: 50 requests per 15 minutes

---

## 🚀 **MOBILE DEVELOPMENT NOTES**

### **Authentication Flow**
1. **Store both tokens**: `accessToken` + `refreshToken`
2. **Auto-refresh logic**: When API returns 401 → call `/api/auth/refresh-token` → retry request
3. **Logout properly**: Call `/api/auth/logout` to revoke tokens

### **Image Handling**
1. **Upload first**: Use `/api/upload` or `/api/upload/360`
2. **Get URLs**: Use returned URLs in listing creation
3. **Optimize images**: Compress before upload for better performance

### **Real-time Features**
1. **Connect WebSocket**: On user login
2. **Join rooms**: For conversations and orders
3. **Handle reconnection**: When app resumes from background

### **Offline Support**  
1. **Cache listings**: For offline browsing
2. **Store conversations**: For offline message viewing
3. **Sync on reconnect**: Upload cached data when back online

### **Performance Tips**
1. **Pagination**: Use for all lists (listings, messages, orders)
2. **Debounce search**: Wait 300ms after user stops typing
3. **Image lazy loading**: Load images as needed
4. **Cache API responses**: For 5-10 minutes on frequently accessed data

### **Security**
1. **Validate inputs**: Client-side validation for UX
2. **Trust server responses**: Server validation is authoritative  
3. **Handle token expiry**: Graceful refresh and fallback
4. **Secure storage**: Use secure storage for tokens

---

**Happy Coding! 🚴‍♂️📱**

> **Note**: All endpoints return JSON format. For file uploads, use `multipart/form-data`. For WebSocket events, establish connection after successful authentication.