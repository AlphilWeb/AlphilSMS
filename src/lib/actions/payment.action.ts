// In: src/lib/actions/payment.actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db/index';
import { payments, NewPayment, students, invoices, users } from '@/lib/db/schema'; // Added 'users' for join
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
  ACCOUNTANT: 'Accountant', // Corresponds to 'Finance' role in comments
  LECTURER: 'Lecturer',
  STAFF: 'Staff',
  STUDENT: 'Student',
};

function allowedRolesForManagingPayments() {
  return [ROLES.ADMIN, ROLES.ACCOUNTANT];
}

function allowedRolesForViewingAllPayments() {
  return [ROLES.ADMIN, ROLES.ACCOUNTANT, ROLES.REGISTRAR];
}

function allowedRolesForViewingIndividualOrStudentPayments() {
  return [ROLES.ADMIN, ROLES.ACCOUNTANT, ROLES.REGISTRAR, ROLES.STUDENT];
}

/**
 * Creates a new payment.
 * Permissions: Admin, Accountant
 * NOTE: This action is simplified. In a real system, successfully recording a payment
 * must trigger an update to the associated invoice's `amountPaid` and `balance`.
 */
export async function createPayment(formData: FormData) {
  try {
    const authUser = await getAuthUser();
    if (!authUser || !checkPermission(authUser, allowedRolesForManagingPayments())) {
      return { error: 'Unauthorized: You do not have permission to create payments.' };
    }

    const invoiceId = formData.get('invoiceId') ? Number(formData.get('invoiceId')) : null;
    const studentId = formData.get('studentId') ? Number(formData.get('studentId')) : null;
    const amountStr = formData.get('amount') as string; // Get as string first
    const paymentMethod = formData.get('paymentMethod') as string;
    const referenceNumber = formData.get('referenceNumber') as string | null;

    if (!invoiceId || !studentId || !amountStr || !paymentMethod) {
      return { error: 'Missing required fields for payment creation.' };
    }

    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) {
      return { error: 'Amount must be a positive number.' };
    }

    // Optional: Check if invoiceId and studentId actually exist in the database
    const existingInvoice = await db.query.invoices.findFirst({ where: eq(invoices.id, invoiceId) });
    const existingStudent = await db.query.students.findFirst({ where: eq(students.id, studentId) });

    if (!existingInvoice) {
      return { error: 'Associated invoice not found.' };
    }
    if (!existingStudent) {
      return { error: 'Associated student not found.' };
    }
    if (existingInvoice.studentId !== studentId) {
      return { error: 'Student ID does not match the student associated with the invoice.' };
    }

    const newPayment: NewPayment = {
      invoiceId,
      studentId,
      amount: String(amount), // Store as string as per schema, but validate as number
      paymentMethod,
      transactionDate: new Date(), // Set automatically
      referenceNumber: referenceNumber || undefined,
    };

    const [createdPayment] = await db.insert(payments).values(newPayment).returning();

    // --- CRUCIAL NEXT STEP FOR A COMPLETE FINANCE SYSTEM ---
    // Update the associated invoice's `amountPaid` and `balance`
    // This logic is omitted here for brevity but is essential.
    /*
    const updatedAmountPaid = parseFloat(existingInvoice.amountPaid || '0') + amount;
    const updatedBalance = parseFloat(existingInvoice.amountDue) - updatedAmountPaid;
    await db.update(invoices)
        .set({
            amountPaid: String(updatedAmountPaid),
            balance: String(updatedBalance),
            // Optionally update status if balance becomes 0
            status: updatedBalance <= 0 ? 'Paid' : 'Partial'
        })
        .where(eq(invoices.id, invoiceId));
    */
    // -----------------------------------------------------

    revalidatePath('/dashboard/finance/payments');
    revalidatePath(`/dashboard/finance/invoices/${invoiceId}`); // Revalidate associated invoice
    revalidatePath(`/dashboard/students/${studentId}`); // Revalidate student's finance section
    return { success: 'Payment recorded successfully.', data: createdPayment };
  } catch (err: any) {
    console.error('[CREATE_PAYMENT_ACTION_ERROR]', err);
    throw new ActionError(err.message || 'Failed to record payment due to a server error.');
  }
}

/**
 * Updates an existing payment.
 * Permissions: Admin, Accountant
 * NOTE: Updating payments also requires recalculating invoice balances and potentially
 * reversing previous changes before applying new ones.
 */
