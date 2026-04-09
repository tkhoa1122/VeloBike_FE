# Hướng dẫn Upload Ảnh - VeloBike Frontend

## 📋 Tổng Quan

Hệ thống upload ảnh mới cung cấp:
- ✅ **Retry Logic**: Tự động thử lại khi upload thất bại
- ✅ **Progress Tracking**: Theo dõi tiến độ upload real-time
- ✅ **Queue Management**: Quản lý hàng đợi upload với Zustand
- ✅ **File Validation**: Kiểm tra file trước upload
- ✅ **Error Handling**: Xử lý lỗi chi tiết
- ✅ **UI Components**: Các component sẵn sàng sử dụng

## 🗂️ Cấu Trúc Thư Mục

```
src/
├── data/apis/
│   └── UploadApiClient.ts          # Enhanced API client với retry logic
├── data/repositories/
│   └── UploadRepositoryImpl.ts
├── domain/
│   ├── entities/Upload.ts
│   ├── repositories/UploadRepository.ts
│   └── usecases/upload/
│       ├── UploadFileUseCase.ts
│       └── UploadMultipleFilesUseCase.ts
├── presentation/
│   ├── components/
│   │   ├── UploadButton.tsx        # Nút upload
│   │   └── UploadProgress.tsx      # Hiển thị tiến độ
│   ├── hooks/
│   │   ├── useImagePicker.ts       # Chọn ảnh
│   │   └── useUpload.ts            # Hook upload chính
│   └── stores/
│       └── uploadStore.ts          # Zustand store
└── utils/
    └── imageProcessing.ts          # Utilities xử lý ảnh
```

## 🚀 Quick Start

### 1. Sử dụng Upload Hook đơn giản nhất

```tsx
import { useUpload } from '@/presentation/hooks/useUpload';

export const MyComponent = () => {
  const { pickAndUpload } = useUpload();

  const handleUpload = async () => {
    const url = await pickAndUpload(false); // false = single image
    if (url) {
      console.log('Upload thành công:', url);
    }
  };

  return (
    <TouchableOpacity onPress={handleUpload}>
      <Text>Upload Ảnh</Text>
    </TouchableOpacity>
  );
};
```

### 2. Sử dụng UploadButton Component

```tsx
import { UploadButton } from '@/presentation/components/UploadButton';

export const MyComponent = () => {
  const handleUpload = (urls: string | string[] | null) => {
    if (urls) {
      console.log('Upload URL:', urls);
    }
  };

  return (
    <UploadButton 
      onUpload={handleUpload}
      label="Chọn Ảnh"
      multiple={true}
    />
  );
};
```

### 3. Sử dụng Upload Hook với Progress Tracking

```tsx
import { useUpload } from '@/presentation/hooks/useUpload';
import { UploadProgressList } from '@/presentation/components/UploadProgress';

export const MyComponent = () => {
  const {
    uploadMultipleFiles,
    getAllUploadTasks,
    totalProgress,
    cancelUpload,
    retryUpload,
  } = useUpload();

  const tasks = getAllUploadTasks();

  const handleSelectImages = async () => {
    const images = await imagePicker.pickFromLibrary(true);
    const uploadData = imagePicker.toUploadFileData(images);
    await uploadMultipleFiles(uploadData);
  };

  return (
    <View>
      <TouchableOpacity onPress={handleSelectImages}>
        <Text>Chọn Ảnh</Text>
      </TouchableOpacity>

      <UploadProgressList
        tasks={tasks}
        onCancel={cancelUpload}
        onRetry={retryUpload}
      />

      <Text>Tổng tiến độ: {totalProgress}%</Text>
    </View>
  );
};
```

## 📚 API Reference

### useUpload Hook

```tsx
const {
  // State
  uploading,              // boolean - Đang upload?
  paused,                // boolean - Đã tạm dừng?
  isLoading,             // boolean - Đang load ảnh?
  totalProgress,         // number - Tiến độ tổng (0-100)

  // Upload Methods
  uploadSingleFile,      // (file) => Promise
  uploadMultipleFiles,   // (files) => Promise

  // Picker + Upload
  pickAndUpload,         // (multiple) => Promise
  pickAndUploadFromCamera,
  pickAndUploadFromLibrary,

  // Control
  cancelUpload,          // (taskId) => void
  retryUpload,           // (taskId) => void
  pauseUploads,          // () => void
  resumeUploads,         // () => void
  clearCompleted,        // () => void
  clearAll,              // () => void

  // Status
  getUploadTask,         // (taskId) => UploadTask
  getAllUploadTasks,     // () => UploadTask[]
  getActiveUploads,      // () => UploadTask[]
  getFailedUploads,      // () => UploadTask[]

  // Validation
  validateFiles,         // (files) => { valid, invalid }
} = useUpload(options);
```

