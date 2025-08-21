// components/dashboard/dashboard-client-component.tsx
'use client';

import Link from 'next/link';
import {
  FiUsers, FiUser, FiBriefcase, FiBookOpen, FiCalendar,
  FiFileText, FiDollarSign, FiCreditCard, FiActivity, FiClipboard,
  FiHome, FiAward, FiBook, FiList,
  FiClock, FiTrendingUp, FiBarChart2
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
      href: "/dashboard/users",
      category: "management",
      trend: "+12%",
      description: "System users"
    },
    {
      title: "Students",
      count: counts.studentCount,
      icon: FiUser,
      href: "/dashboard/students",
      category: "academic",
      trend: "+8%",
      description: "Active students"
    },
    {
      title: "Staff",
      count: counts.staffCount,
      icon: FiBriefcase,
      href: "/dashboard/staff",
      category: "academic",
      trend: "+5%",
      description: "Teaching staff"
    },
    {
      title: "Departments",
      count: counts.departmentCount,
      icon: FiHome,
      href: "/dashboard/departments",
      category: "academic",
      trend: "+2%",
      description: "Academic departments"
    },
    {
      title: "Programs",
      count: counts.programCount,
      icon: FiBookOpen,
      href: "/dashboard/programs",
      category: "academic",
      trend: "+3%",
      description: "Degree programs"
    },
    {
      title: "Semesters",
      count: counts.semesterCount,
      icon: FiCalendar,
      href: "/dashboard/semesters",
      category: "academic",
      trend: "Current",
      description: "Active semesters"
    },
    {
      title: "Courses",
      count: counts.courseCount,
      icon: FiBook,
      href: "/dashboard/courses",
      category: "academic",
      trend: "+15%",
      description: "Available courses"
    },
    {
      title: "Enrollments",
      count: counts.enrollmentCount,
      icon: FiList,
      href: "/dashboard/enrollments",
      category: "academic",
      trend: "+20%",
      description: "Current enrollments"
    },
    {
      title: "Grades",
      count: counts.gradeCount,
      icon: FiAward,
      href: "/dashboard/grades",
      category: "academic",
      trend: "Updated",
      description: "Grade records"
    },
    {
      title: "Transcripts",
      count: counts.transcriptCount,
      icon: FiClipboard,
      href: "/dashboard/transcripts",
      category: "academic",
      trend: "+10%",
      description: "Student transcripts"
    },
    {
      title: "Timetables",
      count: counts.timetableCount,
      icon: FiClock,
      href: "/dashboard/timetables",
      category: "academic",
      trend: "Current",
      description: "Class schedules"
    },
    {
      title: "Fee Structures",
      count: counts.feeStructureCount,
      icon: FiDollarSign,
      href: "/dashboard/feeStructures",
      category: "financial",
      trend: "Active",
      description: "Fee plans"
    },
    {
      title: "Invoices",
      count: counts.invoiceCount,
      icon: FiFileText,
      href: "/dashboard/invoices",
      category: "financial",
      trend: "+25%",
      description: "Generated invoices"
    },
    {
      title: "Payments",
      count: counts.paymentCount,
      icon: FiCreditCard,
      href: "/dashboard/payments",
      category: "financial",
      trend: "+18%",
      description: "Processed payments"
    },
    {
      title: "Staff Salaries",
      count: counts.staffSalaryCount,
      icon: FiDollarSign,
      href: "/dashboard/staffSalaries",
      category: "financial",
      trend: "Monthly",
      description: "Salary records"
    },
    {
      title: "User Logs",
      count: counts.userLogCount,
      icon: FiActivity,
      href: "/dashboard/userLogs",
      category: "management",
      trend: "Recent",
      description: "Activity logs"
    },
  ];

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "academic":
        return "from-emerald-500 to-teal-600";
      case "financial":
        return "from-blue-500 to-indigo-600";
      case "management":
        return "from-purple-500 to-violet-600";
      default:
        return "from-gray-500 to-gray-600";
    }
  };

  const getTrendColor = (trend: string) => {
    if (trend.includes('+')) return "text-emerald-400";
    if (trend === "Current" || trend === "Active" || trend === "Updated") return "text-blue-400";
    return "text-gray-400";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      {/* Header */}
      <div className="mb-8">
        <p className="text-gray-600">Welcome to your education management system dashboard</p>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Students</p>
              <p className="text-2xl font-bold text-gray-800">{counts.studentCount}</p>
              <p className="text-sm text-emerald-500 flex items-center gap-1 mt-1">
                <FiTrendingUp size={14} />
                +8% from last month
              </p>
            </div>
            <div className="p-3 bg-emerald-100 rounded-xl">
              <FiUser className="text-emerald-600 text-xl" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-800">
                ${(counts.paymentCount * 500).toLocaleString()}
              </p>
              <p className="text-sm text-blue-500 flex items-center gap-1 mt-1">
                <FiBarChart2 size={14} />
                +18% from last month
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-xl">
              <FiDollarSign className="text-blue-600 text-xl" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Active Courses</p>
              <p className="text-2xl font-bold text-gray-800">{counts.courseCount}</p>
              <p className="text-sm text-purple-500 flex items-center gap-1 mt-1">
                <FiActivity size={14} />
                +15% new courses
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-xl">
              <FiBook className="text-purple-600 text-xl" />
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Cards Grid */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Quick Access</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {dashboardCards.map((card, index) => (
            <Link key={index} href={card.href} className="block group">
              <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 transition-all duration-300 hover:shadow-lg hover:border-emerald-200 hover:translate-y-1">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-r ${getCategoryColor(card.category)}`}>
                    <card.icon className="text-white text-xl" />
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${getTrendColor(card.trend)} bg-opacity-20 ${getTrendColor(card.trend).replace('text-', 'bg-')}`}>
                    {card.trend}
                  </span>
                </div>
                
                <div className="mb-2">
                  <h3 className="text-lg font-semibold text-gray-800 group-hover:text-emerald-600 transition-colors">
                    {card.title}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">{card.description}</p>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-gray-800">{card.count}</span>
                  <div className="w-8 h-8 bg-emerald-50 rounded-full flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                    <div className="w-4 h-4 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full"></div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Footer Section */}
      <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">System Status</h3>
            <p className="text-sm text-gray-500">All systems operational</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
            <span className="text-sm text-emerald-600">Online</span>
          </div>
        </div>
      </div>
    </div>
  );
}