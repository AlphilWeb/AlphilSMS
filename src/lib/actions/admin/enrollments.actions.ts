'use server';

import { db } from '@/lib/db';
import { 
  enrollments, 
  students, 
  courses, 
  semesters, 
  programs,
  departments,
  staff
} from '@/lib/db/schema';
import { and, eq, sql, asc, desc, or, ilike } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

// Types for enrollment data
export type EnrollmentWithDetails = {
  id: number;
  enrollmentDate: string | null; // Optional, can be null if not set
  student: {
    id: number | null; // Optional, can be null if not set
    firstName: string | null;
    lastName: string | null;
    registrationNumber: string | null;
    program: {
      id: number | null;
      name: string | null;
      department: {
        id: number | null;
        name: string | null;
      };
    };
  };
  course: {
    id: number | null; // Optional, can be null if not set
    name: string | null;
    code: string | null;
    credits: string | null;
    lecturer?: {
      id: number | null;
      firstName: string | null;
      lastName: string | null;
    };
  };
  semester: {
    id: number | null;
    name: string | null;
    startDate: string | null;
    endDate: string | null;
  };
};

// Form validation schema
const EnrollmentFormSchema = z.object({
  studentId: z.coerce.number().min(1, 'Student is required'),
  courseId: z.coerce.number().min(1, 'Course is required'),
  semesterId: z.coerce.number().min(1, 'Semester is required'),
  enrollmentDate: z.string().min(1, 'Enrollment date is required'),
});

// Fetch all enrollments with pagination and filtering
export async function fetchFilteredEnrollments(
  query: string = '',
  currentPage: number = 1,
  itemsPerPage: number = 10,
  sortField: string = 'enrollmentDate',
  sortDirection: 'asc' | 'desc' = 'desc'
) {
  const offset = (currentPage - 1) * itemsPerPage;

  try {
    const rawData = await db
      .select({
        id: enrollments.id,
        enrollmentDate: enrollments.enrollmentDate,
        studentId: students.id,
        studentFirstName: students.firstName,
        studentLastName: students.lastName,
        studentRegistrationNumber: students.registrationNumber,
        programId: programs.id,
        programName: programs.name,
        departmentId: departments.id,
        departmentName: departments.name,
        courseId: courses.id,
        courseName: courses.name,
        courseCode: courses.code,
        courseCredits: courses.credits,
        lecturerId: staff.id,
        lecturerFirstName: staff.firstName,
        lecturerLastName: staff.lastName,
        semesterId: semesters.id,
        semesterName: semesters.name,
        semesterStartDate: semesters.startDate,
        semesterEndDate: semesters.endDate,
      })
      .from(enrollments)
      .leftJoin(students, eq(enrollments.studentId, students.id))
      .leftJoin(courses, eq(enrollments.courseId, courses.id))
      .leftJoin(semesters, eq(enrollments.semesterId, semesters.id))
      .leftJoin(programs, eq(students.programId, programs.id))
      .leftJoin(departments, eq(programs.departmentId, departments.id))
      .leftJoin(staff, eq(courses.lecturerId, staff.id))
.where(
  query
    ? or(
        ilike(students.firstName, `%${query}%`),        // Changed from like to ilike
        ilike(students.lastName, `%${query}%`),         // Changed from like to ilike
        ilike(students.registrationNumber, `%${query}%`), // Changed from like to ilike
        ilike(courses.name, `%${query}%`),              // Changed from like to ilike
        ilike(courses.code, `%${query}%`),              // Changed from like to ilike
        ilike(semesters.name, `%${query}%`)             // Changed from like to ilike
      )
    : undefined
)
      .orderBy(
        sortField === 'student'
          ? sortDirection === 'asc'
            ? asc(students.lastName)
            : desc(students.lastName)
          : sortField === 'course'
          ? sortDirection === 'asc'
            ? asc(courses.name)
            : desc(courses.name)
          : sortField === 'semester'
          ? sortDirection === 'asc'
            ? asc(semesters.name)
            : desc(semesters.name)
          : sortDirection === 'asc'
          ? asc(enrollments.enrollmentDate)
          : desc(enrollments.enrollmentDate)
      )
      .limit(itemsPerPage)
      .offset(offset);

    // Now, restructure the data to match your EnrollmentWithDetails type
    const data: EnrollmentWithDetails[] = rawData.map((row) => ({
      
      id: row.id,
      enrollmentDate: row.enrollmentDate,
      student: {
        id: row.studentId,
        firstName: row.studentFirstName,
        lastName: row.studentLastName,
        registrationNumber: row.studentRegistrationNumber,
        program: {
          id: row.programId,
          name: row.programName,
          department: {
            id: row.departmentId,
            name: row.departmentName,
          },
        },
      },
      course: {
        id: row.courseId,
        name: row.courseName,
        code: row.courseCode,
        credits: row.courseCredits,
        lecturer: row.lecturerId
          ? {
              id: row.lecturerId,
              firstName: row.lecturerFirstName,
              lastName: row.lecturerLastName,
            }
          : undefined,
      },
      semester: {
        id: row.semesterId,
        name: row.semesterName,
        startDate: row.semesterStartDate,
        endDate: row.semesterEndDate,
      },
    }));

    return data;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch enrollments.');
  }
}

