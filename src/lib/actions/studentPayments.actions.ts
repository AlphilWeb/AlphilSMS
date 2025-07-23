'use server';

import { db } from '@/lib/db/index';
import { invoices, payments, feeStructures, students, programs, semesters } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { getAuthUser } from '@/lib/auth';

export async function getStudentFinancialData() {
  try {
    const authUser = await getAuthUser();
    if (!authUser || !authUser.userId) {
      throw new Error('Unauthorized: You must be logged in.');
    }

    // Get student record
    const student = await db.query.students.findFirst({
      where: eq(students.userId, authUser.userId),
      columns: { id: true },
      with: {
        program: {
          columns: { name: true }
        }
      }
    });

    if (!student) {
      throw new Error('Student record not found');
    }

    // Get all invoices with related data
    const invoicesData = await db
      .select({
        id: invoices.id,
        semesterId: invoices.semesterId,
        semesterName: semesters.name,
        amountDue: invoices.amountDue,
        amountPaid: invoices.amountPaid,
        balance: invoices.balance,
        dueDate: invoices.dueDate,
        issuedDate: invoices.issuedDate,
        status: invoices.status,
        feeStructure: {
          description: feeStructures.description
        }
      })
      .from(invoices)
      .leftJoin(feeStructures, eq(invoices.feeStructureId, feeStructures.id))
      .leftJoin(semesters, eq(invoices.semesterId, semesters.id))
      .where(eq(invoices.studentId, student.id))
      .orderBy(desc(invoices.issuedDate));

    // Get all payment history
    const paymentsData = await db
      .select({
        id: payments.id,
        invoiceId: payments.invoiceId,
        amount: payments.amount,
        paymentMethod: payments.paymentMethod,
        transactionDate: payments.transactionDate,
        referenceNumber: payments.referenceNumber
      })
      .from(payments)
      .where(eq(payments.studentId, student.id))
      .orderBy(desc(payments.transactionDate));

    return {
    student: {
      programName: student.program?.name || 'Not specified' // Provide fallback
    },
    invoices: invoicesData.map(invoice => ({
      id: invoice.id,
      semesterName: invoice.semesterName || 'Unnamed Semester', // Fallback
      amountDue: invoice.amountDue,
      amountPaid: invoice.amountPaid,
      balance: invoice.balance,
      dueDate: invoice.dueDate.toString(),
      status: invoice.status
    })),
    payments: paymentsData.map(payment => ({
      id: payment.id,
      amount: payment.amount,
      paymentMethod: payment.paymentMethod,
      transactionDate: payment.transactionDate.toISOString(),
      referenceNumber: payment.referenceNumber || 'N/A' // Fallback
    }))
  };
  } catch (error) {
    console.error('[GET_STUDENT_FINANCIAL_DATA_ERROR]', error);
    throw new Error(
      error instanceof Error 
        ? error.message 
        : 'Failed to fetch financial data'
    );
  }
}