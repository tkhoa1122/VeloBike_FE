import React, { useMemo, useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  FlatList,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Search, Rocket, Trash2, PencilLine, Eye, Send, Plus } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, SHADOWS, RADIUS } from '../../../config/theme';
import { container } from '../../../di/Container';
import { ENV } from '../../../config/environment';

type ListingStatus = 'DRAFT' | 'PUBLISHED' | 'PENDING_APPROVAL' | 'SOLD' | 'RESERVED' | 'REJECTED';

interface SellerListingItem {
  _id: string;
  title: string;
  type?: string;
  status: ListingStatus | string;
  views?: number;
  boostedUntil?: string;
  createdAt?: string;
  media?: { thumbnails?: string[] };
  pricing?: { amount?: number };
}

interface SellerListingsScreenProps {
  onBack: () => void;
  onEditListing?: (listing: unknown) => void;
  onViewListing?: (listing: unknown) => void;
  onCreateListing?: () => void;
}

const statusColor = (status: string) => {
  switch (status) {
    case 'PUBLISHED':
      return { bg: '#DCFCE7', text: '#166534' };
    case 'DRAFT':
      return { bg: '#F3F4F6', text: '#4B5563' };
    case 'PENDING_APPROVAL':
      return { bg: '#FEF3C7', text: '#92400E' };
    case 'SOLD':
      return { bg: '#DBEAFE', text: '#1E40AF' };
    case 'RESERVED':
      return { bg: '#F3E8FF', text: '#6B21A8' };
    case 'REJECTED':
      return { bg: '#FEE2E2', text: '#991B1B' };
    default:
      return { bg: '#F3F4F6', text: '#4B5563' };
  }
};

