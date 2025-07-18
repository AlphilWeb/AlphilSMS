'use server';

import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { assignments, quizzes, courseMaterials } from '@/lib/db/schema';
import { getAuthUser } from '../auth';

// Validate environment variables
const r2BucketName = process.env.R2_BUCKET_NAME;
const r2Endpoint = process.env.R2_ENDPOINT;
const r2AccessKeyId = process.env.R2_ACCESS_KEY_ID;
const r2SecretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

if (!r2BucketName || !r2Endpoint || !r2AccessKeyId || !r2SecretAccessKey) {
  throw new Error('Missing required R2 environment variables');
}

// Configure the S3 client for Cloudflare R2
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
    // Authorization check
    const authUser = await getAuthUser();
    if (!authUser) {
      throw new Error('Unauthorized: User not authenticated');
    }

    let fileUrl: string | null = null;
    let fileName: string = '';

    // Query the appropriate table based on itemType
    switch (itemType) {
      case 'assignment': {
        const assignment = await db.query.assignments.findFirst({
          where: eq(assignments.id, itemId),
          columns: {
            fileUrl: true,
            title: true,
          },
        });

        if (!assignment) {
          throw new Error('Assignment not found');
        }

        fileUrl = assignment.fileUrl;
        fileName = assignment.title;
        break;
      }

      case 'quiz': {
        const quiz = await db.query.quizzes.findFirst({
          where: eq(quizzes.id, itemId),
          columns: {
            fileUrl: true,
            title: true,
          },
        });

        if (!quiz) {
          throw new Error('Quiz not found');
        }

        fileUrl = quiz.fileUrl;
        fileName = quiz.title;
        break;
      }

      case 'course-material': {
        const material = await db.query.courseMaterials.findFirst({
          where: eq(courseMaterials.id, itemId),
          columns: {
            fileUrl: true,
            title: true,
          },
        });

        if (!material) {
          throw new Error('Course material not found');
        }

        fileUrl = material.fileUrl;
        fileName = material.title;
        break;
      }

      default:
        throw new Error('Invalid item type');
    }

    if (!fileUrl) {
      throw new Error('File not found for the requested item');
    }

    // Extract the key from the fileUrl (handle both full URLs and raw keys)
    let key = fileUrl;
    if (fileUrl.startsWith('http')) {
      try {
        const url = new URL(fileUrl);
        key = url.pathname.startsWith('/') ? url.pathname.substring(1) : url.pathname;
      } catch (e) {
        // If URL parsing fails, assume fileUrl is already the key
        console.warn('Failed to parse fileUrl as URL, using as-is:', fileUrl);
      }
    }

    // Generate presigned URL
    const command = new GetObjectCommand({
      Bucket: r2BucketName,
      Key: key,
      ResponseContentDisposition: `attachment; filename="${encodeURIComponent(fileName)}"`,
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