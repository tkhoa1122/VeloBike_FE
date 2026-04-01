/**
 * VeloBike Messages Screen
 * Conversation list with last message, unread badges, avatars
 */
import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Animated,
  StatusBar,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MessageCircle, Search } from 'lucide-react-native';
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
import { useMessageStore } from '../../viewmodels/MessageStore';
import type { ConversationEntry } from '../../../data/repositories/MessageRepositoryImpl';

interface MessagesScreenProps {
  onConversationPress?: (
    conversationId: string,
    participantName: string,
    participantAvatar?: string,
    participantUserId?: string,
  ) => void;
}

export const MessagesScreen: React.FC<MessagesScreenProps> = ({ onConversationPress }) => {
  const insets = useSafeAreaInsets();
  const { conversations, loadingState, getConversations } = useMessageStore();
  const [searchQuery, setSearchQuery] = useState('');
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    getConversations();
  }, [fadeAnim, getConversations]);

  const filtered = searchQuery
    ? conversations.filter(c => c.participantName.toLowerCase().includes(searchQuery.toLowerCase()) || (c.lastMessage ?? '').toLowerCase().includes(searchQuery.toLowerCase()))
    : conversations;

  const totalUnread = conversations.reduce((acc, c) => acc + c.unreadCount, 0);

  const renderItem = useCallback(({ item }: { item: ConversationEntry }) => (
    <TouchableOpacity
      style={styles.convItem}
      activeOpacity={0.7}
      onPress={() =>
        onConversationPress?.(item._id, item.participantName, item.participantAvatar, item.participantId)
      }
    >
      <View style={styles.avatarWrap}>
        {item.participantAvatar ? (
          <Image source={{ uri: item.participantAvatar }} style={styles.avatar} />
        ) : <View style={styles.avatar} />}
        {item.isOnline && <View style={styles.onlineDot} />}
      </View>
      <View style={styles.convContent}>
        <View style={styles.convTop}>
          <Text style={[styles.convName, item.unreadCount > 0 && styles.convNameUnread]} numberOfLines={1}>{item.participantName}</Text>
          {item.lastMessageTime && <Text style={[styles.convTime, item.unreadCount > 0 && styles.convTimeUnread]}>{formatRelativeTime(item.lastMessageTime)}</Text>}
        </View>
        <View style={styles.convBottom}>
          <Text style={[styles.convMsg, item.unreadCount > 0 && styles.convMsgUnread]} numberOfLines={1}>{item.lastMessage ?? ''}</Text>
          {item.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{item.unreadCount}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  ), [onConversationPress]);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Tin nhắn</Text>
          {totalUnread > 0 && (
            <View style={styles.totalBadge}><Text style={styles.totalBadgeText}>{totalUnread}</Text></View>
          )}
        </View>
        <View style={styles.searchBox}>
          <Search size={16} color={COLORS.textLight} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm tin nhắn..."
            placeholderTextColor={COLORS.textLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </Animated.View>
      {filtered.length === 0 ? (
        <View style={styles.empty}>
          <MessageCircle size={ICON_SIZES['3xl']} color={COLORS.textLight} />
          <Text style={styles.emptyTitle}>Chưa có tin nhắn</Text>
          <Text style={styles.emptySub}>Trò chuyện với người mua hoặc người bán về tin đăng và đơn hàng.</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={i => i._id}
          renderItem={renderItem}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingHorizontal: SPACING.xl, paddingTop: SPACING.base, paddingBottom: SPACING.sm },
  headerTop: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.md },
  headerTitle: { fontSize: FONT_SIZES['2xl'], fontWeight: FONT_WEIGHTS.bold, color: COLORS.text },
  totalBadge: { backgroundColor: COLORS.error, borderRadius: RADIUS.full, minWidth: 22, height: 22, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 6 },
  totalBadgeText: { fontSize: 11, fontWeight: FONT_WEIGHTS.bold, color: COLORS.white },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, paddingHorizontal: SPACING.md, height: 40, gap: SPACING.sm },
  searchInput: { flex: 1, fontSize: FONT_SIZES.md, color: COLORS.text, padding: 0 },
  list: { paddingBottom: 100 },
  convItem: { flexDirection: 'row', paddingHorizontal: SPACING.xl, paddingVertical: SPACING.md, gap: SPACING.md },
  avatarWrap: { position: 'relative' },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: COLORS.skeleton },
  onlineDot: { position: 'absolute', bottom: 1, right: 1, width: 14, height: 14, borderRadius: 7, backgroundColor: COLORS.success, borderWidth: 2, borderColor: COLORS.white },
  convContent: { flex: 1 },
  convTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  convName: { fontSize: FONT_SIZES.base, fontWeight: FONT_WEIGHTS.medium, color: COLORS.text, flex: 1, marginRight: SPACING.sm },
  convNameUnread: { fontWeight: FONT_WEIGHTS.bold },
  convTime: { fontSize: FONT_SIZES.xs, color: COLORS.textLight },
  convTimeUnread: { color: COLORS.primary, fontWeight: FONT_WEIGHTS.semibold },
  listingRef: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4, backgroundColor: COLORS.surface, borderRadius: RADIUS.sm, paddingHorizontal: 6, paddingVertical: 3, alignSelf: 'flex-start' },
  listingThumb: { width: 20, height: 20, borderRadius: 3, backgroundColor: COLORS.skeleton },
  listingRefText: { fontSize: 11, color: COLORS.textSecondary, maxWidth: 180 },
  convBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  convMsg: { fontSize: FONT_SIZES.md, color: COLORS.textSecondary, flex: 1, marginRight: SPACING.sm },
  convMsgUnread: { color: COLORS.text, fontWeight: FONT_WEIGHTS.medium },
  unreadBadge: { backgroundColor: COLORS.primary, borderRadius: RADIUS.full, minWidth: 20, height: 20, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 5 },
  unreadText: { fontSize: 11, fontWeight: FONT_WEIGHTS.bold, color: COLORS.white },
  separator: { height: 1, backgroundColor: COLORS.borderLight, marginLeft: SPACING.xl + 52 + SPACING.md },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: SPACING.md, paddingHorizontal: SPACING['3xl'] },
  emptyTitle: { fontSize: FONT_SIZES.xl, fontWeight: FONT_WEIGHTS.semibold, color: COLORS.text },
  emptySub: { fontSize: FONT_SIZES.md, color: COLORS.textLight, textAlign: 'center' },
});

export default MessagesScreen;
