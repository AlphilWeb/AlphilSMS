// lib/actions/admin.manage.staff.action.ts
'use server';

import { db } from '@/lib/db';
import { staff, users, departments, roles, userLogs } from '@/lib/db/schema';
import { and, eq, asc, sql, like, or, ne } from 'drizzle-orm';
import { getAuthUser } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { ActionError } from '@/lib/utils';

// Types
export type StaffWithDetails = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  idNumber: string | null;
  position: string;
  department: {
    id: number;
    name: string;
  };
  user: {
    id: number;
    role: {
      id: number;
      name: string;
    };
  };
  createdAt: Date;
  updatedAt: Date;
};

export type StaffCreateData = {
  firstName: string;
  lastName: string;
  email: string;
  idNumber?: string;
  departmentId: number;
  position: string;
  roleId: number;
};

export type StaffUpdateData = {
  firstName?: string;
  lastName?: string;
  email?: string;
  idNumber?: string;
  departmentId?: number;
  position?: string;
  roleId?: number;
};

export type StaffDetails = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  idNumber: string | null;
  position: string;
  department: {
    id: number;
    name: string;
  };
  user: {
    id: number;
    role: {
      id: number;
      name: string;
    };
  };
  employmentDocumentsUrl: string | null;
  nationalIdPhotoUrl: string | null;
  academicCertificatesUrl: string | null;
  passportPhotoUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type StaffDeletePayload = {
  id: number;
  firstName: string;
  lastName: string;
};


// Get all staff with basic details
export async function getAllStaff(): Promise<StaffWithDetails[]> {
  const authUser = await getAuthUser();
  if (!authUser) throw new Error('Unauthorized');

  
  const raw = await db
  .select({
    id: staff.id,
    firstName: staff.firstName,
    lastName: staff.lastName,
    email: staff.email,
    idNumber: staff.idNumber,
    position: staff.position,
    departmentId: departments.id,
    departmentName: departments.name,
    userId: users.id,
    roleId: roles.id,
    roleName: roles.name,
    createdAt: staff.createdAt,
    updatedAt: staff.updatedAt,
  })
  .from(staff)
  .innerJoin(users, eq(users.id, staff.userId))
  .innerJoin(roles, eq(roles.id, users.roleId))
  .innerJoin(departments, eq(departments.id, staff.departmentId))
  .orderBy(asc(staff.lastName), asc(staff.firstName));

return raw.map(row => ({
  id: row.id,
  firstName: row.firstName,
  lastName: row.lastName,
  email: row.email,
  idNumber: row.idNumber,
  position: row.position,
  department: {
    id: row.departmentId,
    name: row.departmentName,
  },
  user: {
    id: row.userId,
    role: {
      id: row.roleId,
      name: row.roleName,
    },
  },
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
}));

}

// Search staff by name, email, or ID number
export async function searchStaff(query: string): Promise<StaffWithDetails[]> {
  const authUser = await getAuthUser();
  if (!authUser) throw new Error('Unauthorized');

  if (!query.trim()) return await getAllStaff();

  const raw = await db
    .select({
      id: staff.id,
      firstName: staff.firstName,
      lastName: staff.lastName,
      email: staff.email,
      idNumber: staff.idNumber,
      position: staff.position,
      departmentId: departments.id,
      departmentName: departments.name,
      userId: users.id,
      roleId: roles.id,
      roleName: roles.name,
      createdAt: staff.createdAt,
      updatedAt: staff.updatedAt,
    })
    .from(staff)
    .innerJoin(users, eq(users.id, staff.userId))
    .innerJoin(roles, eq(roles.id, users.roleId))
    .innerJoin(departments, eq(departments.id, staff.departmentId))
    .where(
      or(
        like(staff.firstName, `%${query}%`),
        like(staff.lastName, `%${query}%`),
        like(staff.email, `%${query}%`),
        like(staff.idNumber, `%${query}%`), // cast to bypass null type
        like(staff.position, `%${query}%`)
      )
    )
    .orderBy(asc(staff.lastName), asc(staff.firstName));

  return raw.map(row => ({
    id: row.id,
    firstName: row.firstName,
    lastName: row.lastName,
    email: row.email,
    idNumber: row.idNumber,
    position: row.position,
    department: {
      id: row.departmentId,
      name: row.departmentName,
    },
    user: {
      id: row.userId,
      role: {
        id: row.roleId,
        name: row.roleName,
      },
    },
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }));
}


