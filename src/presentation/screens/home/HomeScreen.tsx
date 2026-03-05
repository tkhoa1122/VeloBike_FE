/**
 * VeloBike Home Screen
 * Search bar, categories, featured listings, recommended
 */
import React, { useRef, useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Image,
  Animated,
  StatusBar,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Search,
  Bell,
  MapPin,
  Heart,
  Star,
  Bike,
  Mountain,
  Zap,
  Route,
  Timer,
} from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import {
  COLORS,
  SPACING,
  RADIUS,
  FONT_SIZES,
  FONT_WEIGHTS,
  SHADOWS,
  ICON_SIZES,
} from '../../../config/theme';
import { useAuthStore } from '../../viewmodels/AuthStore';
import { useListingStore } from '../../viewmodels/ListingStore';
import { useNotificationStore } from '../../viewmodels/NotificationStore';
import type { Listing } from '../../../domain/entities/Listing';
import { formatCurrency, formatBikeCondition } from '../../../utils/formatters';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.65;
const SMALL_CARD_WIDTH = (SCREEN_WIDTH - SPACING.xl * 2 - SPACING.md) / 2;

// =============================================================================
// CATEGORY DATA
// =============================================================================
const CATEGORIES = [
  { id: 'ROAD', label: 'Road', icon: Bike, color: COLORS.primary },
  { id: 'MTB', label: 'MTB', icon: Mountain, color: '#8B5CF6' },
  { id: 'GRAVEL', label: 'Gravel', icon: Route, color: '#F59E0B' },
  { id: 'TRIATHLON', label: 'Tri', icon: Timer, color: '#EF4444' },
  { id: 'E_BIKE', label: 'E-Bike', icon: Zap, color: '#06B6D4' },
];

// =============================================================================
// HELPERS
// =============================================================================
const formatPrice = (price: number): string => {
  if (price >= 1_000_000) {
    return `${(price / 1_000_000).toFixed(price % 1_000_000 === 0 ? 0 : 1)}tr`;
  }
  if (price >= 1_000) {
    return `${(price / 1_000).toFixed(0)}k`;
  }
  return price.toLocaleString('vi-VN');
};

const conditionLabel = (c: string): string => {
  const map: Record<string, string> = {
    NEW: 'Mới',
    LIKE_NEW: 'Như mới',
    GOOD: 'Tốt',
    FAIR: 'Khá',
    PARTS: 'Linh kiện',
  };
  return map[c] || c;
};

