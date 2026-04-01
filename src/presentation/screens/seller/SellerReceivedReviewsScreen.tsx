/**
 * Người bán xem đánh giá nhận được — GET /api/reviews/my-reviews
 */
import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Star } from 'lucide-react-native';
import { COLORS, SPACING, RADIUS, FONT_SIZES, FONT_WEIGHTS } from '../../../config/theme';
import { useReviewStore } from '../../viewmodels/ReviewStore';
import type { Review } from '../../../domain/entities/Review';
import { formatRelativeTime } from '../../../utils/formatters';

interface SellerReceivedReviewsScreenProps {
  onBack?: () => void;
}

export const SellerReceivedReviewsScreen: React.FC<SellerReceivedReviewsScreenProps> = ({
  onBack,
}) => {
  const insets = useSafeAreaInsets();
  const { myReviews, loadingState, getMyReviews } = useReviewStore();
  const loading = loadingState === 'loading';

  const load = useCallback(() => {
    getMyReviews(1, 30);
  }, [getMyReviews]);

  useEffect(() => {
    load();
  }, [load]);

  const renderItem = ({ item }: { item: Review }) => (
    <View style={styles.card}>
      <View style={styles.row}>
        <Text style={styles.buyer} numberOfLines={1}>
          {typeof item.buyerId === 'object' && item.buyerId?.fullName
            ? item.buyerId.fullName
            : 'Người mua'}
        </Text>
        <View style={styles.stars}>
          {[1, 2, 3, 4, 5].map(s => (
            <Star
              key={s}
              size={14}
              color={s <= item.rating ? COLORS.warning : COLORS.border}
              fill={s <= item.rating ? COLORS.warning : 'none'}
            />
          ))}
        </View>
      </View>
      {!!item.comment && <Text style={styles.comment}>{item.comment}</Text>}
      <Text style={styles.time}>{formatRelativeTime(item.createdAt)}</Text>
    </View>
  );

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <ArrowLeft size={22} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Đánh giá nhận được</Text>
        <View style={{ width: 28 }} />
      </View>

      {loading && myReviews.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={myReviews}
          keyExtractor={i => i._id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={loading && myReviews.length > 0} onRefresh={load} />}
          ListEmptyComponent={
            <Text style={styles.empty}>Chưa có đánh giá nào.</Text>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: FONT_SIZES.lg, fontWeight: FONT_WEIGHTS.semibold, color: COLORS.text },
  list: { padding: SPACING.xl, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  buyer: { fontSize: FONT_SIZES.md, fontWeight: FONT_WEIGHTS.semibold, color: COLORS.text, flex: 1 },
  stars: { flexDirection: 'row', gap: 2 },
  comment: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, lineHeight: 20 },
  time: { fontSize: FONT_SIZES.xs, color: COLORS.textLight, marginTop: SPACING.sm },
  empty: { textAlign: 'center', color: COLORS.textLight, marginTop: SPACING['3xl'] },
});

export default SellerReceivedReviewsScreen;
