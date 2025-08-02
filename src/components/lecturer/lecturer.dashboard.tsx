'use client';

import { useEffect, useState } from 'react';
import { FiBook, FiUsers, FiAlertCircle, FiClock, FiUser, FiTrendingUp, FiFileText, FiEdit, FiEye } from 'react-icons/fi';
import Link from 'next/link';
import { format } from 'date-fns';
import { getLecturerDashboardData } from '@/lib/actions/lecturer.dashboard.action';

interface DashboardData {
  stats: {
    totalCourses: number;
    totalStudents: number;
    pendingGrades: number;
    totalAssignmentSubmissions: number;
    totalQuizSubmissions: number;
    totalMaterialViews: number;
  };
  currentSemester: {
    name: string;
    startDate: string;
    endDate: string;
  };
  recentEnrollments: Array<{
    studentName: string;
    regNumber: string;
    course: string;
    date: string | null;
  }>;
  pendingGrades: Array<{
    studentName: string;
    regNumber: string;
    course: string;
    assignment: string;
  }>;
  recentActivity: Array<{
    action: string;
    description: string;
    timestamp: string;
  }>;
}

export default function LecturerDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await getLecturerDashboardData();
        setData(result);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
          <p className="font-medium">Error loading dashboard</p>
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">No dashboard data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-800">Lecturer Dashboard</h1>
        <p className="text-gray-600">Welcome back! Here&apos;s your teaching overview.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
        <StatCard 
          icon={<FiBook className="h-5 w-5 text-blue-600" />}
          title="Courses"
          value={data.stats.totalCourses}
          color="blue"
        />
        <StatCard 
          icon={<FiUsers className="h-5 w-5 text-green-600" />}
          title="Students"
          value={data.stats.totalStudents}
          color="green"
        />
        <StatCard 
          icon={<FiAlertCircle className="h-5 w-5 text-yellow-600" />}
          title="Pending Grades"
          value={data.stats.pendingGrades}
          color="yellow"
        />
        <StatCard 
          icon={<FiFileText className="h-5 w-5 text-indigo-600" />}
          title="Assignments"
          value={data.stats.totalAssignmentSubmissions}
          color="indigo"
        />
        <StatCard 
          icon={<FiEdit className="h-5 w-5 text-purple-600" />}
          title="Quizzes"
          value={data.stats.totalQuizSubmissions}
          color="purple"
        />
        <StatCard 
          icon={<FiEye className="h-5 w-5 text-teal-600" />}
          title="Material Views"
          value={data.stats.totalMaterialViews}
          color="teal"
        />
      </div>

      {/* Current Semester */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Current Semester</h3>
        <p className="text-gray-800">{data.currentSemester.name}</p>
        <p className="text-sm text-gray-500">
          {format(new Date(data.currentSemester.startDate), 'MMM d, yyyy')} -{' '}
          {format(new Date(data.currentSemester.endDate), 'MMM d, yyyy')}
        </p>
        <div className="mt-2 flex items-center text-sm text-green-500">
          <FiTrendingUp className="h-4 w-4 mr-1" />
          <span>Currently Active</span>
        </div>
      </div>

      {/* Recent Enrollments */}
      <DashboardSection 
        title="Recent Enrollments"
        viewAllLink="/dashboard/lecturer/enrollments"
        items={data.recentEnrollments}
        emptyMessage="No recent enrollments"
        renderItem={(enrollment) => (
          <>
            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
              <FiUser className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{enrollment.studentName}</p>
              <p className="text-sm text-gray-500 truncate">{enrollment.regNumber}</p>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-900">{enrollment.course}</p>
              <p className="text-xs text-gray-500">
                {enrollment.date ? format(new Date(enrollment.date), 'MMM d, yyyy') : 'N/A'}
              </p>
            </div>
          </>
        )}
      />

      {/* Pending Grades */}
      <DashboardSection 
        title="Pending Grades"
        viewAllLink="/dashboard/lecturer/grades"
        items={data.pendingGrades}
        emptyMessage="No pending grades - you're all caught up!"
        renderItem={(grade) => (
          <>
            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center mr-3">
              <FiAlertCircle className="h-5 w-5 text-yellow-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{grade.studentName}</p>
              <p className="text-sm text-gray-500 truncate">{grade.regNumber}</p>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-900">{grade.course}</p>
              <p className="text-xs text-gray-500">{grade.assignment}</p>
            </div>
          </>
        )}
      />

      {/* Recent Activity */}
      <DashboardSection 
        title="Recent Activity"
        items={data.recentActivity}
        emptyMessage="No recent activity"
        renderItem={(activity) => (
          <>
            <div className="flex-shrink-0 mt-1">
              <FiClock className="h-5 w-5 text-gray-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">{activity.action}</p>
              <p className="text-sm text-gray-500">{activity.description}</p>
              <p className="text-xs text-gray-400 mt-1">
                {format(new Date(activity.timestamp), 'MMM d, yyyy h:mm a')}
              </p>
            </div>
          </>
        )}
      />
    </div>
  );
}

// Reusable Stat Card Component
function StatCard({ icon, title, value, color }: {
  icon: React.ReactNode;
  title: string;
  value: number;
  color: string;
}) {
  const bgColor = {
    blue: 'bg-blue-50',
    green: 'bg-green-50',
    yellow: 'bg-yellow-50',
    indigo: 'bg-indigo-50',
    purple: 'bg-purple-50',
    teal: 'bg-teal-50',
  }[color];

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-xl font-semibold text-gray-900">{value}</p>
        </div>
        <div className={`p-2 rounded-full ${bgColor}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

// Reusable Dashboard Section Component
function DashboardSection<T>({
  title,
  viewAllLink,
  items,
  emptyMessage,
  renderItem,
}: {
  title: string;
  viewAllLink?: string;
  items: T[];
  emptyMessage: string;
  renderItem: (item: T) => React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {viewAllLink && (
          <Link href={viewAllLink} className="text-sm text-blue-600 hover:text-blue-800">
            View All
          </Link>
        )}
      </div>

      {items.length > 0 ? (
        <div className="space-y-4">
          {items.map((item, index) => (
            <div key={index} className="flex items-center p-3 border rounded-lg">
              {renderItem(item)}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-center py-4">{emptyMessage}</p>
      )}
    </div>
  );
}

// Loading Skeleton
function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Welcome Banner Skeleton */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mb-2"></div>
        <div className="h-4 w-80 bg-gray-200 rounded animate-pulse"></div>
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="h-4 w-20 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="h-6 w-12 bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="h-10 w-10 bg-gray-200 rounded-full animate-pulse"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Current Semester Skeleton */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-4"></div>
        <div className="h-4 w-64 bg-gray-200 rounded animate-pulse mb-2"></div>
        <div className="h-4 w-80 bg-gray-200 rounded animate-pulse"></div>
      </div>

      {/* Sections Skeleton */}
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="h-6 w-48 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
          </div>
          {[...Array(3)].map((_, j) => (
            <div key={j} className="flex items-center p-3 border rounded-lg mb-3">
              <div className="h-10 w-10 bg-gray-200 rounded-full animate-pulse mr-3"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}