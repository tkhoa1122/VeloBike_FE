# 📦 VeloBike - Hướng Dẫn Cài Đặt Thư Viện

## 🎯 Tổng Quan

Project VeloBike đã implement đầy đủ **17/17 features** cho buyer/user role. Tuy nhiên, một số tính năng cần cài thêm native libraries để hoạt động đầy đủ.

---

## ✅ Đã Cài Sẵn (Ready to Use)

Các thư viện sau đã có trong `package.json`:

- ✅ `react-native-image-picker@^8.2.1` - Upload ảnh
- ✅ `@react-native-async-storage/async-storage` - Local storage
- ✅ `@react-native-community/netinfo` - Network status
- ✅ `zustand` - State management
- ✅ `socket.io-client` - Real-time messaging
- ✅ `react-native-toast-message` - Toast notifications

---

## 🔧 Cần Cài Thêm (Optional but Recommended)

### **1. React Native WebView** (Cho PaymentWebViewScreen)

```bash
npm install react-native-webview
```

**iOS:**
```bash
cd ios && pod install && cd ..
```

**Sử dụng trong:**
- `src/presentation/screens/orders/PaymentWebViewScreen.tsx`
- Load PayOS payment gateway trong WebView

**Cách enable:** Uncomment code trong `PaymentWebViewScreen.tsx` (line 71-92)

---

### **2. React Native Maps** (Cho LocationPickerScreen)

```bash
npm install react-native-maps
```

**iOS (Info.plist):**
```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>VeloBike cần quyền truy cập vị trí để tìm xe gần bạn</string>
```

**Android (AndroidManifest.xml):**
```xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<meta-data
  android:name="com.google.android.geo.API_KEY"
  android:value="YOUR_GOOGLE_MAPS_API_KEY"/>
```

**iOS:**
```bash
cd ios && pod install && cd ..
```

**Sử dụng trong:**
- `src/presentation/screens/map/LocationPickerScreen.tsx`
- Chọn vị trí giao hàng trên bản đồ

**Cách enable:** Uncomment code trong `LocationPickerScreen.tsx` (line 64-93)

---

### **3. React Native Geolocation** (Cho GPS Location)

```bash
npm install @react-native-community/geolocation
```

**iOS (Info.plist):**
```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>VeloBike cần quyền truy cập vị trí để tìm xe gần bạn</string>
```

**Android (AndroidManifest.xml):**
```xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
```

**iOS:**
```bash
cd ios && pod install && cd ..
```

**Sử dụng trong:**
- `src/presentation/hooks/useLocation.ts`
- Lấy vị trí hiện tại của user

**Cách enable:** Uncomment code trong `useLocation.ts` (line 82-99)

---

## 🚀 Cài Tất Cả Cùng Lúc

```bash
# Install all optional libraries
npm install react-native-webview react-native-maps @react-native-community/geolocation

# iOS: Install pods
cd ios && pod install && cd ..

# Run app
npm run android
# hoặc
npm run ios
```

---

## 📁 Files Cần Uncomment Sau Khi Cài

### **1. PaymentWebViewScreen.tsx**
File: `src/presentation/screens/orders/PaymentWebViewScreen.tsx`

Uncomment dòng 2:
```typescript
import { WebView } from 'react-native-webview';
```

Uncomment dòng 64-85 (WebView component)

---

### **2. LocationPickerScreen.tsx**
File: `src/presentation/screens/map/LocationPickerScreen.tsx`

Uncomment dòng 10-11:
```typescript
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
```

Uncomment dòng 64-93 (MapView component)

---

### **3. useLocation.ts**
File: `src/presentation/hooks/useLocation.ts`

Uncomment dòng 2:
```typescript
import Geolocation from '@react-native-community/geolocation';
```

Uncomment dòng 82-99 (getCurrentPosition logic)

---

## ✅ Checklist Sau Khi Cài

- [ ] Cài `react-native-webview`
- [ ] Cài `react-native-maps`
- [ ] Cài `@react-native-community/geolocation`
- [ ] Add Google Maps API key (Android)
- [ ] Add location permissions (iOS Info.plist & Android Manifest)
- [ ] Run `pod install` trên iOS
- [ ] Uncomment code trong 3 files trên
- [ ] Test payment flow
- [ ] Test location picker
- [ ] Test GPS location

---

## 🎯 Tính Năng Hoạt Động Ngay (Không Cần Cài Gì)

✅ **Payment Infrastructure** - PaymentStore, API Client, UseCases
✅ **File Upload System** - UploadStore, Image Picker Hook
✅ **Review System** - Full CRUD với ratings
✅ **Inspection Report Viewer** - Xem báo cáo kiểm định
✅ **Dispute System** - Tạo khiếu nại, thêm comments
✅ **Chatbot Support** - AI assistant interface
✅ **Media Upload in Chat** - Gửi ảnh trong chat
✅ **Image Picker** - Chụp/chọn ảnh từ thư viện

---

## 📚 Documentation

Xem thêm:
- `MOBILE_API_ENDPOINTS.md` - API documentation
- `MOBILE_APP_FLOWS.md` - User flows & features
- `ARCHITECTURE.md` - Clean Architecture structure

---

## 🐛 Troubleshooting

### **Issue: WebView không hoạt động**
```bash
npm install react-native-webview
cd ios && pod install && cd ..
npx react-native run-ios
```

### **Issue: Maps không hiển thị**
- Kiểm tra Google Maps API key
- Kiểm tra location permissions
- Restart app

### **Issue: Image picker lỗi permission**
- iOS: Kiểm tra Info.plist
- Android: Kiểm tra AndroidManifest.xml
- Request permissions trong app

---

## 💡 Tips

1. **Development Mode:** Tất cả screens có placeholder/demo mode nên có thể test UI mà chưa cần cài native libs
2. **Production:** Nên cài đầy đủ 3 libraries trên để user experience tốt nhất
3. **Testing:** Mock data đã được setup sẵn để test flows

---

**Happy Coding! 🚴‍♂️🚀**
