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
  key?: string;
}

export interface UploadMultipleResponseModel {
  success: boolean;
  message?: string;
  urls: string[];
}

export class UploadApiClient extends BaseApiClient {
  /**
   * Upload single file
   * API: POST /upload
   */
  async uploadFile(file: UploadFileData): Promise<UploadResponseModel> {
    const formData = new FormData();
    formData.append('file', {
      uri: file.uri,
      name: file.name,
      type: file.type,
    } as any);

    return this.upload('/upload', formData);
  }

  /**
   * Upload multiple files
   * API: POST /upload/multiple
   */
  async uploadMultiple(files: UploadFileData[]): Promise<UploadMultipleResponseModel> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', {
        uri: file.uri,
        name: file.name,
        type: file.type,
      } as any);
    });

    return this.upload('/upload/multiple', formData);
  }

  /**
   * Delete file by URL
   * API: DELETE /upload
   */
  async deleteFile(url: string): Promise<{ success: boolean; message: string }> {
    return this.request('/upload', {
      method: 'DELETE',
      body: JSON.stringify({ url }),
    });
  }
}
