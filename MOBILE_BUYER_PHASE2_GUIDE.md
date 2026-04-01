# MOBILE BUYER FEATURES - IMPLEMENTATION GUIDE (PHASE 2)

## 🎯 MỤC TIÊU

Hoàn thiện 100% tính năng buyer trên Mobile để đồng bộ với Web.

---

## 📋 DANH SÁCH CÔNG VIỆC CÒN LẠI

### ✅ ĐÃ HOÀN THÀNH (Phase 1)
1. ✅ BuyerWalletScreen
2. ✅ BuyerPaymentHistoryScreen
3. ✅ DisputeModal, ConfirmReceivedModal, ReviewModal, InspectorRatingModal
4. ✅ WalletApiClient updates
5. ✅ Navigation updates

### 🔲 CẦN HOÀN THÀNH (Phase 2)
6. 🔲 CartScreen
7. 🔲 Enhanced OrderDetailScreen with modals
8. 🔲 Enhanced CreateOrderScreen with shipping calculator
9. 🔲 Enhanced HomeScreen with trending carousel
10. 🔲 Enhanced SearchScreen with advanced filters

---

## 📝 CHI TIẾT IMPLEMENTATION

### 1. ENHANCED ORDER DETAIL SCREEN

#### File: `src/presentation/screens/orders/OrderDetailScreen.tsx`

#### Bước 1: Import modals
```typescript
import {
  DisputeModal,
  ConfirmReceivedModal,
  ReviewModal,
  InspectorRatingModal,
} from '../../components/modals';
```

#### Bước 2: Thêm states cho modals
```typescript
// Tìm trong file, sau các state hiện tại, thêm:
const [showDisputeModal, setShowDisputeModal] = useState(false);
const [showConfirmModal, setShowConfirmModal] = useState(false);
const [showReviewModal, setShowReviewModal] = useState(false);
const [showInspectorRatingModal, setShowInspectorRatingModal] = useState(false);
const [confirmLoading, setConfirmLoading] = useState(false);
```

#### Bước 3: Thêm handlers
```typescript
// Sau các handlers hiện tại, thêm:

const handleFileDispute = () => {
  setShowDisputeModal(true);
};

const handleDisputeSuccess = () => {
  Alert.alert('Thành công', 'Tranh chấp đã được tạo. Admin sẽ xem xét trong 24-48h.');
  fetchOrderDetail(); // Refresh order data
};

const handleConfirmReceived = () => {
  setShowConfirmModal(true);
};

const handleConfirmReceivedSubmit = async () => {
  try {
    setConfirmLoading(true);
    const response = await fetch(`${API_URL}/orders/${orderId}/confirm-received`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (response.ok) {
      setShowConfirmModal(false);
      // Sau khi confirm, mở modal review
      setShowReviewModal(true);
      fetchOrderDetail();
    } else {
      Alert.alert('Lỗi', data.message || 'Không thể xác nhận đã nhận hàng');
    }
  } catch (error) {
    Alert.alert('Lỗi', 'Có lỗi xảy ra');
  } finally {
    setConfirmLoading(false);
  }
};

const handleLeaveReview = () => {
  setShowReviewModal(true);
};

const handleReviewSuccess = () => {
  Alert.alert('Cảm ơn!', 'Đánh giá của bạn đã được ghi nhận.');
  fetchOrderDetail();
  // Nếu có inspection, mở modal rate inspector
  if (order?.inspectionId && !order?.hasInspectorRating) {
    setShowInspectorRatingModal(true);
  }
};

const handleRateInspector = () => {
  setShowInspectorRatingModal(true);
};

const handleInspectorRatingSuccess = () => {
  Alert.alert('Cảm ơn!', 'Đánh giá inspector đã được ghi nhận.');
  fetchOrderDetail();
};
```

