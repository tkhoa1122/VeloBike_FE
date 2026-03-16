import { UploadRepository } from '../../repositories/UploadRepository';
import { ApiResponse } from '../../entities/Common';
import { UploadFileData, UploadResponse } from '../../entities/Upload';

/**
 * Upload File UseCase
 * Upload một file lên server
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

    // Check file size (max 10MB)
    // Note: React Native file size check would need additional logic

    return await this.uploadRepository.uploadFile(file);
  }
}
