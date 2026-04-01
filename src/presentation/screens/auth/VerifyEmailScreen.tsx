/**
 * VeloBike Verify Email Screen
 * OTP input + countdown timer + resend
 */
import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Animated,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Mail, RefreshCcw } from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import { COLORS, SPACING, RADIUS, FONT_SIZES, FONT_WEIGHTS, SHADOWS, ICON_SIZES } from '../../../config/theme';
import { OTPInput } from '../../components/common/OTPInput';
import { Button } from '../../components/common/Button';
import { useAuthStore } from '../../viewmodels/AuthStore';

const RESEND_COOLDOWN = 60; // seconds

interface VerifyEmailScreenProps {
  email: string;
  onVerifySuccess: () => void;
  onBack: () => void;
}

export const VerifyEmailScreen: React.FC<VerifyEmailScreenProps> = ({
  email,
  onVerifySuccess,
  onBack,
}) => {
  const insets = useSafeAreaInsets();
  const { verifyEmail, resendVerification, loadingState, error, clearError } = useAuthStore();

  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState(false);
  const [countdown, setCountdown] = useState(RESEND_COOLDOWN);
  const [resending, setResending] = useState(false);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const iconScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(iconScale, {
        toValue: 1,
        tension: 60,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [fadeAnim, slideAnim, iconScale]);

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  // Clear error on OTP change
  useEffect(() => {
    if (error) clearError();
    if (otpError) setOtpError(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otpCode]);

  const handleOTPComplete = useCallback(
    (code: string) => {
      setOtpCode(code);
    },
    [],
  );

  const handleVerify = useCallback(async () => {
    if (otpCode.length !== 6) {
      setOtpError(true);
      return;
    }

    const success = await verifyEmail(email, otpCode);
    if (success) {
      onVerifySuccess();
    } else {
      setOtpError(true);
    }
  }, [otpCode, email, verifyEmail, onVerifySuccess]);

  const handleResend = useCallback(async () => {
    if (countdown > 0 || resending) return;
    setResending(true);
    const success = await resendVerification(email);
    setResending(false);
    if (success) {
      setCountdown(RESEND_COOLDOWN);
      setOtpCode('');
    }
  }, [countdown, resending, email, resendVerification]);

  const isLoading = loadingState === 'loading';

  const maskedEmail = email.replace(
    /(.{2})(.*)(@.+)/,
    (_, a, b, c) => a + '*'.repeat(b.length) + c,
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View
          style={[
            styles.content,
            { paddingTop: insets.top + SPACING.sm, paddingBottom: insets.bottom + SPACING['2xl'] },
          ]}
        >
          {/* Back Button */}
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <ArrowLeft size={ICON_SIZES.base} color={COLORS.text} />
          </TouchableOpacity>

          {/* Icon */}
          <Animated.View style={[styles.iconContainer, { transform: [{ scale: iconScale }] }]}>
            <LinearGradient
              colors={[COLORS.primary, COLORS.primaryLight]}
              style={styles.iconCircle}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Mail size={36} color={COLORS.white} strokeWidth={1.5} />
            </LinearGradient>
          </Animated.View>

          {/* Title */}
          <Animated.View
            style={[
              styles.textSection,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            ]}
          >
            <Text style={styles.title}>Xác thực email</Text>
            <Text style={styles.subtitle}>
              Chúng tôi đã gửi mã xác thực 6 số đến
            </Text>
            <Text style={styles.emailText}>{maskedEmail}</Text>
          </Animated.View>

          {/* OTP Input */}
          <Animated.View
            style={[
              styles.otpSection,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            ]}
          >
            <OTPInput
              length={6}
              onComplete={handleOTPComplete}
              error={otpError}
            />

            {/* Server Error */}
            {error && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerText}>{error}</Text>
              </View>
            )}
          </Animated.View>

          {/* Verify Button */}
          <Animated.View
            style={[
              styles.actionSection,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            ]}
          >
            <Button
              title="Xác thực"
              onPress={handleVerify}
              loading={isLoading}
              disabled={otpCode.length !== 6}
              size="lg"
              style={styles.verifyButton}
            />

            {/* Resend */}
            <View style={styles.resendContainer}>
              <Text style={styles.resendText}>Không nhận được mã? </Text>
              {countdown > 0 ? (
                <Text style={styles.countdownText}>
                  Gửi lại sau {countdown}s
                </Text>
              ) : (
                <TouchableOpacity
                  onPress={handleResend}
                  disabled={resending}
                  style={styles.resendButton}
                >
                  <RefreshCcw
                    size={14}
                    color={COLORS.primary}
                    style={resending ? styles.spinning : undefined}
                  />
                  <Text style={styles.resendLink}>
                    {resending ? 'Đang gửi...' : 'Gửi lại'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </Animated.View>

          {/* Footer hint */}
          <View style={styles.footerHint}>
            <Text style={styles.footerHintText}>
              Vui lòng kiểm tra hộp thư rác nếu bạn không thấy email trong hộp thư đến.
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

// =============================================================================
// STYLES
// =============================================================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  flex: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.xl,
  },

  // Back
  backButton: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },

  // Icon
  iconContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.lg,
  },

  // Text
  textSection: {
    alignItems: 'center',
    marginBottom: SPACING['2xl'],
  },
  title: {
    fontSize: FONT_SIZES['2xl'],
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: FONT_SIZES.base,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: FONT_SIZES.base * 1.5,
  },
  emailText: {
    fontSize: FONT_SIZES.base,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.primary,
    marginTop: SPACING.xs,
  },

  // OTP
  otpSection: {
    marginBottom: SPACING.xl,
  },

  // Server error
  errorBanner: {
    backgroundColor: COLORS.errorLight,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.base,
    marginTop: SPACING.base,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.error,
  },
  errorBannerText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.error,
    fontWeight: FONT_WEIGHTS.medium,
    textAlign: 'center',
  },

  // Actions
  actionSection: {
    width: '100%',
    alignItems: 'center',
    marginHorizontal: -SPACING.xl,
    paddingHorizontal: SPACING.xl,
  },
  verifyButton: {
    width: '100%',
    marginBottom: SPACING.xl,
  },

  // Resend
  resendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resendText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  countdownText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textLight,
    fontWeight: FONT_WEIGHTS.medium,
  },
  resendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  resendLink: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.primary,
  },
  spinning: {
    opacity: 0.5,
  },

  // Footer
  footerHint: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: SPACING.lg,
  },
  footerHintText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textLight,
    textAlign: 'center',
    lineHeight: FONT_SIZES.sm * 1.6,
  },
});

export default VerifyEmailScreen;