// Get staff details by ID
export async function getStaffDetails(staffId: number): Promise<StaffDetails> {
  const authUser = await getAuthUser();
  if (!authUser) throw new Error('Unauthorized');

  const rows = await db
    .select({
      id: staff.id,
      firstName: staff.firstName,
      lastName: staff.lastName,
      email: staff.email,
      idNumber: staff.idNumber,
      position: staff.position,
      departmentId: departments.id,
      departmentName: departments.name,
      userId: users.id,
      roleId: roles.id,
      roleName: roles.name,
      employmentDocumentsUrl: staff.employmentDocumentsUrl,
      nationalIdPhotoUrl: staff.nationalIdPhotoUrl,
      academicCertificatesUrl: staff.academicCertificatesUrl,
      passportPhotoUrl: staff.passportPhotoUrl,
      createdAt: staff.createdAt,
      updatedAt: staff.updatedAt,
    })
    .from(staff)
    .innerJoin(users, eq(users.id, staff.userId))
    .innerJoin(roles, eq(roles.id, users.roleId))
    .innerJoin(departments, eq(departments.id, staff.departmentId))
    .where(eq(staff.id, staffId));

  const row = rows[0];
  if (!row) {
    throw new ActionError('Staff member not found');
  }

  return {
    id: row.id,
    firstName: row.firstName,
    lastName: row.lastName,
    email: row.email,
    idNumber: row.idNumber,
    position: row.position,
    department: {
      id: row.departmentId,
      name: row.departmentName,
    },
    user: {
      id: row.userId,
      role: {
        id: row.roleId,
        name: row.roleName,
      },
    },
    employmentDocumentsUrl: row.employmentDocumentsUrl,
    nationalIdPhotoUrl: row.nationalIdPhotoUrl,
    academicCertificatesUrl: row.academicCertificatesUrl,
    passportPhotoUrl: row.passportPhotoUrl,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}


// Create a new staff member
export async function createStaff(data: StaffCreateData) {
  const authUser = await getAuthUser();
  if (!authUser) throw new Error('Unauthorized');

  // Validate required fields
  if (!data.firstName.trim() || !data.lastName.trim() || !data.email.trim() || !data.position.trim()) {
    throw new ActionError('All required fields must be filled');
  }

  // Check for existing email or ID number
  const existingStaff = await db
    .select()
    .from(staff)
    .where(
      or(
        eq(staff.email, data.email),
        data.idNumber ? eq(staff.idNumber, data.idNumber) : sql`false`
      )
    )
    .then((res) => res[0]);

  if (existingStaff) {
    if (existingStaff.email === data.email) {
      throw new ActionError('Staff with this email already exists');
    }
    if (data.idNumber && existingStaff.idNumber === data.idNumber) {
      throw new ActionError('Staff with this ID number already exists');
    }
  }

  // Check if email is already used in users table
  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.email, data.email))
    .then((res) => res[0]);

  if (existingUser) {
    throw new ActionError('User with this email already exists');
  }

  // Create user first
  const newUser = await db
    .insert(users)
    .values({
      email: data.email,
      passwordHash: '', // Temporary empty password, should be set via email
      roleId: data.roleId,
    })
    .returning();

  // Then create staff
  const newStaff = await db
    .insert(staff)
    .values({
      userId: newUser[0].id,
      departmentId: data.departmentId,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      idNumber: data.idNumber,
      position: data.position,
    })
    .returning();

  // Log the action
  await db.insert(userLogs).values({
    userId: authUser.userId,
    action: 'create',
    targetTable: 'staff',
    targetId: newStaff[0].id,
    description: `Created staff member ${data.firstName} ${data.lastName} (${data.position})`,
  });

  revalidatePath('/dashboard/admin/staff');
  return newStaff[0];
}

