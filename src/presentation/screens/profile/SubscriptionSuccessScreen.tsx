/**
 * Subscription Success Screen
 * Polling verify-payment sau khi user thanh toán xong trên PayOS WebView
 * Giống hệt SubscriptionSuccess.tsx của Web FE
 */
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CheckCircle, AlertTriangle, Crown, RefreshCw, User } from 'lucide-react-native';
import tw from 'twrnc';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../../../config/theme';
import Toast from 'react-native-toast-message';
import { ENV } from '../../../config/environment';

type RootStackParamList = {
  SubscriptionSuccess: { orderCode: number };
  SubscriptionPlans: undefined;
  Profile: undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, 'SubscriptionSuccess'>;

export default function SubscriptionSuccessScreen({ navigation, route }: Props) {
  const { orderCode } = route.params;
  const [status, setStatus] = useState<'loading' | 'success' | 'timeout'>('loading');
  const [planName, setPlanName] = useState<string>('');
  const [pollCount, setPollCount] = useState(0);
  const pollCountRef = useRef(0);
  const maxPolls = 15; // 15 * 2s = 30s
  const activated = useRef(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const tryActivate = useCallback(async (): Promise<boolean> => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      if (!token) return false;

      const res = await fetch(`${ENV.API_BASE_URL}/subscriptions/verify-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ orderCode: Number(orderCode) }),
      });

      const data = await res.json();
      console.log('[SubscriptionSuccess] verify-payment:', data);

      if (data.success) {
        setPlanName(data.data?.planName || '');
        return true;
      }
      return false;
    } catch (err) {
      console.error('[SubscriptionSuccess] verify error:', err);
      return false;
    }
  }, [orderCode]);

  const runPoll = useCallback(async () => {
    if (activated.current) return;

    if (pollCountRef.current >= maxPolls) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setStatus('timeout');
      Toast.show({ type: 'info', text1: 'Thanh toán nhận được', text2: 'Gói sẽ được kích hoạt sớm' });
      return;
    }

    pollCountRef.current++;
    setPollCount(pollCountRef.current);

    const ok = await tryActivate();
    if (ok && !activated.current) {
      activated.current = true;
      if (intervalRef.current) clearInterval(intervalRef.current);
      setStatus('success');
      AsyncStorage.removeItem('pendingSubscriptionOrderCode').catch(console.error);
      Toast.show({ type: 'success', text1: 'Kích hoạt thành công!', text2: 'Gói đăng ký đang hoạt động' });
    }
  }, [tryActivate]);

  // Nút Cập nhật thủ công: reset và thử lại
  const handleManualRefresh = useCallback(async () => {
    if (activated.current) return;
    Toast.show({ type: 'info', text1: 'Đang kiểm tra...' });
    const ok = await tryActivate();
    if (ok) {
      activated.current = true;
      if (intervalRef.current) clearInterval(intervalRef.current);
      setStatus('success');
      AsyncStorage.removeItem('pendingSubscriptionOrderCode').catch(console.error);
      Toast.show({ type: 'success', text1: 'Kích hoạt thành công!' });
    } else {
      Toast.show({ type: 'info', text1: 'Chưa xác nhận', text2: 'Hệ thống đang xử lý, vui lòng thử lại sau' });
    }
  }, [tryActivate]);

  useEffect(() => {
    if (!orderCode) {
      navigation.replace('SubscriptionPlans');
      return;
    }

    // Poll ngay lần đầu
    runPoll();

    intervalRef.current = setInterval(runPoll, 2000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [orderCode]);

  // ─── Loading state ─────────────────────────────────────────────────────────
  if (status === 'loading') {
    return (
      <SafeAreaView style={tw`flex-1 bg-gray-50 items-center justify-center px-6`}>
        <View style={tw`bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm items-center`}>
          <ActivityIndicator size="large" color={COLORS.primary} style={tw`mb-4`} />
          <Text style={tw`text-xl font-bold text-gray-900 mb-2`}>Đang kích hoạt gói...</Text>
          <Text style={tw`text-gray-500 text-sm text-center mb-2`}>
            Vui lòng chờ, đừng đóng màn hình này.
          </Text>
          {/* Progress bar */}
          <View style={tw`w-full bg-gray-200 rounded-full h-2 mb-1`}>
            <View
              style={[
                tw`h-2 rounded-full`,
                { backgroundColor: COLORS.primary, width: `${Math.min((pollCount / maxPolls) * 100, 100)}%` }
              ]}
            />
          </View>
          <Text style={tw`text-xs text-gray-400 mb-6`}>({pollCount}/{maxPolls})</Text>

          {/* Nút thủ công hiện sau 3 lần poll */}
          {pollCount >= 3 && (
            <TouchableOpacity
              style={[tw`w-full rounded-xl py-3 flex-row items-center justify-center`, { backgroundColor: COLORS.primary }]}
              onPress={handleManualRefresh}
            >
              <RefreshCw size={16} color="white" />
              <Text style={tw`text-white font-bold ml-2`}>Cập nhật trạng thái</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    );
  }

  // ─── Timeout state ─────────────────────────────────────────────────────────
  if (status === 'timeout') {
    return (
      <SafeAreaView style={tw`flex-1 bg-gray-50 items-center justify-center px-6`}>
        <View style={tw`bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm items-center`}>
          <AlertTriangle size={56} color="#F59E0B" style={tw`mb-4`} />
          <Text style={tw`text-xl font-bold text-gray-900 mb-2`}>Đã nhận thanh toán</Text>
          <Text style={tw`text-gray-600 text-sm text-center mb-6`}>
            Thanh toán đã xử lý nhưng gói có thể cần thêm chút thời gian để kích hoạt. Nhấn bên dưới để kiểm tra lại.
          </Text>
          <TouchableOpacity
            style={[tw`w-full rounded-xl py-3 flex-row items-center justify-center mb-3`, { backgroundColor: COLORS.primary }]}
            onPress={handleManualRefresh}
          >
            <RefreshCw size={16} color="white" />
            <Text style={tw`text-white font-bold ml-2`}>Cập nhật trạng thái</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={tw`w-full rounded-xl py-3 items-center border-2 border-gray-300`}
            onPress={() => navigation.replace('SubscriptionPlans')}
          >
            <Text style={tw`text-gray-700 font-bold`}>Xem gói đăng ký</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Success state ─────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={tw`flex-1 bg-gray-50 items-center justify-center px-6`}>
      <View style={tw`bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm items-center`}>
        <View style={tw`w-16 h-16 bg-green-100 rounded-full items-center justify-center mb-4`}>
          <CheckCircle size={40} color="#16A34A" />
        </View>
        <Crown size={32} color="#D97706" style={tw`mb-3`} />
        <Text style={tw`text-2xl font-bold text-gray-900 mb-2`}>Kích hoạt thành công!</Text>
        {planName ? (
          <Text style={tw`text-gray-600 mb-1`}>
            Bạn đang dùng gói{' '}
            <Text style={tw`font-bold text-gray-900`}>{planName}</Text>
          </Text>
        ) : null}
        <Text style={tw`text-gray-500 text-sm mb-8 text-center`}>
          Gói đăng ký mới của bạn đã hoạt động và sẵn sàng sử dụng.
        </Text>

        <TouchableOpacity
          style={[tw`w-full rounded-xl py-3 flex-row items-center justify-center`, { backgroundColor: COLORS.primary }]}
          onPress={() => navigation.replace('Profile')}
        >
          <User size={16} color="white" />
          <Text style={tw`text-white font-bold text-base ml-2`}>Trở về profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
