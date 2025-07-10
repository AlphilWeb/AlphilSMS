// lib/auth.ts
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const secret = process.env.JWT_SECRET!;

export type AuthPayload = {
  userId: number;
  email: string;
  role: string;
};

// Create JWT
export function createToken(payload: AuthPayload) {
  return jwt.sign(payload, secret, { expiresIn: '30m' });
}

// Decode JWT from cookie
export async function getAuthUser(): Promise<AuthPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return null;
    return jwt.verify(token, secret) as AuthPayload;
  } catch {
    return null;
  }
}

export async function getAuthUserFromCookie(): Promise<AuthPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return null;
    return jwt.verify(token, secret) as AuthPayload;
  } catch {
    return null;
  }
}

// Token from header (for API routes)
export function getAuthUserFromRequest(req: NextRequest): AuthPayload | null {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
    const token = authHeader.split(' ')[1];
    return jwt.verify(token, secret) as AuthPayload;
  } catch {
    return null;
  }
}
