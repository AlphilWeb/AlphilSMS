// lib/actions/bursar.dashboard.header.action.ts
'use server';

import { db } from '@/lib/db';
import { staff, userLogs } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getAuthUser } from '@/lib/auth';
import { redirect } from 'next/navigation';

export type BursarHeaderData = {
  name: string;
  department: string;
  position: string;
  avatar: string;
  notificationCount: number;
};

export async function getBursarHeaderData(): Promise<BursarHeaderData> {
  const authUser = await getAuthUser();

  const bursar = await db.query.staff.findFirst({
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

  if (!bursar) {
    throw new Error('Bursar profile not found');
  }

  // Get actual notification count from database
  const notificationCount = await db
    .select()
    .from(userLogs)
    .where(eq(userLogs.userId, authUser.userId))
    .then(res => res.length);

  return {
    name: `${bursar.firstName} ${bursar.lastName}`,
    department: bursar.department.name,
    position: bursar.position,
    avatar: bursar.passportPhotoUrl || '/default-avatar.jpg',
    notificationCount
  };
}

export async function logoutBursar() {
  const { clearAuthCookies } = await import('@/lib/auth');
  clearAuthCookies();
  redirect('/login');
}