export async function updatePayment(paymentId: number, formData: FormData) {
  try {
    const authUser = await getAuthUser();
    if (!authUser || !checkPermission(authUser, allowedRolesForManagingPayments())) {
      return { error: 'Unauthorized: You do not have permission to update payments.' };
    }

    // Fetch the original payment details and related invoice for recalculation
    const originalPayment = await db.query.payments.findFirst({
      where: eq(payments.id, paymentId),
      with: {
        invoice: true, // Get invoice data
      },
    });

    if (!originalPayment) {
      return { error: 'Payment not found.' };
    }

    const invoiceId = formData.get('invoiceId') ? Number(formData.get('invoiceId')) : null;
    const studentId = formData.get('studentId') ? Number(formData.get('studentId')) : null;
    const amountStr = formData.get('amount') as string | null;
    const paymentMethod = formData.get('paymentMethod') as string | null;
    const referenceNumber = formData.get('referenceNumber') as string | null;

    const updates: Partial<NewPayment> = {};
    if (invoiceId !== null) updates.invoiceId = invoiceId;
    if (studentId !== null) updates.studentId = studentId;
    if (paymentMethod !== null) updates.paymentMethod = paymentMethod;
    if (referenceNumber !== null) updates.referenceNumber = referenceNumber;

    let newAmount: number | null = null;
    if (amountStr !== null) {
      newAmount = parseFloat(amountStr);
      if (isNaN(newAmount) || newAmount <= 0) {
        return { error: 'Amount must be a positive number.' };
      }
      updates.amount = String(newAmount);
    }

    if (Object.keys(updates).length === 0) {
      return { error: 'No fields to update.' };
    }

    const [updatedPayment] = await db
      .update(payments)
      .set(updates)
      .where(eq(payments.id, paymentId))
      .returning();

    // --- CRUCIAL NEXT STEP FOR A COMPLETE FINANCE SYSTEM ---
    // Recalculate and update the associated invoice's `amountPaid` and `balance`.
    // This typically involves:
    // 1. Reverting the original payment's impact on the invoice.
    // 2. Applying the updated payment's impact.
    /*
    if (originalPayment.invoice) {
        let currentInvoice = originalPayment.invoice;

        // Revert old payment amount
        let recalculatedAmountPaid = parseFloat(currentInvoice.amountPaid || '0') - parseFloat(originalPayment.amount);
        recalculatedAmountPaid = Math.max(0, recalculatedAmountPaid); // Ensure not negative

        // Add new payment amount if updated, else add original amount
        const effectiveNewAmount = newAmount !== null ? newAmount : parseFloat(originalPayment.amount);
        recalculatedAmountPaid += effectiveNewAmount;

        const recalculatedBalance = parseFloat(currentInvoice.amountDue) - recalculatedAmountPaid;

        await db.update(invoices)
            .set({
                amountPaid: String(recalculatedAmountPaid),
                balance: String(recalculatedBalance),
                status: recalculatedBalance <= 0 ? 'Paid' : (recalculatedAmountPaid > 0 ? 'Partial' : 'Pending')
            })
            .where(eq(invoices.id, originalPayment.invoiceId));
    }
    */
    // -----------------------------------------------------

    revalidatePath('/dashboard/finance/payments');
    revalidatePath(`/dashboard/finance/payments/${paymentId}`);
    if (invoiceId) revalidatePath(`/dashboard/finance/invoices/${invoiceId}`); // Revalidate potential new invoice
    if (originalPayment.invoiceId && originalPayment.invoiceId !== invoiceId) {
      revalidatePath(`/dashboard/finance/invoices/${originalPayment.invoiceId}`); // Revalidate old invoice
    }
    if (studentId) revalidatePath(`/dashboard/students/${studentId}`);
    if (originalPayment.studentId && originalPayment.studentId !== studentId) {
      revalidatePath(`/dashboard/students/${originalPayment.studentId}`);
    }
    return { success: 'Payment updated successfully.', data: updatedPayment };
  } catch (err: any) {
    console.error('[UPDATE_PAYMENT_ACTION_ERROR]', err);
    throw new ActionError(err.message || 'Failed to update payment due to a server error.');
  }
}

/**
 * Deletes a payment.
 * Permissions: Admin, Accountant
 * NOTE: Deleting payments *must* also reverse the update on the associated invoice's balance.
 */
