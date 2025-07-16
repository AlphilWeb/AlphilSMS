// In: src/lib/actions/feeStructure.actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db/index';
import { feeStructures, NewFeeStructure, programs, semesters } from '@/lib/db/schema'; // Added 'programs', 'semesters' for joins
import { eq, and } from 'drizzle-orm'; // Added 'and' for combined queries
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
  ACCOUNTANT: 'Accountant', // Corresponds to 'Finance'
  LECTURER: 'Lecturer',
  STAFF: 'Staff',
  STUDENT: 'Student',
};

function allowedRolesForManagingFeeStructures() {
  return [ROLES.ADMIN, ROLES.ACCOUNTANT, ROLES.REGISTRAR];
}

function allowedRolesForViewingFeeStructures() {
  return [ROLES.ADMIN, ROLES.ACCOUNTANT, ROLES.REGISTRAR, ROLES.STUDENT];
}

/**
 * Creates a new fee structure.
 * Permissions: Admin, Accountant, Registrar
 */
export async function createFeeStructure(formData: FormData) {
  try {
    const authUser = await getAuthUser();
    if (!authUser || !checkPermission(authUser, allowedRolesForManagingFeeStructures())) {
      return { error: 'Unauthorized: You do not have permission to create fee structures.' };
    }

    const programId = formData.get('programId') ? Number(formData.get('programId')) : null;
    const semesterId = formData.get('semesterId') ? Number(formData.get('semesterId')) : null;
    const totalAmountStr = formData.get('totalAmount') as string;
    const description = formData.get('description') as string | null;

    if (!programId || !semesterId || !totalAmountStr) {
      return { error: 'Missing required fields for fee structure creation.' };
    }

    const totalAmount = parseFloat(totalAmountStr);
    if (isNaN(totalAmount) || totalAmount <= 0) {
      return { error: 'Total Amount must be a positive number.' };
    }

    // Check for existing fee structure for this program and semester
    const existingFeeStructure = await db.query.feeStructures.findFirst({
      where: and(
        eq(feeStructures.programId, programId),
        eq(feeStructures.semesterId, semesterId)
      ),
    });

    if (existingFeeStructure) {
      return { error: 'A fee structure for this program and semester already exists.' };
    }

    const newFeeStructure: NewFeeStructure = {
      programId,
      semesterId,
      totalAmount: String(totalAmount.toFixed(2)), // Store as string with 2 decimal places
      description: description || undefined,
    };

    const [createdFeeStructure] = await db.insert(feeStructures).values(newFeeStructure).returning();

    revalidatePath('/dashboard/finance/fee-structures');
    revalidatePath(`/dashboard/programs/${programId}`); // Revalidate program page
    revalidatePath(`/dashboard/semesters/${semesterId}`); // Revalidate semester page
    return { success: 'Fee structure created successfully.', data: createdFeeStructure };

  } catch (err: any) {
    console.error('[CREATE_FEE_STRUCTURE_ACTION_ERROR]', err);
    throw new ActionError(err.message || 'Failed to create fee structure due to a server error.');
  }
}

/**
 * Updates an existing fee structure.
 * Permissions: Admin, Accountant, Registrar
 */
export async function updateFeeStructure(feeStructureId: number, formData: FormData) {
  try {
    const authUser = await getAuthUser();
    if (!authUser || !checkPermission(authUser, allowedRolesForManagingFeeStructures())) {
      return { error: 'Unauthorized: You do not have permission to update fee structures.' };
    }

    const programId = formData.get('programId') ? Number(formData.get('programId')) : null;
    const semesterId = formData.get('semesterId') ? Number(formData.get('semesterId')) : null;
    const totalAmountStr = formData.get('totalAmount') as string | null;
    const description = formData.get('description') as string | null;

    const updates: Partial<NewFeeStructure> = {};
    if (programId !== null) updates.programId = programId;
    if (semesterId !== null) updates.semesterId = semesterId;
    if (description !== null) updates.description = description;

    if (totalAmountStr !== null) {
      const totalAmount = parseFloat(totalAmountStr);
      if (isNaN(totalAmount) || totalAmount <= 0) {
        return { error: 'Total Amount must be a positive number.' };
      }
      updates.totalAmount = String(totalAmount.toFixed(2));
    }

    if (Object.keys(updates).length === 0) {
      return { error: 'No fields to update.' };
    }

    const [updatedFeeStructure] = await db.update(feeStructures).set(updates).where(eq(feeStructures.id, feeStructureId)).returning();

    revalidatePath('/dashboard/finance/fee-structures');
    revalidatePath(`/dashboard/finance/fee-structures/${feeStructureId}`);
    if (programId) revalidatePath(`/dashboard/programs/${programId}`);
    if (semesterId) revalidatePath(`/dashboard/semesters/${semesterId}`);
    return { success: 'Fee structure updated successfully.', data: updatedFeeStructure };

  } catch (err: any) {
    console.error('[UPDATE_FEE_STRUCTURE_ACTION_ERROR]', err);
    throw new ActionError(err.message || 'Failed to update fee structure due to a server error.');
  }
}

