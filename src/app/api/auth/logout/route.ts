// src/app/api/auth/logout/route.ts

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.set('token', '', {
    httpOnly: true,
    path: '/',
    maxAge: 0, // expires immediately
  });

  return NextResponse.json({ message: 'Logged out successfully' });
}
