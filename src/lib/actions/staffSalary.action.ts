// In: src/lib/actions/staffSalary.actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db/index';
import { staffSalaries, NewStaffSalary, staff, users } from '@/lib/db/schema';
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
  ACCOUNTANT: 'Accountant', // Consistent with your schema's ROLES definition
  LECTURER: 'Lecturer',
  STAFF: 'Staff',
  STUDENT: 'Student',
};

function allowedRolesForManagingStaffSalaries() {
  return [ROLES.ADMIN, ROLES.ACCOUNTANT];
}

function allowedRolesForViewingStaffSalaries() {
  return [ROLES.ADMIN, ROLES.ACCOUNTANT, ROLES.STAFF]; // Staff can view their own salaries
}

/**
 * Creates a new staff salary record.
 */
export async function createStaffSalary(formData: FormData) {
  try {
    const authUser = await getAuthUser();
    if (!authUser || !checkPermission(authUser, allowedRolesForManagingStaffSalaries())) {
      return { error: 'Unauthorized: You do not have permission to create staff salary records.' };
    }

    const staffId = formData.get('staffId') ? Number(formData.get('staffId')) : null;
    const amount = formData.get('amount') as string;
    const paymentDate = formData.get('paymentDate') as string;
    const description = formData.get('description') as string | null;
    const status = formData.get('status') as string;

    if (!staffId || !amount || !paymentDate || !status) {
      return { error: 'Missing required fields for staff salary creation.' };
    }

    const newStaffSalary: NewStaffSalary = {
      staffId,
      amount,
      paymentDate,
      description: description || undefined,
      status,
    };

    await db.insert(staffSalaries).values(newStaffSalary);

    revalidatePath('/dashboard/finance/staff-salaries');
    revalidatePath(`/dashboard/staff/${staffId}`); // Revalidate staff member's finance section
    return { success: 'Staff salary record created successfully.' };

  } catch (err: unknown) {
  const error = err instanceof Error ? err : new Error(String(err));
  console.error('[ERROR_CONTEXT]', error);
  throw new ActionError(error.message);
}
}

/**
 * Updates an existing staff salary record.
 */
export async function updateStaffSalary(staffSalaryId: number, formData: FormData) {
  try {
    const authUser = await getAuthUser();
    if (!authUser || !checkPermission(authUser, allowedRolesForManagingStaffSalaries())) {
      return { error: 'Unauthorized: You do not have permission to update staff salary records.' };
    }

    const staffId = formData.get('staffId') ? Number(formData.get('staffId')) : null;
    const amount = formData.get('amount') as string | null;
    const paymentDate = formData.get('paymentDate') as string | null;
    const description = formData.get('description') as string | null;
    const status = formData.get('status') as string | null;

    const updates: Partial<NewStaffSalary> = {};
    if (staffId !== null) updates.staffId = staffId;
    if (amount !== null) updates.amount = amount;
    if (paymentDate !== null) updates.paymentDate = paymentDate;
    if (description !== null) updates.description = description;
    if (status !== null) updates.status = status;

    if (Object.keys(updates).length === 0) {
      return { error: 'No fields to update.' };
    }

    await db.update(staffSalaries).set(updates).where(eq(staffSalaries.id, staffSalaryId));

    revalidatePath('/dashboard/finance/staff-salaries');
    revalidatePath(`/dashboard/finance/staff-salaries/${staffSalaryId}`);
    if (staffId) revalidatePath(`/dashboard/staff/${staffId}`);
    return { success: 'Staff salary record updated successfully.' };

  } catch (err: unknown) {
  const error = err instanceof Error ? err : new Error(String(err));
  console.error('[ERROR_CONTEXT]', error);
  throw new ActionError(error.message);
}
}

/**
 * Deletes a staff salary record.
 */
export async function deleteStaffSalary(staffSalaryId: number) {
  try {
    const authUser = await getAuthUser();
    if (!authUser || !checkPermission(authUser, allowedRolesForManagingStaffSalaries())) {
      return { error: 'Unauthorized: You do not have permission to delete staff salary records.' };
    }

    await db.delete(staffSalaries).where(eq(staffSalaries.id, staffSalaryId));

    revalidatePath('/dashboard/finance/staff-salaries');
    return { success: 'Staff salary record deleted successfully.' };

  } catch (err: unknown) {
  const error = err instanceof Error ? err : new Error(String(err));
  console.error('[ERROR_CONTEXT]', error);
  throw new ActionError(error.message);
}
}

/**
 * Fetches all staff salary records with associated staff and user details.
 */
