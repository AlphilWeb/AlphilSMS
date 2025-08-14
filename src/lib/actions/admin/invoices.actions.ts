// app/actions/invoices.ts
'use server';

import { db } from '@/lib/db';
import { 
  invoices,
  payments,
  students,
  semesters,
  feeStructures,
  programs,
//   NewInvoice,
  SelectInvoice,
//   NewPayment,
  SelectPayment
} from '@/lib/db/schema';
import { and, eq, sql, sum, inArray } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

// Types from your schema
export type InvoiceData = {
  studentId: number;
  semesterId: number;
  feeStructureId?: number | null;
  amountDue: string;
  amountPaid?: string;
  balance?: string;
  dueDate: string;
  status: string;
};

export type PaymentData = {
  invoiceId: number;
  studentId: number;
  amount: string;
  paymentMethod: string;
  referenceNumber?: string | null;
};

export type InvoiceWithDetails = {
  id: number;
  amountDue: string;
  amountPaid: string;
  balance: string;
  dueDate: Date;
  issuedDate: Date;
  status: string;
  student: {
    id: number;
    firstName: string;
    lastName: string;
    registrationNumber: string;
  };
  semester: {
    id: number;
    name: string;
  };
  feeStructure?: {
    id: number;
    totalAmount: string;
    description?: string | null;
    program: {
      id: number;
      name: string;
    };
  } | null;
  payments: Array<{
    id: number;
    amount: string;
    paymentMethod: string;
    transactionDate: Date;
    referenceNumber?: string | null;
  }>;
};

export type PaymentWithDetails = {
  id: number;
  amount: string;
  paymentMethod: string;
  transactionDate: string;
  referenceNumber?: string | null;
  invoice: {
    id: number;
    amountDue: string;
    balance: string;
  };
  student: {
    id: number;
    firstName: string;
    lastName: string;
  };
};

/**
 * Fetches all invoices with student, semester, and payment details
 */
export async function getAllInvoices(): Promise<InvoiceWithDetails[]> {
  try {
    const rawInvoices = await db
      .select({
        id: invoices.id,
        amountDue: invoices.amountDue,
        amountPaid: invoices.amountPaid,
        balance: invoices.balance,
        dueDate: invoices.dueDate,
        issuedDate: invoices.issuedDate,
        status: invoices.status,
        studentId: students.id,
        studentFirstName: students.firstName,
        studentLastName: students.lastName,
        studentRegistrationNumber: students.registrationNumber,
        semesterId: semesters.id,
        semesterName: semesters.name,
        feeStructureId: feeStructures.id,
        feeStructureAmount: feeStructures.totalAmount,
        feeStructureDescription: feeStructures.description,
        programId: programs.id,
        programName: programs.name,
      })
      .from(invoices)
      .leftJoin(students, eq(invoices.studentId, students.id))
      .leftJoin(semesters, eq(invoices.semesterId, semesters.id))
      .leftJoin(feeStructures, eq(invoices.feeStructureId, feeStructures.id))
      .leftJoin(programs, eq(feeStructures.programId, programs.id));

    const invoiceIds = rawInvoices.map(inv => inv.id);
    const rawPayments = invoiceIds.length > 0 ? await db
      .select({
        id: payments.id,
        amount: payments.amount,
        paymentMethod: payments.paymentMethod,
        transactionDate: payments.transactionDate,
        referenceNumber: payments.referenceNumber,
        invoiceId: payments.invoiceId,
      })
      .from(payments)
      .where(inArray(payments.invoiceId, invoiceIds)) : [];

    const paymentsByInvoiceId = rawPayments.reduce((acc, payment) => {
      if (!acc[payment.invoiceId]) {
        acc[payment.invoiceId] = [];
      }
      acc[payment.invoiceId].push(payment);
      return acc;
    }, {} as Record<number, typeof rawPayments>);

    const mappedData: InvoiceWithDetails[] = rawInvoices
      .filter(row => row.studentId !== null && row.semesterId !== null)
      .map(row => ({
        id: row.id,
        amountDue: String(row.amountDue),
        amountPaid: String(row.amountPaid),
        balance: String(row.balance),
        dueDate: new Date(row.dueDate),
        issuedDate: new Date(row.issuedDate),
        status: row.status,
        student: {
          id: row.studentId!,
          firstName: row.studentFirstName ?? '',
          lastName: row.studentLastName ?? '',
          registrationNumber: row.studentRegistrationNumber ?? '',
        },
        semester: {
          id: row.semesterId!,
          name: row.semesterName ?? '',
        },
        feeStructure: row.feeStructureId && row.programId ? {
          id: row.feeStructureId,
          totalAmount: String(row.feeStructureAmount),
          description: row.feeStructureDescription ?? null,
          program: {
            id: row.programId,
            name: row.programName ?? '',
          },
        } : null,
        payments: (paymentsByInvoiceId[row.id] || []).map(payment => ({
          id: payment.id,
          amount: String(payment.amount),
          paymentMethod: payment.paymentMethod,
          transactionDate: new Date(payment.transactionDate),
          referenceNumber: payment.referenceNumber ?? null,
        })),
      }));

    return mappedData;
  } catch (error) {
    console.error('Failed to fetch invoices:', error);
    throw new Error('Failed to fetch invoices');
  }
}