### UploadButton Props

```tsx
interface UploadButtonProps {
  onUpload?: (urls: string | string[] | null) => void;
  onError?: (error: Error) => void;
  multiple?: boolean;              // Multiple files?
  pickFromCamera?: boolean;        // From camera?
  maxFiles?: number;               // Default: 10
  disabled?: boolean;
  style?: ViewStyle;
  size?: 'sm' | 'md' | 'lg';      // Button size
  variant?: 'primary' | 'secondary' | 'outline';
  label?: string;                  // Button text
  showIcon?: boolean;              // Show icon?
  loading?: boolean;               // External loading state
}
```

## 🔧 Advanced Usage

### Upload với Custom Progress Callback

```tsx
const { uploadSingleFile } = useUpload({
  maxFiles: 5,
  quality: 0.85,
  onProgress: (progress) => {
    console.log(`Upload progress: ${progress}%`);
    // Update UI with progress
  },
  onSuccess: (urls) => {
    console.log('Upload thành công:', urls);
  },
  onError: (error) => {
    console.error('Upload lỗi:', error.message);
  },
});

const file: UploadFileData = {
  uri: 'file:///path/to/image.jpg',
  name: 'image.jpg',
  type: 'image/jpeg'
};

await uploadSingleFile(file);
```

### Upload Sequential vs Parallel

```tsx
// Sequential (one by one) - Tốt cho server yếu
const { uploadMultipleFiles } = useUpload({
  sequential: true,  // Upload tuần tự
});

// Parallel (all at once) - Nhanh hơn
const { uploadMultipleFiles } = useUpload({
  sequential: false, // Upload song song (default)
});
```

### Sử dụng Upload Store trực tiếp

```tsx
import { useUploadStore } from '@/presentation/stores/uploadStore';

export const MyComponent = () => {
  const store = useUploadStore();

  const handleUpload = () => {
    // Add tasks
    const taskIds = store.addMultipleTasks(files);

    // Update progress
    taskIds.forEach(id => {
      store.updateTaskProgress(id, 50);
    });

    // Update status
    store.updateTaskStatus(taskIds[0], 'completed', undefined, 'http://url');

    // Get status
    const task = store.getTask(taskIds[0]);
    const allTasks = store.getTasksArray();
    const failed = store.getFailedTasks();
  };

  return <View>{/* UI */}</View>;
};
```

## 📦 File Validation

### Validation Utilities

```tsx
import {
  validateFile,
  formatFileSize,
  isValidImageType,
  isValidVideoType,
  validateImageDimensions,
  IMAGE_CONSTRAINTS,
} from '@/utils/imageProcessing';

// Kiểm tra loại file
if (isValidImageType(file.type)) {
  console.log('File hợp lệ');
}

// Kiểm tra kích thước
if (file.size > IMAGE_CONSTRAINTS.MAX_IMAGE_SIZE) {
  console.log('File quá lớn');
}

// Comprehensive validation
const result = validateFile(
  'image.jpg',
  'image/jpeg',
  fileSize,
  width,
  height
);

if (!result.valid) {
  console.log('Lỗi:', result.errors);
}

// Format file size
console.log(formatFileSize(5242880)); // "5 MB"
```

### Image Constraints

```tsx
IMAGE_CONSTRAINTS = {
  MAX_FILE_SIZE: 50 * 1024 * 1024,        // 50MB
  MAX_IMAGE_SIZE: 10 * 1024 * 1024,       // 10MB cho ảnh
  MAX_VIDEO_SIZE: 100 * 1024 * 1024,      // 100MB cho video
  MIN_WIDTH: 200,
  MIN_HEIGHT: 200,
  MAX_WIDTH: 4000,
  MAX_HEIGHT: 4000,
};
```

## 🛠️ Upload Options

```tsx
interface UploadOptions {
  maxRetries?: number;      // Số lần thử lại (default: 3)
  retryDelayMs?: number;   // Delay giữa các lần thử (default: 1000ms)
  timeoutMs?: number;      // Timeout (default: 60000ms)
  onProgress?: (progress: number) => void; // Callback tiến độ
  sequential?: boolean;    // Upload tuần tự hay song song
}
```

## 🎨 UI Components

### UploadButton Variants

