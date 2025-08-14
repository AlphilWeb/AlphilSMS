'use server';

import { db } from '@/lib/db';
import { payments, invoices, students, userLogs } from '@/lib/db/schema';
import { eq, sql, like, or, desc } from 'drizzle-orm';
import { getAuthUser } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { ActionError } from '@/lib/utils';

// Types
export type PaymentWithDetails = {
  id: number;
  amount: number;
  paymentMethod: string;
  transactionDate: Date;
  referenceNumber: string | null;
  invoice: {
    id: number;
    amountDue: number;
    amountPaid: number;
    balance: number;
    status: string;
  };
  student: {
    id: number;
    firstName: string;
    lastName: string;
    registrationNumber: string;
  };
};

export type PaymentCreateData = {
  invoiceId: number;
  studentId: number;
  amount: number;
  paymentMethod: string;
  referenceNumber?: string;
};

export type PaymentUpdateData = {
  amount?: number;
  paymentMethod?: string;
  referenceNumber?: string | null;
};

export type PaymentDetails = {
  id: number;
  amount: number;
  paymentMethod: string;
  transactionDate: Date;
  referenceNumber: string | null;
  invoice: {
    id: number;
    amountDue: number;
    amountPaid: number;
    balance: number;
    status: string;
    dueDate: string;
    issuedDate: Date;
  };
  student: {
    id: number;
    firstName: string;
    lastName: string;
    registrationNumber: string;
    studentNumber: string;
    email: string;
  };
};

// Get all payments with basic details
export async function getAllPayments(): Promise<PaymentWithDetails[]> {
  const authUser = await getAuthUser();
  if (!authUser) throw new Error('Unauthorized');

  const raw = await db
    .select({
      id: payments.id,
      amount: payments.amount,
      paymentMethod: payments.paymentMethod,
      transactionDate: payments.transactionDate,
      referenceNumber: payments.referenceNumber,
      invoiceId: invoices.id,
      invoiceAmountDue: invoices.amountDue,
      invoiceAmountPaid: invoices.amountPaid,
      invoiceBalance: invoices.balance,
      invoiceStatus: invoices.status,
      studentId: students.id,
      studentFirstName: students.firstName,
      studentLastName: students.lastName,
      studentRegistrationNumber: students.registrationNumber,
    })
    .from(payments)
    .innerJoin(invoices, eq(invoices.id, payments.invoiceId))
    .innerJoin(students, eq(students.id, payments.studentId))
    .orderBy(desc(payments.transactionDate));

  return raw.map(row => ({
    id: row.id,
    amount: Number(row.amount),
    paymentMethod: row.paymentMethod,
    transactionDate: row.transactionDate,
    referenceNumber: row.referenceNumber,
    invoice: {
      id: row.invoiceId,
      amountDue: Number(row.invoiceAmountDue),
      amountPaid: Number(row.invoiceAmountPaid),
      balance: Number(row.invoiceBalance),
      status: row.invoiceStatus,
    },
    student: {
      id: row.studentId,
      firstName: row.studentFirstName,
      lastName: row.studentLastName,
      registrationNumber: row.studentRegistrationNumber,
    },
  }));
}

// Search payments by student name, registration number, reference number, or amount
export async function searchPayments(query: string): Promise<PaymentWithDetails[]> {
  const authUser = await getAuthUser();
  if (!authUser) throw new Error('Unauthorized');

  if (!query.trim()) return await getAllPayments();

  const raw = await db
    .select({
      id: payments.id,
      amount: payments.amount,
      paymentMethod: payments.paymentMethod,
      transactionDate: payments.transactionDate,
      referenceNumber: payments.referenceNumber,
      invoiceId: invoices.id,
      invoiceAmountDue: invoices.amountDue,
      invoiceAmountPaid: invoices.amountPaid,
      invoiceBalance: invoices.balance,
      invoiceStatus: invoices.status,
      studentId: students.id,
      studentFirstName: students.firstName,
      studentLastName: students.lastName,
      studentRegistrationNumber: students.registrationNumber,
    })
    .from(payments)
    .innerJoin(invoices, eq(invoices.id, payments.invoiceId))
    .innerJoin(students, eq(students.id, payments.studentId))
    .where(
      or(
        like(students.firstName, `%${query}%`),
        like(students.lastName, `%${query}%`),
        sql`CONCAT(${students.firstName}, ' ', ${students.lastName}) LIKE ${`%${query}%`}`,
        like(students.registrationNumber, `%${query}%`),
        like(payments.referenceNumber, `%${query}%`),
        sql`CAST(${payments.amount} AS TEXT) LIKE ${`%${query}%`}`
      )
    )
    .orderBy(desc(payments.transactionDate));

  return raw.map(row => ({
    id: row.id,
    amount: Number(row.amount),
    paymentMethod: row.paymentMethod,
    transactionDate: row.transactionDate,
    referenceNumber: row.referenceNumber,
    invoice: {
      id: row.invoiceId,
      amountDue: Number(row.invoiceAmountDue),
      amountPaid: Number(row.invoiceAmountPaid),
      balance: Number(row.invoiceBalance),
      status: row.invoiceStatus,
    },
    student: {
      id: row.studentId,
      firstName: row.studentFirstName,
      lastName: row.studentLastName,
      registrationNumber: row.studentRegistrationNumber,
    },
  }));
}

