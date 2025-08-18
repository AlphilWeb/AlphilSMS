'use server';

import { db } from '@/lib/db';
import { staffSalaries, staff, userLogs, departments } from '@/lib/db/schema';
import { eq, sql, like, or, desc, and, gte, lte } from 'drizzle-orm';
import { getAuthUser } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { ActionError } from '@/lib/utils';

export type MonthlyPayrollStat = {
  month: number;
  totalAmount: number;
  count: number;
};

// Types
export type SalaryWithStaffDetails = {
  id: number;
  amount: number;
  paymentDate: string;
  description: string | null;
  status: string;
  staff: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    position: string;
    department: {
      id: number;
      name: string;
    };
  };
};

export type SalaryDetails = {
  id: number;
  amount: number;
  paymentDate: string;
  description: string | null;
  status: string;
  staff: {
    id: number;
    userId: number;
    firstName: string;
    lastName: string;
    email: string;
    idNumber: string | null;
    position: string;
    employmentDocumentsUrl: string | null;
    nationalIdPhotoUrl: string | null;
    academicCertificatesUrl: string | null;
    passportPhotoUrl: string | null;
    department: {
      id: number;
      name: string;
    };
  };
};

export type SalaryCreateData = {
  staffId: number;
  amount: number;
  paymentDate: string;
  description?: string;
  status?: string;
};

export type SalaryUpdateData = {
  amount?: number;
  paymentDate?: string;
  description?: string | null;
  status?: string;
};

export type SalaryFilterOptions = {
  staffId?: number;
  departmentId?: number;
  status?: string;
  fromDate?: string;
  toDate?: string;
  minAmount?: number;
  maxAmount?: number;
};

// Get all salaries with basic staff details
export async function getAllSalaries(): Promise<SalaryWithStaffDetails[]> {
  const authUser = await getAuthUser();
  if (!authUser) throw new ActionError('Unauthorized');

  const raw = await db
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
      staffPosition: staff.position,
      departmentId: departments.id,
      departmentName: departments.name,
    })
    .from(staffSalaries)
    .innerJoin(staff, eq(staff.id, staffSalaries.staffId))
    .innerJoin(departments, eq(departments.id, staff.departmentId))
    .orderBy(desc(staffSalaries.paymentDate));

  return raw.map(row => ({
    id: row.id,
    amount: Number(row.amount),
    paymentDate: row.paymentDate,
    description: row.description,
    status: row.status,
    staff: {
      id: row.staffId,
      firstName: row.staffFirstName,
      lastName: row.staffLastName,
      email: row.staffEmail,
      position: row.staffPosition,
      department: {
        id: row.departmentId,
        name: row.departmentName,
      },
    },
  }));
}

// Filter salaries with various criteria
export async function filterSalaries(options: SalaryFilterOptions): Promise<SalaryWithStaffDetails[]> {
  const authUser = await getAuthUser();
  if (!authUser) throw new ActionError('Unauthorized');

  const conditions = [];
  
  if (options.staffId) {
    conditions.push(eq(staffSalaries.staffId, options.staffId));
  }
  
  if (options.departmentId) {
    conditions.push(eq(staff.departmentId, options.departmentId));
  }
  
  if (options.status) {
    conditions.push(eq(staffSalaries.status, options.status));
  }
  
  if (options.fromDate) {
    conditions.push(gte(staffSalaries.paymentDate, options.fromDate));
  }
  
  if (options.toDate) {
    conditions.push(lte(staffSalaries.paymentDate, options.toDate));
  }
  
  if (options.minAmount !== undefined) {
    conditions.push(gte(staffSalaries.amount, options.minAmount.toString()));
  }
  
  if (options.maxAmount !== undefined) {
    conditions.push(lte(staffSalaries.amount, options.maxAmount.toString()));
  }

  const raw = await db
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
      staffPosition: staff.position,
      departmentId: departments.id,
      departmentName: departments.name,
    })
    .from(staffSalaries)
    .innerJoin(staff, eq(staff.id, staffSalaries.staffId))
    .innerJoin(departments, eq(departments.id, staff.departmentId))
    .where(and(...conditions))
    .orderBy(desc(staffSalaries.paymentDate));

  return raw.map(row => ({
    id: row.id,
    amount: Number(row.amount),
    paymentDate: row.paymentDate,
    description: row.description,
    status: row.status,
    staff: {
      id: row.staffId,
      firstName: row.staffFirstName,
      lastName: row.staffLastName,
      email: row.staffEmail,
      position: row.staffPosition,
      department: {
        id: row.departmentId,
        name: row.departmentName,
      },
    },
  }));
}

