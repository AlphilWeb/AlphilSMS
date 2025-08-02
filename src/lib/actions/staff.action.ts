// In: src/lib/actions/staff.actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db/index';
import { staff, NewStaff, users, departments } from '@/lib/db/schema'; // Import necessary schemas
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

function allowedRolesForManagingStaff() {
  return [ROLES.ADMIN, ROLES.REGISTRAR];
}

function allowedRolesForViewingStaff() {
  return [ROLES.ADMIN, ROLES.REGISTRAR, ROLES.HOD, ROLES.LECTURER, ROLES.ACCOUNTANT];
}

/**
 * Creates a new staff member.
 */
export async function createStaff(formData: FormData) {
  try {
    const authUser = await getAuthUser();
    if (!authUser || !checkPermission(authUser, allowedRolesForManagingStaff())) {
      return { error: 'Unauthorized: You do not have permission to create staff.' };
    }

    const userId = formData.get('userId') ? Number(formData.get('userId')) : null;
    const departmentId = formData.get('departmentId') ? Number(formData.get('departmentId')) : null;
    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    const email = formData.get('email') as string;
    const position = formData.get('position') as string;
    const employmentDocumentsUrl = formData.get('employmentDocumentsUrl') as string | null;
    const nationalIdPhotoUrl = formData.get('nationalIdPhotoUrl') as string | null;
    const academicCertificatesUrl = formData.get('academicCertificatesUrl') as string | null;
    const passportPhotoUrl = formData.get('passportPhotoUrl') as string | null;

    if (!userId || !departmentId || !firstName || !lastName || !email || !position) {
      return { error: 'Missing required fields for staff creation.' };
    }

    // Check for existing staff with the same user ID or email
    const existingStaff = await db.query.staff.findFirst({
      where: (s, { or, eq }) => or(
        eq(s.userId, userId),
        eq(s.email, email)
      ),
    });

    if (existingStaff) {
      return { error: 'Staff member with this user ID or email already exists.' };
    }

    const newStaff: NewStaff = {
      userId,
      departmentId,
      firstName,
      lastName,
      email,
      position,
      employmentDocumentsUrl: employmentDocumentsUrl || undefined,
      nationalIdPhotoUrl: nationalIdPhotoUrl || undefined,
      academicCertificatesUrl: academicCertificatesUrl || undefined,
      passportPhotoUrl: passportPhotoUrl || undefined,
    };

    await db.insert(staff).values(newStaff);

    revalidatePath('/dashboard/staff');
    return { success: 'Staff created successfully.' };

  } catch (err: unknown) {
  const error = err instanceof Error ? err : new Error(String(err));
  console.error('[ERROR_CONTEXT]', error);
  throw new ActionError(error.message);
}
}

/**
 * Updates an existing staff member's details.
 */
export async function updateStaff(staffId: number, formData: FormData) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return { error: 'Unauthorized: You must be logged in.' };
    }

    // Fetch the staff record to check ownership/department for HOD
    const staffRecord = await db.query.staff.findFirst({
      where: eq(staff.id, staffId),
      columns: { userId: true, departmentId: true }
    });

    if (!staffRecord) {
      return { error: 'Staff member not found.' };
    }

    // Authorization Logic:
    // 1. Admin/Registrar can update any staff.
    // 2. A Staff member can update their *own* profile (check authUser.userId against staffRecord.userId).
    // 3. A Department Head (HOD) can update staff *within their department*.
    const isAuthorized =
      checkPermission(authUser, allowedRolesForManagingStaff()) || // Admin or Registrar
      authUser.userId === staffRecord.userId || // Staff updating their own profile
      (checkPermission(authUser, [ROLES.HOD]) &&
        authUser.departmentId === staffRecord.departmentId); // HOD updating staff in their department

    if (!isAuthorized) {
      return { error: 'Unauthorized: You do not have permission to update this staff member.' };
    }

    const departmentId = formData.get('departmentId') ? Number(formData.get('departmentId')) : null;
    const firstName = formData.get('firstName') as string | null;
    const lastName = formData.get('lastName') as string | null;
    const email = formData.get('email') as string | null;
    const position = formData.get('position') as string | null;
    const employmentDocumentsUrl = formData.get('employmentDocumentsUrl') as string | null;
    const nationalIdPhotoUrl = formData.get('nationalIdPhotoUrl') as string | null;
    const academicCertificatesUrl = formData.get('academicCertificatesUrl') as string | null;
    const passportPhotoUrl = formData.get('passportPhotoUrl') as string | null;

    const updates: Partial<NewStaff> = {};
    if (departmentId !== null) updates.departmentId = departmentId;
    if (firstName) updates.firstName = firstName;
    if (lastName) updates.lastName = lastName;
    if (email) updates.email = email;
    if (position) updates.position = position;
    if (employmentDocumentsUrl !== null) updates.employmentDocumentsUrl = employmentDocumentsUrl;
    if (nationalIdPhotoUrl !== null) updates.nationalIdPhotoUrl = nationalIdPhotoUrl;
    if (academicCertificatesUrl !== null) updates.academicCertificatesUrl = academicCertificatesUrl;
    if (passportPhotoUrl !== null) updates.passportPhotoUrl = passportPhotoUrl;

    if (Object.keys(updates).length === 0) {
      return { error: 'No fields to update.' };
    }

    await db.update(staff).set(updates).where(eq(staff.id, staffId));

    revalidatePath('/dashboard/staff');
    revalidatePath(`/dashboard/staff/${staffId}`);
    return { success: 'Staff updated successfully.' };

  } catch (err: unknown) {
  const error = err instanceof Error ? err : new Error(String(err));
  console.error('[ERROR_CONTEXT]', error);
  throw new ActionError(error.message);
}
}

