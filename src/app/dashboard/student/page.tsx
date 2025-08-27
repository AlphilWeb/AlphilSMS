// app/dashboard/student/page.tsx
import { getStudentDashboardData } from '@/lib/actions/studentDashboard.actions';
import StudentDashboardHeader from '@/components/studentDashboardHeader';
import { FiBook, FiPieChart, FiMail, FiHash, FiAward, FiCalendar, FiDollarSign, FiCreditCard } from 'react-icons/fi';
import Card from '@/components/studentDashboard/card';
import NextClassCard from '@/components/studentDashboard/next-class-card';
// import NotificationCard from '@/components/studentDashboard/notification-card';
import QuickActions from '@/components/studentDashboard/quick-actions';
import WelcomeBanner from '@/components/studentDashboard/welcome-banner';
import ErrorMessage from '@/components/ui/error-message';
import Footer from '@/components/footer';

// New Financial Card Component
function FinancialCard({ title, value, icon, trend, trendValue }: { 
  title: string; 
  value: string; 
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
}) {
  const trendColors = {
    up: 'text-green-300',
    down: 'text-red-300',
    neutral: 'text-gray-300'
  };
  
  const trendIcons = {
    up: '↗',
    down: '↘',
    neutral: '→'
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <div className="flex justify-between items-start mb-4">
        <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
          {icon}
        </div>
        {trend && (
          <span className={`text-sm font-medium ${trendColors[trend]}`}>
            {trendValue} {trendIcons[trend]}
          </span>
        )}
      </div>
      <h3 className="text-sm font-medium text-gray-500 mb-1">{title}</h3>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

export default async function StudentDashboard() {
  try {
    const data = await getStudentDashboardData();

    // Format currency values without dollar signs
    const formatCurrency = (amount: number) => {
      return amount.toLocaleString('en-US');
    };

    return (
      <>
        <StudentDashboardHeader />

        <main className="md:pl-64 pt-2 h-[calc(100vh-4rem)] overflow-y-auto bg-emerald-800">
          <div className="p-6 space-y-6 max-w-7xl mx-auto">
            {/* Welcome Banner - Full Width */}
            <WelcomeBanner
              firstName={data.student.firstName}
              program={data.student.program}
              currentSemester={data.student.currentSemester}
              registrationNumber={data.student.registrationNumber}
              studentNumber={data.student.studentNumber}
              passportPhotoUrl={`/${data.student.passportPhotoUrl}`}
              cgpa={data.student.cgpa}
            />

            {/* Financial Summary Cards - 3 in a row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FinancialCard
                title="Total Billed"
                value={formatCurrency(data.financial.totalBilled)}
                icon={<FiCreditCard className="w-5 h-5" />}
                trend="up"
                trendValue="+2.5%"
              />
              <FinancialCard
                title="Total Paid"
                value={formatCurrency(data.financial.totalPaid)}
                icon={<FiDollarSign className="w-5 h-5" />}
                trend="up"
                trendValue="+5.1%"
              />
              <FinancialCard
                title="Balance"
                value={formatCurrency(data.financial.totalBalance)}
                icon={<FiDollarSign className="w-5 h-5" />}
                trend={data.financial.totalBalance > 0 ? "down" : "neutral"}
                trendValue={data.financial.totalBalance > 0 ? "Pending" : "Cleared"}
              />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Academic Info */}
              <div className="lg:col-span-2 space-y-6">
                {/* Personal Info Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card
                    title="Email"
                    value={data.student.email}
                    icon={<FiMail className="w-5 h-5" />}
                    link={`/dashboard/student/profile`}
                    linkText="View Profile"
                    //variant="compact"
                  />
                  
                  <Card
                    title="ID Number"
                    value={data.student.idNumber || 'Not provided'}
                    icon={<FiHash className="w-5 h-5" />}
                    link={`/dashboard/student/profile`}
                    linkText="View Profile"
                    //variant="compact"
                  />
                  
                  <Card
                    title="Registration Number"
                    value={data.student.registrationNumber}
                    icon={<FiHash className="w-5 h-5" />}
                    link={`/dashboard/student/profile`}
                    linkText="View Profile"
                    //variant="compact"
                  />
                  
                  <Card
                    title="Student Number"
                    value={data.student.studentNumber}
                    icon={<FiHash className="w-5 h-5" />}
                    link={`/dashboard/student/profile`}
                    linkText="View Profile"
                    //variant="compact"
                  />
                </div>

                {/* Academic Performance Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

                {/* Recent Grades Card */}
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <FiAward className="text-emerald-600" /> Recent Grades
                    </h3>
                    <a
                      href="/dashboard/student/grades"
                      className="text-sm text-emerald-600 hover:underline font-medium"
                    >
                      View All
                    </a>
                  </div>
                  
                  {data.academic.recentGrades && data.academic.recentGrades.length > 0 ? (
                    <div className="space-y-4">
                      {data.academic.recentGrades.slice(0, 4).map((grade, index) => (
                        <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                          <div>
                            <span className="text-sm font-medium text-gray-900 block">{grade.courseCode}</span>
                            <span className="text-xs text-gray-500">{grade.courseName}</span>
                          </div>
                          <span className={`font-semibold px-3 py-1 rounded-full text-xs ${
                            grade.gradeValue >= 70 ? 'bg-green-100 text-green-800' :
                            grade.gradeValue >= 60 ? 'bg-blue-100 text-blue-800' :
                            grade.gradeValue >= 50 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {grade.gradeValue}%
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm py-4 text-center">No recent grades available</p>
                  )}
                </div>
              </div>

              {/* Right Column - Schedule & Notifications */}
              <div className="space-y-6">
                {/* Next Class Card */}
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
                  <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 h-full flex items-center justify-center">
                    <div className="text-center">
                      <FiCalendar className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-500">No upcoming classes</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Full Width Components */}
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
        <main className="md:pl-64 pt-16 h-[calc(100vh-4rem)] overflow-y-auto bg-emerald-800">
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
    // );
  }
}