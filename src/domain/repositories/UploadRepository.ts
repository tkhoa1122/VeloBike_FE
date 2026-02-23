import { FileUpload, UploadResponse, ApiResponse } from '../entities/Common';

export interface UploadRepository {
  // Single file upload
  uploadImage(file: FileUpload): Promise<ApiResponse<UploadResponse>>;
  uploadVideo(file: FileUpload): Promise<ApiResponse<UploadResponse>>;
  uploadDocument(file: FileUpload): Promise<ApiResponse<UploadResponse>>;
  
  // Multiple files
  uploadMultipleImages(files: FileUpload[]): Promise<ApiResponse<UploadResponse[]>>;
  upload360Images(files: FileUpload[]): Promise<ApiResponse<UploadResponse[]>>;
  
  // File management
  deleteFile(publicId: string): Promise<ApiResponse>;
  getMyFiles(folder?: string, limit?: number): Promise<ApiResponse<UploadResponse[]>>;
  
  // Image processing
  resizeImage(publicId: string, width: number, height: number): Promise<ApiResponse<UploadResponse>>;
  compressImage(publicId: string, quality?: number): Promise<ApiResponse<UploadResponse>>;
  
  // File validation
  validateFile(file: FileUpload): Promise<{
    isValid: boolean;
    errors?: string[];
  }>;
  
  // Direct upload (for background uploads)
  getUploadSignature(folder?: string): Promise<ApiResponse<{
    signature: string;
    timestamp: number;
    cloudName: string;
    apiKey: string;
  }>>;
}