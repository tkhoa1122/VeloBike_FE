/**
 * VeloBike Chat Screen
 * Message thread UI with bubbles, input bar, listing reference
 * ✅ Fixes: getOrCreateConversation, polling 5s, render ảnh thật
 */
import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Image,
  Animated,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Send,
  Image as ImageIcon,
  MoreVertical,
  Phone,
  CheckCheck,
  Check,
} from 'lucide-react-native';
import {
  COLORS,
  SPACING,
  RADIUS,
  FONT_SIZES,
  FONT_WEIGHTS,
  SHADOWS,
} from '../../../config/theme';
import { useMessageStore } from '../../viewmodels/MessageStore';
import { useAuthStore } from '../../viewmodels/AuthStore';
import { useUploadStore } from '../../viewmodels/UploadStore';
import { useImagePicker } from '../../hooks/useImagePicker';
import type { MessageEntry } from '../../../data/repositories/MessageRepositoryImpl';
import Toast from 'react-native-toast-message';
import { container } from '../../../di/Container';

interface ChatScreenProps {
  conversationId?: string;
  /** Đối tác là người bán (luồng người mua) */
  sellerId?: string;
  /** Đối tác là người mua (luồng người bán) */
  buyerId?: string;
  /** Đối tác khi mở từ danh sách hội thoại */
  peerUserId?: string;
  participantName?: string;
  participantAvatar?: string;
  listingTitle?: string;
  listingImage?: string;
  listingId?: string;
  orderId?: string;
  onBack?: () => void;
}

