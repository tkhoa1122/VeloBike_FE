import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Image,
  Alert,
  Switch,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, ImagePlus, Video, X } from 'lucide-react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import Toast from 'react-native-toast-message';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, RADIUS, SHADOWS } from '../../../config/theme';
import { container } from '../../../di/Container';
import type { CreateListingData } from '../../../domain/entities/Listing';
import { useImagePicker } from '../../hooks/useImagePicker';
import { useAuthStore } from '../../viewmodels/AuthStore';
import { checkProfileCompleteness } from '../../../utils/profileValidation';

interface SellerCreateListingScreenProps {
  onBack: () => void;
  onSuccess?: () => void;
  onEditProfile?: () => void;
  initialListing?: any;
}

const BIKE_TYPES = [
  { label: 'Road', value: 'ROAD' },
  { label: 'MTB', value: 'MTB' },
  { label: 'Gravel', value: 'GRAVEL' },
  { label: 'Triathlon', value: 'TRIATHLON' },
  { label: 'E-Bike', value: 'E_BIKE' },
] as const;

const toBikeType = (value: string) => {
  const normalized = value.trim().toUpperCase().replace(/[\s-]+/g, '_');
  return ['ROAD', 'MTB', 'GRAVEL', 'TRIATHLON', 'E_BIKE'].includes(normalized) ? normalized : 'MTB';
};

