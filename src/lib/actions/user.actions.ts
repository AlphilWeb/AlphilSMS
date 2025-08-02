// src/lib/actions/user.actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db/index'; // This should correctly point to your db instance
import { users, NewUser, roles, students, staff } from '@/lib/db/schema';
import { hash } from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { getAuthUser } from '@/lib/auth';
import { checkPermission } from '@/lib/rbac';

class ActionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ActionError';
  }
}

const ROLES = {
  ADMIN: 'Admin', // Consistent casing with client roles
  REGISTRAR: 'Registrar',
  HOD: 'HOD',
  ACCOUNTANT: 'Accountant',
  LECTURER: 'Lecturer',
  STAFF: 'Staff',
  STUDENT: 'Student',
};

function allowedRolesForManagingUsers() {
  return [ROLES.ADMIN, ROLES.REGISTRAR];
}

function allowedRolesForViewingUsers() {
  return [ROLES.ADMIN, ROLES.REGISTRAR, ROLES.HOD, ROLES.ACCOUNTANT];
}

/**
 * Creates a new user in the database.
 */
export async function createUser(formData: FormData) {
  try {
    const authUser = await getAuthUser();
    if (!authUser || !checkPermission(authUser, allowedRolesForManagingUsers())) {
      return { error: 'Unauthorized: You do not have permission to create users.' }; // Return error object for client
    }

    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const roleId = formData.get('roleId') as string;

    if (!email || !password || !roleId) {
      return { error: 'Missing required fields.' };
    }

    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (existingUser) {
      return { error: 'User with this email already exists.' };
    }

    const passwordHash = await hash(password, 10);

    const newUser: NewUser = {
      email,
      passwordHash,
      roleId: Number(roleId),
      createdAt: new Date(), // Set createdAt
      updatedAt: new Date(), // Set updatedAt
    };

    await db.insert(users).values(newUser);
    revalidatePath('/dashboard/users');

    return { success: 'User created successfully.' };

  } catch (err: unknown) {
  const error = err instanceof Error ? err : new Error(String(err));
  console.error('[ERROR_CONTEXT]', error);
  throw new ActionError(error.message);
}
}

/**
 * Updates an existing user.
 */
export async function updateUser(userId: number, formData: FormData) {
  try {
    const authUser = await getAuthUser();
    if (!authUser || !checkPermission(authUser, allowedRolesForManagingUsers())) {
      return { error: 'Unauthorized: You do not have permission to update users.' };
    }

    const email = formData.get('email') as string | null;
    const roleId = formData.get('roleId') as string | null;
    const password = formData.get('password') as string | null;

    const updates: Partial<NewUser> = {
      updatedAt: new Date(), // Always update updatedAt on modifications
    };

    if (email) updates.email = email;
    if (roleId) updates.roleId = Number(roleId);
    if (password) {
      updates.passwordHash = await hash(password, 10);
    }

    if (Object.keys(updates).length === 1 && updates.updatedAt) {
      return { error: 'No fields to update other than timestamp.' };
    }

    await db.update(users).set(updates).where(eq(users.id, userId));
    revalidatePath('/dashboard/users');
    revalidatePath(`/dashboard/users/${userId}`);

    return { success: 'User updated successfully.' };

  } catch (err: unknown) {
  const error = err instanceof Error ? err : new Error(String(err));
  console.error('[ERROR_CONTEXT]', error);
  throw new ActionError(error.message);
}
}

/**
 * Deletes a user by ID.
 */
export async function deleteUser(userId: number) {
  try {
    const authUser = await getAuthUser();
    if (!authUser || !checkPermission(authUser, allowedRolesForManagingUsers())) {
      return { error: 'Unauthorized: You do not have permission to delete users.' };
    }

    await db.delete(users).where(eq(users.id, userId));
    revalidatePath('/dashboard/users');

    return { success: 'User deleted successfully.' };

  } catch (err: unknown) {
  const error = err instanceof Error ? err : new Error(String(err));
  console.error('[ERROR_CONTEXT]', error);
  throw new ActionError(error.message);
}
}

/**
 * Fetches all users with role name and linked student/staff info.
 */
export async function getUsers() {
  const authUser = await getAuthUser();
  if (!checkPermission(authUser, allowedRolesForViewingUsers())) {
    throw new ActionError('Unauthorized'); // Throw an ActionError for unauthorized access
  }

  const result = await db
    .select({
      id: users.id,
      email: users.email,
      roleId: users.roleId, // <--- Include roleId
      roleName: roles.name,
      createdAt: users.createdAt, // <--- Include createdAt
      updatedAt: users.updatedAt, // <--- Include updatedAt
      photoUrlStudent: students.passportPhotoUrl,
      studentFirstName: students.firstName,
      studentLastName: students.lastName,
      photoUrlStaff: staff.passportPhotoUrl,
      staffFirstName: staff.firstName,
      staffLastName: staff.lastName,
    })
    .from(users)
    .leftJoin(roles, eq(users.roleId, roles.id))
    .leftJoin(students, eq(users.id, students.userId))
    .leftJoin(staff, eq(users.id, staff.userId));

  const usersList = result.map(u => ({
    id: u.id,
    email: u.email,
    roleId: u.roleId, // Pass through roleId
    roleName: u.roleName || null, // Ensure string | null type
    fullName:
      (u.staffFirstName && u.staffLastName ? `${u.staffFirstName} ${u.staffLastName}` : null) ||
      (u.studentFirstName && u.studentLastName ? `${u.studentFirstName} ${u.studentLastName}` : null) ||
      null, // Ensure string | null type for fullName
    photoUrl: u.photoUrlStaff || u.photoUrlStudent || null, // Ensure string | null type for photoUrl
    createdAt: u.createdAt.toISOString(), // Convert Date object to ISO string
    updatedAt: u.updatedAt.toISOString(), // Convert Date object to ISO string
  }));

  return usersList;
}