# Migration Guide: Update Existing Screens to Use New Upload System

## 🎯 Overview

This guide helps you update existing screens from the old upload system to the new enhanced system.

## 📋 Checklist of Screens to Update

- [ ] SellerListingsScreen - Product image upload
- [ ] CreateListingScreen - New listing creation
- [ ] EditListingScreen - Edit listing photos
- [ ] ProfileScreen - Avatar upload
- [ ] KYCScreen - KYC documents
- [ ] OrderScreen - Order images
- [ ] ReviewScreen - Review images
- [ ] MessageScreen - Message attachments
- [ ] DisputeScreen - Dispute evidence

## 🔄 Migration Patterns

### Pattern 1: Simple Button Replacement

**BEFORE:**
```tsx
import { UploadApiClient } from '../data/apis/UploadApiClient';
import { useImagePicker } from '../hooks/useImagePicker';

const client = new UploadApiClient();
const { pickFromLibrary } = useImagePicker();

const handleUpload = async () => {
  const images = await pickFromLibrary(true);
  const urls = [];
  
  for (const img of images) {
    try {
      const result = await client.uploadFile({
        uri: img.uri,
        name: img.name,
        type: img.type,
      });
      urls.push(result.url);
    } catch (error) {
      console.error('Upload failed:', error);
    }
  }
  
  setImages(urls);
};
```

**AFTER:**
```tsx
import { UploadButton } from '../components/UploadButton';

const handleUpload = (urls: string | string[] | null) => {
  if (urls) {
    setImages(Array.isArray(urls) ? urls : [urls]);
  }
};

// In JSX:
<UploadButton
  onUpload={handleUpload}
  multiple={true}
  label="Choose Images"
/>
```

**Benefits:**
- ✅ 50% less code
- ✅ Built-in error handling
- ✅ Built-in retry logic
- ✅ Better UX

### Pattern 2: Hook-Based Upload

**BEFORE:**
```tsx
const [loading, setLoading] = useState(false);

const uploadFile = async (file) => {
  setLoading(true);
  try {
    const client = new UploadApiClient();
    const result = await client.uploadFile(file);
    
    if (!result.success) {
      throw new Error(result.message);
    }
    
    return result.url;
  } catch (error) {
    console.error(error);
    Toast.show({ type: 'error', text1: 'Upload failed' });
  } finally {
    setLoading(false);
  }
};
```

**AFTER:**
```tsx
const { uploadSingleFile } = useUpload({
  onError: (error) => {
    Toast.show({ type: 'error', text1: error.message });
  }
});

// Usage:
const result = await uploadSingleFile(file);
if (result.success) {
  return result.url;
}
```

**Benefits:**
- ✅ Auto retry on network errors
- ✅ Progress tracking built-in
- ✅ Cleaner code
- ✅ Better error handling

### Pattern 3: Multiple Files with Progress

**BEFORE:**
```tsx
const [progress, setProgress] = useState(0);
const [uploading, setUploading] = useState(false);

const uploadMany = async (files) => {
  setUploading(true);
  const results = [];
  
  for (let i = 0; i < files.length; i++) {
    try {
      const result = await uploadFile(files[i]);
      results.push(result);
      setProgress(((i + 1) / files.length) * 100);
    } catch (error) {
      console.error(`File ${i} failed:`, error);
    }
  }
  
  setUploading(false);
  return results;
};
```

**AFTER:**
```tsx
const {
  uploadMultipleFiles,
  totalProgress,
  uploading,
  getAllUploadTasks,
} = useUpload({
  sequential: true,
  onProgress: (progress) => console.log(`Progress: ${progress}%`),
});

// Usage:
const result = await uploadMultipleFiles(files);

// Monitor:
const tasks = getAllUploadTasks();
console.log(`Overall: ${totalProgress}%`);
```

**Benefits:**
- ✅ Auto progress calculation
- ✅ No manual loop
- ✅ Task-based tracking
- ✅ Auto retry per file

