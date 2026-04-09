/**
 * useUpload Hook - Complete upload management hook
 * Handles file selection, validation, upload, and progress tracking
 */

import { useCallback, useState, useRef } from 'react';
import Toast from 'react-native-toast-message';
import { container } from '../../di/Container';
import { UploadFileData } from '../../domain/entities/Upload';
import { useUploadStore } from '../stores/uploadStore';
import { useImagePicker } from './useImagePicker';
import { isValidImageType, isValidVideoType } from '../../utils/imageProcessing';

export interface UseUploadOptions {
  maxFiles?: number;
  quality?: 0 | 0.2 | 0.4 | 0.6 | 0.8 | 1;
  imageQuality?: number;
  videoQuality?: number;
  maxRetries?: number;
  sequential?: boolean; // For multiple uploads
  onSuccess?: (urls: string[], taskIds: string[]) => void;
  onError?: (error: Error) => void;
  onProgress?: (progress: number) => void;
}

export interface UploadProgress {
  taskId: string;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'failed' | 'cancelled';
  error?: string;
  url?: string;
}

export const useUpload = (options: UseUploadOptions = {}) => {
  const {
    maxFiles = 10,
    quality = 0.8,
    maxRetries = 3,
    sequential = true,
    onSuccess,
    onError,
    onProgress: onProgressCallback,
  } = options;

  const [uploading, setUploading] = useState(false);
  const [uploadPause, setUploadPause] = useState(false);

  const uploadStore = useUploadStore();
  const imagePicker = useImagePicker({ maxFiles, quality });
  const activeUploadsRef = useRef<Set<string>>(new Set());

  /**
   * Validate files before upload
   */
  const validateFiles = useCallback(
    (files: UploadFileData[]): { valid: UploadFileData[]; invalid: string[] } => {
      const validFiles: UploadFileData[] = [];
      const invalidFiles: string[] = [];

      files.forEach((file, index) => {
        try {
          // Check if file type is supported
          const isImage = isValidImageType(file.type);
          const isVideo = isValidVideoType(file.type);

          if (!isImage && !isVideo) {
            invalidFiles.push(`File ${index + 1}: Định dạng không được hỗ trợ (${file.type})`);
            return;
          }

          // Basic validation
          if (!file.uri || !file.name) {
            invalidFiles.push(`File ${index + 1}: Thông tin file không hợp lệ`);
            return;
          }

          validFiles.push(file);
        } catch (error) {
          invalidFiles.push(
            `File ${index + 1}: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`
          );
        }
      });

      return { valid: validFiles, invalid: invalidFiles };
    },
    []
  );

  /**
   * Upload single file
   */
  const uploadSingleFile = useCallback(
    async (file: UploadFileData): Promise<{ success: boolean; url?: string; error?: string }> => {
      let taskId = '';

      try {
        if (uploadPause) {
          return { success: false, error: 'Upload đã bị tạm dừng' };
        }

        // Validate
        const { valid, invalid } = validateFiles([file]);
        if (invalid.length > 0) {
          return { success: false, error: invalid[0] };
        }

        // Add to store
        taskId = uploadStore.addTask(file);
        activeUploadsRef.current.add(taskId);
        uploadStore.updateTaskStatus(taskId, 'uploading');

        // Upload
        const response = await container().uploadFileUseCase.execute(file);

        if (!response.success || !response.data?.url) {
          throw new Error(response.error || response.message || 'Upload failed');
        }

        // Success
        uploadStore.updateTaskStatus(taskId, 'completed', undefined, response.data.url);
        activeUploadsRef.current.delete(taskId);

        return { success: true, url: response.data.url };
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Không thể upload file';

        if (taskId) {
          uploadStore.updateTaskStatus(taskId, 'failed', errorMsg);
          activeUploadsRef.current.delete(taskId);
        }

        return { success: false, error: errorMsg };
      }
    },
    [validateFiles, uploadPause, maxRetries, uploadStore, onProgressCallback]
  );

  /**
   * Upload multiple files
   */
  const uploadMultipleFiles = useCallback(
    async (files: UploadFileData[]): Promise<{ success: boolean; urls?: string[]; errors?: string[] }> => {
      try {
        if (!files || files.length === 0) {
          Toast.show({ type: 'error', text1: 'Vui lòng chọn ít nhất 1 file' });
          return { success: false, errors: ['Không có file được chọn'] };
        }

        if (files.length > maxFiles) {
          Toast.show({
            type: 'error',
            text1: `Tối đa ${maxFiles} files`,
            text2: `Bạn chọn ${files.length} files`,
          });
          return { success: false, errors: [`Vượt quá giới hạn ${maxFiles} files`] };
        }

        // Validate all files
        const { valid, invalid } = validateFiles(files);
        if (invalid.length > 0) {
          Toast.show({ type: 'error', text1: 'Một số file không hợp lệ', text2: invalid[0] });
        }

        if (valid.length === 0) {
          return { success: false, errors: invalid };
        }

        // Add all to store
        const taskIds = uploadStore.addMultipleTasks(valid);
        taskIds.forEach((id) => activeUploadsRef.current.add(id));

        setUploading(true);

        const uploadedUrls: string[] = [];
        const uploadErrors: string[] = [];

        if (sequential) {
          // Upload one by one
          for (let i = 0; i < taskIds.length; i++) {
            const taskId = taskIds[i];
            const file = valid[i];

            const result = await uploadSingleFile(file);
            if (result.success && result.url) {
              uploadedUrls.push(result.url);
            } else {
              uploadErrors.push(result.error || 'Upload failed');
            }

            // Update overall progress
            const progressPercent = ((i + 1) / taskIds.length) * 100;
            onProgressCallback?.(progressPercent);
          }
        } else {
          // Upload all in parallel
          const uploadPromises = valid.map((file, index) => {
            const taskId = taskIds[index];

            return uploadSingleFile(file).then((result) => {
              if (result.success && result.url) {
                uploadedUrls.push(result.url);
              } else {
                uploadErrors.push(result.error || 'Upload failed');
              }
            });
          });

          await Promise.all(uploadPromises);
        }

        setUploading(false);

        // Show results
        if (uploadedUrls.length > 0) {
          Toast.show({
            type: 'success',
            text1: `Tải ${uploadedUrls.length}/${valid.length} file thành công`,
          });
          onSuccess?.(uploadedUrls, taskIds.slice(0, uploadedUrls.length));
        }

        if (uploadErrors.length > 0) {
          Toast.show({
            type: 'error',
            text1: `${uploadErrors.length} file upload thất bại`,
            text2: uploadErrors[0],
          });
          onError?.(new Error(uploadErrors[0]));
        }

        return { success: uploadedUrls.length > 0, urls: uploadedUrls, errors: uploadErrors };
      } catch (error) {
        setUploading(false);
        const errorMsg = error instanceof Error ? error.message : 'Lỗi upload';
        Toast.show({ type: 'error', text1: 'Lỗi', text2: errorMsg });
        onError?.(error instanceof Error ? error : new Error(errorMsg));

        return { success: false, errors: [errorMsg] };
      }
    },
    [
      validateFiles,
      uploadSingleFile,
      maxFiles,
      sequential,
      uploadStore,
      onProgressCallback,
      onSuccess,
      onError,
    ]
  );

  /**
   * Pick and upload image from camera
   */
  const pickAndUploadFromCamera = useCallback(async (): Promise<string | null> => {
    try {
      const images = await imagePicker.pickFromCamera();
      if (images.length === 0) return null;

      const uploadData = imagePicker.toUploadFileData(images);
      const result = await uploadSingleFile(uploadData[0]);

      return result.success ? result.url || null : null;
    } catch (error) {
      console.error('Pick and upload from camera error:', error);
      return null;
    }
  }, [imagePicker, uploadSingleFile]);

  /**
   * Pick and upload images from library
   */
  const pickAndUploadFromLibrary = useCallback(
    async (multiple = false): Promise<string[] | null> => {
      try {
        const images = await imagePicker.pickFromLibrary(multiple);
        if (images.length === 0) return null;

        const uploadData = imagePicker.toUploadFileData(images);
        const result = await uploadMultipleFiles(uploadData);

        return result.success ? result.urls || null : null;
      } catch (error) {
        console.error('Pick and upload from library error:', error);
        return null;
      }
    },
    [imagePicker, uploadMultipleFiles]
  );

  /**
   * Show picker and upload
   */
  const pickAndUpload = useCallback(
    async (multiple = false): Promise<string[] | string | null> => {
      try {
        const images = await imagePicker.showImagePicker(multiple);
        if (images.length === 0) return null;

        const uploadData = imagePicker.toUploadFileData(images);

        if (multiple) {
          const result = await uploadMultipleFiles(uploadData);
          return result.success ? result.urls || null : null;
        } else {
          const result = await uploadSingleFile(uploadData[0]);
          return result.success ? result.url || null : null;
        }
      } catch (error) {
        console.error('Pick and upload error:', error);
        return null;
      }
    },
    [imagePicker, uploadSingleFile, uploadMultipleFiles]
  );

  /**
   * Cancel upload
   */
  const cancelUpload = useCallback((taskId: string) => {
    uploadStore.cancelTask(taskId);
    activeUploadsRef.current.delete(taskId);
  }, [uploadStore]);

  /**
   * Retry failed upload
   */
  const retryUpload = useCallback(
    (taskId: string) => {
      const task = uploadStore.getTask(taskId);
      if (!task) return;

      uploadStore.retryTask(taskId);
      uploadSingleFile(task.file);
    },
    [uploadStore, uploadSingleFile]
  );

  /**
   * Pause all uploads (for implementation later if needed)
   */
  const pauseUploads = useCallback(() => {
    setUploadPause(true);
  }, []);

  /**
   * Resume all uploads
   */
  const resumeUploads = useCallback(() => {
    setUploadPause(false);
  }, []);

  /**
   * Get upload task
   */
  const getUploadTask = useCallback(
    (taskId: string) => uploadStore.getTask(taskId),
    [uploadStore]
  );

  /**
   * Get all upload tasks
   */
  const getAllUploadTasks = useCallback(() => uploadStore.getTasksArray(), [uploadStore]);

  /**
   * Get active uploads
   */
  const getActiveUploads = useCallback(() => uploadStore.getActiveTasks(), [uploadStore]);

  /**
   * Get failed uploads
   */
  const getFailedUploads = useCallback(() => uploadStore.getFailedTasks(), [uploadStore]);

  /**
   * Clear completed uploads
   */
  const clearCompleted = useCallback(() => {
    uploadStore.clearCompleted();
  }, [uploadStore]);

  /**
   * Clear all uploads
   */
  const clearAll = useCallback(() => {
    uploadStore.clearAll();
  }, [uploadStore]);

  return {
    // State
    uploading,
    paused: uploadPause,
    isLoading: imagePicker.loading,
    totalProgress: uploadStore.getTotalProgress(),

    // Single file upload
    uploadSingleFile,
    uploadMultipleFiles,

    // Picker + Upload
    pickAndUpload,
    pickAndUploadFromCamera,
    pickAndUploadFromLibrary,

    // Control
    cancelUpload,
    retryUpload,
    pauseUploads,
    resumeUploads,
    clearCompleted,
    clearAll,

    // Status
    getUploadTask,
    getAllUploadTasks,
    getActiveUploads,
    getFailedUploads,

    // Validation
    validateFiles,
  };
};

export default useUpload;
