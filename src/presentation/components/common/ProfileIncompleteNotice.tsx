/**
 * Profile Incomplete Notice Component
 * Shows a banner when user profile is not complete
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { AlertCircle, ArrowRight } from 'lucide-react-native';
import { COLORS, SPACING, RADIUS, FONT_SIZES, FONT_WEIGHTS } from '../../config/theme';

interface ProfileIncompleteNoticeProps {
  missingFields: string[];
  onPress?: () => void;
}

export const ProfileIncompleteNotice: React.FC<ProfileIncompleteNoticeProps> = ({
  missingFields,
  onPress,
}) => {
  if (missingFields.length === 0) return null;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        <AlertCircle size={20} color={COLORS.warning} />
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>Hồ sơ chưa đầy đủ</Text>
        <Text style={styles.message}>
          Vui lòng cập nhật: {missingFields.join(', ')}
        </Text>
      </View>
      <ArrowRight size={20} color={COLORS.warning} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.warningLight || '#FFF3CD',
    borderLeftWidth: 4,
    borderLeftColor: COLORS.warning,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginHorizontal: SPACING.xl,
    marginVertical: SPACING.md,
    gap: SPACING.sm,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.warning,
    marginBottom: 2,
  },
  message: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    lineHeight: FONT_SIZES.sm * 1.4,
  },
});

export default ProfileIncompleteNotice;
