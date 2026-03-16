import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, BackHandler } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { X, AlertCircle } from 'lucide-react-native';
import tw from 'twrnc';
import { COLORS } from '../../../config/theme';
import Toast from 'react-native-toast-message';

// NOTE: Cần cài: npm install react-native-webview
// import { WebView } from 'react-native-webview';

type RootStackParamList = {
  PaymentWebView: { paymentLink: string; orderCode: number; orderId: string };
  PaymentSuccess: { orderId: string };
  Orders: undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, 'PaymentWebView'>;

export default function PaymentWebViewScreen({ navigation, route }: Props) {
  const { paymentLink, orderCode, orderId } = route.params;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const WebViewComponent = useMemo(() => {
    try {
      return require('react-native-webview').WebView;
    } catch {
      return null;
    }
  }, []);

  const isPaymentSuccessUrl = (url: string): boolean => {
    const normalized = url.toLowerCase();
    return (
      normalized.includes('/payment/success') ||
      normalized.includes('status=paid') ||
      normalized.includes('status=success')
    );
  };

  const isPaymentCancelOrFailedUrl = (url: string): boolean => {
    const normalized = url.toLowerCase();
    return (
      normalized.includes('/payment/cancel') ||
      normalized.includes('/payment/failed') ||
      normalized.includes('status=cancelled') ||
      normalized.includes('status=failed')
    );
  };

  const handleNavigationStateChange = (navState: any) => {
    const { url } = navState;

    // Check for payment success/failure callbacks
    if (isPaymentSuccessUrl(url)) {
      navigation.replace('PaymentSuccess', { orderId });
    } else if (isPaymentCancelOrFailedUrl(url)) {
      Toast.show({
        type: 'error',
        text1: 'Thanh toán chưa hoàn tất',
        text2: 'Bạn có thể thử lại giao dịch',
      });
      navigation.goBack();
    }
  };

  const handleClose = () => {
    navigation.goBack();
  };

  // Prevent back button
  React.useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      handleClose();
      return true;
    });

    return () => backHandler.remove();
  }, []);

  return (
    <SafeAreaView style={tw`flex-1 bg-white`}>
      {/* Header */}
      <View style={tw`flex-row items-center justify-between px-4 py-3 border-b border-gray-200`}>
        <Text style={tw`text-lg font-bold text-gray-900`}>Thanh toán PayOS</Text>
        <TouchableOpacity onPress={handleClose} style={tw`p-2`}>
          <X size={24} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      {WebViewComponent ? (
        <>
          <WebViewComponent
            source={{ uri: paymentLink }}
            onNavigationStateChange={handleNavigationStateChange}
            onLoadStart={() => {
              setLoading(true);
              setError(false);
            }}
            onLoadEnd={() => setLoading(false)}
            onError={() => {
              setLoading(false);
              setError(true);
            }}
            startInLoadingState={true}
            renderLoading={() => (
              <View style={tw`flex-1 items-center justify-center`}>
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
        <View style={tw`flex-1 items-center justify-center bg-gray-50`}>
          <AlertCircle size={64} color={COLORS.warning} />
          <Text style={tw`text-lg font-bold text-gray-900 mt-4 px-6 text-center`}>
            WebView chưa được cài đặt
          </Text>
          <Text style={tw`text-sm text-gray-600 mt-2 px-6 text-center`}>
            Vui lòng cài đặt: npm install react-native-webview
          </Text>
          <Text style={tw`text-xs text-gray-500 mt-4 px-6 text-center`}>
            Payment Link: {paymentLink}
          </Text>
          <Text style={tw`text-xs text-gray-500 mt-2 px-6 text-center`}>
            Order Code: {orderCode}
          </Text>

          <TouchableOpacity
            style={[tw`rounded-xl px-8 py-3 mt-6`, { backgroundColor: COLORS.primary }]}
            onPress={() => {
              Toast.show({
                type: 'success',
                text1: 'Demo Mode',
                text2: 'Chuyển đến màn hình thành công...',
              });
              setTimeout(() => {
                navigation.replace('PaymentSuccess', { orderId });
              }, 800);
            }}
          >
            <Text style={tw`text-white font-bold`}>Demo: Thanh toán thành công</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[tw`rounded-xl px-8 py-3 mt-3 border-2 border-gray-300`]}
            onPress={handleClose}
          >
            <Text style={tw`text-gray-700 font-bold`}>Đóng</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}
