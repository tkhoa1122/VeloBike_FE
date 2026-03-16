import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CreditCard, Truck, MapPin, Package } from 'lucide-react-native';
import tw from 'twrnc';
import { COLORS } from '../../../config/theme';
import { usePaymentStore } from '../../viewmodels/PaymentStore';
import { useOrderStore } from '../../viewmodels/OrderStore';
import Toast from 'react-native-toast-message';

type RootStackParamList = {
  Payment: { orderId: string };
  PaymentWebView: { paymentLink: string; orderCode: number; orderId: string };
  PaymentSuccess: { orderId: string };
};

type Props = NativeStackScreenProps<RootStackParamList, 'Payment'>;

// Mock order data (trong thực tế sẽ fetch từ API)
interface OrderDetails {
  id: string;
  listingTitle: string;
  listingPrice: number;
  shippingFee: number;
  serviceFee: number;
  totalAmount: number;
  shippingAddress: {
    recipientName: string;
    phone: string;
    fullAddress: string;
  };
  seller: {
    name: string;
    avatar?: string;
  };
}

export default function PaymentScreen({ navigation, route }: Props) {
  const { orderId } = route.params;
  const { createPaymentLink, loadingState, error } =
    usePaymentStore();
  const { getOrderById } = useOrderStore();

  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrderDetails();
  }, [orderId]);

  useEffect(() => {
    if (error) {
      Toast.show({
        type: 'error',
        text1: 'Lỗi thanh toán',
        text2: error,
      });
    }
  }, [error]);

  const loadOrderDetails = async () => {
    setLoading(true);
    try {
      const order = await getOrderById(orderId);
      if (!order) {
        throw new Error('Không tìm thấy đơn hàng');
      }

      const listingTitle = typeof order.listingId === 'string'
        ? `Mã tin ${order.listingId.slice(-8)}`
        : order.listingId.title;
      const sellerName = typeof order.sellerId === 'string'
        ? 'Người bán VeloBike'
        : order.sellerId.fullName;
      const fullAddress = [
        order.shippingAddress.street,
        order.shippingAddress.district,
        order.shippingAddress.city,
        order.shippingAddress.province,
      ]
        .filter(Boolean)
        .join(', ');

      setOrderDetails({
        id: order._id,
        listingTitle,
        listingPrice: order.financials.itemPrice,
        shippingFee: order.financials.shippingFee,
        serviceFee: order.financials.platformFee,
        totalAmount: order.financials.totalAmount,
        shippingAddress: {
          recipientName: order.shippingAddress.fullName,
          phone: order.shippingAddress.phone,
          fullAddress,
        },
        seller: {
          name: sellerName,
        },
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Không thể tải thông tin đơn hàng',
        text2: error instanceof Error ? error.message : 'Vui lòng thử lại',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePayNow = async () => {
    if (!orderDetails) return;

    const payment = await createPaymentLink(orderId);
    if (payment) {
      navigation.navigate('PaymentWebView', {
        ...payment,
        orderId,
      });
      return;
    }

    if (!payment) {
      Toast.show({
        type: 'error',
        text1: 'Không thể tạo link thanh toán',
        text2: 'Vui lòng thử lại sau',
      });
    }
  };

  if (loading || !orderDetails) {
    return (
      <SafeAreaView style={tw`flex-1 bg-white items-center justify-center`}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={tw`text-gray-500 mt-4`}>Đang tải thông tin đơn hàng...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={tw`flex-1 bg-gray-50`}>
      {/* Header */}
      <View style={tw`bg-white px-4 py-3 border-b border-gray-200`}>
        <Text style={tw`text-xl font-bold text-gray-900`}>Xác nhận đơn hàng</Text>
        <Text style={tw`text-sm text-gray-500 mt-1`}>Mã đơn: #{orderId.slice(-8)}</Text>
      </View>

      <ScrollView
        style={tw`flex-1`}
        contentContainerStyle={tw`pb-6`}
        showsVerticalScrollIndicator={false}
      >
        {/* Product Info */}
        <View style={tw`bg-white px-4 py-4 mb-2`}>
          <View style={tw`flex-row items-center mb-3`}>
            <Package size={20} color={COLORS.primary} />
            <Text style={tw`ml-2 text-base font-bold text-gray-900`}>
              Thông tin sản phẩm
            </Text>
          </View>
          <Text style={tw`text-base font-semibold text-gray-900 mb-1`}>
            {orderDetails.listingTitle}
          </Text>
          <Text style={tw`text-sm text-gray-500`}>
            Người bán: {orderDetails.seller.name}
          </Text>
        </View>

        {/* Shipping Address */}
        <View style={tw`bg-white px-4 py-4 mb-2`}>
          <View style={tw`flex-row items-center mb-3`}>
            <MapPin size={20} color={COLORS.primary} />
            <Text style={tw`ml-2 text-base font-bold text-gray-900`}>
              Địa chỉ giao hàng
            </Text>
          </View>
          <Text style={tw`text-base font-semibold text-gray-900`}>
            {orderDetails.shippingAddress.recipientName}
          </Text>
          <Text style={tw`text-sm text-gray-600 mt-1`}>
            {orderDetails.shippingAddress.phone}
          </Text>
          <Text style={tw`text-sm text-gray-600 mt-1`}>
            {orderDetails.shippingAddress.fullAddress}
          </Text>
        </View>

        {/* Shipping Method */}
        <View style={tw`bg-white px-4 py-4 mb-2`}>
          <View style={tw`flex-row items-center mb-3`}>
            <Truck size={20} color={COLORS.primary} />
            <Text style={tw`ml-2 text-base font-bold text-gray-900`}>
              Phương thức vận chuyển
            </Text>
          </View>
          <Text style={tw`text-sm text-gray-600`}>Giao hàng tiêu chuẩn</Text>
          <Text style={tw`text-xs text-gray-500 mt-1`}>
            Dự kiến giao trong 3-5 ngày
          </Text>
        </View>

        {/* Payment Summary */}
        <View style={tw`bg-white px-4 py-4 mb-2`}>
          <View style={tw`flex-row items-center mb-3`}>
            <CreditCard size={20} color={COLORS.primary} />
            <Text style={tw`ml-2 text-base font-bold text-gray-900`}>
              Chi tiết thanh toán
            </Text>
          </View>

          <View style={tw`gap-3`}>
            <View style={tw`flex-row justify-between`}>
              <Text style={tw`text-sm text-gray-600`}>Giá sản phẩm</Text>
              <Text style={tw`text-sm font-semibold text-gray-900`}>
                {orderDetails.listingPrice.toLocaleString('vi-VN')} đ
              </Text>
            </View>

            <View style={tw`flex-row justify-between`}>
              <Text style={tw`text-sm text-gray-600`}>Phí vận chuyển</Text>
              <Text style={tw`text-sm font-semibold text-gray-900`}>
                {orderDetails.shippingFee.toLocaleString('vi-VN')} đ
              </Text>
            </View>

            <View style={tw`flex-row justify-between`}>
              <Text style={tw`text-sm text-gray-600`}>Phí dịch vụ (1%)</Text>
              <Text style={tw`text-sm font-semibold text-gray-900`}>
                {orderDetails.serviceFee.toLocaleString('vi-VN')} đ
              </Text>
            </View>

            <View style={tw`border-t border-gray-200 pt-3 mt-2`}>
              <View style={tw`flex-row justify-between`}>
                <Text style={tw`text-base font-bold text-gray-900`}>
                  Tổng thanh toán
                </Text>
                <Text style={tw`text-lg font-bold text-green-600`}>
                  {orderDetails.totalAmount.toLocaleString('vi-VN')} đ
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Payment Method */}
        <View style={tw`bg-white px-4 py-4`}>
          <Text style={tw`text-base font-bold text-gray-900 mb-3`}>
            Phương thức thanh toán
          </Text>
          <View style={tw`bg-green-50 rounded-xl p-4 border-2 border-green-500`}>
            <Text style={tw`text-sm font-semibold text-gray-900`}>PayOS</Text>
            <Text style={tw`text-xs text-gray-600 mt-1`}>
              Thanh toán qua QR Code hoặc ATM/Visa/MasterCard
            </Text>
          </View>
        </View>

        {/* Terms */}
        <View style={tw`px-4 py-4`}>
          <Text style={tw`text-xs text-gray-500 text-center`}>
            Bằng cách thanh toán, bạn đồng ý với{' '}
            <Text style={tw`text-green-600 font-semibold`}>
              Điều khoản dịch vụ
            </Text>{' '}
            và{' '}
            <Text style={tw`text-green-600 font-semibold`}>
              Chính sách bảo mật
            </Text>{' '}
            của VeloBike
          </Text>
        </View>
      </ScrollView>

      {/* Bottom Payment Button */}
      <View style={tw`bg-white px-4 py-3 border-t border-gray-200`}>
        <TouchableOpacity
          style={[
            tw`rounded-xl py-4 items-center`,
            {
              backgroundColor:
                loadingState === 'loading' ? COLORS.textSecondary : COLORS.primary,
            },
          ]}
          onPress={handlePayNow}
          disabled={loadingState === 'loading'}
        >
          {loadingState === 'loading' ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={tw`text-white text-base font-bold`}>
              Thanh toán {orderDetails.totalAmount.toLocaleString('vi-VN')} đ
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
