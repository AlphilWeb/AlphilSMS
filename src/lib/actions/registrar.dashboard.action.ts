// src/actions/registrar.dashboard.action.ts
'use server';

import { db, testConnection } from '@/lib/db';
import { 
  students, 
  enrollments, 
  transcripts, 
  programs,
  semesters,
  userLogs  
} from '@/lib/db/schema';
import { and, eq, sql, desc, count, gte, lte, isNull } from 'drizzle-orm';
import { getAuthUser } from '@/lib/auth';
import { format } from 'date-fns';

export async function getRegistrarDashboardData() {
  try {
    const isConnected = await testConnection();
    if (!isConnected) {
      throw new Error('Database connection failed');
    }

    const authUser = await getAuthUser();
    if (!authUser) {
      throw new Error('Unauthorized');
    }

    // Verify user has registrar role
    if (authUser.role.toLowerCase() !== 'registrar') {
    throw new Error('Unauthorized access');
    }


    // Get current semester
    const currentSemester = await db.query.semesters.findFirst({
      orderBy: (semesters, { desc }) => [desc(semesters.startDate)],
    });

    if (!currentSemester) {
      throw new Error('No semesters found');
    }

    // Get counts for dashboard cards
    const [studentsCount, enrollmentsCount, transcriptsCount] = await Promise.all([
      db.select({ count: count() }).from(students),
      db.select({ count: count() })
        .from(enrollments)
        .where(eq(enrollments.semesterId, currentSemester.id)),
      db.select({ count: count() }).from(transcripts),
    ]);

    // Get recent enrollments (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentEnrollments = await db.query.enrollments.findMany({
      where: and(
        gte(enrollments.enrollmentDate, format(sevenDaysAgo, 'yyyy-MM-dd')),
        eq(enrollments.semesterId, currentSemester.id)
      ),
      with: {
        student: {
          columns: {
            firstName: true,
            lastName: true,
            registrationNumber: true,
          }
        },
        course: {
          columns: {
            name: true,
            code: true,
          }
        }
      },
      orderBy: (enrollments, { desc }) => [desc(enrollments.enrollmentDate)],
      limit: 5
    });

    // Get pending transcript requests
    const pendingTranscripts = await db.query.transcripts.findMany({
      where: isNull(transcripts.fileUrl),
      with: {
        student: {
          columns: {
            firstName: true,
            lastName: true,
            registrationNumber: true,
          }
        }
      },
      orderBy: (transcripts, { desc }) => [desc(transcripts.generatedDate)],
      limit: 5
    });

    // Get recent activity logs
    const recentActivity = await db.query.userLogs.findMany({
      orderBy: (userLogs, { desc }) => [desc(userLogs.timestamp)],
      limit: 10
    });

    return {
      stats: {
        totalStudents: studentsCount[0].count,
        currentSemesterEnrollments: enrollmentsCount[0].count,
        transcriptsGenerated: transcriptsCount[0].count,
      },
      currentSemester: {
        name: currentSemester.name,
        startDate: currentSemester.startDate,
        endDate: currentSemester.endDate,
      },
      recentEnrollments: recentEnrollments.map(e => ({
        studentName: `${e.student.firstName} ${e.student.lastName}`,
        regNumber: e.student.registrationNumber,
        course: `${e.course.code} - ${e.course.name}`,
        date: e.enrollmentDate,
      })),
      pendingTranscripts: pendingTranscripts.map(t => ({
        studentName: `${t.student.firstName} ${t.student.lastName}`,
        regNumber: t.student.registrationNumber,
        requestedDate: t.generatedDate,
      })),
      recentActivity: recentActivity.map(a => ({
        action: a.action,
        description: a.description,
        timestamp: a.timestamp,
      }))
    };
  } catch (error) {
    console.error('Error in getRegistrarDashboardData:', error);
    throw new Error('Failed to fetch registrar dashboard data');
  }
}