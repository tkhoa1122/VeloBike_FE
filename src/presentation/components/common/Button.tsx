/**
 * VeloBike Button Component
 * Variants: primary (green), secondary (outline), accent (gold), ghost, danger
 */
import React, { useRef } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  Animated,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { COLORS, SPACING, RADIUS, FONT_SIZES, FONT_WEIGHTS, ANIMATION, SHADOWS } from '../../../config/theme';

type ButtonVariant = 'primary' | 'secondary' | 'accent' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  fullWidth = true,
  style,
  textStyle,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
      tension: ANIMATION.spring.tension,
      friction: ANIMATION.spring.friction,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: ANIMATION.spring.tension,
      friction: ANIMATION.spring.friction,
    }).start();
  };

  const isDisabled = disabled || loading;

  const containerStyles = [
    styles.base,
    styles[`${variant}Container`],
    styles[`${size}Container`],
    fullWidth && styles.fullWidth,
    isDisabled && styles.disabled,
    style,
  ];

  const textStyles = [
    styles.baseText,
    styles[`${variant}Text`],
    styles[`${size}Text`],
    isDisabled && styles.disabledText,
    textStyle,
  ];

  const loaderColor = variant === 'primary' || variant === 'danger'
    ? COLORS.white
    : variant === 'accent'
      ? COLORS.textOnAccent
      : COLORS.primary;

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={containerStyles}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isDisabled}
        activeOpacity={0.8}
      >
        {loading ? (
          <ActivityIndicator size="small" color={loaderColor} />
        ) : (
          <>
            {icon && iconPosition === 'left' && (
              <>{icon}</>
            )}
            <Text style={textStyles}>{title}</Text>
            {icon && iconPosition === 'right' && (
              <>{icon}</>
            )}
          </>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    borderRadius: RADIUS.md,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },

  // Variants - Container
  primaryContainer: {
    backgroundColor: COLORS.primary,
    ...SHADOWS.md,
  },
  secondaryContainer: {
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  accentContainer: {
    backgroundColor: COLORS.accent,
    ...SHADOWS.md,
  },
  ghostContainer: {
    backgroundColor: COLORS.transparent,
  },
  dangerContainer: {
    backgroundColor: COLORS.error,
    ...SHADOWS.md,
  },

  // Variants - Text
  baseText: {
    fontWeight: FONT_WEIGHTS.semibold,
  },
  primaryText: {
    color: COLORS.textOnPrimary,
  },
  secondaryText: {
    color: COLORS.primary,
  },
  accentText: {
    color: COLORS.textOnAccent,
  },
  ghostText: {
    color: COLORS.primary,
  },
  dangerText: {
    color: COLORS.white,
  },
  disabledText: {
    opacity: 0.7,
  },

  // Sizes - Container
  smContainer: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.base,
    borderRadius: RADIUS.sm,
  },
  mdContainer: {
    paddingVertical: SPACING.md + 2,
    paddingHorizontal: SPACING.xl,
    borderRadius: RADIUS.md,
  },
  lgContainer: {
    paddingVertical: SPACING.base,
    paddingHorizontal: SPACING['2xl'],
    borderRadius: RADIUS.lg,
  },

  // Sizes - Text
  smText: {
    fontSize: FONT_SIZES.md,
  },
  mdText: {
    fontSize: FONT_SIZES.base,
  },
  lgText: {
    fontSize: FONT_SIZES.lg,
  },
});

export default Button;
