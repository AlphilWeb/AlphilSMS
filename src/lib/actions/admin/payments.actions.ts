// app/actions/payments.ts
'use server';

import { db } from '@/lib/db';
import { 
  payments,
  invoices,
  students,
  // NewPayment,
  SelectPayment
} from '@/lib/db/schema';
import { eq, sql, sum } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

// Types from your schema
export type PaymentData = {
  invoiceId: number;
  studentId: number;
  amount: string;
  paymentMethod: string;
  referenceNumber?: string | null;
};

export type PaymentWithDetails = {
  id: number;
  amount: string;
  paymentMethod: string;
  transactionDate: Date;
  referenceNumber?: string | null;
  invoice: {
    id: number;
    amountDue: string;
    amountPaid: string;
    balance: string;
    status: string;
    dueDate: Date;
  };
  student: {
    id: number;
    firstName: string;
    lastName: string;
    registrationNumber: string;
  };
};

export type PaymentSummary = {
  totalPayments: number;
  totalRevenue: number;
  paymentMethods: {
    method: string;
    count: number;
    total: number;
  }[];
};

/**
 * Fetches all payments with invoice and student details
 */
export async function getAllPayments(): Promise<PaymentWithDetails[]> {
  try {
    const rawPayments = await db
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
        studentId: students.id,
        studentFirstName: students.firstName,
        studentLastName: students.lastName,
        studentRegistrationNumber: students.registrationNumber,
      })
      .from(payments)
      .leftJoin(invoices, eq(payments.invoiceId, invoices.id))
      .leftJoin(students, eq(payments.studentId, students.id))
      .orderBy(sql`${payments.transactionDate} DESC`);

    const mappedData: PaymentWithDetails[] = rawPayments
      .filter(row => row.invoiceId !== null && row.studentId !== null)
      .map(row => ({
        id: row.id,
        amount: String(row.amount),
        paymentMethod: row.paymentMethod,
        transactionDate: new Date(row.transactionDate),
        referenceNumber: row.referenceNumber ?? null,
        invoice: {
          id: row.invoiceId!,
          amountDue: String(row.invoiceAmountDue),
          amountPaid: String(row.invoiceAmountPaid),
          balance: String(row.invoiceBalance),
          status: row.invoiceStatus!,
          dueDate: new Date(row.invoiceDueDate!),
        },
        student: {
          id: row.studentId!,
          firstName: row.studentFirstName ?? '',
          lastName: row.studentLastName ?? '',
          registrationNumber: row.studentRegistrationNumber ?? '',
        },
      }));

    return mappedData;
  } catch (error) {
    console.error('Failed to fetch payments:', error);
    throw new Error('Failed to fetch payments');
  }
}

/**
 * Fetches payments by student ID
 */
export async function getPaymentsByStudent(studentId: number): Promise<PaymentWithDetails[]> {
  try {
    const rawPayments = await db
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
        studentId: students.id,
        studentFirstName: students.firstName,
        studentLastName: students.lastName,
        studentRegistrationNumber: students.registrationNumber,
      })
      .from(payments)
      .leftJoin(invoices, eq(payments.invoiceId, invoices.id))
      .leftJoin(students, eq(invoices.studentId, students.id))
      .where(eq(invoices.studentId, studentId))
      .orderBy(sql`${payments.transactionDate} DESC`);

    const mappedData: PaymentWithDetails[] = rawPayments
      .filter(row => row.invoiceId !== null && row.studentId !== null)
      .map(row => ({
        id: row.id,
        amount: String(row.amount),
        paymentMethod: row.paymentMethod,
        transactionDate: new Date(row.transactionDate),
        referenceNumber: row.referenceNumber ?? null,
        invoice: {
          id: row.invoiceId!,
          amountDue: String(row.invoiceAmountDue),
          amountPaid: String(row.invoiceAmountPaid),
          balance: String(row.invoiceBalance),
          status: row.invoiceStatus!,
          dueDate: new Date(row.invoiceDueDate!),
        },
        student: {
          id: row.studentId!,
          firstName: row.studentFirstName ?? '',
          lastName: row.studentLastName ?? '',
          registrationNumber: row.studentRegistrationNumber ?? '',
        },
      }));

    return mappedData;
  } catch (error) {
    console.error(`Failed to fetch payments for student ${studentId}:`, error);
    throw new Error('Failed to fetch payments by student');
  }
}

