// lib/rbac.ts
import { AuthPayload } from './auth';

export const checkPermission = (
  user: AuthPayload | null,
  allowedRoles: string[]
) => {
  if (!user) return false;
  return allowedRoles.includes(user.role);
};
