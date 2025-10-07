# AWS S3 File Upload System Documentation

## Overview

The AWS S3 File Upload System provides secure, scalable file upload capabilities for the Humanoid platform. It uses pre-signed URLs for direct client-to-S3 uploads, ensuring efficient file handling while maintaining security through workspace-based isolation.

## Key Features

### 🔐 **Security & Isolation**
- **Workspace-based file organization**: Files are organized by workspace ID
- **Pre-signed URLs**: Secure direct uploads to S3 without exposing server
- **Permission-based access**: RBAC integration for file operations
- **File validation**: Type, size, and format validation

### 📁 **File Management**
- **Multiple file types**: Images, videos, documents, audio
- **Automatic thumbnails**: Image thumbnails generated automatically
- **Metadata tracking**: Rich file metadata and custom properties
- **Soft deletion**: Files can be soft-deleted with cleanup options

### 🖼️ **Image Processing**
- **Automatic thumbnails**: Generated for all image uploads
- **Multiple sizes**: Configurable thumbnail dimensions
- **Format optimization**: Images converted to JPEG for thumbnails
- **Aspect ratio preservation**: Maintains original aspect ratios

### 📊 **Analytics & Monitoring**
- **File statistics**: Per-workspace file counts and sizes
- **Upload tracking**: Status tracking throughout upload process
- **Usage analytics**: File type distribution and storage usage

## Architecture

### **File Organization Structure**
```
S3 Bucket/
├── workspaces/
│   ├── {workspace-id}/
│   │   ├── files/
│   │   │   ├── {timestamp}_{random}.{ext}
│   │   │   └── {timestamp}_{random}.{ext}
│   │   └── thumbnails/
│   │       ├── thumb_{filename}.jpg
│   │       └── thumb_{filename}.jpg
│   └── {workspace-id}/
│       ├── files/
│       └── thumbnails/
```

### **Database Schema**

#### FileUpload Entity
```typescript
@Entity('file_uploads')
export class FileUpload {
  id: string;                    // UUID primary key
  originalName: string;          // Original filename
  fileName: string;              // Generated unique filename
  filePath: string;              // S3 key/path
  fileUrl: string;               // S3 URL
  thumbnailUrl?: string;         // Thumbnail S3 URL
  thumbnailPath?: string;        // Thumbnail S3 key/path
  mimeType: string;              // File MIME type
  fileSize: number;              // File size in bytes
  fileType: FileType;            // File type enum
  status: FileStatus;            // Upload status
  workspaceId: string;           // Associated workspace
  uploadedById: string;          // User who uploaded
  description?: string;          // Optional description
  metadata?: object;             // Custom metadata
  thumbnailMetadata?: object;    // Thumbnail info
  // ... audit fields
}
```

## API Endpoints

### **File Upload Flow**

#### 1. Generate Pre-signed URL
```http
POST /file-upload/generate-presigned-url
Authorization: Bearer <token>
Content-Type: application/json

{
  "originalName": "image.jpg",
  "mimeType": "image/jpeg",
  "fileSize": 2048000,
  "fileType": "image",
  "workspaceId": "workspace-uuid",
  "description": "Profile picture",
  "metadata": {
    "width": 1920,
    "height": 1080,
    "tags": ["profile", "avatar"]
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "fileUploadId": "file-uuid",
    "presignedUrl": "https://bucket.s3.amazonaws.com/workspaces/ws-id/files/filename.jpg?signature=...",
    "filePath": "workspaces/ws-id/files/filename.jpg",
    "uploadUrl": "https://bucket.s3.amazonaws.com/workspaces/ws-id/files/filename.jpg",
    "expiresIn": 3600
  },
  "message": "Pre-signed URL generated successfully"
}
```

#### 2. Upload File to S3 (Frontend)
```javascript
// Frontend implementation
const uploadFile = async (file, presignedUrl) => {
  const response = await fetch(presignedUrl, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': file.type,
    },
  });
  
  if (response.ok) {
    return response.url; // This is the S3 URL
  }
  throw new Error('Upload failed');
};
```

#### 3. Confirm Upload
```http
POST /file-upload/confirm-upload
Authorization: Bearer <token>
Content-Type: application/json

{
  "fileUploadId": "file-uuid",
  "filePath": "workspaces/ws-id/files/filename.jpg",
  "fileUrl": "https://bucket.s3.amazonaws.com/workspaces/ws-id/files/filename.jpg",
  "metadata": {
    "width": 1920,
    "height": 1080
  }
}
```

### **File Management Endpoints**

#### Get Workspace Files
```http
GET /file-upload/workspaces/{workspaceId}/files?page=1&limit=20&fileType=image&status=ready
Authorization: Bearer <token>
```