export const ChatScreen: React.FC<ChatScreenProps> = ({
  conversationId: initialConvId,
  sellerId,
  buyerId,
  peerUserId,
  participantName = '',
  participantAvatar,
  listingTitle,
  listingImage,
  listingId,
  orderId,
  onBack,
}) => {
  const insets = useSafeAreaInsets();
  const {
    currentMessages,
    getMessages,
    sendMessage: storeSendMessage,
    clearMessages,
    getConversations,
  } = useMessageStore();
  const { user } = useAuthStore();
  const { uploadFile } = useUploadStore();
  const { showImagePicker, toUploadFileData } = useImagePicker({ maxFiles: 5, quality: 0.7 });
  /** BE / một API trả `id` thay vì `_id` — khớp JWT payload `id` */
  const currentUserId = user?._id ?? (user as { id?: string } | null)?.id ?? '';

  const [inputText, setInputText] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>(initialConvId);
  const peerFromProps = sellerId || buyerId || peerUserId || '';
  const [initLoading, setInitLoading] = useState(!initialConvId && !!peerFromProps);
  const [convParticipantName, setConvParticipantName] = useState(participantName);
  const [convParticipantAvatar, setConvParticipantAvatar] = useState(participantAvatar);
  /** Người nhận khi gửi tin (API /messages) */
  const [receiverUserId, setReceiverUserId] = useState(peerFromProps);

  const flatListRef = useRef<FlatList>(null);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ─── Polling 5s (useCallback phải đứng TRƯỚC useEffect — Rules of Hooks) ───
  const startPolling = useCallback((convId: string) => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    pollIntervalRef.current = setInterval(() => {
      getMessages(convId);
    }, 5000);
  }, [getMessages]);

  // ─── Gửi tin nhắn ─────────────────────────────────────────────────────────
  const handleSend = useCallback(async () => {
    if (!inputText.trim() || !conversationId) return;
    const text = inputText.trim();
    setInputText('');
    await storeSendMessage({
      conversationId,
      receiverId: receiverUserId,
      content: text,
    });
  }, [inputText, conversationId, receiverUserId, storeSendMessage]);

  // ─── Gửi ảnh ──────────────────────────────────────────────────────────────
  const handleImagePick = useCallback(async () => {
    if (!conversationId) return;
    setUploadingImage(true);
    try {
      const pickedImages = await showImagePicker(true);
      if (pickedImages.length === 0) return;

      for (const image of pickedImages) {
        const uploadData = toUploadFileData([image]);
        const url = await uploadFile(uploadData[0]);
        if (url) {
          await storeSendMessage({
            conversationId,
            receiverId: receiverUserId,
            content: `[Image]: ${url}`,
            attachments: [url],
          });
        }
      }
      Toast.show({ type: 'success', text1: 'Đã gửi ảnh' });
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Lỗi gửi ảnh', text2: error instanceof Error ? error.message : '' });
    } finally {
      setUploadingImage(false);
    }
  }, [conversationId, receiverUserId, showImagePicker, toUploadFileData, uploadFile, storeSendMessage]);

  const formatMsgTime = (date: Date) =>
    new Date(date).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

  const renderStatus = (status: MessageEntry['readStatus']) => {
    switch (status) {
      case 'SENT':      return <Check size={12} color={COLORS.textLight} />;
      case 'DELIVERED': return <CheckCheck size={12} color={COLORS.textLight} />;
      case 'READ':      return <CheckCheck size={12} color={COLORS.primary} />;
    }
  };

  // ─── Render 1 message ─────────────────────────────────────────────────────
  const renderItem = useCallback(({ item, index }: { item: MessageEntry; index: number }) => {
    const isMe = item.senderId === currentUserId;
    const prevMsg = index > 0 ? currentMessages[index - 1] : null;
    const showDate =
      !prevMsg ||
      new Date(item.timestamp).toDateString() !== new Date(prevMsg.timestamp).toDateString();
    const isConsecutive = prevMsg && prevMsg.senderId === item.senderId && !showDate;

    // ✅ Detect image message: "[Image]: https://..."
    const imageUrlMatch = item.content.match(/^\[Image\]:\s*(https?:\/\/\S+)/);
    const isImageMsg = !!imageUrlMatch;
    const imageUrl = imageUrlMatch?.[1];

    return (
      <View>
        {showDate && (
          <View style={styles.dateSep}>
            <Text style={styles.dateSepText}>
              {new Date(item.timestamp).toLocaleDateString('vi-VN', {
                weekday: 'long', day: 'numeric', month: 'long',
              })}
            </Text>
          </View>
        )}
        <View style={[styles.msgRow, isMe && styles.msgRowMe, isConsecutive && styles.msgConsecutive]}>
          {!isMe && !isConsecutive && convParticipantAvatar && (
            <Image source={{ uri: convParticipantAvatar }} style={styles.msgAvatar} />
          )}
          {!isMe && (isConsecutive || !convParticipantAvatar) && <View style={styles.msgAvatarSpacer} />}

          {isImageMsg && imageUrl ? (
            // ✅ Render ảnh thật
            <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleOther, styles.imageBubble]}>
              <Image
                source={{ uri: imageUrl }}
                style={styles.messageImage}
                resizeMode="cover"
              />
              <View style={styles.bubbleMeta}>
                <Text style={[styles.bubbleTime, isMe && styles.bubbleTimeMe]}>
                  {formatMsgTime(item.timestamp)}
                </Text>
                {isMe && renderStatus(item.readStatus)}
              </View>
            </View>
          ) : (
            // Text message bình thường
            <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleOther]}>
              <Text style={[styles.bubbleText, isMe && styles.bubbleTextMe]}>{item.content}</Text>
              <View style={styles.bubbleMeta}>
                <Text style={[styles.bubbleTime, isMe && styles.bubbleTimeMe]}>
                  {formatMsgTime(item.timestamp)}
                </Text>
                {isMe && renderStatus(item.readStatus)}
              </View>
            </View>
          )}
        </View>
      </View>
    );
  }, [currentMessages, convParticipantAvatar, currentUserId]);

  // ─── Init: lấy hoặc tạo conversation (GET /messages/conversation/:userId?...) ─
  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      clearMessages();
      setConversationId(initialConvId);
      setReceiverUserId(peerFromProps);
      setConvParticipantName(participantName);
      setConvParticipantAvatar(participantAvatar);

      if (initialConvId) {
        await getMessages(initialConvId);
        if (!cancelled) startPolling(initialConvId);
        return;
      }

      if (!peerFromProps) {
        setInitLoading(false);
        return;
      }

      // Đường nhanh: hội thoại đã tồn tại (đã thấy trong tab Tin nhắn) — không gọi lại getOrCreate
      let convs = useMessageStore.getState().conversations;
      if (convs.length === 0) {
        await getConversations();
        convs = useMessageStore.getState().conversations;
      }
      const existing = convs.find(c => String(c.participantId) === String(peerFromProps));
      if (existing?._id) {
        try {
          if (cancelled) return;
          setConversationId(existing._id);
          setReceiverUserId(peerFromProps);
          if (existing.participantName) {
            setConvParticipantName(existing.participantName);
          }
          if (existing.participantAvatar) {
            setConvParticipantAvatar(existing.participantAvatar);
          }
          await getMessages(existing._id);
          if (!cancelled) startPolling(existing._id);
        } catch (err) {
          console.error('[ChatScreen] load existing conv:', err);
          Toast.show({ type: 'error', text1: 'Lỗi tải tin nhắn' });
        } finally {
          if (!cancelled) setInitLoading(false);
        }
        return;
      }

      setInitLoading(true);
      try {
        const repo = container().messageRepository;
        const result = await repo.getOrCreateConversation(
          peerFromProps,
          listingId,
          orderId,
          currentUserId,
        );
        if (cancelled) return;
        if (result.success && result.data) {
          const convId = result.data._id;
          setConversationId(convId);
          if (result.data.participantId) {
            setReceiverUserId(result.data.participantId);
          }
          if (!participantName || participantName === 'Người bán' || participantName === 'Người mua') {
            setConvParticipantName(result.data.participantName || participantName || 'Người bán');
          }
          if (result.data.participantAvatar) {
            setConvParticipantAvatar(result.data.participantAvatar);
          }
          await getMessages(convId);
          startPolling(convId);
        } else {
          Toast.show({ type: 'error', text1: 'Không thể mở cuộc trò chuyện' });
        }
      } catch (err) {
        console.error('[ChatScreen] init error:', err);
        Toast.show({ type: 'error', text1: 'Lỗi kết nối' });
      } finally {
        if (!cancelled) setInitLoading(false);
      }
    };

    init();

    return () => {
      cancelled = true;
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      clearMessages();
    };
  }, [
    initialConvId,
    sellerId,
    buyerId,
    peerUserId,
    listingId,
    orderId,
    currentUserId,
    startPolling,
    clearMessages,
    getMessages,
    getConversations,
  ]);

  // Bổ sung receiver khi chỉ có conversationId (không có peer trên route)
  useEffect(() => {
    if (receiverUserId || !currentUserId || currentMessages.length === 0) return;
    const last = currentMessages[currentMessages.length - 1];
    const other = last.senderId === currentUserId ? last.receiverId : last.senderId;
    if (other) setReceiverUserId(other);
  }, [currentMessages, receiverUserId, currentUserId]);

  // ─── UI (một return sau toàn bộ hooks) ─────────────────────────────────────
  if (initLoading) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <ArrowLeft size={22} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerName}>Đang kết nối...</Text>
        </View>
        <View style={styles.loadingCenter}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Đang mở cuộc trò chuyện...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <ArrowLeft size={22} color={COLORS.text} />
        </TouchableOpacity>
        {convParticipantAvatar ? (
          <Image source={{ uri: convParticipantAvatar }} style={styles.headerAvatar} />
        ) : <View style={styles.headerAvatar} />}
        <View style={styles.headerInfo}>
          <Text style={styles.headerName} numberOfLines={1}>{convParticipantName}</Text>
          <Text style={styles.headerStatus}>Đang hoạt động</Text>
        </View>
        <TouchableOpacity style={styles.headerAction}>
          <Phone size={20} color={COLORS.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerAction}>
          <MoreVertical size={20} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Listing reference */}
      {listingTitle && (
        <TouchableOpacity style={styles.listingBar}>
          {listingImage && <Image source={{ uri: listingImage }} style={styles.listingThumb} />}
          <Text style={styles.listingBarText} numberOfLines={1}>
            Đang trao đổi: {listingTitle}
          </Text>
        </TouchableOpacity>
      )}

      {/* Lỗi không có conversation */}
      {!conversationId && !initLoading && (
        <View style={styles.loadingCenter}>
          <Text style={styles.loadingText}>Không thể mở cuộc trò chuyện</Text>
        </View>
      )}

      {conversationId && (
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={0}
        >
          <FlatList
            ref={flatListRef}
            data={currentMessages}
            keyExtractor={i => i._id}
            renderItem={renderItem}
            contentContainerStyle={styles.messagesList}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
            ListEmptyComponent={
              <View style={styles.emptyChat}>
                <Text style={styles.emptyChatText}>
                  Bắt đầu cuộc trò chuyện với {convParticipantName}
                </Text>
              </View>
            }
          />

          {/* Input bar */}
          <View style={[styles.inputBar, { paddingBottom: insets.bottom + SPACING.sm }]}>
            <TouchableOpacity
              style={styles.attachBtn}
              onPress={handleImagePick}
              disabled={uploadingImage}
            >
              {uploadingImage ? (
                <ActivityIndicator size="small" color={COLORS.primary} />
              ) : (
                <ImageIcon size={22} color={COLORS.primary} />
              )}
            </TouchableOpacity>
            <View style={styles.inputWrap}>
              <TextInput
                style={styles.textInput}
                placeholder={uploadingImage ? 'Đang gửi ảnh...' : 'Nhập tin nhắn...'}
                placeholderTextColor={COLORS.textLight}
                value={inputText}
                onChangeText={setInputText}
                multiline
                maxLength={1000}
                editable={!uploadingImage}
                onSubmitEditing={handleSend}
              />
            </View>
            <TouchableOpacity
              style={[styles.sendBtn, inputText.trim().length > 0 && styles.sendBtnActive]}
              onPress={handleSend}
              disabled={!inputText.trim() || uploadingImage}
            >
              <Send size={20} color={inputText.trim() ? COLORS.white : COLORS.textLight} />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: SPACING.sm,
  },
  backBtn: { padding: 4 },
  headerAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.skeleton },
  headerInfo: { flex: 1 },
  headerName: { fontSize: FONT_SIZES.base, fontWeight: FONT_WEIGHTS.semibold, color: COLORS.text },
  headerStatus: { fontSize: FONT_SIZES.xs, color: COLORS.success },
  headerAction: { padding: 6 },
  listingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primarySurface,
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  listingThumb: { width: 28, height: 28, borderRadius: RADIUS.xs, backgroundColor: COLORS.skeleton },
  listingBarText: { fontSize: FONT_SIZES.sm, color: COLORS.primaryDark, flex: 1 },
  messagesList: { paddingHorizontal: SPACING.base, paddingVertical: SPACING.md },
  dateSep: { alignItems: 'center', marginVertical: SPACING.base },
  dateSepText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textLight,
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.md,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  msgRow: { flexDirection: 'row', marginBottom: SPACING.sm, alignItems: 'flex-end' },
  msgRowMe: { justifyContent: 'flex-end' },
  msgConsecutive: { marginBottom: 3 },
  msgAvatar: { width: 28, height: 28, borderRadius: 14, marginRight: SPACING.sm, backgroundColor: COLORS.skeleton },
  msgAvatarSpacer: { width: 28, marginRight: SPACING.sm },
  bubble: { maxWidth: '75%', borderRadius: RADIUS.lg, padding: SPACING.md },
  bubbleMe: { backgroundColor: COLORS.primary, borderBottomRightRadius: RADIUS.xs },
  bubbleOther: { backgroundColor: COLORS.surface, borderBottomLeftRadius: RADIUS.xs },
  imageBubble: { padding: 4 },
  messageImage: { width: 200, height: 200, borderRadius: RADIUS.md },
  bubbleText: { fontSize: FONT_SIZES.md, color: COLORS.text, lineHeight: FONT_SIZES.md * 1.5 },
  bubbleTextMe: { color: COLORS.white },
  bubbleMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4, marginTop: 4 },
  bubbleTime: { fontSize: 10, color: COLORS.textLight },
  bubbleTimeMe: { color: 'rgba(255,255,255,0.7)' },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: SPACING.base,
    paddingTop: SPACING.sm,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: SPACING.sm,
  },
  attachBtn: { padding: 8, marginBottom: 4, width: 38, alignItems: 'center' },
  inputWrap: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    paddingHorizontal: SPACING.base,
    paddingVertical: Platform.OS === 'ios' ? SPACING.sm : 0,
    maxHeight: 100,
  },
  textInput: { fontSize: FONT_SIZES.md, color: COLORS.text, padding: 0, minHeight: 36 },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  sendBtnActive: { backgroundColor: COLORS.primary },
  loadingCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontSize: FONT_SIZES.base, color: COLORS.textSecondary },
  emptyChat: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  emptyChatText: { fontSize: FONT_SIZES.sm, color: COLORS.textLight, textAlign: 'center' },
});

export default ChatScreen;