/**
 * Deletes a fee structure.
 * Permissions: Admin, Accountant, Registrar
 */
export async function deleteFeeStructure(feeStructureId: number) {
  try {
    const authUser = await getAuthUser();
    if (!authUser || !checkPermission(authUser, allowedRolesForManagingFeeStructures())) {
      return { error: 'Unauthorized: You do not have permission to delete fee structures.' };
    }

    // Fetch fee structure to get associated IDs for revalidation
    const feeStructureToDelete = await db.query.feeStructures.findFirst({
        where: eq(feeStructures.id, feeStructureId),
        columns: { programId: true, semesterId: true }
    });

    if (!feeStructureToDelete) {
        return { error: 'Fee structure not found.' };
    }

    const [deletedFeeStructure] = await db.delete(feeStructures).where(eq(feeStructures.id, feeStructureId)).returning();

    revalidatePath('/dashboard/finance/fee-structures');
    if (feeStructureToDelete.programId) revalidatePath(`/dashboard/programs/${feeStructureToDelete.programId}`);
    if (feeStructureToDelete.semesterId) revalidatePath(`/dashboard/semesters/${feeStructureToDelete.semesterId}`);
    return { success: 'Fee structure deleted successfully.', data: deletedFeeStructure };

  } catch (err: any) {
    console.error('[DELETE_FEE_STRUCTURE_ACTION_ERROR]', err);
    throw new ActionError(err.message || 'Failed to delete fee structure due to a server error.');
  }
}

/**
 * Fetches all fee structures with associated program and semester details.
 * Permissions: Admin, Accountant, Registrar, Student
 */
export async function getFeeStructures() {
  try {
    const authUser = await getAuthUser();
    if (!checkPermission(authUser, allowedRolesForViewingFeeStructures())) {
      throw new ActionError('Unauthorized: You do not have permission to view fee structures.');
    }

    const result = await db
      .select({
        id: feeStructures.id,
        programId: feeStructures.programId,
        semesterId: feeStructures.semesterId,
        totalAmount: feeStructures.totalAmount,
        description: feeStructures.description,
        programName: programs.name,
        programCode: programs.code,
        semesterName: semesters.name,
        semesterStartDate: semesters.startDate,
        semesterEndDate: semesters.endDate,
      })
      .from(feeStructures)
      .leftJoin(programs, eq(feeStructures.programId, programs.id))
      .leftJoin(semesters, eq(feeStructures.semesterId, semesters.id));

    const allFeeStructures = result.map(fs => ({
      id: fs.id,
      programId: fs.programId,
      semesterId: fs.semesterId,
      totalAmount: fs.totalAmount,
      description: fs.description || null,
      programName: fs.programName || null,
      programCode: fs.programCode || null,
      semesterName: fs.semesterName || null,
      semesterStartDate: fs.semesterStartDate || null,
      semesterEndDate: fs.semesterEndDate || null,
    }));

    return allFeeStructures;
  } catch (err: any) {
    console.error('[GET_FEE_STRUCTURES_ACTION_ERROR]', err);
    throw new ActionError('Failed to fetch fee structures due to a server error: ' + err.message);
  }
}

/**
 * Fetches a single fee structure by ID with associated program and semester details.
 * Permissions: Admin, Accountant, Registrar, Student
 */
export async function getFeeStructureById(id: number) {
  try {
    const authUser = await getAuthUser();
    if (!checkPermission(authUser, allowedRolesForViewingFeeStructures())) {
      return { error: 'Unauthorized: You do not have permission to view this fee structure.' };
    }

    const result = await db
      .select({
        id: feeStructures.id,
        programId: feeStructures.programId,
        semesterId: feeStructures.semesterId,
        totalAmount: feeStructures.totalAmount,
        description: feeStructures.description,
        programName: programs.name,
        programCode: programs.code,
        semesterName: semesters.name,
        semesterStartDate: semesters.startDate,
        semesterEndDate: semesters.endDate,
      })
      .from(feeStructures)
      .leftJoin(programs, eq(feeStructures.programId, programs.id))
      .leftJoin(semesters, eq(feeStructures.semesterId, semesters.id))
      .where(eq(feeStructures.id, id))
      .limit(1);

    const feeStructure = result[0];

    if (!feeStructure) {
      return { error: 'Fee structure not found.' };
    }

    return {
      id: feeStructure.id,
      programId: feeStructure.programId,
      semesterId: feeStructure.semesterId,
      totalAmount: feeStructure.totalAmount,
      description: feeStructure.description || null,
      programName: feeStructure.programName || null,
      programCode: feeStructure.programCode || null,
      semesterName: feeStructure.semesterName || null,
      semesterStartDate: feeStructure.semesterStartDate || null,
      semesterEndDate: feeStructure.semesterEndDate || null,
    };

  } catch (err: any) {
    console.error('[GET_FEE_STRUCTURE_BY_ID_ACTION_ERROR]', err);
    throw new ActionError('Failed to fetch fee structure due to a server error: ' + err.message);
  }
}