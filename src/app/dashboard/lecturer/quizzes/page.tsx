import { getLecturerQuizzes } from '@/lib/actions/lecturer.manage.quizzes.action';
import LecturerQuizzesManager from '@/components/lecturer/lecturer.manage.quizzes';
import ErrorMessage from '@/components/ui/error-message';

export default async function LecturerQuizzesPage() {
  try {
    // Fetch initial quizzes data from the server
    const initialQuizzes = await getLecturerQuizzes();

    return (
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Welcome Banner */}
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-800">Quizzes Manager</h1>
          <p className="text-gray-600">Create and manage your course quizzes</p>
        </div>

        {/* Main Quizzes Content */}
        <div className="bg-white rounded-lg shadow p-6">
          {/* Pass the initial data to the client component */}
          <LecturerQuizzesManager initialQuizzes={initialQuizzes} />
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error rendering LecturerQuizzesPage:', error);
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <ErrorMessage
          title="Failed to load quizzes"
          message="There was an error loading your quizzes. Please try again later."
        />
      </div>
    );
  }
}
