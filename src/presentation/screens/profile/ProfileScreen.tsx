/**
 * VeloBike Profile Screen
 * Full profile with avatar, stats, menu items (Orders, Settings, etc.), logout
 */
import React, { useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Animated,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  UserCircle,
  LogOut,
  ChevronRight,
  ShoppingBag,
  Heart,
  Settings,
  Bell,
  Edit3,
  Star,
  HelpCircle,
  FileText,
  Shield,
  Store,
  ShieldCheck,
} from 'lucide-react-native';
import {
  COLORS,
  SPACING,
  RADIUS,
  FONT_SIZES,
  FONT_WEIGHTS,
  SHADOWS,
  ICON_SIZES,
} from '../../../config/theme';
import { useAuthStore } from '../../viewmodels/AuthStore';
import { useOrderStore } from '../../viewmodels/OrderStore';
import { useWishlistStore } from '../../viewmodels/WishlistStore';
import { useNotificationStore } from '../../viewmodels/NotificationStore';
import { Button } from '../../components/common/Button';
import { container } from '../../../di/Container';
import Toast from 'react-native-toast-message';

interface ProfileScreenProps {
  onLogout?: () => void;
  onEditProfile?: () => void;
  onKycVerification?: () => void;
  onOrders?: () => void;
  onNotifications?: () => void;
  onSettings?: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  onLogout,
  onEditProfile,
  onKycVerification,
  onOrders,
  onNotifications,
  onSettings,
}) => {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuthStore();
  const { totalCount: orderCount } = useOrderStore();
  const { totalItems: wishlistCount } = useWishlistStore();
  const { unreadCount } = useNotificationStore();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [upgradeInProgress, setUpgradeInProgress] = React.useState(false);

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, [fadeAnim]);

  const handleLogout = useCallback(async () => {
    await logout();
    onLogout?.();
  }, [logout, onLogout]);

  const handleSwitchToBuyer = useCallback(async () => {
    // Future implementation: toggle role or navigate to seller dashboard
    Toast.show({
      type: 'info',
      text1: 'Chuyển đổi vai trò',
      text2: 'Tính năng này sẽ được cập nhật sớm.',
    });
  }, []);

  const handleUpgradeToSeller = useCallback(async () => {
    if (upgradeInProgress) {
      Toast.show({
        type: 'info',
        text1: 'Đang cập nhật...',
        text2: 'Vui lòng chờ một chút',
      });
      return;
    }

    try {
      setUpgradeInProgress(true);
      const kycStatus = await container().authApiClient.getKYCStatus();
      const status = kycStatus.data?.status;
      if (!kycStatus.success || status !== 'VERIFIED') {
        Toast.show({
          type: 'info',
          text1: 'Cần xác minh trước khi đăng ký bán hàng',
          text2: 'Hãy hoàn tất KYC ở bước cuối để kích hoạt tài khoản người bán.',
        });

        // KYC is part of seller registration flow, not a standalone profile action.
        onKycVerification?.();
        setUpgradeInProgress(false);
        return;
      }

      const result = await container().authApiClient.upgradeToSeller();
      if (result.success) {
        const getCurrentUser = useAuthStore.getState().getCurrentUser as any;
        await getCurrentUser(false, true);
        Toast.show({
          type: 'success',
          text1: 'Đăng ký bán hàng thành công',
          text2: result.message || 'Bạn đã được nâng cấp tài khoản người bán',
        });
        setUpgradeInProgress(false);
        return;
      }

      Toast.show({
        type: 'error',
        text1: 'Không thể đăng ký bán hàng',
        text2: result.message || 'Vui lòng thử lại sau',
      });
      setUpgradeInProgress(false);
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Không thể đăng ký bán hàng',
        text2: error instanceof Error ? error.message : 'Vui lòng thử lại sau',
      });
      setUpgradeInProgress(false);
    }
  }, [upgradeInProgress]);

  // Real stats from stores
  const stats = [
    { label: 'Đã mua', value: orderCount?.toString() || '0' },
    { label: 'Yêu thích', value: wishlistCount?.toString() || '0' },
    { label: 'Đánh giá', value: user?.reputation?.rating?.toFixed(1) || '0.0' },
  ];

  interface MenuItem {
    icon: typeof ShoppingBag;
    label: string;
    onPress?: () => void;
    badge?: string;
    accent?: boolean;
  }

  interface MenuSection {
    title: string;
    items: MenuItem[];
  }

  // Build menu sections based on user role  
  const buildMenuSections = (): MenuSection[] => {
    const userRole = user?.role;
    
    // Seller mode: different menu
    if (userRole === 'SELLER') {
      return [
        {
          title: 'Giao dịch',
          items: [
            { icon: ShoppingBag, label: 'Đơn hàng của tôi', onPress: onOrders, badge: orderCount > 0 ? orderCount?.toString() : undefined },
            { icon: Heart, label: 'Sản phẩm yêu thích', onPress: () => {} },
            { icon: Star, label: 'Đánh giá của tôi', onPress: () => Toast.show({ type: 'info', text1: 'Tính năng sắp ra mắt', text2: 'Chức năng xem đánh giá sẽ được cập nhật' }) },
          ],
        },
        {
          title: 'Bán hàng',
          items: [
            { 
              icon: Store, 
              label: 'Chuyển sang mua hàng', 
              onPress: handleSwitchToBuyer, 
              accent: true 
            },
          ],
        },
        {
          title: 'Cài đặt',
          items: [
            { icon: Bell, label: 'Thông báo', onPress: onNotifications, badge: unreadCount > 0 ? unreadCount?.toString() : undefined },
            { icon: Settings, label: 'Cài đặt', onPress: onSettings },
            { icon: Shield, label: 'Bảo mật & Quyền riêng tư', onPress: () => {} },
          ],
        },
        {
          title: 'Hỗ trợ',
          items: [
            { icon: HelpCircle, label: 'Trung tâm trợ giúp', onPress: () => {} },
            { icon: FileText, label: 'Điều khoản sử dụng', onPress: () => {} },
          ],
        },
      ];
    }

    // Buyer mode: original menu with seller upgrade option
    const kycStatus = user?.kycStatus;
    
    let sellerSectionItems: MenuItem[] = [];
    
    if (kycStatus === 'pending') {
      sellerSectionItems = [
        { 
          icon: ShieldCheck, 
          label: 'Chờ xét duyệt KYC', 
          onPress: () => Toast.show({ 
            type: 'info', 
            text1: 'Hồ sơ đang được xét duyệt',
            text2: 'Bạn sẽ có thể đăng ký bán hàng khi KYC được phê duyệt.' 
          }) 
        },
      ];
    } else if (kycStatus === 'rejected') {
      sellerSectionItems = [
        { 
          icon: Shield, 
          label: 'Xác minh lại KYC', 
          onPress: onKycVerification,
          accent: true 
        },
      ];
    } else {
      sellerSectionItems = [
        { icon: Store, label: 'Đăng ký bán hàng', onPress: handleUpgradeToSeller, accent: true },
      ];
    }

    return [
      {
        title: 'Giao dịch',
        items: [
          { icon: ShoppingBag, label: 'Đơn hàng của tôi', onPress: onOrders, badge: orderCount > 0 ? orderCount?.toString() : undefined },
          { icon: Heart, label: 'Sản phẩm yêu thích', onPress: () => {} },
          { icon: Star, label: 'Đánh giá của tôi', onPress: () => Toast.show({ type: 'info', text1: 'Tính năng sắp ra mắt', text2: 'Chức năng xem đánh giá sẽ được cập nhật' }) },
        ],
      },
      {
        title: 'Bán hàng',
        items: sellerSectionItems,
      },
      {
        title: 'Cài đặt',
        items: [
          { icon: Bell, label: 'Thông báo', onPress: onNotifications, badge: unreadCount > 0 ? unreadCount?.toString() : undefined },
          { icon: Settings, label: 'Cài đặt', onPress: onSettings },
          { icon: Shield, label: 'Bảo mật & Quyền riêng tư', onPress: () => {} },
        ],
      },
      {
        title: 'Hỗ trợ',
        items: [
          { icon: HelpCircle, label: 'Trung tâm trợ giúp', onPress: () => {} },
          { icon: FileText, label: 'Điều khoản sử dụng', onPress: () => {} },
        ],
      },
    ];
  };

  const menuSections = buildMenuSections();

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      <ScrollView showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim }}>
          {/* Profile header */}
          <View style={styles.profileHeader}>
            <View style={styles.avatarRow}>
              {user?.avatar ? (
                <Image source={{ uri: user.avatar }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <UserCircle size={50} color={COLORS.primaryLight} strokeWidth={1} />
                </View>
              )}
              <TouchableOpacity style={styles.editAvatarBtn} onPress={onEditProfile}>
                <Edit3 size={14} color={COLORS.white} />
              </TouchableOpacity>
            </View>
            <Text style={styles.userName}>{user?.fullName || 'Người dùng VeloBike'}</Text>
            <Text style={styles.userEmail}>{user?.email || ''}</Text>
            <TouchableOpacity style={styles.editProfileBtn} onPress={onEditProfile}>
              <Edit3 size={14} color={COLORS.primary} />
              <Text style={styles.editProfileText}>Chỉnh sửa hồ sơ</Text>
            </TouchableOpacity>
          </View>

          {/* Stats row */}
          <View style={styles.statsRow}>
            {stats.map((stat, idx) => (
              <View key={idx} style={[styles.statItem, idx < stats.length - 1 && styles.statBorder]}>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>

          {/* Menu sections */}
          {menuSections.map((section, sIdx) => (
            <View key={sIdx} style={styles.menuSection}>
              <Text style={styles.menuSectionTitle}>{section.title}</Text>
              <View style={styles.menuCard}>
                {section.items.map((item, iIdx) => {
                  const Icon = item.icon;
                  return (
                    <TouchableOpacity
                      key={iIdx}
                      style={[styles.menuItem, iIdx < section.items.length - 1 && styles.menuItemBorder]}
                      activeOpacity={0.7}
                      onPress={item.onPress}
                    >
                      <View style={[styles.menuIconWrap, item.accent && styles.menuIconAccent]}>
                        <Icon size={18} color={item.accent ? COLORS.accent : COLORS.primary} />
                      </View>
                      <Text style={[styles.menuLabel, item.accent && styles.menuLabelAccent]}>{item.label}</Text>
                      {item.badge && (
                        <View style={styles.menuBadge}>
                          <Text style={styles.menuBadgeText}>{item.badge}</Text>
                        </View>
                      )}
                      <ChevronRight size={18} color={COLORS.textLight} />
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))}

          {/* Logout */}
          <View style={styles.logoutSection}>
            <Button
              title="Đăng xuất"
              onPress={handleLogout}
              variant="danger"
              icon={<LogOut size={ICON_SIZES.md} color={COLORS.white} />}
              style={styles.logoutBtn}
            />
          </View>

          {/* Version info */}
          <Text style={styles.version}>VeloBike v1.0.0</Text>
          <View style={{ height: 40 }} />
        </Animated.View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.surface },
  profileHeader: { alignItems: 'center', paddingTop: SPACING.xl, paddingBottom: SPACING.xl, backgroundColor: COLORS.white },
  avatarRow: { position: 'relative', marginBottom: SPACING.md },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.skeleton },
  avatarPlaceholder: { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.primarySurface, justifyContent: 'center', alignItems: 'center' },
  editAvatarBtn: { position: 'absolute', bottom: 0, right: -2, width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: COLORS.white },
  userName: { fontSize: FONT_SIZES.xl, fontWeight: FONT_WEIGHTS.bold, color: COLORS.text },
  userEmail: { fontSize: FONT_SIZES.md, color: COLORS.textSecondary, marginTop: 2 },
  editProfileBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: SPACING.md, paddingHorizontal: SPACING.base, paddingVertical: SPACING.sm, borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.primary },
  editProfileText: { fontSize: FONT_SIZES.sm, fontWeight: FONT_WEIGHTS.semibold, color: COLORS.primary },
  statsRow: { flexDirection: 'row', backgroundColor: COLORS.white, marginTop: 1, paddingVertical: SPACING.base },
  statItem: { flex: 1, alignItems: 'center' },
  statBorder: { borderRightWidth: 1, borderRightColor: COLORS.border },
  statValue: { fontSize: FONT_SIZES.xl, fontWeight: FONT_WEIGHTS.bold, color: COLORS.text },
  statLabel: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginTop: 2 },
  menuSection: { marginTop: SPACING.lg, paddingHorizontal: SPACING.xl },
  menuSectionTitle: { fontSize: FONT_SIZES.sm, fontWeight: FONT_WEIGHTS.semibold, color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: SPACING.sm },
  menuCard: { backgroundColor: COLORS.white, borderRadius: RADIUS.lg, ...SHADOWS.sm },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.base, paddingVertical: SPACING.md, gap: SPACING.md },
  menuItemBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  menuIconWrap: { width: 36, height: 36, borderRadius: RADIUS.md, backgroundColor: COLORS.primarySurface, justifyContent: 'center', alignItems: 'center' },
  menuIconAccent: { backgroundColor: COLORS.accentSurface },
  menuLabel: { flex: 1, fontSize: FONT_SIZES.base, fontWeight: FONT_WEIGHTS.medium, color: COLORS.text },
  menuLabelAccent: { color: COLORS.accentDark, fontWeight: FONT_WEIGHTS.semibold },
  menuBadge: { backgroundColor: COLORS.error, borderRadius: RADIUS.full, minWidth: 20, height: 20, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 5 },
  menuBadgeText: { fontSize: 11, fontWeight: FONT_WEIGHTS.bold, color: COLORS.white },
  logoutSection: { paddingHorizontal: SPACING.xl, marginTop: SPACING['2xl'] },
  logoutBtn: { width: '100%' },
  version: { textAlign: 'center', fontSize: FONT_SIZES.sm, color: COLORS.textLight, marginTop: SPACING.xl },
});

export default ProfileScreen;
