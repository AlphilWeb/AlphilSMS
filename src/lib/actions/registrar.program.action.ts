// actions/registrar.programs.actions.ts
'use server';

import { db } from '@/lib/db';
import { programs, departments, courses } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { getAuthUser } from '@/lib/auth';

export async function getPrograms() {
  const authUser = await getAuthUser();
  if (!authUser || authUser.role.toLowerCase() !== 'registrar') {
    throw new Error('Unauthorized');
  }

  return db.query.programs.findMany({
    with: {
      department: true
    },
    orderBy: (programs, { asc }) => [asc(programs.name)]
  });
}

export async function getProgramById(programId: number) {
  const authUser = await getAuthUser();
  if (!authUser || authUser.role.toLowerCase() !== 'registrar') {
    throw new Error('Unauthorized');
  }

  return db.query.programs.findFirst({
    where: eq(programs.id, programId),
    with: {
      department: true,
      courses: {
        with: {
          semester: true
        }
      }
    }
  });
}

export async function createProgram(data: {
  name: string;
  code: string;
  departmentId: number;
  durationSemesters: number;
}) {
  const authUser = await getAuthUser();
  if (!authUser || authUser.role.toLowerCase() !== 'registrar') {
    throw new Error('Unauthorized');
  }

  // Check if program code already exists
  const existingProgram = await db.query.programs.findFirst({
    where: eq(programs.code, data.code)
  });

  if (existingProgram) {
    throw new Error('Program with this code already exists');
  }

  return db.insert(programs)
    .values(data)
    .returning();
}

export async function updateProgram(programId: number, data: {
  name?: string;
  code?: string;
  departmentId?: number;
  durationSemesters?: number;
}) {
  const authUser = await getAuthUser();
  if (!authUser || authUser.role.toLowerCase() !== 'registrar') {
    throw new Error('Unauthorized');
  }

  if (data.code) {
    // Check if new code conflicts with other programs
    const existingProgram = await db.query.programs.findFirst({
      where: and(
        eq(programs.code, data.code),
        sql`${programs.id} != ${programId}`
      )
    });

    if (existingProgram) {
      throw new Error('Another program already uses this code');
    }
  }

  return db.update(programs)
    .set(data)
    .where(eq(programs.id, programId))
    .returning();
}

export async function deleteProgram(programId: number) {
  const authUser = await getAuthUser();
  if (!authUser || authUser.role.toLowerCase() !== 'registrar') {
    throw new Error('Unauthorized');
  }

  // Check if program has courses
  const programCourses = await db.query.courses.findMany({
    where: eq(courses.programId, programId)
  });

  if (programCourses.length > 0) {
    throw new Error('Cannot delete program with existing courses');
  }

  return db.delete(programs)
    .where(eq(programs.id, programId))
    .returning();
}

export async function getProgramsByDepartment(departmentId: number) {
  const authUser = await getAuthUser();
  if (!authUser || authUser.role.toLowerCase() !== 'registrar') {
    throw new Error('Unauthorized');
  }

  return db.query.programs.findMany({
    where: eq(programs.departmentId, departmentId),
    orderBy: (programs, { asc }) => [asc(programs.name)]
  });
}

export async function getProgramsStatistics() {
  const authUser = await getAuthUser();
  if (!authUser || authUser.role.toLowerCase() !== 'registrar') {
    throw new Error('Unauthorized');
  }

  return db.select({
    programId: programs.id,
    programName: programs.name,
    departmentName: departments.name,
    courseCount: sql<number>`count(${courses.id})`
  })
  .from(programs)
  .leftJoin(departments, eq(programs.departmentId, departments.id))
  .leftJoin(courses, eq(courses.programId, programs.id))
  .groupBy(programs.id, departments.name);
}

export type ProgramsWithDepartment = Awaited<ReturnType<typeof getPrograms>>[number];
export type ProgramWithDetails = Awaited<ReturnType<typeof getProgramById>>;
export type ProgramStatistics = Awaited<ReturnType<typeof getProgramsStatistics>>[number];