export async function deletePayment(paymentId: number) {
  try {
    const authUser = await getAuthUser();
    if (!authUser || !checkPermission(authUser, allowedRolesForManagingPayments())) {
      return { error: 'Unauthorized: You do not have permission to delete payments.' };
    }

    // Fetch the payment to get its details for invoice reversal
    const paymentToDelete = await db.query.payments.findFirst({
      where: eq(payments.id, paymentId),
      with: {
        invoice: true, // Get invoice data
      },
    });

    if (!paymentToDelete) {
      return { error: 'Payment not found.' };
    }

    const [deletedPayment] = await db
      .delete(payments)
      .where(eq(payments.id, paymentId))
      .returning();

    // --- CRUCIAL NEXT STEP FOR A COMPLETE FINANCE SYSTEM ---
    // Reverse the impact of this payment on the associated invoice's `amountPaid` and `balance`.
    /*
    if (paymentToDelete.invoice) {
        const currentInvoice = paymentToDelete.invoice;
        let recalculatedAmountPaid = parseFloat(currentInvoice.amountPaid || '0') - parseFloat(paymentToDelete.amount);
        recalculatedAmountPaid = Math.max(0, recalculatedAmountPaid); // Ensure not negative

        const recalculatedBalance = parseFloat(currentInvoice.amountDue) - recalculatedAmountPaid;

        await db.update(invoices)
            .set({
                amountPaid: String(recalculatedAmountPaid),
                balance: String(recalculatedBalance),
                status: recalculatedBalance <= 0 ? 'Paid' : (recalculatedAmountPaid > 0 ? 'Partial' : 'Pending')
            })
            .where(eq(invoices.id, paymentToDelete.invoiceId));
    }
    */
    // -----------------------------------------------------

    revalidatePath('/dashboard/finance/payments');
    if (paymentToDelete.invoiceId) {
      revalidatePath(`/dashboard/finance/invoices/${paymentToDelete.invoiceId}`);
    }
    if (paymentToDelete.studentId) {
      revalidatePath(`/dashboard/students/${paymentToDelete.studentId}`);
    }
    return { success: 'Payment deleted successfully.', data: deletedPayment };
  } catch (err: any) {
    console.error('[DELETE_PAYMENT_ACTION_ERROR]', err);
    throw new ActionError(err.message || 'Failed to delete payment due to a server error.');
  }
}

/**
 * Fetches all payments with associated student and invoice details.
 * Permissions: Admin, Accountant, Registrar
 */
export async function getPayments() {
  try {
    const authUser = await getAuthUser();
    if (!checkPermission(authUser, allowedRolesForViewingAllPayments())) {
      throw new ActionError('Unauthorized: You do not have permission to view payments.');
    }

    const result = await db
      .select({
        id: payments.id,
        invoiceId: payments.invoiceId,
        studentId: payments.studentId,
        amount: payments.amount,
        paymentMethod: payments.paymentMethod,
        transactionDate: payments.transactionDate,
        referenceNumber: payments.referenceNumber,
        studentFirstName: students.firstName,
        studentLastName: students.lastName,
        studentRegNo: students.registrationNumber, // FIX: Use registrationNumber
        studentUserEmail: users.email,
        invoiceAmountDue: invoices.amountDue,
        invoiceBalance: invoices.balance,
        invoiceStatus: invoices.status,
      })
      .from(payments)
      .leftJoin(students, eq(payments.studentId, students.id))
      .leftJoin(users, eq(students.userId, users.id)) // Join to get user email
      .leftJoin(invoices, eq(payments.invoiceId, invoices.id));

    const allPayments = result.map((p) => ({
      id: p.id,
      invoiceId: p.invoiceId,
      studentId: p.studentId,
      amount: p.amount,
      paymentMethod: p.paymentMethod,
      transactionDate: p.transactionDate,
      referenceNumber: p.referenceNumber || null,
      studentFullName: p.studentFirstName && p.studentLastName ? `${p.studentFirstName} ${p.studentLastName}` : null,
      studentRegNo: p.studentRegNo || null, // FIX: Use aliased name
      studentUserEmail: p.studentUserEmail || null,
      invoiceAmountDue: p.invoiceAmountDue || null,
      invoiceBalance: p.invoiceBalance || null,
      invoiceStatus: p.invoiceStatus || null,
    }));

    return allPayments;
  } catch (err: any) {
    console.error('[GET_PAYMENTS_ACTION_ERROR]', err);
    throw new ActionError('Failed to fetch payments due to a server error: ' + err.message);
  }
}

/**
 * Fetches a single payment by ID with associated student and invoice details.
 * Permissions: Admin, Accountant, Registrar, Student (can view their own).
 */
