import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/index';
import { NewUser, users } from '@/lib/db/schema';
import { hash } from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { getAuthUser } from '@/lib/auth';
import { checkPermission } from '@/lib/rbac';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    const userId = parseInt(id);
    if (isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user, { status: 200 });
  } catch (err) {
    console.error('[GET_USER_ERROR]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser(); // FIXED: await here
    if (!user || !checkPermission(user, ['1'])) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const userId = parseInt(params.id);
    if (isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const body = await req.json();
    const updates: Partial<NewUser> = {};

    if (body.email) updates.email = body.email;
    if (body.roleId) updates.roleId = body.roleId;
    if (body.password) {
      updates.passwordHash = await hash(body.password, 10);
    }

    const result = await db.update(users).set(updates).where(eq(users.id, userId)).returning();

    return NextResponse.json({ message: 'User updated', user: result[0] });
  } catch (err) {
    console.error('[USER_UPDATE_ERROR]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser(); // FIXED: await here
    if (!user || !checkPermission(user, ['1'])) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const userId = parseInt(params.id);
    if (isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    await db.delete(users).where(eq(users.id, userId));
    return NextResponse.json({ message: 'User deleted' });
  } catch (err) {
    console.error('[USER_DELETE_ERROR]', err);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
