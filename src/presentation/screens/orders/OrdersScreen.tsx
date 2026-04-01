/**
 * VeloBike Orders Screen
 * Order list with status tabs, status badges
 */
import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Animated,
  StatusBar,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  ShoppingBag,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  ChevronRight,
} from 'lucide-react-native';
import {
  COLORS,
  SPACING,
  RADIUS,
  FONT_SIZES,
  FONT_WEIGHTS,
  SHADOWS,
  ICON_SIZES,
} from '../../../config/theme';
import { formatCurrency, formatOrderStatus, formatRelativeTime } from '../../../utils/formatters';
import { useOrderStore } from '../../viewmodels/OrderStore';
import { Order } from '../../../domain/entities/Order';
import { Listing } from '../../../domain/entities/Listing';
import { User } from '../../../domain/entities/User';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ENV } from '../../../config/environment';

const STATUS_TABS = [
  { key: 'ALL', label: 'Tất cả' },
  { key: 'CREATED', label: 'Chờ xác nhận' },
  { key: 'ESCROW_LOCKED', label: 'Đã đặt cọc' },
  { key: 'SHIPPING', label: 'Đang giao' },
  { key: 'DELIVERED', label: 'Đã giao' },
  { key: 'COMPLETED', label: 'Hoàn thành' },
  { key: 'CANCELLED', label: 'Đã hủy' },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'CREATED': return COLORS.warning;
    case 'ESCROW_LOCKED': return COLORS.info;
    case 'IN_INSPECTION':
    case 'INSPECTION_PASSED': return COLORS.info;
    case 'SHIPPING': return COLORS.primary;
    case 'DELIVERED': return COLORS.success;
    case 'COMPLETED': return COLORS.success;
    case 'CANCELLED':
    case 'DISPUTED': return COLORS.error;
    default: return COLORS.textSecondary;
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'CREATED': return Clock;
    case 'ESCROW_LOCKED': return Package;
    case 'IN_INSPECTION':
    case 'INSPECTION_PASSED': return Package;
    case 'SHIPPING': return Truck;
    case 'DELIVERED': return CheckCircle;
    case 'COMPLETED': return CheckCircle;
    case 'CANCELLED':
    case 'DISPUTED': return XCircle;
    default: return Clock;
  }
};

// Helper to extract listing/seller info from Order
const getListingTitle = (order: Order): string => {
  if (typeof order.listingId === 'object' && order.listingId) return (order.listingId as Listing).title || '';
  return '';
};
const getListingImage = (order: Order): string | undefined => {
  if (typeof order.listingId === 'object' && order.listingId) return (order.listingId as Listing).media?.thumbnails?.[0];
  return undefined;
};
const getSellerName = (order: Order): string => {
  if (typeof order.sellerId === 'object' && order.sellerId) return (order.sellerId as User).fullName || '';
  return '';
};

interface OrdersScreenProps {
  onBack?: () => void;
  onOrderPress?: (orderId: string, order?: Order) => void; // ✅ Pass order data
}

