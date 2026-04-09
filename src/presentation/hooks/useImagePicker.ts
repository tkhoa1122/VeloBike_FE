import { useState } from 'react';
import {
  launchCamera,
  launchImageLibrary,
  ImagePickerResponse,
  Asset,
} from 'react-native-image-picker';
import { pick, types, errorCodes, isErrorWithCode } from '@react-native-documents/picker';
import { Platform, PermissionsAndroid, Alert } from 'react-native';
import Toast from 'react-native-toast-message';
import { UploadFileData } from '../../domain/entities/Upload';

export interface UseImagePickerOptions {
  maxFiles?: number;
  quality?: 0 | 0.2 | 0.4 | 0.6 | 0.8 | 1;
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
    quality = 1,
    maxWidth = 4096,
    maxHeight = 4096,
    includeBase64 = false,
  } = options;

  const [loading, setLoading] = useState(false);

  const isPickerCancellation = (error: unknown): boolean => {
    if (isErrorWithCode(error) && error.code === errorCodes.OPERATION_CANCELED) {
      return true;
    }

    const message = error instanceof Error ? error.message.toLowerCase() : '';
    return (
      message.includes('cancel') ||
      message.includes('canceled') ||
      message.includes('cancelled')
    );
  };

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
        setLoading(false);
        return [];
      }

      const response = await launchCamera({
        mediaType: 'photo',
        quality: quality || 0.8,
        maxWidth,
        maxHeight,
        includeBase64,
        saveToPhotos: true,
      });

      if (response.didCancel) {
        setLoading(false);
        return [];
      }

      if (response.errorCode) {
        console.error('Camera error code:', response.errorCode, response.errorMessage);
        throw new Error(response.errorMessage || 'Lỗi camera');
      }

      const images = convertToPickedImages(response);
      setLoading(false);
      return images;
    } catch (error) {
      console.error('Pick from camera error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Vui lòng thử lại';
      Toast.show({
        type: 'error',
        text1: 'Lỗi chụp ảnh',
        text2: errorMsg,
      });
      setLoading(false);
      return [];
    }
  };

  /**
   * Pick image(s) from library
   * Android: System document picker (Photos/Files/Drive)
   * iOS: Native image library picker
   * Production-grade error handling for eKYC and general uploads
   */
  const pickFromLibrary = async (multiple = false): Promise<PickedImage[]> => {
    setLoading(true);
    try {
      console.log('[ImagePicker] Starting library pick:', {
        platform: Platform.OS,
        multiple,
        quality,
        maxWidth,
        maxHeight,
      });

      if (Platform.OS === 'android') {
        try {
          const docs = await pick({
            type: [types.images],
            allowMultiSelection: multiple,
            mode: 'open',
            transitionStyle: 'pop',
            presentationStyle: 'fullScreen',
            copyTo: 'cachesDirectory',
          });

          if (!docs || docs.length === 0) {
            console.log('[ImagePicker] User cancelled or no images selected');
            setLoading(false);
            return [];
          }

          const limitedDocs = multiple ? docs.slice(0, maxFiles) : docs.slice(0, 1);
          const pickedImages = limitedDocs.map((doc, index) => {
            const picked: PickedImage = {
              uri: doc.uri,
              name: doc.name || `image_${Date.now()}_${index}.jpg`,
              type: doc.type || 'image/jpeg',
              size: doc.size,
              width: doc.width,
              height: doc.height,
            };
            console.log('[ImagePicker] Picked:', {
              name: picked.name,
              size: picked.size,
              type: picked.type,
              dimensions: `${picked.width}x${picked.height}`,
            });
            return picked;
          });

          setLoading(false);
          return pickedImages;
        } catch (androidError) {
          if (isPickerCancellation(androidError)) {
            setLoading(false);
            return [];
          }
          console.error('[ImagePicker] Android picker error:', androidError);
          throw androidError;
        }
      }

      // iOS fallback
      const response = await launchImageLibrary({
        mediaType: 'photo',
        quality: Math.min(quality, 1) || 1,
        maxWidth: Math.max(maxWidth, 4096),
        maxHeight: Math.max(maxHeight, 4096),
        includeBase64: false,
        selectionLimit: multiple ? maxFiles : 1,
      });

      if (response.didCancel) {
        console.log('[ImagePicker] iOS: User cancelled');
        setLoading(false);
        return [];
      }

      if (response.errorCode) {
        const errorMsg = response.errorMessage || 'Unknown iOS picker error';
        console.error('[ImagePicker] iOS error:', {
          code: response.errorCode,
          message: errorMsg,
        });
        throw new Error(errorMsg);
      }

      const images = convertToPickedImages(response);
      setLoading(false);
      return images;
    } catch (error) {
      if (isPickerCancellation(error)) {
        setLoading(false);
        return [];
      }

      console.error('[ImagePicker] Library pick failed:', error);
      
      const errorMsg = error instanceof Error ? error.message : 'Lỗi không xác định';
      Toast.show({
        type: 'error',
        text1: 'Lỗi chọn ảnh',
        text2: errorMsg,
      });

      setLoading(false);
      return [];
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
