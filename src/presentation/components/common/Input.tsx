/**
 * VeloBike Input Component
 * Supports text, email, password with show/hide toggle
 */
import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { COLORS, SPACING, RADIUS, FONT_SIZES, FONT_WEIGHTS, ANIMATION, ICON_SIZES } from '../../../config/theme';

interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
  isPassword?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  containerStyle,
  isPassword = false,
  onFocus,
  onBlur,
  ...textInputProps
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const borderAnim = useRef(new Animated.Value(0)).current;

  const handleFocus = useCallback((e: any) => {
    setIsFocused(true);
    Animated.timing(borderAnim, {
      toValue: 1,
      duration: ANIMATION.fast,
      useNativeDriver: false,
    }).start();
    onFocus?.(e);
  }, [borderAnim, onFocus]);

  const handleBlur = useCallback((e: any) => {
    setIsFocused(false);
    Animated.timing(borderAnim, {
      toValue: 0,
      duration: ANIMATION.fast,
      useNativeDriver: false,
    }).start();
    onBlur?.(e);
  }, [borderAnim, onBlur]);

  const borderColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [
      error ? COLORS.error : COLORS.border,
      error ? COLORS.error : COLORS.primary,
    ],
  });

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <Animated.View
        style={[
          styles.inputContainer,
          { borderColor },
          error && styles.inputError,
        ]}
      >
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
        
        <TextInput
          style={[
            styles.input,
            leftIcon ? styles.inputWithLeftIcon : null,
            (isPassword || rightIcon) ? styles.inputWithRightIcon : null,
          ]}
          placeholderTextColor={COLORS.textLight}
          secureTextEntry={isPassword && !showPassword}
          onFocus={handleFocus}
          onBlur={handleBlur}
          selectionColor={COLORS.primary}
          {...textInputProps}
        />
        
        {isPassword && (
          <TouchableOpacity
            style={styles.rightIcon}
            onPress={() => setShowPassword(!showPassword)}
            hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
          >
            {showPassword ? (
              <EyeOff size={ICON_SIZES.md} color={COLORS.textLight} />
            ) : (
              <Eye size={ICON_SIZES.md} color={COLORS.textLight} />
            )}
          </TouchableOpacity>
        )}
        
        {rightIcon && !isPassword && (
          <View style={styles.rightIcon}>{rightIcon}</View>
        )}
      </Animated.View>
      
      {error && <Text style={styles.errorText}>{error}</Text>}
      {hint && !error && <Text style={styles.hintText}>{hint}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.base,
  },
  label: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  },
  inputError: {
    borderColor: COLORS.error,
    backgroundColor: COLORS.errorLight,
  },
  input: {
    flex: 1,
    paddingVertical: SPACING.md + 2,
    paddingHorizontal: SPACING.base,
    fontSize: FONT_SIZES.base,
    fontWeight: FONT_WEIGHTS.regular,
    color: COLORS.text,
  },
  inputWithLeftIcon: {
    paddingLeft: 0,
  },
  inputWithRightIcon: {
    paddingRight: 0,
  },
  leftIcon: {
    paddingLeft: SPACING.base,
    paddingRight: SPACING.sm,
  },
  rightIcon: {
    paddingRight: SPACING.base,
    paddingLeft: SPACING.sm,
  },
  errorText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.error,
    marginTop: SPACING.xs,
    marginLeft: SPACING.xs,
  },
  hintText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textLight,
    marginTop: SPACING.xs,
    marginLeft: SPACING.xs,
  },
});

export default Input;
