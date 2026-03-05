/**
 * VeloBike Register Screen
 * Email + Password + Full Name registration
 */
import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Animated,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Mail, Lock, User, ArrowLeft, Bike, CheckCircle } from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import { COLORS, SPACING, RADIUS, FONT_SIZES, FONT_WEIGHTS, SHADOWS, ICON_SIZES } from '../../../config/theme';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { useAuthStore } from '../../viewmodels/AuthStore';

interface RegisterScreenProps {
  onLogin: () => void;
  onBack: () => void;
  onRegisterSuccess: (email: string) => void;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({
  onLogin,
  onBack,
  onRegisterSuccess,
}) => {
  const insets = useSafeAreaInsets();
  const { register, loadingState, error, clearError } = useAuthStore();

  // Form state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Field errors
  const [fullNameError, setFullNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  // Password strength
  const [passwordStrength, setPasswordStrength] = useState(0);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  // Clear server error on input change
  useEffect(() => {
    if (error) clearError();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fullName, email, password, confirmPassword]);

  // Calculate password strength
  useEffect(() => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    setPasswordStrength(strength);
  }, [password]);

  const getStrengthColor = () => {
    if (passwordStrength <= 1) return COLORS.error;
    if (passwordStrength <= 2) return COLORS.warning;
    if (passwordStrength <= 3) return COLORS.accent;
    return COLORS.success;
  };

  const getStrengthText = () => {
    if (!password) return '';
    if (passwordStrength <= 1) return 'Yếu';
    if (passwordStrength <= 2) return 'Trung bình';
    if (passwordStrength <= 3) return 'Khá';
    return 'Mạnh';
  };

  const validate = useCallback((): boolean => {
    let valid = true;
    setFullNameError('');
    setEmailError('');
    setPasswordError('');
    setConfirmPasswordError('');

    // Full name validation
    if (!fullName.trim()) {
      setFullNameError('Vui lòng nhập họ tên');
      valid = false;
    } else if (fullName.trim().length < 2) {
      setFullNameError('Họ tên phải có ít nhất 2 ký tự');
      valid = false;
    }

    // Email validation
    if (!email.trim()) {
      setEmailError('Vui lòng nhập email');
      valid = false;
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setEmailError('Email không đúng định dạng');
        valid = false;
      }
    }

    // Password validation
    if (!password) {
      setPasswordError('Vui lòng nhập mật khẩu');
      valid = false;
    } else if (password.length < 8) {
      setPasswordError('Mật khẩu phải có ít nhất 8 ký tự');
      valid = false;
    } else if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password)) {
      setPasswordError('Mật khẩu phải có chữ hoa, chữ thường và số');
      valid = false;
    }

    // Confirm password
    if (!confirmPassword) {
      setConfirmPasswordError('Vui lòng xác nhận mật khẩu');
      valid = false;
    } else if (confirmPassword !== password) {
      setConfirmPasswordError('Mật khẩu xác nhận không khớp');
      valid = false;
    }

