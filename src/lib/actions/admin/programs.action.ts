// lib/actions/admin.manage.programs.action.ts
'use server';

import { db } from '@/lib/db';
import { programs, departments, courses, students, semesters, staff, userLogs } from '@/lib/db/schema';
import { and, eq, asc, sql, ne } from 'drizzle-orm';
import { getAuthUser } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { ActionError } from '@/lib/utils';

// Types
export type ProgramWithStats = {
  id: number;
  name: string;
  code: string;
  durationSemesters: number;
  department: {
    id: number;
    name: string;
  };
  studentCount: number;
  courseCount: number;
};

export type ProgramDetails = ProgramWithStats & {
  createdAt: Date;
  updatedAt: Date;
};

export type ProgramCourse = {
  id: number;
  name: string;
  code: string;
  credits: number | string;
  semester: {
    id: number;
    name: string;
  };
  lecturer: {
    id: number;
    firstName: string;
    lastName: string;
  } | null;
};

export type ProgramStudent = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  registrationNumber: string;
  currentSemester: {
    id: number;
    name: string;
  };
};

// Get all programs with statistics
export async function getAllPrograms(): Promise<ProgramWithStats[]> {
  const authUser = await getAuthUser();
  if (!authUser) throw new Error('Unauthorized');

  return db
    .select({
      id: programs.id,
      name: programs.name,
      code: programs.code,
      durationSemesters: programs.durationSemesters,
      department: {
        id: departments.id,
        name: departments.name,
      },
      studentCount: sql<number>`(
        SELECT COUNT(*) FROM ${students} 
        WHERE ${students.programId} = ${programs.id}
      )`,
      courseCount: sql<number>`(
        SELECT COUNT(*) FROM ${courses} 
        WHERE ${courses.programId} = ${programs.id}
      )`,
    })
    .from(programs)
    .innerJoin(departments, eq(departments.id, programs.departmentId))
    .orderBy(asc(programs.name));
}

// Get program details
export async function getProgramDetails(
  programId: number,
): Promise<ProgramDetails> {
  const authUser = await getAuthUser();
  if (!authUser) throw new Error('Unauthorized');

  const program = await db
    .select({
      id: programs.id,
      name: programs.name,
      code: programs.code,
      durationSemesters: programs.durationSemesters,
      department: {
        id: departments.id,
        name: departments.name,
      },
      studentCount: sql<number>`(
        SELECT COUNT(*) FROM ${students} 
        WHERE ${students.programId} = ${programs.id}
      )`,
      courseCount: sql<number>`(
        SELECT COUNT(*) FROM ${courses} 
        WHERE ${courses.programId} = ${programs.id}
      )`,
      createdAt: programs.createdAt,
      updatedAt: programs.updatedAt,
    })
    .from(programs)
    .innerJoin(departments, eq(departments.id, programs.departmentId))
    .where(eq(programs.id, programId))
    .then((res) => res[0]);

  if (!program) {
    throw new ActionError('Program not found');
  }

  return program;
}

// Create a new program
export async function createProgram(
  name: string,
  code: string,
  durationSemesters: number,
  departmentId: number
) {
  const authUser = await getAuthUser();
  if (!authUser) throw new Error('Unauthorized');

  // Check if program code already exists
  const existingProgram = await db
    .select()
    .from(programs)
    .where(eq(programs.code, code))
    .then((res) => res[0]);

  if (existingProgram) {
    throw new ActionError('Program with this code already exists');
  }

  const newProgram = await db
    .insert(programs)
    .values({
      name,
      code,
      durationSemesters,
      departmentId,
    })
    .returning();

  // Log the action
  await db.insert(userLogs).values({
    userId: authUser.userId,
    action: 'create',
    targetTable: 'programs',
    targetId: newProgram[0].id,
    description: `Created program "${name}" (${code})`,
  });

  revalidatePath('/dashboard/admin/programs');
  return newProgram[0];
}

// Update program details
export async function updateProgram(
  programId: number,
  data: {
    name?: string;
    code?: string;
    durationSemesters?: number;
    departmentId?: number;
  }
) {
  const authUser = await getAuthUser();
  if (!authUser) throw new Error('Unauthorized');

  // Check if new code already exists
  if (data.code) {
    const existingProgram = await db
      .select()
      .from(programs)
      .where(
        and(
          eq(programs.code, data.code),
          ne(programs.id, programId)
        )
      )
      .then((res) => res[0]);

    if (existingProgram) {
      throw new ActionError('Program with this code already exists');
    }
  }

  const updatedProgram = await db
    .update(programs)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(programs.id, programId))
    .returning();

  if (updatedProgram.length === 0) {
    throw new ActionError('Program not found');
  }

  // Log the action
  await db.insert(userLogs).values({
    userId: authUser.userId,
    action: 'update',
    targetTable: 'programs',
    targetId: programId,
    description: `Updated program details`,
  });

  revalidatePath('/dashboard/admin/programs');
  revalidatePath(`/dashboard/admin/programs/${programId}`);
  return updatedProgram[0];
}

// Get all courses in a program
export async function getProgramCourses(
  programId: number,
): Promise<ProgramCourse[]> {
  const authUser = await getAuthUser();
  if (!authUser) throw new Error('Unauthorized');

  return db
    .select({
      id: courses.id,
      name: courses.name,
      code: courses.code,
      credits: courses.credits,
      semester: {
        id: semesters.id,
        name: semesters.name,
      },
      lecturer: {
        id: staff.id,
        firstName: staff.firstName,
        lastName: staff.lastName,
      },
    })
    .from(courses)
    .innerJoin(semesters, eq(semesters.id, courses.semesterId))
    .leftJoin(staff, eq(staff.id, courses.lecturerId))
    .where(eq(courses.programId, programId))
    .orderBy(asc(courses.name));
}

// Get all students in a program
export async function getProgramStudents(
  programId: number,
): Promise<ProgramStudent[]> {
  const authUser = await getAuthUser();
  if (!authUser) throw new Error('Unauthorized');

  return db
    .select({
      id: students.id,
      firstName: students.firstName,
      lastName: students.lastName,
      email: students.email,
      registrationNumber: students.registrationNumber,
      currentSemester: {
        id: semesters.id,
        name: semesters.name,
      },
    })
    .from(students)
    .innerJoin(semesters, eq(semesters.id, students.currentSemesterId))
    .where(eq(students.programId, programId))
    .orderBy(asc(students.lastName), asc(students.firstName));
}

// Delete a program (only if empty)
export async function deleteProgram(programId: number) {
  const authUser = await getAuthUser();
  if (!authUser) throw new Error('Unauthorized');

  // Check if program has any students or courses
  const [studentCount, courseCount] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)` })
      .from(students)
      .where(eq(students.programId, programId))
      .then((res) => res[0].count),
    db
      .select({ count: sql<number>`count(*)` })
      .from(courses)
      .where(eq(courses.programId, programId))
      .then((res) => res[0].count),
  ]);

  if (studentCount > 0 || courseCount > 0) {
    throw new ActionError(
      'Cannot delete program with students or courses'
    );
  }

  const program = await db
    .delete(programs)
    .where(eq(programs.id, programId))
    .returning();

  if (program.length === 0) {
    throw new ActionError('Program not found');
  }

  // Log the action
  await db.insert(userLogs).values({
    userId: authUser.userId,
    action: 'delete',
    targetTable: 'programs',
    targetId: programId,
    description: `Deleted program "${program[0].name}" (${program[0].code})`,
  });

  revalidatePath('/dashboard/admin/programs');
  return { success: true };
}