/**
 * Fetches invoices by student
 */
export async function getInvoicesByStudent(studentId: number): Promise<InvoiceWithDetails[]> {
  try {
    const rawInvoices = await db
      .select({
        id: invoices.id,
        amountDue: invoices.amountDue,
        amountPaid: invoices.amountPaid,
        balance: invoices.balance,
        dueDate: invoices.dueDate,
        issuedDate: invoices.issuedDate,
        status: invoices.status,
        studentId: students.id,
        studentFirstName: students.firstName,
        studentLastName: students.lastName,
        studentRegistrationNumber: students.registrationNumber,
        semesterId: semesters.id,
        semesterName: semesters.name,
        feeStructureId: feeStructures.id,
        feeStructureAmount: feeStructures.totalAmount,
        feeStructureDescription: feeStructures.description,
        programId: programs.id,
        programName: programs.name,
      })
      .from(invoices)
      .leftJoin(students, eq(invoices.studentId, students.id))
      .leftJoin(semesters, eq(invoices.semesterId, semesters.id))
      .leftJoin(feeStructures, eq(invoices.feeStructureId, feeStructures.id))
      .leftJoin(programs, eq(feeStructures.programId, programs.id))
      .where(eq(invoices.studentId, studentId));

    const invoiceIds = rawInvoices.map(inv => inv.id);
    const rawPayments = invoiceIds.length > 0 ? await db
      .select({
        id: payments.id,
        amount: payments.amount,
        paymentMethod: payments.paymentMethod,
        transactionDate: payments.transactionDate,
        referenceNumber: payments.referenceNumber,
        invoiceId: payments.invoiceId,
      })
      .from(payments)
      .where(inArray(payments.invoiceId, invoiceIds)) : [];

    const paymentsByInvoiceId = rawPayments.reduce((acc, payment) => {
      if (!acc[payment.invoiceId]) {
        acc[payment.invoiceId] = [];
      }
      acc[payment.invoiceId].push(payment);
      return acc;
    }, {} as Record<number, typeof rawPayments>);

    const mappedData: InvoiceWithDetails[] = rawInvoices
      .filter(row => row.studentId !== null && row.semesterId !== null)
      .map(row => ({
        id: row.id,
        amountDue: String(row.amountDue),
        amountPaid: String(row.amountPaid),
        balance: String(row.balance),
        dueDate: new Date(row.dueDate),
        issuedDate: new Date(row.issuedDate),
        status: row.status,
        student: {
          id: row.studentId!,
          firstName: row.studentFirstName ?? '',
          lastName: row.studentLastName ?? '',
          registrationNumber: row.studentRegistrationNumber ?? '',
        },
        semester: {
          id: row.semesterId!,
          name: row.semesterName ?? '',
        },
        feeStructure: row.feeStructureId && row.programId ? {
          id: row.feeStructureId,
          totalAmount: String(row.feeStructureAmount),
          description: row.feeStructureDescription ?? null,
          program: {
            id: row.programId,
            name: row.programName ?? '',
          },
        } : null,
        payments: (paymentsByInvoiceId[row.id] || []).map(payment => ({
          id: payment.id,
          amount: String(payment.amount),
          paymentMethod: payment.paymentMethod,
          transactionDate: new Date(payment.transactionDate),
          referenceNumber: payment.referenceNumber ?? null,
        })),
      }));

    return mappedData;
  } catch (error) {
    console.error(`Failed to fetch invoices for student ${studentId}:`, error);
    throw new Error('Failed to fetch invoices by student');
  }
}

