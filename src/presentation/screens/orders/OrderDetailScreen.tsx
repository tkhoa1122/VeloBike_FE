/**
 * VeloBike Order Detail Screen
 * Full order detail with timeline, shipping info, actions
 */
import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Animated,
  StatusBar,
  ActivityIndicator,
  Alert,
  Modal,
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
  CreditCard,
  RefreshCw,
  XCircle,
  AlertTriangle,
  X,
  AlertCircle,
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
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ENV } from '../../../config/environment';
import { usePaymentStore } from '../../viewmodels/PaymentStore';
import { useReviewStore } from '../../viewmodels/ReviewStore';
import { useAuthStore } from '../../viewmodels/AuthStore';
import { container } from '../../../di/Container';
import {
  DisputeModal,
  ConfirmReceivedModal,
  ReviewModal,
} from '../../components/modals';

/** Tham số navigate Chat (đồng bộ ngữ cảnh đơn/tin như Web) */
export interface OrderChatNavigatePayload {
  sellerId: string;
  participantName?: string;
  participantAvatar?: string;
  orderId?: string;
  listingId?: string;
  listingTitle?: string;
  listingImage?: string;
}

interface OrderDetailScreenProps {
  orderId?: string;
  initialOrder?: Order; // ✅ Pass initial order data to avoid loading
  onBack?: () => void;
  onChat?: (payload: OrderChatNavigatePayload) => void;
  onReview?: (orderId: string) => void;
  // Trả về paymentLink + orderCode để navigator navigate thẳng vào WebView
  onPayment?: (orderId: string, paymentLink: string, orderCode: number) => void;
}

