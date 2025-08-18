'use server';

import { db } from '@/lib/db';
// import { departments } from '@/lib/db/schema';
import { getAuthUser } from '@/lib/auth';

export async function getAllDepartments() {
  const authUser = await getAuthUser();
  if (!authUser) {
    throw new Error('Unauthorized');
  }

  return db.query.departments.findMany({
    orderBy: (departments, { asc }) => [asc(departments.name)]
  });
}