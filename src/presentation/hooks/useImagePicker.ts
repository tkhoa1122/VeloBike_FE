import { useState } from 'react';
import {
  launchCamera,
  launchImageLibrary,
  ImagePickerResponse,
  Asset,
  PhotoQuality,
} from 'react-native-image-picker';
import { Platform, PermissionsAndroid, Alert } from 'react-native';
import Toast from 'react-native-toast-message';
import { UploadFileData } from '../../domain/entities/Upload';

export interface UseImagePickerOptions {
  maxFiles?: number;
  quality?: PhotoQuality;
  maxWidth?: number;
  maxHeight?: number;
  includeBase64?: boolean;
}

export interface PickedImage {
  uri: string;
  name: string;
  type: string;
  size?: number;
  width?: number;
  height?: number;
}

export const useImagePicker = (options: UseImagePickerOptions = {}) => {
  const {
    maxFiles = 10,
    quality = 0.8,
    maxWidth = 1920,
    maxHeight = 1920,
    includeBase64 = false,
  } = options;

  const [loading, setLoading] = useState(false);

  /**
   * Request camera permission (Android only)
   */
  const requestCameraPermission = async (): Promise<boolean> => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Camera Permission',
            message: 'VeloBike cần quyền truy cập camera để chụp ảnh',
            buttonNeutral: 'Hỏi lại sau',
            buttonNegative: 'Hủy',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn('Camera permission error:', err);
        return false;
      }
    }
    return true;
  };

  /**
   * Convert ImagePicker response to PickedImage format
   */
  const convertToPickedImages = (response: ImagePickerResponse): PickedImage[] => {
    if (!response.assets || response.assets.length === 0) {
      return [];
    }

    return response.assets.map((asset: Asset) => ({
      uri: asset.uri || '',
      name: asset.fileName || `image_${Date.now()}.jpg`,
      type: asset.type || 'image/jpeg',
      size: asset.fileSize,
      width: asset.width,
      height: asset.height,
    }));
  };

  /**
   * Convert PickedImage to UploadFileData for API
   */
  const toUploadFileData = (images: PickedImage[]): UploadFileData[] => {
    return images.map((img) => ({
      uri: img.uri,
      name: img.name,
      type: img.type,
    }));
  };

  /**
   * Pick image from camera
   */
  const pickFromCamera = async (): Promise<PickedImage[]> => {
    setLoading(true);
    try {
      const hasPermission = await requestCameraPermission();
      if (!hasPermission) {
        Toast.show({
          type: 'error',
          text1: 'Không có quyền truy cập camera',
          text2: 'Vui lòng cấp quyền trong cài đặt',
        });
        return [];
      }

      const response = await launchCamera({
        mediaType: 'photo',
        quality,
        maxWidth,
        maxHeight,
        includeBase64,
        saveToPhotos: true,
      });

      if (response.didCancel) {
        return [];
      }

      if (response.errorCode) {
        throw new Error(response.errorMessage || 'Camera error');
      }

      return convertToPickedImages(response);
    } catch (error) {
      console.error('Pick from camera error:', error);
      Toast.show({
        type: 'error',
        text1: 'Lỗi chụp ảnh',
        text2: error instanceof Error ? error.message : 'Vui lòng thử lại',
      });
      return [];
    } finally {
      setLoading(false);
    }
  };

  /**
   * Pick image(s) from library
   */
  const pickFromLibrary = async (multiple = false): Promise<PickedImage[]> => {
    setLoading(true);
    try {
      const response = await launchImageLibrary({
        mediaType: 'photo',
        quality,
        maxWidth,
        maxHeight,
        includeBase64,
        selectionLimit: multiple ? maxFiles : 1,
      });

      if (response.didCancel) {
        return [];
      }

      if (response.errorCode) {
        throw new Error(response.errorMessage || 'Library error');
      }

      return convertToPickedImages(response);
    } catch (error) {
      console.error('Pick from library error:', error);
      Toast.show({
        type: 'error',
        text1: 'Lỗi chọn ảnh',
        text2: error instanceof Error ? error.message : 'Vui lòng thử lại',
      });
      return [];
    } finally {
      setLoading(false);
    }
  };

  /**
   * Show picker options dialog
   */
  const showImagePicker = (multiple = false): Promise<PickedImage[]> => {
    return new Promise((resolve) => {
      Alert.alert(
        'Chọn ảnh',
        'Bạn muốn chọn ảnh từ đâu?',
        [
          {
            text: 'Camera',
            onPress: async () => {
              const images = await pickFromCamera();
              resolve(images);
            },
          },
          {
            text: 'Thư viện',
            onPress: async () => {
              const images = await pickFromLibrary(multiple);
              resolve(images);
            },
          },
          {
            text: 'Hủy',
            style: 'cancel',
            onPress: () => resolve([]),
          },
        ],
        { cancelable: true }
      );
    });
  };

  return {
    loading,
    pickFromCamera,
    pickFromLibrary,
    showImagePicker,
    toUploadFileData,
  };
};
