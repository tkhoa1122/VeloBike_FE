/**
 * VeloBike Seller Orders Management
 * Complete orders management with status tracking and actions
 */
import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Animated,
  StatusBar,
  ActivityIndicator,
  SafeAreaView,
  Modal,
  TextInput,
  FlatList,
  Alert,
} from 'react-native';
import tw from 'twrnc';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  Search,
  Clock,
  CheckCircle,
  Truck,
  AlertCircle,
  X,
  MessageSquare,
  Package,
  Eye,
} from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { COLORS } from '../../../config/theme';
import { container } from '../../../di/Container';

type OrderStatus =
  | 'ESCROW_LOCKED'
  | 'IN_INSPECTION'
  | 'INSPECTION_PASSED'
  | 'INSPECTION_FAILED'
  | 'SHIPPING'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'DISPUTE';

interface Order {
  _id: string;
  orderCode: string;
  buyerId: {
    _id: string;
    fullName: string;
    avatar?: string;
    phone?: string;
  };
  itemId: {
    _id: string;
    title: string;
  };
  totalAmount: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  inspection?: {
    status: 'PENDING' | 'PASSED' | 'FAILED';
    feedback?: string;
    photos?: string[];
  };
  shipping?: {
    trackingNumber?: string;
    carrier?: string;
    estimatedDelivery?: string;
  };
  payment?: {
    method: string;
    status: 'PENDING' | 'RECEIVED' | 'PROCESSING';
  };
}

type OrderFilterStatus = 'ALL' | OrderStatus;

interface SellerOrdersScreenProps {
  onBack?: () => void;
  onViewOrderDetail?: (order: Order) => void;
  onMessage?: (buyerId: string, options?: { name?: string; avatar?: string }) => void;
}

const ALL_KNOWN_STATUSES: OrderStatus[] = [
  'ESCROW_LOCKED',
  'IN_INSPECTION',
  'INSPECTION_PASSED',
  'INSPECTION_FAILED',
  'SHIPPING',
  'DELIVERED',
  'COMPLETED',
  'CANCELLED',
  'DISPUTE',
];

function mapApiOrderToSellerOrder(raw: any): Order {
  const buyer =
    typeof raw.buyerId === 'object' && raw.buyerId
      ? raw.buyerId
      : { _id: String(raw.buyerId || ''), fullName: 'Người mua' };
  const listing =
    typeof raw.listingId === 'object' && raw.listingId
      ? raw.listingId
      : { _id: String(raw.listingId || ''), title: 'Sản phẩm' };
  const st = String(raw.status || '');
  const status: OrderStatus = ALL_KNOWN_STATUSES.includes(st as OrderStatus)
    ? (st as OrderStatus)
    : 'ESCROW_LOCKED';

  return {
    _id: raw._id,
    orderCode: raw.orderCode || raw._id?.slice(-8)?.toUpperCase() || '—',
    buyerId: {
      _id: buyer._id || buyer,
      fullName: buyer.fullName || 'Người mua',
      avatar: buyer.avatar,
      phone: buyer.phone,
    },
    itemId: {
      _id: listing._id || listing,
      title: listing.title || 'Sản phẩm',
    },
    totalAmount: raw.financials?.totalAmount ?? 0,
    status,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    inspection: raw.inspection,
    shipping: raw.shipping,
    payment: raw.payment,
  };
}

