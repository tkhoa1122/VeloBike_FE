/**
 * VeloBike Forgot Password Screen
 * Email input → send reset code
 */
import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  StatusBar,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Mail, CheckCircle } from 'lucide-react-native';
import {
  COLORS,
  SPACING,
  RADIUS,
  FONT_SIZES,
  FONT_WEIGHTS,
  ANIMATION,
} from '../../../config/theme';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { useAuthStore } from '../../viewmodels/AuthStore';

interface ForgotPasswordScreenProps {
  onBack?: () => void;
  onResetSent?: () => void;
}

export const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({ onBack, onResetSent }) => {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const successScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const validateEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  const handleSubmit = useCallback(async () => {
    Keyboard.dismiss();
    setError('');

    if (!email.trim()) {
      setError('Vui lòng nhập email');
      return;
    }
    if (!validateEmail(email)) {
      setError('Email không hợp lệ');
      return;
    }

    setLoading(true);
    try {
      const { forgotPassword } = useAuthStore.getState();
      await forgotPassword(email);
      setLoading(false);
      setSent(true);
      Animated.spring(successScale, {
        toValue: 1,
        tension: 50,
        friction: 6,
        useNativeDriver: true,
      }).start();
    } catch (err) {
      setLoading(false);
      setError('Không thể gửi yêu cầu. Vui lòng thử lại.');
    }
  }, [email, successScale]);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <ArrowLeft size={22} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          {!sent ? (
            <>
              {/* Icon */}
              <View style={styles.iconCircle}>
                <Mail size={32} color={COLORS.primary} />
              </View>

              <Text style={styles.title}>Quên mật khẩu?</Text>
              <Text style={styles.subtitle}>
                Nhập email đăng ký của bạn. Chúng tôi sẽ gửi hướng dẫn đặt lại mật khẩu.
              </Text>

              <View style={styles.form}>
                <Input
                  label="Email"
                  value={email}
                  onChangeText={(t) => { setEmail(t); setError(''); }}
                  placeholder="email@example.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  error={error}
                />
                <Button title="Gửi yêu cầu" onPress={handleSubmit} loading={loading} style={styles.submitBtn} />
              </View>
            </>
          ) : (
            /* Success state */
            <Animated.View style={[styles.successWrap, { transform: [{ scale: successScale }] }]}>
              <View style={styles.successIcon}>
                <CheckCircle size={48} color={COLORS.success} />
              </View>
              <Text style={styles.successTitle}>Đã gửi email!</Text>
              <Text style={styles.successSub}>
                Chúng tôi đã gửi hướng dẫn đặt lại mật khẩu đến{'\n'}
                <Text style={styles.emailHighlight}>{email}</Text>
              </Text>
              <Text style={styles.successHint}>
                Vui lòng kiểm tra hộp thư đến (và thư mục spam).
              </Text>
              <Button title="Quay lại đăng nhập" onPress={() => onBack?.()} variant="secondary" style={styles.backLoginBtn} />
              <TouchableOpacity onPress={() => { setSent(false); handleSubmit(); }}>
                <Text style={styles.resendText}>Gửi lại email</Text>
              </TouchableOpacity>
            </Animated.View>
          )}
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  flex: { flex: 1 },
  header: { paddingHorizontal: SPACING.base, paddingVertical: SPACING.sm },
  backBtn: { padding: 4, alignSelf: 'flex-start' },
  content: { flex: 1, paddingHorizontal: SPACING.xl, justifyContent: 'center' },
  iconCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: COLORS.primarySurface, justifyContent: 'center', alignItems: 'center', alignSelf: 'center', marginBottom: SPACING.xl },
  title: { fontSize: FONT_SIZES['2xl'], fontWeight: FONT_WEIGHTS.bold, color: COLORS.text, textAlign: 'center' },
  subtitle: { fontSize: FONT_SIZES.base, color: COLORS.textSecondary, textAlign: 'center', lineHeight: FONT_SIZES.base * 1.6, marginTop: SPACING.md, marginBottom: SPACING['2xl'] },
  form: { gap: SPACING.md },
  submitBtn: { marginTop: SPACING.md },
  successWrap: { alignItems: 'center', paddingHorizontal: SPACING.xl },
  successIcon: { marginBottom: SPACING.xl },
  successTitle: { fontSize: FONT_SIZES['2xl'], fontWeight: FONT_WEIGHTS.bold, color: COLORS.text },
  successSub: { fontSize: FONT_SIZES.base, color: COLORS.textSecondary, textAlign: 'center', lineHeight: FONT_SIZES.base * 1.6, marginTop: SPACING.md },
  emailHighlight: { fontWeight: FONT_WEIGHTS.semibold, color: COLORS.primary },
  successHint: { fontSize: FONT_SIZES.md, color: COLORS.textLight, textAlign: 'center', marginTop: SPACING.md },
  backLoginBtn: { marginTop: SPACING['2xl'], alignSelf: 'stretch' },
  resendText: { fontSize: FONT_SIZES.md, fontWeight: FONT_WEIGHTS.semibold, color: COLORS.primary, marginTop: SPACING.lg },
});

export default ForgotPasswordScreen;
