// app/dashboard/student/page.tsx
import { getStudentDashboardData } from '@/lib/actions/studentDashboard.actions';
import StudentDashboardHeader from '@/components/studentDashboardHeader';
import { FiBook, FiPieChart, FiBell } from 'react-icons/fi';
import Card from '@/components/studentDashboard/card';
import NextClassCard from '@/components/studentDashboard/next-class-card';
import NotificationCard from '@/components/studentDashboard/notification-card';
import FinancialSummaryCard from '@/components/studentDashboard/financial-summary-card';
import QuickActions from '@/components/studentDashboard/quick-actions';
import WelcomeBanner from '@/components/studentDashboard/welcome-banner';
import ErrorMessage from '@/components/ui/error-message';
import Footer from '@/components/footer';

export default async function StudentDashboard() {
  try {
    const data = await getStudentDashboardData();

    return (
      <>
        <StudentDashboardHeader />

        <main className="md:pl-64 pt-2 h-[calc(100vh-4rem)] overflow-y-auto bg-emerald-800 text-white">
          <div className="p-6 space-y-6 max-w-7xl mx-auto">
            <WelcomeBanner
              firstName={data.student.firstName}
              program={data.student.program}
              currentSemester={data.student.currentSemester}
              registrationNumber={data.student.registrationNumber}
              studentNumber={data.student.studentNumber}
              passportPhotoUrl={data.student.passportPhotoUrl}
              cgpa={data.student.cgpa}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-6">
                <Card
                  title="Courses Enrolled"
                  value={data.academic.enrolledCourses.toString()}
                  icon={<FiBook className="w-5 h-5" />}
                  link="/dashboard/student/courses"
                  linkText="View Courses"
                />

                <Card
                  title="Current GPA"
                  value={data.academic.currentGPA.toFixed(2)}
                  icon={<FiPieChart className="w-5 h-5" />}
                  link="/dashboard/student/grades"
                  linkText="View Grades"
                />
              </div>

              <div className="md:col-span-2">
                {data.academic.nextClass ? (
                  <NextClassCard
                    courseCode={data.academic.nextClass.courseCode}
                    courseName={data.academic.nextClass.courseName}
                    day={data.academic.nextClass.day}
                    startTime={data.academic.nextClass.startTime}
                    endTime={data.academic.nextClass.endTime}
                    room={data.academic.nextClass.room}
                    lecturer={data.academic.nextClass.lecturer}
                  />
                ) : (
                  <div className="bg-white rounded-lg shadow p-6 h-full flex items-center justify-center">
                    <p className="text-gray-500">No upcoming classes</p>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <FinancialSummaryCard
                  totalBalance={data.financial.totalBalance}
                  nextPaymentDue={data.financial.nextPaymentDue}
                  latestPayment={data.financial.latestPayment}
                />
              </div>

              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <FiBell className="text-emerald-600" /> Notifications
                    </h3>
                    <a
                      href="/dashboard/student/notifications"
                      className="text-sm text-emerald-600 hover:underline"
                    >
                      View All
                    </a>
                  </div>

                  {data.notifications.length > 0 ? (
                    <div className="space-y-4">
                      {data.notifications.slice(0, 3).map(notification => (
                        <NotificationCard
                          key={notification.id}
                          title={notification.action}
                          description={notification.description}
                          timestamp={notification.timestamp}
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">No recent notifications</p>
                  )}
                </div>
              </div>
            </div>

            <QuickActions />
            <Footer />
          </div>
        </main>
      </>
    );
  } catch (error) {
    console.error('Error rendering StudentDashboard:', error);
    return (
      <>
        <StudentDashboardHeader />
        <main className="md:pl-64 pt-16 h-[calc(100vh-4rem)] overflow-y-auto bg-emerald-800 text-white">
          <div className="p-6 max-w-7xl mx-auto">
            <ErrorMessage
              title="Failed to load dashboard"
              message="There was an error loading your dashboard data. Please try again later. If the problem persists, please contact support."
            />
            <Footer />
          </div>
        </main>
      </>
    );
  }
}
