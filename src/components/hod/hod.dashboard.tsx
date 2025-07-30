'use client';

import {
  FiHome,
  FiUsers,
  FiUser,
  FiBook,
  FiBookOpen,
  FiCalendar,
  FiTrendingUp,
  FiClock,
  FiAlertCircle,
  FiDollarSign,
  FiLayers,
  FiActivity,
  FiEye
} from 'react-icons/fi';
import Link from 'next/link';
import { format } from 'date-fns';

interface HodDashboardData {
  departmentName: string;
  staffCount: number;
  studentCount: number;
  programCount: number;
  currentSemester: string;
  activeCoursesCount: number;
  recentEnrollments: number;
  pendingSalaries: number;
}

export default function HodDashboard({ data }: { data: HodDashboardData }) {
  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-800">HOD Dashboard</h1>
        <p className="text-gray-600">Department overview and management</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Department</p>
              <p className="text-xl font-semibold text-gray-900">{data.departmentName}</p>
            </div>
            <div className="p-2 rounded-full bg-blue-50">
              <FiHome className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Staff Members</p>
              <p className="text-xl font-semibold text-gray-900">{data.staffCount}</p>
            </div>
            <div className="p-2 rounded-full bg-green-50">
              <FiUsers className="h-5 w-5 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Students</p>
              <p className="text-xl font-semibold text-gray-900">{data.studentCount}</p>
            </div>
            <div className="p-2 rounded-full bg-purple-50">
              <FiUser className="h-5 w-5 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Programs</p>
              <p className="text-xl font-semibold text-gray-900">{data.programCount}</p>
            </div>
            <div className="p-2 rounded-full bg-indigo-50">
              <FiBookOpen className="h-5 w-5 text-indigo-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Current Semester</p>
              <p className="text-xl font-semibold text-gray-900">{data.currentSemester}</p>
            </div>
            <div className="p-2 rounded-full bg-yellow-50">
              <FiCalendar className="h-5 w-5 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Active Courses</p>
              <p className="text-xl font-semibold text-gray-900">{data.activeCoursesCount}</p>
            </div>
            <div className="p-2 rounded-full bg-teal-50">
              <FiBook className="h-5 w-5 text-teal-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Recent Enrollments</p>
              <p className="text-xl font-semibold text-gray-900">{data.recentEnrollments}</p>
            </div>
            <div className="p-2 rounded-full bg-pink-50">
              <FiLayers className="h-5 w-5 text-pink-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Pending Salaries</p>
              <p className="text-xl font-semibold text-gray-900">{data.pendingSalaries}</p>
            </div>
            <div className={`p-2 rounded-full ${data.pendingSalaries > 0 ? 'bg-red-50' : 'bg-green-50'}`}>
              <FiDollarSign className={`h-5 w-5 ${data.pendingSalaries > 0 ? 'text-red-600' : 'text-green-600'}`} />
            </div>
          </div>
          {data.pendingSalaries > 0 && (
            <Link 
              href="/dashboard/hod/staff-salaries" 
              className="mt-2 text-xs text-red-600 hover:text-red-800 block text-right"
            >
              Review Now
            </Link>
          )}
        </div>
      </div>

      {/* Department Summary */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Department Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border rounded-lg p-4">
            <div className="flex items-center mb-2">
              <FiUsers className="h-5 w-5 text-blue-600 mr-2" />
              <h4 className="font-medium text-gray-900">Staff Overview</h4>
            </div>
            <p className="text-sm text-gray-600">
              You have {data.staffCount} staff members in the {data.departmentName} department.
            </p>
            <Link 
              href="/dashboard/hod/staff" 
              className="mt-3 inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
            >
              View Staff Directory
              <FiTrendingUp className="ml-1 h-4 w-4" />
            </Link>
          </div>

          <div className="border rounded-lg p-4">
            <div className="flex items-center mb-2">
              <FiUser className="h-5 w-5 text-purple-600 mr-2" />
              <h4 className="font-medium text-gray-900">Student Overview</h4>
            </div>
            <p className="text-sm text-gray-600">
              There are {data.studentCount} students enrolled in {data.programCount} programs.
            </p>
            <Link 
              href="/dashboard/hod/students" 
              className="mt-3 inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
            >
              View Student Records
              <FiTrendingUp className="ml-1 h-4 w-4" />
            </Link>
          </div>

          <div className="border rounded-lg p-4">
            <div className="flex items-center mb-2">
              <FiBook className="h-5 w-5 text-teal-600 mr-2" />
              <h4 className="font-medium text-gray-900">Academic Overview</h4>
            </div>
            <p className="text-sm text-gray-600">
              {data.activeCoursesCount} courses being offered in {data.currentSemester}.
            </p>
            <Link 
              href="/dashboard/hod/courses" 
              className="mt-3 inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
            >
              View Course Catalog
              <FiTrendingUp className="ml-1 h-4 w-4" />
            </Link>
          </div>

          <div className="border rounded-lg p-4">
            <div className="flex items-center mb-2">
              <FiActivity className="h-5 w-5 text-orange-600 mr-2" />
              <h4 className="font-medium text-gray-900">Financial Overview</h4>
            </div>
            <p className="text-sm text-gray-600">
              {data.pendingSalaries} pending salary approvals for department staff.
            </p>
            <Link 
              href="/dashboard/hod/staff-salaries" 
              className="mt-3 inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
            >
              Review Financials
              <FiTrendingUp className="ml-1 h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Link
            href="/dashboard/hod/staff-timetables"
            className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center">
              <FiClock className="h-5 w-5 text-blue-600 mr-2" />
              <span>View Staff Timetables</span>
            </div>
          </Link>
          <Link
            href="/dashboard/hod/enrollments"
            className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center">
              <FiLayers className="h-5 w-5 text-green-600 mr-2" />
              <span>Check Enrollments</span>
            </div>
          </Link>
          <Link
            href="/dashboard/hod/academic-calendar"
            className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center">
              <FiCalendar className="h-5 w-5 text-purple-600 mr-2" />
              <span>Academic Calendar</span>
            </div>
          </Link>
          <Link
            href="/dashboard/hod/activities"
            className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center">
              <FiEye className="h-5 w-5 text-orange-600 mr-2" />
              <span>View Activity Logs</span>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}