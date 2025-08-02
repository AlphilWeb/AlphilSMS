// lib/auth.ts
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { redirect } from 'next/navigation';

const secret = process.env.JWT_SECRET as string;

if (!secret) {
  throw new Error('JWT_SECRET environment variable is not set');
}

export type AuthPayload = {
  userId: number;
  email: string;
  role: string;
  departmentId?: number | null;
};

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

export function createToken(payload: AuthPayload): string {
  return jwt.sign(payload, secret, { expiresIn: '12h' });
}

export async function verifyToken(token: string): Promise<AuthPayload> {
  try {
    return jwt.verify(token, secret) as AuthPayload;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid or expired token';
    throw new AuthError(message);
  }
}

export async function getAuthUser(): Promise<AuthPayload> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    
    if (!token) {
      redirect('/login');
    }

    return await verifyToken(token);
  } catch {
    // Clear invalid token
    (await cookies()).set('token', '', { expires: new Date(0) });
    redirect('/login');
  }
}

export async function getAuthUserSafe(): Promise<AuthPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    return token ? await verifyToken(token) : null;
  } catch {
    return null;
  }
}

export function getAuthUserFromRequest(req: NextRequest): AuthPayload | null {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) return null;
    const token = authHeader.split(' ')[1];
    return jwt.verify(token, secret) as AuthPayload;
  } catch {
    return null;
  }
}

export async function checkAuthAndPermissions(allowedRoles: string[]): Promise<AuthPayload> {
  const authUser = await getAuthUser();

  if (!allowedRoles.some(role => 
    authUser.role.toLowerCase() === role.toLowerCase()
  )) {
    throw new AuthError(`Forbidden: Role ${authUser.role} not allowed`);
  }

  return authUser;
}

export async function clearAuthCookies() {
  (await cookies()).set('token', '', { expires: new Date(0) });
}