// app/actions/admin-actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { 
  users, 
  staff, 
  departments, 
  userLogs,
  students,
  courses,
  type SelectUser,
  type SelectStaff,
  type SelectDepartment,
  type NewUserLog,
  type SelectUserLog
} from '@/lib/db/schema';
import { eq, and, desc, sql, count } from 'drizzle-orm';
import { hash, compare } from 'bcryptjs';
import { redirect } from 'next/navigation';
import { getAuthUser } from '@/lib/auth';
import { s3Client, bucketName } from '@/lib/s3-client';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';

// Types for admin profile data
export interface AdminProfileData {
  user: SelectUser;
  staff: SelectStaff;
  department: SelectDepartment | null;
  recentActivity: SelectUserLog[];
}

export interface UpdateAdminProfileParams {
  firstName: string;
  lastName: string;
  email: string;
  idNumber?: string;
  position?: string;
  currentPassword?: string;
  newPassword?: string;
  employmentDocuments?: File;
  nationalIdPhoto?: File;
  academicCertificates?: File;
  passportPhoto?: File;
}

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

// Get admin profile data
export async function getAdminProfile(): Promise<AdminProfileData> {
  try {
    const authUser = await getAuthUser();
    if (!authUser) throw new Error('Unauthorized');

    const userId = authUser.userId;

    // Get user data
    const userData = await db.select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!userData[0]) {
      throw new Error('User not found');
    }

    // Get staff data
    const staffData = await db.select()
      .from(staff)
      .where(eq(staff.userId, userId))
      .limit(1);

    if (!staffData[0]) {
      throw new Error('Staff profile not found');
    }

    // Get department data
    const departmentData = await db.select()
      .from(departments)
      .where(eq(departments.id, staffData[0].departmentId))
      .limit(1);

    // Get recent activity (last 10 user logs)
    const recentActivity = await db.select()
      .from(userLogs)
      .where(eq(userLogs.userId, userId))
      .orderBy(desc(userLogs.timestamp))
      .limit(10);

    return {
      user: userData[0],
      staff: staffData[0],
      department: departmentData[0] || null,
      recentActivity
    };
  } catch (error) {
    console.error('Error fetching admin profile:', error);
    throw new Error(
      error instanceof Error 
        ? error.message 
        : 'Failed to fetch admin profile'
    );
  }
}

// Update admin profile
export async function updateAdminProfile(
  data: UpdateAdminProfileParams
): Promise<{ success: boolean; message: string }> {
  try {
    const authUser = await getAuthUser();
    if (!authUser) throw new Error('Unauthorized');

    const userId = authUser.userId;
    const { 
      firstName, 
      lastName, 
      email, 
      idNumber, 
      position, 
      currentPassword, 
      newPassword,
      employmentDocuments,
      nationalIdPhoto,
      academicCertificates,
      passportPhoto
    } = data;

    // Get current user and staff data
    const [userData] = await db.select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!userData) {
      throw new Error('User not found');
    }

    const [staffData] = await db.select()
      .from(staff)
      .where(eq(staff.userId, userId))
      .limit(1);

    if (!staffData) {
      throw new Error('Staff profile not found');
    }

    // Check if email is already taken by ANOTHER user
    if (email !== userData.email) {
      const [existingUser] = await db.select()
        .from(users)
        .where(and(eq(users.email, email), sql`${users.id} != ${userId}`))
        .limit(1);

      if (existingUser) {
        return {
          success: false,
          message: 'Email is already taken by another user'
        };
      }
    }

    // Check if ID number is already taken by ANOTHER user
    if (idNumber && idNumber !== userData.idNumber) {
      const [existingUser] = await db.select()
        .from(users)
        .where(and(eq(users.idNumber, idNumber), sql`${users.id} != ${userId}`))
        .limit(1);

      if (existingUser) {
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
          message: 'Current password is incorrect'
        };
      }

      const hashedPassword = await hash(newPassword, 12);
      
      await db.update(users)
        .set({
          email,
          idNumber: idNumber || null,
          passwordHash: hashedPassword,
          updatedAt: new Date()
        })
        .where(eq(users.id, userId));
    } else {
      await db.update(users)
        .set({
          email,
          idNumber: idNumber || null,
          updatedAt: new Date()
        })
        .where(eq(users.id, userId));
    }

    // Upload files if provided
    const [
      employmentDocumentsUrl,
      nationalIdPhotoUrl,
      academicCertificatesUrl,
      passportPhotoUrl
    ] = await Promise.all([
      employmentDocuments 
        ? uploadFileToR2(employmentDocuments, 'employment-documents') 
        : Promise.resolve(null),
      nationalIdPhoto 
        ? uploadFileToR2(nationalIdPhoto, 'national-id-photos') 
        : Promise.resolve(null),
      academicCertificates 
        ? uploadFileToR2(academicCertificates, 'academic-certificates') 
        : Promise.resolve(null),
      passportPhoto 
        ? uploadFileToR2(passportPhoto, 'passport-photos') 
        : Promise.resolve(null),
    ]);

    // Prepare staff update data
    const staffUpdateData: Partial<SelectStaff> = {
      firstName,
      lastName,
      email,
      idNumber: idNumber || null,
      position: position || staffData.position,
      updatedAt: new Date()
    };

    // Only update file URLs if new files were uploaded
    if (employmentDocumentsUrl) staffUpdateData.employmentDocumentsUrl = employmentDocumentsUrl;
    if (nationalIdPhotoUrl) staffUpdateData.nationalIdPhotoUrl = nationalIdPhotoUrl;
    if (academicCertificatesUrl) staffUpdateData.academicCertificatesUrl = academicCertificatesUrl;
    if (passportPhotoUrl) staffUpdateData.passportPhotoUrl = passportPhotoUrl;

    // Update staff profile
    await db.update(staff)
      .set(staffUpdateData)
      .where(eq(staff.id, staffData.id));

    // Log the profile update
    await logUserAction(userId, 'update', 'staff', staffData.id, 'Updated admin profile information');

    revalidatePath('/admin/profile');
    return {
      success: true,
      message: 'Profile updated successfully'
    };
  } catch (error) {
    console.error('Error updating admin profile:', error);
    return {
      success: false,
      message: error instanceof Error 
        ? error.message 
        : 'Failed to update profile'
    };
  }
}