// Search salaries by staff name, email, or department
export async function searchSalaries(query: string): Promise<SalaryWithStaffDetails[]> {
  const authUser = await getAuthUser();
  if (!authUser) throw new ActionError('Unauthorized');

  if (!query.trim()) return await getAllSalaries();

  const raw = await db
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
      staffPosition: staff.position,
      departmentId: departments.id,
      departmentName: departments.name,
    })
    .from(staffSalaries)
    .innerJoin(staff, eq(staff.id, staffSalaries.staffId))
    .innerJoin(departments, eq(departments.id, staff.departmentId))
    .where(
      or(
        like(staff.firstName, `%${query}%`),
        like(staff.lastName, `%${query}%`),
        sql`CONCAT(${staff.firstName}, ' ', ${staff.lastName}) LIKE ${`%${query}%`}`,
        like(staff.email, `%${query}%`),
        like(departments.name, `%${query}%`),
        like(staff.position, `%${query}%`),
        sql`CAST(${staffSalaries.amount} AS TEXT) LIKE ${`%${query}%`}`
      )
    )
    .orderBy(desc(staffSalaries.paymentDate));

  return raw.map(row => ({
    id: row.id,
    amount: Number(row.amount),
    paymentDate: row.paymentDate,
    description: row.description,
    status: row.status,
    staff: {
      id: row.staffId,
      firstName: row.staffFirstName,
      lastName: row.staffLastName,
      email: row.staffEmail,
      position: row.staffPosition,
      department: {
        id: row.departmentId,
        name: row.departmentName,
      },
    },
  }));
}

// Get salary details by ID
export async function getSalaryDetails(salaryId: number): Promise<SalaryDetails> {
  const authUser = await getAuthUser();
  if (!authUser) throw new ActionError('Unauthorized');

  const rows = await db
    .select({
      id: staffSalaries.id,
      amount: staffSalaries.amount,
      paymentDate: staffSalaries.paymentDate,
      description: staffSalaries.description,
      status: staffSalaries.status,
      staffId: staff.id,
      staffUserId: staff.userId,
      staffFirstName: staff.firstName,
      staffLastName: staff.lastName,
      staffEmail: staff.email,
      staffIdNumber: staff.idNumber,
      staffPosition: staff.position,
      staffEmploymentDocumentsUrl: staff.employmentDocumentsUrl,
      staffNationalIdPhotoUrl: staff.nationalIdPhotoUrl,
      staffAcademicCertificatesUrl: staff.academicCertificatesUrl,
      staffPassportPhotoUrl: staff.passportPhotoUrl,
      departmentId: departments.id,
      departmentName: departments.name,
    })
    .from(staffSalaries)
    .innerJoin(staff, eq(staff.id, staffSalaries.staffId))
    .innerJoin(departments, eq(departments.id, staff.departmentId))
    .where(eq(staffSalaries.id, salaryId));

  const row = rows[0];
  if (!row) {
    throw new ActionError('Salary record not found');
  }

  return {
    id: row.id,
    amount: Number(row.amount),
    paymentDate: row.paymentDate,
    description: row.description,
    status: row.status,
    staff: {
      id: row.staffId,
      userId: row.staffUserId ?? 0,
      firstName: row.staffFirstName,
      lastName: row.staffLastName,
      email: row.staffEmail,
      idNumber: row.staffIdNumber,
      position: row.staffPosition,
      employmentDocumentsUrl: row.staffEmploymentDocumentsUrl,
      nationalIdPhotoUrl: row.staffNationalIdPhotoUrl,
      academicCertificatesUrl: row.staffAcademicCertificatesUrl,
      passportPhotoUrl: row.staffPassportPhotoUrl,
      department: {
        id: row.departmentId,
        name: row.departmentName,
      },
    },
  };
}

