// lib/actions/registrar.dashboard.header.action.ts
'use server';

import { db } from '@/lib/db';
import { staff, userLogs } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getAuthUser } from '@/lib/auth';
import { redirect } from 'next/navigation';

export type RegistrarHeaderData = {
  id: number;
  name: string;
  role: string;
  department?: string;
  avatar: string;
  notificationCount: number;
};

export async function getRegistrarHeaderData(): Promise<RegistrarHeaderData> {
  const authUser = await getAuthUser();


  const registrar = await db.query.staff.findFirst({
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

  if (!registrar) {
    throw new Error('Registrar profile not found');
  }

  // Get actual notification count from database
  const notificationCount = await db
    .select()
    .from(userLogs)
    .where(eq(userLogs.userId, authUser.userId))
    .then(res => res.length);

  return {
    id: registrar.id,
    name: `${registrar.firstName} ${registrar.lastName}`,
    role: registrar.position,
    department: registrar.department?.name,
    avatar: registrar.passportPhotoUrl || '/default-avatar.jpg',
    notificationCount
  };
}

export async function logout() {
  const { clearAuthCookies } = await import('@/lib/auth');
  clearAuthCookies();
  redirect('/login');
}