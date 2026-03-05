/**
 * VeloBike Login Screen
 * Email/Password + Google OAuth
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
import { Mail, Lock, Bike } from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import { COLORS, SPACING, RADIUS, FONT_SIZES, FONT_WEIGHTS, SHADOWS, ICON_SIZES } from '../../../config/theme';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { useAuthStore } from '../../viewmodels/AuthStore';

interface LoginScreenProps {
  onRegister: () => void;
  onForgotPassword: () => void;
  onLoginSuccess: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onRegister,
  onForgotPassword,
  onLoginSuccess,
}) => {
  const insets = useSafeAreaInsets();
  const { login, googleLogin, loadingState, error, clearError } = useAuthStore();

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Animations
  const logoAnim = useRef(new Animated.Value(0)).current;
  const formAnim = useRef(new Animated.Value(0)).current;
  const formSlideAnim = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(logoAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }),
      Animated.parallel([
        Animated.timing(formAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(formSlideAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [logoAnim, formAnim, formSlideAnim]);

  // Clear errors on input change
  useEffect(() => {
    if (error) clearError();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email, password]);

  const validate = useCallback((): boolean => {
    let valid = true;
    setEmailError('');
    setPasswordError('');

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

    if (!password) {
      setPasswordError('Vui lòng nhập mật khẩu');
      valid = false;
    } else if (password.length < 6) {
      setPasswordError('Mật khẩu phải có ít nhất 6 ký tự');
      valid = false;
    }

    return valid;
  }, [email, password]);

  const handleLogin = useCallback(async () => {
    if (!validate()) return;

    const success = await login({ email: email.trim(), password });
    if (success) {
      onLoginSuccess();
    }
  }, [email, password, login, validate, onLoginSuccess]);

  const handleGoogleLogin = useCallback(async () => {
    const success = await googleLogin();
    if (success) {
      onLoginSuccess();
    }
  }, [googleLogin, onLoginSuccess]);

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
            { paddingTop: insets.top + SPACING.xl, paddingBottom: insets.bottom + SPACING['2xl'] },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo / Header */}
          <Animated.View
            style={[
              styles.headerSection,
              {
                opacity: logoAnim,
                transform: [{
                  scale: logoAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.5, 1],
                  }),
                }],
              },
            ]}
          >
            <View style={styles.logoContainer}>
              <LinearGradient
                colors={[COLORS.primary, COLORS.primaryDark]}
                style={styles.logoCircle}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Bike size={36} color={COLORS.white} strokeWidth={1.5} />
              </LinearGradient>
            </View>
            <Text style={styles.appName}>VeloBike</Text>
            <Text style={styles.headerSubtitle}>Đăng nhập để tiếp tục</Text>
          </Animated.View>

          {/* Form Section */}
          <Animated.View
            style={[
              styles.formSection,
              {
                opacity: formAnim,
                transform: [{ translateY: formSlideAnim }],
              },
            ]}
          >
            {/* Server Error */}
            {error && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerText}>{error}</Text>
              </View>
            )}

            {/* Email Input */}
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

            {/* Password Input */}
            <Input
              label="Mật khẩu"
              placeholder="Nhập mật khẩu"
              value={password}
              onChangeText={setPassword}
              error={passwordError}
              isPassword
              leftIcon={<Lock size={ICON_SIZES.md} color={COLORS.textLight} />}
            />

            {/* Forgot Password */}
            <TouchableOpacity
              onPress={onForgotPassword}
              style={styles.forgotPassword}
            >
              <Text style={styles.forgotPasswordText}>Quên mật khẩu?</Text>
            </TouchableOpacity>

            {/* Login Button */}
            <Button
              title="Đăng nhập"
              onPress={handleLogin}
              loading={isLoading}
              size="lg"
              style={styles.loginButton}
            />

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>hoặc</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Google Login */}
            <TouchableOpacity
              style={styles.googleButton}
              onPress={handleGoogleLogin}
              disabled={isLoading}
              activeOpacity={0.7}
            >
              <Text style={styles.googleIcon}>G</Text>
              <Text style={styles.googleButtonText}>Tiếp tục với Google</Text>
            </TouchableOpacity>

            {/* Register Link */}
            <View style={styles.registerContainer}>
              <Text style={styles.registerText}>Chưa có tài khoản? </Text>
              <TouchableOpacity onPress={onRegister}>
                <Text style={styles.registerLink}>Đăng ký ngay</Text>
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

  // Header
  headerSection: {
    alignItems: 'center',
    marginBottom: SPACING['3xl'],
  },
  logoContainer: {
    marginBottom: SPACING.base,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.lg,
  },
  appName: {
    fontSize: FONT_SIZES['3xl'],
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  headerSubtitle: {
    fontSize: FONT_SIZES.base,
    fontWeight: FONT_WEIGHTS.regular,
    color: COLORS.textSecondary,
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
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: -SPACING.sm,
    marginBottom: SPACING.lg,
    paddingVertical: SPACING.xs,
  },
  forgotPasswordText: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.primary,
  },
  loginButton: {
    marginBottom: SPACING.xl,
  },

  // Divider
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    marginHorizontal: SPACING.base,
    fontSize: FONT_SIZES.md,
    color: COLORS.textLight,
  },

  // Google Button
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md + 2,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    gap: SPACING.md,
    marginBottom: SPACING['2xl'],
    ...SHADOWS.sm,
  },
  googleIcon: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: '#4285F4',
  },
  googleButtonText: {
    fontSize: FONT_SIZES.base,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.text,
  },

  // Register
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  registerLink: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.primary,
  },
});