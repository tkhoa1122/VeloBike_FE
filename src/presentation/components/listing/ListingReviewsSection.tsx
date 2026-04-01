/**
 * Danh sách đánh giá người bán trên chi tiết tin (GET /reviews/:sellerId?listingId=)
 */
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Star } from 'lucide-react-native';
import { COLORS, SPACING, RADIUS, FONT_SIZES, FONT_WEIGHTS } from '../../../config/theme';
import { useReviewStore } from '../../viewmodels/ReviewStore';
import { formatRelativeTime } from '../../../utils/formatters';

interface ListingReviewsSectionProps {
  sellerUserId: string;
  listingId: string;
}

export const ListingReviewsSection: React.FC<ListingReviewsSectionProps> = ({
  sellerUserId,
  listingId,
}) => {
  const { reviews, stats, loadingState, getReviewsForUser } = useReviewStore();
  const loading = loadingState === 'loading';

  useEffect(() => {
    if (sellerUserId && listingId) {
      getReviewsForUser(sellerUserId, 1, 10, listingId);
    }
  }, [sellerUserId, listingId, getReviewsForUser]);

  if (!sellerUserId) return null;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Đánh giá từ người mua</Text>
      {stats && stats.totalReviews > 0 && (
        <View style={styles.summary}>
          <Text style={styles.avg}>{stats.averageRating.toFixed(1)}</Text>
          <Star size={18} color={COLORS.warning} fill={COLORS.warning} />
          <Text style={styles.count}>({stats.totalReviews} đánh giá)</Text>
        </View>
      )}

      {loading && reviews.length === 0 ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginVertical: SPACING.lg }} />
      ) : reviews.length === 0 ? (
        <Text style={styles.empty}>Chưa có đánh giá cho tin này.</Text>
      ) : (
        reviews.slice(0, 8).map(r => {
          const name =
            typeof r.buyerId === 'object' && r.buyerId && 'fullName' in r.buyerId
              ? r.buyerId.fullName
              : 'Người mua';
          return (
            <View key={r._id} style={styles.card}>
              <View style={styles.cardTop}>
                <Text style={styles.name} numberOfLines={1}>
                  {name}
                </Text>
                <View style={styles.starsRow}>
                  {[1, 2, 3, 4, 5].map(s => (
                    <Star
                      key={s}
                      size={12}
                      color={s <= r.rating ? COLORS.warning : COLORS.border}
                      fill={s <= r.rating ? COLORS.warning : 'none'}
                    />
                  ))}
                </View>
              </View>
              {!!r.comment && <Text style={styles.comment}>{r.comment}</Text>}
              <Text style={styles.time}>{formatRelativeTime(r.createdAt)}</Text>
            </View>
          );
        })
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginTop: SPACING['2xl'],
    paddingHorizontal: 0,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: SPACING.md,
  },
  avg: {
    fontSize: FONT_SIZES['2xl'],
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
  },
  count: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  empty: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textLight,
    fontStyle: 'italic',
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.text,
    flex: 1,
    marginRight: SPACING.sm,
  },
  starsRow: { flexDirection: 'row', gap: 2 },
  comment: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    lineHeight: FONT_SIZES.sm * 1.45,
  },
  time: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textLight,
    marginTop: SPACING.xs,
  },
});
