// lib/actions/admin.manage.students.action.ts
'use server';

import { db } from '@/lib/db';
import { students, users, programs, departments, semesters, enrollments, userLogs, courses } from '@/lib/db/schema';
import { and, eq, asc, sql, like, or, ne } from 'drizzle-orm';
import { getAuthUser } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { ActionError } from '@/lib/utils';

// Types

interface Role {
  id: number;
  name: string;
}
interface User {
  id: number;
  role: Role;
}
export type StudentWithDetails = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  registrationNumber: string;
  studentNumber: string;
  program: {
    id: number;
    name: string;
  };
  department: {
    id: number;
    name: string;
  };
  currentSemester: {
    id: number;
    name: string;
  };
  user?: User;
  createdAt: Date;
  updatedAt: Date;
};

export type StudentEnrollment = {
  id: number;
  course: {
    id: number;
    name: string;
    code: string;
  };
  semester: {
    id: number;
    name: string;
  };
  enrollmentDate: string | null;
};

export type StudentCreateData = {
  firstName: string;
  lastName: string;
  email: string;
  registrationNumber: string;
  studentNumber: string;
  programId: number;
  departmentId: number;
  currentSemesterId: number;
};

export type StudentUpdateData = {
  firstName?: string;
  lastName?: string;
  email?: string;
  registrationNumber?: string;
  studentNumber?: string;
  programId?: number;
  departmentId?: number;
  currentSemesterId?: number;
};

export type StudentDetails = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  registrationNumber: string;
  studentNumber: string;
  program: {
    id: number;
    name: string;
  };
  department: {
    id: number;
    name: string;
  };
  currentSemester: {
    id: number;
    name: string;
  };
  createdAt: Date;
  updatedAt: Date;
};



// Get all students with basic details
export async function getAllStudents(): Promise<StudentWithDetails[]> {
  const authUser = await getAuthUser();
  if (!authUser) throw new Error('Unauthorized');

  return db
    .select({
      id: students.id,
      firstName: students.firstName,
      lastName: students.lastName,
      email: students.email,
      registrationNumber: students.registrationNumber,
      studentNumber: students.studentNumber,
      program: {
        id: programs.id,
        name: programs.name,
      },
      department: {
        id: departments.id,
        name: departments.name,
      },
      currentSemester: {
        id: semesters.id,
        name: semesters.name,
      },
      createdAt: students.createdAt,
      updatedAt: students.updatedAt,
    })
    .from(students)
    .innerJoin(programs, eq(programs.id, students.programId))
    .innerJoin(departments, eq(departments.id, students.departmentId))
    .innerJoin(semesters, eq(semesters.id, students.currentSemesterId))
    .orderBy(asc(students.lastName), asc(students.firstName));
}

// Search students by name, email, or registration number
export async function searchStudents(query: string): Promise<StudentWithDetails[]> {
  const authUser = await getAuthUser();
  if (!authUser) throw new Error('Unauthorized');

  if (!query.trim()) return getAllStudents();

  return db
    .select({
      id: students.id,
      firstName: students.firstName,
      lastName: students.lastName,
      email: students.email,
      registrationNumber: students.registrationNumber,
      studentNumber: students.studentNumber,
      program: {
        id: programs.id,
        name: programs.name,
      },
      department: {
        id: departments.id,
        name: departments.name,
      },
      currentSemester: {
        id: semesters.id,
        name: semesters.name,
      },
      createdAt: students.createdAt,
      updatedAt: students.updatedAt,
    })
    .from(students)
    .innerJoin(programs, eq(programs.id, students.programId))
    .innerJoin(departments, eq(departments.id, students.departmentId))
    .innerJoin(semesters, eq(semesters.id, students.currentSemesterId))
    .where(
      or(
        like(students.firstName, `%${query}%`),
        like(students.lastName, `%${query}%`),
        like(students.email, `%${query}%`),
        like(students.registrationNumber, `%${query}%`),
        like(students.studentNumber, `%${query}%`),
        // Add full name search (first + last)
        like(sql`CONCAT(${students.firstName}, ' ', ${students.lastName})`, `%${query}%`),
        // Also search last + first name
        like(sql`CONCAT(${students.lastName}, ' ', ${students.firstName})`, `%${query}%`)
      )
    )
    .orderBy(asc(students.lastName), asc(students.firstName));
}