export const SellerOrdersScreen: React.FC<SellerOrdersScreenProps> = ({
  onBack,
  onViewOrderDetail,
  onMessage,
}) => {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<OrderFilterStatus>('ALL');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showInspectionModal, setShowInspectionModal] = useState(false);
  const [inspectionFeedback, setInspectionFeedback] = useState('');
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const statusLabels: Record<OrderStatus, string> = {
    ESCROW_LOCKED: 'Chờ kiểm hàng',
    IN_INSPECTION: 'Đang kiểm hàng',
    INSPECTION_PASSED: 'Kiểm hàng xong',
    INSPECTION_FAILED: 'Kiểm hàng lỗi',
    SHIPPING: 'Đang giao',
    DELIVERED: 'Đã giao',
    COMPLETED: 'Hoàn thành',
    CANCELLED: 'Đã hủy',
    DISPUTE: 'Tranh chấp',
  };

  const statusColors: Record<OrderStatus, string> = {
    ESCROW_LOCKED: '#F59E0B',
    IN_INSPECTION: '#10B981',
    INSPECTION_PASSED: '#10B981',
    INSPECTION_FAILED: '#EF4444',
    SHIPPING: '#8B5CF6',
    DELIVERED: '#06B6D4',
    COMPLETED: '#10B981',
    CANCELLED: '#6B7280',
    DISPUTE: '#DC2626',
  };

  const statusBgColors: Record<OrderStatus, string> = {
    ESCROW_LOCKED: '#FEF3C7',
    IN_INSPECTION: '#F0F9FF',
    INSPECTION_PASSED: '#F0FDF4',
    INSPECTION_FAILED: '#FEF2F2',
    SHIPPING: '#F5F3FF',
    DELIVERED: '#F0F9FF',
    COMPLETED: '#F0FDF4',
    CANCELLED: '#F3F4F6',
    DISPUTE: '#FEE2E2',
  };

  const statusIcons: Record<OrderStatus, React.ReactNode> = {
    ESCROW_LOCKED: <Clock size={16} />,
    IN_INSPECTION: <Package size={16} />,
    INSPECTION_PASSED: <CheckCircle size={16} />,
    INSPECTION_FAILED: <AlertCircle size={16} />,
    SHIPPING: <Truck size={16} />,
    DELIVERED: <CheckCircle size={16} />,
    COMPLETED: <CheckCircle size={16} />,
    CANCELLED: <X size={16} />,
    DISPUTE: <AlertCircle size={16} />,
  };

  const getStatusTimeline = (status: OrderStatus): string => {
    const timeline: Record<OrderStatus, string> = {
      ESCROW_LOCKED: 'Chờ bạn kiểm hàng',
      IN_INSPECTION: 'Đang trong quá trình kiểm hàng',
      INSPECTION_PASSED: 'Kiểm hàng thành công, chờ giao hàng',
      INSPECTION_FAILED: 'Kiểm hàng thất bại, cần xử lý',
      SHIPPING: 'Đã giao cho shipper',
      DELIVERED: 'Người mua đã nhận hàng',
      COMPLETED: 'Đơn hàng hoàn thành',
      CANCELLED: 'Đơn hàng đã bị hủy',
      DISPUTE: 'Có tranh chấp cần xử lý',
    };
    return timeline[status];
  };

  useEffect(() => {
    loadOrders();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [search, activeFilter, orders]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const res = await container().orderApiClient.getMyOrders({
        page: 1,
        limit: 100,
        sort: { field: 'createdAt', order: 'desc' },
        filters: { role: 'seller' },
      });

      if (!res.success || !Array.isArray(res.data)) {
        Toast.show({ type: 'error', text1: res.message || 'Không tải được đơn hàng' });
        setOrders([]);
        return;
      }

      const mapped = res.data.map((row: any) => mapApiOrderToSellerOrder(row));
      setOrders(mapped);
    } catch (error) {
      console.error('Failed to load orders:', error);
      Toast.show({
        type: 'error',
        text1: 'Lỗi tải dữ liệu',
        text2: 'Không thể tải danh sách đơn hàng. Vui lòng thử lại.',
      });
    } finally {
      setLoading(false);
    }
  };

  const filterOrders = () => {
    let filtered = orders;

    // Filter by status
    if (activeFilter !== 'ALL') {
      filtered = filtered.filter(o => o.status === activeFilter);
    }

    // Filter by search
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        o =>
          o.orderCode.toLowerCase().includes(searchLower) ||
          o.buyerId.fullName.toLowerCase().includes(searchLower) ||
          o.itemId.title.toLowerCase().includes(searchLower)
      );
    }

    setFilteredOrders(filtered);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  };

  const handleApproveInspection = async (orderId: string) => {
    try {
      // TODO: Call API to update inspection status
      // await container().orderApiClient.approveInspection(orderId);

      setOrders(prev =>
        prev.map(o =>
          o._id === orderId
            ? {
                ...o,
                status: 'INSPECTION_PASSED',
                inspection: { ...o.inspection, status: 'PASSED' },
              }
            : o
        )
      );

      setShowInspectionModal(false);
      setInspectionFeedback('');
      Toast.show({
        type: 'success',
        text1: 'Đã phê duyệt',
        text2: 'Kiểm hàng thành công, chuyển sang giao hàng',
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Lỗi phê duyệt',
        text2: 'Không thể phê duyệt kiểm hàng. Vui lòng thử lại.',
      });
    }
  };

  const handleRejectInspection = async (orderId: string) => {
    Alert.alert(
      'Từ chối kiểm hàng',
      'Bạn muốn từ chối kiểm hàng? Vui lòng nhập lý do.',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Từ chối',
          style: 'destructive',
          onPress: async () => {
            try {
              // TODO: Call API to reject inspection
              // await container().orderApiClient.rejectInspection(orderId, inspectionFeedback);

              setOrders(prev =>
                prev.map(o =>
                  o._id === orderId
                    ? {
                        ...o,
                        status: 'INSPECTION_FAILED',
                        inspection: {
                          ...o.inspection,
                          status: 'FAILED',
                          feedback: inspectionFeedback,
                        },
                      }
                    : o
                )
              );

              setShowInspectionModal(false);
              setInspectionFeedback('');
              Toast.show({
                type: 'success',
                text1: 'Đã từ chối',
                text2: 'Kiểm hàng thất bại, hãy liên hệ với người mua',
              });
            } catch (error) {
              Toast.show({
                type: 'error',
                text1: 'Lỗi từ chối',
                text2: 'Không thể từ chối kiểm hàng. Vui lòng thử lại.',
              });
            }
          },
        },
      ]
    );
  };

  const renderOrderItem = ({ item }: { item: Order }) => (
    <TouchableOpacity
      style={tw`bg-white rounded-xl mb-3 overflow-hidden shadow-sm`}
      onPress={() => {
        setSelectedOrder(item);
        setShowDetailModal(true);
      }}
    >
      {/* Header */}
      <View style={tw`p-3 border-b border-gray-100`}>
        <View style={tw`flex-row items-center justify-between mb-2`}>
          <Text style={tw`text-sm font-bold text-gray-900`}>{item.orderCode}</Text>
          <View
            style={[
              tw`px-2.5 py-1 rounded-full flex-row items-center gap-1`,
              { backgroundColor: statusBgColors[item.status] },
            ]}
          >
            <Text style={[tw`text-xs`, { color: statusColors[item.status] }]}>
              {statusIcons[item.status]}
            </Text>
            <Text style={[tw`text-xs font-bold`, { color: statusColors[item.status] }]}>
              {statusLabels[item.status]}
            </Text>
          </View>
        </View>
        <Text style={tw`text-xs text-gray-500`}>{getStatusTimeline(item.status)}</Text>
      </View>

      {/* Content */}
      <View style={tw`p-3`}>
        <View style={tw`mb-2`}>
          <Text style={tw`text-xs text-gray-500 mb-1`}>Người mua</Text>
          <Text style={tw`text-sm font-semibold text-gray-900`}>{item.buyerId.fullName}</Text>
        </View>

        <View style={tw`mb-2`}>
          <Text style={tw`text-xs text-gray-500 mb-1`}>Sản phẩm</Text>
          <Text style={tw`text-sm font-semibold text-gray-900 leading-5`} numberOfLines={2}>
            {item.itemId.title}
          </Text>
        </View>

        <View style={tw`flex-row items-center justify-between`}>
          <Text style={tw`text-sm font-bold text-green-600`}>
            {(item.totalAmount / 1000000).toFixed(1)}M đ
          </Text>
          <Text style={tw`text-xs text-gray-500`}>{item.updatedAt}</Text>
        </View>
      </View>

      {/* Actions */}
      <View style={tw`flex-row items-center gap-2 px-3 py-2 bg-gray-50 border-t border-gray-100`}>
        {item.status === 'ESCROW_LOCKED' && (
          <TouchableOpacity
            style={tw`flex-1 flex-row items-center justify-center gap-1 bg-green-50 rounded-lg py-2`}
            onPress={() => {
              setSelectedOrder(item);
              setShowInspectionModal(true);
            }}
          >
            <Package size={14} color={COLORS.primary} />
            <Text style={tw`text-xs font-bold text-green-600`}>Kiểm hàng</Text>
          </TouchableOpacity>
        )}

        {item.status === 'IN_INSPECTION' && (
          <TouchableOpacity
            style={tw`flex-1 flex-row items-center justify-center gap-1 bg-green-50 rounded-lg py-2`}
            onPress={() => {
              setSelectedOrder(item);
              setShowInspectionModal(true);
            }}
          >
            <CheckCircle size={14} color="#10B981" />
            <Text style={tw`text-xs font-bold text-green-600`}>Kết quả kiểm</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={tw`flex-1 flex-row items-center justify-center gap-1 bg-purple-50 rounded-lg py-2`}
          onPress={() =>
            onMessage?.(item.buyerId._id, { name: item.buyerId.fullName, avatar: item.buyerId.avatar })
          }
        >
          <MessageSquare size={14} color="#8B5CF6" />
          <Text style={tw`text-xs font-bold text-purple-600`}>Nhắn tin</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={tw`flex-1 flex-row items-center justify-center gap-1 bg-gray-100 rounded-lg py-2`}
          onPress={() => onViewOrderDetail?.(item)}
        >
          <Eye size={14} color={COLORS.textLight} />
          <Text style={tw`text-xs font-bold text-gray-600`}>Chi tiết</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={tw`flex-1 items-center justify-center bg-gray-50`}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const filterOptions: OrderFilterStatus[] = [
    'ALL',
    'ESCROW_LOCKED',
    'IN_INSPECTION',
    'INSPECTION_PASSED',
    'SHIPPING',
    'DELIVERED',
    'COMPLETED',
  ];

  return (
    <SafeAreaView style={tw`flex-1 bg-gray-50`}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      {/* Header */}
      <Animated.View style={[tw`bg-white shadow-sm`, { opacity: fadeAnim }]}>
        <View style={[tw`px-4 py-3 flex-row items-center justify-between`, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity onPress={onBack} style={tw`-ml-2 p-2`}>
            <ChevronLeft size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={tw`flex-1 text-lg font-bold text-gray-900 ml-2`}>Quản lý đơn hàng</Text>
          <View style={tw`w-10`} />
        </View>
      </Animated.View>

      {/* Search Bar */}
      <View style={tw`bg-white px-4 py-3 border-b border-gray-100`}>
        <View style={tw`flex-row items-center gap-2 bg-gray-50 rounded-lg px-3 py-2.5`}>
          <Search size={18} color={COLORS.textLight} />
          <TextInput
            placeholder="Tìm theo mã đơn, người mua..."
            placeholderTextColor={COLORS.textLight}
            style={tw`flex-1 text-sm text-gray-900`}
            value={search}
            onChangeText={setSearch}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <X size={18} color={COLORS.textLight} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={tw`bg-white px-4 py-3 border-b border-gray-100`}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={tw`-mx-4 px-4`}>
          {filterOptions.map(status => (
            <TouchableOpacity
              key={status}
              style={[
                tw`mr-2 px-4 py-2 rounded-full border`,
                activeFilter === status ? tw`bg-green-600 border-green-600` : tw`bg-white border-gray-200`,
              ]}
              onPress={() => setActiveFilter(status)}
            >
              <Text
                style={[
                  tw`text-sm font-bold whitespace-nowrap`,
                  activeFilter === status ? tw`text-white` : tw`text-gray-700`,
                ]}
              >
                {status === 'ALL' ? 'Tất cả' : statusLabels[status as OrderStatus]}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Orders List */}
      <FlatList
        data={filteredOrders}
        renderItem={renderOrderItem}
        keyExtractor={item => item._id}
        contentContainerStyle={tw`px-4 py-3 pb-6`}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={tw`mt-8 items-center`}>
            <AlertCircle size={48} color={COLORS.textLight} />
            <Text style={tw`text-gray-500 text-sm mt-3 font-semibold`}>
              {search ? 'Không tìm thấy đơn hàng nào' : 'Chưa có đơn hàng nào'}
            </Text>
          </View>
        }
      />

      {/* Detail Modal */}
      {selectedOrder && (
        <Modal visible={showDetailModal} animationType="slide" transparent onRequestClose={() => setShowDetailModal(false)}>
          <SafeAreaView style={tw`flex-1 bg-gray-50`}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

            {/* Modal Header */}
            <View style={tw`bg-white px-4 py-3 flex-row items-center justify-between border-b border-gray-100`}>
              <Text style={tw`text-lg font-bold text-gray-900`}>Chi tiết đơn hàng</Text>
              <TouchableOpacity onPress={() => setShowDetailModal(false)}>
              <X size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={tw`px-4 py-4 pb-6`}>
              {/* Order Info */}
              <View style={tw`bg-white rounded-xl p-4 mb-4`}>
                <View style={tw`flex-row items-center justify-between mb-3`}>
                  <Text style={tw`text-lg font-bold text-gray-900`}>{selectedOrder.orderCode}</Text>
                  <View
                    style={[
                      tw`px-3 py-1 rounded-full flex-row items-center gap-1`,
                      { backgroundColor: statusBgColors[selectedOrder.status] },
                    ]}
                  >
                    <Text style={[tw`text-xs`, { color: statusColors[selectedOrder.status] }]}>
                      {statusIcons[selectedOrder.status]}
                    </Text>
                    <Text
                      style={[tw`text-xs font-bold`, { color: statusColors[selectedOrder.status] }]}
                    >
                      {statusLabels[selectedOrder.status]}
                    </Text>
                  </View>
                </View>
                <Text style={tw`text-xs text-gray-500 leading-5`}>
                  {getStatusTimeline(selectedOrder.status)}
                </Text>
              </View>

              {/* Buyer Info */}
              <View style={tw`bg-white rounded-xl p-4 mb-4`}>
                <Text style={tw`text-sm font-bold text-gray-900 mb-3`}>Thông tin người mua</Text>
                <View style={tw`flex-row justify-between mb-2`}>
                  <Text style={tw`text-xs text-gray-600`}>Tên:</Text>
                  <Text style={tw`text-sm font-semibold text-gray-900`}>{selectedOrder.buyerId.fullName}</Text>
                </View>
                {selectedOrder.buyerId.phone && (
                  <View style={tw`flex-row justify-between`}>
                    <Text style={tw`text-xs text-gray-600`}>Điện thoại:</Text>
                    <Text style={tw`text-sm font-semibold text-gray-900`}>{selectedOrder.buyerId.phone}</Text>
                  </View>
                )}
              </View>

              {/* Product Info */}
              <View style={tw`bg-white rounded-xl p-4 mb-4`}>
                <Text style={tw`text-sm font-bold text-gray-900 mb-3`}>Sản phẩm</Text>
                <Text style={tw`text-sm text-gray-900 mb-3 leading-5`}>{selectedOrder.itemId.title}</Text>
                <View style={tw`flex-row items-center justify-between pt-3 border-t border-gray-100`}>
                  <Text style={tw`text-xs text-gray-600`}>Tổng tiền:</Text>
                  <Text style={tw`text-lg font-bold text-green-600`}>
                    {(selectedOrder.totalAmount / 1000000).toFixed(1)}M đ
                  </Text>
                </View>
              </View>

              {/* Payment Info */}
              {selectedOrder.payment && (
                <View style={tw`bg-white rounded-xl p-4 mb-4`}>
                  <Text style={tw`text-sm font-bold text-gray-900 mb-3`}>Thanh toán</Text>
                  <View style={tw`flex-row justify-between mb-2`}>
                    <Text style={tw`text-xs text-gray-600`}>Phương thức:</Text>
                    <Text style={tw`text-sm font-semibold text-gray-900`}>
                      {selectedOrder.payment.method === 'WALLET' ? 'Ví VeloBike' : 'Chuyển khoản'}
                    </Text>
                  </View>
                  <View style={tw`flex-row justify-between`}>
                    <Text style={tw`text-xs text-gray-600`}>Trạng thái:</Text>
                    <Text
                      style={[
                        tw`text-sm font-semibold`,
                        selectedOrder.payment.status === 'RECEIVED' ? tw`text-green-600` : tw`text-amber-600`,
                      ]}
                    >
                      {selectedOrder.payment.status === 'RECEIVED' ? 'Đã nhận' : 'Chờ nhận'}
                    </Text>
                  </View>
                </View>
              )}

              {/* Shipping Info */}
              {selectedOrder.shipping && selectedOrder.status !== 'ESCROW_LOCKED' && (
                <View style={tw`bg-white rounded-xl p-4 mb-4`}>
                  <Text style={tw`text-sm font-bold text-gray-900 mb-3`}>Giao hàng</Text>
                  {selectedOrder.shipping.trackingNumber && (
                    <View style={tw`flex-row justify-between mb-2`}>
                      <Text style={tw`text-xs text-gray-600`}>Mã vận đơn:</Text>
                      <Text style={tw`text-sm font-semibold text-gray-900`}>
                        {selectedOrder.shipping.trackingNumber}
                      </Text>
                    </View>
                  )}
                  {selectedOrder.shipping.carrier && (
                    <View style={tw`flex-row justify-between mb-2`}>
                      <Text style={tw`text-xs text-gray-600`}>Đơn vị:</Text>
                      <Text style={tw`text-sm font-semibold text-gray-900`}>
                        {selectedOrder.shipping.carrier}
                      </Text>
                    </View>
                  )}
                  {selectedOrder.shipping.estimatedDelivery && (
                    <View style={tw`flex-row justify-between`}>
                      <Text style={tw`text-xs text-gray-600`}>Dự kiến giao:</Text>
                      <Text style={tw`text-sm font-semibold text-gray-900`}>
                        {selectedOrder.shipping.estimatedDelivery}
                      </Text>
                    </View>
                  )}
                </View>
              )}

              {/* Inspection Info */}
              {selectedOrder.inspection && selectedOrder.status !== 'ESCROW_LOCKED' && (
                <View style={tw`bg-white rounded-xl p-4`}>
                  <Text style={tw`text-sm font-bold text-gray-900 mb-3`}>Kiểm hàng</Text>
                  <View style={tw`flex-row justify-between mb-2`}>
                    <Text style={tw`text-xs text-gray-600`}>Trạng thái:</Text>
                    <Text
                      style={[
                        tw`text-sm font-semibold`,
                        selectedOrder.inspection.status === 'PASSED'
                          ? tw`text-green-600`
                          : selectedOrder.inspection.status === 'FAILED'
                            ? tw`text-red-600`
                            : tw`text-amber-600`,
                      ]}
                    >
                      {selectedOrder.inspection.status === 'PASSED' ? 'Đạt' : selectedOrder.inspection.status === 'FAILED' ? 'Không đạt' : 'Chờ xử lý'}
                    </Text>
                  </View>
                  {selectedOrder.inspection.feedback && (
                    <View>
                      <Text style={tw`text-xs text-gray-600 mb-1`}>Nhận xét:</Text>
                      <Text style={tw`text-sm text-gray-900 bg-gray-50 p-2 rounded`}>
                        {selectedOrder.inspection.feedback}
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </ScrollView>
          </SafeAreaView>
        </Modal>
      )}

      {/* Inspection Modal */}
      {selectedOrder && (
        <Modal
          visible={showInspectionModal}
          animationType="slide"
          transparent
          onRequestClose={() => setShowInspectionModal(false)}
        >
          <SafeAreaView style={tw`flex-1 bg-gray-50`}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

            {/* Modal Header */}
            <View style={tw`bg-white px-4 py-3 flex-row items-center justify-between border-b border-gray-100`}>
              <Text style={tw`text-lg font-bold text-gray-900`}>
                {selectedOrder.status === 'IN_INSPECTION' ? 'Kết quả kiểm hàng' : 'Kiểm hàng'}
              </Text>
              <TouchableOpacity onPress={() => setShowInspectionModal(false)}>
                <X size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={tw`px-4 py-4 pb-6 flex-1`}>
              {/* Order Summary */}
              <View style={tw`bg-white rounded-xl p-4 mb-4`}>
                <Text style={tw`text-sm font-bold text-gray-900 mb-2`}>{selectedOrder.orderCode}</Text>
                <Text style={tw`text-xs text-gray-500 mb-3`}>{selectedOrder.itemId.title}</Text>
                <View style={tw`pt-3 border-t border-gray-100`}>
                  <Text style={tw`text-xs text-gray-600 mb-1`}>Người mua:</Text>
                  <Text style={tw`text-sm font-semibold text-gray-900`}>{selectedOrder.buyerId.fullName}</Text>
                </View>
              </View>

              {/* Inspection Feedback */}
              <View style={tw`bg-white rounded-xl p-4 mb-4 flex-1`}>
                <Text style={tw`text-sm font-bold text-gray-900 mb-3`}>Feedback kiểm hàng</Text>
                <TextInput
                  placeholder="Nhập nhận xét về tình trạng hàng..."
                  placeholderTextColor={COLORS.textLight}
                  style={tw`flex-1 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-900 text-left align-top`}
                  value={inspectionFeedback}
                  onChangeText={setInspectionFeedback}
                  multiline
                  textAlignVertical="top"
                />
              </View>

              {/* Action Buttons */}
              <View style={tw`flex-row gap-3`}>
                <TouchableOpacity
                  style={tw`flex-1 flex-row items-center justify-center gap-2 bg-red-600 rounded-lg py-3`}
                  onPress={() => handleRejectInspection(selectedOrder._id)}
                >
                  <X size={18} color="white" />
                  <Text style={tw`text-white font-bold`}>Không đạt</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={tw`flex-1 flex-row items-center justify-center gap-2 bg-green-600 rounded-lg py-3`}
                  onPress={() => handleApproveInspection(selectedOrder._id)}
                >
                  <CheckCircle size={18} color="white" />
                  <Text style={tw`text-white font-bold`}>Đạt</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </SafeAreaView>
        </Modal>
      )}
    </SafeAreaView>
  );
};

export default SellerOrdersScreen;
