'use server';

import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { assignments, quizzes, courseMaterials } from '@/lib/db/schema';
import { getAuthUser } from '../auth';

const r2BucketName = process.env.R2_BUCKET_NAME;
const r2Endpoint = process.env.R2_ENDPOINT;
const r2AccessKeyId = process.env.R2_ACCESS_KEY_ID;
const r2SecretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

if (!r2BucketName || !r2Endpoint || !r2AccessKeyId || !r2SecretAccessKey) {
  throw new Error('Missing required R2 environment variables');
}

const s3Client = new S3Client({
  region: 'auto',
  endpoint: r2Endpoint.includes('://') ? r2Endpoint : `https://${r2Endpoint}`,
  credentials: {
    accessKeyId: r2AccessKeyId,
    secretAccessKey: r2SecretAccessKey,
  },
});

export async function getDownloadUrl(
  itemId: number,
  itemType: 'assignment' | 'quiz' | 'course-material'
) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      throw new Error('Unauthorized: User not authenticated');
    }

    let fileUrl: string | null = null;
    let fileName: string = '';
    let fileKey: string = '';

    switch (itemType) {
      case 'assignment': {
        const item = await db.query.assignments.findFirst({
          where: eq(assignments.id, itemId),
          columns: { fileUrl: true, title: true },
        });
        if (!item) throw new Error('Assignment not found');
        fileUrl = item.fileUrl;
        fileName = item.title;
        break;
      }
      case 'quiz': {
        const item = await db.query.quizzes.findFirst({
          where: eq(quizzes.id, itemId),
          columns: { fileUrl: true, title: true },
        });
        if (!item) throw new Error('Quiz not found');
        fileUrl = item.fileUrl;
        fileName = item.title;
        break;
      }
      case 'course-material': {
        const item = await db.query.courseMaterials.findFirst({
          where: eq(courseMaterials.id, itemId),
          columns: { fileUrl: true, title: true },
        });
        if (!item) throw new Error('Course material not found');
        fileUrl = item.fileUrl;
        fileName = item.title;
        break;
      }
      default:
        throw new Error('Invalid item type');
    }

    if (!fileUrl) {
      throw new Error('File not found for the requested item');
    }

    // Extract the key from the fileUrl
    try {
      const url = new URL(fileUrl);
      fileKey = url.pathname.startsWith('/') ? url.pathname.substring(1) : url.pathname;
    } catch (e) {
      // If URL parsing fails, assume fileUrl is already the key
      fileKey = fileUrl;
    }
    
    // --- THIS IS THE CRUCIAL PART ---
    // Fetch the object's metadata to get the Content-Type
    const headCommand = new GetObjectCommand({
      Bucket: r2BucketName,
      Key: fileKey,
    });
    
    // This is more efficient than getting the whole object
    const headObject = await s3Client.send(headCommand);
    const contentType = headObject.ContentType || 'application/octet-stream';
    const originalFileName = fileKey.split('/').pop();

    // Create a dynamic filename with the correct extension
    const fileExtension = originalFileName?.split('.').pop() || 'txt';
    const finalFileName = `${fileName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${fileExtension}`;


    // Generate presigned URL with both Content-Disposition and Content-Type
    const command = new GetObjectCommand({
      Bucket: r2BucketName,
      Key: fileKey,
      ResponseContentDisposition: `attachment; filename="${encodeURIComponent(finalFileName)}"`,
      ResponseContentType: contentType, // <--- Add this line
    });

    const signedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 3600, // 1 hour expiration
    });

    return { success: true, url: signedUrl };
  } catch (error) {
    console.error('Error generating download URL:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate download URL',
    };
  }
}