## 📝 Specific Screen Examples

### Example 1: SellerListingsScreen (Product Photos)

**BEFORE:**
```tsx
// Complex manual upload handling
const [images, setImages] = useState<string[]>([]);
const [uploading, setUploading] = useState(false);

const handlePickImages = async () => {
  const result = await imagePicker.launchImageLibrary({...});
  
  setUploading(true);
  const uploadedUrls: string[] = [];
  
  for (const asset of result.assets) {
    const uploadResult = await uploadClient.uploadFile({
      uri: asset.uri,
      name: asset.fileName,
      type: asset.type,
    });
    
    if (uploadResult.success) {
      uploadedUrls.push(uploadResult.url);
    }
  }
  
  setImages(uploadedUrls);
  setUploading(false);
};
```

**AFTER:**
```tsx
import { UploadImagesForListing } from '../components/UploadImagesForListing';

const [images, setImages] = useState<ListingImage[]>([]);

return (
  <UploadImagesForListing
    maxImages={10}
    onImagesSelected={setImages}
    initialImages={images}
  />
);
```

**What you get:**
- ✅ Complete UI with thumbnails
- ✅ Set main image
- ✅ Remove images
- ✅ Progress tracking
- ✅ Retry failed uploads
- ✅ Requirements display

### Example 2: ProfileScreen (Avatar Upload)

**BEFORE:**
```tsx
const [avatar, setAvatar] = useState('');
const [uploading, setUploading] = useState(false);

const handleUploadAvatar = async () => {
  const result = await launchCamera({...});
  
  setUploading(true);
  try {
    const uploadResult = await uploadClient.uploadFile({
      uri: result.assets[0].uri,
      name: result.assets[0].fileName,
      type: result.assets[0].type,
    });
    
    if (uploadResult.success) {
      setAvatar(uploadResult.url);
      await updateProfile({ avatar: uploadResult.url });
      Toast.show({ type: 'success', text1: 'Avatar updated' });
    }
  } catch (error) {
    Toast.show({ type: 'error', text1: 'Upload failed' });
  } finally {
    setUploading(false);
  }
};
```

**AFTER:**
```tsx
import { UploadButton } from '../components/UploadButton';

const handleUploadAvatar = async (url: string | null) => {
  if (url) {
    setAvatar(url);
    await updateProfile({ avatar: url });
  }
};

return (
  <TouchableOpacity onPress={() => handleUploadAvatar()}>
    <UploadButton
      pickFromCamera={true}
      onUpload={handleUploadAvatar}
      label="Change Avatar"
      size="sm"
    />
  </TouchableOpacity>
);
```

**What you get:**
- ✅ Camera permission handled
- ✅ Auto retry on timeout
- ✅ Loading state
- ✅ Error toast
- ✅ Smaller code

### Example 3: KYCScreen (Document Upload)

**BEFORE:**
```tsx
const [kycDocument, setKycDocument] = useState('');
const [uploading, setUploading] = useState(false);

const handleUploadKYC = async () => {
  const result = await launchImageLibrary({...});
  
  setUploading(true);
  try {
    const uploadResult = await uploadClient.uploadFile({
      uri: result.assets[0].uri,
      name: `kyc_${Date.now()}.jpg`,
      type: 'image/jpeg',
    });
    
    if (uploadResult.success) {
      setKycDocument(uploadResult.url);
    } else {
      throw new Error(uploadResult.message);
    }
  } catch (error) {
    Toast.show({
      type: 'error',
      text1: 'Upload failed',
      text2: error.message,
    });
  } finally {
    setUploading(false);
  }
};
```

**AFTER:**
```tsx
import { UploadButton } from '../components/UploadButton';

const handleUploadKYC = (url: string | null) => {
  if (url) {
    setKycDocument(url);
  }
};

return (
  <UploadButton
    onUpload={handleUploadKYC}
    onError={(error) => {
      Toast.show({
        type: 'error',
        text1: 'Upload failed',
        text2: error.message,
      });
    }}
    maxFiles={1}
    label="Upload KYC Document"
  />
);
```