#### Get Workspace Thumbnails
```http
GET /file-upload/workspaces/{workspaceId}/thumbnails
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "workspaceId": "workspace-uuid",
    "thumbnails": [
      {
        "id": "file-uuid",
        "originalName": "image.jpg",
        "thumbnailUrl": "https://bucket.s3.amazonaws.com/workspaces/ws-id/thumbnails/thumb_filename.jpg",
        "fileType": "image",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "description": "Profile picture"
      }
    ]
  }
}
```

#### Update File Metadata
```http
PUT /file-upload/files/{fileId}
Authorization: Bearer <token>
Content-Type: application/json

{
  "description": "Updated description",
  "metadata": {
    "tags": ["updated", "tag"],
    "altText": "Accessibility text"
  }
}
```

#### Delete File
```http
DELETE /file-upload/files/{fileId}
Authorization: Bearer <token>
```

#### Generate Download URL
```http
GET /file-upload/files/{fileId}/download-url?expiresIn=3600
Authorization: Bearer <token>
```

#### Get File Statistics
```http
GET /file-upload/workspaces/{workspaceId}/stats
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalFiles": 150,
    "totalSize": 524288000,
    "filesByType": {
      "image": 100,
      "video": 30,
      "document": 15,
      "audio": 5
    },
    "filesByStatus": {
      "ready": 140,
      "processing": 5,
      "failed": 5
    }
  }
}
```

## Frontend Integration

### **React Upload Component Example**

```typescript
import React, { useState } from 'react';

const FileUpload = ({ workspaceId }) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileUpload = async (file) => {
    setUploading(true);
    setProgress(0);

    try {
      // Step 1: Generate pre-signed URL
      const response = await fetch('/api/file-upload/generate-presigned-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          originalName: file.name,
          mimeType: file.type,
          fileSize: file.size,
          fileType: getFileType(file.type),
          workspaceId,
          description: 'Uploaded file',
        }),
      });

      const { data } = await response.json();

      // Step 2: Upload to S3
      const uploadResponse = await fetch(data.presignedUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error('Upload failed');
      }

      // Step 3: Confirm upload
      await fetch('/api/file-upload/confirm-upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          fileUploadId: data.fileUploadId,
          filePath: data.filePath,
          fileUrl: data.uploadUrl,
        }),
      });

      setProgress(100);
      console.log('File uploaded successfully');
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  const getFileType = (mimeType) => {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    return 'document';
  };

  return (
    <div>
      <input
        type="file"
        onChange={(e) => handleFileUpload(e.target.files[0])}
        disabled={uploading}
      />
      {uploading && (
        <div>
          <progress value={progress} max={100} />
          <span>{progress}% uploaded</span>
        </div>
      )}
    </div>
  );
};
```

### **Thumbnail Gallery Component**

```typescript
import React, { useState, useEffect } from 'react';

const ThumbnailGallery = ({ workspaceId }) => {
  const [thumbnails, setThumbnails] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchThumbnails();
  }, [workspaceId]);

  const fetchThumbnails = async () => {
    try {
      const response = await fetch(`/api/file-upload/workspaces/${workspaceId}/thumbnails`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const { data } = await response.json();
      setThumbnails(data.thumbnails);
    } catch (error) {
      console.error('Failed to fetch thumbnails:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading thumbnails...</div>;

  return (
    <div className="thumbnail-gallery">
      {thumbnails.map((thumbnail) => (
        <div key={thumbnail.id} className="thumbnail-item">
          <img
            src={thumbnail.thumbnailUrl}
            alt={thumbnail.originalName}
            onClick={() => openFileModal(thumbnail.id)}
          />
          <div className="thumbnail-info">
            <span>{thumbnail.originalName}</span>
            <small>{new Date(thumbnail.createdAt).toLocaleDateString()}</small>
          </div>
        </div>
      ))}
    </div>
  );
};
```

## Environment Configuration

### **Required Environment Variables**

```bash
# AWS S3 Configuration
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=your-s3-bucket-name
```

### **S3 Bucket Setup**

1. **Create S3 Bucket**:
   ```bash
   aws s3 mb s3://your-bucket-name --region us-east-1
   ```

2. **Configure CORS**:
   ```json
   [
     {
       "AllowedHeaders": ["*"],
       "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
       "AllowedOrigins": ["http://localhost:3000", "https://yourdomain.com"],
       "ExposeHeaders": ["ETag"]
     }
   ]
   ```

