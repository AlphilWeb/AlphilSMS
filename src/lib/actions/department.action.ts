// In: src/lib/actions/department.actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db/index';
import { departments, NewDepartment, staff, users } from '@/lib/db/schema'; // Added 'staff' and 'users' for joins
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

function allowedRolesForManagingDepartments() {
  return [ROLES.ADMIN, ROLES.REGISTRAR];
}

function allowedRolesForViewingDepartments() {
  return [ROLES.ADMIN, ROLES.REGISTRAR, ROLES.HOD, ROLES.LECTURER, ROLES.STAFF, ROLES.STUDENT, ROLES.ACCOUNTANT];
}

/**
 * Creates a new department.
 * Permissions: Admin, Registrar
 */
export async function createDepartment(formData: FormData) {
  try {
    const authUser = await getAuthUser();
    if (!authUser || !checkPermission(authUser, allowedRolesForManagingDepartments())) {
      return { error: 'Unauthorized: You do not have permission to create departments.' };
    }

    const name = formData.get('name') as string;
    const headOfDepartmentId = formData.get('headOfDepartmentId') ? Number(formData.get('headOfDepartmentId')) : null;

    if (!name) {
      return { error: 'Department name is required.' };
    }

    // Check for existing department with the same name
    const existingDepartment = await db.query.departments.findFirst({
      where: eq(departments.name, name),
    });

    if (existingDepartment) {
      return { error: 'Department with this name already exists.' };
    }

    // Optional: Validate if headOfDepartmentId refers to an actual staff member
    if (headOfDepartmentId !== null) {
        const hodExists = await db.query.staff.findFirst({ where: eq(staff.id, headOfDepartmentId) });
        if (!hodExists) {
            return { error: 'Invalid Head of Department ID provided.' };
        }
    }

    const newDepartment: NewDepartment = {
      name,
      headOfDepartmentId: headOfDepartmentId || undefined,
    };

    const [createdDepartment] = await db.insert(departments).values(newDepartment).returning();

    revalidatePath('/dashboard/departments');
    return { success: 'Department created successfully.', data: createdDepartment };

  } catch (err: unknown) {
  const error = err instanceof Error ? err : new Error(String(err));
  console.error('[ERROR_CONTEXT]', error);
  throw new ActionError(error.message);
}
}

/**
 * Updates an existing department.
 * Permissions: Admin, Registrar, Department Head (for their own department)
 */
export async function updateDepartment(departmentId: number, formData: FormData) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return { error: 'Unauthorized: You must be logged in.' };
    }

    // Fetch the department record to check HOD's permission
    const departmentRecord = await db.query.departments.findFirst({
        where: eq(departments.id, departmentId),
        columns: { headOfDepartmentId: true }
    });

    if (!departmentRecord) {
        return { error: 'Department not found.' };
    }

    // Get the staff record for the current HOD to check their userId
    let currentHodUserId: number | null = null;
    if (departmentRecord.headOfDepartmentId) {
        const currentHodStaff = await db.query.staff.findFirst({
            where: eq(staff.id, departmentRecord.headOfDepartmentId),
            columns: { userId: true }
        });
        currentHodUserId = currentHodStaff?.userId || null;
    }

    // Authorization Logic:
    // 1. Admin/Registrar can update any department.
    // 2. A Department Head (HOD) can update their *own* assigned department's name.
    //    HODs cannot change the headOfDepartmentId or update other departments.
    const isAuthorizedAsAdminOrRegistrar = checkPermission(authUser, allowedRolesForManagingDepartments());
    const isAuthorizedAsHODForOwnDepartment =
        authUser.role === ROLES.HOD && authUser.userId === currentHodUserId;

    if (!isAuthorizedAsAdminOrRegistrar && !isAuthorizedAsHODForOwnDepartment) {
      return { error: 'Unauthorized: You do not have permission to update this department.' };
    }

    const name = formData.get('name') as string | null;
    const headOfDepartmentId = formData.get('headOfDepartmentId') ? Number(formData.get('headOfDepartmentId')) : null;

    const updates: Partial<NewDepartment> = {};
    if (name) updates.name = name;

    // Only Admin/Registrar can update headOfDepartmentId
    if (headOfDepartmentId !== null) {
      if (!isAuthorizedAsAdminOrRegistrar) {
        return { error: 'Unauthorized: Only Admin or Registrar can change Head of Department.' };
      }
      // Optional: Validate if headOfDepartmentId refers to an actual staff member
      const hodExists = await db.query.staff.findFirst({ where: eq(staff.id, headOfDepartmentId) });
      if (!hodExists) {
          return { error: 'Invalid Head of Department ID provided.' };
      }
      updates.headOfDepartmentId = headOfDepartmentId;
    }


    if (Object.keys(updates).length === 0) {
      return { error: 'No fields to update.' };
    }

    const [updatedDepartment] = await db.update(departments).set(updates).where(eq(departments.id, departmentId)).returning();

    revalidatePath('/dashboard/departments');
    revalidatePath(`/dashboard/departments/${departmentId}`);
    // If HOD changed, revalidate old HOD's staff page and new HOD's staff page
    if (headOfDepartmentId && departmentRecord.headOfDepartmentId !== headOfDepartmentId) {
        revalidatePath(`/dashboard/staff/${departmentRecord.headOfDepartmentId}`); // Old HOD
        revalidatePath(`/dashboard/staff/${headOfDepartmentId}`); // New HOD
    }
    return { success: 'Department updated successfully.', data: updatedDepartment };

  } catch (err: unknown) {
  const error = err instanceof Error ? err : new Error(String(err));
  console.error('[ERROR_CONTEXT]', error);
  throw new ActionError(error.message);
}
}

