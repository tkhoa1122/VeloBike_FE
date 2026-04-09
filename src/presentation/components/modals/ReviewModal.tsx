/**
 * Modal đánh giá người bán sau đơn — dùng ReviewStore + BE POST /api/reviews
 */
import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { X, Star } from 'lucide-react-native';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, SHADOWS } from '../../../config/theme';
import Toast from 'react-native-toast-message';
import { container } from '../../../di/Container';

interface ReviewModalProps {
  visible: boolean;
  orderId: string;
  onClose: () => void;
  onSuccess: () => void;
}

const RATING_LABELS: Record<number, string> = {
  1: 'Tệ',
  2: 'Không hài lòng',
  3: 'Bình thường',
  4: 'Hài lòng',
  5: 'Tuyệt vời',
};

const StarRating: React.FC<{
  value: number;
  onChange: (value: number) => void;
  size?: number;
}> = ({ value, onChange, size = 24 }) => (
  <View style={styles.starContainer}>
    {[1, 2, 3, 4, 5].map(star => (
      <TouchableOpacity key={star} onPress={() => onChange(star)} style={styles.starButton}>
        <Star
          size={size}
          color={star <= value ? COLORS.warning : COLORS.border}
          fill={star <= value ? COLORS.warning : 'none'}
        />
      </TouchableOpacity>
    ))}
  </View>
);

export const ReviewModal: React.FC<ReviewModalProps> = ({ visible, orderId, onClose, onSuccess }) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [categories, setCategories] = useState({
    itemAccuracy: 5,
    communication: 5,
    shipping: 5,
    packaging: 5,
  });
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleCategoryChange = (category: keyof typeof categories, value: number) => {
    setCategories(prev => ({ ...prev, [category]: value }));
  };

  const handleSubmit = async () => {
    if (!comment.trim()) {
      Toast.show({ type: 'error', text1: 'Vui lòng nhập nhận xét chi tiết' });
      return;
    }

    setSubmitError(null);
    setLoading(true);
    try {
      const orderResponse = await container().orderApiClient.getOrderById(orderId);
      const latestStatus = String(orderResponse?.data?.status || '').toUpperCase();
      if (!orderResponse?.success || !['COMPLETED', 'DELIVERED'].includes(latestStatus)) {
        const msg = 'Đơn hàng chưa ở trạng thái hoàn tất để đánh giá';
        setSubmitError(msg);
        Toast.show({
          type: 'error',
          text1: 'Không thể gửi đánh giá',
          text2: msg,
        });
        return;
      }

      const payload = {
        orderId,
        rating,
        comment: comment.trim(),
        categories,
      };

      const response = await container().reviewApiClient.createReview(payload);
      const ok = response?.success !== false && !(response as any)?.error;

      if (ok) {
        Toast.show({ type: 'success', text1: 'Đánh giá đã được gửi' });
        onSuccess();
        onClose();
      } else {
        const err =
          (response as any)?.message ||
          (response as any)?.error ||
          'Đơn hàng chưa hợp lệ để đánh giá hoặc bạn không phải người mua';
        setSubmitError(err);
        Toast.show({
          type: 'error',
          text1: 'Không thể gửi đánh giá',
          text2: err,
        });
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Có lỗi khi gửi đánh giá';
      setSubmitError(msg);
      Toast.show({
        type: 'error',
        text1: 'Gửi đánh giá thất bại',
        text2: msg,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Đánh giá đơn hàng</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.overallRating}>
              <Text style={styles.label}>Đánh giá tổng quan</Text>
              <StarRating value={rating} onChange={setRating} size={32} />
              <Text style={styles.ratingLabel}>{RATING_LABELS[rating]}</Text>
            </View>

            <View style={styles.detailedRatings}>
              <View style={styles.ratingRow}>
                <Text style={styles.ratingRowLabel}>Sản phẩm đúng mô tả</Text>
                <StarRating
                  value={categories.itemAccuracy}
                  onChange={v => handleCategoryChange('itemAccuracy', v)}
                  size={16}
                />
              </View>
              <View style={styles.ratingRow}>
                <Text style={styles.ratingRowLabel}>Giao tiếp người bán</Text>
                <StarRating
                  value={categories.communication}
                  onChange={v => handleCategoryChange('communication', v)}
                  size={16}
                />
              </View>
              <View style={styles.ratingRow}>
                <Text style={styles.ratingRowLabel}>Thời gian giao hàng</Text>
                <StarRating
                  value={categories.shipping}
                  onChange={v => handleCategoryChange('shipping', v)}
                  size={16}
                />
              </View>
              <View style={styles.ratingRow}>
                <Text style={styles.ratingRowLabel}>Đóng gói sản phẩm</Text>
                <StarRating
                  value={categories.packaging}
                  onChange={v => handleCategoryChange('packaging', v)}
                  size={16}
                />
              </View>
            </View>

            <Text style={styles.label}>Nhận xét chi tiết</Text>
            <TextInput
              style={styles.textArea}
              value={comment}
              onChangeText={setComment}
              placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm và người bán..."
              placeholderTextColor={COLORS.textLight}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />

            {!!submitError && (
              <Text style={styles.errorText}>{submitError}</Text>
            )}
          </ScrollView>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose} disabled={loading}>
              <Text style={styles.cancelButtonText}>Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <Text style={styles.submitButtonText}>Gửi đánh giá</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    ...SHADOWS.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
  },
  closeButton: {
    padding: SPACING.xs,
  },
  content: {
    padding: SPACING.lg,
  },
  overallRating: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  starContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  starButton: {
    padding: 4,
  },
  ratingLabel: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.textLight,
    marginTop: SPACING.sm,
  },
  detailedRatings: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  ratingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  errorText: {
    marginTop: SPACING.sm,
    color: COLORS.error,
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.medium,
  },
  ratingRowLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
  },
  textArea: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: SPACING.md,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    minHeight: 120,
    marginBottom: SPACING.md,
  },
  actions: {
    flexDirection: 'row',
    padding: SPACING.lg,
    gap: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.text,
  },
  submitButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.white,
  },
});