// Get student details by ID
export async function getStudentDetails(studentId: number): Promise<StudentWithDetails> {
  const authUser = await getAuthUser();
  if (!authUser) throw new Error('Unauthorized');

  const student = await db
    .select({
      id: students.id,
      firstName: students.firstName,
      lastName: students.lastName,
      email: students.email,
      registrationNumber: students.registrationNumber,
      studentNumber: students.studentNumber,
      program: {
        id: programs.id,
        name: programs.name,
      },
      department: {
        id: departments.id,
        name: departments.name,
      },
      currentSemester: {
        id: semesters.id,
        name: semesters.name,
      },
      createdAt: students.createdAt,
      updatedAt: students.updatedAt,
    })
    .from(students)
    .innerJoin(programs, eq(programs.id, students.programId))
    .innerJoin(departments, eq(departments.id, students.departmentId))
    .innerJoin(semesters, eq(semesters.id, students.currentSemesterId))
    .where(eq(students.id, studentId))
    .then((res) => res[0]);

  if (!student) {
    throw new ActionError('Student not found');
  }

  return student;
}

// Get student enrollments
export async function getStudentEnrollments(studentId: number): Promise<StudentEnrollment[]> {
  const authUser = await getAuthUser();
  if (!authUser) throw new Error('Unauthorized');

  return db
    .select({
      id: enrollments.id,
      course: {
        id: courses.id,
        name: courses.name,
        code: courses.code,
      },
      semester: {
        id: semesters.id,
        name: semesters.name,
      },
      enrollmentDate: enrollments.enrollmentDate,
    })
    .from(enrollments)
    .innerJoin(courses, eq(courses.id, enrollments.courseId))
    .innerJoin(semesters, eq(semesters.id, enrollments.semesterId))
    .where(eq(enrollments.studentId, studentId))
    .orderBy(asc(semesters.name), asc(courses.name));
}

// Create a new student
export async function createStudent(data: StudentCreateData) {
  const authUser = await getAuthUser();
  if (!authUser) throw new Error('Unauthorized');

  // Validate required fields
  if (!data.firstName.trim() || !data.lastName.trim() || !data.email.trim() || 
      !data.registrationNumber.trim() || !data.studentNumber.trim()) {
    throw new ActionError('All fields are required');
  }

  // Check for existing email, registration number, or student number
  const existingStudent = await db
    .select()
    .from(students)
    .where(
      or(
        eq(students.email, data.email),
        eq(students.registrationNumber, data.registrationNumber),
        eq(students.studentNumber, data.studentNumber)
      )
    )
    .then((res) => res[0]);

  if (existingStudent) {
    if (existingStudent.email === data.email) {
      throw new ActionError('Student with this email already exists');
    }
    if (existingStudent.registrationNumber === data.registrationNumber) {
      throw new ActionError('Student with this registration number already exists');
    }
    if (existingStudent.studentNumber === data.studentNumber) {
      throw new ActionError('Student with this student number already exists');
    }
  }

  // Create user first
  const newUser = await db
    .insert(users)
    .values({
      email: data.email,
      passwordHash: '', // Temporary empty password, should be set via email
      roleId: 3, // Assuming 3 is the student role ID
    })
    .returning();

  // Then create student
  const newStudent = await db
    .insert(students)
    .values({
      userId: newUser[0].id,
      programId: data.programId,
      departmentId: data.departmentId,
      currentSemesterId: data.currentSemesterId,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      registrationNumber: data.registrationNumber,
      studentNumber: data.studentNumber,
    })
    .returning();

  // Log the action
  await db.insert(userLogs).values({
    userId: authUser.userId,
    action: 'create',
    targetTable: 'students',
    targetId: newStudent[0].id,
    description: `Created student ${data.firstName} ${data.lastName} (${data.registrationNumber})`,
  });

  revalidatePath('/dashboard/admin/students');
  return newStudent[0];
}

