import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Linking,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Send, Bot, User } from 'lucide-react-native';
import tw from 'twrnc';
import { COLORS } from '../../../config/theme';
import { useMessageStore } from '../../viewmodels/MessageStore';
import Toast from 'react-native-toast-message';
import {
  ChatbotConversation,
  ChatbotMessage,
  ChatbotListingItem,
} from '../../../domain/entities/Message';

interface ProductCard {
  id: string;
  title: string;
  price: number;
  image: string;
  url: string;
}

type ChatbotBubble = ChatbotMessage & { listings?: ChatbotListingItem[] };

/** Giống WEB `Chatbot.tsx`: parse token [PRODUCT:{...}] trong nội dung bot */
function parseMessageParts(
  text: string,
): Array<{ type: 'text'; content: string } | { type: 'product'; data: ProductCard }> {
  const parts: Array<
    { type: 'text'; content: string } | { type: 'product'; data: ProductCard }
  > = [];
  const regex = /\[PRODUCT:(\{[^}]+\})\]/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: text.slice(lastIndex, match.index) });
    }
    try {
      parts.push({ type: 'product', data: JSON.parse(match[1]) as ProductCard });
    } catch {
      /* bỏ qua JSON lỗi */
    }
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    parts.push({ type: 'text', content: text.slice(lastIndex) });
  }
  return parts;
}