**What you get:**
- ✅ Cleaner code
- ✅ Auto retry
- ✅ Better error messages
- ✅ One file validation built-in

### Example 4: MessageScreen (With Progress Overlay)

**BEFORE:**
```tsx
const [uploading, setUploading] = useState(false);
const [uploadProgress, setUploadProgress] = useState(0);

const handleSendImage = async () => {
  const result = await imagePicker.pickFromLibrary(false);
  
  setUploading(true);
  setUploadProgress(10);
  
  try {
    const uploadResult = await uploadClient.uploadFile({
      uri: result[0].uri,
      name: result[0].name,
      type: result[0].type,
    });
    
    setUploadProgress(100);
    
    if (uploadResult.success) {
      // Send message with image
      await sendMessage({
        type: 'image',
        content: uploadResult.url,
      });
    }
  } catch (error) {
    // Handle error
  } finally {
    setUploading(false);
  }
};

return (
  <>
    {uploading && (
      <View style={styles.progressContainer}>
        <ProgressBar progress={uploadProgress / 100} />
        <Text>{uploadProgress}%</Text>
      </View>
    )}
  </>
);
```

**AFTER:**
```tsx
import { UploadButton } from '../components/UploadButton';
import { UploadProgressOverlay } from '../components/UploadProgress';
import { useUploadStore } from '../stores/uploadStore';

const { pickAndUpload } = useUpload({
  onSuccess: async (urls) => {
    await sendMessage({
      type: 'image',
      content: urls[0],
    });
  },
});

const uploadStore = useUploadStore();
const totalProgress = uploadStore.getTotalProgress();

const handleSendImage = async (url: string | null) => {
  if (url) {
    await sendMessage({ type: 'image', content: url });
  }
};

return (
  <>
    <UploadButton
      onUpload={handleSendImage}
      label="Send Image"
      size="sm"
    />
    
    <UploadProgressOverlay
      visible={uploadStore.isUploading()}
      progress={totalProgress}
      message="Sending image..."
    />
  </>
);
```

**What you get:**
- ✅ Built-in progress UI
- ✅ Auto retry
- ✅ Centralized state
- ✅ Better UX

## 🔧 Common Patterns to Replace

### Pattern: Manual Retry Loop

**❌ BEFORE:**
```tsx
let retries = 0;
let success = false;

while (retries < 3 && !success) {
  try {
    const result = await uploadClient.uploadFile(file);
    success = true;
  } catch (error) {
    retries++;
    await new Promise(r => setTimeout(r, 1000 * retries));
  }
}
```

**✅ AFTER:**
```tsx
const { uploadSingleFile } = useUpload({
  maxRetries: 3,
  retryDelayMs: 1000,
});

const result = await uploadSingleFile(file);
```

### Pattern: Manual Progress Calculation

**❌ BEFORE:**
```tsx
const totalFiles = files.length;
let completedFiles = 0;

for (const file of files) {
  await uploadFile(file);
  completedFiles++;
  setProgress((completedFiles / totalFiles) * 100);
}
```

**✅ AFTER:**
```tsx
const { uploadMultipleFiles, totalProgress } = useUpload({
  onProgress: (progress) => console.log(`Progress: ${progress}%`),
});

await uploadMultipleFiles(files);
// Progress is automatically calculated
```

### Pattern: Manual Error Handling

**❌ BEFORE:**
```tsx
try {
  const result = await uploadFile(file);
  if (!result.success) {
    throw new Error(result.message || 'Unknown error');
  }
  setImage(result.url);
} catch (error) {
  console.error('Upload error:', error);
  const errorMsg = error.message || 'Upload failed';
  Toast.show({
    type: 'error',
    text1: 'Error',
    text2: errorMsg,
  });
}
```

