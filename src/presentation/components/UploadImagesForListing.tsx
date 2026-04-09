/**
 * Example: Upload Images for Listing
 * Demonstrates complete upload workflow for seller listings
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
  Alert,
} from 'react-native';
import { Plus, Trash2, RotateCcw } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import {
  COLORS,
  SPACING,
  FONT_SIZES,
  RADIUS,
} from '../../config/theme';
import { UploadButton } from './UploadButton';
import { UploadProgressList, UploadProgressOverlay } from './UploadProgress';
import useUpload from '../hooks/useUpload';
import { UploadTask } from '../stores/uploadStore';

interface ListingImage {
  id: string;
  url: string;
  isMain: boolean;
  uploadedAt: number;
}

interface UploadImagesForListingProps {
  onImagesSelected: (images: ListingImage[]) => void;
  maxImages?: number;
  initialImages?: ListingImage[];
}

/**
 * Real-world example: Upload images for a bike listing
 */
export const UploadImagesForListing: React.FC<UploadImagesForListingProps> = ({
  onImagesSelected,
  maxImages = 10,
  initialImages = [],
}) => {
  const [uploadedImages, setUploadedImages] = useState<ListingImage[]>(initialImages);
  const [showProgressOverlay, setShowProgressOverlay] = useState(false);

  const {
    pickAndUpload,
    pickAndUploadFromCamera,
    uploadMultipleFiles,
    getAllUploadTasks,
    getActiveUploads,
    getFailedUploads,
    totalProgress,
    uploading,
    cancelUpload,
    retryUpload,
    clearCompleted,
  } = useUpload({
    maxFiles: maxImages,
    sequential: false, // Upload in parallel for better UX
    quality: 0.8,
    onSuccess: (urls: string[]) => {
      // Add uploaded URLs to list
      const newImages: ListingImage[] = urls.map((url: string, idx: number) => ({
        id: `img_${Date.now()}_${idx}`,
        url,
        isMain: uploadedImages.length === 0 && idx === 0, // First image is main
        uploadedAt: Date.now(),
      }));

      setUploadedImages((prev) => [...prev, ...newImages]);
      onImagesSelected([...uploadedImages, ...newImages]);

      Toast.show({
        type: 'success',
        text1: `Tải ${urls.length} ảnh thành công`,
      });

      setShowProgressOverlay(false);
    },
    onError: (error: Error) => {
      Toast.show({
        type: 'error',
        text1: 'Lỗi upload',
        text2: error.message,
      });
    },
  });

  const tasks = getAllUploadTasks();
  const activeTasks = getActiveUploads();
  const failedTasks = getFailedUploads();

  /**
   * Handle upload from gallery
   */
  const handlePickMultiple = useCallback(async () => {
    const remaining = maxImages - uploadedImages.length;
    if (remaining <= 0) {
      Toast.show({
        type: 'error',
        text1: `Đã đạt giới hạn ${maxImages} ảnh`,
      });
      return;
    }

    if (remaining < 10) {
      Toast.show({
        type: 'info',
        text1: `Chỉ có thể upload ${remaining} ảnh nữa`,
      });
    }

    setShowProgressOverlay(true);
    const urls = await pickAndUpload(true);
    if (!urls) {
      setShowProgressOverlay(false);
    }
  }, [pickAndUpload, uploadedImages.length, maxImages]);

  /**
   * Handle upload from camera
   */
  const handlePickFromCamera = useCallback(async () => {
    if (uploadedImages.length >= maxImages) {
      Toast.show({
        type: 'error',
        text1: `Đã đạt giới hạn ${maxImages} ảnh`,
      });
      return;
    }

    setShowProgressOverlay(true);
    const url = await pickAndUploadFromCamera();
    if (!url) {
      setShowProgressOverlay(false);
    }
  }, [pickAndUploadFromCamera, uploadedImages.length, maxImages]);

  /**
   * Set main image
   */
  const handleSetMainImage = (imageId: string) => {
    const updated = uploadedImages.map((img) => ({
      ...img,
      isMain: img.id === imageId,
    }));
    setUploadedImages(updated);
    onImagesSelected(updated);

    Toast.show({
      type: 'success',
      text1: 'Đã đặt ảnh chính',
    });
  };

  /**
   * Remove image
   */
  const handleRemoveImage = (imageId: string) => {
    Alert.alert(
      'Xóa ảnh',
      'Bạn chắc chắn muốn xóa ảnh này?',
      [
        {
          text: 'Hủy',
          style: 'cancel',
        },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: () => {
            const updated = uploadedImages.filter((img) => img.id !== imageId);
            setUploadedImages(updated);
            onImagesSelected(updated);

            Toast.show({
              type: 'success',
              text1: 'Đã xóa ảnh',
            });
          },
        },
      ]
    );
  };

  /**
   * Render uploaded image thumbnail
   */
  const renderImageThumbnail = ({ item }: { item: ListingImage }) => (
    <View style={styles.thumbnailContainer}>
      <Image
        source={{ uri: item.url }}
        style={styles.thumbnail}
      />

      <View style={styles.thumbnailOverlay}>
        {item.isMain && (
          <View style={styles.mainBadge}>
            <Text style={styles.mainBadgeText}>Chính</Text>
          </View>
        )}
      </View>

      <View style={styles.thumbnailActions}>
        {!item.isMain && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleSetMainImage(item.id)}
          >
            <Text style={styles.actionText}>Chính</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.actionButton, styles.dangerButton]}
          onPress={() => handleRemoveImage(item.id)}
        >
          <Trash2 size={16} color={COLORS.textOnPrimary} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const canAddMore = uploadedImages.length < maxImages;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>
          Ảnh sản phẩm ({uploadedImages.length}/{maxImages})
        </Text>
        <Text style={styles.subtitle}>
          Tối thiểu {Math.max(1, Math.ceil(maxImages / 3))} ảnh, tối đa {maxImages} ảnh
        </Text>
      </View>

      {/* Uploaded Images */}
      {uploadedImages.length > 0 && (
        <View style={styles.section}>
          <FlatList
            data={uploadedImages}
            renderItem={renderImageThumbnail}
            keyExtractor={(item) => item.id}
            numColumns={3}
            scrollEnabled={false}
            columnWrapperStyle={styles.imageGrid}
            contentContainerStyle={styles.imageGridContent}
          />
        </View>
      )}

      {/* Upload Buttons */}
      {canAddMore && (
        <View style={styles.section}>
          <Text style={styles.subheading}>Thêm ảnh</Text>

          <View style={styles.buttonGroup}>
            <UploadButton
              label={`Chọn ảnh (${maxImages - uploadedImages.length} còn lại)`}
              multiple={true}
              onUpload={handlePickMultiple}
              size="md"
              variant="primary"
              style={{ flex: 1 }}
            />

            <UploadButton
              label="Chụp ảnh"
              pickFromCamera={true}
              onUpload={handlePickFromCamera}
              size="md"
              variant="secondary"
              style={{ flex: 1, marginLeft: SPACING.sm }}
            />
          </View>
        </View>
      )}

      {/* Active Uploads */}
      {activeTasks.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.subheading}>Đang upload</Text>
          <UploadProgressList
            tasks={activeTasks}
            onCancel={cancelUpload}
            onRetry={retryUpload}
          />
        </View>
      )}

      {/* Failed Uploads */}
      {failedTasks.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.subheading, { color: COLORS.error }]}>Upload thất bại</Text>
          <UploadProgressList
            tasks={failedTasks}
            onRetry={retryUpload}
          />
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              failedTasks.forEach((task: UploadTask) => retryUpload(task.id));
              Toast.show({ type: 'info', text1: 'Đang thử lại...' });
            }}
          >
            <RotateCcw size={16} color={COLORS.textOnPrimary} />
            <Text style={styles.retryButtonText}>Thử lại tất cả</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Upload Requirements */}
      <View style={styles.section}>
        <Text style={styles.subheading}>Yêu cầu</Text>
        <View style={styles.requirementsList}>
          <RequirementItem text="Ảnh rõ ràng, không mờ" />
          <RequirementItem text="Định dạng: JPG, PNG, WebP" />
          <RequirementItem text="Kích thước: 200x200px tối thiểu" />
          <RequirementItem text={`Dung lượng tối đa: 10MB/ảnh`} />
          <RequirementItem
            text={uploadedImages.length === 0 ? '✓ Ảnh chính là ảnh đầu tiên' : `✓ Ảnh chính: ${uploadedImages.find((img) => img.isMain)?.id}`}
            passed
          />
        </View>
      </View>

      {/* Help Text */}
      {uploadedImages.length === 0 && (
        <View style={styles.emptyState}>
          <Plus size={40} color={COLORS.textSecondary} />
          <Text style={styles.emptyStateText}>Chọn ảnh để hiển thị sản phẩm</Text>
        </View>
      )}

      {/* Upload Progress Overlay */}
      <UploadProgressOverlay
        visible={showProgressOverlay && uploading}
        progress={totalProgress}
        message={`Uploading: ${totalProgress}%`}
        onCancel={() => setShowProgressOverlay(false)}
      />

      {/* Upload Status Summary */}
      {tasks.length > 0 && (
        <View style={styles.statusBar}>
          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>Tổng</Text>
            <Text style={styles.statusValue}>{tasks.length}</Text>
          </View>
          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>Thành công</Text>
            <Text style={[styles.statusValue, { color: COLORS.success }]}>
              {tasks.filter((t: UploadTask) => t.status === 'completed').length}
            </Text>
          </View>
          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>Lỗi</Text>
            <Text style={[styles.statusValue, { color: COLORS.error }]}>
              {failedTasks.length}
            </Text>
          </View>
          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>Tiến độ</Text>
            <Text style={styles.statusValue}>{totalProgress}%</Text>
          </View>
        </View>
      )}
    </View>
  );
};

