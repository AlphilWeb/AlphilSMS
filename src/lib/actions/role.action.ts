// In: src/lib/actions/role.actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db/index';
import { roles, NewRole } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getAuthUser } from '@/lib/auth';
import { checkPermission } from '@/lib/rbac';

class ActionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ActionError';
  }
}

/**
 * Creates a new role in the database.
 * Permissions: Admin (1)
 */
export async function createRole(formData: FormData) {
  try {
    const authUser = await getAuthUser();
    if (!authUser || !checkPermission(authUser, ['1'])) {
      throw new ActionError('Unauthorized: You do not have permission to create roles.');
    }

    const name = formData.get('name') as string;

    if (!name) {
      return { error: 'Role name is required.' };
    }

    const newRole: NewRole = { name };

    await db.insert(roles).values(newRole);

    revalidatePath('/dashboard/roles'); // Assuming a dashboard route for roles
    return { success: 'Role created successfully.' };

  } catch (err: any) {
    console.error('[CREATE_ROLE_ACTION_ERROR]', err);
    throw new ActionError(err.message || 'Failed to create role due to a server error.');
  }
}

/**
 * Updates an existing role's details.
 * Permissions: Admin (1)
 */
export async function updateRole(roleId: number, formData: FormData) {
  try {
    const authUser = await getAuthUser();
    if (!authUser || !checkPermission(authUser, ['1'])) {
      throw new ActionError('Unauthorized: You do not have permission to update roles.');
    }

    const name = formData.get('name') as string | null;

    const updates: Partial<NewRole> = {};
    if (name) updates.name = name;

    if (Object.keys(updates).length === 0) {
      return { error: 'No fields to update.' };
    }

    await db.update(roles).set(updates).where(eq(roles.id, roleId));

    revalidatePath('/dashboard/roles');
    revalidatePath(`/dashboard/roles/${roleId}`);
    return { success: 'Role updated successfully.' };

  } catch (err: any) {
    console.error('[UPDATE_ROLE_ACTION_ERROR]', err);
    throw new ActionError(err.message || 'Failed to update role due to a server error.');
  }
}

/**
 * Deletes a role from the database.
 * Permissions: Admin (1)
 */
export async function deleteRole(roleId: number) {
  try {
    const authUser = await getAuthUser();
    if (!authUser || !checkPermission(authUser, ['1'])) {
      throw new ActionError('Unauthorized: You do not have permission to delete roles.');
    }

    await db.delete(roles).where(eq(roles.id, roleId));

    revalidatePath('/dashboard/roles');
    return { success: 'Role deleted successfully.' };

  } catch (err: any) {
    console.error('[DELETE_ROLE_ACTION_ERROR]', err);
    throw new ActionError(err.message || 'Failed to delete role due to a server error.');
  }
}

/**
 * Fetches all roles.
 * Permissions: Admin (1), Registrar (7) - Roles are core to user management.
 */
export async function getRoles() {
  const authUser = await getAuthUser();
  if (!checkPermission(authUser, ['1', '7'])) {
    throw new ActionError('Unauthorized: You do not have permission to view roles.');
  }
  const allRoles = await db.select().from(roles);
  return allRoles;
}