// Update individual profile photo
export async function updateAdminProfilePhoto(
  photoType: 'passport' | 'nationalId' | 'academic' | 'employment',
  file: File
): Promise<{ success: boolean; message: string; fileUrl?: string }> {
  try {
    const authUser = await getAuthUser();
    if (!authUser) throw new Error('Unauthorized');

    const userId = authUser.userId;

    const [staffData] = await db.select()
      .from(staff)
      .where(eq(staff.userId, userId))
      .limit(1);

    if (!staffData) {
      throw new Error('Staff profile not found');
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

    const updateData: Partial<SelectStaff> = {
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

    await logUserAction(userId, 'update', 'staff', staffData.id, `Updated ${photoType} photo`);

    revalidatePath('/admin/profile');
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

// Get admin dashboard statistics
export async function getAdminDashboardStats() {
  try {
    const authUser = await getAuthUser();
    if (!authUser) throw new Error('Unauthorized');

    const [
      totalStudents,
      totalStaff,
      totalCourses,
      recentRegistrations
    ] = await Promise.all([
      db.select({ count: count() }).from(students),
      db.select({ count: count() }).from(staff),
      db.select({ count: count() }).from(courses),
      db.select()
        .from(students)
        .orderBy(desc(students.createdAt))
        .limit(5)
    ]);

    return {
      totalStudents: totalStudents[0]?.count || 0,
      totalStaff: totalStaff[0]?.count || 0,
      totalCourses: totalCourses[0]?.count || 0,
      recentRegistrations
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    throw new Error('Failed to fetch dashboard statistics');
  }
}

// Helper function to log user actions
async function logUserAction(
  userId: number,
  action: string,
  targetTable: string,
  targetId: number,
  description: string
): Promise<void> {
  try {
    const logEntry: NewUserLog = {
      userId,
      action,
      targetTable,
      targetId,
      description,
      timestamp: new Date()
    };

    await db.insert(userLogs).values(logEntry);
  } catch (error) {
    console.error('Error logging user action:', error);
  }
}

// Delete admin account
export async function deleteAdminAccount(
  confirmation: string
): Promise<{ success: boolean; message: string }> {
  try {
    const authUser = await getAuthUser();
    if (!authUser) throw new Error('Unauthorized');

    const userId = authUser.userId;

    const [staffData] = await db.select()
      .from(staff)
      .where(eq(staff.userId, userId))
      .limit(1);

    if (!staffData) {
      throw new Error('Staff profile not found');
    }

    if (confirmation !== 'DELETE MY ACCOUNT') {
      return {
        success: false,
        message: 'Confirmation text does not match'
      };
    }

    // Check if admin is head of any department
    const departmentsHeaded = await db.select()
      .from(departments)
      .where(eq(departments.headOfDepartmentId, staffData.id));

    if (departmentsHeaded.length > 0) {
      return {
        success: false,
        message: 'Cannot delete account while serving as department head'
      };
    }

    // Delete staff record
    await db.delete(staff).where(eq(staff.id, staffData.id));

    // Delete user account
    await db.delete(users).where(eq(users.id, userId));

    await logUserAction(userId, 'delete', 'users', userId, 'Admin account deleted');

    redirect('/login');
  } catch (error) {
    console.error('Error deleting admin account:', error);
    return {
      success: false,
      message: 'Failed to delete account'
    };
  }
}

// Get image URL for admin profile
export async function getAdminImageUrl(
  imageType: 'passport' | 'nationalId' | 'academic' | 'employment'
): Promise<{ success: boolean; imageUrl?: string; message?: string }> {
  try {
    const authUser = await getAuthUser();
    if (!authUser) throw new Error('Unauthorized');

    const userId = authUser.userId;

    const [staffData] = await db.select()
      .from(staff)
      .where(eq(staff.userId, userId))
      .limit(1);

    if (!staffData) {
      throw new Error('Staff profile not found');
    }

    let imageUrl: string | null = null;

    switch (imageType) {
      case 'passport':
        imageUrl = staffData.passportPhotoUrl;
        break;
      case 'nationalId':
        imageUrl = staffData.nationalIdPhotoUrl;
        break;
      case 'academic':
        imageUrl = staffData.academicCertificatesUrl;
        break;
      case 'employment':
        imageUrl = staffData.employmentDocumentsUrl;
        break;
    }

    if (!imageUrl) {
      return {
        success: false,
        message: 'Image not found'
      };
    }

    return {
      success: true,
      imageUrl
    };
  } catch (error) {
    console.error('Error getting admin image URL:', error);
    return {
      success: false,
      message: 'Failed to get image URL'
    };
  }
}