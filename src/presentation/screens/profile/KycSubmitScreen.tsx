import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Image, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Camera, ShieldCheck } from 'lucide-react-native';
import tw from 'twrnc';
import Toast from 'react-native-toast-message';
import { COLORS } from '../../../config/theme';
import { PickedImage, useImagePicker } from '../../hooks/useImagePicker';
import { container } from '../../../di/Container';
import { useAuthStore } from '../../viewmodels/AuthStore';

interface KycSubmitScreenProps {
  onBack?: () => void;
}

interface KycImageFieldProps {
  label: string;
  value?: string;
  loading: boolean;
  onPick: () => Promise<void>;
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

  const { pickFromCamera, pickFromLibrary } = useImagePicker({ maxFiles: 1 });

  const canSubmit = useMemo(() => !!idCardFront && !!selfie && !submitting, [idCardFront, selfie, submitting]);

  const validateImage = (img: PickedImage, label: string): string | null => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png'];
    const mime = (img.type || '').toLowerCase();
    if (!allowed.includes(mime)) {
      return `${label} phải là ảnh JPG hoặc PNG.`;
    }

    if ((img.width ?? 0) < 600 || (img.height ?? 0) < 600) {
      return `${label} quá nhỏ, vui lòng chọn ảnh rõ nét hơn.`;
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

  const pickAndUpload = async (field: 'idCardFront' | 'selfie') => {
    try {
      setUploadingField(field);
      setSubmitError(null); // Clear previous errors when starting new upload
      
      // Both fields can use library (supports emulator testing)
      const images = await pickFromLibrary(false);
      
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

      // Update AuthStore KYC status  
      useAuthStore.getState().submitKycSuccess();

      // Auto-upgrade to seller after KYC (success or already verified)
      const performUpgrade = async () => {
        try {
          console.log('🔄 Auto-upgrading to seller after KYC...');
          const upgradeResult = await container().authApiClient.upgradeToSeller();
          console.log('✅ Upgrade response:', upgradeResult);
          
          // Refresh user immediately to get new role + wait a bit for DB
          console.log('📥 Fetching fresh user data...');
          const getCurrentUser = useAuthStore.getState().getCurrentUser as any;
          await getCurrentUser(false, true);
          
          // Add small delay to ensure state propagation
          await new Promise(resolve => setTimeout(() => resolve(undefined), 300));

          // Check if role actually updated
          const updatedUser = useAuthStore.getState().user;
          console.log('👤 Updated user:', { role: updatedUser?.role, email: updatedUser?.email });
          const isNowSeller = updatedUser?.role === 'SELLER';
          
          if (isNowSeller) {
            console.log('✅ Role upgrade successful!');
            Toast.show({
              type: 'success',
              text1: 'Lên cấp thành công',
              text2: 'Bạn đã trở thành người bán hàng.',
            });
            onBack?.();
          } else {
            // Role not updated - backend might have failed
            console.warn('⚠️ Role not updated after upgrade call. Current role:', updatedUser?.role);
            Toast.show({
              type: 'success',
              text1: 'KYC đã được xét duyệt',
              text2: 'Vui lòng quay lại để hoàn tất đăng ký bán hàng.',
            });
            onBack?.();
          }
        } catch (err) {
          console.error('⚠️ Upgrade error:', err);
          // Even if upgrade fails, try to refresh
          const getCurrentUser = useAuthStore.getState().getCurrentUser as any;
          await getCurrentUser(false, true);
          await new Promise(resolve => setTimeout(() => resolve(undefined), 300));
          
          // Check if user is seller despite error
          const currentUser = useAuthStore.getState().user;
          console.log('💾 Current user after error:', { role: currentUser?.role });
          if (currentUser?.role === 'SELLER') {
            console.log('✅ Despite error, user is now SELLER!');
            Toast.show({
              type: 'success',
              text1: 'Lên cấp thành công',
              text2: 'Bạn đã trở thành người bán hàng.',
            });
          } else {
            // Still buyer - don't show error, retry message
            Toast.show({
              type: 'info',
              text1: 'KYC đã được xét duyệt',
              text2: 'Vui lòng quay lại để hoàn tất.',
            });
          }
          onBack?.();
        }
      };

      // If already verified or submit successful, upgrade to seller
      if (isAlreadyVerified || result.success) {
        setSubmitting(false);
        await performUpgrade();
        return;
      }

      // For new KYC submissions (not already verified), show pending status
      Toast.show({
        type: 'success',
        text1: 'Nộp KYC thành công',
        text2: 'Hồ sơ đã được gửi và đang chờ xét duyệt.',
      });
      
      setSubmitError(null);
      onBack?.();
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
