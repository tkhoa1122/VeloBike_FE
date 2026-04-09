import { UploadRepository } from '../../repositories/UploadRepository';
import { ApiResponse } from '../../entities/Common';
import { UploadFileData, UploadResponse } from '../../entities/Upload';

/**
 * Upload File UseCase
 * Upload một file lên server với validation
 */
export class UploadFileUseCase {
  constructor(private uploadRepository: UploadRepository) {}

  async execute(file: UploadFileData): Promise<ApiResponse<UploadResponse>> {
    // Validation
    if (!file || !file.uri) {
      return {
        success: false,
        error: 'File không hợp lệ',
      };
    }

    if (!file.name) {
      return {
        success: false,
        error: 'Tên file không được để trống',
      };
    }

    if (!file.type) {
      return {
        success: false,
        error: 'Loại file không hợp lệ',
      };
    }

    // Check file type (basic validation)
    const supportedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/heic',
      'image/gif',
      'video/mp4',
      'video/quicktime',
    ];

    if (!supportedTypes.includes(file.type)) {
      return {
        success: false,
        error: `Định dạng file không được hỗ trợ: ${file.type}`,
      };
    }

    try {
      return await this.uploadRepository.uploadFile(file);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Lỗi không xác định',
      };
    }
  }
}
