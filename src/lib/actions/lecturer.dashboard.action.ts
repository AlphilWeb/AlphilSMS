// app/actions/lecturer-dashboard.action.ts
'use server';

import { db } from '@/lib/db';
import {
  courses,
  enrollments,
  grades,
  semesters,
  staff,
  userLogs,
  assignmentSubmissions,
  quizSubmissions,
  materialViews,
  courseMaterials,
  assignments,
  quizzes,
  students
} from '@/lib/db/schema';
import { and, eq, desc, count, isNull, sql, inArray } from 'drizzle-orm';
import { getAuthUser } from '@/lib/auth';

type DashboardStats = {
  totalCourses: number;
  totalStudents: number;
  pendingGrades: number;
  totalAssignmentSubmissions: number;
  totalQuizSubmissions: number;
  totalMaterialViews: number;
};

export async function getLecturerDashboardData() {
  try {
    const authUser = await getAuthUser();
    if (!authUser || authUser.role.toLowerCase() !== 'lecturer') {
      throw new Error('Unauthorized access');
    }

    // Get staff record
    const staffRecord = await db.query.staff.findFirst({
      where: eq(staff.userId, authUser.userId),
    });

    if (!staffRecord) {
      throw new Error('Staff profile not found');
    }

    // Get current semester
    const currentSemester = await db.query.semesters.findFirst({
      orderBy: [desc(semesters.startDate)],
    });

    if (!currentSemester) {
      throw new Error('No active semester found');
    }

    // Get courses taught by this lecturer in current semester
    const lecturerCourses = await db.select({ id: courses.id })
      .from(courses)
      .where(and(
        eq(courses.lecturerId, staffRecord.id),
        eq(courses.semesterId, currentSemester.id)
      ))

    if (lecturerCourses.length === 0) {
      return {
        stats: {
          totalCourses: 0,
          totalStudents: 0,
          pendingGrades: 0,
          totalAssignmentSubmissions: 0,
          totalQuizSubmissions: 0,
          totalMaterialViews: 0,
        },
        currentSemester: {
          name: currentSemester.name,
          startDate: currentSemester.startDate,
          endDate: currentSemester.endDate,
        },
        recentEnrollments: [],
        pendingGrades: [],
        recentActivity: [],
      };
    }

    const courseIds = lecturerCourses.map(c => c.id);

    // Get all counts in parallel without transaction
    const [
      totalCourses,
      totalStudents,
      pendingGrades,
      totalAssignmentSubmissions,
      totalQuizSubmissions,
      totalMaterialViews
    ] = await Promise.all([
      // Total courses
      db.select({ count: count() })
        .from(courses)
        .where(and(
          eq(courses.lecturerId, staffRecord.id),
          eq(courses.semesterId, currentSemester.id)
        ))
        .then(res => res[0]?.count ?? 0),

      // Total students enrolled in lecturer's courses
      db.select({ count: count() })
        .from(enrollments)
        .where(and(
          inArray(enrollments.courseId, courseIds),
          eq(enrollments.semesterId, currentSemester.id)
        ))
        .then(res => res[0]?.count ?? 0),

      // Pending grades (submissions without grades)
      db.select({ count: count() })
        .from(assignmentSubmissions)
        .innerJoin(
          assignments,
          eq(assignmentSubmissions.assignmentId, assignments.id)
        )
        .where(and(
          inArray(assignments.courseId, courseIds),
          isNull(assignmentSubmissions.grade)
        ))
        .then(res => res[0]?.count ?? 0),

      // Total assignment submissions
      db.select({ count: count() })
        .from(assignmentSubmissions)
        .innerJoin(
          assignments,
          eq(assignmentSubmissions.assignmentId, assignments.id)
        )
        .where(inArray(assignments.courseId, courseIds))
        .then(res => res[0]?.count ?? 0),

      // Total quiz submissions
      db.select({ count: count() })
        .from(quizSubmissions)
        .innerJoin(
          quizzes,
          eq(quizSubmissions.quizId, quizzes.id)
        )
        .where(inArray(quizzes.courseId, courseIds))
        .then(res => res[0]?.count ?? 0),

      // Total material views
      db.select({ count: count() })
        .from(materialViews)
        .innerJoin(
          courseMaterials,
          eq(materialViews.materialId, courseMaterials.id)
        )
        .where(inArray(courseMaterials.courseId, courseIds))
        .then(res => res[0]?.count ?? 0),
    ]);

    const stats: DashboardStats = {
      totalCourses,
      totalStudents,
      pendingGrades,
      totalAssignmentSubmissions,
      totalQuizSubmissions,
      totalMaterialViews,
    };

    // Get recent data
    const [recentEnrollments, pendingGradesList, recentActivity] = await Promise.all([
      // Recent enrollments (last 5)
      db.query.enrollments.findMany({
        where: and(
          inArray(enrollments.courseId, courseIds),
          eq(enrollments.semesterId, currentSemester.id)
        ),
        with: {
          student: {
            columns: {
              firstName: true,
              lastName: true,
              registrationNumber: true,
            },
          },
          course: {
            columns: {
              code: true,
              name: true,
            },
          },
        },
        orderBy: [desc(enrollments.enrollmentDate)],
        limit: 5,
      }),

      // Pending grades (last 5)
      db.query.assignmentSubmissions.findMany({
        where: and(
          inArray(
            assignmentSubmissions.assignmentId,
            db.select({ id: assignments.id })
              .from(assignments)
              .where(inArray(assignments.courseId, courseIds))
          ),
          isNull(assignmentSubmissions.grade)
        ),
        with: {
          assignment: {
            columns: { title: true },
            with: {
              course: {
                columns: { code: true, name: true }
              }
            }
          },
          student: {
            columns: {
              firstName: true,
              lastName: true,
              registrationNumber: true,
            },
          },
        },
        orderBy: [desc(assignmentSubmissions.submittedAt)],
        limit: 5,
      }),

      // Recent activity logs
      db.query.userLogs.findMany({
        where: eq(userLogs.userId, authUser.userId),
        orderBy: [desc(userLogs.timestamp)],
        limit: 5,
      }),
    ]);

    return {
      stats,
      currentSemester: {
        name: currentSemester.name,
        startDate: currentSemester.startDate,
        endDate: currentSemester.endDate,
      },
      recentEnrollments: recentEnrollments.map(e => ({
        studentName: `${e.student.firstName} ${e.student.lastName}`,
        regNumber: e.student.registrationNumber,
        course: `${e.course.code} - ${e.course.name}`,
        date: e.enrollmentDate?.toString() ?? 'N/A',
      })),
      pendingGrades: pendingGradesList.map(g => ({
        studentName: `${g.student.firstName} ${g.student.lastName}`,
        regNumber: g.student.registrationNumber,
        course: `${g.assignment.course.code} - ${g.assignment.course.name}`,
        assignment: g.assignment.title,
      })),
      recentActivity: recentActivity.map(a => ({
        action: a.action,
        description: a.description || '',
        timestamp: a.timestamp?.toISOString() || '',
      })),
    };
  } catch (error) {
    console.error('Error in getLecturerDashboardData:', error);
    throw new Error('Failed to fetch lecturer dashboard data');
  }
}