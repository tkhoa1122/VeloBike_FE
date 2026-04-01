/**
 * Inspector Rating Modal Component
 * Modal đánh giá inspector
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
  Alert,
} from 'react-native';
import { X, Star } from 'lucide-react-native';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, SHADOWS } from '../../../config/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ENV } from '../../../config/environment';

interface InspectorRatingModalProps {
  visible: boolean;
  inspectionId: string;
  inspectorName: string;
  onClose: () => void;
  onSuccess: () => void;
}

const RATING_LABELS: Record<number, string> = {
  1: 'Tệ',
  2: 'Không hài lòng',
  3: 'Bình thường',
  4: 'Tốt',
  5: 'Xuất sắc',
};

const CATEGORIES = [
  { key: 'professionalism', label: 'Tính chuyên nghiệp' },
  { key: 'accuracy', label: 'Độ chính xác kiểm định' },
  { key: 'communication', label: 'Giao tiếp & thái độ' },
  { key: 'timeliness', label: 'Đúng giờ & tiến độ' },
] as const;

const StarRating: React.FC<{
  value: number;
  onChange: (value: number) => void;
  size?: number;
}> = ({ value, onChange, size = 24 }) => (
  <View style={styles.starContainer}>
    {[1, 2, 3, 4, 5].map((star) => (
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

export const InspectorRatingModal: React.FC<InspectorRatingModalProps> = ({
  visible,
  inspectionId,
  inspectorName,
  onClose,
  onSuccess,
}) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [categories, setCategories] = useState({
    professionalism: 5,
    accuracy: 5,
    communication: 5,
    timeliness: 5,
  });
  const [loading, setLoading] = useState(false);

  const handleCategoryChange = (category: keyof typeof categories, value: number) => {
    setCategories((prev) => ({ ...prev, [category]: value }));
  };

  const handleSubmit = async () => {
    if (!comment.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập nhận xét chi tiết');
      return;
    }

    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('access_token');
      if (!token) {
        Alert.alert('Lỗi', 'Phiên đăng nhập đã hết hạn');
        return;
      }

      const response = await fetch(`${ENV.API_BASE_URL}/inspector-reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          inspectionId,
          rating,
          comment,
          categories,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert('Thành công', 'Đánh giá inspector đã được gửi');
        onSuccess();
        onClose();
      } else {
        Alert.alert('Lỗi', data.message || 'Không thể gửi đánh giá');
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Có lỗi xảy ra khi gửi đánh giá');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Đánh giá Inspector</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Inspector Name */}
            <View style={styles.inspectorInfo}>
              <Text style={styles.inspectorLabel}>Inspector:</Text>
              <Text style={styles.inspectorName}>{inspectorName}</Text>
            </View>

            {/* Overall Rating */}
            <View style={styles.overallRating}>
              <Text style={styles.label}>Đánh giá tổng quan</Text>
              <StarRating value={rating} onChange={setRating} size={32} />
              <Text style={styles.ratingLabel}>{RATING_LABELS[rating]}</Text>
            </View>

            {/* Detailed Ratings */}
            <View style={styles.detailedRatings}>
              {CATEGORIES.map(({ key, label }) => (
                <View key={key} style={styles.ratingRow}>
                  <Text style={styles.ratingRowLabel}>{label}</Text>
                  <StarRating
                    value={categories[key]}
                    onChange={(v) => handleCategoryChange(key, v)}
                    size={16}
                  />
                </View>
              ))}
            </View>

            {/* Comment */}
            <Text style={styles.label}>Nhận xét chi tiết</Text>
            <TextInput
              style={styles.textArea}
              value={comment}
              onChangeText={setComment}
              placeholder="Chia sẻ trải nghiệm của bạn về inspector..."
              placeholderTextColor={COLORS.textLight}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
            />
          </ScrollView>

          {/* Actions */}
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
  inspectorInfo: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
  },
  inspectorLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textLight,
  },
  inspectorName: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    marginLeft: SPACING.xs,
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
  ratingRowLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    flex: 1,
  },
  textArea: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: SPACING.md,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    minHeight: 100,
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