function BotMessageBody({ text }: { text: string }) {
  const parts = useMemo(() => parseMessageParts(text), [text]);
  const fmt = (n: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

  if (parts.length === 0) {
    return <Text style={tw`text-base text-gray-900`}>{text}</Text>;
  }

  return (
    <View style={tw`gap-2`}>
      {parts.map((part, i) => {
        if (part.type === 'text' && part.content.trim()) {
          return (
            <Text key={i} style={tw`text-base text-gray-900`}>
              {part.content}
            </Text>
          );
        }
        if (part.type === 'product') {
          const p = part.data;
          return (
            <TouchableOpacity
              key={i}
              style={tw`flex-row border border-gray-200 rounded-xl p-2 bg-gray-50`}
              onPress={() => p.url && Linking.openURL(p.url)}
              activeOpacity={0.7}
            >
              {p.image ? (
                <Image
                  source={{ uri: p.image }}
                  style={tw`w-16 h-16 rounded-lg bg-gray-200`}
                />
              ) : null}
              <View style={tw`flex-1 ml-2 justify-center`}>
                <Text style={tw`text-sm font-semibold text-gray-900`} numberOfLines={2}>
                  {p.title}
                </Text>
                <Text style={tw`text-sm text-green-700 font-bold mt-0.5`}>{fmt(p.price)}</Text>
                <Text style={tw`text-xs text-blue-600 mt-0.5`}>Xem trên VeloBike →</Text>
              </View>
            </TouchableOpacity>
          );
        }
        return null;
      })}
    </View>
  );
}

function ListingCardsBlock({ listings }: { listings: ChatbotListingItem[] }) {
  const fmt = (n: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

  return (
    <View style={tw`mt-3 pt-3 border-t border-gray-200`}>
      <Text style={tw`text-xs text-gray-500 font-medium mb-2`}>
        Gợi ý sản phẩm trên VeloBike
      </Text>
      {listings.map(p => (
        <TouchableOpacity
          key={p.id}
          style={tw`flex-row border border-gray-200 rounded-xl p-2 bg-white mb-2`}
          onPress={() => p.url && Linking.openURL(p.url)}
          activeOpacity={0.7}
        >
          {p.image ? (
            <Image source={{ uri: p.image }} style={tw`w-16 h-16 rounded-lg bg-gray-200`} />
          ) : null}
          <View style={tw`flex-1 ml-2 justify-center`}>
            <Text style={tw`text-sm font-semibold text-gray-900`} numberOfLines={2}>
              {p.title}
            </Text>
            <Text style={tw`text-sm text-green-700 font-bold mt-0.5`}>{fmt(p.price)}</Text>
            <Text style={tw`text-xs text-blue-600 mt-0.5`}>Xem chi tiết →</Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default function ChatbotScreen() {
  const { sendChatbotMessage, getChatbotHistory, fetchChatbotQuota } = useMessageStore();
  const [messages, setMessages] = useState<ChatbotBubble[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [remaining, setRemaining] = useState<number | null>(null);
  const flatListRef = useRef<FlatList>(null);

  const loadQuota = useCallback(async () => {
    const q = await fetchChatbotQuota();
    if (q) {
      setRemaining(q.unlimited ? -1 : q.remaining);
    }
  }, [fetchChatbotQuota]);

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const history = await getChatbotHistory(1, 20);
      const all: ChatbotBubble[] = history.flatMap((conv: ChatbotConversation) => conv.messages);
      all.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      setMessages(all);
    } catch {
      Toast.show({ type: 'error', text1: 'Không tải được lịch sử chat' });
    } finally {
      setHistoryLoading(false);
    }
  }, [getChatbotHistory]);

  useEffect(() => {
    loadHistory();
    loadQuota();
  }, [loadHistory, loadQuota]);

  const handleSend = useCallback(async () => {
    const text = inputText.trim();
    if (!text || loading) return;

    const userMessage: ChatbotBubble = {
      id: Date.now().toString(),
      role: 'USER',
      content: text,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setLoading(true);

    try {
      const response = await sendChatbotMessage({ message: text, context: {} });

      if (response) {
        const botMessage: ChatbotBubble = {
          id: (Date.now() + 1).toString(),
          role: 'ASSISTANT',
          content: response.reply,
          listings:
            response.listings && response.listings.length > 0 ? response.listings : undefined,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, botMessage]);
        await loadQuota();
      } else {
        const err = useMessageStore.getState().error || 'Không nhận được phản hồi';
        const errorMessage: ChatbotBubble = {
          id: (Date.now() + 1).toString(),
          role: 'ASSISTANT',
          content:
            err.length > 180
              ? `${err.slice(0, 180)}…`
              : err,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch {
      Toast.show({ type: 'error', text1: 'Lỗi mạng', text2: 'Vui lòng thử lại' });
      const errorMessage: ChatbotBubble = {
        id: (Date.now() + 1).toString(),
        role: 'ASSISTANT',
        content: 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra mạng.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  }, [inputText, loading, sendChatbotMessage, loadQuota]);

  const renderMessage = useCallback(({ item }: { item: ChatbotBubble }) => {
    const isBot = item.role === 'ASSISTANT';

    return (
      <View
        style={[tw`flex-row mb-4`, isBot ? tw`justify-start` : tw`justify-end`]}
      >
        {isBot && (
          <View
            style={[
              tw`w-8 h-8 rounded-full items-center justify-center mr-2`,
              { backgroundColor: COLORS.primary },
            ]}
          >
            <Bot size={18} color="white" />
          </View>
        )}

        <View
          style={[
            tw`max-w-[90%] rounded-2xl px-4 py-3`,
            isBot ? tw`bg-gray-100` : [{ backgroundColor: COLORS.primary }],
          ]}
        >
          {isBot ? (
            <BotMessageBody text={item.content} />
          ) : (
            <Text style={tw`text-base text-white`}>{item.content}</Text>
          )}
          {isBot && item.listings && item.listings.length > 0 ? (
            <ListingCardsBlock listings={item.listings} />
          ) : null}
          <Text
            style={[
              tw`text-xs mt-1`,
              isBot ? tw`text-gray-500` : tw`text-white opacity-70`,
            ]}
          >
            {new Date(item.timestamp).toLocaleTimeString('vi-VN', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>

        {!isBot && (
          <View
            style={[
              tw`w-8 h-8 rounded-full items-center justify-center ml-2`,
              { backgroundColor: COLORS.accent },
            ]}
          >
            <User size={18} color="white" />
          </View>
        )}
      </View>
    );
  }, []);

  const listEmpty = messages.length === 0 && !historyLoading;

  return (
    <SafeAreaView style={tw`flex-1 bg-white`} edges={['top']}>
      <View style={tw`px-4 py-3 border-b border-gray-200`}>
        <View style={tw`flex-row items-center justify-between`}>
          <View style={tw`flex-row items-center flex-1`}>
            <View
              style={[
                tw`w-10 h-10 rounded-full items-center justify-center mr-3`,
                { backgroundColor: COLORS.primary },
              ]}
            >
              <Bot size={24} color="white" />
            </View>
            <View style={tw`flex-1`}>
              <Text style={tw`text-xl font-bold text-gray-900`}>VeloBike AI</Text>
              <Text style={tw`text-sm text-gray-500`}>
                {remaining === null
                  ? 'Đang tải hạn mức…'
                  : remaining === -1
                    ? 'Gói Premium — không giới hạn tin'
                    : `Còn ${remaining} tin hôm nay`}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView
        style={tw`flex-1`}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        {historyLoading ? (
          <View style={tw`flex-1 items-center justify-center`}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={tw`text-gray-500 mt-3`}>Đang tải lịch sử…</Text>
          </View>
        ) : listEmpty ? (
          <View style={tw`flex-1 items-center justify-center px-6`}>
            <Bot size={64} color={COLORS.primary} />
            <Text style={tw`text-xl font-bold text-gray-900 mt-4 text-center`}>
              Xin chào!
            </Text>
            <Text style={tw`text-base text-gray-600 mt-2 text-center`}>
              Tôi có thể gợi ý xe, quy trình mua bán và kiểm định — giống trợ lý trên web VeloBike.
            </Text>
            <View style={tw`flex-row flex-wrap justify-center gap-2 mt-6`}>
              {['Định giá xe đạp', 'Quy trình kiểm định', 'Làm sao để bán xe?'].map(q => (
                <TouchableOpacity
                  key={q}
                  style={tw`bg-gray-100 px-3 py-2 rounded-full border border-gray-200`}
                  onPress={() => setInputText(q)}
                >
                  <Text style={tw`text-xs text-gray-800`}>{q}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item, index) => item.id || `${item.role}-${index}`}
            renderItem={renderMessage}
            contentContainerStyle={tw`px-4 py-4 pb-2`}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() =>
              flatListRef.current?.scrollToEnd({ animated: true })
            }
          />
        )}

        {loading && (
          <View style={tw`flex-row items-center px-4 mb-2`}>
            <View
              style={[
                tw`w-8 h-8 rounded-full items-center justify-center mr-2`,
                { backgroundColor: COLORS.primary },
              ]}
            >
              <Bot size={18} color="white" />
            </View>
            <View style={tw`bg-gray-100 rounded-2xl px-4 py-3`}>
              <ActivityIndicator size="small" color={COLORS.primary} />
            </View>
          </View>
        )}

        <View style={tw`px-4 py-3 border-t border-gray-200 flex-row items-end gap-3`}>
          <View style={tw`flex-1 bg-gray-100 rounded-2xl px-4 py-2 max-h-28`}>
            <TextInput
              style={tw`text-base text-gray-900 min-h-[40px]`}
              placeholder="Nhập tin nhắn…"
              placeholderTextColor={COLORS.textSecondary}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={2000}
              editable={!loading && !historyLoading}
            />
          </View>
          <TouchableOpacity
            style={[
              tw`w-12 h-12 rounded-full items-center justify-center mb-0.5`,
              {
                backgroundColor:
                  inputText.trim() && !loading && !historyLoading
                    ? COLORS.primary
                    : COLORS.textSecondary,
              },
            ]}
            onPress={handleSend}
            disabled={!inputText.trim() || loading || historyLoading}
          >
            <Send size={20} color="white" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
