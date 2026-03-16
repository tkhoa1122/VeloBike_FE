/**
 * VeloBike Wishlist Screen
 * Saved listings with swipe-to-remove, price-drop badges
 */
import React, { useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Animated,
  StatusBar,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Heart, Trash2, MapPin, ShoppingBag } from 'lucide-react-native';
import {
  COLORS,
  SPACING,
  RADIUS,
  FONT_SIZES,
  FONT_WEIGHTS,
  SHADOWS,
  ICON_SIZES,
} from '../../../config/theme';
import { formatCurrency, formatBikeCondition, formatRelativeTime } from '../../../utils/formatters';
import { useWishlistStore, WishlistEntry } from '../../viewmodels/WishlistStore';

interface WishlistScreenProps {
  onListingPress?: (id: string) => void;
}

export const WishlistScreen: React.FC<WishlistScreenProps> = ({ onListingPress }) => {
  const insets = useSafeAreaInsets();
  const { items, totalItems, loadingState, getWishlist, removeFromWishlist } = useWishlistStore();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    getWishlist();
  }, [fadeAnim, getWishlist]);

  const handleRemove = useCallback((listingId: string) => {
    Alert.alert('Xóa khỏi yêu thích?', 'Xe này sẽ được xóa khỏi danh sách yêu thích.', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Xóa', style: 'destructive', onPress: () => removeFromWishlist(listingId) },
    ]);
  }, [removeFromWishlist]);

  const renderItem = useCallback(({ item, index }: { item: WishlistEntry; index: number }) => {
    const listing = item.listing;
    const listingId = listing?._id ?? '';
    return (
      <Animated.View style={[styles.card, { opacity: fadeAnim, transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [20 * (index + 1), 0] }) }] }]}>
        <TouchableOpacity style={styles.cardInner} activeOpacity={0.85} onPress={() => onListingPress?.(listingId)}>
          <Image source={{ uri: listing?.media?.thumbnails?.[0] }} style={styles.cardImg} />
          <View style={styles.cardContent}>
            <Text style={styles.cardBrand}>{listing?.generalInfo?.brand}</Text>
            <Text style={styles.cardTitle} numberOfLines={2}>{listing?.title}</Text>
            <Text style={styles.cardPrice}>{formatCurrency(listing?.pricing?.amount ?? 0)}</Text>
            {listing?.pricing?.originalPrice && (
              <Text style={styles.cardOrigPrice}>{formatCurrency(listing.pricing.originalPrice)}</Text>
            )}
            <View style={styles.cardMeta}>
              <MapPin size={11} color={COLORS.textLight} />
              <Text style={styles.cardMetaText}>{listing?.location?.address}</Text>
              <Text style={styles.cardMetaDot}>•</Text>
              <Text style={styles.cardMetaText}>{formatRelativeTime(item.addedAt)}</Text>
            </View>
            <View style={styles.condRow}>
              <View style={styles.condBadge}>
                <Text style={styles.condText}>{formatBikeCondition(listing?.generalInfo?.condition ?? '')}</Text>
              </View>
            </View>
          </View>
          <TouchableOpacity style={styles.removeBtn} onPress={() => handleRemove(listingId)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Trash2 size={18} color={COLORS.error} />
          </TouchableOpacity>
        </TouchableOpacity>
      </Animated.View>
    );
  }, [fadeAnim, handleRemove, onListingPress]);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Yêu thích</Text>
        {items.length > 0 && <Text style={styles.headerCount}>{items.length} sản phẩm</Text>}
      </View>
      {items.length === 0 ? (
        <View style={styles.empty}>
          <Heart size={ICON_SIZES['3xl']} color={COLORS.textLight} />
          <Text style={styles.emptyTitle}>Chưa có xe yêu thích</Text>
          <Text style={styles.emptySub}>Hãy lưu những xe bạn thích để xem lại sau!</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={i => i._id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.xl, paddingVertical: SPACING.base },
  headerTitle: { fontSize: FONT_SIZES['2xl'], fontWeight: FONT_WEIGHTS.bold, color: COLORS.text },
  headerCount: { fontSize: FONT_SIZES.md, color: COLORS.textSecondary },
  list: { paddingHorizontal: SPACING.xl, paddingBottom: 100 },
  card: { marginBottom: SPACING.md },
  cardInner: { flexDirection: 'row', backgroundColor: COLORS.white, borderRadius: RADIUS.lg, ...SHADOWS.sm, overflow: 'hidden' },
  cardImg: { width: 120, height: 130, backgroundColor: COLORS.skeleton },
  imgSold: { opacity: 0.4 },
  soldOverlay: { position: 'absolute', top: 0, left: 0, width: 120, height: 130, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)' },
  soldText: { fontSize: FONT_SIZES.md, fontWeight: FONT_WEIGHTS.bold, color: COLORS.white },
  dropBadge: { position: 'absolute', top: 6, left: 6, backgroundColor: COLORS.error, borderRadius: RADIUS.xs, flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 6, paddingVertical: 2 },
  dropBadgeText: { fontSize: 10, fontWeight: FONT_WEIGHTS.bold, color: COLORS.white },
  cardContent: { flex: 1, padding: SPACING.md },
  cardBrand: { fontSize: 10, fontWeight: FONT_WEIGHTS.semibold, color: COLORS.primary, textTransform: 'uppercase', letterSpacing: 0.5 },
  cardTitle: { fontSize: FONT_SIZES.md, fontWeight: FONT_WEIGHTS.medium, color: COLORS.text, marginVertical: 2, lineHeight: FONT_SIZES.md * 1.3 },
  cardPrice: { fontSize: FONT_SIZES.base, fontWeight: FONT_WEIGHTS.bold, color: COLORS.accent },
  cardOrigPrice: { fontSize: FONT_SIZES.sm, color: COLORS.textLight, textDecorationLine: 'line-through' },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 4 },
  cardMetaText: { fontSize: 11, color: COLORS.textLight },
  cardMetaDot: { fontSize: 10, color: COLORS.textLight },
  condRow: { marginTop: 4 },
  condBadge: { backgroundColor: COLORS.primarySurface, paddingHorizontal: 6, paddingVertical: 2, borderRadius: RADIUS.xs, alignSelf: 'flex-start' },
  condText: { fontSize: 10, fontWeight: FONT_WEIGHTS.semibold, color: COLORS.primary },
  removeBtn: { position: 'absolute', top: SPACING.sm, right: SPACING.sm, padding: 6 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: SPACING.md, paddingHorizontal: SPACING['3xl'] },
  emptyTitle: { fontSize: FONT_SIZES.xl, fontWeight: FONT_WEIGHTS.semibold, color: COLORS.text },
  emptySub: { fontSize: FONT_SIZES.md, color: COLORS.textLight, textAlign: 'center' },
});

export default WishlistScreen;
