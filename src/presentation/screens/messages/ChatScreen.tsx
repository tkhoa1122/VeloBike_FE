/**
 * VeloBike Chat Screen
 * Message thread UI with bubbles, input bar, listing reference
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

interface ChatScreenProps {
  conversationId?: string;
  participantName?: string;
  participantAvatar?: string;
  listingTitle?: string;
  listingImage?: string;
  onBack?: () => void;
}

export const ChatScreen: React.FC<ChatScreenProps> = ({
  conversationId,
  participantName = '',
  participantAvatar,
  listingTitle,
  listingImage,
  onBack,
}) => {
  const insets = useSafeAreaInsets();
  const { currentMessages, getMessages, sendMessage: storeSendMessage } = useMessageStore();
  const { user } = useAuthStore();
  const { uploadFile } = useUploadStore();
  const { showImagePicker, toUploadFileData } = useImagePicker({ maxFiles: 5, quality: 0.7 });
  const currentUserId = user?._id ?? '';
  const [inputText, setInputText] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (conversationId) getMessages(conversationId);
  }, [conversationId, getMessages]);

  const handleSend = useCallback(async () => {
    if (!inputText.trim() || !conversationId) return;
    const text = inputText.trim();
    setInputText('');
    // Determine receiverId - for now pass empty and let BE derive
    await storeSendMessage({
      conversationId,
      receiverId: '', // BE will resolve from conversation
      content: text,
    });
  }, [inputText, conversationId, storeSendMessage]);

  const handleImagePick = useCallback(async () => {
    if (!conversationId) return;
    
    setUploadingImage(true);
    try {
      const pickedImages = await showImagePicker(true); // Allow multiple
      if (pickedImages.length === 0) {
        setUploadingImage(false);
        return;
      }

      // Upload images one by one
      for (const image of pickedImages) {
        const uploadData = toUploadFileData([image]);
        const url = await uploadFile(uploadData[0]);
        
        if (url) {
          // Send image URL as message
          await storeSendMessage({
            conversationId,
            receiverId: '',
            content: `[Image]: ${url}`,
            attachments: [url],
          });
        }
      }

      Toast.show({
        type: 'success',
        text1: 'Gửi ảnh thành công',
        text2: `Đã gửi ${pickedImages.length} ảnh`,
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Lỗi gửi ảnh',
        text2: error instanceof Error ? error.message : 'Vui lòng thử lại',
      });
    } finally {
      setUploadingImage(false);
    }
  }, [conversationId, showImagePicker, toUploadFileData, uploadFile, storeSendMessage]);

  const formatMsgTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  const renderStatus = (status: MessageEntry['readStatus']) => {
    switch (status) {
      case 'SENT':
        return <Check size={12} color={COLORS.textLight} />;
      case 'DELIVERED':
        return <CheckCheck size={12} color={COLORS.textLight} />;
      case 'READ':
        return <CheckCheck size={12} color={COLORS.primary} />;
    }
  };

  const renderItem = useCallback(({ item, index }: { item: MessageEntry; index: number }) => {
    const isMe = item.senderId === currentUserId;
    const prevMsg = index > 0 ? currentMessages[index - 1] : null;
    const showDate =
      !prevMsg ||
      new Date(item.timestamp).toDateString() !== new Date(prevMsg.timestamp).toDateString();
    const isConsecutive = prevMsg && prevMsg.senderId === item.senderId && !showDate;

    return (
      <View>
        {showDate && (
          <View style={styles.dateSep}>
            <Text style={styles.dateSepText}>
              {new Date(item.timestamp).toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' })}
            </Text>
          </View>
        )}
        <View style={[styles.msgRow, isMe && styles.msgRowMe, isConsecutive && styles.msgConsecutive]}>
          {!isMe && !isConsecutive && participantAvatar && (
            <Image source={{ uri: participantAvatar }} style={styles.msgAvatar} />
          )}
          {!isMe && (isConsecutive || !participantAvatar) && <View style={styles.msgAvatarSpacer} />}
          <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleOther]}>
            <Text style={[styles.bubbleText, isMe && styles.bubbleTextMe]}>{item.content}</Text>
            <View style={styles.bubbleMeta}>
              <Text style={[styles.bubbleTime, isMe && styles.bubbleTimeMe]}>
                {formatMsgTime(item.timestamp)}
              </Text>
              {isMe && renderStatus(item.readStatus)}
            </View>
          </View>
        </View>
      </View>
    );
  }, [currentMessages, participantAvatar, currentUserId]);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <ArrowLeft size={22} color={COLORS.text} />
        </TouchableOpacity>
        {participantAvatar ? (
          <Image source={{ uri: participantAvatar }} style={styles.headerAvatar} />
        ) : <View style={styles.headerAvatar} />}
        <View style={styles.headerInfo}>
          <Text style={styles.headerName} numberOfLines={1}>{participantName}</Text>
          <Text style={styles.headerStatus}>Đang hoạt động</Text>
        </View>
        <TouchableOpacity style={styles.headerAction}><Phone size={20} color={COLORS.primary} /></TouchableOpacity>
        <TouchableOpacity style={styles.headerAction}><MoreVertical size={20} color={COLORS.textSecondary} /></TouchableOpacity>
      </View>

      {/* Listing reference */}
      {listingTitle && (
        <TouchableOpacity style={styles.listingBar}>
          {listingImage && <Image source={{ uri: listingImage }} style={styles.listingThumb} />}
          <Text style={styles.listingBarText} numberOfLines={1}>Đang trao đổi: {listingTitle}</Text>
        </TouchableOpacity>
      )}

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
        />

        {/* Input bar */}
        <View style={[styles.inputBar, { paddingBottom: insets.bottom + SPACING.sm }]}>
          <TouchableOpacity 
            style={styles.attachBtn}
            onPress={handleImagePick}
            disabled={uploadingImage}
          >
            <ImageIcon size={22} color={uploadingImage ? COLORS.textLight : COLORS.primary} />
          </TouchableOpacity>
          <View style={styles.inputWrap}>
            <TextInput
              style={styles.textInput}
              placeholder={uploadingImage ? "Đang gửi ảnh..." : "Nhập tin nhắn..."}
              placeholderTextColor={COLORS.textLight}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={1000}
              editable={!uploadingImage}
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
  dateSepText: { fontSize: FONT_SIZES.xs, color: COLORS.textLight, backgroundColor: COLORS.surface, paddingHorizontal: SPACING.md, paddingVertical: 4, borderRadius: RADIUS.full },
  msgRow: { flexDirection: 'row', marginBottom: SPACING.sm, alignItems: 'flex-end' },
  msgRowMe: { justifyContent: 'flex-end' },
  msgConsecutive: { marginBottom: 3 },
  msgAvatar: { width: 28, height: 28, borderRadius: 14, marginRight: SPACING.sm, backgroundColor: COLORS.skeleton },
  msgAvatarSpacer: { width: 28, marginRight: SPACING.sm },
  bubble: { maxWidth: '75%', borderRadius: RADIUS.lg, padding: SPACING.md },
  bubbleMe: { backgroundColor: COLORS.primary, borderBottomRightRadius: RADIUS.xs },
  bubbleOther: { backgroundColor: COLORS.surface, borderBottomLeftRadius: RADIUS.xs },
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
  attachBtn: { padding: 8, marginBottom: 4 },
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
});

export default ChatScreen;
