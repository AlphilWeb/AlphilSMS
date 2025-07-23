// lib/actions/student.dashboard.header.action.ts
'use server';

import { db } from '@/lib/db';
import { users, students, programs, userLogs } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getAuthUser } from '@/lib/auth';
import { redirect } from 'next/navigation';

export type StudentHeaderData = {
  name: string;
  program: string;
  avatar: string;
  notificationCount: number;
};

export async function getStudentHeaderData(): Promise<StudentHeaderData> {
  const authUser = await getAuthUser();

  const student = await db.query.students.findFirst({
    where: eq(students.userId, authUser.userId),
    columns: {
      firstName: true,
      lastName: true,
      passportPhotoUrl: true
    },
    with: {
      program: {
        columns: {
          name: true
        }
      }
    }
  });

  if (!student) {
    throw new Error('Student profile not found');
  }

  // Get actual notification count from database
  const notificationCount = await db
    .select()
    .from(userLogs)
    .where(eq(userLogs.userId, authUser.userId))
    .then(res => res.length);

  return {
    name: `${student.firstName} ${student.lastName}`,
    program: student.program.name,
    avatar: student.passportPhotoUrl || '/default-avatar.jpg',
    notificationCount
  };
}

export async function logoutStudent() {
  const { clearAuthCookies } = await import('@/lib/auth');
  clearAuthCookies();
  redirect('/login');
}