import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MapPin, ChevronRight } from 'lucide-react-native';
import tw from 'twrnc';
import { COLORS } from '../../../config/theme';
import Toast from 'react-native-toast-message';
import { useListingStore } from '../../viewmodels/ListingStore';
import { container } from '../../../di/Container';

type RootStackParamList = {
  CreateOrder: { listingId: string };
  Payment: { orderId: string };
};

type Props = NativeStackScreenProps<RootStackParamList, 'CreateOrder'>;

interface ShippingAddress {
  recipientName: string;
  phone: string;
  street: string;
  district: string;
  city: string;
  province: string;
  zipCode: string;
  note?: string;
}

export default function CreateOrderScreen({ navigation, route }: Props) {
  const { listingId } = route.params;
  const { currentListing, getListingById } = useListingStore();

  const [address, setAddress] = useState<ShippingAddress>({
    recipientName: '',
    phone: '',
    street: '',
    district: '',
    city: '',
    province: '',
    zipCode: '',
    note: '',
  });

  const [errors, setErrors] = useState<Partial<ShippingAddress>>({});
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    getListingById(listingId);
  }, [listingId, getListingById]);

  const listingTitle = currentListing?._id === listingId
    ? currentListing.title
    : 'Đang tải thông tin sản phẩm';
  const listingPrice = currentListing?._id === listingId
    ? (currentListing.pricing?.amount ?? 0)
    : 0;

  const validateForm = (): boolean => {
    const newErrors: Partial<ShippingAddress> = {};

    if (!address.recipientName.trim()) {
      newErrors.recipientName = 'Vui lòng nhập tên người nhận';
    }

    if (!address.phone.trim()) {
      newErrors.phone = 'Vui lòng nhập số điện thoại';
    } else if (!/^[0-9]{10}$/.test(address.phone)) {
      newErrors.phone = 'Số điện thoại không hợp lệ';
    }

    if (!address.street.trim()) {
      newErrors.street = 'Vui lòng nhập địa chỉ';
    }

    if (!address.district.trim()) {
      newErrors.district = 'Vui lòng nhập quận/huyện';
    }

    if (!address.city.trim()) {
      newErrors.city = 'Vui lòng nhập thành phố';
    }

    if (!address.province.trim()) {
      newErrors.province = 'Vui lòng nhập tỉnh/thành phố';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateOrder = async () => {
    if (!validateForm()) {
      Toast.show({
        type: 'error',
        text1: 'Thông tin chưa đầy đủ',
        text2: 'Vui lòng điền đầy đủ thông tin giao hàng',
      });
      return;
    }

    setLoading(true);
    try {
      const result = await container().orderRepository.createOrder({
        listingId,
        shippingAddress: {
          fullName: address.recipientName,
          phone: address.phone,
          street: address.street,
          district: address.district,
          city: address.city,
          province: address.province,
          zipCode: address.zipCode.trim() || undefined,
          instructions: address.note?.trim() || undefined,
        },
        buyerNote: address.note?.trim() || undefined,
      });

      if (!result.success || !result.data?._id) {
        throw new Error(result.message || 'Không thể tạo đơn hàng');
      }

      Toast.show({
        type: 'success',
        text1: 'Tạo đơn hàng thành công',
        text2: 'Chuyển đến thanh toán...',
      });

      // Navigate to Payment screen
      navigation.replace('Payment', { orderId: result.data._id });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Lỗi tạo đơn hàng',
        text2: error instanceof Error ? error.message : 'Vui lòng thử lại',
      });
    } finally {
      setLoading(false);
    }
  };

  const renderInput = (
    label: string,
    value: string,
    onChangeText: (text: string) => void,
    placeholder: string,
    error?: string,
    keyboardType: 'default' | 'phone-pad' = 'default',
    multiline = false
  ) => (
    <View style={tw`mb-4`}>
      <Text style={tw`text-sm font-semibold text-gray-700 mb-2`}>
        {label} <Text style={tw`text-red-500`}>*</Text>
      </Text>
      <TextInput
        style={[
          tw`border rounded-xl px-4 py-3 text-base`,
          multiline && tw`h-20`,
          error ? tw`border-red-500` : tw`border-gray-300`,
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        keyboardType={keyboardType}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
      />
      {error && <Text style={tw`text-xs text-red-500 mt-1`}>{error}</Text>}
    </View>
  );

  return (
    <SafeAreaView style={tw`flex-1 bg-white`}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={tw`flex-1`}
      >
        {/* Header */}
        <View style={tw`px-4 py-3 border-b border-gray-200`}>
          <Text style={tw`text-xl font-bold text-gray-900`}>
            Địa chỉ giao hàng
          </Text>
          <Text style={tw`text-sm text-gray-500 mt-1`}>{listingTitle}</Text>
        </View>

        <ScrollView
          style={tw`flex-1`}
          contentContainerStyle={tw`px-4 py-4`}
          showsVerticalScrollIndicator={false}
        >
          {/* Listing Info */}
          <View style={tw`bg-green-50 rounded-xl p-4 mb-6`}>
            <Text style={tw`text-sm font-semibold text-gray-700 mb-1`}>
              Sản phẩm
            </Text>
            <Text style={tw`text-base font-bold text-gray-900`}>
              {listingTitle}
            </Text>
            <Text style={tw`text-lg font-bold text-green-600 mt-2`}>
              {listingPrice > 0 ? `${listingPrice.toLocaleString('vi-VN')} đ` : 'Đang cập nhật'}
            </Text>
          </View>

          {/* Location Selector (Future: integrate maps) */}
          <TouchableOpacity
            style={tw`flex-row items-center justify-between bg-gray-50 rounded-xl p-4 mb-6`}
            onPress={() => {
              Toast.show({
                type: 'info',
                text1: 'Tính năng sắp ra mắt',
                text2: 'Chọn vị trí trên bản đồ',
              });
            }}
          >
            <View style={tw`flex-row items-center`}>
              <MapPin size={24} color={COLORS.primary} />
              <Text style={tw`ml-3 text-base font-semibold text-gray-700`}>
                Chọn vị trí trên bản đồ
              </Text>
            </View>
            <ChevronRight size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>

          {/* Form Fields */}
          <Text style={tw`text-lg font-bold text-gray-900 mb-4`}>
            Thông tin người nhận
          </Text>

          {renderInput(
            'Tên người nhận',
            address.recipientName,
            (text) => setAddress({ ...address, recipientName: text }),
            'Nguyễn Văn A',
            errors.recipientName
          )}

          {renderInput(
            'Số điện thoại',
            address.phone,
            (text) => setAddress({ ...address, phone: text }),
            '0987654321',
            errors.phone,
            'phone-pad'
          )}

          {renderInput(
            'Địa chỉ cụ thể',
            address.street,
            (text) => setAddress({ ...address, street: text }),
            'Số nhà, tên đường',
            errors.street
          )}

          <View style={tw`flex-row gap-3`}>
            <View style={tw`flex-1`}>
              {renderInput(
                'Quận/Huyện',
                address.district,
                (text) => setAddress({ ...address, district: text }),
                'Quận 1',
                errors.district
              )}
            </View>
            <View style={tw`flex-1`}>
              {renderInput(
                'Thành phố',
                address.city,
                (text) => setAddress({ ...address, city: text }),
                'TP.HCM',
                errors.city
              )}
            </View>
          </View>

          {renderInput(
            'Tỉnh/Thành phố',
            address.province,
            (text) => setAddress({ ...address, province: text }),
            'Hồ Chí Minh',
            errors.province
          )}

          {renderInput(
            'Mã bưu điện',
            address.zipCode,
            (text) => setAddress({ ...address, zipCode: text }),
            '700000 (không bắt buộc)',
            errors.zipCode
          )}

          {renderInput(
            'Ghi chú cho người bán',
            address.note || '',
            (text) => setAddress({ ...address, note: text }),
            'Ghi chú thêm (không bắt buộc)',
            undefined,
            'default',
            true
          )}

          {/* Spacer for bottom button */}
          <View style={tw`h-20`} />
        </ScrollView>

        {/* Bottom Button */}
        <View style={tw`px-4 py-3 border-t border-gray-200 bg-white`}>
          <TouchableOpacity
            style={[
              tw`rounded-xl py-4 items-center`,
              { backgroundColor: loading ? COLORS.textSecondary : COLORS.primary },
            ]}
            onPress={handleCreateOrder}
            disabled={loading}
          >
            <Text style={tw`text-white text-base font-bold`}>
              {loading ? 'Đang xử lý...' : 'Tiếp tục thanh toán'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