/**
 * Fetches invoices by semester
 */export async function getInvoicesBySemester(
  semesterId: number
): Promise<InvoiceWithDetails[]> {
  try {
    const rawInvoices = await db
      .select({
        id: invoices.id,
        amountDue: invoices.amountDue,
        amountPaid: invoices.amountPaid,
        balance: invoices.balance,
        dueDate: invoices.dueDate,
        issuedDate: invoices.issuedDate,
        status: invoices.status,
        studentId: students.id,
        studentFirstName: students.firstName,
        studentLastName: students.lastName,
        studentRegistrationNumber: students.registrationNumber,
        semesterId: semesters.id,
        semesterName: semesters.name,
        feeStructureId: feeStructures.id,
        feeStructureAmount: feeStructures.totalAmount,
        feeStructureDescription: feeStructures.description,
        programId: programs.id,
        programName: programs.name,
      })
      .from(invoices)
      .leftJoin(students, eq(invoices.studentId, students.id))
      .leftJoin(semesters, eq(invoices.semesterId, semesters.id))
      .leftJoin(feeStructures, eq(invoices.feeStructureId, feeStructures.id))
      .leftJoin(programs, eq(feeStructures.programId, programs.id))
      .where(eq(invoices.semesterId, semesterId));

    const invoiceIds = rawInvoices.map((inv) => inv.id);
    const rawPayments =
      invoiceIds.length > 0
        ? await db
            .select({
              id: payments.id,
              amount: payments.amount,
              paymentMethod: payments.paymentMethod,
              transactionDate: payments.transactionDate,
              referenceNumber: payments.referenceNumber,
              invoiceId: payments.invoiceId,
            })
            .from(payments)
            .where(inArray(payments.invoiceId, invoiceIds))
        : [];

    const paymentsByInvoiceId = rawPayments.reduce((acc, payment) => {
      if (!acc[payment.invoiceId]) {
        acc[payment.invoiceId] = [];
      }
      acc[payment.invoiceId].push(payment);
      return acc;
    }, {} as Record<number, typeof rawPayments>);

    const mappedData: InvoiceWithDetails[] = rawInvoices
      .filter((row) => row.studentId !== null && row.semesterId !== null)
      .map((row) => ({
        id: row.id,
        amountDue: String(row.amountDue),
        amountPaid: String(row.amountPaid),
        balance: String(row.balance),
        dueDate: new Date(row.dueDate),
        issuedDate: new Date(row.issuedDate),
        status: row.status,
        student: {
          id: row.studentId!,
          firstName: row.studentFirstName ?? '',
          lastName: row.studentLastName ?? '',
          registrationNumber: row.studentRegistrationNumber ?? '',
        },
        semester: {
          id: row.semesterId!,
          name: row.semesterName ?? '',
        },
        feeStructure:
          row.feeStructureId && row.programId
            ? {
                id: row.feeStructureId,
                totalAmount: String(row.feeStructureAmount),
                description: row.feeStructureDescription ?? null,
                program: {
                  id: row.programId,
                  name: row.programName ?? '',
                },
              }
            : null,
        payments: (paymentsByInvoiceId[row.id] || []).map((payment) => ({
          id: payment.id,
          amount: String(payment.amount),
          paymentMethod: payment.paymentMethod,
          transactionDate: new Date(payment.transactionDate),
          referenceNumber: payment.referenceNumber ?? null,
        })),
      }));

    return mappedData;
  } catch (error) {
    console.error(`Failed to fetch invoices for semester ${semesterId}:`, error);
    throw new Error('Failed to fetch invoices by semester');
  }
}

