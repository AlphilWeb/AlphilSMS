// lib/actions/admin.manage.departments.action.ts
'use server';

import { db } from '@/lib/db';
import { departments, staff, programs, userLogs } from '@/lib/db/schema';
import { and, eq, asc, sql } from 'drizzle-orm';
import { getAuthUser } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { ActionError } from '@/lib/utils';

// Types
export type DepartmentWithStats = {
  id: number;
  name: string;
  headOfDepartment: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  staffCount: number;
  programCount: number;
};

export type DepartmentDetails = DepartmentWithStats & {
  createdAt: Date;
  updatedAt: Date;
};

export type DepartmentStaffMember = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  position: string;
  isHead: boolean;
};

export type DepartmentProgram = {
  id: number;
  name: string;
  code: string;
  durationSemesters: number;
};

// Get all departments with statistics
export async function getAllDepartments(): Promise<DepartmentWithStats[]> {
  const authUser = await getAuthUser();
  if (!authUser) throw new Error('Unauthorized');

  return db
    .select({
      id: departments.id,
      name: departments.name,
headOfDepartment: {
  id: staff.id,
  firstName: staff.firstName,
  lastName: staff.lastName,
  email: staff.email,
},
      staffCount: sql<number>`(
        SELECT COUNT(*) FROM ${staff} 
        WHERE ${staff.departmentId} = ${departments.id}
      )`,
      programCount: sql<number>`(
        SELECT COUNT(*) FROM ${programs} 
        WHERE ${programs.departmentId} = ${departments.id}
      )`,
    })
    .from(departments)
    .leftJoin(staff, eq(staff.id, departments.headOfDepartmentId))
    .orderBy(asc(departments.name));
}

// Get department details
export async function getDepartmentDetails(
  departmentId: number,
): Promise<DepartmentDetails> {
  const authUser = await getAuthUser();
  if (!authUser) throw new Error('Unauthorized');

  const department = await db
    .select({
      id: departments.id,
      name: departments.name,
headOfDepartment: {
  id: staff.id,
  firstName: staff.firstName,
  lastName: staff.lastName,
  email: staff.email,
},
      staffCount: sql<number>`(
        SELECT COUNT(*) FROM ${staff} 
        WHERE ${staff.departmentId} = ${departments.id}
      )`,
      programCount: sql<number>`(
        SELECT COUNT(*) FROM ${programs} 
        WHERE ${programs.departmentId} = ${departments.id}
      )`,
      createdAt: departments.createdAt,
      updatedAt: departments.updatedAt,
    })
    .from(departments)
    .leftJoin(staff, eq(staff.id, departments.headOfDepartmentId))
    .where(eq(departments.id, departmentId))
    .then((res) => res[0]);

  if (!department) {
    throw new ActionError('Department not found');
  }

  return department;
}

// Create a new department
export async function createDepartment(name: string) {
  const authUser = await getAuthUser();
  if (!authUser) throw new Error('Unauthorized');

  const newDepartment = await db
    .insert(departments)
    .values({
      name,
      headOfDepartmentId: null,
    })
    .returning();

  // Log the action
  await db.insert(userLogs).values({
    userId: authUser.userId,
    action: 'create',
    targetTable: 'departments',
    targetId: newDepartment[0].id,
    description: `Created department "${name}"`,
  });

  revalidatePath('/dashboard/admin/departments');
  return newDepartment[0];
}

// Update department name
export async function updateDepartmentName(
  departmentId: number,
  newName: string,
) {
  const authUser = await getAuthUser();
  if (!authUser) throw new Error('Unauthorized');

  const updatedDepartment = await db
    .update(departments)
    .set({
      name: newName,
    })
    .where(eq(departments.id, departmentId))
    .returning();

  if (updatedDepartment.length === 0) {
    throw new ActionError('Department not found');
  }

  // Log the action
  await db.insert(userLogs).values({
    userId: authUser.userId,
    action: 'update',
    targetTable: 'departments',
    targetId: departmentId,
    description: `Updated department name to "${newName}"`,
  });

  revalidatePath('/dashboard/admin/departments');
  revalidatePath(`/dashboard/admin/departments/${departmentId}`);
  return updatedDepartment[0];
}

