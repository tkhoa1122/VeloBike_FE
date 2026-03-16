import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Image, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Camera, ShieldCheck } from 'lucide-react-native';
import tw from 'twrnc';
import Toast from 'react-native-toast-message';
import { COLORS } from '../../../config/theme';
import { PickedImage, useImagePicker } from '../../hooks/useImagePicker';
import { container } from '../../../di/Container';

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
  const [uploadingField, setUploadingField] = useState<'idCardFront' | 'selfie' | null>(null);

  const { showImagePicker } = useImagePicker({ maxFiles: 1, quality: 1 });

  const canSubmit = useMemo(() => !!idCardFront && !!selfie && !submitting, [idCardFront, selfie, submitting]);

  const pickAndUpload = async (field: 'idCardFront' | 'selfie') => {
    try {
      setUploadingField(field);
      const images = await showImagePicker(false);
      if (!images.length) {
        return;
      }
      const selectedImage = images[0];

      if (field === 'idCardFront') {
        setIdCardFront(selectedImage);
      } else {
        setSelfie(selectedImage);
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Không thể chọn ảnh',
        text2: error instanceof Error ? error.message : 'Vui lòng thử lại',
      });
    } finally {
      setUploadingField(null);
    }
  };

  const handleSubmitKyc = async () => {
    if (!idCardFront || !selfie) {
      Toast.show({
        type: 'error',
        text1: 'Thiếu thông tin KYC',
        text2: 'Vui lòng tải lên đầy đủ ảnh CCCD và selfie.',
      });
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
      if (!result.success) {
        Toast.show({
          type: 'error',
          text1: 'Nộp KYC thất bại',
          text2: result.message || 'Vui lòng thử lại sau',
        });
        return;
      }

      Toast.show({
        type: 'success',
        text1: 'Nộp KYC thành công',
        text2: 'Hồ sơ đã được gửi và đang chờ xét duyệt.',
      });
      onBack?.();
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Nộp KYC thất bại',
        text2: error instanceof Error ? error.message : 'Vui lòng thử lại sau',
      });
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
          label="Ảnh selfie cầm CCCD"
          value={selfie?.uri}
          loading={uploadingField === 'selfie'}
          onPick={() => pickAndUpload('selfie')}
        />
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
