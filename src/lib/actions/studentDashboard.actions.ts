// src/actions/student/dashboard.actions.ts
'use server';

import { db, testConnection } from '@/lib/db';
import { 
  students, 
  enrollments, 
  transcripts, 
  timetables, 
  invoices, 
  payments, 
  courses,
  programs,
  semesters,
  staff,
  grades,
  userLogs  
} from '@/lib/db/schema';
import { and, eq, gte, lte, sql, asc, InferSelectModel } from 'drizzle-orm';
import { getAuthUser } from '@/lib/auth';

type UpcomingClassQueryResult = {
  timetables: InferSelectModel<typeof timetables>;
  courses: InferSelectModel<typeof courses> | null; // courses can be null due to leftJoin
  staff: InferSelectModel<typeof staff> | null;     // staff can be null due to leftJoin
};

export async function getStudentDashboardData() {
  try {
      // Test database connection first
    const isConnected = await testConnection();
    if (!isConnected) {
      throw new Error('Database connection failed');
    }

    const authUser = await getAuthUser();
    if (!authUser) {
      throw new Error('Unauthorized');
    }

    // Get basic student info
    const student = await db.query.students.findFirst({
      where: eq(students.userId, authUser.userId),
      with: {
        program: true,
        department: true,
        currentSemester: true
      }
    });

    if (!student) {
      throw new Error('Student not found');
    }

    // Get current semester enrollments
    const enrollmentsData = await db.select()
      .from(enrollments)
      .where(
        and(
          eq(enrollments.studentId, student.id),
          eq(enrollments.semesterId, student.currentSemesterId)
        )
      );

    if (enrollmentsData.length === 0) {
      return {
        student: {
          id: student.id,
          firstName: student.firstName,
          lastName: student.lastName,
          email: student.email,
          registrationNumber: student.registrationNumber,
          studentNumber: student.studentNumber,
          passportPhotoUrl: student.passportPhotoUrl,
          program: student.program?.name || 'Not assigned',
          department: student.department?.name || 'Not assigned',
          currentSemester: student.currentSemester?.name || 'Not assigned',
          cgpa: null
        },
        academic: {
          enrolledCourses: 0,
          currentGPA: 0,
          nextClass: null
        },
        financial: {
          totalBalance: 0,
          nextPaymentDue: null,
          latestPayment: null
        },
        notifications: []
      };
    }

    // Get grades for these enrollments
    const gradesData = await db.select()
      .from(grades)
      .where(
        sql`${grades.enrollmentId} IN (${sql.raw(
          enrollmentsData.map(e => e.id).join(',')
        )})`
      );

    // Get courses for these enrollments
    const coursesData = await db.select()
      .from(courses)
      .where(
        sql`${courses.id} IN (${sql.raw(
          enrollmentsData.map(e => e.courseId).join(',')
        )})`
      );

    // Combine the data
    const enrollmentsWithGrades = enrollmentsData.map(enrollment => {
      const grade = gradesData.find(g => g.enrollmentId === enrollment.id);
      const course = coursesData.find(c => c.id === enrollment.courseId);
      return {
        ...enrollment,
        grade,
        course
      };
    });

    // Calculate current GPA
    const currentGPA = enrollmentsWithGrades.reduce((acc, enrollment) => {
      if (enrollment.grade?.gpa) {
        return acc + Number(enrollment.grade.gpa);
      }
      return acc;
    }, 0) / (enrollmentsWithGrades.length || 1);

    // Get latest transcript for CGPA
    const latestTranscript = await db.query.transcripts.findFirst({
      where: eq(transcripts.studentId, student.id),
      orderBy: (transcripts, { desc }) => [desc(transcripts.generatedDate)],
    });

    // Get upcoming classes (next 24 hours)
    let upcomingClasses: UpcomingClassQueryResult[] = [];
    try {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const daysBetween = getDaysBetween(now, tomorrow);
      const currentTime = formatTime(now);
      
      upcomingClasses = await db.select()
        .from(timetables)
        .where(
          and(
            eq(timetables.semesterId, student.currentSemesterId),
            sql`${timetables.courseId} IN (${sql.raw(
              enrollmentsData.map(e => e.courseId).join(',')
            )})`,
            sql`${timetables.dayOfWeek} IN (${sql.raw(
              daysBetween.map(d => `'${d}'`).join(',')
            )})`,
            sql`${timetables.endTime} > ${currentTime}`
          )
        )
        .leftJoin(courses, eq(timetables.courseId, courses.id))
        .leftJoin(staff, eq(timetables.lecturerId, staff.id))
        .orderBy(asc(timetables.dayOfWeek), asc(timetables.startTime))
        .limit(1);
    } catch (error) {
      console.error('Error fetching upcoming classes:', error);
      upcomingClasses = [];
    }

    // Get financial information
    const outstandingInvoices = await db.query.invoices.findMany({
      where: and(
        eq(invoices.studentId, student.id),
        sql`${invoices.balance} > 0`
      ),
      orderBy: (invoices, { asc }) => [asc(invoices.dueDate)]
    });

    const totalBalance = outstandingInvoices.reduce((sum, invoice) => {
      return sum + Number(invoice.balance);
    }, 0);

    const nextPaymentDue = outstandingInvoices.length > 0 
      ? outstandingInvoices[0].dueDate 
      : null;

    // Get latest payment
    const latestPayment = await db.query.payments.findFirst({
      where: eq(payments.studentId, student.id),
      orderBy: (payments, { desc }) => [desc(payments.transactionDate)],
    });

    // Get recent notifications (using user logs as notifications)
    const recentNotifications = await db.query.userLogs.findMany({
      where: eq(userLogs.userId, authUser.userId),
      orderBy: (userLogs, { desc }) => [desc(userLogs.timestamp)],
      limit: 5
    });

    return {
      student: {
        id: student.id,
        firstName: student.firstName,
        lastName: student.lastName,
        email: student.email,
        registrationNumber: student.registrationNumber,
        studentNumber: student.studentNumber,
        passportPhotoUrl: student.passportPhotoUrl,
        program: student.program?.name || 'Not assigned',
        department: student.department?.name || 'Not assigned',
        currentSemester: student.currentSemester?.name || 'Not assigned',
        cgpa: latestTranscript?.cgpa ? Number(latestTranscript.cgpa) : null
      },
      academic: {
        enrolledCourses: enrollmentsWithGrades.length,
        currentGPA: currentGPA,
        nextClass: upcomingClasses.length > 0 ? {
          courseCode: upcomingClasses[0].courses?.code || '',
          courseName: upcomingClasses[0].courses?.name || '',
          day: upcomingClasses[0].timetables.dayOfWeek,
          startTime: upcomingClasses[0].timetables.startTime,
          endTime: upcomingClasses[0].timetables.endTime,
          room: upcomingClasses[0].timetables.room || 'Not assigned',
          lecturer: upcomingClasses[0].staff 
            ? `${upcomingClasses[0].staff.firstName} ${upcomingClasses[0].staff.lastName}`
            : 'Not assigned'
        } : null
      },
      financial: {
        totalBalance,
        nextPaymentDue,
        latestPayment: latestPayment ? {
          amount: Number(latestPayment.amount),
          date: latestPayment.transactionDate,
          method: latestPayment.paymentMethod
        } : null
      },
      notifications: recentNotifications.map(notification => ({
        id: notification.id,
        action: notification.action,
        description: notification.description,
        timestamp: notification.timestamp
      }))
    };
  } catch (error) {
    console.error('Error in getStudentDashboardData:', error);
    throw new Error('Failed to fetch student dashboard data');
  }
}

// Helper functions
function getDaysBetween(start: Date, end: Date): string[] {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const result = [];
  
  const current = new Date(start);
  while (current <= end) {
    result.push(days[current.getDay()]);
    current.setDate(current.getDate() + 1);
  }
  
  return result;
}

function formatTime(date: Date): string {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}