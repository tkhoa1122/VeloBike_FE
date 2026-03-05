/**
 * VeloBike Listing Detail Screen
 * Full bike detail view with image gallery, specs, seller info, CTAs
 */
import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Animated,
  StatusBar,
  Dimensions,
  FlatList,
  Share,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Heart,
  Share2,
  MapPin,
  Eye,
  Clock,
  Shield,
  MessageCircle,
  ShoppingCart,
  ChevronRight,
  Star,
  Award,
  Bike,
  Info,
  CheckCircle,
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
import { Button } from '../../components/common/Button';
import {
  formatCurrency,
  formatBikeCondition,
  formatBikeType,
  formatRelativeTime,
} from '../../../utils/formatters';
import { useListingStore } from '../../viewmodels/ListingStore';
import { useWishlistStore } from '../../viewmodels/WishlistStore';
import type { Listing } from '../../../domain/entities/Listing';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IMAGE_H = SCREEN_WIDTH * 0.85;

interface ListingDetailScreenProps {
  listingId?: string;
  onBack?: () => void;
  onChat?: (sellerId: string) => void;
  onBuy?: (listingId: string) => void;
  onSellerProfile?: (sellerId: string) => void;
}

export const ListingDetailScreen: React.FC<ListingDetailScreenProps> = ({
  listingId,
  onBack,
  onChat,
  onBuy,
  onSellerProfile,
}) => {
  const insets = useSafeAreaInsets();
  const { currentListing, getListingById, loadingState } = useListingStore();
  const { wishlistCache, checkInWishlist, addToWishlist, removeFromWishlist } = useWishlistStore();
  const [activeImageIdx, setActiveImageIdx] = useState(0);

  const scrollY = useRef(new Animated.Value(0)).current;
  const heartScale = useRef(new Animated.Value(1)).current;

  const listing = currentListing;
  const isSaved = listing ? (wishlistCache[listing._id] ?? false) : false;

  // Fetch listing data on mount
  useEffect(() => {
    if (listingId) {
      getListingById(listingId);
      checkInWishlist(listingId);
    }
  }, [listingId, getListingById, checkInWishlist]);

  if (!listing) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
        <Text style={{ color: COLORS.textLight }}>Đang tải...</Text>
      </View>
    );
  }

  const images = listing.media?.thumbnails ?? [];
  const seller = listing.sellerId as any;
  const discount = listing.pricing?.originalPrice
    ? Math.round(
        (1 - (listing.pricing.amount ?? 0) / listing.pricing.originalPrice) * 100,
      )
    : 0;

  const toggleSave = useCallback(() => {
    Animated.sequence([
      Animated.spring(heartScale, {
        toValue: 1.4,
        useNativeDriver: true,
      }),
      Animated.spring(heartScale, {
        toValue: 1,
        useNativeDriver: true,
      }),
    ]).start();
    if (listing?._id) {
      if (isSaved) {
        removeFromWishlist(listing._id);
      } else {
        addToWishlist(listing._id);
      }
    }
  }, [heartScale, listing, isSaved, addToWishlist, removeFromWishlist]);

  const handleShare = useCallback(async () => {
    try {
      await Share.share({
        message: `${listing.title} - ${formatCurrency(listing.pricing?.amount ?? 0)} trên VeloBike`,
      });
    } catch (_e) {
      // ignore
    }
  }, [listing]);

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, IMAGE_H - 100],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const renderSpec = (label: string, value?: string | number) => {
    if (!value) return null;
    return (
      <View style={styles.specRow} key={label}>
        <Text style={styles.specLabel}>{label}</Text>
        <Text style={styles.specValue}>
          {typeof value === 'number' ? `${value} kg` : value}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Sticky header overlay */}
      <Animated.View
        style={[
          styles.stickyHeader,
          { paddingTop: insets.top, opacity: headerOpacity },
        ]}
      >
        <Text style={styles.stickyTitle} numberOfLines={1}>
          {listing.title}
        </Text>
      </Animated.View>

      {/* Floating nav buttons */}
      <View style={[styles.navRow, { top: insets.top + SPACING.sm }]}>
        <TouchableOpacity style={styles.navBtn} onPress={onBack}>
          <ArrowLeft size={20} color={COLORS.white} />
        </TouchableOpacity>
        <View style={styles.navRight}>
          <Animated.View style={{ transform: [{ scale: heartScale }] }}>
            <TouchableOpacity style={styles.navBtn} onPress={toggleSave}>
              <Heart
                size={20}
                color={isSaved ? COLORS.error : COLORS.white}
                fill={isSaved ? COLORS.error : 'transparent'}
              />
            </TouchableOpacity>
          </Animated.View>
          <TouchableOpacity style={styles.navBtn} onPress={handleShare}>
            <Share2 size={20} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      </View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true },
        )}
        scrollEventThrottle={16}
      >
        {/* Image gallery */}
        <View style={styles.gallery}>
          <FlatList
            data={images}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(_, i) => `img_${i}`}
            onMomentumScrollEnd={e => {
              const idx = Math.round(
                e.nativeEvent.contentOffset.x / SCREEN_WIDTH,
              );
              setActiveImageIdx(idx);
            }}
            renderItem={({ item }) => (
              <Image
                source={{ uri: item }}
                style={styles.galleryImg}
                resizeMode="cover"
              />
            )}
          />
          {/* Dot indicators */}
          <View style={styles.dots}>
            {images.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  activeImageIdx === i && styles.dotActive,
                ]}
              />
            ))}
          </View>
          {/* Image counter */}
          <View style={styles.imgCounter}>
            <Text style={styles.imgCounterTxt}>
              {activeImageIdx + 1}/{images.length}
            </Text>
          </View>
        </View>

        {/* Main content */}
        <View style={styles.content}>
          {/* Title & badges */}
          <View style={styles.titleSection}>
            <View style={styles.badges}>
              <View style={styles.typeBadge}>
                <Text style={styles.typeBadgeText}>
                  {formatBikeType(listing.type ?? 'ROAD')}
                </Text>
              </View>
              <View style={styles.condBadge}>
                <Text style={styles.condBadgeText}>
                  {formatBikeCondition(
                    listing.generalInfo?.condition ?? '',
                  )}
                </Text>
              </View>
              {listing.featured && (
                <View style={styles.featBadge}>
                  <Award size={10} color={COLORS.white} />
                  <Text style={styles.featBadgeText}>Nổi bật</Text>
                </View>
              )}
            </View>
            <Text style={styles.title}>{listing.title}</Text>
            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Eye size={14} color={COLORS.textLight} />
                <Text style={styles.metaText}>{listing.views} lượt xem</Text>
              </View>
              <View style={styles.metaItem}>
                <Heart size={14} color={COLORS.textLight} />
                <Text style={styles.metaText}>{listing.saves} yêu thích</Text>
              </View>
              <View style={styles.metaItem}>
                <Clock size={14} color={COLORS.textLight} />
                <Text style={styles.metaText}>
                  {formatRelativeTime(listing.createdAt!)}
                </Text>
              </View>
            </View>
          </View>

          {/* Price section */}
          <View style={styles.priceSection}>
            <View>
              <Text style={styles.price}>
                {formatCurrency(listing.pricing?.amount ?? 0)}
              </Text>
              {listing.pricing?.originalPrice && (
                <View style={styles.origPriceRow}>
                  <Text style={styles.origPrice}>
                    {formatCurrency(listing.pricing.originalPrice)}
                  </Text>
                  <View style={styles.discBadge}>
                    <Text style={styles.discText}>-{discount}%</Text>
                  </View>
                </View>
              )}
            </View>
            {listing.pricing?.negotiable && (
              <View style={styles.negoBadge}>
                <Text style={styles.negoText}>Thương lượng</Text>
              </View>
            )}
          </View>

          {/* Location */}
          <TouchableOpacity style={styles.locRow}>
            <MapPin size={16} color={COLORS.primary} />
            <Text style={styles.locText}>
              {listing.location?.address}
            </Text>
            <ChevronRight size={16} color={COLORS.textLight} />
          </TouchableOpacity>

          {/* Inspection score */}
          {listing.inspectionScore && (
            <View style={styles.inspectionRow}>
              <Shield size={18} color={COLORS.success} />
              <View style={styles.inspectionInfo}>
                <Text style={styles.inspectionTitle}>
                  Đã kiểm định VeloBike
                </Text>
                <Text style={styles.inspectionScore}>
                  Điểm: {listing.inspectionScore}/100
                </Text>
              </View>
              <View style={styles.inspectionBadge}>
                <CheckCircle size={14} color={COLORS.success} />
              </View>
            </View>
          )}

          {/* Quick info grid */}
          <View style={styles.quickGrid}>
            {[
              {
                label: 'Thương hiệu',
                value: listing.generalInfo?.brand,
              },
              { label: 'Model', value: listing.generalInfo?.model },
              { label: 'Năm', value: listing.generalInfo?.year?.toString() },
              { label: 'Size', value: listing.generalInfo?.size },
              {
                label: 'Màu sắc',
                value: (listing.generalInfo as any)?.color,
              },
              {
                label: 'Trọng lượng',
                value: listing.specs?.weight
                  ? `${listing.specs.weight} kg`
                  : undefined,
              },
            ]
              .filter(i => i.value)
              .map((item, idx) => (
                <View key={idx} style={styles.quickItem}>
                  <Text style={styles.quickLabel}>{item.label}</Text>
                  <Text style={styles.quickValue}>{item.value}</Text>
                </View>
              ))}
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Mô tả</Text>
            <Text style={styles.descText}>{listing.description}</Text>
          </View>

          {/* Specs */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Thông số kỹ thuật</Text>
            <View style={styles.specsBox}>
              {renderSpec('Khung', listing.specs?.frameMaterial)}
              {renderSpec('Bộ truyền động', listing.specs?.groupset)}
              {renderSpec('Bộ bánh', listing.specs?.wheelset)}
              {renderSpec('Phanh', listing.specs?.brakeType)}
              {renderSpec('Cassette', listing.specs?.cassette)}
              {renderSpec('Ghi đông', listing.specs?.handlebar)}
              {renderSpec('Yên', listing.specs?.saddle)}
              {listing.specs?.weight &&
                renderSpec('Trọng lượng', listing.specs.weight)}
            </View>
          </View>

          {/* Seller info */}
          {seller && (
            <TouchableOpacity
              style={styles.sellerCard}
              activeOpacity={0.8}
              onPress={() => onSellerProfile?.(seller._id)}
            >
              <Image
                source={{ uri: seller.avatar }}
                style={styles.sellerAvatar}
              />
              <View style={styles.sellerInfo}>
                <Text style={styles.sellerName}>{seller.fullName}</Text>
                <View style={styles.sellerMeta}>
                  <Star size={12} color={COLORS.star} fill={COLORS.star} />
                  <Text style={styles.sellerRating}>
                    {seller.reputation?.rating}
                  </Text>
                  <Text style={styles.sellerReviews}>
                    ({seller.reputation?.totalReviews} đánh giá)
                  </Text>
                  <Text style={styles.sellerDot}>•</Text>
                  <Text style={styles.sellerOrders}>
                    {seller.reputation?.completedOrders} đã bán
                  </Text>
                </View>
              </View>
              <ChevronRight size={20} color={COLORS.textLight} />
            </TouchableOpacity>
          )}

          {/* Safety tips */}
          <View style={styles.safetyBox}>
            <Info size={16} color={COLORS.info} />
            <Text style={styles.safetyText}>
              Luôn gặp mặt kiểm tra xe trước khi thanh toán. Sử dụng thanh
              toán qua VeloBike để được bảo vệ.
            </Text>
          </View>

          <View style={{ height: 120 }} />
        </View>
      </Animated.ScrollView>

      {/* Bottom CTA bar */}
      <View style={[styles.ctaBar, { paddingBottom: insets.bottom + SPACING.md }]}>
        <TouchableOpacity
          style={styles.chatBtn}
          onPress={() => onChat?.(seller?._id)}
        >
          <MessageCircle size={22} color={COLORS.primary} />
          <Text style={styles.chatBtnText}>Chat</Text>
        </TouchableOpacity>
        <Button
          title="Mua ngay"
          onPress={() => onBuy?.(listing._id!)}
          icon={<ShoppingCart size={18} color={COLORS.white} />}
          style={styles.buyBtn}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  stickyHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    backgroundColor: COLORS.white,
    paddingHorizontal: 60,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  stickyTitle: {
    fontSize: FONT_SIZES.base,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.text,
    textAlign: 'center',
  },
  navRow: {
    position: 'absolute',
    left: SPACING.base,
    right: SPACING.base,
    zIndex: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navRight: { flexDirection: 'row', gap: SPACING.sm },
  navBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gallery: { width: SCREEN_WIDTH, height: IMAGE_H, backgroundColor: COLORS.surface },
  galleryImg: { width: SCREEN_WIDTH, height: IMAGE_H },
  dots: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  dotActive: { backgroundColor: COLORS.white, width: 20 },
  imgCounter: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: RADIUS.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  imgCounterTxt: { color: COLORS.white, fontSize: 11, fontWeight: FONT_WEIGHTS.medium },
  content: { paddingHorizontal: SPACING.xl },

  // Title section
  titleSection: { paddingTop: SPACING.xl },
  badges: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.sm },
  typeBadge: {
    backgroundColor: COLORS.primarySurface,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADIUS.xs,
  },
  typeBadgeText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.primary,
  },
  condBadge: {
    backgroundColor: COLORS.accentLight,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADIUS.xs,
  },
  condBadgeText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.accentDark,
  },
  featBadge: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADIUS.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  featBadgeText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white,
  },
  title: {
    fontSize: FONT_SIZES['2xl'],
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    lineHeight: FONT_SIZES['2xl'] * 1.3,
  },
  metaRow: {
    flexDirection: 'row',
    gap: SPACING.base,
    marginTop: SPACING.md,
  },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: FONT_SIZES.sm, color: COLORS.textLight },

  // Price
  priceSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: SPACING.xl,
    paddingVertical: SPACING.base,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },
  price: {
    fontSize: FONT_SIZES['3xl'],
    fontWeight: FONT_WEIGHTS.extrabold,
    color: COLORS.accent,
  },
  origPriceRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginTop: 4 },
  origPrice: {
    fontSize: FONT_SIZES.base,
    color: COLORS.textLight,
    textDecorationLine: 'line-through',
  },
  discBadge: {
    backgroundColor: COLORS.error,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
  },
  discText: { fontSize: 11, fontWeight: FONT_WEIGHTS.bold, color: COLORS.white },
  negoBadge: {
    backgroundColor: COLORS.primarySurface,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.md,
    alignSelf: 'flex-start',
  },
  negoText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.primary,
  },

  // Location
  locRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.base,
  },
  locText: {
    flex: 1,
    fontSize: FONT_SIZES.base,
    color: COLORS.text,
  },

  // Inspection
  inspectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FFF4',
    borderRadius: RADIUS.md,
    padding: SPACING.base,
    gap: SPACING.md,
    marginVertical: SPACING.sm,
  },
  inspectionInfo: { flex: 1 },
  inspectionTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.success,
  },
  inspectionScore: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginTop: 2 },
  inspectionBadge: {},

  // Quick info grid
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: SPACING.lg,
    gap: SPACING.sm,
  },
  quickItem: {
    width: '48%',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
  },
  quickLabel: { fontSize: FONT_SIZES.xs, color: COLORS.textLight, marginBottom: 4 },
  quickValue: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.text,
  },

  // Section
  section: { marginTop: SPACING['2xl'] },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  descText: {
    fontSize: FONT_SIZES.base,
    color: COLORS.textSecondary,
    lineHeight: FONT_SIZES.base * 1.7,
  },

  // Specs
  specsBox: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.base,
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  specLabel: { fontSize: FONT_SIZES.md, color: COLORS.textSecondary },
  specValue: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.text,
    flex: 1,
    textAlign: 'right',
    marginLeft: SPACING.md,
  },

  // Seller card
  sellerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.base,
    marginTop: SPACING['2xl'],
    gap: SPACING.md,
  },
  sellerAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.skeleton },
  sellerInfo: { flex: 1 },
  sellerName: {
    fontSize: FONT_SIZES.base,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.text,
  },
  sellerMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  sellerRating: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.text,
  },
  sellerReviews: { fontSize: FONT_SIZES.sm, color: COLORS.textLight },
  sellerDot: { fontSize: FONT_SIZES.xs, color: COLORS.textLight },
  sellerOrders: { fontSize: FONT_SIZES.sm, color: COLORS.textLight },

  // Safety
  safetyBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.infoLight,
    borderRadius: RADIUS.md,
    padding: SPACING.base,
    marginTop: SPACING.xl,
    gap: SPACING.sm,
  },
  safetyText: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    color: COLORS.info,
    lineHeight: FONT_SIZES.sm * 1.6,
  },

  // CTA bar
  ctaBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.md,
    gap: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    ...SHADOWS.lg,
  },
  chatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.lg,
    height: 48,
  },
  chatBtnText: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.primary,
  },
  buyBtn: { flex: 1 },
});

export default ListingDetailScreen;
