// In: src/lib/actions/invoice.actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db/index';
import { invoices, NewInvoice, students, semesters, feeStructures, users } from '@/lib/db/schema'; // Added 'semesters', 'feeStructures', 'users' for joins
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

function allowedRolesForManagingInvoices() {
  return [ROLES.ADMIN, ROLES.ACCOUNTANT, ROLES.REGISTRAR];
}

function allowedRolesForViewingAllInvoices() {
  return [ROLES.ADMIN, ROLES.ACCOUNTANT, ROLES.REGISTRAR];
}

function allowedRolesForViewingIndividualOrStudentInvoices() {
  return [ROLES.ADMIN, ROLES.ACCOUNTANT, ROLES.REGISTRAR, ROLES.STUDENT];
}

/**
 * Creates a new invoice.
 * Permissions: Admin, Accountant, Registrar
 */
export async function createInvoice(formData: FormData) {
  try {
    const authUser = await getAuthUser();
    if (!authUser || !checkPermission(authUser, allowedRolesForManagingInvoices())) {
      return { error: 'Unauthorized: You do not have permission to create invoices.' };
    }

    const studentId = formData.get('studentId') ? Number(formData.get('studentId')) : null;
    const semesterId = formData.get('semesterId') ? Number(formData.get('semesterId')) : null;
    const feeStructureId = formData.get('feeStructureId') ? Number(formData.get('feeStructureId')) : null;
    const amountDueStr = formData.get('amountDue') as string;
    const amountPaidStr = (formData.get('amountPaid') as string) || '0.00'; // Default to '0.00' if not provided
    const dueDate = formData.get('dueDate') as string;

    if (!studentId || !semesterId || !amountDueStr || !dueDate) {
      return { error: 'Missing required fields for invoice creation.' };
    }

    const amountDue = parseFloat(amountDueStr);
    const amountPaid = parseFloat(amountPaidStr);

    if (isNaN(amountDue) || amountDue < 0 || isNaN(amountPaid) || amountPaid < 0) {
      return { error: 'Amount Due and Amount Paid must be valid non-negative numbers.' };
    }
    if (amountPaid > amountDue) {
      return { error: 'Amount Paid cannot exceed Amount Due.' };
    }

    // Calculate balance and status
    const balance = amountDue - amountPaid;
    let status = 'Pending';
    if (balance <= 0) {
      status = 'Paid';
    } else if (amountPaid > 0) {
      status = 'Partial';
    }

    // Check for existing invoice for this student and semester to prevent duplicates
    const existingInvoice = await db.query.invoices.findFirst({
      where: and(eq(invoices.studentId, studentId), eq(invoices.semesterId, semesterId)),
    });

    if (existingInvoice) {
      return { error: 'An invoice for this student in this semester already exists.' };
    }

    const newInvoice: NewInvoice = {
      studentId,
      semesterId,
      feeStructureId: feeStructureId || undefined,
      amountDue: String(amountDue.toFixed(2)),
      amountPaid: String(amountPaid.toFixed(2)),
      balance: String(balance.toFixed(2)),
      dueDate,
      issuedDate: new Date(), // Set automatically
      status,
    };

    const [createdInvoice] = await db.insert(invoices).values(newInvoice).returning();

    revalidatePath('/dashboard/finance/invoices');
    revalidatePath(`/dashboard/students/${studentId}`); // Revalidate student's finance section
    revalidatePath(`/dashboard/semesters/${semesterId}`); // Revalidate semester's finance overview
    if (feeStructureId) revalidatePath(`/dashboard/finance/fee-structures/${feeStructureId}`);
    return { success: 'Invoice created successfully.', data: createdInvoice };
  } catch (err: unknown) {
  const error = err instanceof Error ? err : new Error(String(err));
  console.error('[ERROR_CONTEXT]', error);
  throw new ActionError(error.message);
}
}

/**
 * Updates an existing invoice.
 * Permissions: Admin, Accountant
 */
