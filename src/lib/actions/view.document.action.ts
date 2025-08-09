// lib/actions/document.actions.ts
'use server';

import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { db } from '@/lib/db';
import { courseMaterials } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getAuthUser } from '@/lib/auth';

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

export async function getDocumentViewerUrl(itemId: number, itemType: 'course-material') {
  try {
    const authUser = await getAuthUser();
    if (!authUser) throw new Error('Unauthorized');

    if (itemType !== 'course-material') throw new Error('Invalid item type');

    const item = await db.query.courseMaterials.findFirst({
      where: eq(courseMaterials.id, itemId),
      columns: { fileUrl: true, title: true, type: true },
    });

    if (!item || !item.fileUrl) throw new Error('Material not found');

    // Extract the key from the stored file URL
    let fileKey = '';
    try {
      const url = new URL(item.fileUrl);
      fileKey = url.pathname.startsWith('/') ? url.pathname.substring(1) : url.pathname;
    } catch {
      console.warn('Invalid URL, treating as raw key:', item.fileUrl);
      fileKey = item.fileUrl;
    }

    // Get ContentType via HEAD
    const headCommand = new GetObjectCommand({
      Bucket: r2BucketName,
      Key: fileKey,
    });

    const headObject = await s3Client.send(headCommand);
    const contentType = headObject.ContentType || 'application/octet-stream';

    // Create signed URL for inline viewing
    const command = new GetObjectCommand({
      Bucket: r2BucketName,
      Key: fileKey,
      ResponseContentDisposition: 'inline', // ⚠️ Enable inline rendering
      ResponseContentType: contentType,
    });

    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // 1 hour

    return {
      success: true,
      fileUrl: signedUrl,
      fileType: item.type,
    };
  } catch (error) {
    console.error('Error getting viewer URL:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get document viewer URL',
    };
  }
}
