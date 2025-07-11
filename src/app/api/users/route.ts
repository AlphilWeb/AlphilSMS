import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/index';
import { users } from '@/lib/db/schema';
import { hash } from 'bcryptjs';
import { NewUser } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getAuthUser, getAuthUserFromRequest } from '@/lib/auth';
import { checkPermission } from '@/lib/rbac';

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();

    if (!user || !checkPermission(user, ['1'])) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await req.json();

    // Basic validation
    const { email, password, roleId } = body;
    if (!email || !password || !roleId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check for existing user
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 409 });
    }

    // Hash the password
    const passwordHash = await hash(password, 10);

    // Create user
    const newUser: NewUser = {
      email,
      passwordHash,
      roleId,
    };

    const result = await db.insert(users).values(newUser).returning();

    return NextResponse.json({ message: 'User created', user: result[0] }, { status: 201 });

  } catch (err) {
    console.error('[USER_CREATE_ERROR]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser();

    if (!checkPermission(user, ['1'])) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const result = await db.select().from(users);
    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    console.error('[GET_USERS_ERROR]', err);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}


