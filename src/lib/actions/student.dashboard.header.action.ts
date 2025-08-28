// lib/actions/student.dashboard.header.action.ts
'use server';

import { db } from '@/lib/db';
import { students, userLogs } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getAuthUser } from '@/lib/auth';
import { redirect } from 'next/navigation';

export type StudentHeaderData = {
  id: number; // ← Added this for image lookup
  name: string;
  program: string;
  avatar: string; // This should be the file path/key, not the full URL
  notificationCount: number;
};

export async function getStudentHeaderData(): Promise<StudentHeaderData> {
  const authUser = await getAuthUser();

  const student = await db.query.students.findFirst({
    where: eq(students.userId, authUser.userId),
    columns: {
      id: true, // ← Added this
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
    id: student.id, // ← This is crucial for image lookup
    name: `${student.firstName} ${student.lastName}`,
    program: student.program.name,
    avatar: student.passportPhotoUrl || '/default-avatar.jpg', // This should be the file key/path
    notificationCount
  };
}

export async function logoutStudent() {
  const { clearAuthCookies } = await import('@/lib/auth');
  clearAuthCookies();
  redirect('/login');
}