// Create a new salary record
export async function createSalary(data: SalaryCreateData) {
  const authUser = await getAuthUser();
  if (!authUser) throw new ActionError('Unauthorized');

  // Validate required fields
  if (!data.staffId || !data.amount || data.amount <= 0 || !data.paymentDate) {
    throw new ActionError('Staff, amount, and payment date are required');
  }

  // Check if staff exists
  const staffMember = await db
    .select()
    .from(staff)
    .where(eq(staff.id, data.staffId))
    .then(res => res[0]);

  if (!staffMember) {
    throw new ActionError('Staff member not found');
  }

  // Create salary record
  const [insertedSalary] = await db
    .insert(staffSalaries)
    .values({
      staffId: data.staffId,
      amount: data.amount.toFixed(2),
      paymentDate: data.paymentDate,
      description: data.description || null,
      status: data.status || 'pending',
    })
    .returning();

  if (!insertedSalary) {
    throw new ActionError('Failed to create salary record');
  }

  // Log the action
  await db.insert(userLogs).values({
    userId: authUser.userId,
    action: 'create',
    targetTable: 'staff_salaries',
    targetId: insertedSalary.id,
    description: `Recorded salary payment of ${data.amount} for staff ${staffMember.firstName} ${staffMember.lastName}`,
  });

  revalidatePath('/dashboard/admin/payroll');
  return insertedSalary;
}

// Update salary record
export async function updateSalary(salaryId: number, data: SalaryUpdateData) {
  const authUser = await getAuthUser();
  if (!authUser) throw new ActionError('Unauthorized');

  // Get current salary details
  const currentSalary = await db
    .select()
    .from(staffSalaries)
    .where(eq(staffSalaries.id, salaryId))
    .then((res) => res[0]);

  if (!currentSalary) {
    throw new ActionError('Salary record not found');
  }

  // Update salary record
  await db
    .update(staffSalaries)
    .set({
      amount: data.amount?.toFixed(2),
      paymentDate: data.paymentDate,
      description: data.description,
      status: data.status,
    })
    .where(eq(staffSalaries.id, salaryId));

  // Log the action
  await db.insert(userLogs).values({
    userId: authUser.userId,
    action: 'update',
    targetTable: 'staff_salaries',
    targetId: salaryId,
    description: `Updated salary record details`,
  });

  revalidatePath('/dashboard/admin/payroll');
  revalidatePath(`/dashboard/admin/payroll/${salaryId}`);
  return { success: true };
}

// Delete a salary record
export async function deleteSalary(salaryId: number) {
  const authUser = await getAuthUser();
  if (!authUser) throw new ActionError('Unauthorized');

  // Get salary details
  const salary = await db
    .select()
    .from(staffSalaries)
    .where(eq(staffSalaries.id, salaryId))
    .then((res) => res[0]);

  if (!salary) {
    throw new ActionError('Salary record not found');
  }

  // Get staff details for logging
  const staffMember = await db
    .select()
    .from(staff)
    .where(eq(staff.id, salary.staffId))
    .then(res => res[0]);

  // Delete salary record
  await db
    .delete(staffSalaries)
    .where(eq(staffSalaries.id, salaryId));

  // Log the action
  await db.insert(userLogs).values({
    userId: authUser.userId,
    action: 'delete',
    targetTable: 'staff_salaries',
    targetId: salaryId,
    description: `Deleted salary record of ${salary.amount} for staff ${staffMember?.firstName || ''} ${staffMember?.lastName || ''}`,
  });

  revalidatePath('/dashboard/admin/payroll');
  return { success: true };
}