export async function getStaffSalaries() {
  try {
    const authUser = await getAuthUser();
    if (!checkPermission(authUser, allowedRolesForViewingStaffSalaries())) {
      throw new ActionError('Unauthorized: You do not have permission to view staff salary records.');
    }

    const result = await db
      .select({
        id: staffSalaries.id,
        staffId: staffSalaries.staffId,
        amount: staffSalaries.amount,
        paymentDate: staffSalaries.paymentDate,
        description: staffSalaries.description,
        status: staffSalaries.status,
        staffFirstName: staff.firstName,
        staffLastName: staff.lastName,
        staffEmail: staff.email,
        staffPosition: staff.position,
        userEmail: users.email, // User's email linked to staff record
      })
      .from(staffSalaries)
      .leftJoin(staff, eq(staffSalaries.staffId, staff.id))
      .leftJoin(users, eq(staff.userId, users.id));

    const staffSalariesList = result.map(s => ({
      id: s.id,
      staffId: s.staffId,
      amount: s.amount,
      paymentDate: s.paymentDate,
      description: s.description || null,
      status: s.status,
      staffFullName: (s.staffFirstName && s.staffLastName) ? `${s.staffFirstName} ${s.staffLastName}` : null,
      staffEmail: s.staffEmail || null,
      staffPosition: s.staffPosition || null,
      userEmail: s.userEmail || null,
    }));

    return staffSalariesList;
  } catch (err: unknown) {
  const error = err instanceof Error ? err : new Error(String(err));
  console.error('[ERROR_CONTEXT]', error);
  throw new ActionError(error.message);
}
}

/**
 * Fetches a single staff salary record by ID with associated staff and user details.
 */
export async function getStaffSalaryById(id: number) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return { error: 'Unauthorized: You must be logged in.' };
    }

    const result = await db
      .select({
        id: staffSalaries.id,
        staffId: staffSalaries.staffId,
        amount: staffSalaries.amount,
        paymentDate: staffSalaries.paymentDate,
        description: staffSalaries.description,
        status: staffSalaries.status,
        staffUserId: staff.userId, // Needed for permission check
        staffFirstName: staff.firstName,
        staffLastName: staff.lastName,
        staffEmail: staff.email,
        staffPosition: staff.position,
        userEmail: users.email,
      })
      .from(staffSalaries)
      .leftJoin(staff, eq(staffSalaries.staffId, staff.id))
      .leftJoin(users, eq(staff.userId, users.id))
      .where(eq(staffSalaries.id, id));

    const staffSalaryRecord = result[0];

    if (!staffSalaryRecord) {
      return { error: 'Staff salary record not found.' };
    }

    // Check if authorized as Admin, Accountant, or if it's the staff member's own salary.
    if (!checkPermission(authUser, allowedRolesForViewingStaffSalaries()) && authUser.userId !== staffSalaryRecord.staffUserId) {
      return { error: 'Unauthorized: You do not have permission to view this staff salary record.' };
    }

    return {
      id: staffSalaryRecord.id,
      staffId: staffSalaryRecord.staffId,
      amount: staffSalaryRecord.amount,
      paymentDate: staffSalaryRecord.paymentDate,
      description: staffSalaryRecord.description || null,
      status: staffSalaryRecord.status,
      staffFullName: (staffSalaryRecord.staffFirstName && staffSalaryRecord.staffLastName) ? `${staffSalaryRecord.staffFirstName} ${staffSalaryRecord.staffLastName}` : null,
      staffEmail: staffSalaryRecord.staffEmail || null,
      staffPosition: staffSalaryRecord.staffPosition || null,
      userEmail: staffSalaryRecord.userEmail || null,
    };

  } catch (err: unknown) {
  const error = err instanceof Error ? err : new Error(String(err));
  console.error('[ERROR_CONTEXT]', error);
  throw new ActionError(error.message);
}
}

/**
 * Fetches staff salary records for a specific staff member.
 */
export async function getStaffSalariesByStaffId(staffId: number) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return { error: 'Unauthorized: You must be logged in.' };
    }

    const staffRecord = await db.query.staff.findFirst({
      where: eq(staff.id, staffId),
      columns: { userId: true, firstName: true, lastName: true, email: true, position: true } // Fetch necessary staff details
    });

    if (!staffRecord) {
      return { error: 'Staff member not found.' };
    }

    // Check if authorized as Admin, Accountant, or if it's the staff member's own salaries.
    if (!checkPermission(authUser, allowedRolesForViewingStaffSalaries()) && authUser.userId !== staffRecord.userId) {
      return { error: 'Unauthorized: You do not have permission to view this staff member\'s salaries.' };
    }

    const result = await db
      .select({
        id: staffSalaries.id,
        staffId: staffSalaries.staffId,
        amount: staffSalaries.amount,
        paymentDate: staffSalaries.paymentDate,
        description: staffSalaries.description,
        status: staffSalaries.status,
      })
      .from(staffSalaries)
      .where(eq(staffSalaries.staffId, staffId));

    const staffMemberSalaries = result.map(s => ({
      id: s.id,
      staffId: s.staffId,
      amount: s.amount,
      paymentDate: s.paymentDate,
      description: s.description || null,
      status: s.status,
      // Staff details are from staffRecord, not from each salary entry
      staffFullName: (staffRecord.firstName && staffRecord.lastName) ? `${staffRecord.firstName} ${staffRecord.lastName}` : null,
      staffEmail: staffRecord.email || null,
      staffPosition: staffRecord.position || null,
    }));

    return staffMemberSalaries;

  } catch (err: unknown) {
  const error = err instanceof Error ? err : new Error(String(err));
  console.error('[ERROR_CONTEXT]', error);
  throw new ActionError(error.message);
}
}