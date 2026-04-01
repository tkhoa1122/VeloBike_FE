import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Animated, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CheckCircle, Package, Home, Loader2, AlertTriangle, RefreshCw } from 'lucide-react-native';
import tw from 'twrnc';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { COLORS } from '../../../config/theme';
import { ENV } from '../../../config/environment';

type RootStackParamList = {
  PaymentSuccess: { orderId: string; orderCode?: string };
  OrderDetail: { orderId: string };
  Orders: undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, 'PaymentSuccess'>;

type PaymentStatus = 'loading' | 'success' | 'timeout' | 'error';

interface OrderData {
  _id: string;
  status: string;
  financials: {
    itemPrice: number;
    shippingFee: number;
    platformFee: number;
    inspectionFee?: number;
    totalAmount: number;
  };
  inspectionRequired?: boolean;
}

export default function PaymentSuccessScreen({ navigation, route }: Props) {
  const { orderId, orderCode } = route.params;
  const scaleAnim = useRef(new Animated.Value(0)).current;
  
  // Payment verification states
  const [status, setStatus] = useState<PaymentStatus>('loading');
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [pollCount, setPollCount] = useState(0);
  const maxPolls = 20; // 20 * 2s = 40s timeout
  const pollInterval = useRef<NodeJS.Timeout | null>(null);
  const isPolling = useRef(true);

  useEffect(() => {
    // Success animation
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();
    
    // Start polling for payment verification
    startPolling();
    
    return () => {
      if (pollInterval.current) {
        clearInterval(pollInterval.current);
      }
      isPolling.current = false;
    };
  }, []);

  const getToken = async (): Promise<string> => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      return token || '';
    } catch (error) {
      console.error('Error getting token:', error);
      return '';
    }
  };

  const startPolling = async () => {
    // Initial check
    await verifyPayment();
    
    // Start polling
    pollInterval.current = setInterval(async () => {
      if (!isPolling.current || pollCount >= maxPolls) {
        if (pollInterval.current) {
          clearInterval(pollInterval.current);
        }
        if (pollCount >= maxPolls && status === 'loading') {
          setStatus('timeout');
          Toast.show({
            type: 'warning',
            text1: 'Đang xử lý',
            text2: 'Thanh toán đã nhận, đơn hàng có thể cần thêm thời gian để cập nhật.',
          });
        }
        return;
      }
      
      await verifyPayment();
      setPollCount(prev => prev + 1);
    }, 2000); // Poll every 2 seconds
  };

  const verifyPayment = async () => {
    try {
      const token = await getToken();
      
      // Get pending order ID from storage if not in params
      const finalOrderId = orderId || await AsyncStorage.getItem('pendingOrderId');
      
      if (!finalOrderId) {
        setStatus('error');
        return;
      }

      // 1. Fetch order details
      const response = await fetch(`${ENV.API_BASE_URL}/orders/${finalOrderId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch order');
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        const order = result.data;
        setOrderData(order);

        // Check if order is already paid/locked
        const successStatuses = ['ESCROW_LOCKED', 'IN_INSPECTION', 'INSPECTION_PASSED'];
        if (successStatuses.includes(order.status)) {
          setStatus('success');
          isPolling.current = false;
          
          // Cleanup
          await AsyncStorage.removeItem('pendingOrderId');
          await AsyncStorage.removeItem('pendingOrderCode');
          
          return;
        }

        // If still CREATED, try PayOS sync
        if (order.status === 'CREATED') {
          await tryPayOSSync(finalOrderId, token);
        }
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
      // Don't set error status immediately, keep polling
    }
  };

  const tryPayOSSync = async (finalOrderId: string, token: string) => {
    try {
      // Get orderCode from params or storage
      let finalOrderCode = orderCode;
      if (!finalOrderCode) {
        finalOrderCode = await AsyncStorage.getItem('pendingOrderCode');
      }

      if (!finalOrderCode) {
        console.log('No order code found, skipping PayOS sync');
        return;
      }

      // Check PayOS payment status
      const infoResponse = await fetch(`${ENV.API_BASE_URL}/payment/info/${finalOrderCode}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!infoResponse.ok) {
        return;
      }

      const infoResult = await infoResponse.json();
      
      // If PayOS says PAID but our order is still CREATED, trigger webhook manually
      if (infoResult.data?.status === 'PAID') {
        console.log('PayOS is PAID, triggering webhook manually...');
        
        const webhookBody = {
          code: '00000',
          orderCode: Number(finalOrderCode),
          data: infoResult.data,
        };

        await fetch(`${ENV.API_BASE_URL}/payment/webhook`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(webhookBody),
        });

        // Fetch order again after webhook
        setTimeout(() => verifyPayment(), 1000);
      }
    } catch (error) {
      console.error('Error in PayOS sync:', error);
    }
  };

  const handleRetry = () => {
    setPollCount(0);
    setStatus('loading');
    isPolling.current = true;
    startPolling();
  };

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

  // Loading state
  if (status === 'loading') {
    return (
      <SafeAreaView style={tw`flex-1 bg-white`}>
        <View style={tw`flex-1 items-center justify-center px-6`}>
          <View style={tw`w-20 h-20 bg-blue-50 rounded-full items-center justify-center mb-4`}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
          <Text style={tw`text-xl font-bold text-gray-900 mb-2`}>
            Đang xác nhận thanh toán...
          </Text>
          <Text style={tw`text-sm text-gray-600 text-center mb-6`}>
            Hệ thống đang xác nhận giao dịch của bạn.{'\n'}
            Nếu mất quá lâu, nhấn nút bên dưới để kiểm tra thủ công.
          </Text>
          <View style={tw`w-full bg-gray-200 rounded-full h-2 mb-1`}>
            <View style={[tw`bg-green-500 h-2 rounded-full`, { width: `${Math.min((pollCount / maxPolls) * 100, 100)}%` }]} />
          </View>
          <Text style={tw`text-xs text-gray-400 mb-6`}>
            ({pollCount}/{maxPolls})
          </Text>

          {/* Nút thủ công - hiện sau 3 lần poll */}
          {pollCount >= 3 && (
            <TouchableOpacity
              style={[tw`w-full rounded-xl py-4 flex-row items-center justify-center`, { backgroundColor: COLORS.primary }]}
              onPress={handleRetry}
            >
              <RefreshCw size={18} color="white" />
              <Text style={tw`text-white text-base font-bold ml-2`}>
                Cập nhật trạng thái
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    );
  }

  // Timeout state
  if (status === 'timeout') {
    return (
      <SafeAreaView style={tw`flex-1 bg-white`}>
        <View style={tw`flex-1 items-center justify-center px-6`}>
          <View style={tw`w-20 h-20 bg-yellow-50 rounded-full items-center justify-center mb-4`}>
            <AlertTriangle size={40} color={COLORS.warning} />
          </View>
          <Text style={tw`text-xl font-bold text-gray-900 mb-2`}>
            Thanh toán đã nhận
          </Text>
          <Text style={tw`text-sm text-gray-600 text-center mb-6`}>
            Giao dịch của bạn đã được xử lý nhưng đơn hàng có thể cần thêm thời gian để cập nhật. 
            Vui lòng kiểm tra lại trang đơn hàng.
          </Text>
          
          <View style={tw`w-full gap-3`}>
            <TouchableOpacity
              style={[tw`rounded-xl py-4 flex-row items-center justify-center`, { backgroundColor: COLORS.primary }]}
              onPress={handleRetry}
            >
              <RefreshCw size={20} color="white" />
              <Text style={tw`text-white text-base font-bold ml-2`}>
                Kiểm tra lại
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={tw`rounded-xl py-4 flex-row items-center justify-center border-2 border-gray-300`}
              onPress={handleViewOrders}
            >
              <Package size={20} color={COLORS.text} />
              <Text style={tw`text-gray-700 text-base font-bold ml-2`}>
                Xem đơn hàng
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={tw`text-xs text-gray-500 text-center mt-6`}>
            Cần hỗ trợ? Liên hệ{' '}
            <Text style={tw`text-green-600 font-semibold`}>support@velobike.vn</Text>
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (status === 'error') {
    return (
      <SafeAreaView style={tw`flex-1 bg-white`}>
        <View style={tw`flex-1 items-center justify-center px-6`}>
          <View style={tw`w-20 h-20 bg-red-50 rounded-full items-center justify-center mb-4`}>
            <AlertTriangle size={40} color={COLORS.error} />
          </View>
          <Text style={tw`text-xl font-bold text-gray-900 mb-2`}>
            Có lỗi xảy ra
          </Text>
          <Text style={tw`text-sm text-gray-600 text-center mb-6`}>
            Không thể xác nhận thanh toán. Vui lòng thử lại hoặc liên hệ hỗ trợ.
          </Text>
          
          <View style={tw`w-full gap-3`}>
            <TouchableOpacity
              style={[tw`rounded-xl py-4 flex-row items-center justify-center`, { backgroundColor: COLORS.primary }]}
              onPress={handleRetry}
            >
              <RefreshCw size={20} color="white" />
              <Text style={tw`text-white text-base font-bold ml-2`}>
                Thử lại
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
      </SafeAreaView>
    );
  }

  // Success state

  // Success state
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
          Đơn hàng của bạn đã được xác nhận và đang được xử lý
        </Text>
        <Text style={tw`text-sm text-gray-500 text-center mb-8`}>
          Mã đơn hàng: <Text style={tw`font-semibold`}>#{orderId.slice(-8)}</Text>
        </Text>

        {/* Order Details if available */}
        {orderData && (
          <View style={tw`w-full bg-gray-50 rounded-xl p-4 mb-6`}>
            <Text style={tw`text-sm font-semibold text-gray-900 mb-3`}>
              Thông tin đơn hàng
            </Text>
            <View style={tw`gap-2`}>
              <View style={tw`flex-row justify-between`}>
                <Text style={tw`text-sm text-gray-600`}>Giá sản phẩm</Text>
                <Text style={tw`text-sm font-semibold text-gray-900`}>
                  {orderData.financials.itemPrice.toLocaleString('vi-VN')} đ
                </Text>
              </View>
              {orderData.financials.inspectionFee ? (
                <View style={tw`flex-row justify-between`}>
                  <Text style={tw`text-sm text-gray-600`}>Phí kiểm định</Text>
                  <Text style={tw`text-sm font-semibold text-gray-900`}>
                    {orderData.financials.inspectionFee.toLocaleString('vi-VN')} đ
                  </Text>
                </View>
              ) : null}
              <View style={tw`flex-row justify-between`}>
                <Text style={tw`text-sm text-gray-600`}>Phí vận chuyển</Text>
                <Text style={tw`text-sm font-semibold text-gray-900`}>
                  {orderData.financials.shippingFee.toLocaleString('vi-VN')} đ
                </Text>
              </View>
              <View style={tw`flex-row justify-between pt-2 border-t border-gray-200`}>
                <Text style={tw`text-base font-bold text-gray-900`}>Tổng cộng</Text>
                <Text style={tw`text-base font-bold text-green-600`}>
                  {orderData.financials.totalAmount.toLocaleString('vi-VN')} đ
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Next Steps */}
        <View style={tw`w-full bg-blue-50 rounded-xl p-4 mb-6`}>
          <Text style={tw`text-sm font-semibold text-gray-900 mb-2`}>
            Tiếp theo sẽ như thế nào?
          </Text>
          <View style={tw`gap-2`}>
            {orderData?.inspectionRequired ? (
              <>
                <View style={tw`flex-row items-start`}>
                  <Text style={tw`text-blue-600 font-bold mr-2`}>1.</Text>
                  <Text style={tw`text-sm text-gray-700 flex-1`}>
                    Đơn hàng sẽ được gửi đến cơ sở kiểm định
                  </Text>
                </View>
                <View style={tw`flex-row items-start`}>
                  <Text style={tw`text-blue-600 font-bold mr-2`}>2.</Text>
                  <Text style={tw`text-sm text-gray-700 flex-1`}>
                    Sau khi kiểm định đạt, người bán sẽ giao hàng
                  </Text>
                </View>
                <View style={tw`flex-row items-start`}>
                  <Text style={tw`text-blue-600 font-bold mr-2`}>3.</Text>
                  <Text style={tw`text-sm text-gray-700 flex-1`}>
                    Bạn sẽ nhận được thông báo khi có cập nhật
                  </Text>
                </View>
              </>
            ) : (
              <>
                <View style={tw`flex-row items-start`}>
                  <Text style={tw`text-blue-600 font-bold mr-2`}>1.</Text>
                  <Text style={tw`text-sm text-gray-700 flex-1`}>
                    Người bán sẽ chuẩn bị và giao hàng cho bạn
                  </Text>
                </View>
                <View style={tw`flex-row items-start`}>
                  <Text style={tw`text-blue-600 font-bold mr-2`}>2.</Text>
                  <Text style={tw`text-sm text-gray-700 flex-1`}>
                    Bạn sẽ nhận được thông báo khi có cập nhật
                  </Text>
                </View>
              </>
            )}
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

          {/* Nút cập nhật thủ công - để user reload lại trạng thái */}
          <TouchableOpacity
            style={tw`rounded-xl py-4 flex-row items-center justify-center border-2 border-green-400`}
            onPress={handleRetry}
          >
            <RefreshCw size={18} color={COLORS.success} />
            <Text style={tw`text-green-600 text-base font-bold ml-2`}>
              Cập nhật trạng thái
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={tw`rounded-xl py-4 flex-row items-center justify-center border-2 border-gray-300`}
            onPress={() => {
              const tabNav = navigation.getParent();
              if (tabNav) {
                tabNav.navigate('SearchTab' as never);
              }
            }}
          >
            <Text style={tw`text-gray-700 text-base font-bold`}>
              Tiếp tục mua sắm
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