// Update staff details
export async function updateStaff(staffId: number, data: StaffUpdateData) {
  const authUser = await getAuthUser();
  if (!authUser) throw new Error('Unauthorized');

  // Get current staff details
  const currentStaff = await db
    .select()
    .from(staff)
    .where(eq(staff.id, staffId))
    .then((res) => res[0]);

  if (!currentStaff) {
    throw new ActionError('Staff member not found');
  }

  // Check for conflicts if updating unique fields
  if (data.email || data.idNumber) {
    const existingStaff = await db
      .select()
      .from(staff)
      .where(
        and(
          ne(staff.id, staffId),
          or(
            data.email ? eq(staff.email, data.email) : sql`false`,
            data.idNumber ? eq(staff.idNumber, data.idNumber) : sql`false`
          )
        )
      )
      .then((res) => res[0]);

    if (existingStaff) {
      if (data.email && existingStaff.email === data.email) {
        throw new ActionError('Another staff member with this email already exists');
      }
      if (data.idNumber && existingStaff.idNumber === data.idNumber) {
        throw new ActionError('Another staff member with this ID number already exists');
      }
    }
  }

  // Update staff
  const updatedStaff = await db
    .update(staff)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(staff.id, staffId))
    .returning();

  if (updatedStaff.length === 0) {
    throw new ActionError('Failed to update staff member');
  }

  // Update user email and role if they were changed
  if (data.email || data.roleId) {
    const updateData: { email?: string; roleId?: number; updatedAt: Date } = {
      updatedAt: new Date(),
    };

    if (data.email) updateData.email = data.email;
    if (data.roleId) updateData.roleId = data.roleId;

    await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, currentStaff.userId));
  }

  // Log the action
  await db.insert(userLogs).values({
    userId: authUser.userId,
    action: 'update',
    targetTable: 'staff',
    targetId: staffId,
    description: `Updated staff member details`,
  });

  revalidatePath('/dashboard/admin/staff');
  revalidatePath(`/dashboard/admin/staff/${staffId}`);
  return updatedStaff[0];
}

// Delete a staff member
export async function deleteStaff(staffId: number) {
  const authUser = await getAuthUser();
  if (!authUser) throw new Error('Unauthorized');

  // Get staff details for logging
  const staffMember = await db
    .select()
    .from(staff)
    .where(eq(staff.id, staffId))
    .then((res) => res[0]);

  if (!staffMember) {
    throw new ActionError('Staff member not found');
  }

  // Check if staff is head of any department
  const headOfDepartment = await db
    .select()
    .from(departments)
    .where(eq(departments.headOfDepartmentId, staffId))
    .then((res) => res[0]);

  if (headOfDepartment) {
    throw new ActionError('Cannot delete staff member who is head of a department');
  }

  // Delete staff record first
  await db
    .delete(staff)
    .where(eq(staff.id, staffId));

  // Then delete the associated user
  await db
    .delete(users)
    .where(eq(users.id, staffMember.userId));

  // Log the action
  await db.insert(userLogs).values({
    userId: authUser.userId,
    action: 'delete',
    targetTable: 'staff',
    targetId: staffId,
    description: `Deleted staff member ${staffMember.firstName} ${staffMember.lastName}`,
  });

  revalidatePath('/dashboard/admin/staff');
  return { success: true };
}

// Update staff documents
export async function updateStaffDocuments(
  staffId: number,
  documents: {
    employmentDocumentsUrl?: string | null;
    nationalIdPhotoUrl?: string | null;
    academicCertificatesUrl?: string | null;
    passportPhotoUrl?: string | null;
  }
) {
  const authUser = await getAuthUser();
  if (!authUser) throw new Error('Unauthorized');

  // Check if staff exists
  const staffExists = await db
    .select({ id: staff.id })
    .from(staff)
    .where(eq(staff.id, staffId))
    .then((res) => res[0]);

  if (!staffExists) {
    throw new ActionError('Staff member not found');
  }

  // Update documents
  const updatedStaff = await db
    .update(staff)
    .set({
      ...documents,
      updatedAt: new Date(),
    })
    .where(eq(staff.id, staffId))
    .returning();

  // Log the action
  await db.insert(userLogs).values({
    userId: authUser.userId,
    action: 'update',
    targetTable: 'staff',
    targetId: staffId,
    description: `Updated staff member documents`,
  });

  revalidatePath(`/dashboard/admin/staff/${staffId}`);
  return updatedStaff[0];
}