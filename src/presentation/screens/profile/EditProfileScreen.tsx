/**
 * VeloBike Edit Profile Screen
 * Edit fullName, phone, address, body measurements
 */
import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Animated,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Camera, UserCircle } from 'lucide-react-native';
import {
  COLORS,
  SPACING,
  RADIUS,
  FONT_SIZES,
  FONT_WEIGHTS,
  SHADOWS,
} from '../../../config/theme';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { useAuthStore } from '../../viewmodels/AuthStore';
import { useImagePicker } from '../../hooks/useImagePicker';
import { container } from '../../../di/Container';

interface EditProfileScreenProps {
  onBack?: () => void;
  onSave?: () => void;
}

export const EditProfileScreen: React.FC<EditProfileScreenProps> = ({ onBack, onSave }) => {
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | undefined>(user?.avatar);
  const { showImagePicker } = useImagePicker({ maxFiles: 1, quality: 0.8, maxWidth: 1024, maxHeight: 1024 });

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [street, setStreet] = useState(user?.address?.street || '');
  const [district, setDistrict] = useState(user?.address?.district || '');
  const [city, setCity] = useState(user?.address?.city || '');
  const [height, setHeight] = useState(user?.bodyMeasurements?.height?.toString() || '');
  const [inseam, setInseam] = useState(user?.bodyMeasurements?.inseam?.toString() || '');
  const [weight, setWeight] = useState(user?.bodyMeasurements?.weight?.toString() || '');

  // Track if form has been manually edited by user to avoid overwriting their input
  const [formInitialized, setFormInitialized] = useState(false);

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, [fadeAnim]);

  useEffect(() => {
    setAvatarPreview(user?.avatar);
  }, [user?.avatar]);

  // Sync form fields when user data loads (e.g. after full profile fetch on login)
  useEffect(() => {
    if (user && !formInitialized) {
      setFullName(user.fullName || '');
      setPhone(user.phone || '');
      setStreet(user.address?.street || '');
      setDistrict(user.address?.district || '');
      setCity(user.address?.city || '');
      setHeight(user.bodyMeasurements?.height?.toString() || '');
      setInseam(user.bodyMeasurements?.inseam?.toString() || '');
      setWeight(user.bodyMeasurements?.weight?.toString() || '');
      setFormInitialized(true);
    }
  }, [user, formInitialized]);

  const handleChangeAvatar = useCallback(async () => {
    try {
      const images = await showImagePicker(false);
      if (!images.length) return;

      const picked = images[0];
      setAvatarPreview(picked.uri);
      setUploadingAvatar(true);

      const result = await container().authApiClient.uploadAvatar({
        uri: picked.uri,
        name: picked.name,
        type: picked.type,
      });

      if (!result.success) {
        throw new Error(result.message || 'Upload ảnh đại diện thất bại');
      }

      await useAuthStore.getState().getCurrentUser(false, true);
      Alert.alert('Thành công', 'Đã cập nhật ảnh đại diện');
    } catch (err) {
      setAvatarPreview(user?.avatar);
      Alert.alert('Lỗi', err instanceof Error ? err.message : 'Không thể tải ảnh đại diện lên');
    } finally {
      setUploadingAvatar(false);
    }
  }, [showImagePicker, user?.avatar]);

  const handleSave = useCallback(async () => {
    if (!fullName.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập họ tên');
      return;
    }
    setSaving(true);
    try {
      const { updateProfile } = useAuthStore.getState();
      const ok = await updateProfile({
        fullName: fullName.trim(),
        phone: phone.trim() || undefined,
        address: (street || district || city) ? {
          street: street.trim(),
          district: district.trim(),
          city: city.trim(),
          province: city.trim(),
        } : undefined,
        bodyMeasurements: height ? {
          height: Number(height),
          inseam: inseam ? Number(inseam) : undefined,
          weight: weight ? Number(weight) : undefined,
        } : undefined,
      });

      if (ok) {
        Alert.alert('Thành công', 'Đã cập nhật thông tin hồ sơ!', [{ text: 'OK', onPress: onSave }]);
      } else {
        const err = useAuthStore.getState().error;
        Alert.alert('Lỗi', err || 'Không thể cập nhật hồ sơ. Vui lòng thử lại.');
      }
    } catch (err) {
      Alert.alert('Lỗi', 'Không thể cập nhật hồ sơ. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  }, [fullName, phone, street, district, city, height, inseam, weight, onSave]);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <ArrowLeft size={22} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chỉnh sửa hồ sơ</Text>
        <View style={{ width: 30 }} />
      </View>

      <Animated.ScrollView style={{ opacity: fadeAnim }} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarWrap}>
            {avatarPreview ? (
              <Image source={{ uri: avatarPreview }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <UserCircle size={50} color={COLORS.primaryLight} strokeWidth={1} />
              </View>
            )}
            <TouchableOpacity style={styles.cameraBtn} onPress={handleChangeAvatar} disabled={uploadingAvatar}>
              {uploadingAvatar ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <Camera size={16} color={COLORS.white} />
              )}
            </TouchableOpacity>
          </View>
          <Text style={styles.avatarHint}>Nhấn để đổi ảnh đại diện</Text>
        </View>

        {/* Basic info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin cơ bản</Text>
          <Input label="Họ và tên" value={fullName} onChangeText={setFullName} placeholder="Nhập họ và tên" />
          <Input label="Số điện thoại" value={phone} onChangeText={setPhone} placeholder="0xxx xxx xxx" keyboardType="phone-pad" />
          <Input label="Email" value={user?.email || ''} editable={false} placeholder="" />
        </View>

        {/* Address */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Địa chỉ</Text>
          <Input label="Đường/Số nhà" value={street} onChangeText={setStreet} placeholder="Ví dụ: 123 Nguyễn Trãi" />
          <Input label="Quận/Huyện" value={district} onChangeText={setDistrict} placeholder="Ví dụ: Cầu Giấy" />
          <Input label="Thành phố" value={city} onChangeText={setCity} placeholder="Ví dụ: Hà Nội" />
        </View>

        {/* Body measurements (for bike fitting) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Số đo cơ thể</Text>
          <Text style={styles.sectionHint}>Giúp gợi ý size xe phù hợp</Text>
          <View style={styles.measureRow}>
            <View style={styles.measureField}>
              <Input label="Chiều cao (cm)" value={height} onChangeText={setHeight} placeholder="170" keyboardType="numeric" />
            </View>
            <View style={styles.measureField}>
              <Input label="Inseam (cm)" value={inseam} onChangeText={setInseam} placeholder="82" keyboardType="numeric" />
            </View>
          </View>
          <Input label="Cân nặng (kg)" value={weight} onChangeText={setWeight} placeholder="70" keyboardType="numeric" />
        </View>

        {/* Save button */}
        <View style={styles.saveSection}>
          <Button title="Lưu thay đổi" onPress={handleSave} loading={saving} />
        </View>

        <View style={{ height: 40 }} />
      </Animated.ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.base, paddingVertical: SPACING.md, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: FONT_SIZES.lg, fontWeight: FONT_WEIGHTS.semibold, color: COLORS.text },
  scrollContent: { paddingHorizontal: SPACING.xl },
  avatarSection: { alignItems: 'center', paddingVertical: SPACING.xl },
  avatarWrap: { position: 'relative' },
  avatar: { width: 90, height: 90, borderRadius: 45, backgroundColor: COLORS.skeleton },
  avatarPlaceholder: { width: 90, height: 90, borderRadius: 45, backgroundColor: COLORS.primarySurface, justifyContent: 'center', alignItems: 'center' },
  cameraBtn: { position: 'absolute', bottom: 0, right: 0, width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: COLORS.white },
  avatarHint: { fontSize: FONT_SIZES.sm, color: COLORS.textLight, marginTop: SPACING.sm },
  section: { marginTop: SPACING.xl },
  sectionTitle: { fontSize: FONT_SIZES.lg, fontWeight: FONT_WEIGHTS.bold, color: COLORS.text, marginBottom: SPACING.sm },
  sectionHint: { fontSize: FONT_SIZES.sm, color: COLORS.textLight, marginBottom: SPACING.sm },
  measureRow: { flexDirection: 'row', gap: SPACING.md },
  measureField: { flex: 1 },
  saveSection: { marginTop: SPACING['2xl'] },
});

export default EditProfileScreen;
