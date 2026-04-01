/**
 * VeloBike Seller Dashboard
 * Professional dashboard for sellers - sales, orders, inventory management
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
} from 'react-native';
import tw from 'twrnc';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Plus,
  TrendingUp,
  ShoppingBag,
  AlertCircle,
  Star,
  ArrowRight,
  RefreshCw,
  Zap,
} from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { COLORS } from '../../../config/theme';
import { useAuthStore } from '../../viewmodels/AuthStore';
import { container } from '../../../di/Container';
import { StatsCard } from './components/StatsCard';
import { ListingCard } from './components/ListingCard';
import { OrderCard } from './components/OrderCard';

interface SellerStats {
  totalListings: number;
  totalViews: number;
  totalSales: number;
  totalRevenue: number;
  conversionRate: number;
  walletBalance: number;
  pendingOrders: number;
  recentListings: Array<{
    _id: string;
    title: string;
    media: { thumbnails: string[] };
    pricing: { amount: number };
    views: number;
    status: string;
  }>;
  recentOrders: Array<{
    _id: string;
    buyerId: { fullName: string };
    sellerId: string;
    totalAmount: number;
    status: string;
    createdAt: string;
  }>;
}

interface SellerDashboardScreenProps {
  onCreateListing?: () => void;
  onViewListings?: () => void;
  onViewOrders?: () => void;
  onViewWallet?: () => void;
  onOpenListingDetail?: (listingId: string) => void;
  onUpgradeSubscription?: () => void;
}

export const SellerDashboardScreen: React.FC<SellerDashboardScreenProps> = ({
  onCreateListing,
  onViewListings,
  onViewOrders,
  onViewWallet,
  onOpenListingDetail,
  onUpgradeSubscription,
}) => {
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<SellerStats | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadDashboardData();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      let walletBalance = 0;
      try {
        const walletRes = await container().walletApiClient.getWalletBalance();
        if (walletRes.success && walletRes.data) {
          walletBalance = walletRes.data.balance ?? 0;
        }
      } catch (e) {
        console.warn('[SellerDashboard] Cannot fetch wallet balance:', e);
      }

      let listings: any[] = [];
      try {
        const listingsRes = await container().listingApiClient.getMyListings({ page: 1, limit: 200 });
        if (listingsRes.success && Array.isArray(listingsRes.data)) {
          listings = listingsRes.data;
        }
      } catch (e) {
        console.warn('[SellerDashboard] Cannot fetch listings:', e);
      }

      const totalViews = listings.reduce((sum, l) => sum + (l.views || 0), 0);
      const recentListings = [...listings]
        .sort(
          (a, b) =>
            new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        )
        .slice(0, 5)
        .map((l) => ({
          _id: l._id,
          title: l.title,
          media: { thumbnails: l.media?.thumbnails || [] },
          pricing: { amount: l.pricing?.amount || 0 },
          views: l.views || 0,
          status: l.status,
        }));

      let orders: any[] = [];
      try {
        const ordersRes = await container().orderApiClient.getMyOrders({
          page: 1,
          limit: 80,
          sort: { field: 'createdAt', order: 'desc' },
          filters: { role: 'seller' },
        });
        if (ordersRes.success && Array.isArray(ordersRes.data)) {
          orders = ordersRes.data;
        }
      } catch (e) {
        console.warn('[SellerDashboard] Cannot fetch seller orders:', e);
      }

      const pendingStatuses = new Set([
        'ESCROW_LOCKED',
        'IN_INSPECTION',
        'INSPECTION_PASSED',
        'SHIPPING',
        'DISPUTE',
      ]);
      const pendingOrders = orders.filter((o) => pendingStatuses.has(o.status)).length;

      const totalSales = orders.filter((o) => ['COMPLETED', 'DELIVERED'].includes(o.status)).length;
      const totalRevenue = orders
        .filter((o) => o.status === 'COMPLETED')
        .reduce((sum, o) => sum + (o.financials?.totalAmount || 0), 0);

      const recentOrders = orders.slice(0, 5).map((o) => ({
        _id: o._id,
        buyerId: {
          fullName:
            typeof o.buyerId === 'object' && o.buyerId?.fullName
              ? o.buyerId.fullName
              : 'Người mua',
        },
        sellerId: typeof o.sellerId === 'object' ? o.sellerId?._id : o.sellerId,
        totalAmount: o.financials?.totalAmount || 0,
        status: o.status,
        createdAt: o.createdAt,
      }));

      const conversionRate =
        totalViews > 0 ? Math.min(1, totalSales / Math.max(totalViews, 1)) : 0;

      const stats: SellerStats = {
        totalListings: listings.length,
        totalViews,
        totalSales,
        totalRevenue,
        conversionRate,
        walletBalance,
        pendingOrders,
        recentListings,
        recentOrders,
      };

      setStats(stats);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      Toast.show({
        type: 'error',
        text1: 'Lỗi tải dữ liệu',
        text2: 'Không thể tải dashboard. Vui lòng thử lại.',
      });
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const formatPrice = (price: number | string): string => {
    const num = typeof price === 'string' ? parseInt(price) : price;
    if (isNaN(num)) return '0 đ';
    return num.toLocaleString('vi-VN') + ' đ';
  };

  if (loading) {
    return (
      <View style={tw`flex-1 items-center justify-center bg-gray-50`}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={tw`flex-1 bg-gray-50`}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      <ScrollView
        contentContainerStyle={tw`pb-8`}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <Animated.View style={[tw`bg-white shadow-sm`, { opacity: fadeAnim }]}>
          <View style={[tw`px-4 py-4`, { paddingTop: insets.top + 8 }]}>
            <View style={tw`flex-row items-center justify-between`}>
              <View>
                <Text style={tw`text-sm text-gray-600`}>Xin chào,</Text>
                <Text style={tw`text-2xl font-bold text-gray-900`}>{user?.fullName || 'Người bán'}</Text>
              </View>
              <TouchableOpacity
                style={tw`w-10 h-10 rounded-full bg-green-50 items-center justify-center`}
                onPress={onRefresh}
              >
                <RefreshCw size={20} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>

        {/* Quick Actions Bar */}
        <View style={tw`px-4 py-4 flex-row gap-3`}>
          <TouchableOpacity
            style={tw`flex-1 flex-row items-center justify-center bg-green-600 rounded-xl py-3 gap-2 shadow-sm`}
            onPress={onCreateListing}
          >
            <Plus size={20} color="white" />
            <Text style={tw`text-white font-bold text-sm`}>Tạo tin</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={tw`flex-1 flex-row items-center justify-center bg-white rounded-xl py-3 gap-2 border border-gray-200 shadow-sm`}
            onPress={onViewOrders}
          >
            <ShoppingBag size={20} color={COLORS.primary} />
            <Text style={tw`text-gray-900 font-bold text-sm`}>Đơn hàng</Text>
          </TouchableOpacity>
        </View>

        {/* Premium Banner (if subscription = FREE) */}
        {user?.subscription?.plan === 'FREE' && (
          <View style={[tw`mx-4 mb-4 rounded-2xl p-4 border-2 border-amber-200`, { backgroundColor: '#FFFBEB' }]}>
            <View style={tw`flex-row items-start justify-between`}>
              <View style={tw`flex-1 mr-3`}>
                <View style={tw`flex-row items-center gap-2 mb-2`}>
                  <Zap size={18} color="#D97706" />
                  <Text style={tw`text-sm font-bold text-gray-900`}>Nâng cấp gói bán hàng</Text>
                </View>
                <Text style={tw`text-xs text-gray-700 leading-5`}>
                  Giảm hoa hồng xuống 5%, tạo tin không giới hạn và nhiều tính năng khác
                </Text>
              </View>
              <TouchableOpacity
                style={tw`bg-amber-500 rounded-lg px-3 py-2`}
                onPress={onUpgradeSubscription}
              >
                <Text style={tw`text-white text-xs font-bold`}>Nâng cấp</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Stats Grid */}
        <View style={tw`px-4 mb-2`}>

          <Text style={tw`text-sm font-bold text-gray-900 mb-3`}>Thống kê tháng này</Text>

          {/* Row 1 */}
          <View style={tw`flex-row gap-3 mb-1`}>
            <StatsCard
              icon={TrendingUp}
              title="Doanh thu"
              value={formatPrice(stats?.totalRevenue || 0)}
              subtitle="Tăng 12% so với tháng trước"
              trend={{ value: 12, isPositive: true }}
              color="#10B981"
              backgroundColor="#F0FDF4"
            />
            <StatsCard
              icon={ShoppingBag}
              title="Đơn hàng"
              value={stats?.totalSales || 0}
              subtitle={`${stats?.pendingOrders || 0} chờ xử lý`}
              color="#10B981"
              backgroundColor="#F0F9FF"
            />
          </View>

          {/* Row 2 */}
          <View style={tw`flex-row gap-3`}>
            <StatsCard
              icon={AlertCircle}
              title="Lượt xem"
              value={stats?.totalViews || 0}
              subtitle={`Tỷ lệ chuyển: ${((stats?.conversionRate || 0) * 100).toFixed(1)}%`}
              color="#F59E0B"
              backgroundColor="#FEF3C7"
            />
            <StatsCard
              icon={Star}
              title="Tin đăng"
              value={stats?.totalListings || 0}
              subtitle="Tổng tin của bạn"
              color="#8B5CF6"
              backgroundColor="#F5F3FF"
            />
          </View>
        </View>

        {/* Recent Listings Section */}
        <View style={tw`mt-6 px-4`}>
          <View style={tw`flex-row items-center justify-between mb-3`}>
            <Text style={tw`text-sm font-bold text-gray-900`}>Tin đăng gần đây</Text>
            <TouchableOpacity onPress={onViewListings}>
              <View style={tw`flex-row items-center gap-1`}>
                <Text style={tw`text-xs font-bold text-green-600`}>Xem tất cả</Text>
                <ArrowRight size={14} color={COLORS.primary} />
              </View>
            </TouchableOpacity>
          </View>

          {stats?.recentListings && stats.recentListings.length > 0 ? (
            stats.recentListings.map(listing => (
              <ListingCard
                key={listing._id}
                id={listing._id}
                title={listing.title}
                image={listing.media.thumbnails[0] || 'https://via.placeholder.com/200'}
                price={listing.pricing.amount}
                views={listing.views}
                status={listing.status as any}
                onPress={() => onOpenListingDetail?.(listing._id)}
              />
            ))
          ) : (
            <View style={tw`bg-white rounded-xl p-6 items-center`}>
              <AlertCircle size={24} color={COLORS.textLight} />
              <Text style={tw`text-gray-500 text-sm mt-2`}>Chưa có tin đăng nào</Text>
            </View>
          )}
        </View>

        {/* Recent Orders Section */}
        <View style={tw`mt-6 px-4`}>
          <View style={tw`flex-row items-center justify-between mb-3`}>
            <Text style={tw`text-sm font-bold text-gray-900`}>Đơn hàng gần đây</Text>
            <TouchableOpacity onPress={onViewOrders}>
              <View style={tw`flex-row items-center gap-1`}>
                <Text style={tw`text-xs font-bold text-green-600`}>Xem tất cả</Text>
                <ArrowRight size={14} color={COLORS.primary} />
              </View>
            </TouchableOpacity>
          </View>

          {stats?.recentOrders && stats.recentOrders.length > 0 ? (
            stats.recentOrders.map(order => (
              <OrderCard
                key={order._id}
                id={order._id}
                orderCode={order._id.slice(-6).toUpperCase()}
                buyerName={order.buyerId.fullName}
                itemTitle="Xe đạp"
                amount={order.totalAmount}
                status={order.status as any}
                createdAt={order.createdAt}
                onPress={() => {
                  Toast.show({
                    type: 'info',
                    text1: 'Chi tiết đơn hàng',
                    text2: `Đơn: ${order._id.slice(-6)}`,
                  });
                }}
              />
            ))
          ) : (
            <View style={tw`bg-white rounded-xl p-6 items-center`}>
              <AlertCircle size={24} color={COLORS.textLight} />
              <Text style={tw`text-gray-500 text-sm mt-2`}>Chưa có đơn hàng nào</Text>
            </View>
          )}
        </View>

        {/* Wallet Summary */}
        <View style={[tw`mt-6 mx-4 rounded-2xl p-4 border border-green-200`, { backgroundColor: '#ECFDF5' }]}>
          <View style={tw`flex-row items-center justify-between`}>
            <View>
              <Text style={tw`text-xs text-gray-600 mb-1`}>Số dư ví</Text>
              <Text style={tw`text-2xl font-bold text-green-600`}>
                {formatPrice(stats?.walletBalance || 0)}
              </Text>
            </View>
            <TouchableOpacity
              style={tw`bg-green-600 rounded-lg px-4 py-2`}
              onPress={onViewWallet}
            >
              <Text style={tw`text-white text-xs font-bold`}>Kiểm tra ví</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SellerDashboardScreen;
