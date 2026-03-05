/**
 * VeloBike Order Detail Screen
 * Full order detail with timeline, shipping info, actions
 */
import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Animated,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Package,
  Truck,
  CheckCircle,
  Clock,
  MapPin,
  Phone,
  Copy,
  MessageCircle,
  Star,
} from 'lucide-react-native';
import {
  COLORS,
  SPACING,
  RADIUS,
  FONT_SIZES,
  FONT_WEIGHTS,
  SHADOWS,
} from '../../../config/theme';
import { Button } from '../../components/common/Button';
import { formatCurrency, formatOrderStatus } from '../../../utils/formatters';
import { useOrderStore } from '../../viewmodels/OrderStore';
import { Order, OrderTimelineEvent } from '../../../domain/entities/Order';
import { Listing } from '../../../domain/entities/Listing';
import { User } from '../../../domain/entities/User';

interface OrderDetailScreenProps {
  orderId?: string;
  onBack?: () => void;
  onChat?: (sellerId: string) => void;
  onReview?: (orderId: string) => void;
}

export const OrderDetailScreen: React.FC<OrderDetailScreenProps> = ({ orderId, onBack, onChat, onReview }) => {
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const { currentOrder, loadingState, getOrderById, confirmDelivery } = useOrderStore();

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    if (orderId) getOrderById(orderId);
  }, [fadeAnim, orderId, getOrderById]);

  const order = currentOrder;

  // Derived data from populated fields
  const listing = typeof order?.listingId === 'object' ? (order.listingId as Listing) : null;
  const seller = typeof order?.sellerId === 'object' ? (order.sellerId as User) : null;
  const timeline = order?.timeline ?? [];

  const formatTimelineDate = (date?: Date) => {
    if (!date) return '';
    return new Date(date).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getStatusBannerIcon = () => {
    switch (order?.status) {
      case 'SHIPPING': return Truck;
      case 'DELIVERED':
      case 'COMPLETED': return CheckCircle;
      default: return Package;
    }
  };

  if (!order) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn}><ArrowLeft size={22} color={COLORS.text} /></TouchableOpacity>
          <Text style={styles.headerTitle}>Chi tiết đơn hàng</Text>
          <View style={{ width: 30 }} />
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: COLORS.textLight }}>{loadingState === 'loading' ? 'Đang tải...' : 'Không tìm thấy đơn hàng'}</Text>
        </View>
      </View>
    );
  }

  const BannerIcon = getStatusBannerIcon();

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <ArrowLeft size={22} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết đơn hàng</Text>
        <View style={{ width: 30 }} />
      </View>

      <Animated.ScrollView style={{ opacity: fadeAnim }} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Status banner */}
        <View style={styles.statusBanner}>
          <BannerIcon size={24} color={COLORS.white} />
          <View style={styles.statusBannerInfo}>
            <Text style={styles.statusBannerTitle}>{formatOrderStatus(order.status)}</Text>
            {order.shippingMethod?.estimatedDays ? (
              <Text style={styles.statusBannerSub}>Dự kiến giao trong {order.shippingMethod.estimatedDays} ngày</Text>
            ) : null}
          </View>
        </View>

        {/* Timeline */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trạng thái đơn hàng</Text>
          <View style={styles.timeline}>
            {timeline.map((event: OrderTimelineEvent, idx: number) => {
              const isCurrent = idx === timeline.length - 1;
              const isCompleted = idx < timeline.length - 1;
              return (
                <View key={idx} style={styles.timelineItem}>
                  <View style={styles.timelineDot}>
                    <View style={[styles.dot, isCompleted && styles.dotCompleted, isCurrent && styles.dotActive]}>
                      {isCompleted && <CheckCircle size={12} color={COLORS.white} />}
                      {isCurrent && <Clock size={12} color={COLORS.white} />}
                    </View>
                    {idx < timeline.length - 1 && (
                      <View style={[styles.timelineLine, styles.timelineLineActive]} />
                    )}
                  </View>
                  <View style={styles.timelineContent}>
                    <Text style={[styles.timelineLabel, (isCompleted || isCurrent) && styles.timelineLabelActive]}>
                      {event.note || formatOrderStatus(event.status)}
                    </Text>
                    {event.timestamp ? <Text style={styles.timelineDate}>{formatTimelineDate(event.timestamp)}</Text> : null}
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Product info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sản phẩm</Text>
          <View style={styles.productCard}>
            {listing?.media?.thumbnails?.[0] ? (
              <Image source={{ uri: listing.media.thumbnails[0] }} style={styles.productImg} />
            ) : <View style={styles.productImg} />}
            <View style={styles.productInfo}>
              <Text style={styles.productTitle} numberOfLines={2}>{listing?.title ?? ''}</Text>
              <Text style={styles.productPrice}>{formatCurrency(order.financials?.itemPrice ?? 0)}</Text>
            </View>
          </View>
        </View>

        {/* Seller info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Người bán</Text>
          <View style={styles.sellerCard}>
            {seller?.avatar ? (
              <Image source={{ uri: seller.avatar }} style={styles.sellerAvatar} />
            ) : <View style={styles.sellerAvatar} />}
            <View style={styles.sellerInfo}>
              <Text style={styles.sellerName}>{seller?.fullName ?? ''}</Text>
            </View>
            <TouchableOpacity style={styles.chatBtn} onPress={() => onChat?.(typeof order.sellerId === 'string' ? order.sellerId : (order.sellerId as User)?._id)}>
              <MessageCircle size={16} color={COLORS.primary} />
              <Text style={styles.chatBtnText}>Chat</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Shipping info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin giao hàng</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <MapPin size={16} color={COLORS.textSecondary} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Địa chỉ nhận hàng</Text>
                <Text style={styles.infoValue}>{[order.shippingAddress?.street, order.shippingAddress?.district, order.shippingAddress?.city].filter(Boolean).join(', ')}</Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <Phone size={16} color={COLORS.textSecondary} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Số điện thoại</Text>
                <Text style={styles.infoValue}>{order.shippingAddress?.phone ?? ''}</Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <Truck size={16} color={COLORS.textSecondary} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Đơn vị vận chuyển</Text>
                <Text style={styles.infoValue}>{order.shippingMethod?.provider ?? ''}</Text>
              </View>
            </View>
            {order.trackingInfo?.trackingNumber && (
              <View style={styles.infoRow}>
                <Package size={16} color={COLORS.textSecondary} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Mã vận đơn</Text>
                  <TouchableOpacity style={styles.trackingRow}>
                    <Text style={styles.trackingNumber}>{order.trackingInfo.trackingNumber}</Text>
                    <Copy size={14} color={COLORS.primary} />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Payment summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Chi tiết thanh toán</Text>
          <View style={styles.paymentCard}>
            <View style={styles.payRow}><Text style={styles.payLabel}>Giá xe</Text><Text style={styles.payValue}>{formatCurrency(order.financials?.itemPrice ?? 0)}</Text></View>
            <View style={styles.payRow}><Text style={styles.payLabel}>Phí vận chuyển</Text><Text style={styles.payValue}>{formatCurrency(order.financials?.shippingFee ?? 0)}</Text></View>
            <View style={styles.payRow}><Text style={styles.payLabel}>Phí dịch vụ</Text><Text style={styles.payValue}>{formatCurrency(order.financials?.platformFee ?? 0)}</Text></View>
            <View style={styles.payDivider} />
            <View style={styles.payRow}><Text style={styles.payTotal}>Tổng cộng</Text><Text style={styles.payTotalValue}>{formatCurrency(order.financials?.totalAmount ?? 0)}</Text></View>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          {order.status === 'DELIVERED' && (
            <Button title="Xác nhận đã nhận hàng" onPress={() => confirmDelivery(order._id)} style={{ marginBottom: SPACING.md }} />
          )}
          {order.status === 'COMPLETED' && (
            <Button title="Đánh giá" onPress={() => onReview?.(order._id)} style={{ marginBottom: SPACING.md }} />
          )}
        </View>

        <View style={{ height: 40 }} />
      </Animated.ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.surface },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.base, paddingVertical: SPACING.md, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: FONT_SIZES.lg, fontWeight: FONT_WEIGHTS.semibold, color: COLORS.text },
  scroll: { paddingBottom: 40 },
  statusBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primary, paddingHorizontal: SPACING.xl, paddingVertical: SPACING.lg, gap: SPACING.md },
  statusBannerInfo: {},
  statusBannerTitle: { fontSize: FONT_SIZES.lg, fontWeight: FONT_WEIGHTS.bold, color: COLORS.white },
  statusBannerSub: { fontSize: FONT_SIZES.sm, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  section: { paddingHorizontal: SPACING.xl, marginTop: SPACING.xl },
  sectionTitle: { fontSize: FONT_SIZES.base, fontWeight: FONT_WEIGHTS.bold, color: COLORS.text, marginBottom: SPACING.md },
  timeline: { paddingLeft: SPACING.xs },
  timelineItem: { flexDirection: 'row', minHeight: 50 },
  timelineDot: { width: 24, alignItems: 'center' },
  dot: { width: 22, height: 22, borderRadius: 11, backgroundColor: COLORS.border, justifyContent: 'center', alignItems: 'center' },
  dotCompleted: { backgroundColor: COLORS.success },
  dotActive: { backgroundColor: COLORS.primary },
  timelineLine: { width: 2, flex: 1, backgroundColor: COLORS.border, marginVertical: 3 },
  timelineLineActive: { backgroundColor: COLORS.success },
  timelineContent: { flex: 1, paddingLeft: SPACING.md, paddingBottom: SPACING.md },
  timelineLabel: { fontSize: FONT_SIZES.md, color: COLORS.textLight, fontWeight: FONT_WEIGHTS.medium },
  timelineLabelActive: { color: COLORS.text, fontWeight: FONT_WEIGHTS.semibold },
  timelineDate: { fontSize: FONT_SIZES.sm, color: COLORS.textLight, marginTop: 2 },
  productCard: { flexDirection: 'row', backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: SPACING.md, gap: SPACING.md, ...SHADOWS.sm },
  productImg: { width: 70, height: 70, borderRadius: RADIUS.md, backgroundColor: COLORS.skeleton },
  productInfo: { flex: 1, justifyContent: 'center' },
  productTitle: { fontSize: FONT_SIZES.md, fontWeight: FONT_WEIGHTS.medium, color: COLORS.text },
  productPrice: { fontSize: FONT_SIZES.base, fontWeight: FONT_WEIGHTS.bold, color: COLORS.accent, marginTop: 4 },
  sellerCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: SPACING.md, gap: SPACING.md, ...SHADOWS.sm },
  sellerAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.skeleton },
  sellerInfo: { flex: 1 },
  sellerName: { fontSize: FONT_SIZES.base, fontWeight: FONT_WEIGHTS.semibold, color: COLORS.text },
  chatBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.primary },
  chatBtnText: { fontSize: FONT_SIZES.sm, fontWeight: FONT_WEIGHTS.semibold, color: COLORS.primary },
  infoCard: { backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: SPACING.base, ...SHADOWS.sm },
  infoRow: { flexDirection: 'row', gap: SPACING.md, paddingVertical: SPACING.sm },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: FONT_SIZES.sm, color: COLORS.textLight },
  infoValue: { fontSize: FONT_SIZES.md, color: COLORS.text, fontWeight: FONT_WEIGHTS.medium, marginTop: 2 },
  trackingRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginTop: 2 },
  trackingNumber: { fontSize: FONT_SIZES.md, color: COLORS.primary, fontWeight: FONT_WEIGHTS.semibold },
  paymentCard: { backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: SPACING.base, ...SHADOWS.sm },
  payRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: SPACING.xs },
  payLabel: { fontSize: FONT_SIZES.md, color: COLORS.textSecondary },
  payValue: { fontSize: FONT_SIZES.md, color: COLORS.text },
  payDivider: { height: 1, backgroundColor: COLORS.border, marginVertical: SPACING.sm },
  payTotal: { fontSize: FONT_SIZES.base, fontWeight: FONT_WEIGHTS.bold, color: COLORS.text },
  payTotalValue: { fontSize: FONT_SIZES.lg, fontWeight: FONT_WEIGHTS.bold, color: COLORS.accent },
  actions: { paddingHorizontal: SPACING.xl, marginTop: SPACING['2xl'] },
});

export default OrderDetailScreen;
