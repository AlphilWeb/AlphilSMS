// lib/actions/lecturer.dashboard.header.action.ts
'use server';

import { db } from '@/lib/db';
import {  staff, userLogs } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getAuthUser } from '@/lib/auth';
import { redirect } from 'next/navigation';

export type LecturerHeaderData = {
  name: string;
  role: string;
  department: string;
  avatar: string;
  notificationCount: number;
};

export async function getLecturerHeaderData(): Promise<LecturerHeaderData> {
  const authUser = await getAuthUser();

  const lecturer = await db.query.staff.findFirst({
    where: eq(staff.userId, authUser.userId),
    columns: {
      firstName: true,
      lastName: true,
      position: true,
      passportPhotoUrl: true
    },
    with: {
      department: {
        columns: {
          name: true
        }
      }
    }
  });

  if (!lecturer) {
    throw new Error('Lecturer profile not found');
  }

  // Get actual notification count from database
  const notificationCount = await db
    .select()
    .from(userLogs)
    .where(eq(userLogs.userId, authUser.userId))
    .then(res => res.length);

  return {
    name: `${lecturer.firstName} ${lecturer.lastName}`,
    role: lecturer.position,
    department: lecturer.department.name,
    avatar: lecturer.passportPhotoUrl || '/default-avatar.jpg',
    notificationCount
  };
}

export async function logout() {
  const { clearAuthCookies } = await import('@/lib/auth');
  clearAuthCookies();
  redirect('/login');
}