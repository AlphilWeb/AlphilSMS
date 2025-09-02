'use server';

import { db } from '@/lib/db/index';
import { staff, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getAuthUser } from '@/lib/auth';
import { hash, compare } from 'bcryptjs';
import { revalidatePath } from 'next/cache';
import { s3Client, bucketName } from '@/lib/s3-client';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';

// Types for lecturer profile data
export interface LecturerProfileData {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  position: string;
  departmentName: string;
  createdAt: string;
  employmentDocumentsUrl: string | null;
  nationalIdPhotoUrl: string | null;
  academicCertificatesUrl: string | null;
  passportPhotoUrl: string | null;
}

export type LecturerProfileState = {
  success?: boolean;
  message?: string;
  errors?: {
    firstName?: string[];
    lastName?: string[];
    idNumber?: string[];
    currentPassword?: string[];
    newPassword?: string[];
  };
};

// Helper function to upload file to R2
async function uploadFileToR2(file: File, folder: string): Promise<string> {
  const fileExtension = file.name.split('.').pop();
  const fileName = `${folder}/${uuidv4()}.${fileExtension}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: fileName,
    Body: buffer,
    ContentType: file.type,
  });

  await s3Client.send(command);
  return fileName;
}

export async function getLecturerProfile(): Promise<LecturerProfileData> {
  try {
    const authUser = await getAuthUser();
    if (!authUser || !authUser.userId) {
      throw new Error('Unauthorized: You must be logged in.');
    }

    const profileData = await db.query.staff.findFirst({
      where: eq(staff.userId, authUser.userId),
      with: {
        user: {
          columns: {
            email: true,
            createdAt: true,
            idNumber: true
          }
        },
        department: {
          columns: {
            name: true
          }
        }
      }
    });

    if (!profileData) {
      throw new Error('Lecturer profile not found');
    }

    return {
      id: profileData.id,
      firstName: profileData.firstName,
      lastName: profileData.lastName,
      email: profileData.user?.email || '',
      position: profileData.position || '',
      departmentName: profileData.department?.name || 'Not specified',
      createdAt: profileData.user?.createdAt.toISOString() || '',
      employmentDocumentsUrl: profileData.employmentDocumentsUrl,
      nationalIdPhotoUrl: profileData.nationalIdPhotoUrl,
      academicCertificatesUrl: profileData.academicCertificatesUrl,
      passportPhotoUrl: profileData.passportPhotoUrl
    };
  } catch (error) {
    console.error('[GET_LECTURER_PROFILE_ERROR]', error);
    throw new Error(
      error instanceof Error
        ? error.message
        : 'Failed to fetch profile data'
    );
  }
}

export async function updateLecturerProfile(
  prevState: LecturerProfileState,
  formData: FormData
): Promise<LecturerProfileState> {
  try {
    const authUser = await getAuthUser();
    if (!authUser || !authUser.userId) {
      return {
        success: false,
        message: 'Unauthorized: You must be logged in.'
      };
    }

    // Extract data from FormData
    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    const idNumber = formData.get('idNumber') as string;
    const currentPassword = formData.get('currentPassword') as string;
    const newPassword = formData.get('newPassword') as string;

    // Basic validation
    const errors: LecturerProfileState['errors'] = {};

    if (!firstName?.trim()) {
      errors.firstName = ['First name is required'];
    }

    if (!lastName?.trim()) {
      errors.lastName = ['Last name is required'];
    }

    if (Object.keys(errors).length > 0) {
      return {
        success: false,
        message: 'Invalid input',
        errors
      };
    }

    // Get current user data
    const [userData] = await db.select()
      .from(users)
      .where(eq(users.id, authUser.userId))
      .limit(1);

    if (!userData) {
      return {
        success: false,
        message: 'User not found'
      };
    }

    // Check if ID number is already taken by ANOTHER user
    if (idNumber && idNumber !== userData.idNumber) {
      const [existingUser] = await db.select()
        .from(users)
        .where(eq(users.idNumber, idNumber))
        .limit(1);

      if (existingUser && existingUser.id !== authUser.userId) {
        return {
          success: false,
          message: 'ID number is already taken by another user'
        };
      }
    }

    // Handle password change if provided
    if (currentPassword && newPassword) {
      const isPasswordValid = await compare(currentPassword, userData.passwordHash);
      if (!isPasswordValid) {
        return {
          success: false,
          message: 'Current password is incorrect',
          errors: {
            currentPassword: ['Current password is incorrect']
          }
        };
      }

      const hashedPassword = await hash(newPassword, 12);

      await db.update(users)
        .set({
          idNumber: idNumber || null,
          passwordHash: hashedPassword,
          updatedAt: new Date()
        })
        .where(eq(users.id, authUser.userId));
    } else if (idNumber && idNumber !== userData.idNumber) {
      // Only update ID number if no password change
      await db.update(users)
        .set({
          idNumber: idNumber || null,
          updatedAt: new Date()
        })
        .where(eq(users.id, authUser.userId));
    }

    // Update staff profile
    await db.update(staff)
      .set({
        firstName,
        lastName,
        updatedAt: new Date()
      })
      .where(eq(staff.userId, authUser.userId));

    revalidatePath('/lecturer/profile');
    return {
      success: true,
      message: 'Profile updated successfully'
    };
  } catch (error) {
    console.error('[UPDATE_LECTURER_PROFILE_ERROR]', error);
    return {
      success: false,
      message: error instanceof Error
        ? error.message
        : 'Failed to update profile'
    };
  }
}

// Update individual profile photo
export async function updateLecturerProfilePhoto(
  photoType: 'passport' | 'nationalId' | 'academic' | 'employment',
  file: File
): Promise<{ success: boolean; message: string; fileUrl?: string }> {
  try {
    const authUser = await getAuthUser();
    if (!authUser || !authUser.userId) {
      return {
        success: false,
        message: 'Unauthorized: You must be logged in.'
      };
    }

    const [staffData] = await db.select()
      .from(staff)
      .where(eq(staff.userId, authUser.userId))
      .limit(1);

    if (!staffData) {
      return {
        success: false,
        message: 'Staff profile not found'
      };
    }

    // Upload file to R2
    let folder: string;
    switch (photoType) {
      case 'passport':
        folder = 'passport-photos';
        break;
      case 'nationalId':
        folder = 'national-id-photos';
        break;
      case 'academic':
        folder = 'academic-certificates';
        break;
      case 'employment':
        folder = 'employment-documents';
        break;
      default:
        folder = 'staff-documents';
    }

    const fileUrl = await uploadFileToR2(file, folder);

    const updateData: Partial<typeof staff.$inferSelect> = {
      updatedAt: new Date()
    };

    switch (photoType) {
      case 'passport':
        updateData.passportPhotoUrl = fileUrl;
        break;
      case 'nationalId':
        updateData.nationalIdPhotoUrl = fileUrl;
        break;
      case 'academic':
        updateData.academicCertificatesUrl = fileUrl;
        break;
      case 'employment':
        updateData.employmentDocumentsUrl = fileUrl;
        break;
    }

    await db.update(staff)
      .set(updateData)
      .where(eq(staff.id, staffData.id));

    revalidatePath('/lecturer/profile');
    return {
      success: true,
      message: 'Profile photo updated successfully',
      fileUrl
    };
  } catch (error) {
    console.error('Error updating profile photo:', error);
    return {
      success: false,
      message: 'Failed to update profile photo'
    };
  }
}

// Get image URL for lecturer profile
export async function getLecturerImageUrl(
  staffId: number,
  imageType: 'passport' | 'nationalId' | 'academic' | 'employment'
): Promise<string | null> {
  try {
    const [staffData] = await db.select()
      .from(staff)
      .where(eq(staff.id, staffId))
      .limit(1);

    if (!staffData) {
      return null;
    }

    switch (imageType) {
      case 'passport':
        return staffData.passportPhotoUrl;
      case 'nationalId':
        return staffData.nationalIdPhotoUrl;
      case 'academic':
        return staffData.academicCertificatesUrl;
      case 'employment':
        return staffData.employmentDocumentsUrl;
      default:
        return null;
    }
  } catch (error) {
    console.error('Error getting lecturer image URL:', error);
    return null;
  }
}