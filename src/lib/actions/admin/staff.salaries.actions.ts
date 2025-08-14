// app/actions/staff-salaries.ts
'use server';

import { db } from '@/lib/db';
import { 
  staffSalaries,
  staff,
  departments,
  // NewStaffSalary,
  SelectStaffSalary
} from '@/lib/db/schema';
import { eq, sql, sum, desc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

// Types from your schema
export type StaffSalaryData = {
  staffId: number;
  amount: string;
  paymentDate: string;
  description?: string | null;
  status: string;
};

export type StaffSalaryWithDetails = {
  id: number;
  amount: string;
  paymentDate: Date;
  description: string | null;
  status: string;
  staff: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    department: {
      id: number;
      name: string;
    };
  };
};

export type SalarySummary = {
  totalSalaries: number;
  totalPaid: number;
  statusDistribution: {
    status: string;
    count: number;
    total: number;
  }[];
};

/**
 * Fetches all staff salaries with staff and department details
 */
export async function getAllStaffSalaries(): Promise<StaffSalaryWithDetails[]> {
  try {
    const rawSalaries = await db
      .select({
        id: staffSalaries.id,
        amount: staffSalaries.amount,
        paymentDate: staffSalaries.paymentDate,
        description: staffSalaries.description,
        status: staffSalaries.status,
        staffId: staff.id,
        staffFirstName: staff.firstName,
        staffLastName: staff.lastName,
        staffEmail: staff.email,
        departmentId: departments.id,
        departmentName: departments.name,
      })
      .from(staffSalaries)
      .leftJoin(staff, eq(staffSalaries.staffId, staff.id))
      .leftJoin(departments, eq(staff.departmentId, departments.id))
      .orderBy(desc(staffSalaries.paymentDate));

    const mappedData: StaffSalaryWithDetails[] = rawSalaries
      .filter(row => row.staffId !== null && row.departmentId !== null)
      .map(row => ({
        id: row.id,
        amount: String(row.amount),
        paymentDate: new Date(row.paymentDate!),
        description: row.description ?? null,
        status: row.status!,
        staff: {
          id: row.staffId!,
          firstName: row.staffFirstName ?? '',
          lastName: row.staffLastName ?? '',
          email: row.staffEmail ?? '',
          department: {
            id: row.departmentId!,
            name: row.departmentName ?? '',
          },
        },
      }));

    return mappedData;
  } catch (error) {
    console.error('Failed to fetch staff salaries:', error);
    throw new Error('Failed to fetch staff salaries');
  }
}

/**
 * Fetches salaries by staff ID
 */
export async function getSalariesByStaff(staffId: number): Promise<StaffSalaryWithDetails[]> {
  try {
    const rawSalaries = await db
      .select({
        id: staffSalaries.id,
        amount: staffSalaries.amount,
        paymentDate: staffSalaries.paymentDate,
        description: staffSalaries.description,
        status: staffSalaries.status,
        staffId: staff.id,
        staffFirstName: staff.firstName,
        staffLastName: staff.lastName,
        staffEmail: staff.email,
        departmentId: departments.id,
        departmentName: departments.name,
      })
      .from(staffSalaries)
      .leftJoin(staff, eq(staffSalaries.staffId, staff.id))
      .leftJoin(departments, eq(staff.departmentId, departments.id))
      .where(eq(staffSalaries.staffId, staffId))
      .orderBy(desc(staffSalaries.paymentDate));

    const mappedData: StaffSalaryWithDetails[] = rawSalaries
      .filter(row => row.staffId !== null && row.departmentId !== null)
      .map(row => ({
        id: row.id,
        amount: String(row.amount),
        paymentDate: new Date(row.paymentDate!),
        description: row.description ?? null,
        status: row.status!,
        staff: {
          id: row.staffId!,
          firstName: row.staffFirstName ?? '',
          lastName: row.staffLastName ?? '',
          email: row.staffEmail ?? '',
          department: {
            id: row.departmentId!,
            name: row.departmentName ?? '',
          },
        },
      }));

    return mappedData;
  } catch (error) {
    console.error(`Failed to fetch salaries for staff ${staffId}:`, error);
    throw new Error('Failed to fetch salaries by staff');
  }
}

/**
 * Fetches a salary record by ID with details
 */
export async function getSalaryById(salaryId: number): Promise<StaffSalaryWithDetails | null> {
  try {
    const rawSalary = await db
      .select({
        id: staffSalaries.id,
        amount: staffSalaries.amount,
        paymentDate: staffSalaries.paymentDate,
        description: staffSalaries.description,
        status: staffSalaries.status,
        staffId: staff.id,
        staffFirstName: staff.firstName,
        staffLastName: staff.lastName,
        staffEmail: staff.email,
        departmentId: departments.id,
        departmentName: departments.name,
      })
      .from(staffSalaries)
      .leftJoin(staff, eq(staffSalaries.staffId, staff.id))
      .leftJoin(departments, eq(staff.departmentId, departments.id))
      .where(eq(staffSalaries.id, salaryId))
      .limit(1);

    const salary = rawSalary[0];
    if (!salary || salary.staffId === null || salary.departmentId === null) {
      return null;
    }

    const mappedData: StaffSalaryWithDetails = {
      id: salary.id,
      amount: String(salary.amount),
      paymentDate: new Date(salary.paymentDate!),
      description: salary.description ?? null,
      status: salary.status!,
      staff: {
        id: salary.staffId!,
        firstName: salary.staffFirstName ?? '',
        lastName: salary.staffLastName ?? '',
        email: salary.staffEmail ?? '',
        department: {
          id: salary.departmentId!,
          name: salary.departmentName ?? '',
        },
      },
    };

    return mappedData;
  } catch (error) {
    console.error(`Failed to fetch salary ${salaryId}:`, error);
    throw new Error('Failed to fetch salary by ID');
  }
}