/**
 * Fetches invoices by status
 */
export async function getInvoicesByStatus(status: string): Promise<InvoiceWithDetails[]> {
  try {
    const rawInvoices = await db
      .select({
        id: invoices.id,
        amountDue: invoices.amountDue,
        amountPaid: invoices.amountPaid,
        balance: invoices.balance,
        dueDate: invoices.dueDate,
        issuedDate: invoices.issuedDate,
        status: invoices.status,
        studentId: students.id,
        studentFirstName: students.firstName,
        studentLastName: students.lastName,
        studentRegistrationNumber: students.registrationNumber,
        semesterId: semesters.id,
        semesterName: semesters.name,
        feeStructureId: feeStructures.id,
        feeStructureAmount: feeStructures.totalAmount,
        feeStructureDescription: feeStructures.description,
        programId: programs.id,
        programName: programs.name,
      })
      .from(invoices)
      .leftJoin(students, eq(invoices.studentId, students.id))
      .leftJoin(semesters, eq(invoices.semesterId, semesters.id))
      .leftJoin(feeStructures, eq(invoices.feeStructureId, feeStructures.id))
      .leftJoin(programs, eq(feeStructures.programId, programs.id))
      .where(eq(invoices.status, status));

    const invoiceIds = rawInvoices.map(inv => inv.id);
    const rawPayments = invoiceIds.length > 0 ? await db
      .select({
        id: payments.id,
        amount: payments.amount,
        paymentMethod: payments.paymentMethod,
        transactionDate: payments.transactionDate,
        referenceNumber: payments.referenceNumber,
        invoiceId: payments.invoiceId,
      })
      .from(payments)
      .where(inArray(payments.invoiceId, invoiceIds)) : [];

    const paymentsByInvoiceId = rawPayments.reduce((acc, payment) => {
      if (!acc[payment.invoiceId]) {
        acc[payment.invoiceId] = [];
      }
      acc[payment.invoiceId].push(payment);
      return acc;
    }, {} as Record<number, typeof rawPayments>);

    const mappedData: InvoiceWithDetails[] = rawInvoices
      .filter(row => row.studentId !== null && row.semesterId !== null)
      .map(row => ({
        id: row.id,
        amountDue: String(row.amountDue),
        amountPaid: String(row.amountPaid),
        balance: String(row.balance),
        dueDate: new Date(row.dueDate),
        issuedDate: new Date(row.issuedDate),
        status: row.status,
        student: {
          id: row.studentId!,
          firstName: row.studentFirstName ?? '',
          lastName: row.studentLastName ?? '',
          registrationNumber: row.studentRegistrationNumber ?? '',
        },
        semester: {
          id: row.semesterId!,
          name: row.semesterName ?? '',
        },
        feeStructure: row.feeStructureId && row.programId ? {
          id: row.feeStructureId,
          totalAmount: String(row.feeStructureAmount),
          description: row.feeStructureDescription ?? null,
          program: {
            id: row.programId,
            name: row.programName ?? '',
          },
        } : null,
        payments: (paymentsByInvoiceId[row.id] || []).map(payment => ({
          id: payment.id,
          amount: String(payment.amount),
          paymentMethod: payment.paymentMethod,
          transactionDate: new Date(payment.transactionDate),
          referenceNumber: payment.referenceNumber ?? null,
        })),
      }));

    return mappedData;
  } catch (error) {
    console.error(`Failed to fetch invoices with status ${status}:`, error);
    throw new Error('Failed to fetch invoices by status');
  }
}

/**
 * Fetches a single invoice by ID with all details
 */
