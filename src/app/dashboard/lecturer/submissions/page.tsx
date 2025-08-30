// app/dashboard/lecturer/submissions/page.tsx
import { getLecturerSubmissions, getSubmissionStatistics } from '@/lib/actions/lecturer.assignment.submissions.action';
import ErrorMessage from '@/components/ui/error-message';
import LecturerSubmissionsManager from '@/components/lecturer/lecturer.manage.assignment.submissions';


export default async function LecturerSubmissionsPage() {
  try {
    // Fetch initial submissions and statistics data from the server
    const [initialSubmissions, initialStatistics] = await Promise.all([
      getLecturerSubmissions(),
      getSubmissionStatistics()
    ]);

    return (
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Welcome Banner */}
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-800">Submissions Manager</h1>
          <p className="text-gray-600">View and grade student submissions</p>
        </div>

        {/* Main Submissions Content */}
        <div className="bg-white rounded-lg shadow p-6">
          {/* Pass the initial data to the client component */}
          <LecturerSubmissionsManager 
            initialSubmissions={initialSubmissions} 
            initialStatistics={initialStatistics}
          />
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error rendering LecturerSubmissionsPage:', error);
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <ErrorMessage
          title="Failed to load submissions"
          message="There was an error loading student submissions. Please try again later."
        />
      </div>
    );
  }
}