/**
 * Creates a new staff salary record
 */

export async function createStaffSalary(
  salaryData: StaffSalaryData
): Promise<SelectStaffSalary> {
  try {
    const result = await db.insert(staffSalaries).values({
      staffId: salaryData.staffId,
      amount: salaryData.amount, // keep as string
      paymentDate: salaryData.paymentDate, // keep as YYYY-MM-DD string
      description: salaryData.description ?? null,
      status: salaryData.status,
    }).returning();

    if (!result.length) throw new Error('Insert failed: no record returned');

    revalidatePath('/admin/staff-salaries');
    return result[0];
  } catch (error) {
    console.error('Failed to create staff salary:', error);
    throw new Error('Failed to create staff salary');
  }
}

export async function updateStaffSalary(
  salaryId: number,
  salaryData: Partial<StaffSalaryData>
): Promise<SelectStaffSalary> {
  try {
    const updateData: Partial<StaffSalaryData> = {};

    if (salaryData.staffId !== undefined) updateData.staffId = salaryData.staffId;
    if (salaryData.amount !== undefined) updateData.amount = salaryData.amount;
    if (salaryData.paymentDate !== undefined) updateData.paymentDate = salaryData.paymentDate;
    if (salaryData.description !== undefined) updateData.description = salaryData.description ?? null;
    if (salaryData.status !== undefined) updateData.status = salaryData.status;

    const result = await db
      .update(staffSalaries)
      .set(updateData)
      .where(eq(staffSalaries.id, salaryId))
      .returning();

    if (!result.length) throw new Error(`Update failed: Salary ${salaryId} not found`);

    revalidatePath('/admin/staff-salaries');
    return result[0];
  } catch (error) {
    console.error(`Failed to update salary ${salaryId}:`, error);
    throw new Error('Failed to update staff salary');
  }
}


/**
 * Deletes a staff salary record
 */
export async function deleteStaffSalary(salaryId: number): Promise<{ success: boolean }> {
  try {
    await db.delete(staffSalaries).where(eq(staffSalaries.id, salaryId));

    revalidatePath('/admin/staff-salaries');
    return { success: true };
  } catch (error) {
    console.error(`Failed to delete salary ${salaryId}:`, error);
    throw new Error('Failed to delete staff salary');
  }
}

/**
 * Gets salary summary statistics
 */
export async function getSalarySummary(): Promise<SalarySummary> {
  try {
    const [totalSalariesResult, totalPaidResult, statusDistributionResult] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(staffSalaries),
      db.select({ total: sum(staffSalaries.amount) }).from(staffSalaries),
      db
        .select({
          status: staffSalaries.status,
          count: sql<number>`count(*)`,
          total: sum(staffSalaries.amount),
        })
        .from(staffSalaries)
        .groupBy(staffSalaries.status),
    ]);

    return {
      totalSalaries: totalSalariesResult[0]?.count ?? 0,
      totalPaid: parseFloat(totalPaidResult[0]?.total?.toString() ?? '0'),
      statusDistribution: statusDistributionResult.map(row => ({
        status: row.status!,
        count: row.count,
        total: parseFloat(row.total?.toString() ?? '0'),
      })),
    };
  } catch (error) {
    console.error('Failed to fetch salary summary:', error);
    throw new Error('Failed to fetch salary summary');
  }
}

/**
 * Gets recent salaries (last 10)
 */
export async function getRecentSalaries(): Promise<StaffSalaryWithDetails[]> {
  try {
    const rawSalaries = await db
      .select({
        id: staffSalaries.id,
        amount: staffSalaries.amount,
        paymentDate: staffSalaries.paymentDate,
        description: staffSalaries.description,
        status: staffSalaries.status,
        staffId: staff.id,
        staffFirstName: staff.firstName,
        staffLastName: staff.lastName,
        staffEmail: staff.email,
        departmentId: departments.id,
        departmentName: departments.name,
      })
      .from(staffSalaries)
      .leftJoin(staff, eq(staffSalaries.staffId, staff.id))
      .leftJoin(departments, eq(staff.departmentId, departments.id))
      .orderBy(desc(staffSalaries.paymentDate))
      .limit(10);

    const mappedData: StaffSalaryWithDetails[] = rawSalaries
      .filter(row => row.staffId !== null && row.departmentId !== null)
      .map(row => ({
        id: row.id,
        amount: String(row.amount),
        paymentDate: new Date(row.paymentDate!),
        description: row.description ?? null,
        status: row.status!,
        staff: {
          id: row.staffId!,
          firstName: row.staffFirstName ?? '',
          lastName: row.staffLastName ?? '',
          email: row.staffEmail ?? '',
          department: {
            id: row.departmentId!,
            name: row.departmentName ?? '',
          },
        },
      }));

    return mappedData;
  } catch (error) {
    console.error('Failed to fetch recent salaries:', error);
    throw new Error('Failed to fetch recent salaries');
  }
}