**✅ AFTER:**
```tsx
const { uploadSingleFile } = useUpload({
  onError: (error) => {
    Toast.show({
      type: 'error',
      text1: 'Error',
      text2: error.message,
    });
  },
});

const result = await uploadSingleFile(file);
if (result.success) {
  setImage(result.url);
}
```

## 🚀 Step-by-Step Migration

### Step 1: Update Imports

```tsx
// OLD
import { UploadApiClient } from '../data/apis/UploadApiClient';
import { useImagePicker } from '../hooks/useImagePicker';

// NEW
import { UploadButton } from '../components/UploadButton';
import useUpload from '../hooks/useUpload';
import { UploadProgressList } from '../components/UploadProgress';
```

### Step 2: Replace Upload Logic

```tsx
// OLD
const client = new UploadApiClient();
const [uploading, setUploading] = useState(false);

const handleUpload = async () => {
  setUploading(true);
  try {
    // ... manual upload code
  } finally {
    setUploading(false);
  }
};

// NEW
const { uploadSingleFile, uploading } = useUpload();

const handleUpload = async () => {
  const result = await uploadSingleFile(file);
};
```

### Step 3: Add UI Components

```tsx
// Replace old buttons/progress with new components

<UploadButton
  onUpload={handleUpload}
  label="Upload"
  multiple={true}
/>

<UploadProgressList
  tasks={getAllUploadTasks()}
  onRetry={retryUpload}
/>
```

### Step 4: Test

- [ ] Test normal upload
- [ ] Test timeout/network error (DevTools throttle)
- [ ] Test multiple files
- [ ] Test cancel operation
- [ ] Test retry failed upload
- [ ] Test file validation
- [ ] Test on slow network

### Step 5: Deploy

- [ ] Code review
- [ ] Merge to staging
- [ ] Test on device
- [ ] Merge to production

## ✅ Verification Checklist

After migration, verify:

- [ ] Uploads work with new component
- [ ] Progress shows correctly
- [ ] Auto retry works on timeout
- [ ] Error messages are user-friendly
- [ ] Cancel upload works
- [ ] Multiple files upload correctly
- [ ] File validation works
- [ ] No memory leaks
- [ ] Performance is good
- [ ] UI is responsive

## 📊 Before/After Comparison

| Aspect | Before | After |
|--------|--------|-------|
| **Lines of Code** | 50-100 | 5-20 |
| **Error Handling** | Manual | Built-in |
| **Retry Logic** | None | Auto 3x |
| **Progress** | Manual | Real-time |
| **UI** | Custom | Professional |
| **Type Safety** | Partial | Full TS |
| **Testing** | Hard | Easy |
| **Maintainability** | Low | High |

## 🆘 Troubleshooting

### Upload not happening
- Ensure permissions are granted (camera, gallery)
- Check network connection
- Verify file size < 10MB (images) or 100MB (videos)

### Progress not updating
- Ensure useUpload hook is called
- Check Zustand store subscription
- Verify totalProgress on upload tasks

### Retry not working
- Check if error is network-related
- Verify maxRetries option is set
- Check console for error details

### UI not showing
- Import components correctly
- Check component props
- Verify theme colors are defined

## 📚 Related Files

- Migration examples: [UPLOAD_IMPROVEMENTS.md](UPLOAD_IMPROVEMENTS.md)
- Complete guide: [UPLOAD_GUIDE.md](UPLOAD_GUIDE.md)
- Example component: [UploadImagesForListing.tsx](src/presentation/components/UploadImagesForListing.tsx)
- Hook documentation: [useUpload.ts](src/presentation/hooks/useUpload.ts)

## 🎉 Next Steps

1. ✅ Read full guide: UPLOAD_GUIDE.md
2. ✅ Study example: UploadImagesForListing.tsx
3. ✅ Update 1-2 screens with new system
4. ✅ Test thoroughly
5. ✅ Update remaining screens
6. ✅ Deploy to production

---

**All set! Happy coding! 🚀**
