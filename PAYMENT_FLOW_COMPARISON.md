# So sánh Payment Flow: Web vs Mobile

## 📊 Tổng quan

Payment flow của **User mua xe** trong mobile **THIẾU NHIỀU** so với web. Mobile chỉ có basic flow, còn web có polling, sync PayOS, và error handling tốt hơn.

---

## 🔄 Payment Flow Comparison

### **WEB (Hoàn chỉnh)** ✅

```
1. User tạo order → CreateOrder
   ↓
2. User vào PaymentScreen
   ↓
3. Click "Thanh toán" → API: POST /payment/create-link
   ← Nhận { paymentLink, orderCode }
   ↓
4. Redirect sang PayOS payment page (external)
   ← User thanh toán qua QR/Bank transfer
   ↓
5. PayOS redirect về: /payment/success?orderCode=xxx&status=PAID
   ↓
6. PaymentSuccess page:
   - Lưu pendingOrderId vào localStorage ✅
   - POLLING mỗi 2s để check order status ✅
   - Gọi GET /orders/{orderId} để lấy status
   ↓
7. Nếu order vẫn là CREATED:
   - Parse orderCode từ URL
   - Gọi GET /payment/info/{orderCode} để check PayOS status ✅
   - Nếu PayOS status = PAID:
     → Manually trigger webhook: POST /payment/webhook ✅
     → Gửi payload PayOS data để sync
   ↓
8. Polling tiếp tục cho đến khi:
   - Order status = ESCROW_LOCKED (thành công) ✅
   - Hoặc timeout (20 polls = 40s) → Show warning ✅
   ↓
9. Hiển thị success UI và cleanup localStorage
```

### **MOBILE (Thiếu nhiều)** ❌

```
1. User tạo order → CreateOrder
   ↓
2. User vào PaymentScreen
   ↓
3. Click "Thanh toán" → API: POST /payment/create-link
   ← Nhận { paymentLink, orderCode }
   ↓
4. Navigate to PaymentWebViewScreen
   - Load paymentLink trong WebView
   - User thanh toán qua QR/Bank transfer
   ↓
5. WebView detect URL change:
   - Nếu URL contains "success" → Navigate to PaymentSuccessScreen
   - Nếu URL contains "cancel/failed" → Go back
   ↓
6. PaymentSuccessScreen:
   - Chỉ hiển thị static success message ❌
   - KHÔNG có polling ❌
   - KHÔNG check order status ❌
   - KHÔNG sync với PayOS ❌
   ↓
7. User click "Xem chi tiết đơn hàng"
   → Navigate to OrderDetailScreen
```

---

## ⚠️ VẤN ĐỀ NGHIÊM TRỌNG trong Mobile

### 1. **Không có Polling/Verification** ❌
**Web:**
- Polling mỗi 2s để check order status
- Timeout sau 40s nếu không cập nhật
- Show warning nếu payment chậm sync

**Mobile:**
- Không có polling → User không biết payment có thành công thật không
- Trust 100% vào URL callback → Có thể bị fake success URL
- Không verify với backend

### 2. **Không có PayOS Sync Fallback** ❌
**Web:**
- Nếu webhook chậm/failed → Manually trigger webhook
- Gọi `/payment/info/{orderCode}` để lấy PayOS status
- Gọi `/payment/webhook` để force sync

**Mobile:**
- Không có fallback mechanism
- Nếu webhook failed → Order застрянет ở CREATED status
- User nghĩ đã thanh toán nhưng backend chưa nhận được

### 3. **Không lưu pendingOrderId** ❌
**Web:**
```javascript
localStorage.setItem('pendingOrderId', orderId);
// Sau khi success:
localStorage.removeItem('pendingOrderId');
```

**Mobile:**
- Không lưu order state
- Nếu app bị kill hoặc user close WebView → Mất track order
- Không thể retry verification

### 4. **WebView Navigation Detection không tin cậy** ⚠️
**Mobile hiện tại:**
```javascript
const isPaymentSuccessUrl = (url: string): boolean => {
  return url.includes('/payment/success') || 
         url.includes('status=paid');
};
```

**Vấn đề:**
- PayOS có thể thay đổi URL format
- Không verify với backend → Có thể navigate success khi chưa thật sự paid
- Không handle redirect qua nhiều bước (PayOS → Bank → PayOS → App)

### 5. **Không có Timeout/Error Handling** ❌
**Web:**
- Polling timeout 40s
- Show warning nếu quá lâu
- Cho phép retry

**Mobile:**
- Không có timeout
- WebView có thể load mãi
- Không có error recovery

---

## 📋 CHECKLIST: Mobile cần làm gì

