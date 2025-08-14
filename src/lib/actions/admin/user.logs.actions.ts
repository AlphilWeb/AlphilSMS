// app/actions/user-logs.ts
'use server';

import { db } from '@/lib/db';
import { 
  userLogs,
  users,
  roles,
  // NewUserLog,
  SelectUserLog
} from '@/lib/db/schema';
import { and, eq, sql, desc, like, or } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

// Types from your schema
export type UserLogData = {
  userId: number;
  action: string;
  targetTable?: string | null;
  targetId?: number | null;
  description?: string | null;
};

export type UserLogWithDetails = {
  id: number;
  action: string;
  targetTable: string | null;
  targetId: number | null;
  timestamp: Date;
  description: string | null;
  user: {
    id: number;
    email: string;
    role: {
      id: number;
      name: string;
    };
  };
};

export type UserLogsFilter = {
  userId?: number;
  action?: string;
  targetTable?: string;
  startDate?: string;
  endDate?: string;
  searchQuery?: string;
};

export type LogsSummary = {
  totalLogs: number;
  actionsDistribution: {
    action: string;
    count: number;
  }[];
  recentActivity: UserLogWithDetails[];
};

/**
 * Fetches all user logs with user and role details
 */
export async function getAllUserLogs(filter?: UserLogsFilter): Promise<UserLogWithDetails[]> {
  try {
    const conditions = [];

    if (filter) {
      if (filter.userId) conditions.push(eq(userLogs.userId, filter.userId));
      if (filter.action) conditions.push(eq(userLogs.action, filter.action));
      if (filter.targetTable) conditions.push(eq(userLogs.targetTable, filter.targetTable));
      if (filter.startDate) conditions.push(sql`${userLogs.timestamp} >= ${filter.startDate}`);
      if (filter.endDate) conditions.push(sql`${userLogs.timestamp} <= ${filter.endDate}`);
      if (filter.searchQuery) {
        conditions.push(
          or(
            like(userLogs.action, `%${filter.searchQuery}%`),
            like(userLogs.description, `%${filter.searchQuery}%`),
            like(users.email, `%${filter.searchQuery}%`)
          )
        );
      }
    }

    const query = db
      .select({
        id: userLogs.id,
        action: userLogs.action,
        targetTable: userLogs.targetTable,
        targetId: userLogs.targetId,
        timestamp: userLogs.timestamp,
        description: userLogs.description,
        userId: users.id,
        userEmail: users.email,
        roleId: roles.id,
        roleName: roles.name,
      })
      .from(userLogs)
      .leftJoin(users, eq(userLogs.userId, users.id))
      .leftJoin(roles, eq(users.roleId, roles.id))
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(userLogs.timestamp));

    const rawLogs = await query;

    const mappedData: UserLogWithDetails[] = rawLogs.map(row => ({
      id: row.id,
      action: row.action,
      targetTable: row.targetTable ?? null,
      targetId: row.targetId ?? null,
      timestamp: row.timestamp ? new Date(row.timestamp) : new Date(),
      description: row.description ?? null,
      user: {
        id: row.userId ?? 0,
        email: row.userEmail ?? '',
        role: {
          id: row.roleId ?? 0,
          name: row.roleName ?? '',
        },
      },
    }));

    return mappedData;
  } catch (error) {
    console.error('Failed to fetch user logs:', error);
    throw new Error('Failed to fetch user logs');
  }
}

/**
 * Fetches logs by user ID
 */
export async function getUserLogsByUserId(userId: number): Promise<UserLogWithDetails[]> {
  try {
    const rawLogs = await db
      .select({
        id: userLogs.id,
        action: userLogs.action,
        targetTable: userLogs.targetTable,
        targetId: userLogs.targetId,
        timestamp: userLogs.timestamp,
        description: userLogs.description,
        userId: users.id,
        userEmail: users.email,
        roleId: roles.id,
        roleName: roles.name,
      })
      .from(userLogs)
      .leftJoin(users, eq(userLogs.userId, users.id))
      .leftJoin(roles, eq(users.roleId, roles.id))
      .where(eq(userLogs.userId, userId))
      .orderBy(desc(userLogs.timestamp));

    const mappedData: UserLogWithDetails[] = rawLogs
      .filter(row => row.userId !== null && row.roleId !== null)
      .map(row => ({
        id: row.id,
        action: row.action,
        targetTable: row.targetTable ?? null,
        targetId: row.targetId ?? null,
        timestamp: new Date(row.timestamp!),
        description: row.description ?? null,
        user: {
          id: row.userId!,
          email: row.userEmail ?? '',
          role: {
            id: row.roleId!,
            name: row.roleName ?? '',
          },
        },
      }));

    return mappedData;
  } catch (error) {
    console.error(`Failed to fetch logs for user ${userId}:`, error);
    throw new Error('Failed to fetch user logs by user ID');
  }
}