// Fetch total number of enrollments for pagination
export async function fetchEnrollmentsTotalPages(
  query: string = '',
  itemsPerPage: number = 10
) {
  try {
    const count = await db
      .select({ count: sql<number>`count(*)` })
      .from(enrollments)
      .leftJoin(students, eq(enrollments.studentId, students.id))
      .leftJoin(courses, eq(enrollments.courseId, courses.id))
      .leftJoin(semesters, eq(enrollments.semesterId, semesters.id))
      .where(
        query
          ? or(
              ilike(students.firstName, `%${query}%`),
              ilike(students.lastName, `%${query}%`),
              ilike(students.registrationNumber, `%${query}%`),
              ilike(courses.name, `%${query}%`),
              ilike(courses.code, `%${query}%`),
              ilike(semesters.name, `%${query}%`)
            )
          : undefined
      );

    const totalPages = Math.ceil(Number(count[0].count) / itemsPerPage);
    return totalPages;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch total number of enrollments.');
  }
}

// Fetch a single enrollment by ID
export async function fetchEnrollmentById(id: number) {
  try {
    const data = await db
      .select({
        id: enrollments.id,
        studentId: enrollments.studentId,
        courseId: enrollments.courseId,
        semesterId: enrollments.semesterId,
        enrollmentDate: enrollments.enrollmentDate,
      })
      .from(enrollments)
      .where(eq(enrollments.id, id));

    return data[0];
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch enrollment.');
  }
}

