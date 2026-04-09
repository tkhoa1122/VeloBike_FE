import { BaseApiClient } from './BaseApiClient';

export interface UploadFileData {
  uri: string;
  name: string;
  type: string;
}

export interface UploadResponseModel {
  success: boolean;
  message?: string;
  url: string;
  publicId?: string;
  key?: string;
}

export interface UploadMultipleResponseModel {
  success: boolean;
  message?: string;
  urls: string[];
}

export interface UploadOptions {
  maxRetries?: number; // Default: 3
  retryDelayMs?: number; // Default: 1000
  timeoutMs?: number; // Default: 60000
  onProgress?: (progress: number) => void; // 0-100
}

/**
 * Detailed error information for upload failures
 */
export class UploadError extends Error {
  constructor(
    message: string,
    public code: string,
    public isRetryable: boolean = false,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'UploadError';
  }
}

export class UploadApiClient extends BaseApiClient {
  private DEFAULT_MAX_RETRIES = 3;
  private DEFAULT_RETRY_DELAY = 1000;
  private DEFAULT_TIMEOUT = 60000;

  /**
   * Determine MIME type from filename
   */
  private getMimeTypeByName(name: string): string {
    const lower = name.toLowerCase();
    if (lower.endsWith('.png')) return 'image/png';
    if (lower.endsWith('.webp')) return 'image/webp';
    if (lower.endsWith('.heic') || lower.endsWith('.heif')) return 'image/heic';
    if (lower.endsWith('.gif')) return 'image/gif';
    if (lower.endsWith('.mp4')) return 'video/mp4';
    if (lower.endsWith('.mov')) return 'video/quicktime';
    return 'image/jpeg';
  }

  /**
   * Normalize upload file data
   */
  private normalizeUploadFile(file: UploadFileData, index: number = 0): UploadFileData {
    const rawUri = String(file.uri || '').trim();
    const uri = rawUri;

    const uriName = rawUri.split('/').pop()?.split('?')[0] || '';
    const fallbackName = uriName || `upload_${Date.now()}_${index}.jpg`;
    const name = file.name?.trim() || fallbackName;
    const type = file.type?.trim() || this.getMimeTypeByName(name);

    return { uri, name, type };
  }

  /**
   * Validate file before upload
   */
  private validateFile(file: UploadFileData): void {
    if (!file || !file.uri) {
      throw new UploadError('File không hợp lệ', 'INVALID_FILE', false);
    }

    if (!file.name) {
      throw new UploadError('Tên file không được để trống', 'INVALID_FILENAME', false);
    }
  }

  /**
   * Check if error is retryable
   */
  private isErrorRetryable(error: unknown): boolean {
    if (error instanceof UploadError) {
      return error.isRetryable;
    }

    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      // Network errors that are retryable
      return (
        message.includes('network') ||
        message.includes('timeout') ||
        message.includes('econnrefused') ||
        message.includes('enotfound')
      );
    }