const formatMoney = (amount: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(
    amount || 0
  );

export const SellerListingsScreen: React.FC<SellerListingsScreenProps> = ({
  onBack,
  onEditListing,
  onViewListing,
  onCreateListing,
}) => {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [allListings, setAllListings] = useState<SellerListingItem[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | ListingStatus>('ALL');

  const loadListings = useCallback(async () => {
    try {
      const res = await container().listingApiClient.getMyListings({ page: 1, limit: 200 });
      if (res.success) {
        setAllListings(Array.isArray(res.data) ? (res.data as SellerListingItem[]) : []);
      } else {
        Toast.show({ type: 'error', text1: 'Không tải được danh sách tin' });
      }
    } catch (e: any) {
      Toast.show({ type: 'error', text1: 'Lỗi tải tin', text2: e?.message || 'Vui lòng thử lại' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadListings();
    }, [loadListings])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadListings();
  };

  const filtered = useMemo(() => {
    return allListings.filter((l) => {
      const bySearch = l.title?.toLowerCase().includes(search.toLowerCase());
      const byStatus = statusFilter === 'ALL' ? true : l.status === statusFilter;
      return bySearch && byStatus;
    });
  }, [allListings, search, statusFilter]);

  const activeCount = useMemo(() => allListings.filter((l) => l.status === 'PUBLISHED').length, [allListings]);
  const draftCount = useMemo(() => allListings.filter((l) => l.status === 'DRAFT').length, [allListings]);

  const handleDelete = (listing: SellerListingItem) => {
    Alert.alert('Xóa tin đăng', `Bạn muốn xóa "${listing.title}"?`, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          try {
            const res = await container().listingApiClient.deleteListing(listing._id);
            if (res.success) {
              setAllListings((prev) => prev.filter((x) => x._id !== listing._id));
              Toast.show({ type: 'success', text1: 'Đã xóa tin đăng' });
            } else {
              Toast.show({ type: 'error', text1: res.message || 'Xóa thất bại' });
            }
          } catch (e: any) {
            Toast.show({ type: 'error', text1: 'Không thể xóa', text2: e?.message });
          }
        },
      },
    ]);
  };

  const handleBoost = async (listing: SellerListingItem) => {
    try {
      const isBoosted = listing.boostedUntil && new Date(listing.boostedUntil) > new Date();
      if (isBoosted) return;
      const res = await container().listingApiClient.boostListing({ listingId: listing._id, days: 7 });
      if (res.success) {
        Toast.show({ type: 'success', text1: 'Boost thành công' });
        setAllListings((prev) =>
          prev.map((x) => (x._id === listing._id ? { ...x, boostedUntil: new Date(Date.now() + 7 * 86400000).toISOString() } : x))
        );
      } else {
        Toast.show({ type: 'error', text1: res.message || 'Boost thất bại' });
      }
    } catch (e: any) {
      Toast.show({ type: 'error', text1: 'Không thể boost', text2: e?.message });
    }
  };

  const handleSubmitApproval = async (listing: SellerListingItem) => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      if (!token) {
        Toast.show({ type: 'error', text1: 'Phiên đăng nhập hết hạn' });
        return;
      }

      const response = await fetch(`${ENV.API_BASE_URL}/listings/${listing._id}/submit-approval`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        Toast.show({ type: 'success', text1: 'Đã gửi duyệt thành công' });
        setAllListings((prev) => prev.map((x) => (x._id === listing._id ? { ...x, status: 'PENDING_APPROVAL' } : x)));
      } else {
        const data = await response.json().catch(() => ({}));
        Toast.show({ type: 'error', text1: data?.message || 'Gửi duyệt thất bại' });
      }
    } catch (e: any) {
      Toast.show({ type: 'error', text1: 'Không thể gửi duyệt', text2: e?.message });
    }
  };

  const renderItem = ({ item }: { item: SellerListingItem }) => {
    const st = statusColor(item.status);
    const boosted = item.boostedUntil && new Date(item.boostedUntil) > new Date();
    return (
      <View style={styles.card}>
        <TouchableOpacity style={styles.mainRow} onPress={() => onViewListing?.(item)} activeOpacity={0.8}>
          {item.media?.thumbnails?.[0] ? (
            <Image source={{ uri: item.media.thumbnails[0] }} style={styles.thumb} />
          ) : (
            <View style={[styles.thumb, { backgroundColor: COLORS.skeleton }]} />
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.itemTitle} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.price}>{formatMoney(item.pricing?.amount || 0)}</Text>
            <View style={styles.metaRow}>
              <View style={[styles.badge, { backgroundColor: st.bg }]}>
                <Text style={[styles.badgeText, { color: st.text }]}>{item.status}</Text>
              </View>
              <Text style={styles.views}>
                <Eye size={12} color={COLORS.textLight} /> {item.views || 0}
              </Text>
              {boosted ? <Text style={styles.boosted}>🚀 Boosted</Text> : null}
            </View>
          </View>
        </TouchableOpacity>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => onEditListing?.(item)}>
            <PencilLine size={14} color={COLORS.primary} />
            <Text style={styles.actionText}>Sửa</Text>
          </TouchableOpacity>

          {item.status === 'DRAFT' ? (
            <TouchableOpacity style={styles.actionBtn} onPress={() => handleSubmitApproval(item)}>
              <Send size={14} color="#065F46" />
              <Text style={[styles.actionText, { color: '#065F46' }]}>Gửi duyệt</Text>
            </TouchableOpacity>
          ) : null}

          {item.status === 'PUBLISHED' ? (
            <TouchableOpacity style={styles.actionBtn} onPress={() => handleBoost(item)} disabled={!!boosted}>
              <Rocket size={14} color={boosted ? COLORS.textLight : '#B45309'} />
              <Text style={[styles.actionText, { color: boosted ? COLORS.textLight : '#B45309' }]}>
                {boosted ? 'Đã boost' : 'Boost'}
              </Text>
            </TouchableOpacity>
          ) : null}

          {!['RESERVED', 'SOLD'].includes(item.status) ? (
            <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(item)}>
              <Trash2 size={14} color={COLORS.error} />
              <Text style={[styles.actionText, { color: COLORS.error }]}>Xóa</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Đang tải danh sách tin...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 8) }]}>
        <TouchableOpacity onPress={onBack} style={styles.iconBtn}>
          <ArrowLeft size={20} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Tin đăng của bạn</Text>
        <TouchableOpacity onPress={onCreateListing} style={styles.createBtn}>
          <Plus size={14} color={COLORS.white} />
          <Text style={styles.createBtnText}>Tạo</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filterWrap}>
        <View style={styles.searchBox}>
          <Search size={16} color={COLORS.textLight} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm tin đăng..."
            placeholderTextColor={COLORS.textLight}
            value={search}
            onChangeText={setSearch}
          />
        </View>
        <View style={styles.statusRow}>
          {(['ALL', 'PUBLISHED', 'DRAFT', 'PENDING_APPROVAL'] as const).map((s) => (
            <TouchableOpacity
              key={s}
              onPress={() => setStatusFilter(s)}
              style={[styles.filterChip, statusFilter === s && styles.filterChipActive]}
            >
              <Text style={[styles.filterChipText, statusFilter === s && styles.filterChipTextActive]}>
                {s === 'ALL'
                  ? 'Tất cả'
                  : s === 'PUBLISHED'
                    ? 'Đang bán'
                    : s === 'DRAFT'
                      ? 'Nháp'
                      : 'Chờ duyệt'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.listMetaRow}>
        <Text style={styles.listMetaText}>
          {filtered.length} kết quả{search ? ` cho "${search}"` : ''}
        </Text>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16, paddingBottom: 28 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Chưa có tin đăng nào</Text>
            <Text style={styles.emptyDesc}>Tạo tin từ Seller Dashboard để bắt đầu bán hàng.</Text>
          </View>
        }
        ListFooterComponent={
          <View style={styles.footerStats}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Tổng tin</Text>
              <Text style={styles.statValue}>{allListings.length}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Đang bán</Text>
              <Text style={styles.statValue}>{activeCount}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Bản nháp</Text>
              <Text style={styles.statValue}>{draftCount}</Text>
            </View>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 10, fontSize: FONT_SIZES.sm, color: COLORS.textSecondary },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    ...SHADOWS.sm,
  },
  iconBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.primary,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  createBtnText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '700',
  },
  title: { fontSize: FONT_SIZES.lg, fontWeight: FONT_WEIGHTS.bold, color: COLORS.text },
  filterWrap: { paddingHorizontal: 16, paddingTop: 12, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 10,
  },
  searchInput: { flex: 1, height: 40, color: COLORS.text, fontSize: FONT_SIZES.sm },
  statusRow: { flexDirection: 'row', gap: 8, paddingVertical: 10 },
  filterChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: '#F3F4F6' },
  filterChipActive: { backgroundColor: '#DCFCE7' },
  filterChipText: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '600' },
  filterChipTextActive: { color: '#166534' },
  listMetaRow: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F9FAFB',
  },
  listMetaText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  card: { backgroundColor: COLORS.white, borderRadius: 12, marginBottom: 10, overflow: 'hidden', ...SHADOWS.sm },
  mainRow: { flexDirection: 'row', gap: 10, padding: 12 },
  thumb: { width: 72, height: 72, borderRadius: 8 },
  itemTitle: { fontSize: FONT_SIZES.sm, fontWeight: FONT_WEIGHTS.bold, color: COLORS.text },
  price: { marginTop: 2, fontSize: FONT_SIZES.base, fontWeight: '700', color: '#16A34A' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  badge: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 10, fontWeight: '700' },
  views: { fontSize: 11, color: COLORS.textLight },
  boosted: { fontSize: 11, color: '#B45309', fontWeight: '600' },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 8,
  },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionText: { fontSize: 12, color: COLORS.primary, fontWeight: '600' },
  emptyCard: {
    marginTop: 24,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  emptyTitle: { fontSize: FONT_SIZES.base, fontWeight: FONT_WEIGHTS.bold, color: COLORS.text },
  emptyDesc: { marginTop: 6, fontSize: FONT_SIZES.sm, color: COLORS.textLight, textAlign: 'center' },
  footerStats: { flexDirection: 'row', gap: 10, marginTop: 8 },
  statBox: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statLabel: { fontSize: 12, color: COLORS.textSecondary },
  statValue: { marginTop: 4, fontSize: 22, fontWeight: '800', color: COLORS.text },
});

export default SellerListingsScreen;