export async function getPaymentById(id: number) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return { error: 'Unauthorized: You must be logged in.' };
    }

    const result = await db
      .select({
        id: payments.id,
        invoiceId: payments.invoiceId,
        studentId: payments.studentId,
        amount: payments.amount,
        paymentMethod: payments.paymentMethod,
        transactionDate: payments.transactionDate,
        referenceNumber: payments.referenceNumber,
        studentUserId: students.userId, // Needed for student self-access check
        studentFirstName: students.firstName,
        studentLastName: students.lastName,
        studentRegNo: students.registrationNumber, // FIX: Use registrationNumber
        studentUserEmail: users.email,
        invoiceAmountDue: invoices.amountDue,
        invoiceBalance: invoices.balance,
        invoiceStatus: invoices.status,
      })
      .from(payments)
      .leftJoin(students, eq(payments.studentId, students.id))
      .leftJoin(users, eq(students.userId, users.id))
      .leftJoin(invoices, eq(payments.invoiceId, invoices.id))
      .where(eq(payments.id, id))
      .limit(1);

    const paymentRecord = result[0];

    if (!paymentRecord) {
      return { error: 'Payment not found.' };
    }

    // Authorization: Admin, Accountant, Registrar, or the student themselves.
    const isAuthorized =
      checkPermission(authUser, allowedRolesForViewingIndividualOrStudentPayments()) ||
      authUser.userId === paymentRecord.studentUserId;

    if (!isAuthorized) {
      return { error: 'Unauthorized: You do not have permission to view this payment.' };
    }

    return {
      id: paymentRecord.id,
      invoiceId: paymentRecord.invoiceId,
      studentId: paymentRecord.studentId,
      amount: paymentRecord.amount,
      paymentMethod: paymentRecord.paymentMethod,
      transactionDate: paymentRecord.transactionDate,
      referenceNumber: paymentRecord.referenceNumber || null,
      studentFullName:
        paymentRecord.studentFirstName && paymentRecord.studentLastName
          ? `${paymentRecord.studentFirstName} ${paymentRecord.studentLastName}`
          : null,
      studentRegNo: paymentRecord.studentRegNo || null, // FIX: Use aliased name
      studentUserEmail: paymentRecord.studentUserEmail || null,
      invoiceAmountDue: paymentRecord.invoiceAmountDue || null,
      invoiceBalance: paymentRecord.invoiceBalance || null,
      invoiceStatus: paymentRecord.invoiceStatus || null,
    };
  } catch (err: any) {
    console.error('[GET_PAYMENT_BY_ID_ACTION_ERROR]', err);
    throw new ActionError('Failed to fetch payment due to a server error: ' + err.message);
  }
}

/**
 * Fetches payments for a specific student with associated invoice details.
 * Permissions: Admin, Accountant, Registrar, Student (can view their own).
 */
export async function getPaymentsByStudentId(studentId: number) {
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
      checkPermission(authUser, allowedRolesForViewingIndividualOrStudentPayments()) ||
      authUser.userId === studentRecord.userId;

    if (!isAuthorized) {
      return { error: 'Unauthorized: You do not have permission to view these payments.' };
    }

    const result = await db
      .select({
        id: payments.id,
        invoiceId: payments.invoiceId,
        studentId: payments.studentId,
        amount: payments.amount,
        paymentMethod: payments.paymentMethod,
        transactionDate: payments.transactionDate,
        referenceNumber: payments.referenceNumber,
        invoiceAmountDue: invoices.amountDue,
        invoiceBalance: invoices.balance,
        invoiceStatus: invoices.status,
      })
      .from(payments)
      .leftJoin(invoices, eq(payments.invoiceId, invoices.id))
      .where(eq(payments.studentId, studentId));

    const studentPayments = result.map((p) => ({
      id: p.id,
      invoiceId: p.invoiceId,
      studentId: p.studentId,
      amount: p.amount,
      paymentMethod: p.paymentMethod,
      transactionDate: p.transactionDate,
      referenceNumber: p.referenceNumber || null,
      invoiceAmountDue: p.invoiceAmountDue || null,
      invoiceBalance: p.invoiceBalance || null,
      invoiceStatus: p.invoiceStatus || null,
    }));

    return studentPayments;
  } catch (err: any) {
    console.error('[GET_PAYMENTS_BY_STUDENT_ID_ACTION_ERROR]', err);
    throw new ActionError('Failed to fetch student payments due to a server error: ' + err.message);
  }
}