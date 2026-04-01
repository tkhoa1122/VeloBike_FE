/**
 * Dispute Modal Component
 * Modal để tạo tranh chấp cho đơn hàng
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
import { X } from 'lucide-react-native';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, SHADOWS } from '../../../config/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ENV } from '../../../config/environment';

interface DisputeModalProps {
  visible: boolean;
  orderId: string;
  onClose: () => void;
  onSuccess: () => void;
}

const REASON_OPTIONS = [
  { value: 'ITEM_NOT_AS_DESCRIBED', label: 'Sản phẩm không đúng mô tả' },
  { value: 'ITEM_DAMAGED', label: 'Sản phẩm bị hư hỏng' },
  { value: 'NOT_RECEIVED', label: 'Chưa nhận được hàng' },
  { value: 'OTHER', label: 'Lý do khác' },
];

export const DisputeModal: React.FC<DisputeModalProps> = ({ visible, orderId, onClose, onSuccess }) => {
  const [reason, setReason] = useState('ITEM_NOT_AS_DESCRIBED');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!description.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập mô tả chi tiết');
      return;
    }

    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('access_token');
      if (!token) {
        Alert.alert('Lỗi', 'Phiên đăng nhập đã hết hạn');
        return;
      }

      const response = await fetch(`${ENV.API_BASE_URL}/disputes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          orderId,
          reason,
          description,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert('Thành công', 'Tranh chấp đã được tạo thành công');
        onSuccess();
        onClose();
      } else {
        Alert.alert('Lỗi', data.message || 'Không thể tạo tranh chấp');
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Có lỗi xảy ra khi tạo tranh chấp');
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
            <Text style={styles.headerTitle}>Tạo tranh chấp</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Reason Selection */}
            <Text style={styles.label}>Lý do tranh chấp</Text>
            <View style={styles.reasonContainer}>
              {REASON_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[styles.reasonOption, reason === option.value && styles.reasonOptionActive]}
                  onPress={() => setReason(option.value)}
                >
                  <View
                    style={[styles.radio, reason === option.value && styles.radioActive]}
                  >
                    {reason === option.value && <View style={styles.radioDot} />}
                  </View>
                  <Text
                    style={[
                      styles.reasonText,
                      reason === option.value && styles.reasonTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Description */}
            <Text style={styles.label}>Mô tả chi tiết</Text>
            <TextInput
              style={styles.textArea}
              value={description}
              onChangeText={setDescription}
              placeholder="Vui lòng mô tả chi tiết vấn đề bạn gặp phải..."
              placeholderTextColor={COLORS.textLight}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />

            {/* Warning */}
            <View style={styles.warningBox}>
              <Text style={styles.warningText}>
                ⚠️ Tranh chấp sẽ được xem xét bởi admin. Vui lòng cung cấp thông tin chính xác và đầy đủ.
              </Text>
            </View>
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
                <Text style={styles.submitButtonText}>Gửi tranh chấp</Text>
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
  label: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  reasonContainer: {
    marginBottom: SPACING.lg,
  },
  reasonOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    marginBottom: SPACING.sm,
  },
  reasonOptionActive: {
    borderColor: COLORS.error,
    backgroundColor: `${COLORS.error}10`,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.border,
    marginRight: SPACING.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioActive: {
    borderColor: COLORS.error,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.error,
  },
  reasonText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  reasonTextActive: {
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.error,
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
  warningBox: {
    backgroundColor: `${COLORS.warning}15`,
    padding: SPACING.md,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.warning,
  },
  warningText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    lineHeight: 20,
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
    backgroundColor: COLORS.error,
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
