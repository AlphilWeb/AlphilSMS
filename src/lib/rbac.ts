// lib/rbac.ts
import { AuthPayload } from './auth';

function capitalize(str: string) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export const checkPermission = (
  user: AuthPayload | null,
  allowedRoles: string[]
) => {
  if (!user) return false; 
  const userRole = capitalize(user.role);
  const allowed = allowedRoles.map(r => capitalize(r));
  return allowed.includes(userRole);
};
