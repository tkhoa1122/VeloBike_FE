/**
 * VeloBike OTP Input Component
 * 6-digit code input with auto-focus and paste support
 */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Animated,
  Keyboard,
} from 'react-native';
import { COLORS, SPACING, RADIUS, FONT_SIZES, FONT_WEIGHTS, ANIMATION } from '../../../config/theme';

interface OTPInputProps {
  length?: number;
  onComplete: (code: string) => void;
  onChange?: (code: string) => void;
  error?: boolean;
  autoFocus?: boolean;
}

export const OTPInput: React.FC<OTPInputProps> = ({
  length = 6,
  onComplete,
  onChange,
  error = false,
  autoFocus = true,
}) => {
  const [code, setCode] = useState<string[]>(Array(length).fill(''));
  const inputRefs = useRef<(TextInput | null)[]>(Array(length).fill(null));
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnims = useRef(Array(length).fill(null).map(() => new Animated.Value(1))).current;

  useEffect(() => {
    if (error) {
      // Shake animation on error
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
      ]).start();
    }
  }, [error, shakeAnim]);

  const animateCell = useCallback((index: number) => {
    Animated.sequence([
      Animated.timing(scaleAnims[index], {
        toValue: 1.1,
        duration: ANIMATION.fast,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnims[index], {
        toValue: 1,
        duration: ANIMATION.fast,
        useNativeDriver: true,
      }),
    ]).start();
  }, [scaleAnims]);

  const handleChange = useCallback((text: string, index: number) => {
    // Handle paste (multi-char input)
    if (text.length > 1) {
      const chars = text.replace(/[^0-9]/g, '').split('').slice(0, length);
      const newCode = [...code];
      chars.forEach((char, i) => {
        if (index + i < length) {
          newCode[index + i] = char;
          animateCell(index + i);
        }
      });
      setCode(newCode);
      onChange?.(newCode.join(''));

      const nextIndex = Math.min(index + chars.length, length - 1);
      inputRefs.current[nextIndex]?.focus();

      if (newCode.every(c => c !== '')) {
        onComplete(newCode.join(''));
        Keyboard.dismiss();
      }
      return;
    }

    const digit = text.replace(/[^0-9]/g, '');
    const newCode = [...code];
    newCode[index] = digit;
    setCode(newCode);
    onChange?.(newCode.join(''));
    animateCell(index);

    if (digit && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    if (newCode.every(c => c !== '')) {
      onComplete(newCode.join(''));
      Keyboard.dismiss();
    }
  }, [code, length, onComplete, onChange, animateCell]);

  const handleKeyPress = useCallback((key: string, index: number) => {
    if (key === 'Backspace') {
      if (code[index] === '' && index > 0) {
        const newCode = [...code];
        newCode[index - 1] = '';
        setCode(newCode);
        onChange?.(newCode.join(''));
        inputRefs.current[index - 1]?.focus();
      } else {
        const newCode = [...code];
        newCode[index] = '';
        setCode(newCode);
        onChange?.(newCode.join(''));
      }
    }
  }, [code, onChange]);

  return (
    <Animated.View style={[styles.container, { transform: [{ translateX: shakeAnim }] }]}>
      {Array(length).fill(null).map((_, index) => (
        <Animated.View
          key={index}
          style={[
            styles.cellWrapper,
            { transform: [{ scale: scaleAnims[index] }] },
          ]}
        >
          <TextInput
            ref={ref => { inputRefs.current[index] = ref; }}
            style={[
              styles.cell,
              code[index] !== '' && styles.cellFilled,
              error && styles.cellError,
            ]}
            value={code[index]}
            onChangeText={(text) => handleChange(text, index)}
            onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
            keyboardType="number-pad"
            maxLength={length} // allow paste
            textContentType="oneTimeCode"
            autoFocus={autoFocus && index === 0}
            selectionColor={COLORS.primary}
            caretHidden
          />
        </Animated.View>
      ))}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.sm + 2,
  },
  cellWrapper: {},
  cell: {
    width: 48,
    height: 56,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    textAlign: 'center',
    fontSize: FONT_SIZES['2xl'],
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
  },
  cellFilled: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primarySurface,
  },
  cellError: {
    borderColor: COLORS.error,
    backgroundColor: COLORS.errorLight,
  },
});

export default OTPInput;
