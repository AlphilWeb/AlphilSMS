import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import { s3Client, bucketName } from './s3-client';


const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;

export async function uploadFileToR2(file: File, folder: string): Promise<string> {
    // 1. File size validation
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error(`File size exceeds the limit of ${MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB.`);
  }

  // Use a try...catch block to handle potential errors during the upload process
  try {
    const fileExtension = file.name.split('.').pop();
    const key = `${folder}/${uuidv4()}.${fileExtension}`;
    
    const params = {
      Bucket: bucketName,
      Key: key,
      Body: Buffer.from(await file.arrayBuffer()),
      ContentType: file.type,
    };

    await s3Client.send(new PutObjectCommand(params));
    return key;
  } catch (error) {
    console.error('Failed to upload file to R2:', error);
    // Rethrow a more user-friendly error or a specific custom error
    if (error instanceof Error) {
      throw new Error(`Upload failed: ${error.message}`);
    } else {
      throw new Error('An unknown error occurred during the file upload.');
    }
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