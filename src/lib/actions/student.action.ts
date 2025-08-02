// In: src/lib/actions/student.actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db/index';
import { students, NewStudent, programs, departments, semesters, users } from '@/lib/db/schema';
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
  ADMIN: 'Admin',
  REGISTRAR: 'Registrar',
  HOD: 'HOD',
  ACCOUNTANT: 'Accountant',
  LECTURER: 'Lecturer',
  STAFF: 'Staff',
  STUDENT: 'Student',
};

function allowedRolesForManagingStudents() {
  return [ROLES.ADMIN, ROLES.REGISTRAR];
}

function allowedRolesForViewingStudents() {
  return [ROLES.ADMIN, ROLES.REGISTRAR, ROLES.HOD, ROLES.LECTURER];
}

/**
 * Creates a new student.
 */
export async function createStudent(formData: FormData) {
  try {
    const authUser = await getAuthUser();
    if (!authUser || !checkPermission(authUser, allowedRolesForManagingStudents())) {
      return { error: 'Unauthorized: You do not have permission to create students.' };
    }

    const userId = formData.get('userId') ? Number(formData.get('userId')) : null;
    const programId = formData.get('programId') ? Number(formData.get('programId')) : null;
    const departmentId = formData.get('departmentId') ? Number(formData.get('departmentId')) : null;
    const currentSemesterId = formData.get('currentSemesterId') ? Number(formData.get('currentSemesterId')) : null;
    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    const email = formData.get('email') as string;
    const registrationNumber = formData.get('registrationNumber') as string;
    const studentNumber = formData.get('studentNumber') as string;
    const passportPhotoUrl = formData.get('passportPhotoUrl') as string | null;
    const idPhotoUrl = formData.get('idPhotoUrl') as string | null;
    const certificateUrl = formData.get('certificateUrl') as string | null;

    if (!userId || !programId || !departmentId || !currentSemesterId || !firstName || !lastName || !email || !registrationNumber || !studentNumber) {
      return { error: 'Missing required fields for student creation.' };
    }

    // Check for existing student or user with the same email/registration/student number
    const existingStudent = await db.query.students.findFirst({
      where: (s, { or, eq }) => or(
        eq(s.email, email),
        eq(s.registrationNumber, registrationNumber),
        eq(s.studentNumber, studentNumber)
      ),
    });

    if (existingStudent) {
      return { error: 'Student with this email, registration number, or student number already exists.' };
    }

    const newStudent: NewStudent = {
      userId,
      programId,
      departmentId,
      currentSemesterId,
      firstName,
      lastName,
      email,
      registrationNumber,
      studentNumber,
      passportPhotoUrl: passportPhotoUrl || undefined,
      idPhotoUrl: idPhotoUrl || undefined,
      certificateUrl: certificateUrl || undefined,
    };

    await db.insert(students).values(newStudent);

    revalidatePath('/dashboard/students');
    return { success: 'Student created successfully.' };

  } catch (err: unknown) {
  const error = err instanceof Error ? err : new Error(String(err));
  console.error('[ERROR_CONTEXT]', error);
  throw new ActionError(error.message);
}
}

/**
 * Updates an existing student's details.
 */
export async function updateStudent(studentId: number, formData: FormData) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return { error: 'Unauthorized: You must be logged in.' };
    }

    const studentRecord = await db.query.students.findFirst({
      where: eq(students.id, studentId),
      columns: { userId: true }
    });

    if (!studentRecord) {
      return { error: 'Student not found.' };
    }

    // Check if authorized as Admin, Registrar, Department Head, or if it's the user's own student profile.
    if (authUser.userId !== studentRecord.userId && !checkPermission(authUser, [ROLES.ADMIN, ROLES.HOD, ROLES.REGISTRAR])) {
      return { error: 'Unauthorized: You do not have permission to update this student.' };
    }

    const programId = formData.get('programId') ? Number(formData.get('programId')) : null;
    const departmentId = formData.get('departmentId') ? Number(formData.get('departmentId')) : null;
    const currentSemesterId = formData.get('currentSemesterId') ? Number(formData.get('currentSemesterId')) : null;
    const firstName = formData.get('firstName') as string | null;
    const lastName = formData.get('lastName') as string | null;
    const email = formData.get('email') as string | null;
    const registrationNumber = formData.get('registrationNumber') as string | null;
    const studentNumber = formData.get('studentNumber') as string | null;
    const passportPhotoUrl = formData.get('passportPhotoUrl') as string | null;
    const idPhotoUrl = formData.get('idPhotoUrl') as string | null;
    const certificateUrl = formData.get('certificateUrl') as string | null;

    const updates: Partial<NewStudent> = {};
    if (programId !== null) updates.programId = programId;
    if (departmentId !== null) updates.departmentId = departmentId;
    if (currentSemesterId !== null) updates.currentSemesterId = currentSemesterId;
    if (firstName) updates.firstName = firstName;
    if (lastName) updates.lastName = lastName;
    if (email) updates.email = email;
    if (registrationNumber) updates.registrationNumber = registrationNumber;
    if (studentNumber) updates.studentNumber = studentNumber;
    if (passportPhotoUrl !== null) updates.passportPhotoUrl = passportPhotoUrl;
    if (idPhotoUrl !== null) updates.idPhotoUrl = idPhotoUrl;
    if (certificateUrl !== null) updates.certificateUrl = certificateUrl;

    if (Object.keys(updates).length === 0) {
      return { error: 'No fields to update.' };
    }

    await db.update(students).set(updates).where(eq(students.id, studentId));

    revalidatePath('/dashboard/students');
    revalidatePath(`/dashboard/students/${studentId}`);
    return { success: 'Student updated successfully.' };

  } catch (err: unknown) {
  const error = err instanceof Error ? err : new Error(String(err));
  console.error('[ERROR_CONTEXT]', error);
  throw new ActionError(error.message);
}
}