// =============================================================================
// COMPONENT
// =============================================================================
interface HomeScreenProps {
  onSearch?: () => void;
  onNotifications?: () => void;
  onListingDetail?: (id: string) => void;
  onCategoryPress?: (category: string) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onSearch,
  onNotifications,
  onListingDetail,
  onCategoryPress,
}) => {
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const { featuredListings, listings, getFeaturedListings, getListings, loadingState } = useListingStore();
  const { unreadCount } = useNotificationStore();

  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Entrance animation
  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  // Load data on mount
  useEffect(() => {
    getFeaturedListings(6);
    getListings({ page: 1, limit: 8 });
  }, [getFeaturedListings, getListings]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      getFeaturedListings(6),
      getListings({ page: 1, limit: 8 }),
    ]);
    setRefreshing(false);
  }, [getFeaturedListings, getListings]);

  const handleCategoryPress = useCallback(
    (id: string) => {
      setSelectedCategory(prev => (prev === id ? null : id));
      onCategoryPress?.(id);
    },
    [onCategoryPress],
  );

  const greeting = (): string => {
    const h = new Date().getHours();
    if (h < 12) return 'Chào buổi sáng';
    if (h < 18) return 'Chào buổi chiều';
    return 'Chào buổi tối';
  };

  // ─── RENDER ─────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      <Animated.ScrollView
        style={[styles.scrollView, { opacity: fadeAnim }]}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + SPACING.md, paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
      >
        {/* ── HEADER ─────────────────────────────────── */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>{greeting()} 👋</Text>
            <Text style={styles.userName}>
              {user?.fullName || 'Bike Lover'}
            </Text>
          </View>
          <TouchableOpacity onPress={onNotifications} style={styles.notifBtn}>
            <Bell size={ICON_SIZES.base} color={COLORS.text} />
            {unreadCount > 0 && <View style={styles.notifDot} />}
          </TouchableOpacity>
        </View>

        {/* ── SEARCH BAR ─────────────────────────────── */}
        <TouchableOpacity onPress={onSearch} activeOpacity={0.8} style={styles.searchBar}>
          <Search size={ICON_SIZES.md} color={COLORS.textLight} />
          <Text style={styles.searchPlaceholder}>Tìm xe đạp, phụ kiện...</Text>
        </TouchableOpacity>

        {/* ── CATEGORIES ─────────────────────────────── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Danh mục</Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryRow}
        >
          {CATEGORIES.map(cat => {
            const Icon = cat.icon;
            const active = selectedCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                onPress={() => handleCategoryPress(cat.id)}
                style={[styles.categoryChip, active && { backgroundColor: cat.color + '18' }]}
              >
                <View
                  style={[
                    styles.categoryIcon,
                    { backgroundColor: cat.color + '15' },
                    active && { backgroundColor: cat.color + '25' },
                  ]}
                >
                  <Icon size={20} color={cat.color} />
                </View>
                <Text
                  style={[
                    styles.categoryLabel,
                    active && { color: cat.color, fontWeight: FONT_WEIGHTS.bold },
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ── FEATURED ───────────────────────────────── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Nổi bật</Text>
          <TouchableOpacity>
            <Text style={styles.seeAll}>Xem tất cả</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={featuredListings}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.featuredList}
          keyExtractor={item => item._id}
          renderItem={({ item }: { item: Listing }) => (
            <TouchableOpacity
              style={styles.featuredCard}
              activeOpacity={0.85}
              onPress={() => onListingDetail?.(item._id)}
            >
              <View style={styles.featuredImageWrap}>
                <Image source={{ uri: item.media?.thumbnails?.[0] }} style={styles.featuredImage} />
                {/* Badge */}
                <View style={styles.conditionBadge}>
                  <Text style={styles.conditionBadgeText}>
                    {conditionLabel(item.generalInfo?.condition ?? '')}
                  </Text>
                </View>
                {/* Heart */}
                <TouchableOpacity style={styles.heartBtn}>
                  <Heart size={16} color={COLORS.white} />
                </TouchableOpacity>
              </View>
              <View style={styles.featuredInfo}>
                <Text style={styles.featuredBrand}>{item.generalInfo?.brand}</Text>
                <Text style={styles.featuredTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                <View style={styles.featuredRow}>
                  <Text style={styles.featuredPrice}>{formatPrice(item.pricing?.amount ?? 0)}₫</Text>
                  {item.pricing?.originalPrice && (
                    <Text style={styles.featuredOrigPrice}>
                      {formatPrice(item.pricing.originalPrice)}₫
                    </Text>
                  )}
                </View>
                <View style={styles.featuredMeta}>
                  <MapPin size={12} color={COLORS.textLight} />
                  <Text style={styles.metaText}>{item.location?.address}</Text>
                  <Heart size={12} color={COLORS.textLight} />
                  <Text style={styles.metaText}>{item.saves}</Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />

        {/* ── RECOMMENDED ────────────────────────────── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Gợi ý cho bạn</Text>
          <TouchableOpacity>
            <Text style={styles.seeAll}>Xem tất cả</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.gridContainer}>
          {listings.map((item: Listing) => (
            <TouchableOpacity
              key={item._id}
              style={styles.smallCard}
              activeOpacity={0.85}
              onPress={() => onListingDetail?.(item._id)}
            >
              <View style={styles.smallImageWrap}>
                <Image source={{ uri: item.media?.thumbnails?.[0] }} style={styles.smallImage} />
                <View style={styles.conditionBadgeSm}>
                  <Text style={styles.conditionBadgeSmText}>
                    {conditionLabel(item.generalInfo?.condition ?? '')}
                  </Text>
                </View>
                <TouchableOpacity style={styles.heartBtnSm}>
                  <Heart size={14} color={COLORS.white} />
                </TouchableOpacity>
              </View>
              <View style={styles.smallInfo}>
                <Text style={styles.smallTitle} numberOfLines={2}>
                  {item.title}
                </Text>
                <Text style={styles.smallPrice}>{formatPrice(item.pricing?.amount ?? 0)}₫</Text>
                <View style={styles.smallMeta}>
                  <MapPin size={10} color={COLORS.textLight} />
                  <Text style={styles.smallMetaText}>{item.location?.address}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── PROMO BANNER ───────────────────────────── */}
        <TouchableOpacity activeOpacity={0.9} style={styles.promoBanner}>
          <LinearGradient
            colors={[COLORS.primary, COLORS.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0.6 }}
            style={styles.promoGradient}
          >
            <View style={styles.promoContent}>
              <Text style={styles.promoTitle}>Đăng ký bán hàng</Text>
              <Text style={styles.promoSubtitle}>
                Trở thành người bán trên VeloBike và tiếp cận hàng nghìn người mua
              </Text>
              <View style={styles.promoCTA}>
                <Text style={styles.promoCTAText}>Tìm hiểu thêm →</Text>
              </View>
            </View>
            <View style={styles.promoIcon}>
              <Bike size={64} color={COLORS.white} strokeWidth={1} style={{ opacity: 0.3 }} />
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.ScrollView>
    </View>
  );
};