export const OrdersScreen: React.FC<OrdersScreenProps> = ({ onBack, onOrderPress }) => {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState('ALL');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const { orders, loadingState, getMyOrders } = useOrderStore();
  const hasAutoChecked = useRef(false);

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    getMyOrders({ page: 1, limit: 20 });
  }, [fadeAnim, getMyOrders]);

  // Auto-check payment for recent CREATED orders (like WEB)
  useEffect(() => {
    if (orders.length > 0 && !hasAutoChecked.current) {
      const createdOrders = orders.filter(o => o.status === 'CREATED');
      if (createdOrders.length > 0) {
        // Check the most recent created order automatically (silent check)
        const latestOrder = createdOrders[0];
        checkPaymentSilent(latestOrder._id);
        hasAutoChecked.current = true;
      }
    }
  }, [orders]);

  const checkPaymentSilent = async (orderId: string) => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      if (!token) return;

      // 1. Fetch order to get orderCode from timeline
      const orderRes = await fetch(`${ENV.API_BASE_URL}/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!orderRes.ok) return;

      const orderData = await orderRes.json();
      const order = orderData.data;

      // If already paid, refresh list
      if (order.status !== 'CREATED') {
        getMyOrders({ page: 1, limit: 20 });
        return;
      }

      // Extract orderCode from timeline
      const timelineNote = order.timeline?.find((t: any) => t.note?.includes('orderCode:'))?.note;
      const orderCode = timelineNote ? timelineNote.split('orderCode: ')[1]?.trim() : null;

      if (!orderCode) return;

      // 2. Check PayOS status
      const infoRes = await fetch(`${ENV.API_BASE_URL}/payment/info/${orderCode}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!infoRes.ok) return;

      const infoData = await infoRes.json();

      if (infoData.data?.status === 'PAID') {
        // 3. Trigger webhook manually
        const webhookBody = {
          code: "00000",
          orderCode: Number(orderCode),
          data: infoData.data
        };

        const webhookRes = await fetch(`${ENV.API_BASE_URL}/payment/webhook`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(webhookBody)
        });

        if (webhookRes.ok) {
          // Refresh orders list
          getMyOrders({ page: 1, limit: 20 });
        }
      }
    } catch (error) {
      // Silent fail - don't show error to user
      console.log('Auto-check payment failed:', error);
    }
  };

  const filtered = activeTab === 'ALL' ? orders : orders.filter(o => o.status === activeTab);

  const renderItem = useCallback(({ item }: { item: Order }) => {
    const StatusIcon = getStatusIcon(item.status);
    const statusColor = getStatusColor(item.status);
    const listingTitle = getListingTitle(item);
    const listingImage = getListingImage(item);
    const sellerName = getSellerName(item);

    return (
      <TouchableOpacity style={styles.orderCard} activeOpacity={0.8} onPress={() => {
        // Serialize để tránh lỗi non-serializable (Date objects) trong navigation params
        const serializedOrder = JSON.parse(JSON.stringify(item));
        onOrderPress?.(item._id, serializedOrder);
      }}>
        <View style={styles.orderHeader}>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '15' }]}>
            <StatusIcon size={12} color={statusColor} />
            <Text style={[styles.statusText, { color: statusColor }]}>{formatOrderStatus(item.status)}</Text>
          </View>
          <Text style={styles.orderDate}>{formatRelativeTime(item.createdAt)}</Text>
        </View>
        <View style={styles.orderBody}>
          {listingImage ? <Image source={{ uri: listingImage }} style={styles.orderImg} /> : <View style={styles.orderImg} />}
          <View style={styles.orderInfo}>
            <Text style={styles.orderTitle} numberOfLines={2}>{listingTitle}</Text>
            {sellerName ? <Text style={styles.orderSeller}>Người bán: {sellerName}</Text> : null}
            <Text style={styles.orderPrice}>{formatCurrency(item.financials?.totalAmount ?? 0)}</Text>
          </View>
          <ChevronRight size={18} color={COLORS.textLight} />
        </View>
        {item.trackingInfo?.trackingNumber && (
          <View style={styles.trackingBar}>
            <Truck size={14} color={COLORS.primary} />
            <Text style={styles.trackingText}>Đang vận chuyển</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  }, [onOrderPress]);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <ArrowLeft size={22} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Đơn hàng của tôi</Text>
          {filtered.length > 0 && <Text style={styles.headerCount}>({filtered.length})</Text>}
        </View>
        <View style={{ width: 30 }} />
      </View>

      {/* Status tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabScrollView}
        contentContainerStyle={styles.tabScroll}
      >
        {STATUS_TABS.map(tab => (
          <TouchableOpacity key={tab.key} style={[styles.tab, activeTab === tab.key && styles.tabActive]} onPress={() => setActiveTab(tab.key)}>
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Orders list */}
      <Animated.View style={[styles.flex, { opacity: fadeAnim }]}>
        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <ShoppingBag size={ICON_SIZES['3xl']} color={COLORS.textLight} />
            <Text style={styles.emptyTitle}>Chưa có đơn hàng</Text>
            <Text style={styles.emptySub}>Hãy mua chiếc xe đạp đầu tiên!</Text>
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={i => i._id}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          />
        )}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.surface },
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.base, paddingVertical: SPACING.md, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  backBtn: { padding: 4 },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  headerTitle: { fontSize: FONT_SIZES.lg, fontWeight: FONT_WEIGHTS.semibold, color: COLORS.text },
  headerCount: { fontSize: FONT_SIZES.md, fontWeight: FONT_WEIGHTS.medium, color: COLORS.textSecondary },
  tabScrollView: { backgroundColor: COLORS.white, maxHeight: 56 },
  tabScroll: { paddingHorizontal: SPACING.xl, paddingVertical: SPACING.sm, gap: SPACING.sm, alignItems: 'center' },
  tab: { height: 36, minHeight: 36, alignSelf: 'center', justifyContent: 'center', paddingHorizontal: SPACING.base, borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.border },
  tabActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  tabText: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, fontWeight: FONT_WEIGHTS.medium },
  tabTextActive: { color: COLORS.white, fontWeight: FONT_WEIGHTS.semibold },
  list: { padding: SPACING.xl, gap: SPACING.md },
  orderCard: { backgroundColor: COLORS.white, borderRadius: RADIUS.lg, ...SHADOWS.sm, overflow: 'hidden' },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.base, paddingTop: SPACING.md },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: SPACING.sm, paddingVertical: 4, borderRadius: RADIUS.xs },
  statusText: { fontSize: FONT_SIZES.xs, fontWeight: FONT_WEIGHTS.semibold },
  orderDate: { fontSize: FONT_SIZES.xs, color: COLORS.textLight },
  orderBody: { flexDirection: 'row', alignItems: 'center', padding: SPACING.base, gap: SPACING.md },
  orderImg: { width: 70, height: 70, borderRadius: RADIUS.md, backgroundColor: COLORS.skeleton },
  orderInfo: { flex: 1 },
  orderTitle: { fontSize: FONT_SIZES.md, fontWeight: FONT_WEIGHTS.medium, color: COLORS.text, lineHeight: FONT_SIZES.md * 1.3 },
  orderSeller: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginTop: 2 },
  orderPrice: { fontSize: FONT_SIZES.base, fontWeight: FONT_WEIGHTS.bold, color: COLORS.accent, marginTop: 4 },
  trackingBar: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, backgroundColor: COLORS.primarySurface, paddingHorizontal: SPACING.base, paddingVertical: SPACING.sm },
  trackingText: { fontSize: FONT_SIZES.sm, fontWeight: FONT_WEIGHTS.medium, color: COLORS.primaryDark },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: SPACING.md },
  emptyTitle: { fontSize: FONT_SIZES.xl, fontWeight: FONT_WEIGHTS.semibold, color: COLORS.text },
  emptySub: { fontSize: FONT_SIZES.md, color: COLORS.textLight },
});

export default OrdersScreen;