export const OrderDetailScreen: React.FC<OrderDetailScreenProps> = ({ orderId, initialOrder, onBack, onChat, onReview, onPayment }) => {
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const currentUser = useAuthStore(s => s.user);
  const currentUserId = useAuthStore(s => s.user?._id);
  const { currentOrder, loadingState, getOrderById, confirmDelivery } = useOrderStore();
  const { createPaymentLink } = usePaymentStore();
  const [checkingPayment, setCheckingPayment] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [localOrder, setLocalOrder] = useState<Order | null>(initialOrder || null);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showShippingModal, setShowShippingModal] = useState(false);
  const [shippingCarrier, setShippingCarrier] = useState('GIAO_HANG_NHANH');
  const [shippingLoading, setShippingLoading] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [hasReviewed, setHasReviewed] = useState<boolean | null>(null);

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    
    // If we have initialOrder, use it immediately and refresh in background
    if (initialOrder && orderId) {
      setLocalOrder(initialOrder);
      // Background refresh to get latest data
      getOrderById(orderId);
    } else if (orderId) {
      // No initial data, fetch from server
      getOrderById(orderId);
    }
  }, [fadeAnim, orderId, initialOrder, getOrderById]);

  // Only use store order when it matches route orderId to avoid stale cross-screen data.
  const orderFromStoreMatchesRoute =
    !!currentOrder && !!orderId && String(currentOrder._id) === String(orderId);
  const order = orderFromStoreMatchesRoute ? currentOrder : localOrder;
  const orderBuyerId =
    order && typeof order.buyerId === 'object'
      ? (order.buyerId as User)?._id
      : (order?.buyerId as string | undefined);
  const isBuyerOfOrder = !!currentUserId && !!orderBuyerId && String(currentUserId) === String(orderBuyerId);

  const canReviewByStatus = order?.status === 'COMPLETED' || order?.status === 'DELIVERED';

  // Tính 7 ngày kể từ khi nhận hàng (từ timeline event DELIVERED hoặc completedAt)
  const deliveredEvent = order?.timeline?.find(
    (t: OrderTimelineEvent) => t.status === 'DELIVERED' || t.status === 'COMPLETED'
  );
  const deliveredAt = deliveredEvent?.timestamp
    ? new Date(deliveredEvent.timestamp)
    : order?.completedAt
      ? new Date(order.completedAt)
      : null;
  const DISPUTE_WINDOW_DAYS = 7;
  const withinDisputeWindow = deliveredAt
    ? (Date.now() - deliveredAt.getTime()) < DISPUTE_WINDOW_DAYS * 24 * 60 * 60 * 1000
    : false;
  // Buyer có thể tranh chấp sau khi nhận hàng trong vòng 7 ngày
  const canDisputeAfterDelivery = isBuyerOfOrder && canReviewByStatus && withinDisputeWindow;

  useEffect(() => {
    if (!canReviewByStatus || !order?._id || !isBuyerOfOrder) {
      setHasReviewed(null);
      return;
    }
    let cancelled = false;
    useReviewStore
      .getState()
      .checkOrderReviewed(order._id)
      .then(done => {
        if (!cancelled) setHasReviewed(done);
      });
    return () => {
      cancelled = true;
    };
  }, [order?._id, canReviewByStatus, isBuyerOfOrder]);

  // ✅ Gọi create-link trực tiếp (không qua PaymentScreen thừa - giống Web FE)
  const handlePayNow = async () => {
    if (!order?._id || paymentLoading) return;
    setPaymentLoading(true);
    try {
      Toast.show({ type: 'info', text1: 'Đang tạo link thanh toán...' });
      const result = await createPaymentLink(order._id);
      if (result?.paymentLink && result?.orderCode) {
        await AsyncStorage.setItem('pendingOrderId', order._id);
        onPayment?.(order._id, result.paymentLink, result.orderCode);
      } else {
        Toast.show({ type: 'error', text1: 'Không thể tạo link thanh toán', text2: 'Vui lòng thử lại' });
      }
    } catch (err: any) {
      Toast.show({ type: 'error', text1: 'Lỗi', text2: err.message || 'Không thể tạo link thanh toán' });
    } finally {
      setPaymentLoading(false);
    }
  };

  // Check payment status (like WEB flow)
  const handleCheckPayment = async () => {
    if (!order?._id) return;
    
    try {
      setCheckingPayment(true);
      Toast.show({ type: 'info', text1: 'Đang kiểm tra trạng thái thanh toán...' });
      
      const token = await AsyncStorage.getItem('access_token');
      if (!token) {
        Toast.show({ type: 'error', text1: 'Vui lòng đăng nhập lại' });
        return;
      }

      // 1. Fetch order to get orderCode from timeline
      const orderRes = await fetch(`${ENV.API_BASE_URL}/orders/${order._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!orderRes.ok) {
        throw new Error('Không thể lấy thông tin đơn hàng');
      }

      const orderData = await orderRes.json();
      const orderDetail = orderData.data;

      // If already paid, just refresh
      if (orderDetail.status !== 'CREATED') {
        await getOrderById(order._id);
        Toast.show({ type: 'success', text1: 'Đơn hàng đã được thanh toán!' });
        return;
      }

      // Extract orderCode from timeline
      const timelineNote = orderDetail.timeline?.find((t: any) => t.note?.includes('orderCode:'))?.note;
      const orderCode = timelineNote ? timelineNote.split('orderCode: ')[1]?.trim() : null;

      if (!orderCode) {
        Toast.show({ type: 'error', text1: 'Không tìm thấy mã thanh toán' });
        return;
      }

      // 2. Check PayOS status
      const infoRes = await fetch(`${ENV.API_BASE_URL}/payment/info/${orderCode}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!infoRes.ok) {
        throw new Error('Không thể kiểm tra trạng thái thanh toán');
      }

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
          Toast.show({ type: 'success', text1: 'Cập nhật trạng thái thanh toán thành công!' });
          await getOrderById(order._id);
        } else {
          Toast.show({ type: 'warning', text1: 'Thanh toán thành công nhưng cần thời gian cập nhật' });
        }
      } else {
        Toast.show({ type: 'info', text1: 'Chưa có thanh toán nào được ghi nhận' });
      }
    } catch (error: any) {
      Toast.show({ type: 'error', text1: error.message || 'Lỗi khi kiểm tra thanh toán' });
    } finally {
      setCheckingPayment(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!order?._id) return;

    Alert.alert(
      'Hủy đơn hàng',
      'Bạn có chắc chắn muốn hủy đơn hàng này?',
      [
        { text: 'Không', style: 'cancel' },
        {
          text: 'Có',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('access_token');
              if (!token) return;

              const res = await fetch(`${ENV.API_BASE_URL}/orders/${order._id}/status`, {
                method: 'PUT',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: 'CANCELLED', note: 'Buyer cancelled order' })
              });

              if (res.ok) {
                Toast.show({ type: 'success', text1: 'Đã hủy đơn hàng' });
                await getOrderById(order._id);
              } else {
                throw new Error('Không thể hủy đơn hàng');
              }
            } catch (error: any) {
              Toast.show({ type: 'error', text1: error.message || 'Lỗi khi hủy đơn hàng' });
            }
          }
        }
      ]
    );
  };

  const handleConfirmReceived = async () => {
    if (!order?._id) return;
    try {
      setConfirmLoading(true);
      const ok = await confirmDelivery(order._id);
      if (!ok) {
        const err = useOrderStore.getState().error;
        Toast.show({
          type: 'error',
          text1: 'Không thể xác nhận đã nhận hàng',
          text2: err || 'Trạng thái đơn hàng không hợp lệ',
        });
        return;
      }

      setShowConfirmModal(false);
      await getOrderById(order._id);
      Toast.show({
        type: 'success',
        text1: 'Đã xác nhận nhận hàng',
        text2: 'Bạn có thể đánh giá đơn này bất kỳ lúc nào trong Đơn hàng của tôi',
      });
    } catch (error: any) {
      Toast.show({ type: 'error', text1: error?.message || 'Không thể xác nhận nhận hàng' });
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleConfirmShipping = async () => {
    if (!order?._id) return;
    setShippingLoading(true);
    try {
      const token = await container().authApiClient.getStoredAccessToken();
      if (!token) {
        Toast.show({ type: 'error', text1: 'Phiên đăng nhập hết hạn' });
        return;
      }

      const serviceIdMap: Record<string, string> = {
        GIAO_HANG_NHANH: 'GHN_STD',
        VIETTEL_POST: 'VTP_FAST',
        VNPOST: 'GHN_STD',
        SELF_PICKUP: 'GHN_STD',
      };

      const response = await fetch(
        `${container().authApiClient['baseURL']}/logistics/create-shipment`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            orderId: order._id,
            serviceId: serviceIdMap[shippingCarrier] || 'GHN_STD',
          }),
        }
      );

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Không thể tạo vận đơn');
      }

      setShowShippingModal(false);
      await getOrderById(order._id);
      Toast.show({
        type: 'success',
        text1: 'Đã bắt đầu giao hàng',
        text2: `Mã vận đơn: ${data.data?.trackingNumber ?? ''}`,
        visibilityTime: 4000,
      });
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Lỗi tạo vận đơn',
        text2: error?.message || 'Vui lòng thử lại.',
      });
    } finally {
      setShippingLoading(false);
    }
  };

  // Derived data from populated fields
  const listing = typeof order?.listingId === 'object' ? (order.listingId as Listing) : null;
  const seller = typeof order?.sellerId === 'object' ? (order.sellerId as User) : null;
  const sellerIdResolved =
    typeof order?.sellerId === 'string'
      ? order?.sellerId
      : (order?.sellerId as User | undefined)?._id;
  const isCurrentUserSeller = !!currentUser?._id && !!sellerIdResolved && String(currentUser._id) === String(sellerIdResolved);

  // Fetch full seller info from users/{id} to get avatar (order API often returns seller without avatar)
  const [fetchedSeller, setFetchedSeller] = useState<User | null>(null);
  useEffect(() => {
    setFetchedSeller(null);
    if (sellerIdResolved && (!seller || !seller.avatar)) {
      container().authApiClient.getUserById(sellerIdResolved)
        .then((res: { success: boolean; data?: any }) => {
          if (res.success && res.data) setFetchedSeller(res.data);
        })
        .catch(() => {});
    }
  }, [sellerIdResolved, seller, order?._id]);

  const resolvedSeller = fetchedSeller || seller || (isCurrentUserSeller ? currentUser : null);
  const sellerAvatarResolved = resolvedSeller?.avatar;
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
  const normalizedOrderStatus = String(order.status || '').toUpperCase();
  const normalizedPaymentStatus = String(order.financials?.paymentStatus || '').toUpperCase();

  const getPaymentStatusView = () => {
    if (normalizedOrderStatus === 'CANCELLED') {
      return { text: '❌ Đã hủy', color: COLORS.error };
    }
    if (normalizedPaymentStatus === 'REFUNDED' || normalizedOrderStatus === 'REFUNDED') {
      return { text: '↩️ Đã hoàn tiền', color: COLORS.warning };
    }
    if (
      normalizedOrderStatus === 'CREATED' ||
      normalizedPaymentStatus === 'PENDING' ||
      normalizedPaymentStatus === 'UNPAID' ||
      normalizedPaymentStatus === 'FAILED'
    ) {
      return { text: '❌ Chưa thanh toán', color: COLORS.error };
    }
    return { text: '✅ Đã thanh toán', color: COLORS.success };
  };

  const paymentStatusView = getPaymentStatusView();
  const shippingProvider = order.shippingMethod?.provider || (order as any)?.shippingInfo?.carrier || '';
  const shippingTrackingNumber = order.trackingInfo?.trackingNumber || (order as any)?.shippingInfo?.trackingNumber;

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
            {sellerAvatarResolved ? (
              <Image source={{ uri: sellerAvatarResolved }} style={styles.sellerAvatar} />
            ) : (
              <View style={[styles.sellerAvatar, styles.sellerAvatarPlaceholder]}>
                <Text style={styles.sellerAvatarInitial}>
                  {(resolvedSeller?.fullName ?? 'N')[0].toUpperCase()}
                </Text>
              </View>
            )}
            <View style={styles.sellerInfo}>
              <Text style={styles.sellerName}>{resolvedSeller?.fullName ?? ''}</Text>
            </View>
            <TouchableOpacity
              style={styles.chatBtn}
              onPress={() => {
                const sid =
                  typeof order.sellerId === 'string'
                    ? order.sellerId
                    : (order.sellerId as User)?._id;
                if (!sid) return;
                onChat?.({
                  sellerId: sid,
                  participantName: resolvedSeller?.fullName,
                  participantAvatar: resolvedSeller?.avatar,
                  orderId: order._id,
                  listingId:
                    typeof order.listingId === 'string'
                      ? order.listingId
                      : (order.listingId as Listing)?._id,
                  listingTitle: listing?.title,
                  listingImage: listing?.media?.thumbnails?.[0],
                });
              }}
            >
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
                <Text style={styles.infoValue}>{shippingProvider}</Text>
              </View>
            </View>
            {!!shippingTrackingNumber && (
              <View style={styles.infoRow}>
                <Package size={16} color={COLORS.textSecondary} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Mã vận đơn</Text>
                  <TouchableOpacity style={styles.trackingRow}>
                    <Text style={styles.trackingNumber}>{shippingTrackingNumber}</Text>
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
            {/* Payment Status */}
            <View style={styles.payRow}>
              <Text style={styles.payLabel}>Trạng thái thanh toán</Text>
              <Text style={[
                styles.payValue,
                {
                    color: paymentStatusView.color,
                  fontWeight: FONT_WEIGHTS.bold as any,
                }
              ]}>
                  {paymentStatusView.text}
              </Text>
            </View>
            <View style={styles.payDivider} />

            <View style={styles.payRow}><Text style={styles.payLabel}>Giá xe</Text><Text style={styles.payValue}>{formatCurrency(order.financials?.itemPrice ?? 0)}</Text></View>
            <View style={styles.payRow}><Text style={styles.payLabel}>Phí vận chuyển</Text><Text style={styles.payValue}>{formatCurrency(order.financials?.shippingFee ?? 0)}</Text></View>
            <View style={styles.payRow}><Text style={styles.payLabel}>Phí dịch vụ</Text><Text style={styles.payValue}>{formatCurrency(order.financials?.platformFee ?? 0)}</Text></View>
            <View style={styles.payDivider} />
            <View style={styles.payRow}><Text style={styles.payTotal}>Tổng cộng</Text><Text style={styles.payTotalValue}>{formatCurrency(order.financials?.totalAmount ?? 0)}</Text></View>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          {order.status === 'CREATED' && (
            <View style={styles.paymentActions}>
              {checkingPayment ? (
                <View style={styles.checkingContainer}>
                  <ActivityIndicator size="small" color={COLORS.primary} />
                  <Text style={styles.checkingText}>Đang kiểm tra...</Text>
                </View>
              ) : (
                <>
                  <Button
                    title={paymentLoading ? 'Đang tạo link...' : '💳 Thanh toán ngay'}
                    onPress={handlePayNow}
                    disabled={paymentLoading}
                    style={{ marginBottom: SPACING.sm }}
                  />
                  <View style={styles.secondaryActions}>
                    <TouchableOpacity style={styles.secondaryButton} onPress={handleCheckPayment}>
                      <RefreshCw size={16} color={COLORS.primary} />
                      <Text style={styles.secondaryButtonText}>Kiểm tra thanh toán</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.cancelButton} onPress={handleCancelOrder}>
                      <XCircle size={16} color={COLORS.error} />
                      <Text style={styles.cancelButtonText}>Hủy đơn</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          )}

          {/* Seller: Start shipping after inspection passed */}
          {isCurrentUserSeller && order.status === 'INSPECTION_PASSED' && (
            <TouchableOpacity
              style={styles.startShippingBtn}
              onPress={() => {
                setShippingCarrier('GIAO_HANG_NHANH');
                setShowShippingModal(true);
              }}
            >
              <Truck size={18} color={COLORS.white} />
              <Text style={styles.startShippingBtnText}>Bắt đầu giao hàng</Text>
            </TouchableOpacity>
          )}

          {/* BUYER: đang giao — tranh chấp + xác nhận nhận hàng */}
          {order.status === 'SHIPPING' && isBuyerOfOrder && (
            <View style={styles.secondaryActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setShowDisputeModal(true)}>
                <AlertTriangle size={16} color={COLORS.error} />
                <Text style={styles.cancelButtonText}>Tranh chấp</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryButton} onPress={() => setShowConfirmModal(true)}>
                <CheckCircle size={16} color={COLORS.primary} />
                <Text style={styles.secondaryButtonText}>Đã nhận hàng</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* SELLER: đang giao — chỉ thông báo trạng thái */}
          {order.status === 'SHIPPING' && isCurrentUserSeller && (
            <View style={styles.shippingStatusBadge}>
              <Truck size={16} color={COLORS.success} />
              <Text style={styles.shippingStatusText}>Đơn hàng đang trên đường giao đến người mua</Text>
            </View>
          )}

          {/* BUYER: đã nhận hàng — đánh giá + tranh chấp trong 7 ngày */}
          {canReviewByStatus && isBuyerOfOrder && (
            <View style={styles.disputeAndReviewWrap}>
              {/* Nút đánh giá */}
              {hasReviewed ? (
                <View style={styles.reviewedBadge}>
                  <Star size={16} color={COLORS.success} fill={COLORS.success} />
                  <Text style={styles.reviewedBadgeText}>Bạn đã đánh giá đơn này</Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={() => setShowReviewModal(true)}
                >
                  <Star size={16} color={COLORS.primary} />
                  <Text style={styles.secondaryButtonText}>Đánh giá người bán</Text>
                </TouchableOpacity>
              )}

              {/* Tranh chấp trong 7 ngày */}
              {canDisputeAfterDelivery && (
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowDisputeModal(true)}
                >
                  <AlertTriangle size={16} color={COLORS.error} />
                  <Text style={styles.cancelButtonText}>Tranh chấp</Text>
                </TouchableOpacity>
              )}

              {/* Hết hạn tranh chấp */}
              {!canDisputeAfterDelivery && deliveredAt && (
                <View style={styles.disputeExpiredBadge}>
                  <Text style={styles.disputeExpiredText}>
                    Đã hết thời hạn tranh chấp ({DISPUTE_WINDOW_DAYS} ngày)
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        <View style={{ height: 40 }} />
      </Animated.ScrollView>

      <DisputeModal
        visible={showDisputeModal}
        orderId={order._id}
        onClose={() => setShowDisputeModal(false)}
        onSuccess={() => {
          setShowDisputeModal(false);
          getOrderById(order._id);
        }}
      />

      <ConfirmReceivedModal
        visible={showConfirmModal}
        orderId={order._id}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmReceived}
        loading={confirmLoading}
      />

      <ReviewModal
        visible={showReviewModal}
        orderId={order._id}
        onClose={() => setShowReviewModal(false)}
        onSuccess={() => {
          setShowReviewModal(false);
          setHasReviewed(true);
          getOrderById(order._id);
        }}
      />

      {/* Shipping Modal */}
      <Modal
        visible={showShippingModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowShippingModal(false)}
      >
        <View style={styles.shippingModalOverlay}>
          <View style={styles.shippingModalSheet}>
            {/* Header */}
            <View style={styles.shippingModalHeader}>
              <Text style={styles.shippingModalTitle}>Chọn đơn vị vận chuyển</Text>
              <TouchableOpacity onPress={() => setShowShippingModal(false)}>
                <X size={22} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            {/* Carrier options */}
            <View style={styles.carrierGrid}>
              {[
                { value: 'GIAO_HANG_NHANH', label: 'Giao Hàng Nhanh', icon: '📦' },
                { value: 'VIETTEL_POST', label: 'Viettel Post', icon: '📮' },
                { value: 'VNPOST', label: 'VNPost', icon: '✉️' },
                { value: 'SELF_PICKUP', label: 'Tự giao hàng', icon: '🚚' },
              ].map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[
                    styles.carrierOption,
                    shippingCarrier === opt.value && styles.carrierOptionActive,
                  ]}
                  onPress={() => setShippingCarrier(opt.value)}
                >
                  <Text style={styles.carrierIcon}>{opt.icon}</Text>
                  <Text style={[
                    styles.carrierLabel,
                    shippingCarrier === opt.value && styles.carrierLabelActive,
                  ]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Info */}
            <View style={styles.shippingInfoBox}>
              <AlertCircle size={14} color={COLORS.info} />
              <Text style={styles.shippingInfoText}>
                Hệ thống sẽ tự tạo mã vận đơn và thông báo cho người mua.
              </Text>
            </View>

            {/* Confirm button */}
            <TouchableOpacity
              style={[styles.confirmShippingBtn, shippingLoading && { opacity: 0.7 }]}
              onPress={handleConfirmShipping}
              disabled={shippingLoading}
            >
              {shippingLoading
                ? <ActivityIndicator size="small" color={COLORS.white} />
                : <Truck size={18} color={COLORS.white} />
              }
              <Text style={styles.confirmShippingBtnText}>
                {shippingLoading ? 'Đang xử lý...' : 'Xác nhận giao hàng'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  sellerAvatarPlaceholder: { backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  sellerAvatarInitial: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
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
  
  // Payment actions styles
  paymentActions: { width: '100%' },
  checkingContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
  },
  checkingText: { 
    marginLeft: SPACING.sm, 
    fontSize: FONT_SIZES.md, 
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHTS.medium,
  },
  secondaryActions: { 
    flexDirection: 'row', 
    gap: SPACING.sm,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.base,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.white,
  },
  secondaryButtonText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.primary,
  },
  reviewedBadge: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.base,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primarySurface,
  },
  reviewedBadgeText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.success,
  },
  cancelButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.base,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.error,
    backgroundColor: COLORS.white,
  },
  cancelButtonText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.error,
  },
  disputeAndReviewWrap: {
    gap: SPACING.sm,
  },
  disputeExpiredBadge: {
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  disputeExpiredText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textLight,
    fontStyle: 'italic',
  },
  shippingStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: COLORS.success,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.base,
  },
  shippingStatusText: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    color: COLORS.success,
    fontWeight: FONT_WEIGHTS.semibold,
  },
  startShippingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.success,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.sm,
  },
  startShippingBtnText: {
    fontSize: FONT_SIZES.base,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white,
  },
  shippingModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  shippingModalSheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: RADIUS['2xl'],
    borderTopRightRadius: RADIUS['2xl'],
    padding: SPACING.xl,
    paddingBottom: SPACING['2xl'],
  },
  shippingModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  shippingModalTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
  },
  carrierGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  carrierOption: {
    width: '47%',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    gap: SPACING.xs,
  },
  carrierOptionActive: {
    borderColor: COLORS.success,
    backgroundColor: '#F0FDF4',
  },
  carrierIcon: {
    fontSize: 26,
  },
  carrierLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  carrierLabelActive: {
    color: COLORS.success,
  },
  shippingInfoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.xs,
    backgroundColor: '#EFF6FF',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  shippingInfoText: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    color: '#1D4ED8',
    lineHeight: 20,
  },
  confirmShippingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.success,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
  },
  confirmShippingBtnText: {
    fontSize: FONT_SIZES.base,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white,
  },
});

export default OrderDetailScreen;
