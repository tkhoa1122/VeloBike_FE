import { UploadRepository } from '../../domain/repositories/UploadRepository';
import { UploadApiClient } from '../apis/UploadApiClient';
import { ApiResponse } from '../../domain/entities/Common';
import { UploadFileData, UploadResponse, UploadMultipleResponse } from '../../domain/entities/Upload';

export class UploadRepositoryImpl implements UploadRepository {
  constructor(private apiClient: UploadApiClient) {}

  async uploadFile(file: UploadFileData): Promise<ApiResponse<UploadResponse>> {
    try {
      const response = await this.apiClient.uploadFile(file);
      return {
        success: response.success,
        data: response,
        message: response.message,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Không thể upload file',
      };
    }
  }

  async uploadMultiple(files: UploadFileData[]): Promise<ApiResponse<UploadMultipleResponse>> {
    try {
      const response = await this.apiClient.uploadMultiple(files);
      return {
        success: response.success,
        data: response,
        message: response.message,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Không thể upload files',
      };
    }
  }

  async deleteFile(url: string): Promise<ApiResponse> {
    try {
      const response = await this.apiClient.deleteFile(url);
      return {
        success: response.success,
        message: response.message,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Không thể xóa file',
      };
    }
  }
}
