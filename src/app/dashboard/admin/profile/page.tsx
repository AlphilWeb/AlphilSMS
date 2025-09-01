// app/dashboard/admin/profile/page.tsx
import AdminProfileSection from '@/components/admin/admin.profile.client';
import ErrorMessage from '@/components/ui/error-message';
import { getAdminProfile } from '@/lib/actions/admin/profile.action';

export default async function AdminProfilePage() {
  try {
    // Fetch admin profile data
    // Note: In a real implementation, you would get the user ID from the session
    const userId = 1; // Replace with actual user ID from session
    const profileData = await getAdminProfile(userId);

    return (
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Welcome Banner */}
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-800">Admin Profile</h1>
          <p className="text-gray-600">Manage your profile information and account settings</p>
        </div>

        {/* Main Profile Content */}
        <div className="bg-white rounded-lg shadow p-6">
          <AdminProfileSection profileData={profileData} />
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error rendering AdminProfilePage:', error);
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <ErrorMessage
          title="Failed to load profile"
          message="There was an error loading your profile data. Please try again later."
        />
      </div>
    );
  }
}