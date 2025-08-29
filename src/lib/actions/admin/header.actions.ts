// lib/actions/admin.dashboard.header.action.ts
'use server';

import { db } from '@/lib/db';
import { staff, userLogs, roles } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getAuthUser } from '@/lib/auth';
import { redirect } from 'next/navigation';

export type AdminHeaderData = {
  id: number;
  name: string;
  role: string;
  department?: string;
  avatar: string;
  notificationCount: number;
};

export async function getAdminHeaderData(): Promise<AdminHeaderData> {
  const authUser = await getAuthUser();

  // Check if user has admin role
  const userRole = await db.query.roles.findFirst({
    where: eq(roles.id, authUser.userId),
    columns: {
      name: true
    }
  });

  if (userRole?.name.toLowerCase() !== 'administrator') {
    throw new Error('Access denied: Administrator role required');
  }

  const admin = await db.query.staff.findFirst({
    where: eq(staff.userId, authUser.userId),
    columns: {
      id: true,
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
    id: admin.id,
    name: `${admin.firstName} ${admin.lastName}`,
    role: admin.position,
    department: admin.department?.name,
    avatar: admin.passportPhotoUrl || '/default-avatar.jpg',
    notificationCount
  };
}

export async function logout() {
  const { clearAuthCookies } = await import('@/lib/auth');
  clearAuthCookies();
  redirect('/login');
}