/**
 * Fetches payments by invoice ID
 */
export async function getPaymentsByInvoice(invoiceId: number): Promise<PaymentWithDetails[]> {
  try {
    const rawPayments = await db
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
        studentId: students.id,
        studentFirstName: students.firstName,
        studentLastName: students.lastName,
        studentRegistrationNumber: students.registrationNumber,
      })
      .from(payments)
      .leftJoin(invoices, eq(payments.invoiceId, invoices.id))
      .leftJoin(students, eq(invoices.studentId, students.id))
      .where(eq(payments.invoiceId, invoiceId))
      .orderBy(sql`${payments.transactionDate} DESC`);

    const mappedData: PaymentWithDetails[] = rawPayments
      .filter(row => row.invoiceId !== null && row.studentId !== null)
      .map(row => ({
        id: row.id,
        amount: String(row.amount),
        paymentMethod: row.paymentMethod,
        transactionDate: new Date(row.transactionDate),
        referenceNumber: row.referenceNumber ?? null,
        invoice: {
          id: row.invoiceId!,
          amountDue: String(row.invoiceAmountDue),
          amountPaid: String(row.invoiceAmountPaid),
          balance: String(row.invoiceBalance),
          status: row.invoiceStatus!,
          dueDate: new Date(row.invoiceDueDate!),
        },
        student: {
          id: row.studentId!,
          firstName: row.studentFirstName ?? '',
          lastName: row.studentLastName ?? '',
          registrationNumber: row.studentRegistrationNumber ?? '',
        },
      }));

    return mappedData;
  } catch (error) {
    console.error(`Failed to fetch payments for invoice ${invoiceId}:`, error);
    throw new Error('Failed to fetch payments by invoice');
  }
}

/**
 * Fetches a payment by ID with details
 */
export async function getPaymentById(paymentId: number): Promise<PaymentWithDetails | null> {
  try {
    const rawPayment = await db
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
        studentId: students.id,
        studentFirstName: students.firstName,
        studentLastName: students.lastName,
        studentRegistrationNumber: students.registrationNumber,
      })
      .from(payments)
      .leftJoin(invoices, eq(payments.invoiceId, invoices.id))
      .leftJoin(students, eq(invoices.studentId, students.id))
      .where(eq(payments.id, paymentId))
      .limit(1);

    const payment = rawPayment[0];
    if (!payment || payment.invoiceId === null || payment.studentId === null) {
      return null;
    }

    const mappedData: PaymentWithDetails = {
      id: payment.id,
      amount: String(payment.amount),
      paymentMethod: payment.paymentMethod,
      transactionDate: new Date(payment.transactionDate),
      referenceNumber: payment.referenceNumber ?? null,
      invoice: {
        id: payment.invoiceId!,
        amountDue: String(payment.invoiceAmountDue),
        amountPaid: String(payment.invoiceAmountPaid),
        balance: String(payment.invoiceBalance),
        status: payment.invoiceStatus!,
        dueDate: new Date(payment.invoiceDueDate!),
      },
      student: {
        id: payment.studentId!,
        firstName: payment.studentFirstName ?? '',
        lastName: payment.studentLastName ?? '',
        registrationNumber: payment.studentRegistrationNumber ?? '',
      },
    };

    return mappedData;
  } catch (error) {
    console.error(`Failed to fetch payment ${paymentId}:`, error);
    throw new Error('Failed to fetch payment by ID');
  }
}

/**
 * Records a new payment and updates the associated invoice
 */