/**
 * Fetches a log record by ID with details
 */
export async function getUserLogById(logId: number): Promise<UserLogWithDetails | null> {
  try {
    const rawLog = await db
      .select({
        id: userLogs.id,
        action: userLogs.action,
        targetTable: userLogs.targetTable,
        targetId: userLogs.targetId,
        timestamp: userLogs.timestamp,
        description: userLogs.description,
        userId: users.id,
        userEmail: users.email,
        roleId: roles.id,
        roleName: roles.name,
      })
      .from(userLogs)
      .leftJoin(users, eq(userLogs.userId, users.id))
      .leftJoin(roles, eq(users.roleId, roles.id))
      .where(eq(userLogs.id, logId))
      .limit(1);

    const log = rawLog[0];
    if (!log || log.userId === null || log.roleId === null) {
      return null;
    }

    const mappedData: UserLogWithDetails = {
      id: log.id,
      action: log.action,
      targetTable: log.targetTable ?? null,
      targetId: log.targetId ?? null,
      timestamp: new Date(log.timestamp!),
      description: log.description ?? null,
      user: {
        id: log.userId!,
        email: log.userEmail ?? '',
        role: {
          id: log.roleId!,
          name: log.roleName ?? '',
        },
      },
    };

    return mappedData;
  } catch (error) {
    console.error(`Failed to fetch log ${logId}:`, error);
    throw new Error('Failed to fetch user log by ID');
  }
}

/**
 * Creates a new user log record
 */
export async function createUserLog(logData: UserLogData): Promise<SelectUserLog> {
  try {
    const result = await db.insert(userLogs).values({
      userId: logData.userId,
      action: logData.action,
      targetTable: logData.targetTable ?? null,
      targetId: logData.targetId ?? null,
      description: logData.description ?? null,
    }).returning();

    if (!result.length) throw new Error('Insert failed: no record returned');

    revalidatePath('/admin/user-logs');
    return result[0];
  } catch (error) {
    console.error('Failed to create user log:', error);
    throw new Error('Failed to create user log');
  }
}

/**
 * Gets logs summary statistics
 */
export async function getLogsSummary(): Promise<LogsSummary> {
  try {
    const [totalLogsResult, actionsDistributionResult, recentActivityResult] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(userLogs),
      db
        .select({
          action: userLogs.action,
          count: sql<number>`count(*)`,
        })
        .from(userLogs)
        .groupBy(userLogs.action),
      db
        .select({
          id: userLogs.id,
          action: userLogs.action,
          targetTable: userLogs.targetTable,
          targetId: userLogs.targetId,
          timestamp: userLogs.timestamp,
          description: userLogs.description,
          userId: users.id,
          userEmail: users.email,
          roleId: roles.id,
          roleName: roles.name,
        })
        .from(userLogs)
        .leftJoin(users, eq(userLogs.userId, users.id))
        .leftJoin(roles, eq(users.roleId, roles.id))
        .orderBy(desc(userLogs.timestamp))
        .limit(5),
    ]);

    const recentActivity: UserLogWithDetails[] = recentActivityResult
      .filter(row => row.userId !== null && row.roleId !== null)
      .map(row => ({
        id: row.id,
        action: row.action,
        targetTable: row.targetTable ?? null,
        targetId: row.targetId ?? null,
        timestamp: new Date(row.timestamp!),
        description: row.description ?? null,
        user: {
          id: row.userId!,
          email: row.userEmail ?? '',
          role: {
            id: row.roleId!,
            name: row.roleName ?? '',
          },
        },
      }));

    return {
      totalLogs: totalLogsResult[0]?.count ?? 0,
      actionsDistribution: actionsDistributionResult.map(row => ({
        action: row.action!,
        count: row.count,
      })),
      recentActivity,
    };
  } catch (error) {
    console.error('Failed to fetch logs summary:', error);
    throw new Error('Failed to fetch logs summary');
  }
}