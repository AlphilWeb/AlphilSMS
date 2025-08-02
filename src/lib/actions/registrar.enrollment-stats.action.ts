// src/actions/registrar/enrollment-stats.actions.ts
'use server';

import { db, testConnection } from '@/lib/db';
import { 
  enrollments, 
  students, 
  programs, 
  departments,
  courses
} from '@/lib/db/schema';
import { and, eq, desc, count, between } from 'drizzle-orm';
import { getAuthUser } from '@/lib/auth';

export type EnrollmentStatsFilters = {
  semesterId?: number;
  programId?: number;
  departmentId?: number;
  dateRange?: {
    start: string;
    end: string;
  };
};

export async function getEnrollmentStatistics(filters: EnrollmentStatsFilters = {}) {
  try {
    const isConnected = await testConnection();
    if (!isConnected) {
      throw new Error('Database connection failed');
    }

    const authUser = await getAuthUser();
    if (!authUser || authUser.role.toLowerCase() !== 'registrar') {
      throw new Error('Unauthorized');
    }

    const conditions = [];
    
    if (filters.semesterId) {
      conditions.push(eq(enrollments.semesterId, filters.semesterId));
    }
    
    if (filters.programId) {
      conditions.push(eq(students.programId, filters.programId));
    }
    
    if (filters.departmentId) {
      conditions.push(eq(students.departmentId, filters.departmentId));
    }
    
    if (filters.dateRange) {
      conditions.push(
        between(
          enrollments.enrollmentDate, 
          filters.dateRange.start, 
          filters.dateRange.end
        )
      );
    }

    const allSemesters = await db.query.semesters.findMany({
      orderBy: (semesters, { desc }) => [desc(semesters.startDate)],
    });

    const allPrograms = await db.query.programs.findMany({
      orderBy: (programs, { asc }) => [asc(programs.name)],
    });

    const allDepartments = await db.query.departments.findMany({
      orderBy: (departments, { asc }) => [asc(departments.name)],
    });

    const currentSemester = await db.query.semesters.findFirst({
      orderBy: (semesters, { desc }) => [desc(semesters.startDate)],
    });

    const enrollmentStats = await db
      .select({
        programId: programs.id,
        programName: programs.name,
        departmentName: departments.name,
        totalEnrollments: count(enrollments.id),
      })
      .from(enrollments)
      .innerJoin(students, eq(enrollments.studentId, students.id))
      .innerJoin(programs, eq(students.programId, programs.id))
      .innerJoin(departments, eq(programs.departmentId, departments.id))
      .where(and(...conditions))
      .groupBy(programs.id, programs.name, departments.name);

    const courseStats = await db
      .select({
        courseId: courses.id,
        courseCode: courses.code,
        courseName: courses.name,
        enrollments: count(enrollments.id),
      })
      .from(enrollments)
      .innerJoin(courses, eq(enrollments.courseId, courses.id))
      .where(and(...conditions))
      .groupBy(courses.id, courses.code, courses.name)
      .orderBy(desc(count(enrollments.id))); // ✅ removed extra parenthesis

    const trendSemesters = await db.query.semesters.findMany({
      orderBy: (semesters, { desc }) => [desc(semesters.startDate)],
      limit: 6,
    });

    const enrollmentTrends = await Promise.all(
      trendSemesters.map(async (semester) => {
        const countResult = await db
          .select({ count: count() })
          .from(enrollments)
          .where(eq(enrollments.semesterId, semester.id));

        return {
          semesterId: semester.id,
          semesterName: semester.name,
          enrollments: countResult[0].count,
          startDate: semester.startDate,
        };
      })
    );

    return {
      filters: {
        semesters: allSemesters,
        programs: allPrograms,
        departments: allDepartments,
        currentSemesterId: currentSemester?.id,
      },
      statistics: enrollmentStats,
      courseStats,
      trends: enrollmentTrends.reverse(),
    };
  } catch (error) {
    console.error('Error in getEnrollmentStatistics:', error);
    throw new Error('Failed to fetch enrollment statistics');
  }
}

export async function getEnrollmentDetails(semesterId: number, programId?: number) {
  try {
    const isConnected = await testConnection();
    if (!isConnected) {
      throw new Error('Database connection failed');
    }

    const authUser = await getAuthUser();
    if (!authUser || authUser.role.toLowerCase() !== 'registrar') {
      throw new Error('Unauthorized');
    }

    const conditions = [eq(enrollments.semesterId, semesterId)];
    
    if (programId) {
      conditions.push(eq(students.programId, programId));
    }

    const enrollmentsWithDetails = await db.query.enrollments.findMany({
      where: and(...conditions),
      with: {
        student: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
            registrationNumber: true,
          },
          with: {
            program: {
              columns: {
                name: true,
                code: true,
              },
              with: {
                department: {
                  columns: {
                    name: true,
                  },
                },
              },
            },
          },
        },
        course: {
          columns: {
            name: true,
            code: true,
            credits: true,
          },
        },
        semester: {
          columns: {
            name: true,
          },
        },
      },
      orderBy: (enrollments, { asc }) => [asc(enrollments.enrollmentDate)],
    });

    return enrollmentsWithDetails.map((enrollment) => ({
      id: enrollment.id,
      enrollmentDate: enrollment.enrollmentDate,
      student: {
        id: enrollment.student.id,
        name: `${enrollment.student.firstName} ${enrollment.student.lastName}`,
        registrationNumber: enrollment.student.registrationNumber,
        program: enrollment.student.program.name,
        programCode: enrollment.student.program.code,
        department: enrollment.student.program.department.name,
      },
      course: {
        name: enrollment.course.name,
        code: enrollment.course.code,
        credits: enrollment.course.credits,
      },
      semester: enrollment.semester.name,
    }));
  } catch (error) {
    console.error('Error in getEnrollmentDetails:', error);
    throw new Error('Failed to fetch enrollment details');
  }
}
