'use client';

import { useEffect, useState } from 'react';
import { getLecturerDashboardData, getCourseDetails } from '@/lib/actions/lecturer/dashboard.actions';
import { format, parseISO } from 'date-fns';
import { 
  FiBook, FiUsers, FiFileText, FiClock, FiAlertCircle, FiCalendar, 
  FiAward, FiBarChart2, FiBookOpen, FiCheckCircle, FiAlertTriangle
} from 'react-icons/fi';
import { toast } from 'sonner';
import Link from 'next/link';

export default function LecturerDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [courseDetails, setCourseDetails] = useState<any>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await getLecturerDashboardData();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const fetchCourseDetails = async (courseId: number) => {
    try {
      setDetailsLoading(true);
      setSelectedCourseId(courseId);
      const details = await getCourseDetails(courseId);
      setCourseDetails(details);
    } catch (err) {
      console.log(err)
      toast.error('Failed to load course details');
    } finally {
      setDetailsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center p-6 bg-white rounded-lg shadow">
          <FiAlertCircle className="mx-auto h-12 w-12 text-pink-500" />
          <h3 className="mt-2 text-lg font-medium text-gray-900">Error loading dashboard</h3>
          <p className="mt-1 text-sm text-gray-500">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  // Custom Card Component
  const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {children}
    </div>
  );

  const CardHeader = ({ children }: { children: React.ReactNode }) => (
    <div className="border-b border-gray-200 px-6 py-4 flex items-center">
      <h3 className="font-semibold text-gray-800">{children}</h3>
    </div>
  );

  const CardContent = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
    <div className={`p-6 ${className}`}>{children}</div>
  );

  const CardFooter = ({ children }: { children: React.ReactNode }) => (
    <div className="border-t border-gray-200 px-6 py-4 flex justify-center">
      {children}
    </div>
  );

  // Custom Badge Component
  const Badge = ({ 
    children, 
    variant = 'default',
    className = ''
  }: { 
    children: React.ReactNode; 
    variant?: 'default' | 'destructive' | 'outline' | 'success';
    className?: string;
  }) => {
    const baseClasses = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium';
    const variantClasses = {
      default: 'bg-gray-100 text-gray-800',
      destructive: 'bg-red-100 text-red-800',
      outline: 'border border-gray-200 bg-transparent',
      success: 'bg-emerald-100 text-emerald-800'
    };

    return (
      <span className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
        {children}
      </span>
    );
  };

  // Custom Table Components
  const Table = ({ children }: { children: React.ReactNode }) => (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">{children}</table>
    </div>
  );

  const TableHeader = ({ children }: { children: React.ReactNode }) => (
    <thead className="bg-gray-50">{children}</thead>
  );

  const TableRow = ({ children }: { children: React.ReactNode }) => (
    <tr>{children}</tr>
  );

  const TableHead = ({ children }: { children: React.ReactNode }) => (
    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
      {children}
    </th>
  );

  const TableBody = ({ children }: { children: React.ReactNode }) => (
    <tbody className="bg-white divide-y divide-gray-200">{children}</tbody>
  );

  const TableCell = ({ 
    children, 
    className = '' 
  }: { 
    children: React.ReactNode; 
    className?: string;
  }) => (
    <td className={`px-6 py-4 whitespace-nowrap ${className}`}>
      {children}
    </td>
  );

  // Status Indicator for Submissions
  const StatusIndicator = ({ status }: { status: 'submitted' | 'graded' | 'late' }) => {
    const statusConfig = {
      submitted: {
        icon: <FiClock className="h-4 w-4 text-blue-500" />,
        text: 'Submitted',
        color: 'text-blue-500'
      },
      graded: {
        icon: <FiCheckCircle className="h-4 w-4 text-emerald-500" />,
        text: 'Graded',
        color: 'text-emerald-500'
      },
      late: {
        icon: <FiAlertTriangle className="h-4 w-4 text-pink-500" />,
        text: 'Late',
        color: 'text-pink-500'
      }
    };

    return (
      <div className={`flex items-center ${statusConfig[status].color}`}>
        {statusConfig[status].icon}
        <span className="ml-1">{statusConfig[status].text}</span>
      </div>
    );
  };

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Lecturer Dashboard</h1>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-600">
            Welcome, <span className="font-semibold text-emerald-600">{data.lecturer.name}</span>
          </span>
          <Badge className="bg-emerald-100 text-emerald-600">
            {data.lecturer.department} • {data.lecturer.position}
          </Badge>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <div className="flex flex-row items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Courses</p>
              <p className="text-2xl font-bold">{data.statistics.totalCourses}</p>
              <p className="text-xs text-gray-500">{data.currentSemester}</p>
            </div>
            <div className="p-3 rounded-full bg-blue-100 text-blue-500">
              <FiBook className="h-6 w-6" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex flex-row items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Students</p>
              <p className="text-2xl font-bold">{data.statistics.totalStudents}</p>
              <p className="text-xs text-gray-500">
                Across all courses
              </p>
            </div>
            <div className="p-3 rounded-full bg-purple-100 text-purple-500">
              <FiUsers className="h-6 w-6" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex flex-row items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Teaching Materials</p>
              <p className="text-2xl font-bold">{data.statistics.totalMaterials}</p>
              <p className="text-xs text-gray-500">
                Uploaded resources
              </p>
            </div>
            <div className="p-3 rounded-full bg-amber-100 text-amber-500">
              <FiFileText className="h-6 w-6" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex flex-row items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Assessments</p>
              <p className="text-2xl font-bold">{data.statistics.totalAssignments + data.statistics.totalQuizzes}</p>
              <p className="text-xs text-gray-500">
                {data.statistics.totalAssignments} assignments • {data.statistics.totalQuizzes} quizzes
              </p>
            </div>
            <div className="p-3 rounded-full bg-emerald-100 text-emerald-500">
              <FiAward className="h-6 w-6" />
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Left Column */}
        <div className="space-y-4 lg:col-span-2">
          {/* Course Summaries */}
          <Card>
            <CardHeader>Your Courses</CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.courseSummaries.map((course: any) => (
                  <div 
                    key={course.id} 
                    className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${selectedCourseId === course.id ? 'border-emerald-300 bg-emerald-50' : 'border-gray-200'}`}
                    onClick={() => fetchCourseDetails(course.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-gray-900">{course.name}</h3>
                        <p className="text-sm text-gray-500">
                          {course.code} • {course.programName} • {course.semesterName}
                        </p>
                      </div>
                      <Badge variant="outline" className="border-gray-200">
                        {course.studentCount} students
                      </Badge>
                    </div>
                    <div className="mt-3 flex space-x-2 text-xs">
                      <Badge variant="outline" className="flex items-center">
                        <FiFileText className="mr-1 h-3 w-3" />
                        {course.materialsCount} materials
                      </Badge>
                      <Badge variant="outline" className="flex items-center">
                        <FiAward className="mr-1 h-3 w-3" />
                        {course.assignmentsCount} assignments
                      </Badge>
                      <Badge variant="outline" className="flex items-center">
                        <FiBarChart2 className="mr-1 h-3 w-3" />
                        {course.quizzesCount} quizzes
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Classes */}
          <Card>
            <CardHeader>Upcoming Classes</CardHeader>
            <CardContent>
              {data.upcomingClasses.length > 0 ? (
                <div className="space-y-4">
                  {data.upcomingClasses.map((classItem: any) => (
                    <div key={classItem.id} className="flex items-start p-3 border border-gray-100 rounded-lg">
                      <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg mr-3">
                        <FiCalendar className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{classItem.courseName}</h4>
                        <p className="text-sm text-gray-500">
                          {classItem.dayOfWeek}, {classItem.startTime} - {classItem.endTime}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">Room: {classItem.room}</p>
                      </div>
                      <button className="text-sm text-emerald-600 hover:text-emerald-700">
                        Details
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <FiCalendar className="mx-auto h-8 w-8 text-gray-300" />
                  <p className="mt-2">No upcoming classes scheduled</p>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Link href="/lecturer/timetable" className="text-sm text-emerald-600 hover:text-emerald-700">
                View Full Timetable
              </Link>
            </CardFooter>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          {/* Recent Submissions */}
          <Card>
            <CardHeader>Recent Submissions</CardHeader>
            <CardContent>
              {data.recentSubmissions.length > 0 ? (
                <div className="space-y-4">
                  {data.recentSubmissions.map((submission: any) => (
                    <div key={submission.id} className="flex items-start p-3 border border-gray-100 rounded-lg">
                      <div className={`p-2 rounded-lg mr-3 ${
                        submission.type === 'assignment' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'
                      }`}>
                        {submission.type === 'assignment' ? (
                          <FiFileText className="h-5 w-5" />
                        ) : (
                          <FiBarChart2 className="h-5 w-5" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{submission.title}</h4>
                        <p className="text-sm text-gray-500">{submission.studentName}</p>
                        <div className="mt-1 flex items-center justify-between">
                          <StatusIndicator status={submission.status} />
                          <span className="text-xs text-gray-400">
                            {format(submission.submittedAt, 'MMM d, h:mm a')}
                          </span>
                        </div>
                        {submission.grade !== undefined && (
                          <div className="mt-1 text-xs font-medium">
                            Grade: <span className="text-emerald-600">{submission.grade}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <FiBookOpen className="mx-auto h-8 w-8 text-gray-300" />
                  <p className="mt-2">No recent submissions</p>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Link href="/lecturer/submissions" className="text-sm text-emerald-600 hover:text-emerald-700">
                View All Submissions
              </Link>
            </CardFooter>
          </Card>

          {/* Student Performance */}
          <Card>
            <CardHeader>Top Performing Students</CardHeader>
            <CardContent>
              {data.studentPerformance.length > 0 ? (
                <div className="space-y-3">
                  {data.studentPerformance.slice(0, 5).map((student: any) => (
                    <div key={student.studentId} className="flex items-center justify-between p-2">
                      <div>
                        <p className="font-medium">{student.studentName}</p>
                        <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                          <div 
                            className="bg-emerald-500 h-1.5 rounded-full" 
                            style={{ width: `${(student.avgScore / 100) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-emerald-600">{student.avgScore.toFixed(1)}%</p>
                        <p className="text-xs text-gray-500">
                          {student.assignmentsCompleted}/{student.assignmentsTotal} assignments
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <FiUsers className="mx-auto h-8 w-8 text-gray-300" />
                  <p className="mt-2">No performance data available</p>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Link href="/lecturer/performance" className="text-sm text-emerald-600 hover:text-emerald-700">
                View Full Performance
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>

      {/* Course Details Modal */}
      {selectedCourseId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">
                {detailsLoading ? 'Loading...' : courseDetails?.course.name || 'Course Details'}
              </h3>
              <button 
                onClick={() => setSelectedCourseId(null)}
                className="text-gray-400 hover:text-gray-500"
              >
                <span className="sr-only">Close</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {detailsLoading ? (
              <div className="p-8 flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500"></div>
              </div>
            ) : courseDetails ? (
              <div className="p-6 space-y-6">
                {/* Course Info */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h4 className="font-medium text-gray-900">Course Information</h4>
                    <div className="mt-2 space-y-1 text-sm text-gray-600">
                      <p><span className="font-medium">Code:</span> {courseDetails.course.code}</p>
                      <p><span className="font-medium">Credits:</span> {courseDetails.course.credits}</p>
                      <p><span className="font-medium">Program:</span> {courseDetails.course.programName}</p>
                      <p><span className="font-medium">Semester:</span> {courseDetails.course.semesterName}</p>
                      <p><span className="font-medium">Dates:</span> {format(parseISO(courseDetails.course.semesterDates.start), 'MMM d, yyyy')} - {format(parseISO(courseDetails.course.semesterDates.end), 'MMM d, yyyy')}</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Description</h4>
                    <p className="mt-2 text-sm text-gray-600">
                      {courseDetails.course.description || 'No description provided.'}
                    </p>
                  </div>
                </div>

                {/* Statistics */}
                <div className="grid gap-4 md:grid-cols-4">
                  <div className="p-3 border border-gray-200 rounded-lg text-center">
                    <p className="text-sm font-medium text-gray-500">Students</p>
                    <p className="text-2xl font-bold">{courseDetails.students.length}</p>
                  </div>
                  <div className="p-3 border border-gray-200 rounded-lg text-center">
                    <p className="text-sm font-medium text-gray-500">Assignments</p>
                    <p className="text-2xl font-bold">{courseDetails.assignments.length}</p>
                  </div>
                  <div className="p-3 border border-gray-200 rounded-lg text-center">
                    <p className="text-sm font-medium text-gray-500">Quizzes</p>
                    <p className="text-2xl font-bold">{courseDetails.quizzes.length}</p>
                  </div>
                  <div className="p-3 border border-gray-200 rounded-lg text-center">
                    <p className="text-sm font-medium text-gray-500">Materials</p>
                    <p className="text-2xl font-bold">{courseDetails.materials.length}</p>
                  </div>
                </div>

                {/* Tabs */}
                <div className="border-b border-gray-200">
                  <nav className="-mb-px flex space-x-8">
                    <button className="border-b-2 border-emerald-500 text-emerald-600 px-1 py-2 text-sm font-medium">
                      Students
                    </button>
                    <button className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 px-1 py-2 text-sm font-medium">
                      Assignments
                    </button>
                    <button className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 px-1 py-2 text-sm font-medium">
                      Quizzes
                    </button>
                    <button className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 px-1 py-2 text-sm font-medium">
                      Materials
                    </button>
                  </nav>
                </div>

                {/* Students Table */}
                <div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Reg No.</TableHead>
                        <TableHead>CAT</TableHead>
                        <TableHead>Exam</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Grade</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {courseDetails.students.map((student: any) => (
                        <TableRow key={student.id}>
                          <TableCell className="font-medium">{student.name}</TableCell>
                          <TableCell>{student.registrationNumber}</TableCell>
                          <TableCell>{student.catScore ?? '-'}</TableCell>
                          <TableCell>{student.examScore ?? '-'}</TableCell>
                          <TableCell>{student.totalScore ?? '-'}</TableCell>
                          <TableCell>
                            {student.letterGrade ? (
                              <Badge variant={student.letterGrade === 'F' ? 'destructive' : 'success'}>
                                {student.letterGrade} ({student.gpa?.toFixed(1)})
                              </Badge>
                            ) : (
                              '-'
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">
                <FiAlertCircle className="mx-auto h-8 w-8 text-gray-400" />
                <p className="mt-2">Failed to load course details</p>
              </div>
            )}

            <div className="border-t border-gray-200 px-6 py-4 flex justify-end">
              <button
                onClick={() => setSelectedCourseId(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-md transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}