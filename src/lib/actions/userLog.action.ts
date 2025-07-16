// lib/actions/userLog.actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db/index';
import { userLogs } from '@/lib/db/schema'; // Only import userLogs, NewUserLog and SelectUserLog are inferred
import { eq, desc } from 'drizzle-orm';
import { getAuthUser } from '@/lib/auth';
import { checkPermission } from '@/lib/rbac';
import { z } from 'zod';

class ActionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ActionError';
  }
}

// Zod schema for creating a new user log (for client-side form submission)
const CreateUserLogSchema = z.object({
  userId: z.string().transform(Number).refine(num => !isNaN(num) && num > 0, { message: "User ID must be a valid number." }),
  action: z.string().min(1, "Action cannot be empty."),
  targetTable: z.string().nullable().optional(),
  targetId: z.string().nullable().optional().transform(val => val === '' ? null : (val ? Number(val) : null)).refine(val => val === null || (!isNaN(val) && val >= 0), { message: "Target ID must be a valid number or empty." }),
  // Timestamp from datetime-local input will be a string, convert to Date object
  timestamp: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Timestamp must be in YYYY-MM-DDTHH:MM format.")
    .transform(str => new Date(str)),
  description: z.string().nullable().optional(),
});

// Zod schema for updating a user log (all fields optional for partial updates)
const UpdateUserLogSchema = CreateUserLogSchema.partial();

/**
 * Creates a new user log record from client-side form submission.
 * Permissions: Admin ('admin') - Direct creation of logs is typically restricted.
 * @param formData - FormData containing user log details.
 * @returns A success message or an error object.
 */
export async function createUserLog(formData: FormData) {
  try {
    const authUser = await getAuthUser();
    if (!authUser || !checkPermission(authUser, ['admin'])) { // Only Admin can directly create logs via form
      throw new ActionError('Unauthorized: You do not have permission to create user logs.');
    }

    const parsed = CreateUserLogSchema.safeParse({
      userId: formData.get('userId'),
      action: formData.get('action'),
      targetTable: formData.get('targetTable'),
      targetId: formData.get('targetId'),
      timestamp: formData.get('timestamp'),
      description: formData.get('description'),
    });

    if (!parsed.success) {
      console.error("Validation Error:", parsed.error.issues);
      return { error: parsed.error.issues.map(e => e.message).join(', ') };
    }

    const dataToInsert: typeof userLogs.$inferInsert = {
      userId: parsed.data.userId,
      action: parsed.data.action,
      targetTable: parsed.data.targetTable,
      targetId: parsed.data.targetId,
      timestamp: parsed.data.timestamp, // This is now a Date object
      description: parsed.data.description,
    };

    const newUserLog = await db.insert(userLogs).values(dataToInsert).returning();

    revalidatePath('/dashboard/userLogs');
    return { success: true, data: newUserLog[0] };

  } catch (err: any) {
    console.error('[CREATE_USER_LOG_ACTION_ERROR]', err);
    return { error: err.message || 'Failed to create user log due to a server error.' };
  }
}

/**
 * Fetches all user logs.
 * Permissions: Admin ('admin')
 * @returns An array of user logs or throws an ActionError.
 */
export async function getUserLogs() {
  try {
    const authUser = await getAuthUser();
    if (!authUser || !checkPermission(authUser, ['admin'])) { // Changed roleId to role string
      throw new ActionError('Unauthorized: You do not have permission to view user logs.');
    }
    // Use $dynamic() for consistent type inference if you plan to add conditional .where()
    const allUserLogs = await db.select().from(userLogs).orderBy(desc(userLogs.timestamp)).$dynamic();
    return allUserLogs;
  } catch (err: any) {
    console.error('[GET_USER_LOGS_ACTION_ERROR]', err);
    throw new ActionError(err.message || 'Failed to fetch user logs due to a server error.');
  }
}

/**
 * Fetches user logs for a specific user.
 * Permissions: Admin ('admin')
 * @param userId - The ID of the user whose logs to fetch.
 * @returns An array of user logs or throws an ActionError.
 */
