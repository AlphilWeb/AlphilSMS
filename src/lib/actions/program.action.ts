// In: src/lib/actions/program.actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db/index';
import { programs, NewProgram, departments } from '@/lib/db/schema'; // Import departments for joins
import { eq, or } from 'drizzle-orm'; // Import 'or' for combined unique checks
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

// function allowedRolesForManagingPrograms() {
//   return [ROLES.ADMIN, ROLES.REGISTRAR, ROLES.HOD];
// }

function allowedRolesForViewingPrograms() {
  // All users might need to see programs
  return [ROLES.ADMIN, ROLES.REGISTRAR, ROLES.HOD, ROLES.LECTURER, ROLES.STUDENT, ROLES.ACCOUNTANT, ROLES.STAFF];
}

/**
 * Creates a new program.
 */
export async function createProgram(formData: FormData) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return { error: 'Unauthorized: You must be logged in.' };
    }

    const departmentId = formData.get('departmentId') ? Number(formData.get('departmentId')) : null;
    const name = formData.get('name') as string;
    const code = formData.get('code') as string;
    const durationSemesters = formData.get('durationSemesters') ? Number(formData.get('durationSemesters')) : null;

    if (!departmentId || !name || !code || !durationSemesters) {
      return { error: 'Missing required fields for program creation.' };
    }

    // HOD specific permission check: can only create programs in their department
    if (checkPermission(authUser, [ROLES.HOD]) && authUser.departmentId !== departmentId) {
      return { error: 'Unauthorized: HOD can only create programs within their own department.' };
    } else if (!checkPermission(authUser, [ROLES.ADMIN, ROLES.REGISTRAR])) {
      // If not HOD, then must be Admin or Registrar
      return { error: 'Unauthorized: You do not have permission to create programs.' };
    }

    // Check for existing program with the same name or code
    const existingProgram = await db.query.programs.findFirst({
      where: or(
        eq(programs.name, name),
        eq(programs.code, code)
      ),
    });

    if (existingProgram) {
      return { error: 'Program with this name or code already exists.' };
    }

    const newProgram: NewProgram = {
      departmentId,
      name,
      code,
      durationSemesters,
    };

    await db.insert(programs).values(newProgram);

    revalidatePath('/dashboard/programs');
    revalidatePath(`/dashboard/departments/${departmentId}`); // Revalidate department page
    return { success: 'Program created successfully.' };

  } catch (err: unknown) {
  const error = err instanceof Error ? err : new Error(String(err));
  console.error('[ERROR_CONTEXT]', error);
  throw new ActionError(error.message);
}
}

/**
 * Updates an existing program.
 */
export async function updateProgram(programId: number, formData: FormData) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return { error: 'Unauthorized: You must be logged in.' };
    }

    // Fetch the program record to check department for HOD
    const programRecord = await db.query.programs.findFirst({
      where: eq(programs.id, programId),
      columns: { departmentId: true }
    });

    if (!programRecord) {
      return { error: 'Program not found.' };
    }

    // Authorization Logic:
    // 1. Admin/Registrar can update any program.
    // 2. A Department Head (HOD) can update programs *within their department*.
    const isAuthorized =
      checkPermission(authUser, [ROLES.ADMIN, ROLES.REGISTRAR]) ||
      (checkPermission(authUser, [ROLES.HOD]) && authUser.departmentId === programRecord.departmentId);

    if (!isAuthorized) {
      return { error: 'Unauthorized: You do not have permission to update this program.' };
    }

    const departmentId = formData.get('departmentId') ? Number(formData.get('departmentId')) : null;
    const name = formData.get('name') as string | null;
    const code = formData.get('code') as string | null;
    const durationSemesters = formData.get('durationSemesters') ? Number(formData.get('durationSemesters')) : null;

    const updates: Partial<NewProgram> = {};
    // Only allow departmentId update if Admin/Registrar. HOD cannot change department.
    if (departmentId !== null && checkPermission(authUser, [ROLES.ADMIN, ROLES.REGISTRAR])) {
      updates.departmentId = departmentId;
    } else if (departmentId !== null && authUser.departmentId !== departmentId) {
      // If HOD tries to change departmentId to something other than their own
      return { error: 'Unauthorized: HOD cannot change a program\'s department.' };
    }

    if (name) updates.name = name;
    if (code) updates.code = code;
    if (durationSemesters !== null) updates.durationSemesters = durationSemesters;

    if (Object.keys(updates).length === 0) {
      return { error: 'No fields to update.' };
    }

    await db.update(programs).set(updates).where(eq(programs.id, programId));

    revalidatePath('/dashboard/programs');
    revalidatePath(`/dashboard/programs/${programId}`);
    if (departmentId) revalidatePath(`/dashboard/departments/${departmentId}`); // Revalidate old and new department pages
    if (programRecord.departmentId && programRecord.departmentId !== departmentId) {
        revalidatePath(`/dashboard/departments/${programRecord.departmentId}`);
    }
    return { success: 'Program updated successfully.' };

  } catch (err: unknown) {
  const error = err instanceof Error ? err : new Error(String(err));
  console.error('[ERROR_CONTEXT]', error);
  throw new ActionError(error.message);
}
}

