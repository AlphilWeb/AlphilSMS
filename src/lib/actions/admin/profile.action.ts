// app/actions/admin-actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { courses, db, students } from '@/lib/db'; // Your Drizzle database connection
import { 
  users, 
  staff, 
  departments, 
  userLogs,
  type SelectUser,
  type SelectStaff,
  type SelectDepartment,
  type NewUserLog
} from '@/lib/db/schema'; // Your schema file
import { eq, and, desc, sql } from 'drizzle-orm';
import { hash, compare } from 'bcryptjs';
import { redirect } from 'next/navigation';

// Types for admin profile data
export interface AdminProfileData {
  user: SelectUser;
  staff: SelectStaff;
  department: SelectDepartment | null;
  recentActivity: any[]; // Adjust type based on your needs
}

export interface UpdateAdminProfileParams {
  firstName: string;
  lastName: string;
  email: string;
  currentPassword?: string;
  newPassword?: string;
}

// Get admin profile data
export async function getAdminProfile(userId: number): Promise<AdminProfileData> {
  try {
    // Get user data
    const userData = await db.select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!userData[0]) {
      throw new Error('User not found');
    }

    // Get staff data
    const staffData = await db.select()
      .from(staff)
      .where(eq(staff.userId, userId))
      .limit(1);

    if (!staffData[0]) {
      throw new Error('Staff profile not found');
    }

    // Get department data
    const departmentData = await db.select()
      .from(departments)
      .where(eq(departments.id, staffData[0].departmentId))
      .limit(1);

    // Get recent activity (last 10 user logs)
    const recentActivity = await db.select()
      .from(userLogs)
      .where(eq(userLogs.userId, userId))
      .orderBy(desc(userLogs.timestamp))
      .limit(10);

    return {
      user: userData[0],
      staff: staffData[0],
      department: departmentData[0] || null,
      recentActivity
    };
  } catch (error) {
    console.error('Error fetching admin profile:', error);
    throw new Error('Failed to fetch admin profile');
  }
}

// Update admin profile
export async function updateAdminProfile(
  userId: number,
  staffId: number,
  data: UpdateAdminProfileParams
): Promise<{ success: boolean; message: string }> {
  try {
    const { firstName, lastName, email, currentPassword, newPassword } = data;

    // Verify current user exists
    const userData = await db.select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!userData[0]) {
      throw new Error('User not found');
    }

    // Check if email is already taken by another user
    if (email !== userData[0].email) {
      const existingUser = await db.select()
        .from(users)
        .where(and(eq(users.email, email), eq(users.id, userId)))
        .limit(1);

      if (existingUser[0]) {
        return {
          success: false,
          message: 'Email is already taken by another user'
        };
      }
    }

    // Handle password change if provided
    if (currentPassword && newPassword) {
      const isPasswordValid = await compare(currentPassword, userData[0].passwordHash);
      if (!isPasswordValid) {
        return {
          success: false,
          message: 'Current password is incorrect'
        };
      }

      const hashedPassword = await hash(newPassword, 12);
      
      // Update user with new password
      await db.update(users)
        .set({
          email,
          passwordHash: hashedPassword,
          updatedAt: new Date()
        })
        .where(eq(users.id, userId));
    } else {
      // Update user without changing password
      await db.update(users)
        .set({
          email,
          updatedAt: new Date()
        })
        .where(eq(users.id, userId));
    }

    // Update staff profile
    await db.update(staff)
      .set({
        firstName,
        lastName,
        email,
        updatedAt: new Date()
      })
      .where(eq(staff.id, staffId));

    // Log the profile update
    await logUserAction(userId, 'update', 'staff', staffId, 'Updated admin profile information');

    revalidatePath('/admin/profile');
    return {
      success: true,
      message: 'Profile updated successfully'
    };
  } catch (error) {
    console.error('Error updating admin profile:', error);
    return {
      success: false,
      message: 'Failed to update profile'
    };
  }
}

// Update admin profile photo
export async function updateAdminProfilePhoto(
  userId: number,
  staffId: number,
  photoType: 'passport' | 'nationalId' | 'academic',
  photoUrl: string
): Promise<{ success: boolean; message: string }> {
  try {
    const updateData: Partial<SelectStaff> = {};

    switch (photoType) {
      case 'passport':
        updateData.passportPhotoUrl = photoUrl;
        break;
      case 'nationalId':
        updateData.nationalIdPhotoUrl = photoUrl;
        break;
      case 'academic':
        updateData.academicCertificatesUrl = photoUrl;
        break;
    }

    updateData.updatedAt = new Date();

    await db.update(staff)
      .set(updateData)
      .where(eq(staff.id, staffId));

    // Log the photo update
    await logUserAction(userId, 'update', 'staff', staffId, `Updated ${photoType} photo`);

    revalidatePath('/admin/profile');
    return {
      success: true,
      message: 'Profile photo updated successfully'
    };
  } catch (error) {
    console.error('Error updating profile photo:', error);
    return {
      success: false,
      message: 'Failed to update profile photo'
    };
  }
}

// Get admin dashboard statistics
export async function getAdminDashboardStats(userId: number) {
  try {
    // You'll need to import additional tables for these queries
    const [
      totalStudents,
      totalStaff,
      totalCourses,
      recentRegistrations
    ] = await Promise.all([
      // Example queries - adjust based on your actual needs
      db.select({ count: count() }).from(students),
      db.select({ count: count() }).from(staff),
      db.select({ count: count() }).from(courses),
      db.select()
        .from(students)
        .orderBy(desc(students.createdAt))
        .limit(5)
    ]);

    return {
      totalStudents: totalStudents[0]?.count || 0,
      totalStaff: totalStaff[0]?.count || 0,
      totalCourses: totalCourses[0]?.count || 0,
      recentRegistrations
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    throw new Error('Failed to fetch dashboard statistics');
  }
}

// Helper function to log user actions
async function logUserAction(
  userId: number,
  action: string,
  targetTable: string,
  targetId: number,
  description: string
): Promise<void> {
  try {
    const logEntry: NewUserLog = {
      userId,
      action,
      targetTable,
      targetId,
      description,
      timestamp: new Date()
    };

    await db.insert(userLogs).values(logEntry);
  } catch (error) {
    console.error('Error logging user action:', error);
  }
}

// Delete admin account (with proper authorization checks)
export async function deleteAdminAccount(
  userId: number,
  staffId: number,
  confirmation: string
): Promise<{ success: boolean; message: string }> {
  try {
    // Add additional security checks here
    if (confirmation !== 'DELETE MY ACCOUNT') {
      return {
        success: false,
        message: 'Confirmation text does not match'
      };
    }

    // Check if admin is head of any department
    const departmentsHeaded = await db.select()
      .from(departments)
      .where(eq(departments.headOfDepartmentId, staffId));

    if (departmentsHeaded.length > 0) {
      return {
        success: false,
        message: 'Cannot delete account while serving as department head'
      };
    }

    // Delete staff record (this should cascade to related records based on your schema)
    await db.delete(staff).where(eq(staff.id, staffId));

    // Delete user account
    await db.delete(users).where(eq(users.id, userId));

    // Log the account deletion
    await logUserAction(userId, 'delete', 'users', userId, 'Admin account deleted');

    redirect('/login');
  } catch (error) {
    console.error('Error deleting admin account:', error);
    return {
      success: false,
      message: 'Failed to delete account'
    };
  }
}

// Utility function for counting (if not already available)
function count() {
  // This is a placeholder - you might need to adjust based on your database
  return sql`count(*)`;
}