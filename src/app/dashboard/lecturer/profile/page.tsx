import { getLecturerProfile } from '@/lib/actions/lecturer.profile.actions';
import LecturerDashboardHeader from '@/components/lecturerDashboardHeader';
import LecturerProfileForm from '@/components/lecturer/lecturer.profile';
import ErrorMessage from '@/components/ui/error-message';
import { getAuthUser } from '@/lib/auth';

export default async function LecturerProfilePage() {
  try {
    const authUser = await getAuthUser();
    if (!authUser || !authUser.userId) {
      throw new Error('Unauthorized: You must be logged in.');
    }

    const profile = await getLecturerProfile();
    if (!profile) {
      throw new Error('Lecturer profile not found');
    }

    return (
      <>
        <LecturerDashboardHeader />
        
        <main className="md:pl-64 pt-2 h-[calc(100vh-4rem)] overflow-y-auto bg-emerald-800 text-white">
          <div className="p-6 space-y-6 max-w-7xl mx-auto">
            {/* Welcome Banner */}
            <div className="bg-white rounded-lg shadow p-6">
              <h1 className="text-2xl font-bold text-gray-800">My Profile</h1>
              <p className="text-gray-600">Manage your personal information and documents</p>
            </div>

            {/* Main Content */}
            <div className="bg-white rounded-lg shadow p-6">
              <LecturerProfileForm profileData={{
                id: profile.id,
                firstName: profile.firstName,
                lastName: profile.lastName,
                email: profile.email,
                position: profile.position,
                departmentName: profile.departmentName || 'Not specified',
                createdAt: profile.createdAt.toString(),
                passportPhotoUrl: profile.passportPhotoUrl || '/default-avatar.jpg',
                nationalIdPhotoUrl: profile.nationalIdPhotoUrl || '',
                academicCertificatesUrl: profile.academicCertificatesUrl || '',
                employmentDocumentsUrl: profile.employmentDocumentsUrl || ''
              }} />
            </div>
          </div>
        </main>
      </>
    );
  } catch (error) {
    console.error('Error rendering LecturerProfilePage:', error);
    return (
      <>
        <LecturerDashboardHeader />
        <main className="md:pl-64 pt-16 h-[calc(100vh-4rem)] overflow-y-auto bg-emerald-800 text-white">
          <div className="p-6 max-w-7xl mx-auto">
            <ErrorMessage
              title="Failed to load profile"
              message={error instanceof Error ? error.message : 'An unknown error occurred'}
            />
          </div>
        </main>
      </>
    );
  }
}