```tsx
// Primary button
<UploadButton variant="primary" size="lg" />

// Secondary button
<UploadButton variant="secondary" size="md" />

// Outline button
<UploadButton variant="outline" size="sm" />

// Compact button (inline)
<CompactUploadButton />

// Large button (primary action)
<LargeUploadButton />
```

### UploadProgress Components

```tsx
// Single upload progress
<UploadProgressItem
  task={task}
  onCancel={() => cancelUpload(task.id)}
  onRetry={() => retryUpload(task.id)}
/>

// List of uploads
<UploadProgressList
  tasks={tasks}
  onCancel={cancelUpload}
  onRetry={retryUpload}
/>

// Upload overlay (modal-like)
<UploadProgressOverlay
  visible={uploading}
  progress={totalProgress}
  message="Uploading files..."
  onCancel={pauseUploads}
/>
```

## ⚠️ Error Handling

### UploadError Types

```tsx
// Retry-able errors (network issues)
- 'TIMEOUT': Upload timeout
- Network connection errors

// Non-retryable errors
- 'INVALID_FILE': File không hợp lệ
- 'INVALID_FILENAME': Tên file không hợp lệ
- 'INVALID_URL': URL không hợp lệ
- 'NO_FILES': Không có file để upload
- 'TOO_MANY_FILES': Quá nhiều files
- 'UPLOAD_FAILED': Upload thất bại
```

### Error Handling Example

```tsx
try {
  const result = await uploadMultipleFiles(files);
  if (result.success) {
    console.log('Uploaded:', result.urls);
  } else {
    console.log('Errors:', result.errors);
  }
} catch (error) {
  if (error.code === 'TIMEOUT') {
    // Retry logic
  } else if (error.isRetryable) {
    // Can retry
  } else {
    // Cannot retry
  }
}
```

## 📊 Upload Task Structure

```tsx
interface UploadTask {
  id: string;                    // Unique task ID
  file: UploadFileData;
  progress: number;              // 0-100
  status: 'pending' | 'uploading' | 'completed' | 'failed' | 'cancelled';
  error?: string;                // Error message
  startedAt?: number;            // Timestamp
  completedAt?: number;          // Timestamp
  url?: string;                  // Result URL
  retryCount: number;            // Retry attempts
}
```

## 🔐 Best Practices

1. **Always validate files** trước upload
2. **Use sequential upload** cho nhiều files để tránh overwhelm server
3. **Implement progress UI** để user biết upload đang diễn ra
4. **Handle retry cases** cho network errors
5. **Clear completed uploads** để tiết kiệm memory
6. **Use appropriate timeout** theo network conditions
7. **Validate file dimensions** trước upload
8. **Test trên various network speeds** (slow 3G, 4G, WiFi)

## 🧪 Testing

```tsx
// Mock test
import { useUpload } from '@/presentation/hooks/useUpload';

test('should upload file successfully', async () => {
  const { uploadSingleFile } = useUpload();
  
  const file: UploadFileData = {
    uri: 'file:///test.jpg',
    name: 'test.jpg',
    type: 'image/jpeg'
  };

  const result = await uploadSingleFile(file);
  expect(result.success).toBe(true);
  expect(result.url).toBeDefined();
});

test('should retry on timeout', async () => {
  const { uploadSingleFile } = useUpload({
    maxRetries: 3,
    retryDelayMs: 100,
  });
  
  // Should automatically retry
});
```

## 📝 Migration Guide

### Từ old codebase

```tsx
// OLD
import { UploadApiClient } from '@/data/apis/UploadApiClient';
const uploadClient = new UploadApiClient();
const response = await uploadClient.uploadFile(file);

// NEW - Cách 1: Dùng hook (recommended)
import { useUpload } from '@/presentation/hooks/useUpload';
const { uploadSingleFile } = useUpload();
const result = await uploadSingleFile(file);

// NEW - Cách 2: Dùng component (simplest)
import { UploadButton } from '@/presentation/components/UploadButton';
<UploadButton onUpload={handleUpload} />
```

## 🐛 Troubleshooting

### Upload không hoạt động
- Kiểm tra permissions (camera, gallery)
- Kiểm tra file size
- Kiểm tra network connection
- Xem console logs

### Progress không update
- Kiểm tra onProgress callback
- Verified upload hook được gọi
- Check Zustand store state

### Retry không hoạt động
- Kiểm tra maxRetries option
- Verify error type là retryable
- Check network connection

## 📞 Support & Documentation

- Component docs: xem `UploadButton.tsx`
- Hook docs: xem `useUpload.ts`
- Store docs: xem `uploadStore.ts`
- Utils docs: xem `imageProcessing.ts`