// Assign head of department
export async function assignHeadOfDepartment(
  departmentId: number,
  staffId: number,
) {
  const authUser = await getAuthUser();
  if (!authUser) throw new Error('Unauthorized');

  // Verify the staff member exists and belongs to the department
  const staffMember = await db
    .select()
    .from(staff)
    .where(
      and(
        eq(staff.id, staffId),
        eq(staff.departmentId, departmentId),
      ),
    )
    .then((res) => res[0]);

  if (!staffMember) {
    throw new ActionError('Staff member not found in this department');
  }

  const updatedDepartment = await db
    .update(departments)
    .set({
      headOfDepartmentId: staffId,
    })
    .where(eq(departments.id, departmentId))
    .returning();

  // Log the action
  await db.insert(userLogs).values({
    userId: authUser.userId,
    action: 'update',
    targetTable: 'departments',
    targetId: departmentId,
    description: `Assigned ${staffMember.firstName} ${staffMember.lastName} as head of department`,
  });

  revalidatePath('/dashboard/admin/departments');
  revalidatePath(`/dashboard/admin/departments/${departmentId}`);
  return updatedDepartment[0];
}

// Remove head of department
export async function removeHeadOfDepartment(departmentId: number) {
  const authUser = await getAuthUser();
  if (!authUser) throw new Error('Unauthorized');

  const department = await db
    .select()
    .from(departments)
    .where(eq(departments.id, departmentId))
    .then((res) => res[0]);

  if (!department) {
    throw new ActionError('Department not found');
  }

  if (!department.headOfDepartmentId) {
    throw new ActionError('No head of department assigned');
  }

  const updatedDepartment = await db
    .update(departments)
    .set({
      headOfDepartmentId: null,
    })
    .where(eq(departments.id, departmentId))
    .returning();

  // Log the action
  await db.insert(userLogs).values({
    userId: authUser.userId,
    action: 'update',
    targetTable: 'departments',
    targetId: departmentId,
    description: 'Removed head of department',
  });

  revalidatePath('/dashboard/admin/departments');
  revalidatePath(`/dashboard/admin/departments/${departmentId}`);
  return updatedDepartment[0];
}

// Get all staff in a department
export async function getDepartmentStaff(
  departmentId: number,
): Promise<DepartmentStaffMember[]> {
  const authUser = await getAuthUser();
  if (!authUser) throw new Error('Unauthorized');

  return db
    .select({
      id: staff.id,
      firstName: staff.firstName,
      lastName: staff.lastName,
      email: staff.email,
      position: staff.position,
      isHead: sql<boolean>`${staff.id} = ${departments.headOfDepartmentId}`,
    })
    .from(staff)
    .innerJoin(departments, eq(departments.id, staff.departmentId))
    .where(eq(staff.departmentId, departmentId))
    .orderBy(asc(staff.lastName), asc(staff.firstName));
}

// Get all programs in a department
export async function getDepartmentPrograms(
  departmentId: number,
): Promise<DepartmentProgram[]> {
  const authUser = await getAuthUser();
  if (!authUser) throw new Error('Unauthorized');

  return db
    .select({
      id: programs.id,
      name: programs.name,
      code: programs.code,
      durationSemesters: programs.durationSemesters,
    })
    .from(programs)
    .where(eq(programs.departmentId, departmentId))
    .orderBy(asc(programs.name));
}

// Delete a department (only if empty)
export async function deleteDepartment(departmentId: number) {
  const authUser = await getAuthUser();
  if (!authUser) throw new Error('Unauthorized');

  // Check if department has any staff or programs
  const [staffCount, programCount] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)` })
      .from(staff)
      .where(eq(staff.departmentId, departmentId))
      .then((res) => res[0].count),
    db
      .select({ count: sql<number>`count(*)` })
      .from(programs)
      .where(eq(programs.departmentId, departmentId))
      .then((res) => res[0].count),
  ]);

  if (staffCount > 0 || programCount > 0) {
    throw new ActionError(
      'Cannot delete department with staff members or programs',
    );
  }

  const department = await db
    .delete(departments)
    .where(eq(departments.id, departmentId))
    .returning();

  if (department.length === 0) {
    throw new ActionError('Department not found');
  }

  // Log the action
  await db.insert(userLogs).values({
    userId: authUser.userId,
    action: 'delete',
    targetTable: 'departments',
    targetId: departmentId,
    description: `Deleted department "${department[0].name}"`,
  });

  revalidatePath('/dashboard/admin/departments');
  return { success: true };
}