// Get payment details by ID
export async function getPaymentDetails(paymentId: number): Promise<PaymentDetails> {
  const authUser = await getAuthUser();
  if (!authUser) throw new Error('Unauthorized');

  const rows = await db
    .select({
      id: payments.id,
      amount: payments.amount,
      paymentMethod: payments.paymentMethod,
      transactionDate: payments.transactionDate,
      referenceNumber: payments.referenceNumber,
      invoiceId: invoices.id,
      invoiceAmountDue: invoices.amountDue,
      invoiceAmountPaid: invoices.amountPaid,
      invoiceBalance: invoices.balance,
      invoiceStatus: invoices.status,
      invoiceDueDate: invoices.dueDate,
      invoiceIssuedDate: invoices.issuedDate,
      studentId: students.id,
      studentFirstName: students.firstName,
      studentLastName: students.lastName,
      studentRegistrationNumber: students.registrationNumber,
      studentNumber: students.studentNumber,
      studentEmail: students.email,
    })
    .from(payments)
    .innerJoin(invoices, eq(invoices.id, payments.invoiceId))
    .innerJoin(students, eq(students.id, payments.studentId))
    .where(eq(payments.id, paymentId));

  const row = rows[0];
  if (!row) {
    throw new ActionError('Payment not found');
  }

  return {
    id: row.id,
    amount: Number(row.amount),
    paymentMethod: row.paymentMethod,
    transactionDate: row.transactionDate,
    referenceNumber: row.referenceNumber,
    invoice: {
      id: row.invoiceId,
      amountDue: Number(row.invoiceAmountDue),
      amountPaid: Number(row.invoiceAmountPaid),
      balance: Number(row.invoiceBalance),
      status: row.invoiceStatus,
      dueDate: row.invoiceDueDate,
      issuedDate: row.invoiceIssuedDate,
    },
    student: {
      id: row.studentId,
      firstName: row.studentFirstName,
      lastName: row.studentLastName,
      registrationNumber: row.studentRegistrationNumber,
      studentNumber: row.studentNumber,
      email: row.studentEmail,
    },
  };
}

// Create a new payment record
export async function createPayment(data: PaymentCreateData) {
  const authUser = await getAuthUser();
  if (!authUser) throw new ActionError('Unauthorized');

  // Validate required fields
  if (!data.invoiceId || !data.studentId || data.amount <= 0 || !data.paymentMethod) {
    throw new ActionError('Invoice, student, amount, and payment method are required');
  }

  // Check if invoice exists
  const invoice = await db
    .select()
    .from(invoices)
    .where(eq(invoices.id, data.invoiceId))
    .then(res => res[0]);

  if (!invoice) {
    throw new ActionError('Invoice not found');
  }

  // Check if student exists
  const student = await db
    .select()
    .from(students)
    .where(eq(students.id, data.studentId))
    .then(res => res[0]);

  if (!student) {
    throw new ActionError('Student not found');
  }

  // Check if payment amount exceeds invoice balance
  const newBalance = Number(invoice.balance) - data.amount;
  if (newBalance < 0) {
    throw new ActionError('Payment amount exceeds invoice balance');
  }

  // Start transaction
  const [insertedPayment] = await db.transaction(async (tx) => {
    // Create payment
    const [payment] = await tx
      .insert(payments)
      .values({
        invoiceId: data.invoiceId,
        studentId: data.studentId,
        amount: data.amount.toFixed(2),
        paymentMethod: data.paymentMethod,
        referenceNumber: data.referenceNumber || null,
      })
      .returning();

    if (!payment) {
      throw new ActionError('Failed to create payment');
    }

    // Update invoice
    const newAmountPaid = Number(invoice.amountPaid) + data.amount;
    await tx
      .update(invoices)
      .set({
        amountPaid: newAmountPaid.toFixed(2),
        balance: newBalance.toFixed(2),
        status: newBalance <= 0 ? 'paid' : 'partially_paid',
      })
      .where(eq(invoices.id, data.invoiceId));

    return [payment];
  });

  // Log the action
  await db.insert(userLogs).values({
    userId: authUser.userId,
    action: 'create',
    targetTable: 'payments',
    targetId: insertedPayment.id,
    description: `Recorded payment of ${data.amount} for invoice ${data.invoiceId}`,
  });

  revalidatePath('/dashboard/admin/payments');
  return insertedPayment;
}