export async function getInvoiceById(invoiceId: number): Promise<InvoiceWithDetails | null> {
  try {
    const rawInvoice = await db
      .select({
        id: invoices.id,
        amountDue: invoices.amountDue,
        amountPaid: invoices.amountPaid,
        balance: invoices.balance,
        dueDate: invoices.dueDate,
        issuedDate: invoices.issuedDate,
        status: invoices.status,
        studentId: students.id,
        studentFirstName: students.firstName,
        studentLastName: students.lastName,
        studentRegistrationNumber: students.registrationNumber,
        semesterId: semesters.id,
        semesterName: semesters.name,
        feeStructureId: feeStructures.id,
        feeStructureAmount: feeStructures.totalAmount,
        feeStructureDescription: feeStructures.description,
        programId: programs.id,
        programName: programs.name,
      })
      .from(invoices)
      .leftJoin(students, eq(invoices.studentId, students.id))
      .leftJoin(semesters, eq(invoices.semesterId, semesters.id))
      .leftJoin(feeStructures, eq(invoices.feeStructureId, feeStructures.id))
      .leftJoin(programs, eq(feeStructures.programId, programs.id))
      .where(eq(invoices.id, invoiceId))
      .limit(1);

    const invoice = rawInvoice[0];
    if (!invoice || invoice.studentId === null || invoice.semesterId === null) {
      return null;
    }

    const rawPayments = await db
      .select({
        id: payments.id,
        amount: payments.amount,
        paymentMethod: payments.paymentMethod,
        transactionDate: payments.transactionDate,
        referenceNumber: payments.referenceNumber,
      })
      .from(payments)
      .where(eq(payments.invoiceId, invoiceId));

    const mappedData: InvoiceWithDetails = {
      id: invoice.id,
      amountDue: String(invoice.amountDue),
      amountPaid: String(invoice.amountPaid),
      balance: String(invoice.balance),
      dueDate: new Date(invoice.dueDate),
      issuedDate: new Date(invoice.issuedDate),
      status: invoice.status,
      student: {
        id: invoice.studentId!,
        firstName: invoice.studentFirstName ?? '',
        lastName: invoice.studentLastName ?? '',
        registrationNumber: invoice.studentRegistrationNumber ?? '',
      },
      semester: {
        id: invoice.semesterId!,
        name: invoice.semesterName ?? '',
      },
      feeStructure: invoice.feeStructureId && invoice.programId ? {
        id: invoice.feeStructureId,
        totalAmount: String(invoice.feeStructureAmount),
        description: invoice.feeStructureDescription ?? null,
        program: {
          id: invoice.programId,
          name: invoice.programName ?? '',
        },
      } : null,
      payments: rawPayments.map(payment => ({
        id: payment.id,
        amount: String(payment.amount),
        paymentMethod: payment.paymentMethod,
        transactionDate: new Date(payment.transactionDate),
        referenceNumber: payment.referenceNumber ?? null,
      })),
    };

    return mappedData;
  } catch (error) {
    console.error(`Failed to fetch invoice ${invoiceId}:`, error);
    throw new Error('Failed to fetch invoice by ID');
  }
}

/**
 * Creates a new invoice record
 */
export async function createInvoice(invoiceData: InvoiceData): Promise<SelectInvoice> {
  try {
    // Calculate balance if amountPaid is provided
    const amountPaid = invoiceData.amountPaid || '0';
    const balance = (parseFloat(invoiceData.amountDue) - parseFloat(amountPaid)).toString();

    const result = await db.insert(invoices).values({
      ...invoiceData,
      amountPaid: amountPaid,
      balance: balance,
    }).returning();

    revalidatePath('/admin/invoices');
    return result[0];
  } catch (error) {
    console.error('Failed to create invoice:', error);
    throw new Error('Failed to create invoice');
  }
}

/**
 * Updates an existing invoice record
 */
export async function updateInvoice(
  invoiceId: number,
  invoiceData: Partial<InvoiceData>
): Promise<SelectInvoice> {
  try {
    // If updating amountDue or amountPaid, recalculate balance
    const updateData = { ...invoiceData };
    if (invoiceData.amountDue !== undefined || invoiceData.amountPaid !== undefined) {
      const existingInvoice = await db
        .select()
        .from(invoices)
        .where(eq(invoices.id, invoiceId))
        .limit(1);

      if (existingInvoice[0]) {
        const amountDue = invoiceData.amountDue ?? existingInvoice[0].amountDue;
        const amountPaid = invoiceData.amountPaid ?? existingInvoice[0].amountPaid;
        const balance = (parseFloat(amountDue) - parseFloat(amountPaid)).toString();
        updateData.balance = balance;
      }
    }

    const result = await db
      .update(invoices)
      .set(updateData)
      .where(eq(invoices.id, invoiceId))
      .returning();

    revalidatePath('/admin/invoices');
    return result[0];
  } catch (error) {
    console.error(`Failed to update invoice ${invoiceId}:`, error);
    throw new Error('Failed to update invoice');
  }
}