#### Bước 4: Cập nhật renderActions
```typescript
// Tìm hàm renderActions hoặc renderOrderActions, thay thế bằng:

const renderActions = () => {
  if (!order) return null;

  const actions: JSX.Element[] = [];

  // CREATED - Can pay or cancel
  if (order.status === 'CREATED') {
    actions.push(
      <TouchableOpacity
        key="pay"
        style={styles.primaryButton}
        onPress={handlePayment}
      >
        <Text style={styles.primaryButtonText}>Thanh toán ngay</Text>
      </TouchableOpacity>,
      <TouchableOpacity
        key="cancel"
        style={styles.secondaryButton}
        onPress={handleCancelOrder}
      >
        <Text style={styles.secondaryButtonText}>Hủy đơn hàng</Text>
      </TouchableOpacity>
    );
  }

  // ESCROW_LOCKED or DELIVERED - Can dispute or confirm received
  if (order.status === 'ESCROW_LOCKED' || order.status === 'DELIVERED') {
    actions.push(
      <TouchableOpacity
        key="dispute"
        style={styles.warningButton}
        onPress={handleFileDispute}
      >
        <AlertTriangle size={20} color={COLORS.white} />
        <Text style={styles.warningButtonText}>Tạo tranh chấp</Text>
      </TouchableOpacity>,
      <TouchableOpacity
        key="confirm"
        style={styles.successButton}
        onPress={handleConfirmReceived}
      >
        <CheckCircle size={20} color={COLORS.white} />
        <Text style={styles.successButtonText}>Đã nhận hàng</Text>
      </TouchableOpacity>
    );
  }

  // COMPLETED - Can leave review
  if (order.status === 'COMPLETED') {
    if (!order.hasReview) {
      actions.push(
        <TouchableOpacity
          key="review"
          style={styles.primaryButton}
          onPress={handleLeaveReview}
        >
          <Star size={20} color={COLORS.white} />
          <Text style={styles.primaryButtonText}>Đánh giá người bán</Text>
        </TouchableOpacity>
      );
    }
    
    if (order.inspectionId && !order.hasInspectorRating) {
      actions.push(
        <TouchableOpacity
          key="rate-inspector"
          style={styles.primaryButton}
          onPress={handleRateInspector}
        >
          <Star size={20} color={COLORS.white} />
          <Text style={styles.primaryButtonText}>Đánh giá Inspector</Text>
        </TouchableOpacity>
      );
    }
  }

  // View Inspection Report button (available for orders with inspection)
  if (order.inspectionId) {
    actions.push(
      <TouchableOpacity
        key="inspection"
        style={styles.secondaryButton}
        onPress={handleViewInspectionReport}
      >
        <FileText size={20} color={COLORS.primary} />
        <Text style={styles.secondaryButtonText}>Xem báo cáo kiểm định</Text>
      </TouchableOpacity>
    );
  }

  return actions.length > 0 ? (
    <View style={styles.actionsContainer}>
      {actions}
    </View>
  ) : null;
};
```

#### Bước 5: Thêm modals vào render (cuối file, trước closing View)
```typescript
{/* Modals */}
<DisputeModal
  visible={showDisputeModal}
  orderId={orderId}
  onClose={() => setShowDisputeModal(false)}
  onSuccess={handleDisputeSuccess}
/>

<ConfirmReceivedModal
  visible={showConfirmModal}
  orderId={orderId}
  onClose={() => setShowConfirmModal(false)}
  onConfirm={handleConfirmReceivedSubmit}
  loading={confirmLoading}
/>

<ReviewModal
  visible={showReviewModal}
  orderId={orderId}
  onClose={() => setShowReviewModal(false)}
  onSuccess={handleReviewSuccess}
/>

{order?.inspectionId && (
  <InspectorRatingModal
    visible={showInspectorRatingModal}
    inspectionId={order.inspectionId}
    inspectorName={order.inspectorName || 'Inspector'}
    onClose={() => setShowInspectorRatingModal(false)}
    onSuccess={handleInspectorRatingSuccess}
  />
)}
```

