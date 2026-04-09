/**
 * Upload Button Component
 * Convenient UI component for triggering uploads
 */

import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Text,
  ActivityIndicator,
  ViewStyle,
} from 'react-native';
import { Camera, Image as ImageIcon } from 'lucide-react-native';
import { COLORS, SPACING, FONT_SIZES, RADIUS } from '../../config/theme';
import useUpload from '../hooks/useUpload';

interface UploadButtonProps {
  onUpload?: (urls: string | string[] | null) => void;
  onError?: (error: Error) => void;
  multiple?: boolean;
  pickFromCamera?: boolean;
  maxFiles?: number;
  disabled?: boolean;
  style?: ViewStyle;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'outline';
  label?: string;
  showIcon?: boolean;
  loading?: boolean;
}

export const UploadButton: React.FC<UploadButtonProps> = ({
  onUpload,
  onError,
  multiple = false,
  pickFromCamera = false,
  maxFiles = 10,
  disabled = false,
  style,
  size = 'md',
  variant = 'primary',
  label = pickFromCamera ? 'Chụp ảnh' : 'Chọn ảnh',
  showIcon = true,
  loading: externalLoading,
}) => {
  const [internalLoading, setInternalLoading] = useState(false);
  const loading = externalLoading ?? internalLoading;

  const { pickAndUpload, pickAndUploadFromCamera, uploading } = useUpload({
    maxFiles,
    onError: (error) => {
      setInternalLoading(false);
      onError?.(error);
    },
  });

  const handlePress = async () => {
    if (disabled || loading || uploading) return;

    setInternalLoading(true);

    try {
      let result;

      if (pickFromCamera) {
        result = await pickAndUploadFromCamera();
      } else {
        result = await pickAndUpload(multiple);
      }

      setInternalLoading(false);
      onUpload?.(result);
    } catch (error) {
      setInternalLoading(false);
      console.error('Upload error:', error);
      onError?.(error instanceof Error ? error : new Error('Unknown error'));
    }
  };

  // Size styles
  const sizeStyles = {
    sm: { padding: SPACING.xs, iconSize: 16 },
    md: { padding: SPACING.sm, iconSize: 20 },
    lg: { padding: SPACING.md, iconSize: 24 },
  };

  // Variant styles
  const variantStyles = {
    primary: {
      bg: COLORS.primary,
      text: COLORS.textOnPrimary,
      border: COLORS.primary,
    },
    secondary: {
      bg: COLORS.surface,
      text: COLORS.primary,
      border: COLORS.surface,
    },
    outline: {
      bg: 'transparent',
      text: COLORS.primary,
      border: COLORS.primary,
    },
  };

  const currentSizeStyle = sizeStyles[size];
  const currentVariantStyle = variantStyles[variant];

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor: currentVariantStyle.bg,
          borderColor: currentVariantStyle.border,
          paddingVertical: currentSizeStyle.padding,
          paddingHorizontal: currentSizeStyle.padding,
          opacity: disabled || uploading ? 0.6 : 1,
        },
        style,
      ]}
      onPress={handlePress}
      disabled={disabled || uploading || loading}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        {loading || uploading ? (
          <ActivityIndicator size="small" color={currentVariantStyle.text} />
        ) : showIcon ? (
          pickFromCamera ? (
            <Camera
              size={currentSizeStyle.iconSize}
              color={currentVariantStyle.text}
              style={styles.icon}
            />
          ) : (
            <ImageIcon
              size={currentSizeStyle.iconSize}
              color={currentVariantStyle.text}
              style={styles.icon}
            />
          )
        ) : null}

        <Text
          style={[
            styles.label,
            {
              color: currentVariantStyle.text,
              fontSize: size === 'sm' ? FONT_SIZES.xs : size === 'lg' ? FONT_SIZES.md : FONT_SIZES.sm,
            },
          ]}
        >
          {loading || uploading ? 'Uploading...' : label}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

interface ImagePickerButtonProps {
  onPickComplete?: (urls: string | string[] | null) => void;
  onError?: (error: Error) => void;
  multiple?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  label?: string;
}

/**
 * Quick picker button without uploading
 */
export const ImagePickerButton: React.FC<ImagePickerButtonProps> = ({
  onPickComplete,
  onError,
  multiple = false,
  disabled = false,
  style,
  label = 'Chọn ảnh',
}) => {
  const [loading, setLoading] = useState(false);
  const { pickAndUpload } = useUpload({ onError });

  const handlePress = async () => {
    if (disabled || loading) return;

    setLoading(true);

    try {
      // Note: This uses the upload hook, if you want just picker without upload,
      // use useImagePicker directly
      const result = await pickAndUpload(multiple);
      setLoading(false);
      onPickComplete?.(result);
    } catch (error) {
      setLoading(false);
      console.error('Pick error:', error);
      onError?.(error instanceof Error ? error : new Error('Unknown error'));
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor: COLORS.primary,
          opacity: disabled || loading ? 0.6 : 1,
        },
        style,
      ]}
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator size="small" color={COLORS.textOnPrimary} />
        ) : (
          <ImageIcon size={20} color={COLORS.textOnPrimary} style={styles.icon} />
        )}

        <Text style={[styles.label, { color: COLORS.textOnPrimary }]}> 
          {loading ? 'Chọn...' : label}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

/**
 * Compact upload button designed to be used inline
 */
export const CompactUploadButton: React.FC<Omit<UploadButtonProps, 'size'>> = (props) => {
  return <UploadButton {...props} size="sm" variant="outline" showIcon />;
};

/**
 * Large upload button for primary actions
 */
export const LargeUploadButton: React.FC<Omit<UploadButtonProps, 'size'>> = (props) => {
  return <UploadButton {...props} size="lg" variant="primary" />;
};

const styles = StyleSheet.create({
  button: {
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 44,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  icon: {
    marginRight: 4,
  },
  label: {
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default UploadButton;