export async function updateInvoice(invoiceId: number, formData: FormData) {
  try {
    const authUser = await getAuthUser();
    if (!authUser || !checkPermission(authUser, allowedRolesForManagingInvoices())) {
      return { error: 'Unauthorized: You do not have permission to update invoices.' };
    }

    // Fetch the existing invoice to get current values for recalculation
    const existingInvoice = await db.query.invoices.findFirst({
      where: eq(invoices.id, invoiceId),
    });

    if (!existingInvoice) {
      return { error: 'Invoice not found.' };
    }

    const studentId = formData.get('studentId') ? Number(formData.get('studentId')) : null;
    const semesterId = formData.get('semesterId') ? Number(formData.get('semesterId')) : null;
    const feeStructureId = formData.get('feeStructureId') ? Number(formData.get('feeStructureId')) : null;
    const amountDueStr = formData.get('amountDue') as string | null;
    const amountPaidStr = formData.get('amountPaid') as string | null;
    const dueDate = formData.get('dueDate') as string | null;
    const status = formData.get('status') as string | null; // Allow manual status override, but prefer auto-calculation

    const updates: Partial<NewInvoice> = {};
    if (studentId !== null) updates.studentId = studentId;
    if (semesterId !== null) updates.semesterId = semesterId;
    if (feeStructureId !== null) updates.feeStructureId = feeStructureId;
    if (dueDate !== null) updates.dueDate = dueDate;

    const newAmountDue =
      amountDueStr !== null ? parseFloat(amountDueStr) : parseFloat(existingInvoice.amountDue);
    const newAmountPaid =
      amountPaidStr !== null ? parseFloat(amountPaidStr) : parseFloat(existingInvoice.amountPaid);

    if (isNaN(newAmountDue) || newAmountDue < 0 || isNaN(newAmountPaid) || newAmountPaid < 0) {
      return { error: 'Amount Due and Amount Paid must be valid non-negative numbers.' };
    }
    if (newAmountPaid > newAmountDue) {
      return { error: 'Amount Paid cannot exceed Amount Due.' };
    }

    updates.amountDue = String(newAmountDue.toFixed(2));
    updates.amountPaid = String(newAmountPaid.toFixed(2));
    updates.balance = String((newAmountDue - newAmountPaid).toFixed(2));

    // Automatically determine status unless explicitly provided
    if (status) {
      updates.status = status;
    } else {
      const calculatedBalance = newAmountDue - newAmountPaid;
      if (calculatedBalance <= 0) {
        updates.status = 'Paid';
      } else if (newAmountPaid > 0) {
        updates.status = 'Partial';
      } else {
        updates.status = 'Pending';
      }
    }

    if (Object.keys(updates).length === 0) {
      return { error: 'No fields to update.' };
    }

    const [updatedInvoice] = await db
      .update(invoices)
      .set(updates)
      .where(eq(invoices.id, invoiceId))
      .returning();

    revalidatePath('/dashboard/finance/invoices');
    revalidatePath(`/dashboard/finance/invoices/${invoiceId}`);
    if (studentId) revalidatePath(`/dashboard/students/${studentId}`);
    if (semesterId) revalidatePath(`/dashboard/semesters/${semesterId}`);
    if (feeStructureId) revalidatePath(`/dashboard/finance/fee-structures/${feeStructureId}`);

    // Revalidate old paths if studentId, semesterId, or feeStructureId changed
    if (existingInvoice.studentId !== studentId)
      revalidatePath(`/dashboard/students/${existingInvoice.studentId}`);
    if (existingInvoice.semesterId !== semesterId)
      revalidatePath(`/dashboard/semesters/${existingInvoice.semesterId}`);
    if (existingInvoice.feeStructureId && existingInvoice.feeStructureId !== feeStructureId)
      revalidatePath(`/dashboard/finance/fee-structures/${existingInvoice.feeStructureId}`);

    return { success: 'Invoice updated successfully.', data: updatedInvoice };
  } catch (err: unknown) {
  const error = err instanceof Error ? err : new Error(String(err));
  console.error('[ERROR_CONTEXT]', error);
  throw new ActionError(error.message);
}
}

/**
 * Deletes an invoice.
 * Permissions: Admin, Accountant
 */
export async function deleteInvoice(invoiceId: number) {
  try {
    const authUser = await getAuthUser();
    if (!authUser || !checkPermission(authUser, allowedRolesForManagingInvoices())) {
      return { error: 'Unauthorized: You do not have permission to delete invoices.' };
    }

    // Fetch the invoice to get associated IDs for revalidation
    const invoiceToDelete = await db.query.invoices.findFirst({
      where: eq(invoices.id, invoiceId),
      columns: { studentId: true, semesterId: true, feeStructureId: true },
    });

    if (!invoiceToDelete) {
      return { error: 'Invoice not found.' };
    }

    const [deletedInvoice] = await db
      .delete(invoices)
      .where(eq(invoices.id, invoiceId))
      .returning();

    revalidatePath('/dashboard/finance/invoices');
    if (invoiceToDelete.studentId)
      revalidatePath(`/dashboard/students/${invoiceToDelete.studentId}`);
    if (invoiceToDelete.semesterId)
      revalidatePath(`/dashboard/semesters/${invoiceToDelete.semesterId}`);
    if (invoiceToDelete.feeStructureId)
      revalidatePath(`/dashboard/finance/fee-structures/${invoiceToDelete.feeStructureId}`);
    return { success: 'Invoice deleted successfully.', data: deletedInvoice };
  } catch (err: unknown) {
  const error = err instanceof Error ? err : new Error(String(err));
  console.error('[ERROR_CONTEXT]', error);
  throw new ActionError(error.message);
}
}