    return valid;
  }, [fullName, email, password, confirmPassword]);

  const handleRegister = useCallback(async () => {
    if (!validate()) return;

    const success = await register({
      fullName: fullName.trim(),
      email: email.trim(),
      password,
    });

    if (success) {
      onRegisterSuccess(email.trim());
    }
  }, [fullName, email, password, register, validate, onRegisterSuccess]);

  const isLoading = loadingState === 'loading';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + SPACING.sm, paddingBottom: insets.bottom + SPACING['2xl'] },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Back Button */}
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <ArrowLeft size={ICON_SIZES.base} color={COLORS.text} />
          </TouchableOpacity>

          {/* Header */}
          <Animated.View
            style={[
              styles.headerSection,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            ]}
          >
            <View style={styles.logoSmall}>
              <LinearGradient
                colors={[COLORS.primary, COLORS.primaryDark]}
                style={styles.logoSmallCircle}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Bike size={24} color={COLORS.white} strokeWidth={1.5} />
              </LinearGradient>
            </View>
            <Text style={styles.title}>Tạo tài khoản</Text>
            <Text style={styles.subtitle}>
              Đăng ký để bắt đầu khám phá thế giới xe đạp
            </Text>
          </Animated.View>

          {/* Form Section */}
          <Animated.View
            style={[
              styles.formSection,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            ]}
          >
            {/* Server Error */}
            {error && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerText}>{error}</Text>
              </View>
            )}

            {/* Full Name */}
            <Input
              label="Họ và tên"
              placeholder="Nguyễn Văn A"
              value={fullName}
              onChangeText={setFullName}
              error={fullNameError}
              autoCapitalize="words"
              leftIcon={<User size={ICON_SIZES.md} color={COLORS.textLight} />}
            />

            {/* Email */}
            <Input
              label="Email"
              placeholder="email@example.com"
              value={email}
              onChangeText={setEmail}
              error={emailError}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              leftIcon={<Mail size={ICON_SIZES.md} color={COLORS.textLight} />}
            />

            {/* Password */}
            <Input
              label="Mật khẩu"
              placeholder="Tối thiểu 8 ký tự"
              value={password}
              onChangeText={setPassword}
              error={passwordError}
              isPassword
              leftIcon={<Lock size={ICON_SIZES.md} color={COLORS.textLight} />}
            />

            {/* Password Strength Indicator */}
            {password.length > 0 && (
              <View style={styles.strengthContainer}>
                <View style={styles.strengthBars}>
                  {[1, 2, 3, 4, 5].map((level) => (
                    <View
                      key={level}
                      style={[
                        styles.strengthBar,
                        {
                          backgroundColor:
                            level <= passwordStrength
                              ? getStrengthColor()
                              : COLORS.border,
                        },
                      ]}
                    />
                  ))}
                </View>
                <Text style={[styles.strengthText, { color: getStrengthColor() }]}>
                  {getStrengthText()}
                </Text>
              </View>
            )}

            {/* Confirm Password */}
            <Input
              label="Xác nhận mật khẩu"
              placeholder="Nhập lại mật khẩu"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              error={confirmPasswordError}
              isPassword
              leftIcon={<Lock size={ICON_SIZES.md} color={COLORS.textLight} />}
              rightIcon={
                confirmPassword && confirmPassword === password ? (
                  <CheckCircle size={ICON_SIZES.md} color={COLORS.success} />
                ) : undefined
              }
            />

            {/* Terms notice */}
            <Text style={styles.termsText}>
              Bằng việc đăng ký, bạn đồng ý với{' '}
              <Text style={styles.termsLink}>Điều khoản sử dụng</Text> và{' '}
              <Text style={styles.termsLink}>Chính sách bảo mật</Text> của VeloBike.
            </Text>

            {/* Register Button */}
            <Button
              title="Đăng ký"
              onPress={handleRegister}
              loading={isLoading}
              size="lg"
              style={styles.registerButton}
            />

            {/* Login Link */}
            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Đã có tài khoản? </Text>
              <TouchableOpacity onPress={onLogin}>
                <Text style={styles.loginLink}>Đăng nhập</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
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
  scrollContent: {
    flexGrow: 1,
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
    marginBottom: SPACING.lg,
  },

  // Header
  headerSection: {
    marginBottom: SPACING.xl,
  },
  logoSmall: {
    marginBottom: SPACING.md,
  },
  logoSmallCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.md,
  },
  title: {
    fontSize: FONT_SIZES['2xl'],
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: FONT_SIZES.base,
    fontWeight: FONT_WEIGHTS.regular,
    color: COLORS.textSecondary,
    lineHeight: FONT_SIZES.base * 1.5,
  },

  // Form
  formSection: {
    flex: 1,
  },
  errorBanner: {
    backgroundColor: COLORS.errorLight,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.base,
    marginBottom: SPACING.base,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.error,
  },
  errorBannerText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.error,
    fontWeight: FONT_WEIGHTS.medium,
  },

  // Password strength
  strengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: -SPACING.sm,
    marginBottom: SPACING.base,
    gap: SPACING.sm,
  },
  strengthBars: {
    flexDirection: 'row',
    gap: 3,
    flex: 1,
  },
  strengthBar: {
    flex: 1,
    height: 3,
    borderRadius: 2,
  },
  strengthText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.semibold,
    minWidth: 60,
    textAlign: 'right',
  },

  // Terms
  termsText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textLight,
    lineHeight: FONT_SIZES.sm * 1.6,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  termsLink: {
    color: COLORS.primary,
    fontWeight: FONT_WEIGHTS.medium,
  },

  registerButton: {
    marginBottom: SPACING.xl,
  },

  // Login
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  loginLink: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.primary,
  },
});

export default RegisterScreen;