3. **Set Bucket Policy** (if needed):
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Sid": "AllowPublicRead",
         "Effect": "Allow",
         "Principal": "*",
         "Action": "s3:GetObject",
         "Resource": "arn:aws:s3:::your-bucket-name/*"
       }
     ]
   }
   ```

## File Validation Rules

### **Supported File Types**

| Type | Extensions | Max Size | Notes |
|------|------------|----------|-------|
| Image | jpg, jpeg, png, gif, webp | 10MB | Thumbnails generated |
| Video | mp4, avi, mov, wmv | 50MB | No thumbnails |
| Audio | mp3, wav, ogg | 25MB | No thumbnails |
| Document | pdf, doc, docx, txt | 10MB | No thumbnails |

### **Validation Implementation**

```typescript
// File validation in S3Service
validateFile(fileName: string, mimeType: string, fileSize: number): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const maxSize = 50 * 1024 * 1024; // 50MB
  const allowedMimeTypes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'video/mp4', 'video/avi', 'video/mov',
    'audio/mpeg', 'audio/wav',
    'application/pdf', 'text/plain'
  ];

  if (fileSize > maxSize) {
    errors.push(`File size exceeds maximum allowed size`);
  }

  if (!allowedMimeTypes.includes(mimeType)) {
    errors.push(`File type ${mimeType} is not allowed`);
  }

  return { isValid: errors.length === 0, errors };
}
```

## Error Handling

### **Common Error Scenarios**

1. **File Too Large**:
   ```json
   {
     "statusCode": 400,
     "message": "File validation failed: File size exceeds maximum allowed size",
     "error": "Bad Request"
   }
   ```

2. **Invalid File Type**:
   ```json
   {
     "statusCode": 400,
     "message": "File validation failed: File type application/exe is not allowed",
     "error": "Bad Request"
   }
   ```

3. **S3 Upload Failed**:
   ```json
   {
     "statusCode": 500,
     "message": "Failed to generate upload URL",
     "error": "Internal Server Error"
   }
   ```

4. **File Not Found**:
   ```json
   {
     "statusCode": 404,
     "message": "File not found",
     "error": "Not Found"
   }
   ```

## Performance Optimization

### **Upload Optimization**

1. **Chunked Uploads**: For large files, implement chunked uploads
2. **Parallel Uploads**: Allow multiple file uploads simultaneously
3. **Progress Tracking**: Real-time upload progress
4. **Retry Logic**: Automatic retry for failed uploads

### **Thumbnail Optimization**

1. **Lazy Loading**: Load thumbnails as needed
2. **Caching**: Cache thumbnails in CDN
3. **Compression**: Optimize thumbnail file sizes
4. **Multiple Sizes**: Generate different thumbnail sizes

### **Database Optimization**

1. **Indexing**: Index on workspaceId, fileType, status
2. **Pagination**: Limit query results
3. **Soft Deletes**: Use soft deletes for data recovery
4. **Archiving**: Archive old files to cheaper storage

## Security Considerations

### **Access Control**

1. **Workspace Isolation**: Files are isolated by workspace
2. **Permission Checks**: All operations require proper permissions
3. **Pre-signed URLs**: Time-limited access to S3
4. **File Validation**: Strict file type and size validation

### **Data Protection**

1. **Encryption**: Files encrypted at rest in S3
2. **HTTPS**: All transfers use HTTPS
3. **Audit Trail**: Complete audit trail for file operations
4. **Backup**: Regular backups of file metadata

## Monitoring & Analytics

### **Key Metrics**

1. **Upload Success Rate**: Percentage of successful uploads
2. **File Storage Usage**: Total storage per workspace
3. **Thumbnail Generation**: Success rate of thumbnail creation
4. **Download Patterns**: Most accessed files

### **Logging**

```typescript
// Example logging in services
this.logger.log(`File uploaded: ${file.originalName} (${file.fileSize} bytes)`);
this.logger.warn(`Thumbnail generation failed for file: ${fileId}`);
this.logger.error(`S3 upload failed: ${error.message}`);
```

## Deployment Checklist

### **Pre-deployment**

- [ ] AWS credentials configured
- [ ] S3 bucket created and configured
- [ ] CORS policy set
- [ ] Environment variables set
- [ ] Dependencies installed

### **Post-deployment**

- [ ] Test file upload flow
- [ ] Verify thumbnail generation
- [ ] Check workspace isolation
- [ ] Test file deletion
- [ ] Monitor error logs

## Troubleshooting

### **Common Issues**

1. **CORS Errors**: Check S3 CORS configuration
2. **Permission Denied**: Verify AWS credentials and bucket policy
3. **Upload Timeout**: Increase timeout settings or use chunked uploads
4. **Thumbnail Generation Failed**: Check Sharp installation and image formats

### **Debug Commands**

```bash
# Test S3 connectivity
aws s3 ls s3://your-bucket-name

# Check bucket policy
aws s3api get-bucket-policy --bucket your-bucket-name

# Verify CORS
aws s3api get-bucket-cors --bucket your-bucket-name
```

## Future Enhancements

### **Planned Features**

1. **CDN Integration**: CloudFront for faster file delivery
2. **Advanced Image Processing**: Watermarks, filters, resizing
3. **Video Thumbnails**: Generate video preview thumbnails
4. **File Versioning**: Track file versions and changes
5. **Bulk Operations**: Upload/delete multiple files
6. **File Sharing**: Generate shareable links for files
7. **Advanced Search**: Full-text search in file metadata
8. **Storage Analytics**: Detailed storage usage reports

This comprehensive file upload system provides a robust foundation for handling all file operations in the Humanoid platform while maintaining security, scalability, and user experience.