export async function getUserLogsByUserId(userId: number) {
  try {
    const authUser = await getAuthUser();
    // Admin can view any user's logs.
    // If you want to allow a user to view their own logs, add 'user' role and check authUser.userId === userId
    if (!authUser || !checkPermission(authUser, ['admin'])) { // Changed roleId to role string
      throw new ActionError('Unauthorized: You do not have permission to view these user logs.');
    }
    const logs = await db.select().from(userLogs).where(eq(userLogs.userId, userId)).orderBy(desc(userLogs.timestamp));
    return logs;
  } catch (err: any) {
    console.error('[GET_USER_LOGS_BY_USER_ID_ACTION_ERROR]', err);
    throw new ActionError(err.message || 'Failed to fetch user logs by user ID due to a server error.');
  }
}

/**
 * Updates an existing user log record.
 * Permissions: Admin ('admin') - Direct modification of logs is typically restricted.
 * @param id - The ID of the user log to update.
 * @param formData - FormData containing updated user log details.
 * @returns A success message or an error object.
 */
export async function updateUserLog(id: number, formData: FormData) {
  try {
    const authUser = await getAuthUser();
    if (!authUser || !checkPermission(authUser, ['admin'])) { // Only Admin can directly update logs
      throw new ActionError('Unauthorized: You do not have permission to update user logs.');
    }

    const parsed = UpdateUserLogSchema.safeParse({
      userId: formData.get('userId'),
      action: formData.get('action'),
      targetTable: formData.get('targetTable'),
      targetId: formData.get('targetId'),
      timestamp: formData.get('timestamp'),
      description: formData.get('description'),
    });

    if (!parsed.success) {
      console.error("Validation Error:", parsed.error.issues);
      return { error: parsed.error.issues.map(e => e.message).join(', ') };
    }

    const updates: Partial<typeof userLogs.$inferInsert> = {
      userId: parsed.data.userId,
      action: parsed.data.action,
      targetTable: parsed.data.targetTable,
      targetId: parsed.data.targetId,
      timestamp: parsed.data.timestamp, // This is now a Date object or undefined
      description: parsed.data.description,
    };

    const updatedUserLog = await db.update(userLogs)
      .set(updates)
      .where(eq(userLogs.id, id))
      .returning();

    if (updatedUserLog.length === 0) {
      return { error: "User log not found or no changes made." };
    }

    revalidatePath('/dashboard/userLogs');
    revalidatePath(`/dashboard/userLogs/${id}`); // Revalidate specific log page if it exists
    return { success: true, data: updatedUserLog[0] };

  } catch (err: any) {
    console.error('[UPDATE_USER_LOG_ACTION_ERROR]', err);
    return { error: err.message || 'Failed to update user log due to a server error.' };
  }
}

/**
 * Deletes a user log record.
 * Permissions: Admin ('admin') - Direct deletion of logs is typically restricted.
 * @param id - The ID of the user log to delete.
 * @returns A success message or an error object.
 */
export async function deleteUserLog(id: number) {
  try {
    const authUser = await getAuthUser();
    if (!authUser || !checkPermission(authUser, ['admin'])) { // Only Admin can directly delete logs
      throw new ActionError('Unauthorized: You do not have permission to delete user logs.');
    }

    const deletedUserLog = await db.delete(userLogs)
      .where(eq(userLogs.id, id))
      .returning();

    if (deletedUserLog.length === 0) {
      return { error: "User log not found." };
    }

    revalidatePath('/dashboard/userLogs');
    return { success: true, data: deletedUserLog[0] };

  } catch (err: any) {
    console.error('[DELETE_USER_LOG_ACTION_ERROR]', err);
    return { error: err.message || 'Failed to delete user log due to a server error.' };
  }
}

/**
 * Internal function to create a log entry from other actions.
 * This is intended to be called by other server actions to log events,
 * not directly by client forms. It does not perform permission checks
 * as the calling action should already have done so.
 * @param log - The log entry data (excluding auto-generated id and timestamp).
 */
export async function createLogEntry(log: Omit<typeof userLogs.$inferInsert, 'id' | 'timestamp'>) {
  try {
    // Drizzle will automatically set 'timestamp' via defaultNow()
    await db.insert(userLogs).values(log);
  } catch (err) {
    console.error('Failed to create internal log entry:', err);
    // Do not throw, as logging should not block the primary action.
  }
}