export async function recordPayment(paymentData: PaymentData): Promise<SelectPayment> {
  try {
    // 1. Create the payment record
    const paymentResult = await db.insert(payments).values({
      ...paymentData,
      transactionDate: new Date(),
    }).returning();

    // 2. Find and update the invoice
    const invoice = await db
      .select()
      .from(invoices)
      .where(eq(invoices.id, paymentData.invoiceId))
      .limit(1);

    if (invoice[0]) {
      const newAmountPaid = (parseFloat(invoice[0].amountPaid) + parseFloat(paymentData.amount)).toString();
      const newBalance = (parseFloat(invoice[0].amountDue) - parseFloat(newAmountPaid)).toString();
      
      let newStatus = invoice[0].status;
      if (parseFloat(newBalance) <= 0) {
        newStatus = 'paid';
      } else if (newStatus === 'unpaid' && parseFloat(newAmountPaid) > 0) {
        newStatus = 'partial';
      }

      await db
        .update(invoices)
        .set({
          amountPaid: newAmountPaid,
          balance: newBalance,
          status: newStatus,
        })
        .where(eq(invoices.id, paymentData.invoiceId));
    }

    revalidatePath('/admin/payments');
    revalidatePath(`/admin/invoices/${paymentData.invoiceId}`);
    return paymentResult[0];

  } catch (error) {
    console.error('Failed to record payment:', error);
    // You can now be more specific about the error message
    throw new Error('Failed to record payment due to a database operation error.');
  }
}

/**
 * Updates an existing payment record
 */
export async function updatePayment(
  paymentId: number,
  paymentData: Partial<PaymentData>
): Promise<SelectPayment> {
  try {
    return await db.transaction(async (tx) => {
      const existingPayment = await tx
        .select()
        .from(payments)
        .where(eq(payments.id, paymentId))
        .limit(1);

      if (!existingPayment[0]) {
        throw new Error('Payment not found');
      }

      // Update the payment record
      const paymentResult = await tx
        .update(payments)
        .set(paymentData)
        .where(eq(payments.id, paymentId))
        .returning();

      // If amount was changed, update the associated invoice
      if (paymentData.amount !== undefined) {
        const invoice = await tx
          .select()
          .from(invoices)
          .where(eq(invoices.id, existingPayment[0].invoiceId))
          .limit(1);

        if (invoice[0]) {
          // Recalculate all payments for this invoice
          const paymentsSum = await tx
            .select({ total: sum(payments.amount) })
            .from(payments)
            .where(eq(payments.invoiceId, invoice[0].id));

          const newAmountPaid = paymentsSum[0]?.total?.toString() || '0';
          const newBalance = (parseFloat(invoice[0].amountDue) - parseFloat(newAmountPaid)).toString();
          
          let newStatus = invoice[0].status;
          if (parseFloat(newBalance) <= 0) {
            newStatus = 'paid';
          } else if (newStatus === 'unpaid' && parseFloat(newAmountPaid) > 0) {
            newStatus = 'partial';
          }

          await tx
            .update(invoices)
            .set({
              amountPaid: newAmountPaid,
              balance: newBalance,
              status: newStatus,
            })
            .where(eq(invoices.id, invoice[0].id));
        }
      }

      revalidatePath('/admin/payments');
      revalidatePath(`/admin/invoices/${existingPayment[0].invoiceId}`);
      return paymentResult[0];
    });
  } catch (error) {
    console.error(`Failed to update payment ${paymentId}:`, error);
    throw new Error('Failed to update payment');
  }
}

/**
 * Deletes a payment record and updates the associated invoice
 */
