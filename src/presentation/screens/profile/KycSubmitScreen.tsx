import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Image, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Camera, ShieldCheck, CircleCheck } from 'lucide-react-native';
import tw from 'twrnc';
import Toast from 'react-native-toast-message';
import { COLORS } from '../../../config/theme';
import { PickedImage, useImagePicker } from '../../hooks/useImagePicker';
import { container } from '../../../di/Container';
import { useAuthStore } from '../../viewmodels/AuthStore';
import { User } from '../../../domain/entities/User';

interface KycSubmitScreenProps {
  onBack?: () => void;
}

interface KycImageFieldProps {
  label: string;
  value?: string;
  loading: boolean;
  onPick: () => Promise<void>;
}

interface KycSubmitResultState {
  title: string;
  message: string;
  ctaText: string;
}

const KycImageField: React.FC<KycImageFieldProps> = ({ label, value, loading, onPick }) => {
  return (
    <View style={tw`mb-4`}>
      <Text style={tw`text-sm font-semibold text-gray-700 mb-2`}>{label}</Text>
      <TouchableOpacity
        style={tw`border border-gray-300 rounded-xl overflow-hidden bg-gray-50`}
        onPress={onPick}
        disabled={loading}
      >
        {value ? (
          <Image source={{ uri: value }} style={tw`w-full h-48`} resizeMode="cover" />
        ) : (
          <View style={tw`h-48 items-center justify-center`}>
            {loading ? (
              <ActivityIndicator color={COLORS.primary} />
            ) : (
              <>
                <Camera size={28} color={COLORS.textSecondary} />
                <Text style={tw`text-sm text-gray-500 mt-2`}>Nhấn để chọn ảnh</Text>
              </>
            )}
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};

export default function KycSubmitScreen({ onBack }: KycSubmitScreenProps) {
  const [idCardFront, setIdCardFront] = useState<PickedImage | undefined>();
  const [selfie, setSelfie] = useState<PickedImage | undefined>();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [uploadingField, setUploadingField] = useState<'idCardFront' | 'selfie' | null>(null);
  const [submitResult, setSubmitResult] = useState<KycSubmitResultState | null>(null);

  const { showImagePicker } = useImagePicker({ maxFiles: 1 });

  const canSubmit = useMemo(() => !!idCardFront && !!selfie && !submitting, [idCardFront, selfie, submitting]);

  const validateImage = (img: PickedImage, label: string): string | null => {
    const mime = (img.type || '').toLowerCase();
    if (!mime.startsWith('image/')) {
      return `${label} phải là file ảnh hợp lệ.`;
    }

    if (!img.uri) {
      return `${label} không hợp lệ, vui lòng chọn lại ảnh.`;
    }

    return null;
  };

  const getKycFriendlyError = (raw?: string): string => {
    const message = (raw || '').toLowerCase();
    if (message.includes('face matching failed') || message.includes('face match')) {
      return 'Khuôn mặt không khớp với CCCD. Vui lòng chụp selfie rõ mặt (không đeo khẩu trang/kính râm), đủ sáng và giữ ảnh CCCD rõ 4 góc.';
    }
    if (message.includes('no face') || message.includes('face not detected')) {
      return 'Không nhận diện được khuôn mặt trong ảnh selfie. Vui lòng chụp lại ảnh rõ mặt.';
    }
    return raw || 'Vui lòng thử lại sau.';
  };

  const mapApiUserToDomain = (raw: any): User => {
    return {
      _id: raw?._id ?? raw?.id ?? '',
      email: raw?.email ?? '',
      fullName: raw?.fullName ?? '',
      avatar: raw?.avatar,
      phone: raw?.phone,
      role: (raw?.role ?? 'BUYER') as any,
      emailVerified: !!raw?.emailVerified,
      kycStatus: (raw?.kycStatus ?? 'not_submitted') as any,
      address: raw?.address,
      bodyMeasurements: raw?.bodyMeasurements,
      wallet: raw?.wallet,
      reputation: raw?.reputation,
      subscription: raw?.subscription
        ? {
            plan: raw.subscription.plan,
            expiresAt: new Date(raw.subscription.expiresAt),
            isActive: !!raw.subscription.isActive,
          }
        : undefined,
      googleId: raw?.googleId,
      facebookId: raw?.facebookId,
      createdAt: raw?.createdAt ? new Date(raw.createdAt) : new Date(),
      updatedAt: raw?.updatedAt ? new Date(raw.updatedAt) : new Date(),
    };
  };

  const refreshCurrentUserState = async (): Promise<User | null> => {
    const me = await container().authApiClient.getCurrentUser();
    const rawUser = (me as any)?.user ?? (me as any)?.data;

    if (!me?.success || !rawUser) {
      return null;
    }

    const mapped = mapApiUserToDomain(rawUser);
    useAuthStore.getState().upgradeToSellerSuccess(mapped);
    return mapped;
  };

  const handleResultAction = async () => {
    setSubmitting(true);
    try {
      let user = await refreshCurrentUserState();
      const normalizedKyc = String(user?.kycStatus || '').toUpperCase();
      const isApproved = normalizedKyc === 'VERIFIED' || normalizedKyc === 'APPROVED';

      if (isApproved && String(user?.role || '').toUpperCase() !== 'SELLER') {
        await container().authApiClient.upgradeToSeller();
        user = await refreshCurrentUserState();
      }

      await useAuthStore.getState().getCurrentUser(true, true);
    } finally {
      setSubmitting(false);
      onBack?.();
    }
  };

  const pickAndUpload = async (field: 'idCardFront' | 'selfie') => {
    try {
      setUploadingField(field);
      setSubmitError(null); // Clear previous errors when starting new upload
      
      // Hiển thị modal nguồn ảnh (Camera/Thư viện) để UX nhất quán.
      const images = await showImagePicker(false);
      
      if (!images.length) {
        setUploadingField(null);
        return;
      }
      
      const selectedImage = images[0];

      if (field === 'idCardFront') {
        setIdCardFront(selectedImage);
      } else {
        setSelfie(selectedImage);
      }
    } catch (error) {
      console.error('Pick and upload error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Vui lòng thử lại';
      Toast.show({
        type: 'error',
        text1: 'Lỗi tải ảnh',
        text2: errorMsg,
      });
      setSubmitError(errorMsg);
    } finally {
      setUploadingField(null);
    }
  };

  const handleSubmitKyc = async () => {
    setSubmitError(null);

    if (!idCardFront || !selfie) {
      Toast.show({
        type: 'error',
        text1: 'Thiếu thông tin KYC',
        text2: 'Vui lòng tải lên đầy đủ ảnh CCCD và selfie.',
      });
      setSubmitError('Vui lòng tải lên đầy đủ ảnh CCCD và ảnh selfie rõ mặt trước khi gửi.');
      return;
    }

    if (idCardFront.uri === selfie.uri) {
      Toast.show({
        type: 'error',
        text1: 'Ảnh KYC chưa hợp lệ',
        text2: 'Ảnh CCCD và ảnh selfie phải là 2 ảnh khác nhau.',
      });
      setSubmitError('Ảnh CCCD và ảnh selfie đang trùng nhau. Vui lòng chụp selfie rõ mặt của bạn.');
      return;
    }

    const idError = validateImage(idCardFront, 'Ảnh CCCD');
    if (idError) {
      Toast.show({ type: 'error', text1: 'Ảnh KYC chưa hợp lệ', text2: idError });
      setSubmitError(idError);
      return;
    }

    const selfieError = validateImage(selfie, 'Ảnh selfie');
    if (selfieError) {
      Toast.show({ type: 'error', text1: 'Ảnh KYC chưa hợp lệ', text2: selfieError });
      setSubmitError(selfieError);
      return;
    }

    setSubmitting(true);
    try {
      const result = await container().authApiClient.submitKYC({
        idCardFront: {
          uri: idCardFront.uri,
          name: idCardFront.name,
          type: idCardFront.type,
        },
        selfie: {
          uri: selfie.uri,
          name: selfie.name,
          type: selfie.type,
        },
      });

      // Handle "already verified" case - KYC is already approved
      const isAlreadyVerified = (result.message || '').toLowerCase().includes('already verified');
      if (!result.success && !isAlreadyVerified) {
        const isFaceMatchingFailed = (result.message || '').toLowerCase().includes('face matching failed');
        const friendly = getKycFriendlyError(result.message);
        Toast.show({
          type: 'error',
          text1: isFaceMatchingFailed ? 'Khuôn mặt chưa khớp CCCD' : 'Nộp KYC thất bại',
          text2: friendly,
        });
        setSubmitError(friendly);
        setSubmitting(false);
        return;
      }

      // Keep local state consistent while waiting BE status sync.
      useAuthStore.getState().submitKycSuccess();

      let user = await refreshCurrentUserState();
      const normalizedKyc = String(user?.kycStatus || '').toUpperCase();
      const kycApproved = isAlreadyVerified || normalizedKyc === 'VERIFIED' || normalizedKyc === 'APPROVED';

      if (kycApproved && String(user?.role || '').toUpperCase() !== 'SELLER') {
        await container().authApiClient.upgradeToSeller();
        user = await refreshCurrentUserState();
      }

      const isSellerNow = String(user?.role || '').toUpperCase() === 'SELLER';

      if (isSellerNow) {
        setSubmitResult({
          title: 'Xác minh thành công',
          message: 'Tài khoản của bạn đã được nâng cấp thành người bán. Nhấn nút bên dưới để cập nhật trạng thái hồ sơ.',
          ctaText: 'Cập nhật trạng thái',
        });
        return;
      }

      setSubmitResult({
        title: 'Đã gửi hồ sơ xác minh',
        message: 'Hồ sơ đã được gửi thành công. Nhấn nút bên dưới để cập nhật trạng thái mới nhất từ hệ thống.',
        ctaText: 'Quay về hồ sơ',
      });
    } catch (error) {
      const rawMessage = error instanceof Error ? error.message : 'Vui lòng thử lại sau';
      const friendly = getKycFriendlyError(rawMessage);
      Toast.show({
        type: 'error',
        text1: 'Nộp KYC thất bại',
        text2: friendly,
      });
      setSubmitError(friendly);
      setSubmitting(false);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitResult) {
    return (
      <SafeAreaView style={tw`flex-1 bg-white`}>
        <View style={tw`flex-1 px-6 items-center justify-center`}>
          <View style={tw`w-16 h-16 rounded-full items-center justify-center mb-4`}>
            <CircleCheck size={56} color={COLORS.success} />
          </View>
          <Text style={tw`text-2xl font-bold text-gray-900 text-center`}>{submitResult.title}</Text>
          <Text style={tw`text-base text-gray-600 text-center mt-3`}>{submitResult.message}</Text>

          <TouchableOpacity
            style={[tw`rounded-xl py-4 px-6 items-center mt-8 w-full`, { backgroundColor: COLORS.primary }]}
            onPress={handleResultAction}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={tw`text-white text-base font-bold`}>{submitResult.ctaText}</Text>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={tw`flex-1 bg-white`}>
      <View style={tw`flex-row items-center px-4 py-3 border-b border-gray-200`}>
        <TouchableOpacity onPress={onBack} style={tw`p-2 -ml-2`}>
          <ArrowLeft size={22} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={tw`text-lg font-bold text-gray-900 ml-2`}>Xác minh tài khoản</Text>
      </View>

      <ScrollView contentContainerStyle={tw`px-4 py-4 pb-28`}>
        <View style={tw`bg-blue-50 rounded-xl p-4 mb-5`}>
          <View style={tw`flex-row items-center mb-2`}>
            <ShieldCheck size={18} color={COLORS.primary} />
            <Text style={tw`text-sm font-bold text-gray-900 ml-2`}>Lưu ý khi nộp KYC</Text>
          </View>
          <Text style={tw`text-sm text-gray-700`}>Ảnh rõ nét, không che thông tin, không chỉnh sửa. Hệ thống sẽ xét duyệt trong thời gian sớm nhất.</Text>
        </View>

        <KycImageField
          label="Ảnh mặt trước CCCD"
          value={idCardFront?.uri}
          loading={uploadingField === 'idCardFront'}
          onPick={() => pickAndUpload('idCardFront')}
        />

        <KycImageField
          label="Ảnh selfie rõ mặt"
          value={selfie?.uri}
          loading={uploadingField === 'selfie'}
          onPick={() => pickAndUpload('selfie')}
        />

        {submitError ? (
          <View style={tw`mt-1 mb-2 rounded-xl bg-red-50 border border-red-200 p-3`}>
            <Text style={tw`text-sm text-red-700`}>{submitError}</Text>
          </View>
        ) : null}
      </ScrollView>

      <View style={tw`absolute bottom-0 left-0 right-0 px-4 py-3 border-t border-gray-200 bg-white`}>
        <TouchableOpacity
          style={[
            tw`rounded-xl py-4 items-center`,
            { backgroundColor: canSubmit ? COLORS.primary : COLORS.textSecondary },
          ]}
          disabled={!canSubmit}
          onPress={handleSubmitKyc}
        >
          {submitting ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={tw`text-white text-base font-bold`}>Gửi hồ sơ xác minh</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
