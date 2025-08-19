import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import { s3Client, bucketName } from './s3-client';

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

function isValidFileType(file: File, allowedTypes: string[]): boolean {
  return allowedTypes.includes(file.type);
}

export async function uploadFileToR2(file: File, folder: string): Promise<string> {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error(`File size exceeds the limit of ${MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB.`);
  }

  const fileExtension = file.name.split('.').pop()?.toLowerCase();
  
  if (fileExtension !== 'pdf' && folder.includes('photos') && !isValidFileType(file, ALLOWED_IMAGE_TYPES)) {
      throw new Error('Only JPEG, PNG, and WebP images are allowed.');
  }

  try {
    const key = `${folder}/${uuidv4()}.${fileExtension}`;
    
    const params = {
      Bucket: bucketName,
      Key: key,
      Body: Buffer.from(await file.arrayBuffer()),
      ContentType: fileExtension === 'pdf' ? 'application/pdf' : file.type,
    };

    await s3Client.send(new PutObjectCommand(params));
    return key;
  } catch (error) {
    console.error('Failed to upload file to R2:', error);
    if (error instanceof Error) {
      throw new Error(`Upload failed: ${error.message}`);
    }
    throw new Error('An unknown error occurred during the file upload.');
  }
}

export async function getPresignedUrl(key: string): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
}

export function getPublicUrl(key: string): string {
  return `https://pub-${process.env.R2_ACCOUNT_ID}.r2.dev/${key}`;
}

export async function uploadUserPhoto(file: File, userType: 'staff' | 'student'): Promise<string> {
  const folder = `users/${userType}/photos`;
  return uploadFileToR2(file, folder);
}

export async function uploadUserDocument(file: File, userType: 'staff' | 'student', documentType: string): Promise<string> {
  const folder = `users/${userType}/documents/${documentType}`;
  return uploadFileToR2(file, folder);
}