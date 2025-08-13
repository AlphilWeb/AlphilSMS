// app/dashboard/lecturer/submissions/page.tsx
import { getLecturerSubmissions, getSubmissionStatistics } from '@/lib/actions/lecturer.assignment.submissions.action';
import LecturerDashboardHeader from '@/components/lecturerDashboardHeader';
import ErrorMessage from '@/components/ui/error-message';
import LecturerSubmissionsManager from '@/components/lecturer/lecturer.manage.assignment.submissions';

// Define the types directly in this file
interface Student {
  id: number;
  firstName: string;
  lastName: string;
  registrationNumber: string;
}

interface Course {
  id: number;
  name: string;
  code: string;
}

interface Assignment {
  id: number;
  title: string;
  dueDate: Date;
  course: Course;
}

interface Submission {
  id: number;
  submittedAt: Date;
  grade: number | null;
  remarks: string | null;
  student: Student;
  assignment: Assignment;
}

interface CourseSubmissionsOverview {
  courseId: number;
  courseName: string;
  courseCode: string;
  totalAssignments: number;
  submissionsGraded: number;
  submissionsPending: number;
  submissionsLate: number;
}

export default async function LecturerSubmissionsPage() {
  try {
    // Fetch initial submissions and statistics data from the server
    const [initialSubmissions, initialStatistics] = await Promise.all([
      getLecturerSubmissions(),
      getSubmissionStatistics()
    ]);

    return (
      <>
        <LecturerDashboardHeader />
        
        <main className="md:pl-64 pt-2 h-[calc(100vh-4rem)] overflow-y-auto bg-emerald-800 text-white">
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
        </main>
      </>
    );
  } catch (error) {
    console.error('Error rendering LecturerSubmissionsPage:', error);
    return (
      <>
        <LecturerDashboardHeader />
        <main className="md:pl-64 pt-16 h-[calc(100vh-4rem)] overflow-y-auto bg-emerald-800 text-white">
          <div className="p-6 max-w-7xl mx-auto">
            <ErrorMessage
              title="Failed to load submissions"
              message="There was an error loading student submissions. Please try again later."
            />
          </div>
        </main>
      </>
    );
  }
}