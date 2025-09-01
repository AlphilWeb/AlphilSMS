// componentsadmin/dashboardadmin/dashboard-client-component.tsx
'use client';

import Link from 'next/link';
import {
  FiUsers, FiUser, FiBriefcase, FiBookOpen, FiCalendar,
  FiFileText, FiDollarSign, FiCreditCard, FiActivity, FiClipboard,
  FiHome, FiAward, FiBook, FiList,
  FiClock, FiTrendingUp, FiBarChart2, FiArrowRight
} from "react-icons/fi";

// Define the interface for the counts received as props
interface DashboardCounts {
  userCount: number;
  studentCount: number;
  staffCount: number;
  departmentCount: number;
  programCount: number;
  semesterCount: number;
  courseCount: number;
  enrollmentCount: number;
  gradeCount: number;
  transcriptCount: number;
  timetableCount: number;
  feeStructureCount: number;
  invoiceCount: number;
  paymentCount: number;
  staffSalaryCount: number;
  userLogCount: number;
}

interface DashboardClientComponentProps {
  counts: DashboardCounts;
}

export default function DashboardClientComponent({ counts }: DashboardClientComponentProps) {
  const dashboardCards = [
    {
      title: "Users",
      count: counts.userCount,
      icon: FiUsers,
      href: "admin/dashboard/staff",
      category: "management",
      trend: "",
      description: "System users"
    },
    {
      title: "Students",
      count: counts.studentCount,
      icon: FiUser,
      href: "admin/dashboard/students",
      category: "academic",
      trend: "",
      description: "Active students"
    },
    {
      title: "Staff",
      count: counts.staffCount,
      icon: FiBriefcase,
      href: "admin/dashboard/staff",
      category: "academic",
      trend: "",
      description: "Teaching staff"
    },
    {
      title: "Departments",
      count: counts.departmentCount,
      icon: FiHome,
      href: "admin/dashboard/departments",
      category: "academic",
      trend: "",
      description: "Academic departments"
    },
    {
      title: "Programs",
      count: counts.programCount,
      icon: FiBookOpen,
      href: "admin/dashboard/programs",
      category: "academic",
      trend: "",
      description: "Certificate programs"
    },
    {
      title: "Semesters",
      count: counts.semesterCount,
      icon: FiCalendar,
      href: "admin/dashboard/semesters",
      category: "academic",
      trend: "Current",
      description: "Active semesters"
    },
    {
      title: "Courses",
      count: counts.courseCount,
      icon: FiBook,
      href: "admin/dashboard/courses",
      category: "academic",
      trend: "",
      description: "Available courses"
    },
    {
      title: "Enrollments",
      count: counts.enrollmentCount,
      icon: FiList,
      href: "admin/dashboard/enrollments",
      category: "academic",
      trend: "",
      description: "Current enrollments"
    },
    {
      title: "Grades",
      count: counts.gradeCount,
      icon: FiAward,
      href: "admin/dashboard/grades",
      category: "academic",
      trend: "Updated",
      description: "Grade records"
    },
    {
      title: "Transcripts",
      count: counts.transcriptCount,
      icon: FiClipboard,
      href: "admin/dashboard/transcripts",
      category: "academic",
      trend: "",
      description: "Student transcripts"
    },
    {
      title: "Timetables",
      count: counts.timetableCount,
      icon: FiClock,
      href: "admin/dashboard/timetables",
      category: "academic",
      trend: "Current",
      description: "Class schedules"
    },
    {
      title: "Fee Structures",
      count: counts.feeStructureCount,
      icon: FiDollarSign,
      href: "admin/dashboard/feeStructures",
      category: "financial",
      trend: "Active",
      description: "Fee plans"
    },
    {
      title: "Invoices",
      count: counts.invoiceCount,
      icon: FiFileText,
      href: "admin/dashboard/invoices",
      category: "financial",
      trend: "",
      description: "Generated invoices"
    },
    {
      title: "Payments",
      count: counts.paymentCount,
      icon: FiCreditCard,
      href: "admin/dashboard/payments",
      category: "financial",
      trend: "",
      description: "Processed payments"
    },
    {
      title: "Staff Salaries",
      count: counts.staffSalaryCount,
      icon: FiDollarSign,
      href: "admin/dashboard/staffSalaries",
      category: "financial",
      trend: "Monthly",
      description: "Salary records"
    },
    {
      title: "User Logs",
      count: counts.userLogCount,
      icon: FiActivity,
      href: "admin/dashboard/userLogs",
      category: "management",
      trend: "Recent",
      description: "Activity logs"
    },
  ];

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "academic":
        return "bg-emerald-100 text-emerald-600";
      case "financial":
        return "bg-blue-100 text-blue-600";
      case "management":
        return "bg-purple-100 text-purple-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  const getTrendColor = (trend: string) => {
    if (trend.includes('+')) return "text-emerald-600 bg-emerald-50";
    if (trend === "Current" || trend === "Active" || trend === "Updated") return "text-blue-600 bg-blue-50";
    return "text-gray-600 bg-gray-50";
  };

  const categoryGroups = {
    academic: dashboardCards.filter(card => card.category === "academic"),
    financial: dashboardCards.filter(card => card.category === "financial"),
    management: dashboardCards.filter(card => card.category === "management")
  };

  return (
    <div className="bg-emerald-800 p-6 rounded-2xl">
      {/* Header Section */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">System Management Portal</h2>
        <p className="text-emerald-100">Comprehensive overview of your education management system</p>
      </div>

      {/* Quick Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-lg p-6 border border-emerald-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Students</p>
              <p className="text-2xl font-bold text-gray-800">{counts.studentCount}</p>
              <p className="text-sm text-emerald-600 flex items-center gap-1 mt-1">
                <FiTrendingUp size={14} />
                {/* +8% from last month */}
              </p>
            </div>
            <div className="p-3 bg-emerald-100 rounded-xl">
              <FiUser className="text-emerald-600 text-xl" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-emerald-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-800">
                KSH{(counts.paymentCount * 500).toLocaleString()}
              </p>
              <p className="text-sm text-blue-600 flex items-center gap-1 mt-1">
                <FiBarChart2 size={14} />
                {/* +18% from last month */}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-xl">
              <FiDollarSign className="text-blue-600 text-xl" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-emerald-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Active Courses</p>
              <p className="text-2xl font-bold text-gray-800">{counts.courseCount}</p>
              <p className="text-sm text-purple-600 flex items-center gap-1 mt-1">
                <FiActivity size={14} />
                {/* +15% new courses */}
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-xl">
              <FiBook className="text-purple-600 text-xl" />
            </div>
          </div>
        </div>
      </div>

      {/* Category Sections */}
      <div className="space-y-8">
        {/* Academic Section */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-white flex items-center gap-3">
              <div className="p-2 bg-emerald-600 rounded-lg">
                <FiBook className="text-white" />
              </div>
              Academic Management
            </h3>
            <span className="text-emerald-200 text-sm">
              {categoryGroups.academic.length} modules
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {categoryGroups.academic.map((card, index) => (
              <Link key={index} href={card.href} className="block group">
                <div className="bg-white rounded-xl shadow-md p-5 border border-emerald-100 transition-all duration-200 hover:shadow-lg hover:border-emerald-300 hover:translate-y-0.5">
                  <div className="flex items-start justify-between mb-3">
                    <div className={`p-2 rounded-lg ${getCategoryColor(card.category)}`}>
                      <card.icon className="text-xl" />
                    </div>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${getTrendColor(card.trend)}`}>
                      {card.trend}
                    </span>
                  </div>
                  
                  <div className="mb-3">
                    <h3 className="text-lg font-semibold text-gray-800 group-hover:text-emerald-700 transition-colors">
                      {card.title}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">{card.description}</p>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold text-gray-800">{card.count}</span>
                    <div className="w-7 h-7 bg-emerald-50 rounded-full flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                      <FiArrowRight className="text-emerald-600 text-sm" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Financial Section */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-white flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <FiDollarSign className="text-white" />
              </div>
              Financial Management
            </h3>
            <span className="text-emerald-200 text-sm">
              {categoryGroups.financial.length} modules
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {categoryGroups.financial.map((card, index) => (
              <Link key={index} href={card.href} className="block group">
                <div className="bg-white rounded-xl shadow-md p-5 border border-emerald-100 transition-all duration-200 hover:shadow-lg hover:border-blue-300 hover:translate-y-0.5">
                  <div className="flex items-start justify-between mb-3">
                    <div className={`p-2 rounded-lg ${getCategoryColor(card.category)}`}>
                      <card.icon className="text-xl" />
                    </div>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${getTrendColor(card.trend)}`}>
                      {card.trend}
                    </span>
                  </div>
                  
                  <div className="mb-3">
                    <h3 className="text-lg font-semibold text-gray-800 group-hover:text-blue-700 transition-colors">
                      {card.title}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">{card.description}</p>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold text-gray-800">{card.count}</span>
                    <div className="w-7 h-7 bg-blue-50 rounded-full flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                      <FiArrowRight className="text-blue-600 text-sm" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Management Section */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-white flex items-center gap-3">
              <div className="p-2 bg-purple-600 rounded-lg">
                <FiUsers className="text-white" />
              </div>
              System Management
            </h3>
            <span className="text-emerald-200 text-sm">
              {categoryGroups.management.length} modules
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {categoryGroups.management.map((card, index) => (
              <Link key={index} href={card.href} className="block group">
                <div className="bg-white rounded-xl shadow-md p-5 border border-emerald-100 transition-all duration-200 hover:shadow-lg hover:border-purple-300 hover:translate-y-0.5">
                  <div className="flex items-start justify-between mb-3">
                    <div className={`p-2 rounded-lg ${getCategoryColor(card.category)}`}>
                      <card.icon className="text-xl" />
                    </div>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${getTrendColor(card.trend)}`}>
                      {card.trend}
                    </span>
                  </div>
                  
                  <div className="mb-3">
                    <h3 className="text-lg font-semibold text-gray-800 group-hover:text-purple-700 transition-colors">
                      {card.title}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">{card.description}</p>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold text-gray-800">{card.count}</span>
                    <div className="w-7 h-7 bg-purple-50 rounded-full flex items-center justify-center group-hover:bg-purple-100 transition-colors">
                      <FiArrowRight className="text-purple-600 text-sm" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* System Status Footer */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-emerald-100 mt-8">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">System Status</h3>
            <p className="text-sm text-gray-500">All systems operational and running smoothly</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
            <span className="text-sm text-emerald-600 font-medium">Online & Secure</span>
          </div>
        </div>
      </div>
    </div>
  );
}