/**
 * Deletes an invoice record
 */
export async function deleteInvoice(invoiceId: number): Promise<{ success: boolean }> {
  try {
    await db.delete(invoices).where(eq(invoices.id, invoiceId));

    revalidatePath('/admin/invoices');
    return { success: true };
  } catch (error) {
    console.error(`Failed to delete invoice ${invoiceId}:`, error);
    throw new Error('Failed to delete invoice');
  }
}

/**
 * Records a payment against an invoice
 */
export async function recordPayment(paymentData: PaymentData): Promise<SelectPayment> {
  try {
    return await db.transaction(async (tx) => {
      // Create the payment record
      const paymentResult = await tx.insert(payments).values(paymentData).returning();

      // Update the invoice's amountPaid and balance
      const invoice = await tx
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

        await tx
          .update(invoices)
          .set({
            amountPaid: newAmountPaid,
            balance: newBalance,
            status: newStatus,
          })
          .where(eq(invoices.id, paymentData.invoiceId));
      }

      revalidatePath('/admin/invoices');
      return paymentResult[0];
    });
  } catch (error) {
    console.error('Failed to record payment:', error);
    throw new Error('Failed to record payment');
  }
}

/**
 * Gets all payments with invoice and student details
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
        invoiceBalance: invoices.balance,
        studentId: students.id,
        studentFirstName: students.firstName,
        studentLastName: students.lastName,
      })
      .from(payments)
      .leftJoin(invoices, eq(payments.invoiceId, invoices.id))
      .leftJoin(students, eq(invoices.studentId, students.id));

    const mappedData: PaymentWithDetails[] = rawPayments
      .filter(row => row.invoiceId !== null && row.studentId !== null)
      .map(row => ({
        id: row.id,
        amount: String(row.amount),
        paymentMethod: row.paymentMethod,
        transactionDate: String(row.transactionDate),
        referenceNumber: row.referenceNumber ?? null,
        invoice: {
          id: row.invoiceId!,
          amountDue: String(row.invoiceAmountDue),
          balance: String(row.invoiceBalance),
        },
        student: {
          id: row.studentId!,
          firstName: row.studentFirstName ?? '',
          lastName: row.studentLastName ?? '',
        },
      }));

    return mappedData;
  } catch (error) {
    console.error('Failed to fetch payments:', error);
    throw new Error('Failed to fetch payments');
  }
}

/**
 * Gets a payment by ID with details
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
        invoiceBalance: invoices.balance,
        studentId: students.id,
        studentFirstName: students.firstName,
        studentLastName: students.lastName,
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
      transactionDate: String(payment.transactionDate),
      referenceNumber: payment.referenceNumber ?? null,
      invoice: {
        id: payment.invoiceId!,
        amountDue: String(payment.invoiceAmountDue),
        balance: String(payment.invoiceBalance),
      },
      student: {
        id: payment.studentId!,
        firstName: payment.studentFirstName ?? '',
        lastName: payment.studentLastName ?? '',
      },
    };

    return mappedData;
  } catch (error) {
    console.error(`Failed to fetch payment ${paymentId}:`, error);
    throw new Error('Failed to fetch payment by ID');
  }
}

/**
 * Gets financial summary statistics
 */