/**
 * Requirement item component
 */
const RequirementItem: React.FC<{ text: string; passed?: boolean }> = ({ text, passed }) => (
  <View style={styles.requirementItem}>
    <View style={[styles.checkmark, passed && styles.checkmarkPassed]} />
    <Text style={[styles.requirementText, passed && styles.requirementTextPassed]}>
      {text}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // Header
  header: {
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },

  // Section
  section: {
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  subheading: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },

  // Image Grid
  imageGrid: {
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  imageGridContent: {
    paddingBottom: SPACING.md,
  },
  thumbnailContainer: {
    width: '30%',
    aspectRatio: 1,
    marginBottom: SPACING.md,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    backgroundColor: COLORS.surface,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  thumbnailOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
    padding: SPACING.xs,
  },
  mainBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  mainBadgeText: {
    color: COLORS.textOnPrimary,
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
  },
  thumbnailActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: SPACING.xs,
    padding: SPACING.xs,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  actionButton: {
    flex: 1,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
  },
  dangerButton: {
    backgroundColor: COLORS.error,
  },
  actionText: {
    color: COLORS.textOnPrimary,
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
  },

  // Buttons
  buttonGroup: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },

  // Retry Button
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    backgroundColor: COLORS.error,
    borderRadius: RADIUS.md,
    marginTop: SPACING.md,
  },
  retryButtonText: {
    color: COLORS.textOnPrimary,
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },

  // Requirements
  requirementsList: {
    gap: SPACING.sm,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  checkmark: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.textSecondary,
  },
  checkmarkPassed: {
    borderColor: COLORS.success,
    backgroundColor: COLORS.success,
  },
  requirementText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    flex: 1,
  },
  requirementTextPassed: {
    color: COLORS.success,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xl,
  },
  emptyStateText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
  },

  // Status Bar
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  statusItem: {
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  statusValue: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: COLORS.text,
  },
});

export default UploadImagesForListing;
