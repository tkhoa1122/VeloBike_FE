import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CheckCircle, Package, Home } from 'lucide-react-native';
import tw from 'twrnc';
import { COLORS } from '../../../config/theme';

type RootStackParamList = {
  PaymentSuccess: { orderId: string };
  OrderDetail: { orderId: string };
  Orders: undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, 'PaymentSuccess'>;

export default function PaymentSuccessScreen({ navigation, route }: Props) {
  const { orderId } = route.params;
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Success animation
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleViewOrder = () => {
    navigation.replace('OrderDetail', { orderId });
  };

  const handleBackToHome = () => {
    const tabNavigator = navigation.getParent();
    if (tabNavigator) {
      tabNavigator.navigate('HomeTab' as never);
      return;
    }

    navigation.popToTop();
  };

  const handleViewOrders = () => {
    navigation.navigate('Orders');
  };

  return (
    <SafeAreaView style={tw`flex-1 bg-white`}>
      <View style={tw`flex-1 items-center justify-center px-6`}>
        {/* Success Icon with Animation */}
        <Animated.View
          style={[
            tw`items-center justify-center mb-6`,
            { transform: [{ scale: scaleAnim }] },
          ]}
        >
          <View
            style={[
              tw`w-32 h-32 rounded-full items-center justify-center`,
              { backgroundColor: COLORS.success + '20' },
            ]}
          >
            <CheckCircle size={80} color={COLORS.success} strokeWidth={2} />
          </View>
        </Animated.View>

        {/* Success Message */}
        <Text style={tw`text-2xl font-bold text-gray-900 text-center mb-2`}>
          Thanh toán thành công! 🎉
        </Text>
        <Text style={tw`text-base text-gray-600 text-center mb-2`}>
          Đơn hàng của bạn đã được tạo thành công
        </Text>
        <Text style={tw`text-sm text-gray-500 text-center mb-8`}>
          Mã đơn hàng: <Text style={tw`font-semibold`}>#{orderId.slice(-8)}</Text>
        </Text>

        {/* Order Status Info */}
        <View style={tw`w-full bg-green-50 rounded-xl p-4 mb-6`}>
          <Text style={tw`text-sm font-semibold text-gray-900 mb-2`}>
            Tiếp theo sẽ như thế nào?
          </Text>
          <View style={tw`gap-2`}>
            <View style={tw`flex-row items-start`}>
              <Text style={tw`text-green-600 font-bold mr-2`}>1.</Text>
              <Text style={tw`text-sm text-gray-700 flex-1`}>
                Người bán sẽ chuẩn bị hàng và giao cho đơn vị vận chuyển
              </Text>
            </View>
            <View style={tw`flex-row items-start`}>
              <Text style={tw`text-green-600 font-bold mr-2`}>2.</Text>
              <Text style={tw`text-sm text-gray-700 flex-1`}>
                Bạn sẽ nhận được thông báo khi đơn hàng được giao
              </Text>
            </View>
            <View style={tw`flex-row items-start`}>
              <Text style={tw`text-green-600 font-bold mr-2`}>3.</Text>
              <Text style={tw`text-sm text-gray-700 flex-1`}>
                Xác nhận nhận hàng để hoàn tất giao dịch
              </Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={tw`w-full gap-3`}>
          <TouchableOpacity
            style={[
              tw`rounded-xl py-4 flex-row items-center justify-center`,
              { backgroundColor: COLORS.primary },
            ]}
            onPress={handleViewOrder}
          >
            <Package size={20} color="white" />
            <Text style={tw`text-white text-base font-bold ml-2`}>
              Xem chi tiết đơn hàng
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={tw`rounded-xl py-4 flex-row items-center justify-center border-2 border-gray-300`}
            onPress={handleViewOrders}
          >
            <Package size={20} color={COLORS.text} />
            <Text style={tw`text-gray-700 text-base font-bold ml-2`}>
              Xem tất cả đơn hàng
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={tw`rounded-xl py-4 flex-row items-center justify-center`}
            onPress={handleBackToHome}
          >
            <Home size={20} color={COLORS.textSecondary} />
            <Text style={tw`text-gray-600 text-base font-semibold ml-2`}>
              Về trang chủ
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Support Info */}
      <View style={tw`px-6 pb-6`}>
        <Text style={tw`text-xs text-gray-500 text-center`}>
          Cần hỗ trợ? Liên hệ{' '}
          <Text style={tw`text-green-600 font-semibold`}>
            support@velobike.vn
          </Text>
        </Text>
      </View>
    </SafeAreaView>
  );
}