// Update student details
export async function updateStudent(studentId: number, data: StudentUpdateData) {
  const authUser = await getAuthUser();
  if (!authUser) throw new Error('Unauthorized');

  // Get current student details
  const currentStudent = await db
    .select()
    .from(students)
    .where(eq(students.id, studentId))
    .then((res) => res[0]);

  if (!currentStudent) {
    throw new ActionError('Student not found');
  }

  // Check for conflicts if updating unique fields
  if (data.email || data.registrationNumber || data.studentNumber) {
    const existingStudent = await db
      .select()
      .from(students)
      .where(
        and(
          ne(students.id, studentId),
          or(
            data.email ? eq(students.email, data.email) : sql`false`,
            data.registrationNumber ? eq(students.registrationNumber, data.registrationNumber) : sql`false`,
            data.studentNumber ? eq(students.studentNumber, data.studentNumber) : sql`false`
          )
        )
      )
      .then((res) => res[0]);

    if (existingStudent) {
      if (data.email && existingStudent.email === data.email) {
        throw new ActionError('Another student with this email already exists');
      }
      if (data.registrationNumber && existingStudent.registrationNumber === data.registrationNumber) {
        throw new ActionError('Another student with this registration number already exists');
      }
      if (data.studentNumber && existingStudent.studentNumber === data.studentNumber) {
        throw new ActionError('Another student with this student number already exists');
      }
    }
  }

  // Update student
  const updatedStudent = await db
    .update(students)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(students.id, studentId))
    .returning();

  if (updatedStudent.length === 0) {
    throw new ActionError('Failed to update student');
  }

  // Update user email if it was changed
  if (data.email) {
    if (currentStudent.userId !== null && currentStudent.userId !== undefined) {
      await db
        .update(users)
        .set({
          email: data.email,
          updatedAt: new Date(),
        })
        .where(eq(users.id, currentStudent.userId));
    }
  }

  // Log the action
  await db.insert(userLogs).values({
    userId: authUser.userId,
    action: 'update',
    targetTable: 'students',
    targetId: studentId,
    description: `Updated student details`,
  });

  revalidatePath('/dashboard/admin/students');
  revalidatePath(`/dashboard/admin/students/${studentId}`);
  return updatedStudent[0];
}

// Delete a student
export async function deleteStudent(studentId: number) {
  const authUser = await getAuthUser();
  if (!authUser) throw new Error('Unauthorized');

  // Get student details for logging
  const student = await db
    .select()
    .from(students)
    .where(eq(students.id, studentId))
    .then((res) => res[0]);

  if (!student) {
    throw new ActionError('Student not found');
  }

  // Check if student has any enrollments
  const enrollmentCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(enrollments)
    .where(eq(enrollments.studentId, studentId))
    .then((res) => res[0].count);

  if (enrollmentCount > 0) {
    throw new ActionError('Cannot delete student with enrollments');
  }

  // Delete student record first
  await db
    .delete(students)
    .where(eq(students.id, studentId));

  // Then delete the associated user
  if (student.userId !== null && student.userId !== undefined) {
    await db
      .delete(users)
      .where(eq(users.id, student.userId));
  }

  // Log the action
  await db.insert(userLogs).values({
    userId: authUser.userId,
    action: 'delete',
    targetTable: 'students',
    targetId: studentId,
    description: `Deleted student ${student.firstName} ${student.lastName} (${student.registrationNumber})`,
  });

  revalidatePath('/dashboard/admin/students');
  return { success: true };
}