/**
 * Deletes a staff member.
 */
export async function deleteStaff(staffId: number) {
  try {
    const authUser = await getAuthUser();
    if (!authUser || !checkPermission(authUser, allowedRolesForManagingStaff())) {
      return { error: 'Unauthorized: You do not have permission to delete staff.' };
    }

    await db.delete(staff).where(eq(staff.id, staffId));

    revalidatePath('/dashboard/staff');
    return { success: 'Staff deleted successfully.' };

  } catch (err: unknown) {
  const error = err instanceof Error ? err : new Error(String(err));
  console.error('[ERROR_CONTEXT]', error);
  throw new ActionError(error.message);
}
}

/**
 * Fetches all staff members with their associated user and department information.
 */
export async function getStaff() {
  try {
    const authUser = await getAuthUser();
    if (!checkPermission(authUser, allowedRolesForViewingStaff())) {
      throw new ActionError('Unauthorized: You do not have permission to view staff.');
    }

    const result = await db
      .select({
        id: staff.id,
        userId: staff.userId,
        departmentId: staff.departmentId,
        firstName: staff.firstName,
        lastName: staff.lastName,
        email: staff.email,
        position: staff.position,
        employmentDocumentsUrl: staff.employmentDocumentsUrl,
        nationalIdPhotoUrl: staff.nationalIdPhotoUrl,
        academicCertificatesUrl: staff.academicCertificatesUrl,
        passportPhotoUrl: staff.passportPhotoUrl,
        userEmail: users.email, // Associated user's email
        departmentName: departments.name, // Associated department name
      })
      .from(staff)
      .leftJoin(users, eq(staff.userId, users.id))
      .leftJoin(departments, eq(staff.departmentId, departments.id));

    const staffList = result.map(s => ({
      id: s.id,
      userId: s.userId,
      departmentId: s.departmentId,
      firstName: s.firstName,
      lastName: s.lastName,
      fullName: `${s.firstName} ${s.lastName}`, // Derived full name
      email: s.email,
      position: s.position,
      employmentDocumentsUrl: s.employmentDocumentsUrl || null,
      nationalIdPhotoUrl: s.nationalIdPhotoUrl || null,
      academicCertificatesUrl: s.academicCertificatesUrl || null,
      passportPhotoUrl: s.passportPhotoUrl || null,
      userEmail: s.userEmail || null,
      departmentName: s.departmentName || null,
    }));

    return staffList;
  } catch (err: unknown) {
  const error = err instanceof Error ? err : new Error(String(err));
  console.error('[ERROR_CONTEXT]', error);
  throw new ActionError(error.message);
}
}

/**
 * Fetches a single staff member by ID with associated user and department details.
 */
export async function getStaffById(id: number) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return { error: 'Unauthorized: You must be logged in.' };
    }

    const result = await db
      .select({
        id: staff.id,
        userId: staff.userId,
        departmentId: staff.departmentId,
        firstName: staff.firstName,
        lastName: staff.lastName,
        email: staff.email,
        position: staff.position,
        employmentDocumentsUrl: staff.employmentDocumentsUrl,
        nationalIdPhotoUrl: staff.nationalIdPhotoUrl,
        academicCertificatesUrl: staff.academicCertificatesUrl,
        passportPhotoUrl: staff.passportPhotoUrl,
        userEmail: users.email,
        departmentName: departments.name,
      })
      .from(staff)
      .leftJoin(users, eq(staff.userId, users.id))
      .leftJoin(departments, eq(staff.departmentId, departments.id))
      .where(eq(staff.id, id));

    const foundStaff = result[0];

    if (!foundStaff) {
      return { error: 'Staff member not found.' };
    }

    // Authorization Logic:
    // 1. Admin/Registrar/Lecturer/Accountant/HOD can view any staff (check allowedRolesForViewingStaff()).
    // 2. A Staff member can view their *own* profile (check authUser.userId against foundStaff.userId).
    // 3. A Department Head (HOD) can view staff *within their department*.
    const isAuthorized =
      checkPermission(authUser, allowedRolesForViewingStaff()) ||
      authUser.userId === foundStaff.userId ||
      (checkPermission(authUser, [ROLES.HOD]) &&
        authUser.departmentId === foundStaff.departmentId);

    if (!isAuthorized) {
      return { error: 'Unauthorized: You do not have permission to view this staff member.' };
    }

    return {
      id: foundStaff.id,
      userId: foundStaff.userId,
      departmentId: foundStaff.departmentId,
      firstName: foundStaff.firstName,
      lastName: foundStaff.lastName,
      fullName: `${foundStaff.firstName} ${foundStaff.lastName}`,
      email: foundStaff.email,
      position: foundStaff.position,
      employmentDocumentsUrl: foundStaff.employmentDocumentsUrl || null,
      nationalIdPhotoUrl: foundStaff.nationalIdPhotoUrl || null,
      academicCertificatesUrl: foundStaff.academicCertificatesUrl || null,
      passportPhotoUrl: foundStaff.passportPhotoUrl || null,
      userEmail: foundStaff.userEmail || null,
      departmentName: foundStaff.departmentName || null,
    };

  } catch (err: unknown) {
  const error = err instanceof Error ? err : new Error(String(err));
  console.error('[ERROR_CONTEXT]', error);
  throw new ActionError(error.message);
}
}