// lib/auth.ts
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

const secret = process.env.JWT_SECRET!;

export type AuthPayload = {
  userId: number;
  email: string;
  role: string; // role name, e.g., "Admin", "Staff", "Student"
  departmentId?: number | null; // <-- ADDED THIS LINE
};

export class ActionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ActionError';
  }
}

export function createToken(payload: AuthPayload) {
  return jwt.sign(payload, secret, { expiresIn: '30m' });
}

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

/**
 * Check if user has one of the allowed roles.
 * Capitalizes role names for consistent comparison.
 */
export async function checkAuthAndPermissions(allowedRoles: string[]): Promise<AuthPayload> {
  const authUser = await getAuthUser();

  if (!authUser) {
    throw new ActionError('Unauthorized: You must be logged in to perform this action.');
  }

  // Normalize: capitalize both sides for safe comparison
  const userRoleCapitalized = capitalize(authUser.role);

  const allowedCapitalized = allowedRoles.map(r => capitalize(r));

  if (!allowedCapitalized.includes(userRoleCapitalized)) {
    throw new ActionError(`Forbidden: Your role (${authUser.role}) does not have permission to perform this action.`);
  }

  return authUser;
}

function capitalize(str: string) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}