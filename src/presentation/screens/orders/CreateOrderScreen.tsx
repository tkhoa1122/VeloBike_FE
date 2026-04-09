import React, { useState, useEffect } from 'react';
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
import tw from 'twrnc';
import { COLORS } from '../../../config/theme';
import Toast from 'react-native-toast-message';
import { useListingStore } from '../../viewmodels/ListingStore';
import { useAuthStore } from '../../viewmodels/AuthStore';
import { container } from '../../../di/Container';
import { checkProfileCompleteness } from '../../../utils/profileValidation';

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

interface ShippingBreakdown {
  distanceKm: number;
  baseFee: number;
  weightFee: number;
  bulkySurcharge: number;
  total: number;
  weightKg: number;
  note?: string;
}

export default function CreateOrderScreen({ navigation, route }: Props) {
  const { listingId } = route.params;
  const { currentListing, getListingById } = useListingStore();
  const { user } = useAuthStore();

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
  const [shippingLoading, setShippingLoading] = useState(false);
  const [shippingBreakdown, setShippingBreakdown] = useState<ShippingBreakdown | null>(null);
  const [sellerProfile, setSellerProfile] = useState<any>(null);
  const [profileReady, setProfileReady] = useState(false);

  React.useEffect(() => {
    getListingById(listingId);
  }, [listingId, getListingById]);

  const getSellerId = (): string | null => {
    const seller = currentListing?.sellerId as any;
    if (!seller) return null;
    if (typeof seller === 'string') return seller;
    return seller._id || seller.id || null;
  };

  const isOwnListing = !!(user?._id && getSellerId() && user._id === getSellerId());

  const addressToText = (addr?: any): string => {
    if (!addr) return '';
    return [addr.street, addr.district, addr.city, addr.province].filter(Boolean).join(', ');
  };

  const geocodeAddress = async (address: string): Promise<{ lat: number; lon: number } | null> => {
    try {
      const query = encodeURIComponent(address);
      const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=jsonv2&limit=1`;
      const response = await fetch(url, {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'VeloBikeMobile/1.0',
        },
      });
      if (!response.ok) return null;
      const data = await response.json();
      if (!Array.isArray(data) || data.length === 0) return null;
      return { lat: Number(data[0].lat), lon: Number(data[0].lon) };
    } catch {
      return null;
    }
  };

  const haversineKm = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const getBaseFee = (distanceKm: number): number => {
    if (distanceKm <= 50) return 25000;
    if (distanceKm <= 200) return 45000;
    if (distanceKm <= 500) return 70000;
    if (distanceKm <= 1000) return 95000;
    return 120000;
  };

  const calcLocalShipping = async (buyerCity: string, buyerProvince: string): Promise<ShippingBreakdown | null> => {
    const sellerAddressText = addressToText(sellerProfile?.address);
    const buyerAddressText = [address.street, address.district, buyerCity, buyerProvince]
      .filter(Boolean)
      .join(', ');

    if (!sellerAddressText || !buyerAddressText) return null;

    // Geocode via OpenStreetMap Nominatim as policy
    const [sellerGeo, buyerGeo] = await Promise.all([
      geocodeAddress(sellerAddressText),
      geocodeAddress(buyerAddressText),
    ]);

    // Fallback 500km if geocode fails
    const birdDistance = sellerGeo && buyerGeo
      ? haversineKm(sellerGeo.lat, sellerGeo.lon, buyerGeo.lat, buyerGeo.lon)
      : 500;

    const distanceKm = birdDistance * 1.3; // road estimate factor
    const weightKg = Number(currentListing?.specs?.weight) > 0 ? Number(currentListing?.specs?.weight) : 10;

    const baseFee = getBaseFee(distanceKm);
    const weightFee = Math.max(0, weightKg - 5) * 5000;
    const bulkySurcharge = weightKg > 15 ? 20000 : 0;
    const total = baseFee + weightFee + bulkySurcharge;

    return {
      distanceKm,
      baseFee,
      weightFee,
      bulkySurcharge,
      total,
      weightKg,
      note: sellerGeo && buyerGeo ? undefined : 'Đang dùng fallback 500km do geocode thất bại',
    };
  };

  useEffect(() => {
    const preloadBuyerProfile = async () => {
      try {
        const me = await container().authApiClient.getCurrentUser();
        const user = (me as any)?.user || (me as any)?.data;

        if (!user) {
          setProfileReady(true);
          return;
        }

        setAddress((prev) => ({
          ...prev,
          recipientName: user.fullName || prev.recipientName,
          phone: user.phone || prev.phone,
          street: user.address?.street || prev.street,
          district: user.address?.district || prev.district,
          city: user.address?.city || prev.city,
          province: user.address?.province || prev.province,
          zipCode: user.address?.zipCode || prev.zipCode,
        }));
      } catch {
        // Allow manual input fallback
      } finally {
        setProfileReady(true);
      }
    };

    preloadBuyerProfile();
  }, []);

  useEffect(() => {
    const loadSellerProfile = async () => {
      try {
        const sellerId = getSellerId();
        if (!sellerId) return;
        const response = await container().authApiClient.getUserById(sellerId);
        if (response.success && response.data) {
          setSellerProfile(response.data);
        }
      } catch {
        setSellerProfile(null);
      }
    };

    loadSellerProfile();
  }, [currentListing?._id]);

  const fetchShippingEstimate = async (city: string, province: string) => {
    if (!listingId || (!city && !province)) return;
    setShippingLoading(true);
    try {
      const local = await calcLocalShipping(city.trim(), province.trim());
      if (local) {
        setShippingBreakdown(local);
      }
    } catch {
      setShippingBreakdown(null);
    } finally {
      setShippingLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (address.city || address.province) {
        fetchShippingEstimate(address.city, address.province);
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [address.city, address.province, listingId]);

  const reverseGeocode = async (coords: LocationCoords): Promise<ReverseGeocodeResult | null> => {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${coords.latitude}&lon=${coords.longitude}`;
      const response = await fetch(url, {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'VeloBikeMobile/1.0',
        },
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      const a = data?.address || {};

      return {
        street: [a.house_number, a.road].filter(Boolean).join(' ') || a.road || a.neighbourhood,
        district: a.city_district || a.suburb || a.county || a.town,
        city: a.city || a.town || a.municipality,
        province: a.state || a.region || a.city,
        zipCode: a.postcode,
      };
    } catch {
      return null;
    }
  };

  const handlePickLocationOnMap = async () => {
    setLocationLoading(true);
    try {
      const coords = await getCurrentLocation();
      if (!coords) {
        Toast.show({
          type: 'error',
          text1: 'Không lấy được vị trí',
          text2: 'Vui lòng bật GPS và cấp quyền vị trí.',
        });
        return;
      }

      setSelectedLocation(coords);

      const geo = await reverseGeocode(coords);
      setAddress((prev) => ({
        ...prev,
        street: geo?.street || prev.street,
        district: geo?.district || prev.district,
        city: geo?.city || prev.city,
        province: geo?.province || prev.province,
        zipCode: geo?.zipCode || prev.zipCode,
      }));

      Toast.show({
        type: 'success',
        text1: 'Đã cập nhật vị trí giao hàng',
        text2: `${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`,
      });
    } finally {
      setLocationLoading(false);
    }
  };

  const listingTitle = currentListing?._id === listingId
    ? currentListing.title
    : 'Đang tải thông tin sản phẩm';
  const listingPrice = currentListing?._id === listingId
    ? (currentListing.pricing?.amount ?? 0)
    : 0;
  const inspectionFee = currentListing?.inspectionRequired === false ? 0 : 500000;
  const shippingFee = shippingBreakdown?.total;

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

    if (!shippingBreakdown) {
      Toast.show({
        type: 'error',
        text1: 'Thiếu dữ liệu vận chuyển',
        text2: 'Không tính được phí vận chuyển. Vui lòng kiểm tra địa chỉ người mua/người bán.',
      });
      newErrors.city = newErrors.city || 'Cần tính được phí vận chuyển';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateOrder = async () => {
    // Check profile completeness first
    const profileCheck = checkProfileCompleteness(user);
    if (!profileCheck.isComplete) {
      Toast.show({
        type: 'error',
        text1: 'Hồ sơ chưa đầy đủ',
        text2: profileCheck.message || 'Vui lòng cập nhật đầy đủ hồ sơ trước khi mua hàng',
        visibilityTime: 5000,
        onPress: () => {
          // Navigate to ProfileTab -> EditProfile
          (navigation as any).navigate('ProfileTab', {
            screen: 'EditProfile',
          });
        },
      });
      return;
    }

    if (isOwnListing) {
      Toast.show({
        type: 'info',
        text1: 'Không thể mua sản phẩm của chính bạn',
        text2: 'Bạn chỉ có thể xem tin đăng này.',
      });
      return;
    }

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
      const sellerId = getSellerId();
      if (!sellerId || !sellerProfile?.address) {
        throw new Error('Người bán chưa cập nhật đầy đủ hồ sơ địa chỉ. Không thể tính vận chuyển.');
      }

      // Match web flow: create order first, then attach shipping address.
      let orderId: string | null = null;

      const myOrders = await container().orderApiClient.getMyOrders({
        page: 1,
        limit: 50,
        filters: { role: 'buyer' as any },
      } as any);

      const existingOrder = myOrders?.data?.find((o: any) => {
        const orderListingId = typeof o.listingId === 'string' ? o.listingId : o.listingId?._id;
        const active = !['CANCELLED', 'REFUNDED', 'COMPLETED'].includes(o.status);
        return orderListingId === listingId && active;
      });

      if (existingOrder) {
        if (existingOrder.status !== 'CREATED') {
          throw new Error('Đơn mua cho sản phẩm này đã tồn tại và đang xử lý.');
        }
        orderId = existingOrder._id;
      }

      if (!orderId) {
      const createOrderRes = await container().orderApiClient.createOrder({
        listingId,
        inspectionRequired: currentListing?.inspectionRequired !== false,
        buyerCity: address.province.trim() || address.city.trim(),
      } as any);

      if (!createOrderRes.success || !createOrderRes.data?._id) {
        throw new Error(createOrderRes.message || 'Không thể tạo đơn hàng');
      }
      orderId = createOrderRes.data._id;
      }

      const shippingPayload = {
        fullName: address.recipientName.trim(),
        phone: address.phone.trim(),
        street: address.street.trim(),
        district: address.district.trim(),
        city: address.city.trim(),
        province: address.province.trim(),
        ...(address.zipCode.trim() ? { zipCode: address.zipCode.trim() } : {}),
      };

      const shippingRes = await container().orderApiClient.updateShippingAddress(orderId, {
        shippingAddress: {
          ...shippingPayload,
          ...(address.note?.trim() ? { instructions: address.note.trim() } : {}),
        },
      });

      if (!shippingRes.success) {
        throw new Error(shippingRes.message || 'Không thể cập nhật địa chỉ giao hàng');
      }

      Toast.show({
        type: 'success',
        text1: 'Tạo đơn hàng thành công',
        text2: 'Chuyển đến thanh toán...',
      });

      // Navigate to Payment screen
      navigation.replace('Payment', { orderId: orderId! });
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

          <View style={tw`bg-blue-50 rounded-xl p-4 mb-4`}> 
            <Text style={tw`text-sm font-bold text-gray-800 mb-2`}>Chi tiết chi phí đơn hàng</Text>

            {shippingLoading ? (
              <Text style={tw`text-xs text-gray-500`}>Đang tính phí vận chuyển...</Text>
            ) : (
              <>
                <View style={tw`flex-row justify-between mb-1`}>
                  <Text style={tw`text-sm text-gray-600`}>Giá sản phẩm</Text>
                  <Text style={tw`text-sm font-semibold text-gray-900`}>
                    {listingPrice.toLocaleString('vi-VN')} đ
                  </Text>
                </View>

                <View style={tw`flex-row justify-between mb-1`}>
                  <Text style={tw`text-sm text-gray-600`}>Phí kiểm định</Text>
                  <Text style={tw`text-sm font-semibold text-gray-900`}>
                    {inspectionFee.toLocaleString('vi-VN')} đ
                  </Text>
                </View>

                <View style={tw`flex-row justify-between mb-1`}>
                  <Text style={tw`text-sm text-gray-600`}>Phí vận chuyển dự kiến</Text>
                  <Text style={tw`text-sm font-semibold text-gray-900`}>
                    {shippingFee != null ? `${shippingFee.toLocaleString('vi-VN')} đ` : '--'}
                  </Text>
                </View>

                {shippingBreakdown ? (
                  <View style={tw`mt-1`}>
                    <View style={tw`flex-row justify-between mt-1`}>
                      <Text style={tw`text-xs text-gray-600`}>Phí cơ bản theo khoảng cách</Text>
                      <Text style={tw`text-xs font-semibold text-gray-800`}>
                        {shippingBreakdown.baseFee.toLocaleString('vi-VN')} đ
                      </Text>
                    </View>
                    <View style={tw`flex-row justify-between mt-1`}>
                      <Text style={tw`text-xs text-gray-600`}>Phí theo cân nặng</Text>
                      <Text style={tw`text-xs font-semibold text-gray-800`}>
                        {shippingBreakdown.weightFee.toLocaleString('vi-VN')} đ
                      </Text>
                    </View>
                    <View style={tw`flex-row justify-between mt-1`}>
                      <Text style={tw`text-xs text-gray-600`}>Phí cồng kềnh</Text>
                      <Text style={tw`text-xs font-semibold text-gray-800`}>
                        {shippingBreakdown.bulkySurcharge.toLocaleString('vi-VN')} đ
                      </Text>
                    </View>
                    <Text style={tw`text-xs text-gray-500 mt-2`}>
                      Khoảng cách: {shippingBreakdown.distanceKm.toFixed(1)} km | Khối lượng xe: {shippingBreakdown.weightKg} kg
                    </Text>
                    {shippingBreakdown.note ? (
                      <Text style={tw`text-xs text-gray-500 mt-1`}>{shippingBreakdown.note}</Text>
                    ) : null}
                  </View>
                ) : (
                  <Text style={tw`text-xs text-gray-500 mt-1`}>
                    Vui lòng điền địa chỉ người mua và đảm bảo seller đã cập nhật hồ sơ địa chỉ.
                  </Text>
                )}

              </>
            )}
          </View>

          {/* Spacer for bottom button */}
          <View style={tw`h-20`} />
        </ScrollView>

        {/* Bottom Button */}
        <View style={tw`px-4 py-3 border-t border-gray-200 bg-white`}>
          <TouchableOpacity
            style={[
              tw`rounded-xl py-4 items-center`,
              {
                backgroundColor:
                  loading || !profileReady || !shippingBreakdown || isOwnListing ? COLORS.textSecondary : COLORS.primary,
              },
            ]}
            onPress={handleCreateOrder}
            disabled={loading || !profileReady || !shippingBreakdown || isOwnListing}
          >
            <Text style={tw`text-white text-base font-bold`}>
              {loading
                ? 'Đang xử lý...'
                : isOwnListing
                  ? 'Không thể mua tin của bạn'
                  : !profileReady
                    ? 'Đang tải hồ sơ...'
                    : !shippingBreakdown
                      ? 'Chờ tính phí vận chuyển...'
                      : 'Tiếp tục thanh toán'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
