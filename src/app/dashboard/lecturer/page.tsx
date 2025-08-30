import { getLecturerDashboardData } from '@/lib/actions/lecturer/dashboard.actions';
import { FiBook, FiUsers, FiFileText, FiAward, FiBarChart2 } from 'react-icons/fi';
import Card from '@/components/lecturer/card';
import RecentSubmissionsCard from '@/components/lecturer/recent-submissions-card';
import UpcomingClassesCard from '@/components/lecturer/upcoming-classes-card';
import CourseSummaryCard from '@/components/lecturer/course-summary-card';
import WelcomeBanner from '@/components/lecturer/welcome-banner';
import ErrorMessage from '@/components/ui/error-message';

export default async function LecturerDashboard() {
  try {
    const data = await getLecturerDashboardData();

    // Defensive helpers
    const firstName =
      typeof data.lecturer.name === 'string' && data.lecturer.name.length > 0
        ? data.lecturer.name.split(' ')[0]
        : 'Lecturer';

    // Format data for cards
    const formattedSubmissions = data.recentSubmissions.map(submission => ({
      ...submission,
      id: String(submission.id),
      submittedAt: new Date(submission.submittedAt).toISOString()
    }));

    return (
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        <WelcomeBanner
          firstName={firstName}
          position={data.lecturer.position}
          department={data.lecturer.department}
          avatarUrl={'/default-avatar.jpg'}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-6">
            <Card
              title="Total Courses"
              value={data.statistics.totalCourses.toString()}
              icon={<FiBook className="w-5 h-5" />}
              link="/dashboard/lecturer/courses"
              linkText="View All"
            />

            <Card
              title="Total Students"
              value={data.statistics.totalStudents.toString()}
              icon={<FiUsers className="w-5 h-5" />}
              link="/dashboard/lecturer/students"
              linkText="Manage Students"
            />
          </div>

          <div className="md:col-span-2">
            <RecentSubmissionsCard
              submissions={formattedSubmissions}
              totalCount={data.recentSubmissions.length}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <UpcomingClassesCard
              classes={data.upcomingClasses}
              currentSemester={data.currentSemester}
            />
          </div>

          <div className="space-y-6">
            <Card
              title="Teaching Materials"
              value={data.statistics.totalMaterials.toString()}
              icon={<FiFileText className="w-5 h-5" />}
              link="/dashboard/lecturer/materials"
              linkText="Manage Materials"
            />

            <Card
              title="Assessments"
              value={(data.statistics.totalAssignments + data.statistics.totalQuizzes).toString()}
              icon={<FiAward className="w-5 h-5" />}
              link="/dashboard/lecturer/quizzes"
              linkText="View All"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <CourseSummaryCard
            courses={data.courseSummaries}
            currentSemester={data.currentSemester}
          />

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-900">
                <FiBarChart2 className="text-pink-500" /> Quick Stats
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-pink-50 rounded-lg">
                <p className="text-sm text-gray-500">Assignments</p>
                <p className="text-xl font-bold text-gray-900">{data.statistics.totalAssignments}</p>
              </div>
              <div className="p-3 bg-pink-50 rounded-lg">
                <p className="text-sm text-gray-500">Quizzes</p>
                <p className="text-xl font-bold text-gray-900">{data.statistics.totalQuizzes}</p>
              </div>
              <div className="p-3 bg-pink-50 rounded-lg">
                <p className="text-sm text-gray-500">Materials</p>
                <p className="text-xl font-bold text-gray-900">{data.statistics.totalMaterials}</p>
              </div>
              <div className="p-3 bg-pink-50 rounded-lg">
                <p className="text-sm text-gray-500">Avg. Performance</p>
                <p className="text-xl font-bold text-gray-900">
                  {data.studentPerformance.length > 0
                    ? `${Math.round(data.studentPerformance.reduce((sum, student) => sum + student.avgScore, 0) / data.studentPerformance.length)}%`
                    : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error rendering LecturerDashboard:', error);
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <ErrorMessage
          title="Failed to load dashboard"
          message="There was an error loading the lecturer dashboard data. Please try again later. If the problem persists, please contact support."
        />
      </div>
    );
  }
}
