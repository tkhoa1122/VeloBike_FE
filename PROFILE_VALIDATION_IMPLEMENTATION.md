# Profile Completeness Validation Implementation

## Tổng quan

Đã implement ràng buộc yêu cầu user cập nhật đầy đủ thông tin hồ sơ trước khi thực hiện các hành động quan trọng:

### Thông tin bắt buộc:
- ✅ Họ và tên (`fullName`)
- ✅ Số điện thoại (`phone`)
- ✅ Địa chỉ - Đường/Số nhà (`address.street`)
- ✅ Địa chỉ - Thành phố (`address.city`)

### Ràng buộc áp dụng cho:

1. **Buyer**: Mua hàng
   - Khi bấm nút "Mua ngay" trên `ListingDetailScreen`
   - Khi tạo đơn hàng trên `CreateOrderScreen`

2. **Seller**: Tạo tin đăng
   - Khi submit form tạo/chỉnh sửa listing trên `SellerCreateListingScreen`

---

## Files đã tạo/sửa

### 1. Utility Function - `src/utils/profileValidation.ts` (MỚI)

**Function chính:**
```typescript
checkProfileCompleteness(user: User | null): ProfileCompletenessResult
```

**Return:**
```typescript
{
  isComplete: boolean;
  missingFields: string[];  // Danh sách field còn thiếu
  message?: string;         // Message hiển thị cho user
}
```

**Logic:**
- Check null user → return `isComplete: false`
- Check `fullName.trim()` → empty thì thêm vào `missingFields`
- Check `phone.trim()` → empty thì thêm vào `missingFields`
- Check `address.street.trim()` → empty thì thêm vào `missingFields`
- Check `address.city.trim()` → empty thì thêm vào `missingFields`

---

### 2. Component - `src/presentation/components/common/ProfileIncompleteNotice.tsx` (MỚI)

Banner component hiển thị thông báo profile chưa đầy đủ.

**Props:**
- `missingFields: string[]` - Danh sách field còn thiếu
- `onPress?: () => void` - Handler khi user tap vào banner

**UI:**
- Icon warning màu vàng
- Text "Hồ sơ chưa đầy đủ"
- Danh sách field còn thiếu
- Arrow icon để chỉ dẫn tap

---

### 3. ListingDetailScreen - Nút "Mua ngay"

**File:** `src/presentation/screens/listing/ListingDetailScreen.tsx`

**Thay đổi:**

```typescript
// Thêm import
import { checkProfileCompleteness } from '../../../utils/profileValidation';
import { Alert } from 'react-native';

// Thêm handler mới
const handleBuyClick = useCallback(() => {
  const profileCheck = checkProfileCompleteness(user);
  if (!profileCheck.isComplete) {
    Alert.alert(
      'Hồ sơ chưa đầy đủ',
      profileCheck.message,
      [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Cập nhật hồ sơ', onPress: () => { /* navigate */ } },
      ],
    );
    return;
  }
  
  onBuy?.(listing._id!);
}, [listing, user, onBuy]);

// Thay đổi Button onPress
<Button
  title="Mua ngay"
  onPress={handleBuyClick}  // ← Đổi từ onBuy?.(listing._id!)
  ...
/>
```

**Flow:**
1. User bấm "Mua ngay"
2. Check profile completeness
3. Nếu thiếu info → Alert với 2 button: "Hủy" hoặc "Cập nhật hồ sơ"
4. Nếu đầy đủ → Proceed với `onBuy`

---

### 4. CreateOrderScreen - Tạo đơn hàng

**File:** `src/presentation/screens/orders/CreateOrderScreen.tsx`

**Thay đổi:**

```typescript
// Thêm import
import { checkProfileCompleteness } from '../../../utils/profileValidation';

// Thêm check đầu tiên trong handleCreateOrder
const handleCreateOrder = async () => {
  // Check profile completeness first
  const profileCheck = checkProfileCompleteness(user);
  if (!profileCheck.isComplete) {
    Toast.show({
      type: 'error',
      text1: 'Hồ sơ chưa đầy đủ',
      text2: profileCheck.message,
      visibilityTime: 5000,
      onPress: () => navigation.navigate('Profile'),
    });
    return;
  }

  // ... rest of validation
};
```

**Flow:**
1. User điền form shipping address và bấm "Tiếp tục thanh toán"
2. **TRƯỚC KHI** validate form → Check profile completeness
3. Nếu thiếu → Toast error với thời gian hiển thị 5s, tap vào toast → navigate to Profile
4. Nếu đầy đủ → Continue với form validation như cũ

---

### 5. SellerCreateListingScreen - Tạo tin đăng

**File:** `src/presentation/screens/seller/SellerCreateListingScreen.tsx`

**Thay đổi:**

```typescript
// Thêm import
import { useAuthStore } from '../../viewmodels/AuthStore';
import { checkProfileCompleteness } from '../../../utils/profileValidation';

// Thêm user từ store
const { user } = useAuthStore();

// Thêm check đầu tiên trong handleSubmit
const handleSubmit = async () => {
  // Check profile completeness first
  const profileCheck = checkProfileCompleteness(user);
  if (!profileCheck.isComplete) {
    Alert.alert(
      'Hồ sơ chưa đầy đủ',
      profileCheck.message,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Cập nhật hồ sơ',
          onPress: () => {
            onBack();
            // User manually navigate to Edit Profile
          },
        },
      ],
    );
    return;
  }

  // ... rest of validation
};
```