#### Bước 6: Thêm styles
```typescript
// Thêm vào StyleSheet.create
actionsContainer: {
  padding: SPACING.md,
  gap: SPACING.sm,
  borderTopWidth: 1,
  borderTopColor: COLORS.border,
},
primaryButton: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: COLORS.primary,
  paddingVertical: SPACING.md,
  borderRadius: 12,
  gap: SPACING.xs,
},
primaryButtonText: {
  color: COLORS.white,
  fontSize: FONT_SIZES.md,
  fontWeight: FONT_WEIGHTS.semibold,
},
secondaryButton: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: COLORS.background,
  paddingVertical: SPACING.md,
  borderRadius: 12,
  borderWidth: 1,
  borderColor: COLORS.border,
  gap: SPACING.xs,
},
secondaryButtonText: {
  color: COLORS.text,
  fontSize: FONT_SIZES.md,
  fontWeight: FONT_WEIGHTS.semibold,
},
successButton: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: COLORS.success,
  paddingVertical: SPACING.md,
  borderRadius: 12,
  gap: SPACING.xs,
},
successButtonText: {
  color: COLORS.white,
  fontSize: FONT_SIZES.md,
  fontWeight: FONT_WEIGHTS.semibold,
},
warningButton: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: COLORS.error,
  paddingVertical: SPACING.md,
  borderRadius: 12,
  gap: SPACING.xs,
},
warningButtonText: {
  color: COLORS.white,
  fontSize: FONT_SIZES.md,
  fontWeight: FONT_WEIGHTS.semibold,
},
```

---

### 2. ENHANCED CREATE ORDER SCREEN

#### File: `src/presentation/screens/orders/CreateOrderScreen.tsx`

#### Shipping Calculator Implementation

```typescript
// Thêm interface
interface ShippingBreakdown {
  distanceKm: number;
  baseFee: number;
  weightFee: number;
  bulkySurcharge: number;
  total: number;
  weightKg: number;
  note: string;
}

// Thêm states
const [shippingBreakdown, setShippingBreakdown] = useState<ShippingBreakdown | null>(null);
const [calculatingShipping, setCalculatingShipping] = useState(false);

// Thêm các fields địa chỉ đầy đủ
const [shippingAddress, setShippingAddress] = useState({
  fullName: '',
  phone: '',
  street: '',
  district: '',
  city: '',
  province: '',
  zipCode: '',
});

// Function tính phí ship
const calculateShipping = async () => {
  if (!shippingAddress.street || !shippingAddress.city || !shippingAddress.province) {
    Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ địa chỉ giao hàng');
    return;
  }

  try {
    setCalculatingShipping(true);
    const response = await fetch(`${API_URL}/orders/calculate-shipping`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        listingId,
        buyerAddress: shippingAddress,
      }),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      setShippingBreakdown(data.data);
    } else {
      Alert.alert('Lỗi', data.message || 'Không thể tính phí vận chuyển');
    }
  } catch (error) {
    Alert.alert('Lỗi', 'Có lỗi xảy ra khi tính phí vận chuyển');
  } finally {
    setCalculatingShipping(false);
  }
};

// Render shipping form
const renderShippingForm = () => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>Địa chỉ giao hàng</Text>
    
    <TextInput
      style={styles.input}
      placeholder="Họ và tên"
      value={shippingAddress.fullName}
      onChangeText={(text) => setShippingAddress({ ...shippingAddress, fullName: text })}
    />
    
    <TextInput
      style={styles.input}
      placeholder="Số điện thoại"
      value={shippingAddress.phone}
      onChangeText={(text) => setShippingAddress({ ...shippingAddress, phone: text })}
      keyboardType="phone-pad"
    />
    
    <TextInput
      style={styles.input}
      placeholder="Địa chỉ (Số nhà, tên đường)"
      value={shippingAddress.street}
      onChangeText={(text) => setShippingAddress({ ...shippingAddress, street: text })}
    />
    
    <TextInput
      style={styles.input}
      placeholder="Quận/Huyện"
      value={shippingAddress.district}
      onChangeText={(text) => setShippingAddress({ ...shippingAddress, district: text })}
    />
    
    <View style={styles.row}>
      <TextInput
        style={[styles.input, styles.halfInput]}
        placeholder="Thành phố"
        value={shippingAddress.city}
        onChangeText={(text) => setShippingAddress({ ...shippingAddress, city: text })}
      />
      <TextInput
        style={[styles.input, styles.halfInput]}
        placeholder="Tỉnh/Thành phố"
        value={shippingAddress.province}
        onChangeText={(text) => setShippingAddress({ ...shippingAddress, province: text })}
      />
    </View>
    
    <TextInput
      style={styles.input}
      placeholder="Mã bưu điện (tùy chọn)"
      value={shippingAddress.zipCode}
      onChangeText={(text) => setShippingAddress({ ...shippingAddress, zipCode: text })}
      keyboardType="numeric"
    />
    
    <TouchableOpacity
      style={styles.calculateButton}
      onPress={calculateShipping}
      disabled={calculatingShipping}
    >
      {calculatingShipping ? (
        <ActivityIndicator size="small" color={COLORS.white} />
      ) : (
        <>
          <Calculator size={20} color={COLORS.white} />
          <Text style={styles.calculateButtonText}>Tính phí vận chuyển</Text>
        </>
      )}
    </TouchableOpacity>
  </View>
);

// Render shipping breakdown
const renderShippingBreakdown = () => {
  if (!shippingBreakdown) return null;

  return (
    <View style={styles.breakdownCard}>
      <Text style={styles.breakdownTitle}>Chi tiết phí vận chuyển</Text>
      
      <View style={styles.breakdownRow}>
        <Text style={styles.breakdownLabel}>Khoảng cách:</Text>
        <Text style={styles.breakdownValue}>{shippingBreakdown.distanceKm} km</Text>
      </View>
      
      <View style={styles.breakdownRow}>
        <Text style={styles.breakdownLabel}>Phí cơ bản:</Text>
        <Text style={styles.breakdownValue}>{formatCurrency(shippingBreakdown.baseFee)}</Text>
      </View>
      
      <View style={styles.breakdownRow}>
        <Text style={styles.breakdownLabel}>Phí trọng lượng ({shippingBreakdown.weightKg}kg):</Text>
        <Text style={styles.breakdownValue}>{formatCurrency(shippingBreakdown.weightFee)}</Text>
      </View>
      
      {shippingBreakdown.bulkySurcharge > 0 && (
        <View style={styles.breakdownRow}>
          <Text style={styles.breakdownLabel}>Phụ phí cồng kềnh:</Text>
          <Text style={styles.breakdownValue}>{formatCurrency(shippingBreakdown.bulkySurcharge)}</Text>
        </View>
      )}
      
      <View style={[styles.breakdownRow, styles.breakdownTotal]}>
        <Text style={styles.breakdownTotalLabel}>Tổng phí ship:</Text>
        <Text style={styles.breakdownTotalValue}>{formatCurrency(shippingBreakdown.total)}</Text>
      </View>
      
      {shippingBreakdown.note && (
        <Text style={styles.breakdownNote}>💡 {shippingBreakdown.note}</Text>
      )}
    </View>
  );
};
```

