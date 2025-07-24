import { getStudentProfile } from '@/lib/actions/studentProfile.action';
import StudentDashboardHeader from '@/components/studentDashboardHeader';
import ProfileSection from '@/components/students/profile-section';
import ErrorMessage from '@/components/ui/error-message';
import Footer from '@/components/footer';

export default async function ProfilePage() {
  try {
    const profileData = await getStudentProfile();

    return (
      <>
        <StudentDashboardHeader />
        
        <main className="md:pl-64 pt-2 h-[calc(100vh-4rem)] overflow-y-auto bg-emerald-800 text-white">
          <div className="p-6 max-w-7xl mx-auto">
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-6">
                <h1 className="text-2xl font-bold text-gray-800 mb-6">My Profile</h1>
                <ProfileSection profileData={profileData} />
              </div>
            </div>
            <Footer />
          </div>
        </main>
      </>
    );
  } catch (error) {
    console.error('Error rendering ProfilePage:', error);
    return (
      <>
        <StudentDashboardHeader />
        <main className="md:pl-64 pt-16 h-[calc(100vh-4rem)] overflow-y-auto bg-emerald-800 text-white">
          <div className="p-6 max-w-7xl mx-auto">
            <ErrorMessage
              title="Failed to load profile"
              message={error instanceof Error ? error.message : 'There was an error loading your profile.'}
            />
            <Footer />
          </div>
        </main>
      </>
    );
  }
}