// Get salaries for a specific staff member
export async function getSalariesForStaff(staffId: number): Promise<SalaryWithStaffDetails[]> {
  const authUser = await getAuthUser();
  if (!authUser) throw new ActionError('Unauthorized');

  const raw = await db
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
      staffPosition: staff.position,
      departmentId: departments.id,
      departmentName: departments.name,
    })
    .from(staffSalaries)
    .innerJoin(staff, eq(staff.id, staffSalaries.staffId))
    .innerJoin(departments, eq(departments.id, staff.departmentId))
    .where(eq(staffSalaries.staffId, staffId))
    .orderBy(desc(staffSalaries.paymentDate));

  return raw.map(row => ({
    id: row.id,
    amount: Number(row.amount),
    paymentDate: row.paymentDate,
    description: row.description,
    status: row.status,
    staff: {
      id: row.staffId,
      firstName: row.staffFirstName,
      lastName: row.staffLastName,
      email: row.staffEmail,
      position: row.staffPosition,
      department: {
        id: row.departmentId,
        name: row.departmentName,
      },
    },
  }));
}

// Get salaries for a specific department
export async function getSalariesForDepartment(departmentId: number): Promise<SalaryWithStaffDetails[]> {
  const authUser = await getAuthUser();
  if (!authUser) throw new ActionError('Unauthorized');

  const raw = await db
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
      staffPosition: staff.position,
      departmentId: departments.id,
      departmentName: departments.name,
    })
    .from(staffSalaries)
    .innerJoin(staff, eq(staff.id, staffSalaries.staffId))
    .innerJoin(departments, eq(departments.id, staff.departmentId))
    .where(eq(staff.departmentId, departmentId))
    .orderBy(desc(staffSalaries.paymentDate));

  return raw.map(row => ({
    id: row.id,
    amount: Number(row.amount),
    paymentDate: row.paymentDate,
    description: row.description,
    status: row.status,
    staff: {
      id: row.staffId,
      firstName: row.staffFirstName,
      lastName: row.staffLastName,
      email: row.staffEmail,
      position: row.staffPosition,
      department: {
        id: row.departmentId,
        name: row.departmentName,
      },
    },
  }));
}

// Get payroll summary (total paid, pending, etc.)
export async function getPayrollSummary() {
  const authUser = await getAuthUser();
  if (!authUser) throw new ActionError('Unauthorized');

  const result = await db
    .select({
      totalPaid: sql<number>`COALESCE(SUM(CASE WHEN ${staffSalaries.status} = 'paid' THEN ${staffSalaries.amount} ELSE 0 END), 0)`,
      totalPending: sql<number>`COALESCE(SUM(CASE WHEN ${staffSalaries.status} = 'pending' THEN ${staffSalaries.amount} ELSE 0 END), 0)`,
      totalCancelled: sql<number>`COALESCE(SUM(CASE WHEN ${staffSalaries.status} = 'cancelled' THEN ${staffSalaries.amount} ELSE 0 END), 0)`,
      totalRecords: sql<number>`COUNT(*)`,
    })
    .from(staffSalaries);

  return {
    totalPaid: Number(result[0].totalPaid),
    totalPending: Number(result[0].totalPending),
    totalCancelled: Number(result[0].totalCancelled),
    totalRecords: Number(result[0].totalRecords),
  };
}

// Get monthly payroll statistics
export async function getMonthlyPayrollStats(year: number) {
  const authUser = await getAuthUser();
  if (!authUser) throw new ActionError('Unauthorized');

  const results = await db
    .select({
      month: sql<number>`EXTRACT(MONTH FROM ${staffSalaries.paymentDate})`,
      totalAmount: sql<number>`COALESCE(SUM(${staffSalaries.amount}), 0)`,
      count: sql<number>`COUNT(*)`,
    })
    .from(staffSalaries)
    .where(
      and(
        sql`EXTRACT(YEAR FROM ${staffSalaries.paymentDate}) = ${year}`,
        eq(staffSalaries.status, 'paid')
      )
    )
    .groupBy(sql`EXTRACT(MONTH FROM ${staffSalaries.paymentDate})`);

  // Initialize all months with zero values
  const monthlyStats = Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    totalAmount: 0,
    count: 0,
  }));

  // Update with actual data
  results.forEach(row => {
    const monthIndex = Number(row.month) - 1;
    if (monthIndex >= 0 && monthIndex < 12) {
      monthlyStats[monthIndex] = {
        month: Number(row.month),
        totalAmount: Number(row.totalAmount),
        count: Number(row.count),
      };
    }
  });

  return monthlyStats;
}