/**
 * Deletes a student.
 */
export async function deleteStudent(studentId: number) {
  try {
    const authUser = await getAuthUser();
    if (!authUser || !checkPermission(authUser, allowedRolesForManagingStudents())) {
      return { error: 'Unauthorized: You do not have permission to delete students.' };
    }

    await db.delete(students).where(eq(students.id, studentId));

    revalidatePath('/dashboard/students');
    return { success: 'Student deleted successfully.' };

  } catch (err: unknown) {
  const error = err instanceof Error ? err : new Error(String(err));
  console.error('[ERROR_CONTEXT]', error);
  throw new ActionError(error.message);
}
}

/**
 * Fetches all students with their associated program, department, and current semester details.
 */
export async function getStudents() {
  try {
    const authUser = await getAuthUser();
    if (!checkPermission(authUser, allowedRolesForViewingStudents())) {
      throw new ActionError('Unauthorized: You do not have permission to view students.');
    }

    const result = await db
      .select({
        id: students.id,
        userId: students.userId,
        firstName: students.firstName,
        lastName: students.lastName,
        email: students.email,
        registrationNumber: students.registrationNumber,
        studentNumber: students.studentNumber,
        passportPhotoUrl: students.passportPhotoUrl,
        idPhotoUrl: students.idPhotoUrl,
        certificateUrl: students.certificateUrl,
        programName: programs.name,
        programCode: programs.code,
        departmentName: departments.name,
        currentSemesterName: semesters.name,
        // Potentially include user details if needed for a more complete picture, e.g., for linking
        userEmail: users.email,
      })
      .from(students)
      .leftJoin(programs, eq(students.programId, programs.id))
      .leftJoin(departments, eq(students.departmentId, departments.id))
      .leftJoin(semesters, eq(students.currentSemesterId, semesters.id))
      .leftJoin(users, eq(students.userId, users.id)); // Join with users to potentially get their email or other user-level details

    const studentList = result.map(s => ({
      id: s.id,
      userId: s.userId,
      firstName: s.firstName,
      lastName: s.lastName,
      fullName: `${s.firstName} ${s.lastName}`, // Derived full name
      email: s.email,
      registrationNumber: s.registrationNumber,
      studentNumber: s.studentNumber,
      passportPhotoUrl: s.passportPhotoUrl || null,
      idPhotoUrl: s.idPhotoUrl || null,
      certificateUrl: s.certificateUrl || null,
      programName: s.programName || null,
      programCode: s.programCode || null,
      departmentName: s.departmentName || null,
      currentSemesterName: s.currentSemesterName || null,
      userEmail: s.userEmail || null, // Include user's email if joined
    }));

    return studentList;
  } catch (err: unknown) {
  const error = err instanceof Error ? err : new Error(String(err));
  console.error('[ERROR_CONTEXT]', error);
  throw new ActionError(error.message);
}
}

/**
 * Fetches a single student by ID with their associated program, department, and current semester details.
 */
export async function getStudentById(id: number) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      throw new ActionError('Unauthorized: You must be logged in.');
    }

    const studentRecord = await db.query.students.findFirst({ where: eq(students.id, id), columns: { userId: true } });

    if (!studentRecord) {
      throw new ActionError('Student not found.');
    }

    // Check if authorized as Admin, Registrar, Department Head, Lecturer, or if it's the user's own student profile.
    if (!checkPermission(authUser, allowedRolesForViewingStudents()) && authUser.userId !== studentRecord.userId) {
      throw new ActionError('Unauthorized: You do not have permission to view this student.');
    }

    const result = await db
      .select({
        id: students.id,
        userId: students.userId,
        firstName: students.firstName,
        lastName: students.lastName,
        email: students.email,
        registrationNumber: students.registrationNumber,
        studentNumber: students.studentNumber,
        passportPhotoUrl: students.passportPhotoUrl,
        idPhotoUrl: students.idPhotoUrl,
        certificateUrl: students.certificateUrl,
        programName: programs.name,
        programCode: programs.code,
        departmentName: departments.name,
        currentSemesterName: semesters.name,
        userEmail: users.email,
      })
      .from(students)
      .leftJoin(programs, eq(students.programId, programs.id))
      .leftJoin(departments, eq(students.departmentId, departments.id))
      .leftJoin(semesters, eq(students.currentSemesterId, semesters.id))
      .leftJoin(users, eq(students.userId, users.id))
      .where(eq(students.id, id));

    const foundStudent = result[0]; // Assuming only one result for findFirst

    if (!foundStudent) {
      return null; // Or throw a more specific error if student should always be found at this point
    }

    return {
      id: foundStudent.id,
      userId: foundStudent.userId,
      firstName: foundStudent.firstName,
      lastName: foundStudent.lastName,
      fullName: `${foundStudent.firstName} ${foundStudent.lastName}`,
      email: foundStudent.email,
      registrationNumber: foundStudent.registrationNumber,
      studentNumber: foundStudent.studentNumber,
      passportPhotoUrl: foundStudent.passportPhotoUrl || null,
      idPhotoUrl: foundStudent.idPhotoUrl || null,
      certificateUrl: foundStudent.certificateUrl || null,
      programName: foundStudent.programName || null,
      programCode: foundStudent.programCode || null,
      departmentName: foundStudent.departmentName || null,
      currentSemesterName: foundStudent.currentSemesterName || null,
      userEmail: foundStudent.userEmail || null,
    };

  } catch (err: unknown) {
  const error = err instanceof Error ? err : new Error(String(err));
  console.error('[ERROR_CONTEXT]', error);
  throw new ActionError(error.message);
}
}