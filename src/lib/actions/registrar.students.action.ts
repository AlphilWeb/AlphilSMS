'use server';

import { db } from '@/lib/db';
import { students } from '@/lib/db/schema';
import {  eq, like, sql, asc, or } from 'drizzle-orm';
import { getAuthUser } from '@/lib/auth';

export async function searchStudents(query: string, page = 1, limit = 10) {
  const authUser = await getAuthUser();
  if (!authUser || authUser.role.toUpperCase() !== 'REGISTRAR') {
    throw new Error('Unauthorized');
  }

  const offset = (page - 1) * limit;

  const [studentsList, totalCountResult] = await Promise.all([
    db.query.students.findMany({
      where: or(
        like(students.firstName, `%${query}%`),
        like(students.lastName, `%${query}%`),
        like(students.registrationNumber, `%${query}%`)
      ),
      with: {
        program: true,
        department: true,
        currentSemester: true
      },
      limit,
      offset,
      orderBy: [asc(students.lastName), asc(students.firstName)]
    }),
    db.select({ count: sql<number>`count(*)` })
      .from(students)
      .where(or(
        like(students.firstName, `%${query}%`),
        like(students.lastName, `%${query}%`),
        like(students.registrationNumber, `%${query}%`)
      ))
      .then(res => res[0]) // returns { count: number }
  ]);

  const totalPages = Math.ceil((totalCountResult.count || 0) / limit);

  return {
    students: studentsList,
    totalPages,
  };
}

export async function getStudentDetails(studentId: number) {
  const authUser = await getAuthUser();
  if (!authUser || authUser.role.toUpperCase() !== 'REGISTRAR') {
    throw new Error('Unauthorized');
  }

  return db.query.students.findFirst({
    where: eq(students.id, studentId),
    with: {
      user: true,
      program: true,
      department: true,
      currentSemester: true,
      enrollments: {
        with: {
          course: true,
          semester: true,
          grade: true
        }
      }
    }
  });
}

export async function updateStudentRecord(studentId: number, data: {
  programId?: number;
  currentSemesterId?: number;
  registrationNumber?: string;
}) {
  const authUser = await getAuthUser();
  if (!authUser || authUser.role.toUpperCase() !== 'REGISTRAR') {
    throw new Error('Unauthorized');
  }

  return db.update(students)
    .set(data)
    .where(eq(students.id, studentId))
    .returning();
}