/**
 * Deletes a department.
 * Permissions: Admin, Registrar
 */
export async function deleteDepartment(departmentId: number) {
  try {
    const authUser = await getAuthUser();
    if (!authUser || !checkPermission(authUser, allowedRolesForManagingDepartments())) {
      return { error: 'Unauthorized: You do not have permission to delete departments.' };
    }

    // Fetch department to get associated HOD ID for revalidation
    const departmentToDelete = await db.query.departments.findFirst({
        where: eq(departments.id, departmentId),
        columns: { headOfDepartmentId: true }
    });

    if (!departmentToDelete) {
        return { error: 'Department not found.' };
    }

    const [deletedDepartment] = await db.delete(departments).where(eq(departments.id, departmentId)).returning();

    revalidatePath('/dashboard/departments');
    if (departmentToDelete.headOfDepartmentId) {
        revalidatePath(`/dashboard/staff/${departmentToDelete.headOfDepartmentId}`); // Revalidate old HOD's page
    }
    return { success: 'Department deleted successfully.', data: deletedDepartment };

  } catch (err: unknown) {
  const error = err instanceof Error ? err : new Error(String(err));
  console.error('[ERROR_CONTEXT]', error);
  throw new ActionError(error.message);
}
}

/**
 * Fetches all departments with associated Head of Department (HOD) details.
 * Permissions: All academic and administrative roles.
 */
export async function getDepartments() {
  try {
    const authUser = await getAuthUser();
    if (!checkPermission(authUser, allowedRolesForViewingDepartments())) {
      throw new ActionError('Unauthorized: You do not have permission to view departments.');
    }

    const result = await db
      .select({
        id: departments.id,
        name: departments.name,
        headOfDepartmentId: departments.headOfDepartmentId,
        hodFirstName: staff.firstName,
        hodLastName: staff.lastName,
        hodEmail: users.email, // Assuming staff.userId links to users.id
      })
      .from(departments)
      .leftJoin(staff, eq(departments.headOfDepartmentId, staff.id))
      .leftJoin(users, eq(staff.userId, users.id)); // Join to get HOD's user email

    const allDepartments = result.map(d => ({
      id: d.id,
      name: d.name,
      headOfDepartmentId: d.headOfDepartmentId || null,
      hodFullName: (d.hodFirstName && d.hodLastName) ? `${d.hodFirstName} ${d.hodLastName}` : null,
      hodEmail: d.hodEmail || null,
    }));

    return allDepartments;
  } catch (err: unknown) {
  const error = err instanceof Error ? err : new Error(String(err));
  console.error('[ERROR_CONTEXT]', error);
  throw new ActionError(error.message);
}
}

/**
 * Fetches a single department by ID with associated Head of Department (HOD) details.
 * Permissions: All academic and administrative roles.
 */
export async function getDepartmentById(id: number) {
  try {
    const authUser = await getAuthUser();
    if (!checkPermission(authUser, allowedRolesForViewingDepartments())) {
      return { error: 'Unauthorized: You do not have permission to view this department.' };
    }

    const result = await db
      .select({
        id: departments.id,
        name: departments.name,
        headOfDepartmentId: departments.headOfDepartmentId,
        hodFirstName: staff.firstName,
        hodLastName: staff.lastName,
        hodEmail: users.email,
      })
      .from(departments)
      .leftJoin(staff, eq(departments.headOfDepartmentId, staff.id))
      .leftJoin(users, eq(staff.userId, users.id))
      .where(eq(departments.id, id))
      .limit(1);

    const department = result[0];

    if (!department) {
      return { error: 'Department not found.' };
    }

    return {
      id: department.id,
      name: department.name,
      headOfDepartmentId: department.headOfDepartmentId || null,
      hodFullName: (department.hodFirstName && department.hodLastName) ? `${department.hodFirstName} ${department.hodLastName}` : null,
      hodEmail: department.hodEmail || null,
    };

  } catch (err: unknown) {
  const error = err instanceof Error ? err : new Error(String(err));
  console.error('[ERROR_CONTEXT]', error);
  throw new ActionError(error.message);
}
}