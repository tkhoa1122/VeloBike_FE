import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Send, Bot, User } from 'lucide-react-native';
import tw from 'twrnc';
import { COLORS } from '../../../config/theme';
import { useMessageStore } from '../../viewmodels/MessageStore';
import Toast from 'react-native-toast-message';
import { ChatbotConversation, ChatbotMessage } from '../../../domain/entities/Message';

export default function ChatbotScreen() {
  const { sendChatbotMessage, getChatbotHistory } = useMessageStore();
  const [messages, setMessages] = useState<ChatbotMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const history = await getChatbotHistory();
      if (history) {
        // Flatten all messages from conversations
        const allMessages = history.flatMap((conv: ChatbotConversation) => conv.messages);
        setMessages(allMessages);
      }
    } catch (error) {
      console.error('Failed to load chatbot history:', error);
    }
  };

  const handleSend = useCallback(async () => {
    if (!inputText.trim()) return;

    const userMessage: ChatbotMessage = {
      id: Date.now().toString(),
      role: 'USER',
      content: inputText.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setLoading(true);

    try {
      const response = await sendChatbotMessage({
        message: inputText.trim(),
        context: {},
      });

      if (response) {
        const botMessage: ChatbotMessage = {
          id: (Date.now() + 1).toString(),
          role: 'ASSISTANT',
          content: response,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, botMessage]);
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Lỗi chatbot',
        text2: error instanceof Error ? error.message : 'Vui lòng thử lại',
      });

      // Add error message from bot
      const errorMessage: ChatbotMessage = {
        id: (Date.now() + 1).toString(),
        role: 'ASSISTANT',
        content: 'Xin lỗi, tôi đang gặp sự cố. Vui lòng thử lại sau.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  }, [inputText, sendChatbotMessage]);

  const renderMessage = useCallback(
    ({ item }: { item: ChatbotMessage }) => {
      const isBot = item.role === 'ASSISTANT';

      return (
        <View
          style={[
            tw`flex-row mb-4`,
            isBot ? tw`justify-start` : tw`justify-end`,
          ]}
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
              tw`max-w-3/4 rounded-2xl px-4 py-3`,
              isBot
                ? tw`bg-gray-100`
                : [tw`items-end`, { backgroundColor: COLORS.primary }],
            ]}
          >
            <Text
              style={[
                tw`text-base`,
                isBot ? tw`text-gray-900` : tw`text-white`,
              ]}
            >
              {item.content}
            </Text>
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
    },
    []
  );

  return (
    <SafeAreaView style={tw`flex-1 bg-white`}>
      {/* Header */}
      <View style={tw`px-4 py-3 border-b border-gray-200`}>
        <View style={tw`flex-row items-center`}>
          <View
            style={[
              tw`w-10 h-10 rounded-full items-center justify-center mr-3`,
              { backgroundColor: COLORS.primary },
            ]}
          >
            <Bot size={24} color="white" />
          </View>
          <View>
            <Text style={tw`text-xl font-bold text-gray-900`}>
              VeloBike Assistant
            </Text>
            <Text style={tw`text-sm text-green-600`}>Sẵn sàng hỗ trợ 24/7</Text>
          </View>
        </View>
      </View>

      {/* Welcome Message */}
      {messages.length === 0 && (
        <View style={tw`flex-1 items-center justify-center px-6`}>
          <Bot size={64} color={COLORS.primary} />
          <Text style={tw`text-xl font-bold text-gray-900 mt-4 text-center`}>
            Xin chào! 👋
          </Text>
          <Text style={tw`text-base text-gray-600 mt-2 text-center`}>
            Tôi là trợ lý ảo của VeloBike. Tôi có thể giúp bạn:
          </Text>
          <View style={tw`mt-4 gap-2`}>
            {[
              'Tìm xe đạp phù hợp',
              'Tư vấn size xe',
              'Hỗ trợ đặt hàng',
              'Giải đáp thắc mắc',
            ].map((item, index) => (
              <Text key={index} style={tw`text-sm text-gray-700`}>
                • {item}
              </Text>
            ))}
          </View>
          <Text style={tw`text-sm text-gray-500 mt-6 text-center`}>
            Hãy hỏi tôi bất cứ điều gì! 😊
          </Text>
        </View>
      )}

      <KeyboardAvoidingView
        style={tw`flex-1`}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {/* Messages List */}
        {messages.length > 0 && (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item, index) => item.id || `${item.role}-${index}`}
            renderItem={renderMessage}
            contentContainerStyle={tw`px-4 py-4`}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() =>
              flatListRef.current?.scrollToEnd({ animated: true })
            }
            onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
          />
        )}

        {/* Typing Indicator */}
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

        {/* Input Bar */}
        <View style={tw`px-4 py-3 border-t border-gray-200 flex-row items-center gap-3`}>
          <View style={tw`flex-1 bg-gray-100 rounded-full px-4 py-2`}>
            <TextInput
              style={tw`text-base text-gray-900`}
              placeholder="Nhập câu hỏi..."
              placeholderTextColor={COLORS.textSecondary}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
              editable={!loading}
            />
          </View>
          <TouchableOpacity
            style={[
              tw`w-12 h-12 rounded-full items-center justify-center`,
              {
                backgroundColor:
                  inputText.trim() && !loading
                    ? COLORS.primary
                    : COLORS.textSecondary,
              },
            ]}
            onPress={handleSend}
            disabled={!inputText.trim() || loading}
          >
            <Send
              size={20}
              color="white"
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