export const SellerCreateListingScreen: React.FC<SellerCreateListingScreenProps> = ({ onBack, onSuccess, onEditProfile, initialListing }) => {
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const [saving, setSaving] = useState(false);
  const { showImagePicker } = useImagePicker({ maxFiles: 8, quality: 0.8 });

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('MTB');
  const [price, setPrice] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [size, setSize] = useState('');
  const [inspectionRequired, setInspectionRequired] = useState(true);

  const [frameMaterial, setFrameMaterial] = useState('');
  const [groupset, setGroupset] = useState('');
  const [brakeType, setBrakeType] = useState('');
  const [wheelset, setWheelset] = useState('');
  const [weight, setWeight] = useState('');
  const [suspensionType, setSuspensionType] = useState('');
  const [travelFront, setTravelFront] = useState('');
  const [motor, setMotor] = useState('');
  const [battery, setBattery] = useState('');

  const [images, setImages] = useState<string[]>([]);
  const [imageUrlsText, setImageUrlsText] = useState<string>('');
  const [videoData, setVideoData] = useState<string>('');
  const [videoUrl, setVideoUrl] = useState<string>('');

  const isRoadLike = type === 'ROAD' || type === 'TRIATHLON';
  const isMTB = type === 'MTB';
  const isEBike = type === 'E_BIKE';
  const isGravel = type === 'GRAVEL';
  const isEditing = !!initialListing?._id;

  useEffect(() => {
    if (!initialListing?._id) return;

    setTitle(initialListing.title || '');
    setDescription(initialListing.description || '');
    setType(toBikeType(initialListing.type || 'MTB'));
    setPrice(initialListing.pricing?.amount ? String(initialListing.pricing.amount) : '');
    setBrand(initialListing.generalInfo?.brand || '');
    setModel(initialListing.generalInfo?.model || '');
    setYear(initialListing.generalInfo?.year ? String(initialListing.generalInfo.year) : String(new Date().getFullYear()));
    setSize(initialListing.generalInfo?.size || '');
    setInspectionRequired(initialListing.inspectionRequired ?? true);

    setFrameMaterial(initialListing.specs?.frameMaterial || '');
    setGroupset(initialListing.specs?.groupset || '');
    setBrakeType(initialListing.specs?.brakeType || '');
    setWheelset(initialListing.specs?.wheelset || '');
    setWeight(initialListing.specs?.weight ? String(initialListing.specs.weight) : '');
    setSuspensionType(initialListing.specs?.suspensionType || '');
    setTravelFront(initialListing.specs?.travelFront || '');
    setMotor(initialListing.specs?.motor || '');
    setBattery(initialListing.specs?.battery || '');

    setImages(Array.isArray(initialListing.media?.thumbnails) ? initialListing.media.thumbnails : []);
    setVideoUrl(initialListing.media?.videoUrl || '');
    setVideoData('');
  }, [initialListing]);

  const isValid = useMemo(() => {
    if (
      !title.trim() ||
      title.trim().length < 5 ||
      !description.trim() ||
      description.trim().length < 10 ||
      !brand.trim() ||
      !model.trim() ||
      !size.trim() ||
      !price.trim()
    ) {
      return false;
    }
    if (isRoadLike && (!frameMaterial.trim() || !groupset.trim() || !brakeType.trim())) {
      return false;
    }
    return true;
  }, [title, description, brand, model, size, price, isRoadLike, frameMaterial, groupset, brakeType]);

  const pickImages = async () => {
    try {
      const remaining = Math.max(0, 8 - images.length);
      if (remaining <= 0) {
        Toast.show({ type: 'info', text1: 'Bạn đã chọn tối đa 8 ảnh' });
        return;
      }

      // Dùng modal chọn nguồn ảnh (Camera/Thư viện). useImagePicker đã có fallback cho emulator.
      const picked = await showImagePicker(remaining > 1);
      const newItems = picked
        .map((asset) => asset.uri)
        .filter(Boolean)
        .slice(0, remaining) as string[];
      if (!newItems.length) return;
      setImages((prev) => [...prev, ...newItems]);
    } catch (e: any) {
      Alert.alert('Lỗi chọn ảnh', e?.message || 'Không thể mở trình chọn ảnh.');
    }
  };

  const pickVideo = async () => {
    try {
      const result = await launchImageLibrary({ mediaType: 'video', selectionLimit: 1, includeBase64: true, videoQuality: 'medium' });
      if (result.errorCode || result.didCancel || !result.assets?.[0]) {
        Alert.alert('Không mở được thư viện video', result.errorMessage || 'Thiết bị không hỗ trợ picker video.');
        return;
      }
      const asset = result.assets[0];
      if (asset.base64) {
        setVideoData(`data:${asset.type || 'video/mp4'};base64,${asset.base64}`);
        setVideoUrl('');
      } else if (asset.uri) {
        setVideoData('');
        setVideoUrl(asset.uri);
      }
    } catch (e: any) {
      Alert.alert('Lỗi chọn video', e?.message || 'Không thể mở trình chọn video.');
    }
  };

  const handleSubmit = async () => {
    // Check profile completeness first
    const profileCheck = checkProfileCompleteness(user);
    if (!profileCheck.isComplete) {
      Alert.alert(
        'Hồ sơ chưa đầy đủ',
        profileCheck.message || 'Vui lòng cập nhật đầy đủ thông tin hồ sơ (họ tên, số điện thoại, địa chỉ) trước khi tạo tin đăng.',
        [
          { text: 'Hủy', style: 'cancel' },
          {
            text: 'Cập nhật hồ sơ',
            onPress: () => {
              if (onEditProfile) {
                onEditProfile();
              } else {
                onBack();
                Alert.alert('Thông báo', 'Vui lòng vào Profile > Chỉnh sửa hồ sơ để cập nhật thông tin.');
              }
            },
          },
        ],
      );
      return;
    }

    if (!isValid) {
      Alert.alert('Thiếu thông tin', 'Vui lòng điền đủ các trường bắt buộc.');
      return;
    }

    const yearNum = Number(year);
    const amountNum = Number(price.replace(/[^\d]/g, ''));
    const weightNum = Number(weight);

    if (!yearNum || yearNum < 1980 || yearNum > new Date().getFullYear() + 1) {
      Alert.alert('Năm sản xuất không hợp lệ', 'Vui lòng kiểm tra lại năm sản xuất.');
      return;
    }
    if (!amountNum || amountNum <= 0) {
      Alert.alert('Giá bán không hợp lệ', 'Vui lòng nhập giá > 0.');
      return;
    }

    try {
      setSaving(true);
      const uploadLocalFile = async (uri: string, fileType: 'image' | 'video'): Promise<string | null> => {
        const ext = fileType === 'video' ? 'mp4' : 'jpg';
        const mime = fileType === 'video' ? 'video/mp4' : 'image/jpeg';
        const uploaded = await container().uploadFileUseCase.execute({
          uri,
          name: `${fileType}_${Date.now()}.${ext}`,
          type: mime,
        });
        return uploaded.success ? uploaded.data?.url || null : null;
      };

      const imageUrls = imageUrlsText
        .split(/[\n,]/)
        .map((item) => item.trim())
        .filter((item) => /^https?:\/\//i.test(item));

      const directImages = images.filter((item) => item.startsWith('data:') || /^https?:\/\//i.test(item));
      const localImageUris = images.filter((item) => item.startsWith('file:') || item.startsWith('content:'));
      const uploadedImageUrls = await Promise.all(localImageUris.map((uri) => uploadLocalFile(uri, 'image')));
      const thumbnails = [...directImages, ...imageUrls, ...uploadedImageUrls.filter(Boolean)] as string[];

      if (localImageUris.length > 0 && uploadedImageUrls.filter(Boolean).length === 0) {
        Toast.show({
          type: 'error',
          text1: 'Upload ảnh thất bại',
          text2: 'Không thể upload ảnh lên cloud. Vui lòng chọn lại ảnh hoặc kiểm tra mạng.',
        });
        return;
      }

      if (thumbnails.length === 0) {
        Toast.show({
          type: 'error',
          text1: 'Thiếu ảnh sản phẩm',
          text2: 'Cần ít nhất 1 ảnh sản phẩm (upload từ máy hoặc nhập URL ảnh).',
        });
        return;
      }

      let finalVideoUrl = videoData || videoUrl.trim() || undefined;
      if (videoUrl.startsWith('file:') || videoUrl.startsWith('content:')) {
        const uploadedVideoUrl = await uploadLocalFile(videoUrl, 'video');
        finalVideoUrl = uploadedVideoUrl || undefined;
      }

      const payload: CreateListingData = {
        title: title.trim(),
        description: description.trim(),
        type: toBikeType(type) as any,
        generalInfo: {
          brand: brand.trim(),
          model: model.trim(),
          year: yearNum,
          size: size.trim(),
          condition: 'GOOD' as any,
        },
        specs: {
          ...(frameMaterial.trim() ? { frameMaterial: frameMaterial.trim() } : {}),
          ...(groupset.trim() ? { groupset: groupset.trim() } : {}),
          ...(brakeType.trim() ? { brakeType: brakeType.trim() } : {}),
          ...(wheelset.trim() ? { wheelset: wheelset.trim() } : {}),
          ...(weightNum > 0 ? { weight: weightNum } : {}),
          ...(suspensionType.trim() ? { suspensionType: suspensionType.trim() } : {}),
          ...(travelFront.trim() ? { travelFront: travelFront.trim() } : {}),
          ...(motor.trim() ? { motor: motor.trim() } : {}),
          ...(battery.trim() ? { battery: battery.trim() } : {}),
        } as any,
        pricing: {
          amount: amountNum,
          currency: 'VND',
          negotiable: false,
        },
        media: {
          thumbnails,
          videoUrl: finalVideoUrl,
        },
        location: {
          coordinates: [106.6297, 10.8231],
          address: 'Ho Chi Minh City',
          showExactLocation: true,
          pickupAvailable: true,
          shippingAvailable: true,
        },
        inspectionRequired,
      };

      const res = isEditing
        ? await container().listingApiClient.updateListing(initialListing._id, payload as any)
        : await container().listingApiClient.createListing(payload);
      if (!res.success) {
        Toast.show({ type: 'error', text1: res.message || (isEditing ? 'Không thể cập nhật bài đăng' : 'Không thể tạo bài đăng') });
        return;
      }

      Toast.show({
        type: 'success',
        text1: isEditing ? 'Cập nhật sản phẩm thành công' : 'Tạo sản phẩm thành công',
        text2: isEditing ? 'Thông tin tin đăng đã được cập nhật' : 'Trạng thái bài đăng: nháp/duyệt',
      });
      onSuccess?.();
    } catch (error: any) {
      Toast.show({ type: 'error', text1: isEditing ? 'Lỗi cập nhật bài đăng' : 'Lỗi tạo bài đăng', text2: error?.message || 'Vui lòng thử lại' });
    } finally {
      setSaving(false);
    }
  };

  const renderLabel = (text: string, required?: boolean, note?: string) => (
    <Text style={styles.label}>
      {text} {required ? <Text style={styles.required}>*</Text> : null}
      {note ? <Text style={styles.note}> {note}</Text> : null}
    </Text>
  );

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={[styles.pageHeader, { paddingTop: Math.max(insets.top, 8) }]}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <ArrowLeft size={20} color={COLORS.text} />
        </TouchableOpacity>
        <View>
          <Text style={styles.breadcrumb}>
            Kho hàng / <Text style={styles.breadcrumbCurrent}>{isEditing ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}</Text>
          </Text>
          <Text style={styles.pageTitle}>{isEditing ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.formCard}>
          {renderLabel('Tên sản phẩm', true)}
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Ví dụ: Specialized Tarmac SL7 2023"
            placeholderTextColor={COLORS.textLight}
            style={styles.input}
            maxLength={200}
          />
          <Text style={styles.helpText}>5-200 ký tự</Text>

          {renderLabel('Mô tả', true)}
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Mô tả chi tiết tình trạng xe, tính năng, lịch sử sử dụng..."
            placeholderTextColor={COLORS.textLight}
            style={[styles.input, styles.textarea]}
            multiline
            textAlignVertical="top"
          />
          <Text style={styles.helpText}>Tối thiểu 10 ký tự</Text>

          <View style={styles.row}>
            <View style={styles.col}>
              {renderLabel('Loại xe', true)}
              <View style={styles.chipWrap}>
                {BIKE_TYPES.map((item) => (
                  <TouchableOpacity
                    key={item.value}
                    style={[styles.chip, type === item.value && styles.chipActive]}
                    onPress={() => setType(item.value)}
                  >
                    <Text style={[styles.chipText, type === item.value && styles.chipTextActive]}>{item.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={styles.col}>
              {renderLabel('Giá (VND)', true)}
              <TextInput
                value={price}
                onChangeText={setPrice}
                placeholder="120000000"
                placeholderTextColor={COLORS.textLight}
                style={styles.input}
                keyboardType="numeric"
              />
              <Text style={styles.helpText}>Ví dụ: 120000000</Text>
            </View>
          </View>

          <View style={styles.inspectionBox}>
            <View style={styles.inspectionRow}>
              <Switch value={inspectionRequired} onValueChange={setInspectionRequired} />
              <Text style={styles.inspectionTitle}>Yêu cầu kiểm định (Inspection Required)</Text>
            </View>
            <Text style={styles.inspectionDesc}>
              Khi bật, người mua trả thêm phí kiểm định 500.000 VND. Xe được kiểm định trước giao hàng, tăng độ tin cậy.
            </Text>
            <Text style={styles.inspectionTip}>Khuyến nghị bật để bảo vệ cả người mua và người bán.</Text>
          </View>

          <View style={styles.row}>
            <View style={styles.col}>
              {renderLabel('Thương hiệu', true)}
              <TextInput
                value={brand}
                onChangeText={setBrand}
                placeholder="Trek, Giant, Specialized..."
                placeholderTextColor={COLORS.textLight}
                style={styles.input}
              />
            </View>
            <View style={styles.col}>
              {renderLabel('Model', true)}
              <TextInput
                value={model}
                onChangeText={setModel}
                placeholder="Tarmac SL7, X-Caliber..."
                placeholderTextColor={COLORS.textLight}
                style={styles.input}
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.col}>
              {renderLabel('Năm', true)}
              <TextInput
                value={year}
                onChangeText={setYear}
                placeholder="2025"
                placeholderTextColor={COLORS.textLight}
                style={styles.input}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.col}>
              {renderLabel('Size', true)}
              <TextInput
                value={size}
                onChangeText={setSize}
                placeholder="54, M, L, 29 inch"
                placeholderTextColor={COLORS.textLight}
                style={styles.input}
              />
            </View>
          </View>

          {(isRoadLike || isMTB || isEBike || isGravel) && (
            <View style={[styles.specBox, isRoadLike ? styles.specBlue : isMTB ? styles.specGreen : isEBike ? styles.specPurple : styles.specOrange]}>
              <Text style={styles.specTitle}>
                {isRoadLike
                  ? 'Thông số kỹ thuật (bắt buộc với Road/Triathlon)'
                  : isMTB
                    ? 'Thông số kỹ thuật MTB'
                    : isEBike
                      ? 'Thông số kỹ thuật E-Bike'
                      : 'Thông số kỹ thuật Gravel'}
              </Text>

              <View style={styles.row}>
                <View style={styles.col}>
                  {renderLabel('Frame Material', isRoadLike)}
                  <TextInput style={styles.input} value={frameMaterial} onChangeText={setFrameMaterial} placeholder="Carbon, Aluminum..." placeholderTextColor={COLORS.textLight} />
                </View>
                <View style={styles.col}>
                  {renderLabel('Groupset', isRoadLike)}
                  <TextInput style={styles.input} value={groupset} onChangeText={setGroupset} placeholder="Shimano 105, SRAM Rival..." placeholderTextColor={COLORS.textLight} />
                </View>
              </View>

              <View style={styles.row}>
                <View style={styles.col}>
                  {renderLabel('Brake Type', isRoadLike)}
                  <TextInput style={styles.input} value={brakeType} onChangeText={setBrakeType} placeholder="Disc / Rim" placeholderTextColor={COLORS.textLight} />
                </View>
                <View style={styles.col}>
                  {renderLabel('Wheelset')}
                  <TextInput style={styles.input} value={wheelset} onChangeText={setWheelset} placeholder="Shimano RS500..." placeholderTextColor={COLORS.textLight} />
                </View>
              </View>

              <View style={styles.row}>
                <View style={styles.col}>
                  {renderLabel('Weight (kg)', isMTB || isEBike || isGravel)}
                  <TextInput style={styles.input} value={weight} onChangeText={setWeight} placeholder="7.5" keyboardType="numeric" placeholderTextColor={COLORS.textLight} />
                </View>
                <View style={styles.col}>
                  {isMTB ? (
                    <>
                      {renderLabel('Suspension Type')}
                      <TextInput style={styles.input} value={suspensionType} onChangeText={setSuspensionType} placeholder="Hardtail / Full-suspension" placeholderTextColor={COLORS.textLight} />
                    </>
                  ) : isEBike ? (
                    <>
                      {renderLabel('Motor')}
                      <TextInput style={styles.input} value={motor} onChangeText={setMotor} placeholder="Bosch Performance CX..." placeholderTextColor={COLORS.textLight} />
                    </>
                  ) : (
                    <>
                      {renderLabel('Battery', isEBike)}
                      <TextInput style={styles.input} value={battery} onChangeText={setBattery} placeholder="625Wh" placeholderTextColor={COLORS.textLight} />
                    </>
                  )}
                </View>
              </View>

              {isMTB && (
                <View>
                  {renderLabel('Travel Front (mm)')}
                  <TextInput style={styles.input} value={travelFront} onChangeText={setTravelFront} placeholder="120mm" placeholderTextColor={COLORS.textLight} />
                </View>
              )}
              {isEBike && (
                <View>
                  {renderLabel('Battery')}
                  <TextInput style={styles.input} value={battery} onChangeText={setBattery} placeholder="625Wh" placeholderTextColor={COLORS.textLight} />
                </View>
              )}
            </View>
          )}

          {renderLabel('Hình ảnh sản phẩm', true, '(cần ít nhất 1 ảnh)')}
          <TouchableOpacity style={styles.uploadBox} onPress={pickImages}>
            <ImagePlus size={18} color="#2563EB" />
            <Text style={styles.uploadTitle}>Kéo thả ảnh hoặc chạm để chọn</Text>
            <Text style={styles.uploadHint}>PNG, JPG - tối đa 8 ảnh</Text>
          </TouchableOpacity>
          {renderLabel('URL ảnh', false, '(mỗi URL 1 dòng hoặc cách nhau bằng dấu phẩy)')}
          <TextInput
            value={imageUrlsText}
            onChangeText={setImageUrlsText}
            placeholder={'https://.../image-1.jpg\nhttps://.../image-2.jpg'}
            placeholderTextColor={COLORS.textLight}
            style={[styles.input, styles.textareaSmall]}
            multiline
            textAlignVertical="top"
          />
          <Text style={styles.helpText}>Bạn có thể chỉ dùng URL ảnh, không cần upload file từ máy.</Text>
          {images.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.previewRow}>
              {images.map((item, index) => (
                <View key={`${index}`} style={styles.thumbWrap}>
                  <Image source={{ uri: item }} style={styles.thumb} />
                  <TouchableOpacity style={styles.removeBtn} onPress={() => setImages((prev) => prev.filter((_, i) => i !== index))}>
                    <X size={12} color={COLORS.white} />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}

          {renderLabel('Video sản phẩm', false, '(tùy chọn)')}
          <TouchableOpacity style={styles.uploadBox} onPress={pickVideo}>
            <Video size={18} color="#2563EB" />
            <Text style={styles.uploadTitle}>Chọn video hoặc chạm để tải lên</Text>
            <Text style={styles.uploadHint}>MP4/WebM - dung lượng nhỏ sẽ ổn định hơn</Text>
          </TouchableOpacity>
          {!!videoData && <Text style={styles.helpText}>Đã chọn video từ thư viện.</Text>}
          <TextInput
            value={videoUrl}
            onChangeText={setVideoUrl}
            placeholder="Hoặc nhập URL video (https://...)"
            placeholderTextColor={COLORS.textLight}
            style={styles.input}
          />

          <View style={styles.footerActions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onBack}>
              <Text style={styles.cancelText}>Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.saveBtn, (!isValid || saving) && styles.saveBtnDisabled]} onPress={handleSubmit} disabled={!isValid || saving}>
              {saving ? <ActivityIndicator size="small" color={COLORS.white} /> : <Text style={styles.saveText}>{isEditing ? 'Cập nhật sản phẩm' : 'Lưu sản phẩm'}</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8FAFC' },
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingBottom: 12,
    backgroundColor: '#F8FAFC',
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginRight: 10,
  },
  breadcrumb: { color: '#6B7280', fontSize: 12, marginBottom: 2 },
  breadcrumbCurrent: { color: '#111827', fontWeight: '600' },
  pageTitle: { color: '#111827', fontSize: 22, fontWeight: '700' },

  content: { padding: 16, paddingBottom: 28, alignItems: 'center' },
  formCard: {
    width: '100%',
    maxWidth: 760,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    ...SHADOWS.md,
  },

  label: { color: '#374151', fontSize: 13, fontWeight: '600', marginBottom: 8, marginTop: 2 },
  required: { color: '#EF4444' },
  note: { color: '#6B7280', fontWeight: '400' },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    backgroundColor: COLORS.white,
    color: '#111827',
    fontSize: 14,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  textarea: { minHeight: 96 },
  textareaSmall: { minHeight: 74 },
  helpText: { color: '#6B7280', fontSize: 11, marginTop: 5, marginBottom: 12 },
  row: { flexDirection: 'row', marginHorizontal: -6 },
  col: { flex: 1, marginHorizontal: 6 },

  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 },
  chip: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginRight: 7,
    marginBottom: 7,
    backgroundColor: '#FFFFFF',
  },
  chipActive: { backgroundColor: '#EFF6FF', borderColor: '#93C5FD' },
  chipText: { color: '#374151', fontSize: 12, fontWeight: '600' },
  chipTextActive: { color: '#1D4ED8' },

  inspectionBox: {
    borderWidth: 1,
    borderColor: '#BFDBFE',
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },
  inspectionRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  inspectionTitle: { marginLeft: 8, color: '#111827', fontWeight: '600', fontSize: 13 },
  inspectionDesc: { color: '#4B5563', fontSize: 12, lineHeight: 18 },
  inspectionTip: { color: '#1D4ED8', fontSize: 12, marginTop: 5, fontWeight: '600' },

  specBox: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    marginBottom: 14,
  },
  specBlue: { backgroundColor: '#EFF6FF', borderColor: '#DBEAFE' },
  specGreen: { backgroundColor: '#ECFDF5', borderColor: '#D1FAE5' },
  specPurple: { backgroundColor: '#F5F3FF', borderColor: '#E9D5FF' },
  specOrange: { backgroundColor: '#FFF7ED', borderColor: '#FED7AA' },
  specTitle: { fontSize: 13, fontWeight: '700', color: '#1F2937', marginBottom: 10 },

  uploadBox: {
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
    borderRadius: 10,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  uploadTitle: { marginTop: 6, fontSize: 13, color: '#374151', fontWeight: '600' },
  uploadHint: { marginTop: 4, fontSize: 11, color: '#6B7280' },
  previewRow: { marginBottom: 10 },
  thumbWrap: { width: 88, height: 88, marginRight: 8, position: 'relative' },
  thumb: { width: 88, height: 88, borderRadius: 10, backgroundColor: '#E5E7EB' },
  removeBtn: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
  },

  footerActions: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  cancelBtn: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 10,
    marginRight: 10,
  },
  cancelText: { color: '#374151', fontWeight: '600' },
  saveBtn: {
    backgroundColor: '#2563EB',
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
    minWidth: 120,
    alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.55 },
  saveText: { color: '#FFFFFF', fontWeight: '700' },
});

export default SellerCreateListingScreen;
