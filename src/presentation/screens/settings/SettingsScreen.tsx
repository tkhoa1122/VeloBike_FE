/**
 * VeloBike Settings Screen
 * App settings, notifications, language, theme, etc.
 */
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Animated,
  StatusBar,
  Alert,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  ChevronRight,
  Bell,
  Globe,
  Moon,
  Lock,
  Trash2,
  Info,
  Mail,
  MapPin,
  CreditCard,
  Shield,
  Smartphone,
} from 'lucide-react-native';
import {
  COLORS,
  SPACING,
  RADIUS,
  FONT_SIZES,
  FONT_WEIGHTS,
  SHADOWS,
} from '../../../config/theme';

interface SettingsScreenProps {
  onBack?: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ onBack }) => {
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [pushNotifs, setPushNotifs] = useState(true);
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [priceAlerts, setPriceAlerts] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [biometric, setBiometric] = useState(false);

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, [fadeAnim]);

  const handleDeleteAccount = () => {
    Alert.alert(
      'Xóa tài khoản',
      'Bạn có chắc muốn xóa tài khoản? Hành động này không thể hoàn tác. Tất cả dữ liệu của bạn sẽ bị xóa vĩnh viễn.',
      [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Xóa tài khoản', style: 'destructive', onPress: () => {} },
      ],
    );
  };

  const sections = [
    {
      title: 'Thông báo',
      items: [
        { icon: Bell, label: 'Thông báo đẩy', type: 'switch' as const, value: pushNotifs, onToggle: setPushNotifs },
        { icon: Mail, label: 'Thông báo email', type: 'switch' as const, value: emailNotifs, onToggle: setEmailNotifs },
        { icon: CreditCard, label: 'Cảnh báo giá', type: 'switch' as const, value: priceAlerts, onToggle: setPriceAlerts, description: 'Nhận thông báo khi xe yêu thích giảm giá' },
      ],
    },
    {
      title: 'Giao diện',
      items: [
        { icon: Moon, label: 'Chế độ tối', type: 'switch' as const, value: darkMode, onToggle: setDarkMode },
        { icon: Globe, label: 'Ngôn ngữ', type: 'link' as const, value: 'Tiếng Việt' },
      ],
    },
    {
      title: 'Bảo mật',
      items: [
        { icon: Lock, label: 'Đổi mật khẩu', type: 'link' as const },
        { icon: Smartphone, label: 'Xác thực sinh trắc học', type: 'switch' as const, value: biometric, onToggle: setBiometric },
        { icon: Shield, label: 'Xác minh hai bước', type: 'link' as const },
      ],
    },
    {
      title: 'Địa chỉ & Thanh toán',
      items: [
        { icon: MapPin, label: 'Địa chỉ đã lưu', type: 'link' as const },
        { icon: CreditCard, label: 'Phương thức thanh toán', type: 'link' as const },
      ],
    },
    {
      title: 'Khác',
      items: [
        { icon: Info, label: 'Về VeloBike', type: 'link' as const, value: 'v1.0.0' },
        { icon: Trash2, label: 'Xóa tài khoản', type: 'danger' as const, onPress: handleDeleteAccount },
      ],
    },
  ];

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <ArrowLeft size={22} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cài đặt</Text>
        <View style={{ width: 30 }} />
      </View>

      <Animated.ScrollView style={{ opacity: fadeAnim }} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {sections.map((section, sIdx) => (
          <View key={sIdx} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.card}>
              {section.items.map((item, iIdx) => {
                const Icon = item.icon;
                return (
                  <TouchableOpacity
                    key={iIdx}
                    style={[styles.item, iIdx < section.items.length - 1 && styles.itemBorder]}
                    activeOpacity={item.type === 'switch' ? 1 : 0.7}
                    onPress={() => {
                      if (item.type === 'danger' && 'onPress' in item) item.onPress?.();
                    }}
                  >
                    <View style={[styles.iconWrap, item.type === 'danger' && styles.iconDanger]}>
                      <Icon size={18} color={item.type === 'danger' ? COLORS.error : COLORS.primary} />
                    </View>
                    <View style={styles.itemContent}>
                      <Text style={[styles.itemLabel, item.type === 'danger' && styles.itemLabelDanger]}>{item.label}</Text>
                      {'description' in item && item.description && (
                        <Text style={styles.itemDesc}>{item.description}</Text>
                      )}
                    </View>
                    {item.type === 'switch' && 'onToggle' in item && (
                      <Switch
                        value={item.value as boolean}
                        onValueChange={item.onToggle}
                        trackColor={{ false: COLORS.border, true: COLORS.primaryMuted }}
                        thumbColor={item.value ? COLORS.primary : COLORS.white}
                      />
                    )}
                    {item.type === 'link' && (
                      <View style={styles.linkRight}>
                        {'value' in item && item.value && <Text style={styles.linkValue}>{item.value as string}</Text>}
                        <ChevronRight size={18} color={COLORS.textLight} />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}
        <View style={{ height: 40 }} />
      </Animated.ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.surface },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.base, paddingVertical: SPACING.md, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: FONT_SIZES.lg, fontWeight: FONT_WEIGHTS.semibold, color: COLORS.text },
  scroll: { paddingBottom: 40 },
  section: { marginTop: SPACING.xl, paddingHorizontal: SPACING.xl },
  sectionTitle: { fontSize: FONT_SIZES.sm, fontWeight: FONT_WEIGHTS.semibold, color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: SPACING.sm },
  card: { backgroundColor: COLORS.white, borderRadius: RADIUS.lg, ...SHADOWS.sm },
  item: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.base, paddingVertical: SPACING.md, gap: SPACING.md },
  itemBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  iconWrap: { width: 36, height: 36, borderRadius: RADIUS.md, backgroundColor: COLORS.primarySurface, justifyContent: 'center', alignItems: 'center' },
  iconDanger: { backgroundColor: COLORS.errorLight },
  itemContent: { flex: 1 },
  itemLabel: { fontSize: FONT_SIZES.base, fontWeight: FONT_WEIGHTS.medium, color: COLORS.text },
  itemLabelDanger: { color: COLORS.error },
  itemDesc: { fontSize: FONT_SIZES.sm, color: COLORS.textLight, marginTop: 2 },
  linkRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  linkValue: { fontSize: FONT_SIZES.sm, color: COLORS.textLight },
});

export default SettingsScreen;
