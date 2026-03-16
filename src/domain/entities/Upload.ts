export interface UploadFileData {
  uri: string;
  name: string;
  type: string;
}

export interface UploadResponse {
  success: boolean;
  message?: string;
  url: string;
  key?: string;
}

export interface UploadMultipleResponse {
  success: boolean;
  message?: string;
  urls: string[];
}
