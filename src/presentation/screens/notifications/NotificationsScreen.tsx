/**
 * VeloBike Notifications Screen
 * Notification list with type icons, read/unread states
 */
import React, { useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Animated,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Bell,
  MessageCircle,
  ShoppingBag,
  Tag,
  CreditCard,
  Star,
  Shield,
  Megaphone,
  CheckCheck,
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
import { formatRelativeTime } from '../../../utils/formatters';
import { useNotificationStore } from '../../viewmodels/NotificationStore';
import { Notification } from '../../../domain/entities/Notification';

const getNotifIcon = (type: string) => {
  switch (type) {
    case 'NEW_MESSAGE': return { Icon: MessageCircle, bg: COLORS.infoLight, color: COLORS.info };
    case 'ORDER_UPDATE': return { Icon: ShoppingBag, bg: COLORS.primarySurface, color: COLORS.primary };
    case 'LISTING_UPDATE': return { Icon: Tag, bg: COLORS.accentLight, color: COLORS.accent };
    case 'PAYMENT_RECEIVED': return { Icon: CreditCard, bg: '#F0FFF4', color: COLORS.success };
    case 'REVIEW': return { Icon: Star, bg: '#FFFBEB', color: COLORS.warning };
    case 'SYSTEM': return { Icon: Shield, bg: COLORS.surface, color: COLORS.textSecondary };
    case 'PROMO': return { Icon: Megaphone, bg: COLORS.errorLight, color: COLORS.error };
    default: return { Icon: Bell, bg: COLORS.surface, color: COLORS.textSecondary };
  }
};

interface NotificationsScreenProps {
  onBack?: () => void;
  onNotificationPress?: (notification: Notification) => void;
}

export const NotificationsScreen: React.FC<NotificationsScreenProps> = ({ onBack, onNotificationPress }) => {
  const insets = useSafeAreaInsets();
  const { notifications, unreadCount, getNotifications, markAsRead, markAllAsRead } = useNotificationStore();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    getNotifications();
  }, [fadeAnim, getNotifications]);

  const handleMarkAllRead = useCallback(() => {
    markAllAsRead();
  }, [markAllAsRead]);

  const handlePress = useCallback((item: Notification) => {
    if (!item.isRead) markAsRead(item._id);
    onNotificationPress?.(item);
  }, [onNotificationPress, markAsRead]);

  const renderItem = useCallback(({ item }: { item: Notification }) => {
    const { Icon, bg, color } = getNotifIcon(item.type);
    return (
      <TouchableOpacity style={[styles.notifItem, !item.isRead && styles.notifUnread]} activeOpacity={0.7} onPress={() => handlePress(item)}>
        <View style={[styles.notifIcon, { backgroundColor: bg }]}>
          <Icon size={18} color={color} />
        </View>
        <View style={styles.notifContent}>
          <View style={styles.notifTop}>
            <Text style={[styles.notifTitle, !item.isRead && styles.notifTitleUnread]} numberOfLines={1}>{item.title}</Text>
            <Text style={styles.notifTime}>{formatRelativeTime(item.createdAt)}</Text>
          </View>
          <Text style={styles.notifBody} numberOfLines={2}>{item.message}</Text>
        </View>
        {!item.isRead && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    );
  }, [handlePress]);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <ArrowLeft size={22} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thông báo</Text>
        {unreadCount > 0 ? (
          <TouchableOpacity onPress={handleMarkAllRead}>
            <CheckCheck size={20} color={COLORS.primary} />
          </TouchableOpacity>
        ) : <View style={{ width: 30 }} />}
      </View>

      {unreadCount > 0 && (
        <View style={styles.unreadBar}>
          <Text style={styles.unreadBarText}>{unreadCount} thông báo chưa đọc</Text>
        </View>
      )}

      <Animated.View style={[styles.flex, { opacity: fadeAnim }]}>
        {notifications.length === 0 ? (
          <View style={styles.empty}>
            <Bell size={ICON_SIZES['3xl']} color={COLORS.textLight} />
            <Text style={styles.emptyTitle}>Chưa có thông báo</Text>
            <Text style={styles.emptySub}>Bạn sẽ nhận thông báo khi có hoạt động mới.</Text>
          </View>
        ) : (
          <FlatList
            data={notifications}
            keyExtractor={i => i._id}
            renderItem={renderItem}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          />
        )}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.base, paddingVertical: SPACING.md, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: FONT_SIZES.lg, fontWeight: FONT_WEIGHTS.semibold, color: COLORS.text },
  unreadBar: { backgroundColor: COLORS.primarySurface, paddingHorizontal: SPACING.xl, paddingVertical: SPACING.sm },
  unreadBarText: { fontSize: FONT_SIZES.sm, fontWeight: FONT_WEIGHTS.medium, color: COLORS.primaryDark },
  list: { paddingBottom: 100 },
  notifItem: { flexDirection: 'row', paddingHorizontal: SPACING.xl, paddingVertical: SPACING.base, gap: SPACING.md, backgroundColor: COLORS.white },
  notifUnread: { backgroundColor: COLORS.primarySurface + '30' },
  notifIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  notifContent: { flex: 1 },
  notifTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  notifTitle: { fontSize: FONT_SIZES.md, fontWeight: FONT_WEIGHTS.medium, color: COLORS.text, flex: 1, marginRight: SPACING.sm },
  notifTitleUnread: { fontWeight: FONT_WEIGHTS.bold },
  notifTime: { fontSize: FONT_SIZES.xs, color: COLORS.textLight },
  notifBody: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginTop: 4, lineHeight: FONT_SIZES.sm * 1.5 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary, marginTop: 6 },
  separator: { height: 1, backgroundColor: COLORS.borderLight, marginLeft: SPACING.xl + 40 + SPACING.md },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: SPACING.md },
  emptyTitle: { fontSize: FONT_SIZES.xl, fontWeight: FONT_WEIGHTS.semibold, color: COLORS.text },
  emptySub: { fontSize: FONT_SIZES.md, color: COLORS.textLight, textAlign: 'center', paddingHorizontal: SPACING['3xl'] },
});

export default NotificationsScreen;