// Update payment record
export async function updatePayment(paymentId: number, data: PaymentUpdateData) {
  const authUser = await getAuthUser();
  if (!authUser) throw new Error('Unauthorized');

  // Get current payment details
  const currentPayment = await db
    .select()
    .from(payments)
    .where(eq(payments.id, paymentId))
    .then((res) => res[0]);

  if (!currentPayment) {
    throw new ActionError('Payment not found');
  }

  // If amount is being updated, we need to adjust the invoice
  if (data.amount !== undefined) {
    const invoice = await db
      .select()
      .from(invoices)
      .where(eq(invoices.id, currentPayment.invoiceId))
      .then(res => res[0]);

    if (!invoice) {
      throw new ActionError('Invoice not found');
    }

    const amountDifference = data.amount - Number(currentPayment.amount);
    const newAmountPaid = Number(invoice.amountPaid) + amountDifference;
    const newBalance = Number(invoice.balance) - amountDifference;

    if (newBalance < 0) {
      throw new ActionError('New payment amount would result in negative invoice balance');
    }

    // Start transaction for amount update
    await db.transaction(async (tx) => {
      // Update payment
      await tx
        .update(payments)
        .set({
          amount: data.amount?.toFixed(2),
          paymentMethod: data.paymentMethod,
          referenceNumber: data.referenceNumber,
        })
        .where(eq(payments.id, paymentId));

      // Update invoice
      await tx
        .update(invoices)
        .set({
          amountPaid: newAmountPaid.toFixed(2),
          balance: newBalance.toFixed(2),
          status: newBalance <= 0 ? 'paid' : 'partially_paid',
        })
        .where(eq(invoices.id, currentPayment.invoiceId));
    });
  } else {
    // Simple update for non-amount fields
    await db
      .update(payments)
      .set({
        paymentMethod: data.paymentMethod,
        referenceNumber: data.referenceNumber,
      })
      .where(eq(payments.id, paymentId));
  }

  // Log the action
  await db.insert(userLogs).values({
    userId: authUser.userId,
    action: 'update',
    targetTable: 'payments',
    targetId: paymentId,
    description: `Updated payment record details`,
  });

  revalidatePath('/dashboard/admin/payments');
  revalidatePath(`/dashboard/admin/payments/${paymentId}`);
  return { success: true };
}

// Delete a payment record (with invoice adjustment)
export async function deletePayment(paymentId: number) {
  const authUser = await getAuthUser();
  if (!authUser) throw new Error('Unauthorized');

  // Get payment details
  const payment = await db
    .select()
    .from(payments)
    .where(eq(payments.id, paymentId))
    .then((res) => res[0]);

  if (!payment) {
    throw new ActionError('Payment not found');
  }

  // Get associated invoice
  const invoice = await db
    .select()
    .from(invoices)
    .where(eq(invoices.id, payment.invoiceId))
    .then(res => res[0]);

  if (!invoice) {
    throw new ActionError('Invoice not found');
  }

  // Calculate new invoice amounts
  const paymentAmount = Number(payment.amount);
  const newAmountPaid = Number(invoice.amountPaid) - paymentAmount;
  const newBalance = Number(invoice.balance) + paymentAmount;

  // Start transaction
  await db.transaction(async (tx) => {
    // Delete payment
    await tx
      .delete(payments)
      .where(eq(payments.id, paymentId));

    // Update invoice
    await tx
      .update(invoices)
      .set({
        amountPaid: newAmountPaid.toFixed(2),
        balance: newBalance.toFixed(2),
        status: newBalance >= Number(invoice.amountDue) ? 'unpaid' : 'partially_paid',
      })
      .where(eq(invoices.id, payment.invoiceId));
  });

  // Log the action
  await db.insert(userLogs).values({
    userId: authUser.userId,
    action: 'delete',
    targetTable: 'payments',
    targetId: paymentId,
    description: `Deleted payment of ${paymentAmount} for invoice ${payment.invoiceId}`,
  });

  revalidatePath('/dashboard/admin/payments');
  return { success: true };
}

