// lib/actions/image.actions.ts
'use server';

import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { db } from '@/lib/db';
import { students, staff, documentLogs } from '@/lib/db/schema';
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

export type ImageType = 
  | 'student-passport' 
  | 'student-id' 
  | 'student-certificate'
  | 'staff-passport'
  | 'staff-national-id'
  | 'staff-academic-certificates'
  | 'lecturer-passport'; 

export async function getImageUrl(
  targetId: number, 
  imageType: ImageType,
) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) throw new Error('Unauthorized');

    let imageUrl: string | null = null;
    let table: string = '';

    // Determine which table and field to query based on imageType
    switch (imageType) {
      case 'student-passport':
        const studentPassport = await db.query.students.findFirst({
          where: eq(students.id, targetId),
          columns: { passportPhotoUrl: true },
        });
        imageUrl = studentPassport?.passportPhotoUrl || null;
        table = 'students';
        break;

      case 'student-id':
        const studentId = await db.query.students.findFirst({
          where: eq(students.id, targetId),
          columns: { idPhotoUrl: true },
        });
        imageUrl = studentId?.idPhotoUrl || null;
        table = 'students';
        break;

      case 'student-certificate':
        const studentCertificate = await db.query.students.findFirst({
          where: eq(students.id, targetId),
          columns: { certificateUrl: true },
        });
        imageUrl = studentCertificate?.certificateUrl || null;
        table = 'students';
        break;

      case 'staff-passport':
        const staffPassport = await db.query.staff.findFirst({
          where: eq(staff.id, targetId),
          columns: { passportPhotoUrl: true },
        });
        imageUrl = staffPassport?.passportPhotoUrl || null;
        table = 'staff';
        break;

      case 'staff-national-id':
        const staffNationalId = await db.query.staff.findFirst({
          where: eq(staff.id, targetId),
          columns: { nationalIdPhotoUrl: true },
        });
        imageUrl = staffNationalId?.nationalIdPhotoUrl || null;
        table = 'staff';
        break;

      case 'staff-academic-certificates':
        const staffAcademic = await db.query.staff.findFirst({
          where: eq(staff.id, targetId),
          columns: { academicCertificatesUrl: true },
        });
        imageUrl = staffAcademic?.academicCertificatesUrl || null;
        table = 'staff';
        console.log(table);
        break;

      default:
        throw new Error('Invalid image type');
    }

    if (!imageUrl) {
      return {
        success: false,
        error: 'Image not found',
      };
    }

    // Extract the key from the stored file URL
    let fileKey = '';
    try {
      const url = new URL(imageUrl);
      fileKey = url.pathname.startsWith('/') ? url.pathname.substring(1) : url.pathname;
    } catch {
      console.warn('Invalid URL, treating as raw key:', imageUrl);
      fileKey = imageUrl;
    }

    // Create command for signed URL
    const command = new GetObjectCommand({
      Bucket: r2BucketName,
      Key: fileKey,
    });

    // Generate signed URL (expires in 10 hour)
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 36000 }); // 10 hours

    // Log the image access for auditing
    await db.insert(documentLogs).values({
      userId: authUser.userId ,
      documentType: `image-${imageType}`,
      targetId: targetId,
      ipAddress: '', // You might want to capture this from the request
      userAgent: '', // You might want to capture this from the request
    }).catch(error => {
      console.error('Failed to log image access:', error);
    });

    return {
      success: true,
      imageUrl: signedUrl,
      imageType,
      targetId,
    };
  } catch (error) {
    console.error('Error getting image URL:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get image URL',
    };
  }
}

// Helper function to get multiple images at once
export async function getMultipleImageUrls(
  requests: Array<{
    targetId: number;
    imageType: ImageType;
  }>
) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) throw new Error('Unauthorized');

    const results = await Promise.all(
      requests.map(async (request) => {
        const result = await getImageUrl(request.targetId, request.imageType);
        return {
          ...request,
          ...result,
        };
      })
    );

    return {
      success: true,
      results,
    };
  } catch (error) {
    console.error('Error getting multiple image URLs:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get image URLs',
    };
  }
}

// Function to get student profile images (passport and ID)
export async function getStudentProfileImages(studentId: number) {
  return getMultipleImageUrls([
    { targetId: studentId, imageType: 'student-passport' },
    { targetId: studentId, imageType: 'student-id' },
  ]);
}

// Function to get staff profile images
export async function getStaffProfileImages(staffId: number) {
  return getMultipleImageUrls([
    { targetId: staffId, imageType: 'staff-passport' },
    { targetId: staffId, imageType: 'staff-national-id' },
  ]);
}