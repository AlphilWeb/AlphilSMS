// lib/actions/admin.dashboard.header.action.ts
'use server';

import { db } from '@/lib/db';
import { staff, userLogs } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getAuthUser } from '@/lib/auth';
import { redirect } from 'next/navigation';

export type AdminHeaderData = {
  id: number; // ← Added this for image lookup
  name: string;
  role: string;
  department?: string;
  avatar: string; // This should be the file path/key, not the full URL
  notificationCount: number;
};

export async function getAdminHeaderData(): Promise<AdminHeaderData> {
  const authUser = await getAuthUser();

  const admin = await db.query.staff.findFirst({
    where: eq(staff.userId, authUser.userId),
    columns: {
      id: true, // ← Added this
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

  if (!admin) {
    throw new Error('Admin profile not found');
  }

  // Get actual notification count from database
  const notificationCount = await db
    .select()
    .from(userLogs)
    .where(eq(userLogs.userId, authUser.userId))
    .then(res => res.length);

  return {
    id: admin.id, // ← This is crucial for image lookup
    name: `${admin.firstName} ${admin.lastName}`,
    role: admin.position,
    department: admin.department?.name,
    avatar: admin.passportPhotoUrl || '/default-avatar.jpg', // This should be the file key/path
    notificationCount
  };
}

export async function logoutAdmin() {
  const { clearAuthCookies } = await import('@/lib/auth');
  clearAuthCookies();
  redirect('/login');
}