/**
 * Fetches all invoices with associated student, semester, and fee structure details.
 * Permissions: Admin, Accountant, Registrar
 */
export async function getInvoices() {
  try {
    const authUser = await getAuthUser();
    if (!checkPermission(authUser, allowedRolesForViewingAllInvoices())) {
      throw new ActionError('Unauthorized: You do not have permission to view invoices.');
    }

    const result = await db
      .select({
        id: invoices.id,
        studentId: invoices.studentId,
        semesterId: invoices.semesterId,
        feeStructureId: invoices.feeStructureId,
        amountDue: invoices.amountDue,
        amountPaid: invoices.amountPaid,
        balance: invoices.balance,
        dueDate: invoices.dueDate,
        issuedDate: invoices.issuedDate,
        status: invoices.status,
        studentFirstName: students.firstName,
        studentLastName: students.lastName,
        studentRegNo: students.registrationNumber, // FIX: Use registrationNumber
        studentUserEmail: users.email,
        semesterName: semesters.name,
        semesterStartDate: semesters.startDate,
        semesterEndDate: semesters.endDate,
        feeStructureTotalAmount: feeStructures.totalAmount,
        feeStructureDescription: feeStructures.description,
      })
      .from(invoices)
      .leftJoin(students, eq(invoices.studentId, students.id))
      .leftJoin(users, eq(students.userId, users.id))
      .leftJoin(semesters, eq(invoices.semesterId, semesters.id))
      .leftJoin(feeStructures, eq(invoices.feeStructureId, feeStructures.id));

    const allInvoices = result.map((i) => ({
      id: i.id,
      studentId: i.studentId,
      semesterId: i.semesterId,
      feeStructureId: i.feeStructureId || null,
      amountDue: i.amountDue,
      amountPaid: i.amountPaid,
      balance: i.balance,
      dueDate: i.dueDate,
      issuedDate: i.issuedDate,
      status: i.status,
      studentFullName:
        i.studentFirstName && i.studentLastName ? `${i.studentFirstName} ${i.studentLastName}` : null,
      studentRegNo: i.studentRegNo || null, // FIX: Use aliased name
      studentUserEmail: i.studentUserEmail || null,
      semesterName: i.semesterName || null,
      semesterStartDate: i.semesterStartDate || null,
      semesterEndDate: i.semesterEndDate || null,
      feeStructureTotalAmount: i.feeStructureTotalAmount || null,
      feeStructureDescription: i.feeStructureDescription || null,
    }));

    return allInvoices;
  } catch (err: unknown) {
  const error = err instanceof Error ? err : new Error(String(err));
  console.error('[ERROR_CONTEXT]', error);
  throw new ActionError(error.message);
}
}

/**
 * Fetches a single invoice by ID with associated student, semester, and fee structure details.
 * Permissions: Admin, Accountant, Registrar, Student (can view their own).
 */
