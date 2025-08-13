// src/actions/lecturer/dashboard.actions.ts
'use server';

import { db, testConnection } from '@/lib/db';
import {
  staff,
  students,
  courses,
  enrollments,
  assignments,
  assignmentSubmissions,
  quizzes,
  quizSubmissions,
  courseMaterials,
  materialViews,
  timetables,
  semesters,
  // programs,
  userLogs
} from '@/lib/db/schema';
import { and, eq, sql, desc, lte, gte, count, avg, inArray } from 'drizzle-orm';
import { getAuthUser } from '@/lib/auth';
// import { startOfWeek, endOfWeek } from 'date-fns';

type CourseSummary = {
  id: number;
  name: string;
  code: string;
  programName: string;
  semesterName: string;
  studentCount: number;
  materialsCount: number;
  assignmentsCount: number;
  quizzesCount: number;
};

type UpcomingClass = {
  id: number;
  courseName: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  room: string;
};

type RecentSubmission = {
  id: number;
  type: 'assignment' | 'quiz';
  title: string;
  studentName: string;
  submittedAt: Date;
  grade?: number;
  status: 'submitted' | 'graded' | 'late';
};

type StudentPerformance = {
  studentId: number;
  studentName: string;
  avgScore: number;
  assignmentsCompleted: number;
  assignmentsTotal: number;
};