// Get payments for a specific invoice
export async function getPaymentsForInvoice(invoiceId: number): Promise<PaymentWithDetails[]> {
  const authUser = await getAuthUser();
  if (!authUser) throw new Error('Unauthorized');

  const raw = await db
    .select({
      id: payments.id,
      amount: payments.amount,
      paymentMethod: payments.paymentMethod,
      transactionDate: payments.transactionDate,
      referenceNumber: payments.referenceNumber,
      invoiceId: invoices.id,
      invoiceAmountDue: invoices.amountDue,
      invoiceAmountPaid: invoices.amountPaid,
      invoiceBalance: invoices.balance,
      invoiceStatus: invoices.status,
      studentId: students.id,
      studentFirstName: students.firstName,
      studentLastName: students.lastName,
      studentRegistrationNumber: students.registrationNumber,
    })
    .from(payments)
    .innerJoin(invoices, eq(invoices.id, payments.invoiceId))
    .innerJoin(students, eq(students.id, payments.studentId))
    .where(eq(payments.invoiceId, invoiceId))
    .orderBy(desc(payments.transactionDate));

  return raw.map(row => ({
    id: row.id,
    amount: Number(row.amount),
    paymentMethod: row.paymentMethod,
    transactionDate: row.transactionDate,
    referenceNumber: row.referenceNumber,
    invoice: {
      id: row.invoiceId,
      amountDue: Number(row.invoiceAmountDue),
      amountPaid: Number(row.invoiceAmountPaid),
      balance: Number(row.invoiceBalance),
      status: row.invoiceStatus,
    },
    student: {
      id: row.studentId,
      firstName: row.studentFirstName,
      lastName: row.studentLastName,
      registrationNumber: row.studentRegistrationNumber,
    },
  }));
}

// Get payments for a specific student
export async function getPaymentsForStudent(studentId: number): Promise<PaymentWithDetails[]> {
  const authUser = await getAuthUser();
  if (!authUser) throw new Error('Unauthorized');

  const raw = await db
    .select({
      id: payments.id,
      amount: payments.amount,
      paymentMethod: payments.paymentMethod,
      transactionDate: payments.transactionDate,
      referenceNumber: payments.referenceNumber,
      invoiceId: invoices.id,
      invoiceAmountDue: invoices.amountDue,
      invoiceAmountPaid: invoices.amountPaid,
      invoiceBalance: invoices.balance,
      invoiceStatus: invoices.status,
      studentId: students.id,
      studentFirstName: students.firstName,
      studentLastName: students.lastName,
      studentRegistrationNumber: students.registrationNumber,
    })
    .from(payments)
    .innerJoin(invoices, eq(invoices.id, payments.invoiceId))
    .innerJoin(students, eq(students.id, payments.studentId))
    .where(eq(payments.studentId, studentId))
    .orderBy(desc(payments.transactionDate));

  return raw.map(row => ({
    id: row.id,
    amount: Number(row.amount),
    paymentMethod: row.paymentMethod,
    transactionDate: row.transactionDate,
    referenceNumber: row.referenceNumber,
    invoice: {
      id: row.invoiceId,
      amountDue: Number(row.invoiceAmountDue),
      amountPaid: Number(row.invoiceAmountPaid),
      balance: Number(row.invoiceBalance),
      status: row.invoiceStatus,
    },
    student: {
      id: row.studentId,
      firstName: row.studentFirstName,
      lastName: row.studentLastName,
      registrationNumber: row.studentRegistrationNumber,
    },
  }));
}