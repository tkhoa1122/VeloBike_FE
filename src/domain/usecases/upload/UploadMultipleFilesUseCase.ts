import { UploadRepository } from '../../repositories/UploadRepository';
import { ApiResponse } from '../../entities/Common';
import { UploadFileData, UploadMultipleResponse } from '../../entities/Upload';

/**
 * Upload Multiple Files UseCase
 * Upload nhiều files cùng lúc
 */
export class UploadMultipleFilesUseCase {
  constructor(private uploadRepository: UploadRepository) {}

  async execute(files: UploadFileData[]): Promise<ApiResponse<UploadMultipleResponse>> {
    // Validation
    if (!files || files.length === 0) {
      return {
        success: false,
        error: 'Chưa chọn file nào',
      };
    }

    // Check max files (e.g., 10 files)
    if (files.length > 10) {
      return {
        success: false,
        error: 'Tối đa 10 files mỗi lần upload',
      };
    }

    return await this.uploadRepository.uploadMultiple(files);
  }
}
