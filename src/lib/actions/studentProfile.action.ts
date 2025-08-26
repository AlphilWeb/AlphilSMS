'use server';

import { db } from '@/lib/db/index';
import { students, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getAuthUser } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function getStudentProfile() {
  try {
    const authUser = await getAuthUser();
    if (!authUser || !authUser.userId) {
      throw new Error('Unauthorized: You must be logged in.');
    }

    const profileData = await db.query.students.findFirst({
      where: eq(students.userId, authUser.userId),
      with: {
        user: {
          columns: {
            email: true,
            createdAt: true
          }
        },
        program: {
          columns: {
            name: true,
            code: true
          },
          with: {
            department: {
              columns: {
                name: true
              }
            }
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
      throw new Error('Student profile not found');
    }

    return {
      id: profileData.id,
      firstName: profileData.firstName,
      lastName: profileData.lastName,
      email: profileData.user?.email,
      idNumber: profileData.idNumber,
      registrationNumber: profileData.registrationNumber,
      studentNumber: profileData.studentNumber,
      programName: profileData.program?.name || 'Not specified',
      programCode: profileData.program?.code || 'N/A',
      departmentName: profileData.department?.name || 'Not specified',
      createdAt: profileData.user?.createdAt.toISOString(),
      passportPhotoUrl: profileData.passportPhotoUrl || '/default-avatar.jpg',
      idPhotoUrl: profileData.idPhotoUrl,
      certificateUrl: profileData.certificateUrl
    };
  } catch (error) {
    console.error('[GET_STUDENT_PROFILE_ERROR]', error);
    throw new Error(
      error instanceof Error 
        ? error.message 
        : 'Failed to fetch profile data'
    );
  }
}

export type ProfileState = {
  success?: string;
  error?: string;
  fieldErrors?: {
    firstName?: string[];
    lastName?: string[];
    idNumber?: string[];
  };
};

export async function updateStudentProfile(
  prevState: ProfileState | null,
  formData: FormData
): Promise<ProfileState> {
  try {
    const authUser = await getAuthUser();
    if (!authUser || !authUser.userId) {
      return { error: 'Unauthorized: You must be logged in.' };
    }

    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    const idNumber = formData.get('idNumber') as string;

    // Basic validation
    const fieldErrors: ProfileState['fieldErrors'] = {};
    
    if (!firstName.trim()) {
      fieldErrors.firstName = ['First name is required'];
    }

    if (!lastName.trim()) {
      fieldErrors.lastName = ['Last name is required'];
    }

    if (idNumber && !idNumber.trim()) {
      fieldErrors.idNumber = ['ID number cannot be empty if provided'];
    }

    if (Object.keys(fieldErrors).length > 0) {
      return { 
        error: 'Invalid input',
        fieldErrors
      };
    }

    await db.update(students)
      .set({ 
        firstName, 
        lastName, 
        idNumber: idNumber.trim() || null 
      })
      .where(eq(students.userId, authUser.userId));

    return { success: 'Profile updated successfully' };
  } catch (error) {
    console.error('[UPDATE_STUDENT_PROFILE_ERROR]', error);
    return { 
      error: error instanceof Error 
        ? error.message 
        : 'Failed to update profile'
    };
  }
}

export type PasswordState = {
  success?: string;
  error?: string;
  fieldErrors?: {
    currentPassword?: string[];
    newPassword?: string[];
    confirmPassword?: string[];
  };
};

export async function updateStudentPassword(
  prevState: PasswordState | null,
  formData: FormData
): Promise<PasswordState> {
  try {
    const authUser = await getAuthUser();
    if (!authUser || !authUser.userId) {
      return { error: 'Unauthorized: You must be logged in.' };
    }

    const currentPassword = formData.get('currentPassword') as string;
    const newPassword = formData.get('newPassword') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    // Validation
    const fieldErrors: PasswordState['fieldErrors'] = {};
    
    if (!currentPassword.trim()) {
      fieldErrors.currentPassword = ['Current password is required'];
    }

    if (!newPassword.trim()) {
      fieldErrors.newPassword = ['New password is required'];
    } else if (newPassword.length < 6) {
      fieldErrors.newPassword = ['Password must be at least 6 characters long'];
    }

    if (!confirmPassword.trim()) {
      fieldErrors.confirmPassword = ['Please confirm your new password'];
    } else if (newPassword !== confirmPassword) {
      fieldErrors.confirmPassword = ['Passwords do not match'];
    }

    if (Object.keys(fieldErrors).length > 0) {
      return { 
        error: 'Invalid input',
        fieldErrors
      };
    }

    // Get current user with password hash
    const user = await db.query.users.findFirst({
      where: eq(users.id, authUser.userId),
      columns: {
        id: true,
        passwordHash: true
      }
    });

    if (!user || !user.passwordHash) {
      return { error: 'User not found' };
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isCurrentPasswordValid) {
      return { 
        error: 'Invalid current password',
        fieldErrors: { currentPassword: ['Current password is incorrect'] }
      };
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password in database
    await db.update(users)
      .set({ 
        passwordHash: hashedPassword,
        updatedAt: new Date()
      })
      .where(eq(users.id, authUser.userId));

    return { success: 'Password updated successfully' };
  } catch (error) {
    console.error('[UPDATE_STUDENT_PASSWORD_ERROR]', error);
    return { 
      error: error instanceof Error 
        ? error.message 
        : 'Failed to update password'
    };
  }
}