### **Critical (Phải có ngay):**

- [ ] **Implement Polling trong PaymentSuccessScreen**
  - Poll `/orders/{orderId}` mỗi 2s
  - Check status: ESCROW_LOCKED = success
  - Timeout sau 20 polls (40s)

- [ ] **Implement PayOS Sync Fallback**
  - Parse orderCode từ navigation/params
  - Gọi `/payment/info/{orderCode}` để check PayOS
  - Nếu PayOS PAID nhưng order CREATED → Trigger `/payment/webhook`

- [ ] **Store pendingOrderId**
  - Lưu vào AsyncStorage trước khi navigate PaymentWebView
  - Dùng trong PaymentSuccessScreen để polling
  - Clear sau khi success

- [ ] **Improve PaymentWebViewScreen**
  - Validate URL callback với backend API
  - Không trust URL pattern hoàn toàn
  - Handle loading/timeout states

### **Important (Nên có):**

- [ ] **Add Error Recovery**
  - Button "Kiểm tra lại" nếu timeout
  - Link đến support nếu failed
  - Show order status realtime

- [ ] **Add Loading States**
  - Show "Đang xác nhận thanh toán..." trong PaymentSuccess
  - Progress bar cho polling
  - Poll count display (5/20)

- [ ] **Handle Edge Cases**
  - App killed during payment → Recover từ pendingOrderId
  - Network timeout → Retry mechanism
  - PayOS redirect qua nhiều steps

### **Nice to Have:**

- [ ] **Payment History**
  - Cache payment attempts
  - Show "Resume incomplete payment"

- [ ] **Push Notifications**
  - Notify khi payment confirmed
  - Notify nếu payment failed

---

## 🔧 Code cần thêm (Outline - KHÔNG VIẾT CODE)

### 1. PaymentSuccessScreen.tsx
```typescript
// CẦN THÊM:
- useState cho polling status
- useEffect polling every 2s
- Gọi GET /orders/{orderId}
- Nếu CREATED và có orderCode:
  → Gọi GET /payment/info/{orderCode}
  → Nếu PAID: Gọi POST /payment/webhook
- Nếu ESCROW_LOCKED: Stop polling, show success
- Timeout handling (20 polls)
```

### 2. PaymentWebViewScreen.tsx
```typescript
// CẦN THÊM:
- Trước khi navigate PaymentWebView:
  → AsyncStorage.setItem('pendingOrderId', orderId)
  → AsyncStorage.setItem('pendingOrderCode', orderCode)
- Timeout cho WebView loading (30s)
- Better URL validation (không chỉ dựa vào string matching)
```

### 3. API calls cần thêm
```typescript
// CẦN API CLIENTS:
- GET /payment/info/{orderCode} - Check PayOS status
- POST /payment/webhook - Manual trigger webhook
- GET /orders/{orderId} - Poll order status
```

---

## 🎯 Ưu tiên sửa

### **Priority 1 (Ngay lập tức):**
1. Implement polling trong PaymentSuccessScreen
2. Store pendingOrderId trong AsyncStorage
3. Verify order status với backend

### **Priority 2 (Sớm):**
4. PayOS sync fallback
5. Error handling và timeout
6. Improve WebView navigation detection

### **Priority 3 (Sau):**
7. Push notifications
8. Payment history
9. Better UX với loading states

---

## 💡 Khuyến nghị

### Approach 1: Copy từ Web (Recommended ✅)
- Web đã xử lý tất cả edge cases
- Proven và đã test kỹ
- Chỉ cần port logic qua React Native

### Approach 2: Simplify
- Nếu không cần perfect:
  - Tối thiểu: Polling + timeout
  - Skip PayOS sync fallback
  - Rely on webhook (90% cases)

### Approach 3: Deep Link (Best UX nhưng phức tạp)
- Setup deep linking cho app
- PayOS redirect về `velobike://payment-success?orderCode=xxx`
- App handle deep link và verify
- Better UX hơn WebView

---

## 📝 Notes

1. **Webhook Reliability:**
   - PayOS webhook CÓ THỂ failed/delayed
   - Không nên trust 100% webhook
   - Phải có fallback verification

2. **Mobile WebView Limitations:**
   - Cannot detect all redirects reliably
   - Bank apps có thể open external browser
   - Deep linking là solution tốt hơn

3. **User Experience:**
   - User PHẢI biết payment status realtime
   - "Đang xử lý..." là must-have
   - Timeout message phải clear

---

**Kết luận:** Mobile payment flow thiếu nhiều so với web, đặc biệt là **polling và verification**. Priority cao nhất là implement polling để verify order status sau payment.
