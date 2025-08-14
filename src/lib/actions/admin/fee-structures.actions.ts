// lib/actions/admin.manage.feeStructures.action.ts
'use server';

import { db } from '@/lib/db';
import { feeStructures, programs, semesters, userLogs, invoices } from '@/lib/db/schema';
import { and, eq, asc, sql, like, or, ne } from 'drizzle-orm';
import { getAuthUser } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { ActionError } from '@/lib/utils';

// Types
export type FeeStructureWithDetails = {
  id: number;
  totalAmount: number;
  description: string | null;
  program: {
    id: number;
    name: string;
    code: string;
  };
  semester: {
    id: number;
    name: string;
    startDate?: string;
    endDate?: string; 
  };
  createdAt: Date;
  updatedAt: Date;
};

export type FeeStructureCreateData = {
  programId: number;
  semesterId: number;
  totalAmount: number;
  description?: string;
};

export type FeeStructureUpdateData = {
  programId?: number;
  semesterId?: number;
  totalAmount?: number;
  description?: string | null;
};

export type FeeStructureDetails = {
  id: number;
  totalAmount: number;
  description: string | null;
  program: {
    id: number;
    name: string;
    code: string;
  };
  semester: {
    id: number;
    name: string;
    startDate?: string;
    endDate?: string;
  };
  createdAt: Date;
  updatedAt: Date;
};

// Get all fee structures with basic details
export async function getAllFeeStructures(): Promise<FeeStructureWithDetails[]> {
  const authUser = await getAuthUser();
  if (!authUser) throw new Error('Unauthorized');

  const raw = await db
    .select({
      id: feeStructures.id,
      totalAmount: feeStructures.totalAmount,
      description: feeStructures.description,
      programId: programs.id,
      programName: programs.name,
      programCode: programs.code,
      semesterId: semesters.id,
      semesterName: semesters.name,
      createdAt: feeStructures.createdAt,
      updatedAt: feeStructures.updatedAt,
    })
    .from(feeStructures)
    .innerJoin(programs, eq(programs.id, feeStructures.programId))
    .innerJoin(semesters, eq(semesters.id, feeStructures.semesterId))
    .orderBy(asc(programs.name), asc(semesters.name));

  return raw.map(row => ({
    id: row.id,
    totalAmount: Number(row.totalAmount),
    description: row.description,
    program: {
      id: row.programId,
      name: row.programName,
      code: row.programCode,
    },
    semester: {
      id: row.semesterId,
      name: row.semesterName,
    },
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }));
}

// Search fee structures by program name, semester name, or amount range
export async function searchFeeStructures(query: string): Promise<FeeStructureWithDetails[]> {
  const authUser = await getAuthUser();
  if (!authUser) throw new Error('Unauthorized');

  if (!query.trim()) return await getAllFeeStructures();

  const raw = await db
    .select({
      id: feeStructures.id,
      totalAmount: feeStructures.totalAmount,
      description: feeStructures.description,
      programId: programs.id,
      programName: programs.name,
      programCode: programs.code,
      semesterId: semesters.id,
      semesterName: semesters.name,
      createdAt: feeStructures.createdAt,
      updatedAt: feeStructures.updatedAt,
    })
    .from(feeStructures)
    .innerJoin(programs, eq(programs.id, feeStructures.programId))
    .innerJoin(semesters, eq(semesters.id, feeStructures.semesterId))
    .where(
      or(
        like(programs.name, `%${query}%`),
        like(semesters.name, `%${query}%`),
        like(programs.code, `%${query}%`),
        sql`CAST(${feeStructures.totalAmount} AS TEXT) LIKE ${`%${query}%`}`
      )
    )
    .orderBy(asc(programs.name), asc(semesters.name));

  return raw.map(row => ({
    id: row.id,
    totalAmount: Number(row.totalAmount),
    description: row.description,
    program: {
      id: row.programId,
      name: row.programName,
      code: row.programCode,
    },
    semester: {
      id: row.semesterId,
      name: row.semesterName,
    },
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }));
}