export async function getFinancialSummary(): Promise<{
  totalRevenue: number;
  outstandingBalance: number;
  paidAmount: number;
}> {
  try {
    const [totalRevenueResult, outstandingBalanceResult, paidAmountResult] = await Promise.all([
      db.select({ total: sum(payments.amount) }).from(payments),
      db.select({ total: sum(invoices.balance) }).from(invoices),
      db.select({ total: sum(invoices.amountPaid) }).from(invoices),
    ]);

    return {
      totalRevenue: parseFloat(totalRevenueResult[0]?.total ?? '0'),
      outstandingBalance: parseFloat(outstandingBalanceResult[0]?.total ?? '0'),
      paidAmount: parseFloat(paidAmountResult[0]?.total ?? '0'),
    };
  } catch (error) {
    console.error('Failed to fetch financial summary:', error);
    throw new Error('Failed to fetch financial summary');
  }
}

/**
 * Gets overdue invoices
 */
export async function getOverdueInvoices(): Promise<InvoiceWithDetails[]> {
  try {
    const today = new Date().toISOString().split('T')[0];
    const rawInvoices = await db
      .select({
        id: invoices.id,
        amountDue: invoices.amountDue,
        amountPaid: invoices.amountPaid,
        balance: invoices.balance,
        dueDate: invoices.dueDate,
        issuedDate: invoices.issuedDate,
        status: invoices.status,
        studentId: students.id,
        studentFirstName: students.firstName,
        studentLastName: students.lastName,
        studentRegistrationNumber: students.registrationNumber,
        semesterId: semesters.id,
        semesterName: semesters.name,
        feeStructureId: feeStructures.id,
        feeStructureAmount: feeStructures.totalAmount,
        feeStructureDescription: feeStructures.description,
        programId: programs.id,
        programName: programs.name,
      })
      .from(invoices)
      .leftJoin(students, eq(invoices.studentId, students.id))
      .leftJoin(semesters, eq(invoices.semesterId, semesters.id))
      .leftJoin(feeStructures, eq(invoices.feeStructureId, feeStructures.id))
      .leftJoin(programs, eq(feeStructures.programId, programs.id))
      .where(
        and(
          sql`${invoices.dueDate} < ${today}`,
          sql`${invoices.balance} > 0`
        )
      );

    const invoiceIds = rawInvoices.map(inv => inv.id);
    const rawPayments = invoiceIds.length > 0 ? await db
      .select({
        id: payments.id,
        amount: payments.amount,
        paymentMethod: payments.paymentMethod,
        transactionDate: payments.transactionDate,
        referenceNumber: payments.referenceNumber,
        invoiceId: payments.invoiceId,
      })
      .from(payments)
      .where(inArray(payments.invoiceId, invoiceIds)) : [];

    const paymentsByInvoiceId = rawPayments.reduce((acc, payment) => {
      if (!acc[payment.invoiceId]) {
        acc[payment.invoiceId] = [];
      }
      acc[payment.invoiceId].push(payment);
      return acc;
    }, {} as Record<number, typeof rawPayments>);

    const mappedData: InvoiceWithDetails[] = rawInvoices
      .filter(row => row.studentId !== null && row.semesterId !== null)
      .map(row => ({
        id: row.id,
        amountDue: String(row.amountDue),
        amountPaid: String(row.amountPaid),
        balance: String(row.balance),
        dueDate: new Date(row.dueDate),
        issuedDate: new Date(row.issuedDate),
        status: row.status,
        student: {
          id: row.studentId!,
          firstName: row.studentFirstName ?? '',
          lastName: row.studentLastName ?? '',
          registrationNumber: row.studentRegistrationNumber ?? '',
        },
        semester: {
          id: row.semesterId!,
          name: row.semesterName ?? '',
        },
        feeStructure: row.feeStructureId && row.programId ? {
          id: row.feeStructureId,
          totalAmount: String(row.feeStructureAmount),
          description: row.feeStructureDescription ?? null,
          program: {
            id: row.programId,
            name: row.programName ?? '',
          },
        } : null,
        payments: (paymentsByInvoiceId[row.id] || []).map(payment => ({
          id: payment.id,
          amount: String(payment.amount),
          paymentMethod: payment.paymentMethod,
          transactionDate: new Date(payment.transactionDate),
          referenceNumber: payment.referenceNumber ?? null,
        })),
      }));

    return mappedData;
  } catch (error) {
    console.error('Failed to fetch overdue invoices:', error);
    throw new Error('Failed to fetch overdue invoices');
  }
}