export async function getLecturerDashboardData() {
  try {
    const isConnected = await testConnection();
    if (!isConnected) throw new Error('Database connection failed');

    const authUser = await getAuthUser();
    if (!authUser) throw new Error('Unauthorized');

    const lecturer = await db.query.staff.findFirst({
      where: eq(staff.userId, authUser.userId),
      with: {
        department: { columns: { name: true } },
        user: { columns: { email: true } },
      },
    });

    if (!lecturer) throw new Error('Lecturer profile not found');

    const currentSemester = await db.query.semesters.findFirst({
      where: and(
        lte(semesters.startDate, new Date().toISOString()),
        gte(semesters.endDate, new Date().toISOString())
      ),
      orderBy: desc(semesters.startDate),
    });

    const lecturerCourses = await db.query.courses.findMany({
      where: currentSemester
        ? and(eq(courses.lecturerId, lecturer.id), eq(courses.semesterId, currentSemester.id))
        : eq(courses.lecturerId, lecturer.id),
      with: {
        program: { columns: { name: true } },
        semester: { columns: { name: true } },
      },
    });

    // --- Course Summaries ---
    const courseSummaries: CourseSummary[] = await Promise.all(
      lecturerCourses.map(async (course) => {
        const [{ count: studentCount }] = await db
          .select({ count: count() })
          .from(enrollments)
          .where(eq(enrollments.courseId, course.id));

        const [{ count: materialsCount }] = await db
          .select({ count: count() })
          .from(courseMaterials)
          .where(eq(courseMaterials.courseId, course.id));

        const [{ count: assignmentsCount }] = await db
          .select({ count: count() })
          .from(assignments)
          .where(eq(assignments.courseId, course.id));

        const [{ count: quizzesCount }] = await db
          .select({ count: count() })
          .from(quizzes)
          .where(eq(quizzes.courseId, course.id));

        return {
          id: course.id,
          name: course.name,
          code: course.code,
          programName: course.program?.name || 'N/A',
          semesterName: course.semester?.name || 'N/A',
          studentCount: Number(studentCount) || 0,
          materialsCount: Number(materialsCount) || 0,
          assignmentsCount: Number(assignmentsCount) || 0,
          quizzesCount: Number(quizzesCount) || 0,
        };
      })
    );

    // --- Upcoming Classes ---
    const upcomingClassesRaw = await db.query.timetables.findMany({
      where: eq(timetables.lecturerId, lecturer.id),
      with: {
        course: { columns: { name: true } },
      },
      orderBy: [timetables.dayOfWeek, timetables.startTime],
    });

    const formattedUpcomingClasses: UpcomingClass[] = upcomingClassesRaw.map((c) => ({
      id: c.id,
      courseName: c.course?.name || 'N/A',
      dayOfWeek: c.dayOfWeek,
      startTime: c.startTime,
      endTime: c.endTime,
      room: c.room || 'TBA',
    }));

    // --- Recent Submissions ---
    const recentAssignmentSubmissions = await db
      .select({
        submission: assignmentSubmissions,
        assignmentTitle: assignments.title,
        studentFirstName: students.firstName,
        studentLastName: students.lastName,
      })
      .from(assignmentSubmissions)
      .leftJoin(assignments, eq(assignmentSubmissions.assignmentId, assignments.id))
      .leftJoin(students, eq(assignmentSubmissions.studentId, students.id))
      .where(eq(assignments.assignedById, lecturer.id))
      .orderBy(desc(assignmentSubmissions.submittedAt))
      .limit(5);

    const recentQuizSubmissions = await db
      .select({
        submission: quizSubmissions,
        quizTitle: quizzes.title,
        studentFirstName: students.firstName,
        studentLastName: students.lastName,
      })
      .from(quizSubmissions)
      .leftJoin(quizzes, eq(quizSubmissions.quizId, quizzes.id))
      .leftJoin(students, eq(quizSubmissions.studentId, students.id))
      .where(eq(quizzes.createdById, lecturer.id))
      .orderBy(desc(quizSubmissions.submittedAt))
      .limit(5);

    const formattedRecentSubmissions: RecentSubmission[] = [
      ...recentAssignmentSubmissions.map((s) => {
        const status: 'submitted' | 'graded' | 'late' = s.submission.grade
          ? 'graded'
          : new Date(s.submission.submittedAt) > new Date()
          ? 'late'
          : 'submitted';

        return {
          id: s.submission.id,
          type: 'assignment' as const,
          title: s.assignmentTitle || 'Unknown Assignment',
          studentName: `${s.studentFirstName} ${s.studentLastName}`,
          submittedAt: new Date(s.submission.submittedAt),
          grade: s.submission.grade ? Number(s.submission.grade) : undefined,
          status,
        };
      }),
      ...recentQuizSubmissions.map((s) => {
        const status: 'submitted' | 'graded' | 'late' = s.submission.score
          ? 'graded'
          : new Date(s.submission.submittedAt) > new Date()
          ? 'late'
          : 'submitted';

        return {
          id: s.submission.id,
          type: 'quiz' as const,
          title: s.quizTitle || 'Unknown Quiz',
          studentName: `${s.studentFirstName} ${s.studentLastName}`,
          submittedAt: new Date(s.submission.submittedAt),
          grade: s.submission.score ? Number(s.submission.score) : undefined,
          status,
        };
      }),
    ].sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime()).slice(0, 10);

    // --- Student Performance ---
// --- Student Performance ---
let studentPerformance: StudentPerformance[] = [];
if (lecturerCourses.length > 0) {
  const primaryCourseId = lecturerCourses[0].id;
  const courseAssignments = await db.query.assignments.findMany({
    where: eq(assignments.courseId, primaryCourseId),
    columns: { id: true },
  });
  const assignmentIds = courseAssignments.map((a) => a.id);

  // The fix is in this line:
  const performanceRaw = await db
    .select({
      studentId: students.id,
      studentFirstName: students.firstName,
      studentLastName: students.lastName,
      avgScore: avg(assignmentSubmissions.grade).mapWith(Number),
      completedCount: count(assignmentSubmissions.id),
    })
    .from(students)
    .leftJoin(enrollments, eq(enrollments.studentId, students.id))
    .leftJoin(
      assignmentSubmissions,
      and(
        eq(assignmentSubmissions.studentId, students.id),
        // Use inArray to correctly format the IN clause
        inArray(assignmentSubmissions.assignmentId, assignmentIds.length ? assignmentIds : [0]) 
      )
    )
    .where(eq(enrollments.courseId, primaryCourseId))
    .groupBy(students.id, students.firstName, students.lastName)
    .orderBy(desc(avg(assignmentSubmissions.grade)));

  studentPerformance = performanceRaw.map((s) => ({
    studentId: s.studentId,
    studentName: `${s.studentFirstName} ${s.studentLastName}`,
    avgScore: s.avgScore || 0,
    assignmentsCompleted: Number(s.completedCount),
    assignmentsTotal: courseSummaries.find((c) => c.id === primaryCourseId)?.assignmentsCount || 0,
  }));
}

    // --- Notifications ---
    const recentNotifications = await db.query.userLogs.findMany({
      where: eq(userLogs.userId, authUser.userId),
      orderBy: (userLogs, { desc }) => [desc(userLogs.timestamp)],
      limit: 5,
    });

    // --- Statistics ---
    const totalStudents = courseSummaries.reduce((sum, c) => sum + c.studentCount, 0);
    const totalMaterials = courseSummaries.reduce((sum, c) => sum + c.materialsCount, 0);
    const totalAssignments = courseSummaries.reduce((sum, c) => sum + c.assignmentsCount, 0);
    const totalQuizzes = courseSummaries.reduce((sum, c) => sum + c.quizzesCount, 0);

    return {
      lecturer: {
        id: lecturer.id,
        name: `${lecturer.firstName} ${lecturer.lastName}`,
        email: lecturer.user?.email || '',
        department: lecturer.department?.name || 'Not assigned',
        position: lecturer.position,
      },
      currentSemester: currentSemester?.name || 'Not available',
      courseSummaries,
      upcomingClasses: formattedUpcomingClasses,
      recentSubmissions: formattedRecentSubmissions,
      studentPerformance,
      statistics: {
        totalCourses: lecturerCourses.length,
        totalStudents,
        totalMaterials,
        totalAssignments,
        totalQuizzes,
      },
      notifications: recentNotifications.map((n) => ({
        id: n.id,
        action: n.action,
        description: n.description,
        timestamp: n.timestamp,
      })),
    };
  } catch (error) {
    console.error('Error in getLecturerDashboardData:', error);
    throw new Error('Failed to fetch lecturer dashboard data');
  }
}