// =============================================================================
// STYLES
// =============================================================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 32 },

  // ── Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.base,
  },
  headerLeft: {},
  greeting: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  userName: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    marginTop: 2,
  },
  notifBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notifDot: {
    position: 'absolute',
    top: 10,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.error,
    borderWidth: 2,
    borderColor: COLORS.surface,
  },

  // ── Search
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: SPACING.xl,
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    gap: SPACING.sm,
    marginBottom: SPACING.xl,
  },
  searchPlaceholder: {
    fontSize: FONT_SIZES.base,
    color: COLORS.textLight,
    flex: 1,
  },

  // ── Section
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.md,
    marginTop: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
  },
  seeAll: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.primary,
  },

  // ── Categories
  categoryRow: {
    paddingHorizontal: SPACING.xl,
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  categoryChip: {
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.lg,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  categoryLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.textSecondary,
  },

  // ── Featured
  featuredList: {
    paddingHorizontal: SPACING.xl,
    gap: SPACING.md,
  },
  featuredCard: {
    width: CARD_WIDTH,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    ...SHADOWS.md,
    overflow: 'hidden',
  },
  featuredImageWrap: {
    width: '100%',
    height: CARD_WIDTH * 0.6,
    backgroundColor: COLORS.surface,
  },
  featuredImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  conditionBadge: {
    position: 'absolute',
    top: SPACING.sm,
    left: SPACING.sm,
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
  },
  conditionBadgeText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white,
  },
  heartBtn: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  featuredInfo: {
    padding: SPACING.md,
  },
  featuredBrand: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  featuredTitle: {
    fontSize: FONT_SIZES.base,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  featuredRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  featuredPrice: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.accent,
  },
  featuredOrigPrice: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textLight,
    textDecorationLine: 'line-through',
  },
  featuredMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textLight,
    marginRight: SPACING.sm,
  },

  // ── Recommended (grid)
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SPACING.xl,
    gap: SPACING.md,
  },
  smallCard: {
    width: SMALL_CARD_WIDTH,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    ...SHADOWS.sm,
    overflow: 'hidden',
  },
  smallImageWrap: {
    width: '100%',
    height: SMALL_CARD_WIDTH * 0.75,
    backgroundColor: COLORS.surface,
  },
  smallImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  conditionBadgeSm: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS.xs,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  conditionBadgeSmText: {
    fontSize: 10,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white,
  },
  heartBtnSm: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  smallInfo: {
    padding: SPACING.sm,
  },
  smallTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.text,
    marginBottom: 4,
    lineHeight: FONT_SIZES.sm * 1.4,
  },
  smallPrice: {
    fontSize: FONT_SIZES.base,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.accent,
    marginBottom: 4,
  },
  smallMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  smallMetaText: {
    fontSize: 11,
    color: COLORS.textLight,
  },

  // ── Promo Banner
  promoBanner: {
    marginHorizontal: SPACING.xl,
    marginTop: SPACING.xl,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    ...SHADOWS.md,
  },
  promoGradient: {
    flexDirection: 'row',
    padding: SPACING.xl,
    minHeight: 130,
  },
  promoContent: {
    flex: 1,
  },
  promoTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white,
    marginBottom: SPACING.xs,
  },
  promoSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: FONT_SIZES.sm * 1.5,
    marginBottom: SPACING.md,
  },
  promoCTA: {
    backgroundColor: COLORS.accent,
    alignSelf: 'flex-start',
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.xs,
  },
  promoCTAText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white,
  },
  promoIcon: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default HomeScreen;