// Get fee structure details by ID
export async function getFeeStructureDetails(feeStructureId: number): Promise<FeeStructureDetails> {
  const authUser = await getAuthUser();
  if (!authUser) throw new Error('Unauthorized');

  const rows = await db
    .select({
      id: feeStructures.id,
      totalAmount: feeStructures.totalAmount,
      description: feeStructures.description,
      programId: programs.id,
      programName: programs.name,
      programCode: programs.code,
      semesterId: semesters.id,
      semesterName: semesters.name,
      semesterStartDate: semesters.startDate,
      semesterEndDate: semesters.endDate,
      createdAt: feeStructures.createdAt,
      updatedAt: feeStructures.updatedAt,
    })
    .from(feeStructures)
    .innerJoin(programs, eq(programs.id, feeStructures.programId))
    .innerJoin(semesters, eq(semesters.id, feeStructures.semesterId))
    .where(eq(feeStructures.id, feeStructureId));

  const row = rows[0];
  if (!row) {
    throw new ActionError('Fee structure not found');
  }

  return {
    id: row.id,
    totalAmount: Number(row.totalAmount),
    description: row.description,
    program: {
      id: row.programId,
      name: row.programName,
      code: row.programCode,
    },
    semester: {
      id: row.semesterId,
      name: row.semesterName,
      startDate: row.semesterStartDate,
      endDate: row.semesterEndDate,
    },
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

// Create a new fee structure
export async function createFeeStructure(data: FeeStructureCreateData) {
  const authUser = await getAuthUser();
  if (!authUser) throw new ActionError('Unauthorized');

  if (!data.programId || !data.semesterId || data.totalAmount <= 0) {
    throw new ActionError('Program, semester, and valid amount are required');
  }

  const existing = (await db
    .select()
    .from(feeStructures)
    .where(and(
      eq(feeStructures.programId, data.programId),
      eq(feeStructures.semesterId, data.semesterId)
    ))
  )[0];

  if (existing) {
    throw new ActionError('Fee structure already exists for this program and semester');
  }

  // 🔑 numeric expects string
  const [inserted] = await db
    .insert(feeStructures)
    .values({
      programId: data.programId,
      semesterId: data.semesterId,
      totalAmount: data.totalAmount.toFixed(2), // <-- convert number -> string
      description: data.description ?? null,
    })
    .returning();

  if (!inserted) throw new ActionError('Failed to create fee structure');

  await db.insert(userLogs).values({
    userId: authUser.userId,
    action: 'create',
    targetTable: 'feeStructures',
    targetId: inserted.id,
    description: `Created fee structure for program ${data.programId} and semester ${data.semesterId}`,
  });

  revalidatePath('/dashboard/admin/fee-structures');
  return inserted;
}



// Update fee structure details
export async function updateFeeStructure(feeStructureId: number, data: FeeStructureUpdateData) {
  const authUser = await getAuthUser();
  if (!authUser) throw new Error('Unauthorized');

  // Get current fee structure details
  const currentFeeStructure = await db
    .select()
    .from(feeStructures)
    .where(eq(feeStructures.id, feeStructureId))
    .then((res) => res[0]);

  if (!currentFeeStructure) {
    throw new ActionError('Fee structure not found');
  }

  // Check for conflicts if updating program or semester
  if (data.programId || data.semesterId) {
    const programId = data.programId ?? currentFeeStructure.programId;
    const semesterId = data.semesterId ?? currentFeeStructure.semesterId;

    const existingFeeStructure = await db
      .select()
      .from(feeStructures)
      .where(
        and(
          ne(feeStructures.id, feeStructureId),
          eq(feeStructures.programId, programId),
          eq(feeStructures.semesterId, semesterId)
        )
      )
      .then((res) => res[0]);

    if (existingFeeStructure) {
      throw new ActionError('Another fee structure already exists for this program and semester combination');
    }
  }

  // Update fee structure
  const updatedFeeStructure = await db
    .update(feeStructures)
.set({
  ...data,
  totalAmount: data.totalAmount !== undefined 
    ? data.totalAmount.toFixed(2) // numeric → string
    : undefined,
  updatedAt: new Date(),
})
    .where(eq(feeStructures.id, feeStructureId))
    .returning();

  if (updatedFeeStructure.length === 0) {
    throw new ActionError('Failed to update fee structure');
  }

  // Log the action
  await db.insert(userLogs).values({
    userId: authUser.userId,
    action: 'update',
    targetTable: 'feeStructures',
    targetId: feeStructureId,
    description: `Updated fee structure details`,
  });

  revalidatePath('/dashboard/admin/fee-structures');
  revalidatePath(`/dashboard/admin/fee-structures/${feeStructureId}`);
  return updatedFeeStructure[0];
}

// Delete a fee structure
export async function deleteFeeStructure(feeStructureId: number) {
  const authUser = await getAuthUser();
  if (!authUser) throw new Error('Unauthorized');

  // Get fee structure details for logging
  const feeStructure = await db
    .select()
    .from(feeStructures)
    .where(eq(feeStructures.id, feeStructureId))
    .then((res) => res[0]);

  if (!feeStructure) {
    throw new ActionError('Fee structure not found');
  }

  // Check if fee structure is referenced by any invoices
  const invoiceCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(invoices)
    .where(eq(invoices.feeStructureId, feeStructureId))
    .then((res) => res[0].count);

  if (invoiceCount > 0) {
    throw new ActionError('Cannot delete fee structure that is referenced by invoices');
  }

  // Delete fee structure
  await db
    .delete(feeStructures)
    .where(eq(feeStructures.id, feeStructureId));

  // Log the action
  await db.insert(userLogs).values({
    userId: authUser.userId,
    action: 'delete',
    targetTable: 'feeStructures',
    targetId: feeStructureId,
    description: `Deleted fee structure for program ${feeStructure.programId} and semester ${feeStructure.semesterId}`,
  });

  revalidatePath('/dashboard/admin/fee-structures');
  return { success: true };
}