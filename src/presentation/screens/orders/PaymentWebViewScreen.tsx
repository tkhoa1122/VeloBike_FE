import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, BackHandler } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { X, AlertCircle } from 'lucide-react-native';
import tw from 'twrnc';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../../../config/theme';
import Toast from 'react-native-toast-message';

// Dùng chung cho cả Order payment và Subscription payment
type RootStackParamList = {
  PaymentWebView: {
    paymentLink: string;
    orderCode: number;
    orderId?: string;           // Dùng cho order payment
    type?: 'order' | 'subscription'; // Mặc định 'order'
  };
  PaymentSuccess: { orderId: string; orderCode?: number };
  SubscriptionSuccess: { orderCode: number };
  Orders: undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, 'PaymentWebView'>;

export default function PaymentWebViewScreen({ navigation, route }: Props) {
  const { paymentLink, orderCode, orderId, type = 'order' } = route.params;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const WebViewComponent = useMemo(() => {
    try {
      return require('react-native-webview').WebView;
    } catch {
      return null;
    }
  }, []);

  // Lưu thông tin pending payment vào AsyncStorage
  useEffect(() => {
    const storePendingPayment = async () => {
      try {
        if (type === 'subscription') {
          await AsyncStorage.setItem('pendingSubscriptionOrderCode', orderCode.toString());
          console.log('Stored pending subscription:', { orderCode });
        } else {
          if (orderId) await AsyncStorage.setItem('pendingOrderId', orderId);
          await AsyncStorage.setItem('pendingOrderCode', orderCode.toString());
          console.log('Stored pending order payment:', { orderId, orderCode });
        }
      } catch (err) {
        console.error('Failed to store pending payment:', err);
      }
    };
    storePendingPayment();
  }, [orderId, orderCode, type]);

  // Detect URL thanh toán thành công cho ORDER
  const isOrderSuccessUrl = (url: string): boolean => {
    const normalized = url.toLowerCase();
    return (
      normalized.includes('/payment/success') ||
      (normalized.includes('status=paid') && !normalized.includes('/subscription')) ||
      (normalized.includes('status=success') && !normalized.includes('/subscription'))
    );
  };

  // Detect URL thanh toán thành công cho SUBSCRIPTION
  const isSubscriptionSuccessUrl = (url: string): boolean => {
    const normalized = url.toLowerCase();
    return (
      normalized.includes('/subscription/success') ||
      normalized.includes('subscriptionsuccess')
    );
  };

  // Detect URL cancel/fail
  const isPaymentCancelOrFailedUrl = (url: string): boolean => {
    const normalized = url.toLowerCase();
    return (
      normalized.includes('/payment/cancel') ||
      normalized.includes('/payment/failed') ||
      normalized.includes('/subscription/cancel') ||
      normalized.includes('status=cancelled') ||
      normalized.includes('status=failed')
    );
  };

  const handleNavigationStateChange = (navState: any) => {
    const { url } = navState;
    console.log('[PaymentWebView] URL:', url, '| type:', type);

    if (type === 'subscription') {
      // Subscription flow: detect /subscription/success hoặc status=PAID
      if (isSubscriptionSuccessUrl(url) || url.toLowerCase().includes('status=paid')) {
        AsyncStorage.removeItem('pendingSubscriptionOrderCode').catch(console.error);
        navigation.replace('SubscriptionSuccess', { orderCode });
      } else if (isPaymentCancelOrFailedUrl(url)) {
        Toast.show({ type: 'error', text1: 'Thanh toán chưa hoàn tất', text2: 'Vui lòng thử lại' });
        navigation.goBack();
      }
    } else {
      // Order flow: detect /payment/success hoặc status=PAID
      if (isOrderSuccessUrl(url)) {
        navigation.replace('PaymentSuccess', { orderId: orderId!, orderCode });
      } else if (isPaymentCancelOrFailedUrl(url)) {
        Toast.show({ type: 'error', text1: 'Thanh toán chưa hoàn tất', text2: 'Bạn có thể thử lại' });
        AsyncStorage.multiRemove(['pendingOrderId', 'pendingOrderCode']).catch(console.error);
        navigation.goBack();
      }
    }
  };

  const handleClose = () => {
    navigation.goBack();
  };

  React.useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      handleClose();
      return true;
    });
    return () => backHandler.remove();
  }, []);

  const title = type === 'subscription' ? 'Nâng cấp gói' : 'Thanh toán PayOS';

  return (
    <SafeAreaView style={tw`flex-1 bg-white`}>
      {/* Header */}
      <View style={tw`flex-row items-center justify-between px-4 py-3 border-b border-gray-200`}>
        <Text style={tw`text-lg font-bold text-gray-900`}>{title}</Text>
        <TouchableOpacity onPress={handleClose} style={tw`p-2`}>
          <X size={24} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      {WebViewComponent ? (
        <>
          <WebViewComponent
            source={{ uri: paymentLink }}
            onNavigationStateChange={handleNavigationStateChange}
            onLoadStart={() => { setLoading(true); setError(false); }}
            onLoadEnd={() => setLoading(false)}
            onError={() => { setLoading(false); setError(true); }}
            startInLoadingState={true}
            renderLoading={() => (
              <View style={tw`absolute inset-0 items-center justify-center bg-white`}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={tw`text-gray-500 mt-4`}>Đang tải cổng thanh toán...</Text>
              </View>
            )}
          />
          {error && (
            <View style={tw`absolute inset-x-4 bottom-6 bg-red-50 border border-red-200 rounded-xl p-3`}>
              <Text style={tw`text-red-700 text-sm`}>Không thể tải cổng thanh toán, vui lòng thử lại.</Text>
            </View>
          )}
        </>
      ) : (
        <View style={tw`flex-1 items-center justify-center bg-gray-50 px-6`}>
          <AlertCircle size={64} color={COLORS.warning} />
          <Text style={tw`text-lg font-bold text-gray-900 mt-4 text-center`}>
            WebView chưa được cài đặt
          </Text>
          <Text style={tw`text-sm text-gray-600 mt-2 text-center`}>
            Vui lòng chạy:{'\n'}npm install react-native-webview
          </Text>
          <Text style={tw`text-xs text-gray-400 mt-4 text-center`}>
            Payment Link: {paymentLink}
          </Text>
          <TouchableOpacity
            style={[tw`rounded-xl px-8 py-3 mt-6`, { backgroundColor: COLORS.primary }]}
            onPress={handleClose}
          >
            <Text style={tw`text-white font-bold`}>Đóng</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}