// ------------------
// Get Course Details
// ------------------
export async function getCourseDetails(courseId: number) {
  try {
    const isConnected = await testConnection();
    if (!isConnected) throw new Error('Database connection failed');

    const authUser = await getAuthUser();
    if (!authUser) throw new Error('Unauthorized');

    const lecturer = await db.query.staff.findFirst({
      where: eq(staff.userId, authUser.userId),
      columns: { id: true }
    });
    if (!lecturer) throw new Error('Lecturer profile not found');

    const course = await db.query.courses.findFirst({
      where: and(eq(courses.id, courseId), eq(courses.lecturerId, lecturer.id)),
      with: {
        program: { columns: { name: true } },
        semester: { columns: { name: true, startDate: true, endDate: true } }
      }
    });
    if (!course) throw new Error('Course not found or not taught by this lecturer');

    const enrollmentsData = await db.query.enrollments.findMany({
      where: eq(enrollments.courseId, courseId),
      with: {
        student: { columns: { id: true, firstName: true, lastName: true, registrationNumber: true } },
        grade: { columns: { catScore: true, examScore: true, totalScore: true, letterGrade: true, gpa: true } }
      }
    });

    const assignmentsData = await db.query.assignments.findMany({
      where: eq(assignments.courseId, courseId),
      with: { submissions: { columns: { id: true } } }
    });

    const quizzesData = await db.query.quizzes.findMany({
      where: eq(quizzes.courseId, courseId),
      with: { submissions: { columns: { id: true } } }
    });

    const materialsData = await db.query.courseMaterials.findMany({
      where: eq(courseMaterials.courseId, courseId),
      orderBy: desc(courseMaterials.uploadedAt)
    });

    const viewsData = await db.query.materialViews.findMany({
      where: sql`${materialViews.materialId} IN (${materialsData.map(m => m.id)})`,
      with: { student: { columns: { firstName: true, lastName: true } } }
    });

    return {
      course: {
        id: course.id,
        name: course.name,
        code: course.code,
        credits: Number(course.credits),
        description: course.description,
        programName: course.program?.name,
        semesterName: course.semester?.name,
        semesterDates: {
          start: course.semester?.startDate,
          end: course.semester?.endDate
        }
      },
      students: enrollmentsData.map(e => ({
        id: e.student.id,
        name: `${e.student.firstName} ${e.student.lastName}`,
        registrationNumber: e.student.registrationNumber,
        catScore: e.grade?.catScore ? Number(e.grade.catScore) : null,
        examScore: e.grade?.examScore ? Number(e.grade.examScore) : null,
        totalScore: e.grade?.totalScore ? Number(e.grade.totalScore) : null,
        letterGrade: e.grade?.letterGrade || null,
        gpa: e.grade?.gpa ? Number(e.grade.gpa) : null
      })),
      assignments: assignmentsData.map(a => ({
        id: a.id,
        title: a.title,
        dueDate: a.dueDate,
        submissionsCount: a.submissions.length
      })),
      quizzes: quizzesData.map(q => ({
        id: q.id,
        title: q.title,
        quizDate: q.quizDate,
        submissionsCount: q.submissions.length
      })),
      materials: materialsData.map(m => ({
        id: m.id,
        title: m.title,
        type: m.type,
        uploadedAt: m.uploadedAt,
        views: viewsData.filter(v => v.materialId === m.id).length
      }))
    };
  } catch (error) {
    console.error('Error in getCourseDetails:', error);
    throw new Error('Failed to fetch course details');
  }
}
