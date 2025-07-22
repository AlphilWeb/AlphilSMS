'use server';

import { db } from '@/lib/db/index';
import { staff, users, departments } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getAuthUser } from '@/lib/auth';

export async function getLecturerProfile() {
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
            createdAt: true
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
      email: profileData.user.email,
      position: profileData.position,
      departmentName: profileData.department?.name || 'Not specified',
      createdAt: profileData.user.createdAt.toISOString(),
      employmentDocumentsUrl: profileData.employmentDocumentsUrl,
      nationalIdPhotoUrl: profileData.nationalIdPhotoUrl || '/default-avatar.jpg',
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

export type LecturerProfileState = {
  success?: string;
  error?: string;
  fieldErrors?: {
    firstName?: string[];
    lastName?: string[];
    position?: string[];
  };
};

export async function updateLecturerProfile(
  prevState: LecturerProfileState | null,
  formData: FormData
): Promise<LecturerProfileState> {
  try {
    const authUser = await getAuthUser();
    if (!authUser || !authUser.userId) {
      return { error: 'Unauthorized: You must be logged in.' };
    }

    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    const position = formData.get('position') as string;

    // Basic validation
    const fieldErrors: LecturerProfileState['fieldErrors'] = {};
    
    if (!firstName.trim()) {
      fieldErrors.firstName = ['First name is required'];
    }

    if (!lastName.trim()) {
      fieldErrors.lastName = ['Last name is required'];
    }

    if (!position.trim()) {
      fieldErrors.position = ['Position is required'];
    }

    if (Object.keys(fieldErrors).length > 0) {
      return { 
        error: 'Invalid input',
        fieldErrors
      };
    }

    await db.update(staff)
      .set({ 
        firstName, 
        lastName,
        position
      })
      .where(eq(staff.userId, authUser.userId));

    return { success: 'Profile updated successfully' };
  } catch (error) {
    console.error('[UPDATE_LECTURER_PROFILE_ERROR]', error);
    return { 
      error: error instanceof Error 
        ? error.message 
        : 'Failed to update profile'
    };
  }
}

export async function updateLecturerDocuments(
  prevState: { success?: string; error?: string },
  formData: FormData
) {
  try {
    const authUser = await getAuthUser();
    if (!authUser || !authUser.userId) {
      return { error: 'Unauthorized: You must be logged in.' };
    }

    const passportPhotoUrl = formData.get('passportPhotoUrl') as string;
    const nationalIdPhotoUrl = formData.get('nationalIdPhotoUrl') as string;
    const academicCertificatesUrl = formData.get('academicCertificatesUrl') as string;
    const employmentDocumentsUrl = formData.get('employmentDocumentsUrl') as string;

    await db.update(staff)
      .set({ 
        passportPhotoUrl,
        nationalIdPhotoUrl,
        academicCertificatesUrl,
        employmentDocumentsUrl
      })
      .where(eq(staff.userId, authUser.userId));

    return { success: 'Documents updated successfully' };
  } catch (error) {
    console.error('[UPDATE_LECTURER_DOCUMENTS_ERROR]', error);
    return { 
      error: error instanceof Error 
        ? error.message 
        : 'Failed to update documents'
    };
  }
}