---

### 3. CART SCREEN (NEW)

#### File: `src/presentation/screens/cart/CartScreen.tsx`

```typescript
/**
 * Cart Screen
 * Giỏ hàng cho buyer
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { ArrowLeft, Trash2, ShieldCheck } from 'lucide-react-native';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, SHADOWS } from '../../../config/theme';

interface CartItem {
  id: string;
  listingId: string;
  title: string;
  price: number;
  imageUrl?: string;
  brand?: string;
  model?: string;
  year?: number;
}

interface CartScreenProps {
  onBack: () => void;
  onCheckout: (items: CartItem[]) => void;
}

const INSPECTION_FEE = 500000;
const SHIPPING_FEE = 150000;

export const CartScreen: React.FC<CartScreenProps> = ({ onBack, onCheckout }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    // TODO: Implement API call or local storage
    setLoading(false);
  };

  const handleRemove = (itemId: string) => {
    Alert.alert('Xác nhận', 'Bạn muốn xóa sản phẩm này khỏi giỏ hàng?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: () => {
          setItems((prev) => prev.filter((item) => item.id !== itemId));
        },
      },
    ]);
  };

  const calculateTotal = () => {
    const subtotal = items.reduce((sum, item) => sum + item.price, 0);
    return subtotal + INSPECTION_FEE + SHIPPING_FEE;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const renderItem = ({ item }: { item: CartItem }) => (
    <View style={styles.cartItem}>
      <Image
        source={{ uri: item.imageUrl || 'https://via.placeholder.com/100' }}
        style={styles.itemImage}
      />
      <View style={styles.itemInfo}>
        <Text style={styles.itemTitle}>{item.title}</Text>
        <Text style={styles.itemDetails}>
          {item.brand} {item.model} • {item.year}
        </Text>
        <Text style={styles.itemPrice}>{formatCurrency(item.price)}</Text>
      </View>
      <TouchableOpacity onPress={() => handleRemove(item.id)} style={styles.removeButton}>
        <Trash2 size={20} color={COLORS.error} />
      </TouchableOpacity>
    </View>
  );

  if (items.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack}>
            <ArrowLeft size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Giỏ hàng</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Giỏ hàng trống</Text>
          <TouchableOpacity style={styles.browseButton} onPress={onBack}>
            <Text style={styles.browseButtonText}>Khám phá sản phẩm</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <ArrowLeft size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Giỏ hàng ({items.length})</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
      />

      {/* Escrow Protection */}
      <View style={styles.escrowBox}>
        <ShieldCheck size={20} color={COLORS.success} />
        <Text style={styles.escrowText}>
          Tiền của bạn được bảo vệ bởi Escrow. Người bán chỉ nhận tiền sau khi bạn xác nhận đã nhận hàng.
        </Text>
      </View>

      {/* Summary */}
      <View style={styles.summary}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Tổng tiền hàng:</Text>
          <Text style={styles.summaryValue}>
            {formatCurrency(items.reduce((sum, item) => sum + item.price, 0))}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Phí kiểm định:</Text>
          <Text style={styles.summaryValue}>{formatCurrency(INSPECTION_FEE)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Phí vận chuyển:</Text>
          <Text style={styles.summaryValue}>{formatCurrency(SHIPPING_FEE)}</Text>
        </View>
        <View style={[styles.summaryRow, styles.summaryTotal]}>
          <Text style={styles.summaryTotalLabel}>Tổng cộng:</Text>
          <Text style={styles.summaryTotalValue}>{formatCurrency(calculateTotal())}</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.checkoutButton}
        onPress={() => onCheckout(items)}
      >
        <Text style={styles.checkoutButtonText}>Tiến hành thanh toán</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
  },
  list: {
    padding: SPACING.md,
  },
  cartItem: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: COLORS.background,
  },
  itemInfo: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  itemTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
    marginBottom: 4,
  },
  itemDetails: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textLight,
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.primary,
  },
  removeButton: {
    padding: SPACING.xs,
  },
  escrowBox: {
    flexDirection: 'row',
    backgroundColor: `${COLORS.success}15`,
    padding: SPACING.md,
    marginHorizontal: SPACING.md,
    borderRadius: 12,
    gap: SPACING.sm,
  },
  escrowText: {
    flex: 1,
    fontSize: FONT_SIZES.xs,
    color: COLORS.text,
    lineHeight: 18,
  },
  summary: {
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    marginTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  summaryLabel: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textLight,
  },
  summaryValue: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.medium,
  },
  summaryTotal: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.sm,
    marginTop: SPACING.xs,
  },
  summaryTotalLabel: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
  },
  summaryTotalValue: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.primary,
  },
  checkoutButton: {
    backgroundColor: COLORS.primary,
    padding: SPACING.md,
    margin: SPACING.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  checkoutButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.textLight,
    marginBottom: SPACING.lg,
  },
  browseButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: 12,
  },
  browseButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
  },
});
```

---

## 🧪 TESTING GUIDE

### Test OrderDetailScreen với modals

```typescript
// Test scenario 1: ESCROW_LOCKED order
1. Tạo order với status ESCROW_LOCKED
2. Vào OrderDetail
3. Kiểm tra 2 buttons: "Tạo tranh chấp" và "Đã nhận hàng"
4. Click "Tạo tranh chấp":
   - Modal mở
   - Chọn reason
   - Nhập description
   - Submit thành công
5. Click "Đã nhận hàng":
   - Modal cảnh báo hiển thị
   - Click "Xác nhận"
   - ReviewModal tự động mở
   - Submit review
   - Nếu có inspection → InspectorRatingModal mở

// Test scenario 2: COMPLETED order
1. Order status = COMPLETED, chưa có review
2. Button "Đánh giá người bán" hiển thị
3. Click → ReviewModal mở
4. Submit review thành công
```

---

## 📚 API INTEGRATION CHECKLIST

```typescript
// Các API endpoints cần có:
POST /disputes
PUT /orders/:id/confirm-received
POST /reviews
POST /inspector-reviews
POST /orders/calculate-shipping
```

---

**Next:** Implement phase 2 features, test thoroughly, và deploy!
