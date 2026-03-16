import { ApiResponse } from '../entities/Common';
import { UploadFileData, UploadResponse, UploadMultipleResponse } from '../entities/Upload';

export interface UploadRepository {
  /**
   * Upload single file
   */
  uploadFile(file: UploadFileData): Promise<ApiResponse<UploadResponse>>;

  /**
   * Upload multiple files
   */
  uploadMultiple(files: UploadFileData[]): Promise<ApiResponse<UploadMultipleResponse>>;

  /**
   * Delete file by URL
   */
  deleteFile(url: string): Promise<ApiResponse>;
}