    return false;
  }

  /**
   * Exponential backoff delay
   */
  private getRetryDelay(retryCount: number, baseDelay: number): number {
    return baseDelay * Math.pow(2, retryCount) + Math.random() * 1000;
  }

  /**
   * Upload single file with retry logic and progress tracking
   * API: POST /upload
   */
  async uploadFile(file: UploadFileData, options: UploadOptions = {}): Promise<UploadResponseModel> {
    const {
      maxRetries = this.DEFAULT_MAX_RETRIES,
      retryDelayMs = this.DEFAULT_RETRY_DELAY,
      timeoutMs = this.DEFAULT_TIMEOUT,
      onProgress,
    } = options;

    this.validateFile(file);
    const normalized = this.normalizeUploadFile(file);

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          // Wait before retrying with exponential backoff
          const delay = this.getRetryDelay(attempt - 1, retryDelayMs);
          await this.sleep(delay);
          console.log(`Retry upload attempt ${attempt}/${maxRetries} after ${delay}ms`);
        }

        // Report progress
        if (onProgress) {
          onProgress(10); // Start at 10%
        }

        const formData = new FormData();
        formData.append('image', {
          uri: normalized.uri,
          name: normalized.name,
          type: normalized.type,
        } as any);

        // Report progress
        if (onProgress) {
          onProgress(30); // At 30% after form assembly
        }

        const rawResult = await this.uploadWithTimeout(
          '/upload',
          formData,
          timeoutMs,
          onProgress
        );

        const result: UploadResponseModel = {
          success: !!rawResult?.success,
          message: rawResult?.message,
          url:
            rawResult?.url ||
            rawResult?.secure_url ||
            rawResult?.data?.url ||
            rawResult?.data?.secure_url ||
            '',
          publicId: rawResult?.publicId || rawResult?.data?.publicId,
          key: rawResult?.key,
        };

        if (!result.success || !result.url) {
          throw new UploadError(
            result.message || 'Upload thành công nhưng thiếu URL ảnh',
            'INVALID_UPLOAD_RESPONSE',
            false
          );
        }

        // Report completion
        if (onProgress) {
          onProgress(100);
        }

        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        const isRetryable = this.isErrorRetryable(error);
        const isLastAttempt = attempt === maxRetries;

        if (!isRetryable || isLastAttempt) {
          const message = lastError instanceof UploadError
            ? lastError.message
            : lastError.message || 'Không thể upload file';

          throw new UploadError(
            message,
            'UPLOAD_FAILED',
            false,
            lastError
          );
        }

        console.warn(
          `Upload failed (attempt ${attempt + 1}/${maxRetries + 1}):`,
          lastError.message
        );
      }
    }

    throw new UploadError(
      'Upload thất bại sau nhiều lần thử',
      'MAX_RETRIES_EXCEEDED',
      false,
      lastError || undefined
    );
  }

  /**
   * Upload multiple files sequentially or in parallel (configurable)
   * API: POST /upload/multiple
   */
  async uploadMultiple(
    files: UploadFileData[],
    options: UploadOptions & { sequential?: boolean } = {}
  ): Promise<UploadMultipleResponseModel> {
    const { sequential = false, onProgress, maxRetries = this.DEFAULT_MAX_RETRIES } = options;

    if (!files || files.length === 0) {
      throw new UploadError('Không có file để upload', 'NO_FILES', false);
    }

    if (files.length > 10) {
      throw new UploadError('Tối đa 10 files mỗi lần upload', 'TOO_MANY_FILES', false);
    }

    const uploadedUrls: string[] = [];

    if (sequential) {
      // Upload files one by one to avoid overwhelming the server
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileProgress = (i / files.length) * 100;

        try {
          const result = await this.uploadFile(file, {
            ...options,
            onProgress: (progress) => {
              const totalProgress = fileProgress + (progress / files.length);
              if (onProgress) {
                onProgress(Math.round(totalProgress));
              }
            },
          });

          uploadedUrls.push(result.url);
        } catch (error) {
          console.error(`Failed to upload file ${i + 1}/${files.length}:`, error);
          throw error;
        }
      }

      return {
        success: true,
        urls: uploadedUrls,
        message: `Successfully uploaded ${uploadedUrls.length} files`,
      };
    } else {
      // Use batch API endpoint
      const formData = new FormData();
      files.forEach((file, index) => {
        const normalized = this.normalizeUploadFile(file, index);
        formData.append('images', {
          uri: normalized.uri,
          name: normalized.name,
          type: normalized.type,
        } as any);
      });

      if (onProgress) {
        onProgress(30);
      }

      try {
        const result = await this.uploadWithTimeout(
          '/upload/360',
          formData,
          options.timeoutMs || this.DEFAULT_TIMEOUT,
          onProgress
        );

        if (onProgress) {
          onProgress(100);
        }

        return result;
      } catch (error) {
        throw new UploadError(
          error instanceof Error ? error.message : 'Không thể upload files',
          'BATCH_UPLOAD_FAILED',
          this.isErrorRetryable(error)
        );
      }
    }
  }

  /**
   * Delete file by URL
   * API: DELETE /upload
   */
  async deleteFile(url: string): Promise<{ success: boolean; message: string }> {
    if (!url) {
      throw new UploadError('URL file không hợp lệ', 'INVALID_URL', false);
    }

    try {
      const result = await this.request('/upload', {
        method: 'DELETE',
        body: JSON.stringify({ url }),
      });

      return result;
    } catch (error) {
      throw new UploadError(
        error instanceof Error ? error.message : 'Không thể xóa file',
        'DELETE_FAILED',
        this.isErrorRetryable(error),
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Upload with timeout handling and progress tracking
   * @private
   */
  private async uploadWithTimeout(
    endpoint: string,
    formData: FormData,
    timeoutMs: number,
    onProgress?: (progress: number) => void
  ): Promise<any> {
    const url = `${this.baseURL}${endpoint}`;
    const headers = await this.getUploadHeaders();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Report progress near completion
      if (onProgress) {
        onProgress(90);
      }

      if (!response.ok) {
        await this.handleErrorResponse(response);
      }

      const data = await response.json();

      return data;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new UploadError(
            'Upload timeout - kết nối mất hoặc server không phản hồi',
            'TIMEOUT',
            true
          );
        }
      }

      throw error;
    }
  }

  /**
   * Helper: Sleep utility
   * @private
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