export async function deletePayment(paymentId: number): Promise<{ success: boolean }> {
  try {
    // 1. Find the payment and its associated invoice ID
    const payment = await db
      .select()
      .from(payments)
      .where(eq(payments.id, paymentId))
      .limit(1);

    if (!payment[0]) {
      throw new Error('Payment not found');
    }

    const invoiceId = payment[0].invoiceId;

    // 2. Delete the payment
    await db.delete(payments).where(eq(payments.id, paymentId));

    // 3. Recalculate and update the associated invoice
    const paymentsSum = await db
      .select({ total: sum(payments.amount) })
      .from(payments)
      .where(eq(payments.invoiceId, invoiceId));

    const invoice = await db
      .select()
      .from(invoices)
      .where(eq(invoices.id, invoiceId))
      .limit(1);

    if (invoice[0]) {
      const newAmountPaid = paymentsSum[0]?.total?.toString() || '0';
      const newBalance = (parseFloat(invoice[0].amountDue) - parseFloat(newAmountPaid)).toString();
      
      let newStatus = invoice[0].status;
      if (parseFloat(newBalance) <= 0) {
        newStatus = 'paid';
      } else if (newStatus === 'unpaid' && parseFloat(newAmountPaid) > 0) {
        newStatus = 'partial';
      } else if (parseFloat(newAmountPaid) === 0) {
        newStatus = 'unpaid';
      }

      await db
        .update(invoices)
        .set({
          amountPaid: newAmountPaid,
          balance: newBalance,
          status: newStatus,
        })
        .where(eq(invoices.id, invoiceId));
    }

    revalidatePath('/admin/payments');
    revalidatePath(`/admin/invoices/${invoiceId}`);

    return { success: true };
  } catch (error) {
    console.error(`Failed to delete payment ${paymentId}:`, error);
    throw new Error('Failed to delete payment');
  }
}







/**
 * Gets payment summary statistics
 */
export async function getPaymentSummary(): Promise<PaymentSummary> {
  try {
    const [totalPaymentsResult, totalRevenueResult, paymentMethodsResult] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(payments),
      db.select({ total: sum(payments.amount) }).from(payments),
      db
        .select({
          method: payments.paymentMethod,
          count: sql<number>`count(*)`,
          total: sum(payments.amount),
        })
        .from(payments)
        .groupBy(payments.paymentMethod),
    ]);

    return {
      totalPayments: totalPaymentsResult[0]?.count ?? 0,
      totalRevenue: parseFloat(totalRevenueResult[0]?.total?.toString() ?? '0'),
      paymentMethods: paymentMethodsResult.map(row => ({
        method: row.method,
        count: row.count,
        total: parseFloat(row.total?.toString() ?? '0'),
      })),
    };
  } catch (error) {
    console.error('Failed to fetch payment summary:', error);
    throw new Error('Failed to fetch payment summary');
  }
}

/**
 * Gets recent payments (last 10)
 */
export async function getRecentPayments(): Promise<PaymentWithDetails[]> {
  try {
    const rawPayments = await db
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
        studentId: students.id,
        studentFirstName: students.firstName,
        studentLastName: students.lastName,
        studentRegistrationNumber: students.registrationNumber,
      })
      .from(payments)
      .leftJoin(invoices, eq(payments.invoiceId, invoices.id))
      .leftJoin(students, eq(invoices.studentId, students.id))
      .orderBy(sql`${payments.transactionDate} DESC`)
      .limit(10);

    const mappedData: PaymentWithDetails[] = rawPayments
      .filter(row => row.invoiceId !== null && row.studentId !== null)
      .map(row => ({
        id: row.id,
        amount: String(row.amount),
        paymentMethod: row.paymentMethod,
        transactionDate: new Date(row.transactionDate),
        referenceNumber: row.referenceNumber ?? null,
        invoice: {
          id: row.invoiceId!,
          amountDue: String(row.invoiceAmountDue),
          amountPaid: String(row.invoiceAmountPaid),
          balance: String(row.invoiceBalance),
          status: row.invoiceStatus!,
          dueDate: new Date(row.invoiceDueDate!),
        },
        student: {
          id: row.studentId!,
          firstName: row.studentFirstName ?? '',
          lastName: row.studentLastName ?? '',
          registrationNumber: row.studentRegistrationNumber ?? '',
        },
      }));

    return mappedData;
  } catch (error) {
    console.error('Failed to fetch recent payments:', error);
    throw new Error('Failed to fetch recent payments');
  }
}