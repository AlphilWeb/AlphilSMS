'use server';

import { db } from '@/lib/db';
import { users, staff, students } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { hash } from 'bcryptjs';
import { 
  uploadUserPhoto, 
  uploadUserDocument,
  getPublicUrl 
} from '@/lib/file-upload';

export type CreateUserInput = {
  email: string;
  password: string;
  roleId: number;
  idNumber?: string | null;
};

export type CreateStaffInput = CreateUserInput & {
  firstName: string;
  lastName: string;
  departmentId: number;
  position: string;
  passportPhoto?: File | null;
  nationalIdPhoto?: File | null;
  academicCertificates?: File | null;
  employmentDocuments?: File | null;
};

export type CreateStudentInput = CreateUserInput & {
  firstName: string;
  lastName: string;
  programId: number;
  departmentId: number;
  currentSemesterId: number;
  registrationNumber: string;
  studentNumber: string;
  passportPhoto?: File | null;
  idPhoto?: File | null;
  certificate?: File | null;
};

// Add these functions to your existing actions file

export async function fetchDepartments() {
  try {
    const departments = await db.query.departments.findMany({
      columns: {
        id: true,
        name: true,
      },
      orderBy: (departments, { asc }) => [asc(departments.name)],
    });
    return departments;
  } catch (error) {
    console.error('Error fetching departments:', error);
    throw new Error('Failed to fetch departments');
  }
}

export async function fetchPrograms() {
  try {
    const programs = await db.query.programs.findMany({
      columns: {
        id: true,
        name: true,
      },
      orderBy: (programs, { asc }) => [asc(programs.name)],
    });
    return programs;
  } catch (error) {
    console.error('Error fetching programs:', error);
    throw new Error('Failed to fetch programs');
  }
}

export async function fetchSemesters() {
  try {
    const semesters = await db.query.semesters.findMany({
      columns: {
        id: true,
        name: true,
      },
      orderBy: (semesters, { asc }) => [asc(semesters.name)],
    });
    return semesters;
  } catch (error) {
    console.error('Error fetching semesters:', error);
    throw new Error('Failed to fetch semesters');
  }
}

export async function fetchRoles() {
  try {
    const roles = await db.query.roles.findMany({
      columns: {
        id: true,
        name: true,
      },
      where: (roles, { or }) => or(
        eq(roles.name, 'student'),
        eq(roles.name, 'staff'),
        eq(roles.name, 'admin')
      ),
      orderBy: (roles, { asc }) => [asc(roles.name)],
    });
    return roles;
  } catch (error) {
    console.error('Error fetching roles:', error);
    throw new Error('Failed to fetch roles');
  }
}