export async function getInvoiceById(id: number) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return { error: 'Unauthorized: You must be logged in.' };
    }

    const result = await db
      .select({
        id: invoices.id,
        studentId: invoices.studentId,
        semesterId: invoices.semesterId,
        feeStructureId: invoices.feeStructureId,
        amountDue: invoices.amountDue,
        amountPaid: invoices.amountPaid,
        balance: invoices.balance,
        dueDate: invoices.dueDate,
        issuedDate: invoices.issuedDate,
        status: invoices.status,
        studentUserId: students.userId, // Needed for student self-access check
        studentFirstName: students.firstName,
        studentLastName: students.lastName,
        studentRegNo: students.registrationNumber, // FIX: Use registrationNumber
        studentUserEmail: users.email,
        semesterName: semesters.name,
        semesterStartDate: semesters.startDate,
        semesterEndDate: semesters.endDate,
        feeStructureTotalAmount: feeStructures.totalAmount,
        feeStructureDescription: feeStructures.description,
      })
      .from(invoices)
      .leftJoin(students, eq(invoices.studentId, students.id))
      .leftJoin(users, eq(students.userId, users.id))
      .leftJoin(semesters, eq(invoices.semesterId, semesters.id))
      .leftJoin(feeStructures, eq(invoices.feeStructureId, feeStructures.id))
      .where(eq(invoices.id, id))
      .limit(1);

    const invoiceRecord = result[0];

    if (!invoiceRecord) {
      return { error: 'Invoice not found.' };
    }

    // Authorization: Admin, Accountant, Registrar, or the student themselves.
    const isAuthorized =
      checkPermission(authUser, allowedRolesForViewingIndividualOrStudentInvoices()) ||
      authUser.userId === invoiceRecord.studentUserId;

    if (!isAuthorized) {
      return { error: 'Unauthorized: You do not have permission to view this invoice.' };
    }

    return {
      id: invoiceRecord.id,
      studentId: invoiceRecord.studentId,
      semesterId: invoiceRecord.semesterId,
      feeStructureId: invoiceRecord.feeStructureId || null,
      amountDue: invoiceRecord.amountDue,
      amountPaid: invoiceRecord.amountPaid,
      balance: invoiceRecord.balance,
      dueDate: invoiceRecord.dueDate,
      issuedDate: invoiceRecord.issuedDate,
      status: invoiceRecord.status,
      studentFullName:
        invoiceRecord.studentFirstName && invoiceRecord.studentLastName
          ? `${invoiceRecord.studentFirstName} ${invoiceRecord.studentLastName}`
          : null,
      studentRegNo: invoiceRecord.studentRegNo || null, // FIX: Use aliased name
      studentUserEmail: invoiceRecord.studentUserEmail || null,
      semesterName: invoiceRecord.semesterName || null,
      semesterStartDate: invoiceRecord.semesterStartDate || null,
      semesterEndDate: invoiceRecord.semesterEndDate || null,
      feeStructureTotalAmount: invoiceRecord.feeStructureTotalAmount || null,
      feeStructureDescription: invoiceRecord.feeStructureDescription || null,
    };
  } catch (err: unknown) {
  const error = err instanceof Error ? err : new Error(String(err));
  console.error('[ERROR_CONTEXT]', error);
  throw new ActionError(error.message);
}
}

/**
 * Fetches invoices for a specific student with associated semester and fee structure details.
 * Permissions: Admin, Accountant, Registrar, Student (can view their own).
 */
export async function getInvoicesByStudentId(studentId: number) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return { error: 'Unauthorized: You must be logged in.' };
    }

    const studentRecord = await db.query.students.findFirst({
      where: eq(students.id, studentId),
      columns: { userId: true, firstName: true, lastName: true, registrationNumber: true }, // FIX: Use registrationNumber
    });

    if (!studentRecord) {
      return { error: 'Student not found.' };
    }

    // Authorization: Admin, Accountant, Registrar, or the student themselves.
    const isAuthorized =
      checkPermission(authUser, allowedRolesForViewingIndividualOrStudentInvoices()) ||
      authUser.userId === studentRecord.userId;

    if (!isAuthorized) {
      return { error: 'Unauthorized: You do not have permission to view these invoices.' };
    }

    const result = await db
      .select({
        id: invoices.id,
        studentId: invoices.studentId,
        semesterId: invoices.semesterId,
        feeStructureId: invoices.feeStructureId,
        amountDue: invoices.amountDue,
        amountPaid: invoices.amountPaid,
        balance: invoices.balance,
        dueDate: invoices.dueDate,
        issuedDate: invoices.issuedDate,
        status: invoices.status,
        semesterName: semesters.name,
        semesterStartDate: semesters.startDate,
        semesterEndDate: semesters.endDate,
        feeStructureTotalAmount: feeStructures.totalAmount,
        feeStructureDescription: feeStructures.description,
      })
      .from(invoices)
      .leftJoin(semesters, eq(invoices.semesterId, semesters.id))
      .leftJoin(feeStructures, eq(invoices.feeStructureId, feeStructures.id))
      .where(eq(invoices.studentId, studentId));

    const studentInvoices = result.map((i) => ({
      id: i.id,
      studentId: i.studentId,
      semesterId: i.semesterId,
      feeStructureId: i.feeStructureId || null,
      amountDue: i.amountDue,
      amountPaid: i.amountPaid,
      balance: i.balance,
      dueDate: i.dueDate,
      issuedDate: i.issuedDate,
      status: i.status,
      semesterName: i.semesterName || null,
      semesterStartDate: i.semesterStartDate || null,
      semesterEndDate: i.semesterEndDate || null,
      feeStructureTotalAmount: i.feeStructureTotalAmount || null,
      feeStructureDescription: i.feeStructureDescription || null,
    }));

    return studentInvoices;
  } catch (err: unknown) {
  const error = err instanceof Error ? err : new Error(String(err));
  console.error('[ERROR_CONTEXT]', error);
  throw new ActionError(error.message);
}
}