**Flow:**
1. Seller điền form listing và bấm "Đăng tin" / "Lưu thay đổi"
2. **TRƯỚC KHI** validate form listing → Check profile completeness
3. Nếu thiếu → Alert với 2 button: "Hủy" hoặc "Cập nhật hồ sơ"
4. Nếu đầy đủ → Continue với listing validation như cũ

---

## User Experience Flow

### Scenario 1: Buyer với profile chưa đầy đủ

1. User login với account chỉ có email + password
2. Browse listings
3. Tap vào một listing → Xem chi tiết
4. Bấm nút **"Mua ngay"**
5. **Alert xuất hiện:**
   ```
   Hồ sơ chưa đầy đủ
   
   Vui lòng cập nhật đầy đủ thông tin hồ sơ trước khi mua hàng.
   
   Thông tin còn thiếu: Họ và tên, Số điện thoại, Địa chỉ (Đường/Số nhà), Thành phố
   
   [Hủy]  [Cập nhật hồ sơ]
   ```
6. User bấm "Cập nhật hồ sơ" → Navigate to Edit Profile
7. Fill thông tin → Save
8. Quay lại listing → Bấm "Mua ngay" lần nữa → Thành công

### Scenario 2: Seller với profile chưa đầy đủ

1. User có role SELLER
2. Navigate to "Đăng tin"
3. Điền form listing (title, description, specs...)
4. Bấm **"Đăng tin"**
5. **Alert xuất hiện** (tương tự buyer)
6. User bấm "Cập nhật hồ sơ"
7. Screen close → User tự navigate to Profile
8. Fill thông tin → Save
9. Quay lại form đăng tin → Submit lại → Thành công

---

## Validation Rules

### Required Fields (Bắt buộc):

| Field | Check | Error message nếu thiếu |
|-------|-------|------------------------|
| `fullName` | `!fullName \|\| fullName.trim() === ''` | "Họ và tên" |
| `phone` | `!phone \|\| phone.trim() === ''` | "Số điện thoại" |
| `address.street` | `!address \|\| !address.street \|\| address.street.trim() === ''` | "Địa chỉ (Đường/Số nhà)" |
| `address.city` | `!address \|\| !address.city \|\| address.city.trim() === ''` | "Thành phố" |

### Optional Fields (Không bắt buộc):

- `address.district` (Quận/Huyện)
- `address.province` (Tỉnh)
- `bodyMeasurements.*` (Chiều cao, Inseam, Cân nặng)
- `avatar` (Ảnh đại diện)

---

## Testing Checklist

### Test Case 1: Profile đầy đủ
- [ ] User có đủ: fullName, phone, address.street, address.city
- [ ] Buyer bấm "Mua ngay" → Proceed bình thường
- [ ] Seller submit listing → Proceed bình thường

### Test Case 2: Profile thiếu fullName
- [ ] User không có fullName
- [ ] Buyer bấm "Mua ngay" → Alert hiển thị "Họ và tên"
- [ ] Seller submit listing → Alert hiển thị "Họ và tên"

### Test Case 3: Profile thiếu phone
- [ ] User không có phone
- [ ] Alert hiển thị "Số điện thoại"

### Test Case 4: Profile thiếu address.street
- [ ] User không có address hoặc address.street
- [ ] Alert hiển thị "Địa chỉ (Đường/Số nhà)"

### Test Case 5: Profile thiếu address.city
- [ ] User không có address.city
- [ ] Alert hiển thị "Thành phố"

### Test Case 6: Profile thiếu nhiều field
- [ ] User thiếu fullName + phone
- [ ] Alert hiển thị: "Họ và tên, Số điện thoại"

### Test Case 7: User chưa login
- [ ] `user` = null
- [ ] Alert hiển thị: "Vui lòng đăng nhập để tiếp tục"

---

## Notes

### Không check email
Email không nằm trong required fields vì user đã có email khi đăng ký/đăng nhập.

### Không check district/province
`address.district` và `address.province` là optional. Chỉ yêu cầu `street` và `city` là đủ để tính shipping.

### Không check bodyMeasurements
Chiều cao, Inseam, Cân nặng là thông tin tùy chọn cho bike fitting, không bắt buộc cho mua/bán.

### Navigation
Code chưa implement đầy đủ navigation to Edit Profile sau khi bấm "Cập nhật hồ sơ" trong Alert. Cần add `onEditProfile` callback hoặc dùng navigation context.

---

## Cải tiến tương lai

1. **Banner persistent**: Hiển thị `ProfileIncompleteNotice` banner ở top của screen nếu profile chưa đầy đủ
2. **Profile progress bar**: Hiển thị % hoàn thành profile
3. **Backend validation**: Thêm check tương tự ở BE khi create order/listing
4. **Smart prefill**: Auto-fill shipping address từ user profile
5. **Email verification**: Yêu cầu verify email trước khi mua/bán