export async function createStaffWithUser(input: CreateStaffInput) {
  try {
    // 1. Create user first
    const hashedPassword = await hash(input.password, 10);
    
    const newUser = await db.insert(users).values({
      email: input.email,
      passwordHash: hashedPassword,
      roleId: input.roleId,
      idNumber: input.idNumber,
    }).returning();

    if (!newUser[0]) throw new Error('Failed to create user');

    // 2. Upload files if they exist
    const uploadPromises = [];
    const fileUrls: Record<string, string> = {};

    if (input.passportPhoto) {
      uploadPromises.push(
        uploadUserPhoto(input.passportPhoto, 'staff')
          .then(key => { fileUrls.passportPhotoUrl = getPublicUrl(key); })
      );
    }

    if (input.nationalIdPhoto) {
      uploadPromises.push(
        uploadUserDocument(input.nationalIdPhoto, 'staff', 'national-id')
          .then(key => { fileUrls.nationalIdPhotoUrl = getPublicUrl(key); })
      );
    }

    if (input.academicCertificates) {
      uploadPromises.push(
        uploadUserDocument(input.academicCertificates, 'staff', 'certificates')
          .then(key => { fileUrls.academicCertificatesUrl = getPublicUrl(key); })
      );
    }

    if (input.employmentDocuments) {
      uploadPromises.push(
        uploadUserDocument(input.employmentDocuments, 'staff', 'employment')
          .then(key => { fileUrls.employmentDocumentsUrl = getPublicUrl(key); })
      );
    }

    await Promise.all(uploadPromises);

    // 3. Create staff record
    const newStaff = await db.insert(staff).values({
      userId: newUser[0].id,
      departmentId: input.departmentId,
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      idNumber: input.idNumber,
      position: input.position,
      ...fileUrls,
    }).returning();

    revalidatePath('/admin/users/staff');
    return { success: true, staff: newStaff[0] };
  } catch (error) {
    console.error('Error creating staff:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function createStudentWithUser(input: CreateStudentInput) {
  try {
    // 1. Create user first
    const hashedPassword = await hash(input.password, 10);
    
    const newUser = await db.insert(users).values({
      email: input.email,
      passwordHash: hashedPassword,
      roleId: input.roleId,
      idNumber: input.idNumber,
    }).returning();

    if (!newUser[0]) throw new Error('Failed to create user');

    // 2. Upload files if they exist
    const uploadPromises = [];
    const fileUrls: Record<string, string> = {};

    if (input.passportPhoto) {
      uploadPromises.push(
        uploadUserPhoto(input.passportPhoto, 'student')
          .then(key => { fileUrls.passportPhotoUrl = getPublicUrl(key); })
      );
    }

    if (input.idPhoto) {
      uploadPromises.push(
        uploadUserDocument(input.idPhoto, 'student', 'id-photo')
          .then(key => { fileUrls.idPhotoUrl = getPublicUrl(key); })
      );
    }

    if (input.certificate) {
      uploadPromises.push(
        uploadUserDocument(input.certificate, 'student', 'certificates')
          .then(key => { fileUrls.certificateUrl = getPublicUrl(key); })
      );
    }

    await Promise.all(uploadPromises);

    // 3. Create student record
    const newStudent = await db.insert(students).values({
      userId: newUser[0].id,
      programId: input.programId,
      departmentId: input.departmentId,
      currentSemesterId: input.currentSemesterId,
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      idNumber: input.idNumber,
      registrationNumber: input.registrationNumber,
      studentNumber: input.studentNumber,
      ...fileUrls,
    }).returning();

    revalidatePath('/admin/users/students');
    return { success: true, student: newStudent[0] };
  } catch (error) {
    console.error('Error creating student:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function updateStaff(id: number, input: Partial<CreateStaffInput>) {
  try {
    // Handle file uploads if they exist
    const fileUrls: Record<string, string> = {};
    const uploadPromises = [];

    if (input.passportPhoto) {
      uploadPromises.push(
        uploadUserPhoto(input.passportPhoto, 'staff')
          .then(key => { fileUrls.passportPhotoUrl = getPublicUrl(key); })
      );
    }

    if (input.nationalIdPhoto) {
      uploadPromises.push(
        uploadUserDocument(input.nationalIdPhoto, 'staff', 'national-id')
          .then(key => { fileUrls.nationalIdPhotoUrl = getPublicUrl(key); })
      );
    }

    await Promise.all(uploadPromises);

    // Update staff record
    const updatedStaff = await db.update(staff)
      .set({
        ...input,
        ...fileUrls,
      })
      .where(eq(staff.id, id))
      .returning();

    revalidatePath('/admin/users/staff');
    return { success: true, staff: updatedStaff[0] };
  } catch (error) {
    console.error('Error updating staff:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function updateStudent(id: number, input: Partial<CreateStudentInput>) {
  try {
    // Handle file uploads if they exist
    const fileUrls: Record<string, string> = {};
    const uploadPromises = [];

    if (input.passportPhoto) {
      uploadPromises.push(
        uploadUserPhoto(input.passportPhoto, 'student')
          .then(key => { fileUrls.passportPhotoUrl = getPublicUrl(key); })
      );
    }

    if (input.idPhoto) {
      uploadPromises.push(
        uploadUserDocument(input.idPhoto, 'student', 'id-photo')
          .then(key => { fileUrls.idPhotoUrl = getPublicUrl(key); })
      );
    }

    await Promise.all(uploadPromises);

    // Update student record
    const updatedStudent = await db.update(students)
      .set({
        ...input,
        ...fileUrls,
      })
      .where(eq(students.id, id))
      .returning();

    revalidatePath('/admin/users/students');
    return { success: true, student: updatedStudent[0] };
  } catch (error) {
    console.error('Error updating student:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function deleteStaff(id: number) {
  try {
    // First get staff to also delete associated user
    const staffToDelete = await db.select()
      .from(staff)
      .where(eq(staff.id, id));

    if (!staffToDelete[0]) {
      throw new Error('Staff not found');
    }

    const userId = staffToDelete[0].userId;

    // Delete staff record
    await db.delete(staff)
      .where(eq(staff.id, id));

    // Only delete the associated user if userId is not null
    if (userId !== null) {
      await db.delete(users)
        .where(eq(users.id, userId));
    }

    revalidatePath('/admin/users/staff');
    return { success: true };
  } catch (error) {
    console.error('Error deleting staff:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function deleteStudent(id: number) {
  try {
    // First get the student to also get the associated user
    const studentToDelete = await db.select()
      .from(students)
      .where(eq(students.id, id));

    if (!studentToDelete[0]) {
      throw new Error('Student not found');
    }

    const userId = studentToDelete[0].userId;

    // Delete the student record
    await db.delete(students)
      .where(eq(students.id, id));

    // Only delete the associated user if userId is not null
    if (userId !== null) {
      await db.delete(users)
        .where(eq(users.id, userId));
    }

    revalidatePath('/admin/users/students');
    return { success: true };
  } catch (error) {
    console.error('Error deleting student:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}


export async function getStaffList() {
  return db.query.staff.findMany({
    with: {
      user: true,
      department: true,
    },
  });
}

export async function getStudentList() {
  return db.query.students.findMany({
    with: {
      user: true,
      program: true,
      department: true,
      currentSemester: true,
    },
  });
}

export async function getStaffById(id: number) {
  return db.query.staff.findFirst({
    where: eq(staff.id, id),
    with: {
      user: true,
      department: true,
    },
  });
}

export async function getStudentById(id: number) {
  return db.query.students.findFirst({
    where: eq(students.id, id),
    with: {
      user: true,
      program: true,
      department: true,
      currentSemester: true,
    },
  });
}