// Create a new enrollment
export async function createEnrollment(formData: FormData) {
  const validatedFields = EnrollmentFormSchema.safeParse({
    studentId: formData.get('studentId'),
    courseId: formData.get('courseId'),
    semesterId: formData.get('semesterId'),
    enrollmentDate: formData.get('enrollmentDate'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Create Enrollment.',
    };
  }

  const { studentId, courseId, semesterId, enrollmentDate } = validatedFields.data;

  try {
    // Check if enrollment already exists
    const existingEnrollment = await db
      .select()
      .from(enrollments)
      .where(
        and(
          eq(enrollments.studentId, studentId),
          eq(enrollments.courseId, courseId),
          eq(enrollments.semesterId, semesterId)
        )
      );

    if (existingEnrollment.length > 0) {
      return {
        message: 'Student is already enrolled in this course for the selected semester.',
      };
    }

    await db.insert(enrollments).values({
      studentId,
      courseId,
      semesterId,
      enrollmentDate,
    });

    // Log the enrollment creation in user_logs
    // You would need to get the current admin user ID from the session
    // const adminUserId = ...;
    // await db.insert(userLogs).values({
    //   userId: adminUserId,
    //   action: 'create',
    //   targetTable: 'enrollments',
    //   description: `Created enrollment for student ${studentId} in course ${courseId}`,
    // });
  } catch (error) {
    console.error('Database Error:', error);
    return {
      message: 'Database Error: Failed to Create Enrollment.',
    };
  }

  revalidatePath('/admin/enrollments');
  redirect('/admin/enrollments');
}

// Update an enrollment
export async function updateEnrollment(id: number, formData: FormData) {
  const validatedFields = EnrollmentFormSchema.safeParse({
    studentId: formData.get('studentId'),
    courseId: formData.get('courseId'),
    semesterId: formData.get('semesterId'),
    enrollmentDate: formData.get('enrollmentDate'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Update Enrollment.',
    };
  }

  const { studentId, courseId, semesterId, enrollmentDate } = validatedFields.data;

  try {
    await db
      .update(enrollments)
      .set({
        studentId,
        courseId,
        semesterId,
        enrollmentDate,
      })
      .where(eq(enrollments.id, id));

    // Log the enrollment update in user_logs
    // const adminUserId = ...;
    // await db.insert(userLogs).values({
    //   userId: adminUserId,
    //   action: 'update',
    //   targetTable: 'enrollments',
    //   targetId: id,
    //   description: `Updated enrollment for student ${studentId} in course ${courseId}`,
    // });
  } catch (error) {
    console.error('Database Error:', error);
    return {
      message: 'Database Error: Failed to Update Enrollment.',
    };
  }

  revalidatePath('/admin/enrollments');
  redirect('/admin/enrollments');
}

// Delete an enrollment
export async function deleteEnrollment(id: number) {
  try {
    // Get enrollment details before deleting for logging
    // const enrollment = await db
    //   .select()
    //   .from(enrollments)
    //   .where(eq(enrollments.id, id));

    await db.delete(enrollments).where(eq(enrollments.id, id));

    // Log the enrollment deletion in user_logs
    // const adminUserId = ...;
    // if (enrollment.length > 0) {
    //   await db.insert(userLogs).values({
    //     userId: adminUserId,
    //     action: 'delete',
    //     targetTable: 'enrollments',
    //     targetId: id,
    //     description: `Deleted enrollment for student ${enrollment[0].studentId} in course ${enrollment[0].courseId}`,
    //   });
    // }
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to delete enrollment.');
  }

  revalidatePath('/admin/enrollments');
}

// Fetch all students for dropdown
export async function fetchAllStudents() {
  try {
    return await db
      .select({
        id: students.id,
        firstName: students.firstName,
        lastName: students.lastName,
        registrationNumber: students.registrationNumber,
      })
      .from(students)
      .orderBy(asc(students.lastName), asc(students.firstName));
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch students.');
  }
}

// Fetch all courses for dropdown
export async function fetchAllCourses() {
  try {
    return await db
      .select({
        id: courses.id,
        name: courses.name,
        code: courses.code,
        semesterId: courses.semesterId,
      })
      .from(courses)
      .orderBy(asc(courses.name));
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch courses.');
  }
}

// Fetch all semesters for dropdown
export async function fetchAllSemesters() {
  try {
    return await db
      .select({
        id: semesters.id,
        name: semesters.name,
        startDate: semesters.startDate,
        endDate: semesters.endDate,
      })
      .from(semesters)
      .orderBy(desc(semesters.startDate));
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch semesters.');
  }
}

// Fetch courses by semester
export async function fetchCoursesBySemester(semesterId: number) {
  try {
    return await db
      .select({
        id: courses.id,
        name: courses.name,
        code: courses.code,
      })
      .from(courses)
      .where(eq(courses.semesterId, semesterId))
      .orderBy(asc(courses.name));
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch courses by semester.');
  }
}

// Check if student is enrolled in a course for a semester
export async function checkEnrollmentExists(
  studentId: number,
  courseId: number,
  semesterId: number
) {
  try {
    const result = await db
      .select()
      .from(enrollments)
      .where(
        and(
          eq(enrollments.studentId, studentId),
          eq(enrollments.courseId, courseId),
          eq(enrollments.semesterId, semesterId)
        )
      );

    return result.length > 0;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to check enrollment existence.');
  }
}