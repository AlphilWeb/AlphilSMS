// In: src/lib/actions/semester.actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db/index';
import { semesters, NewSemester } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getAuthUser } from '@/lib/auth';
import { checkPermission } from '@/lib/rbac';

class ActionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ActionError';
  }
}

const ROLES = {
  ADMIN: 'Admin',
  REGISTRAR: 'Registrar',
  HOD: 'HOD',
  ACCOUNTANT: 'Accountant',
  LECTURER: 'Lecturer',
  STAFF: 'Staff',
  STUDENT: 'Student',
};

function allowedRolesForManagingSemesters() {
  return [ROLES.ADMIN, ROLES.REGISTRAR];
}

function allowedRolesForViewingSemesters() {
  // Semesters are fundamental for everyone, so all roles can view.
  return [ROLES.ADMIN, ROLES.REGISTRAR, ROLES.HOD, ROLES.ACCOUNTANT, ROLES.LECTURER, ROLES.STAFF, ROLES.STUDENT];
}

/**
 * Creates a new semester.
 */
export async function createSemester(formData: FormData) {
  try {
    const authUser = await getAuthUser();
    if (!authUser || !checkPermission(authUser, allowedRolesForManagingSemesters())) {
      return { error: 'Unauthorized: You do not have permission to create semesters.' };
    }

    const name = formData.get('name') as string;
    const startDate = formData.get('startDate') as string;
    const endDate = formData.get('endDate') as string;

    if (!name || !startDate || !endDate) {
      return { error: 'Missing required fields for semester creation.' };
    }

    // Optional: Add validation for date format (e.g., YYYY-MM-DD) and startDate < endDate
    if (new Date(startDate) >= new Date(endDate)) {
        return { error: 'Start date must be before end date.' };
    }

    // Check for existing semester with the same name
    const existingSemester = await db.query.semesters.findFirst({
      where: eq(semesters.name, name),
    });

    if (existingSemester) {
      return { error: 'Semester with this name already exists.' };
    }

    const newSemester: NewSemester = {
      name,
      startDate,
      endDate,
    };

    await db.insert(semesters).values(newSemester);

    revalidatePath('/dashboard/semesters');
    return { success: 'Semester created successfully.' };

  } catch (err: unknown) {
  const error = err instanceof Error ? err : new Error(String(err));
  console.error('[ERROR_CONTEXT]', error);
  throw new ActionError(error.message);
}
}

/**
 * Updates an existing semester.
 */
export async function updateSemester(semesterId: number, formData: FormData) {
  try {
    const authUser = await getAuthUser();
    if (!authUser || !checkPermission(authUser, allowedRolesForManagingSemesters())) {
      return { error: 'Unauthorized: You do not have permission to update semesters.' };
    }

    const name = formData.get('name') as string | null;
    const startDate = formData.get('startDate') as string | null;
    const endDate = formData.get('endDate') as string | null;

    const updates: Partial<NewSemester> = {};
    if (name) updates.name = name;
    if (startDate) updates.startDate = startDate;
    if (endDate) updates.endDate = endDate;

    if (Object.keys(updates).length === 0) {
      return { error: 'No fields to update.' };
    }

    // Optional: Add validation for date format and startDate < endDate if dates are being updated
    if (startDate && endDate && new Date(startDate) >= new Date(endDate)) {
        return { error: 'Start date must be before end date.' };
    }


    await db.update(semesters).set(updates).where(eq(semesters.id, semesterId));

    revalidatePath('/dashboard/semesters');
    revalidatePath(`/dashboard/semesters/${semesterId}`);
    return { success: 'Semester updated successfully.' };

  } catch (err: unknown) {
  const error = err instanceof Error ? err : new Error(String(err));
  console.error('[ERROR_CONTEXT]', error);
  throw new ActionError(error.message);
}
}

/**
 * Deletes a semester.
 */
export async function deleteSemester(semesterId: number) {
  try {
    const authUser = await getAuthUser();
    if (!authUser || !checkPermission(authUser, allowedRolesForManagingSemesters())) {
      return { error: 'Unauthorized: You do not have permission to delete semesters.' };
    }

    await db.delete(semesters).where(eq(semesters.id, semesterId));

    revalidatePath('/dashboard/semesters');
    return { success: 'Semester deleted successfully.' };

  } catch (err: unknown) {
  const error = err instanceof Error ? err : new Error(String(err));
  console.error('[ERROR_CONTEXT]', error);
  throw new ActionError(error.message);
}
}

/**
 * Fetches all semesters.
 */
export async function getSemesters() {
  try {
    const authUser = await getAuthUser();
    if (!checkPermission(authUser, allowedRolesForViewingSemesters())) {
      throw new ActionError('Unauthorized: You do not have permission to view semesters.');
    }
    // No complex joins needed here as semester table is self-contained for basic info
    const allSemesters = await db.select().from(semesters);
    return allSemesters;
  } catch (err: unknown) {
  const error = err instanceof Error ? err : new Error(String(err));
  console.error('[ERROR_CONTEXT]', error);
  throw new ActionError(error.message);
}
}

/**
 * Fetches a single semester by ID.
 */
export async function getSemesterById(id: number) {
  try {
    const authUser = await getAuthUser();
    if (!checkPermission(authUser, allowedRolesForViewingSemesters())) {
      return { error: 'Unauthorized: You do not have permission to view this semester.' };
    }
    // No complex joins needed here as semester table is self-contained for basic info
    const semester = await db.query.semesters.findFirst({
      where: eq(semesters.id, id),
    });

    if (!semester) {
        return { error: 'Semester not found.' };
    }
    return semester;
  } catch (err: unknown) {
  const error = err instanceof Error ? err : new Error(String(err));
  console.error('[ERROR_CONTEXT]', error);
  throw new ActionError(error.message);
}
}