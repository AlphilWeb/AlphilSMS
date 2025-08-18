'use server';

import { db } from '@/lib/db/index';
import { students } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getAuthUser } from '@/lib/auth';

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

    // Basic validation
    if (!firstName.trim()) {
      return { 
        error: 'Invalid input',
        fieldErrors: { firstName: ['First name is required'] }
      };
    }

    if (!lastName.trim()) {
      return { 
        error: 'Invalid input',
        fieldErrors: { lastName: ['Last name is required'] }
      };
    }

    await db.update(students)
      .set({ firstName, lastName })
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