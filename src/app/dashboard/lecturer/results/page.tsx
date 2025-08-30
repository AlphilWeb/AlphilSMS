// app/dashboard/lecturer/results/page.tsx
import { getLecturerCourses } from '@/lib/actions/lecturer.manage.results.action';
import LecturerResultsManager from '@/components/lecturer/lecturer.manage.results';
import ErrorMessage from '@/components/ui/error-message';

export default async function LecturerResultsPage() {
  try {
    // Fetch the lecturer's courses on the server
    const initialCourses = await getLecturerCourses();

    return (
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Welcome Banner */}
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-800">Results Management</h1>
          <p className="text-gray-600">View and analyze student performance across your courses</p>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow p-6">
          <LecturerResultsManager 
            initialCourses={initialCourses} 
            initialResults={[]} // Empty initially, will load when course is selected
          />
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error rendering LecturerResultsPage:', error);
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <ErrorMessage
          title="Failed to load results"
          message="There was an error loading course information. Please try again later."
        />
      </div>
    );
  }
}