/**
 * Deletes a program.
 */
export async function deleteProgram(programId: number) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return { error: 'Unauthorized: You must be logged in.' };
    }

    // Fetch the program record to check department for HOD
    const programRecord = await db.query.programs.findFirst({
      where: eq(programs.id, programId),
      columns: { departmentId: true }
    });

    if (!programRecord) {
      return { error: 'Program not found.' };
    }

    // Authorization Logic:
    // 1. Admin/Registrar can delete any program.
    // 2. A Department Head (HOD) can delete programs *within their department*.
    const isAuthorized =
      checkPermission(authUser, [ROLES.ADMIN, ROLES.REGISTRAR]) ||
      (checkPermission(authUser, [ROLES.HOD]) && authUser.departmentId === programRecord.departmentId);

    if (!isAuthorized) {
      return { error: 'Unauthorized: You do not have permission to delete this program.' };
    }

    await db.delete(programs).where(eq(programs.id, programId));

    revalidatePath('/dashboard/programs');
    revalidatePath(`/dashboard/departments/${programRecord.departmentId}`); // Revalidate department page
    return { success: 'Program deleted successfully.' };

  } catch (err: unknown) {
  const error = err instanceof Error ? err : new Error(String(err));
  console.error('[ERROR_CONTEXT]', error);
  throw new ActionError(error.message);
}
}

/**
 * Fetches all programs with their associated department information.
 */
export async function getPrograms() {
  try {
    const authUser = await getAuthUser();
    if (!checkPermission(authUser, allowedRolesForViewingPrograms())) {
      throw new ActionError('Unauthorized: You do not have permission to view programs.');
    }

    const result = await db
      .select({
        id: programs.id,
        departmentId: programs.departmentId,
        name: programs.name,
        code: programs.code,
        durationSemesters: programs.durationSemesters,
        departmentName: departments.name, // Include department name
      })
      .from(programs)
      .leftJoin(departments, eq(programs.departmentId, departments.id));

    const allPrograms = result.map(p => ({
      id: p.id,
      departmentId: p.departmentId,
      name: p.name,
      code: p.code,
      durationSemesters: p.durationSemesters,
      departmentName: p.departmentName || null, // Ensure string | null type
    }));

    return allPrograms;
  } catch (err: unknown) {
  const error = err instanceof Error ? err : new Error(String(err));
  console.error('[ERROR_CONTEXT]', error);
  throw new ActionError(error.message);
}
}

/**
 * Fetches a single program by ID with its associated department information.
 */
export async function getProgramById(id: number) {
  try {
    const authUser = await getAuthUser();
    if (!checkPermission(authUser, allowedRolesForViewingPrograms())) {
      return { error: 'Unauthorized: You do not have permission to view this program.' };
    }

    const result = await db
      .select({
        id: programs.id,
        departmentId: programs.departmentId,
        name: programs.name,
        code: programs.code,
        durationSemesters: programs.durationSemesters,
        departmentName: departments.name, // Include department name
      })
      .from(programs)
      .leftJoin(departments, eq(programs.departmentId, departments.id))
      .where(eq(programs.id, id));

    const program = result[0];

    if (!program) {
      return { error: 'Program not found.' };
    }

    return {
      id: program.id,
      departmentId: program.departmentId,
      name: program.name,
      code: program.code,
      durationSemesters: program.durationSemesters,
      departmentName: program.departmentName || null,
    };

  } catch (err: unknown) {
  const error = err instanceof Error ? err : new Error(String(err));
  console.error('[ERROR_CONTEXT]', error);
  throw new ActionError(error.message);
}
}