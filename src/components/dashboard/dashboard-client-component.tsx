// components/dashboard/dashboard-client-component.tsx
'use client';

import Link from 'next/link';
import {
  FiUsers, FiUser, FiBriefcase, FiBookOpen, FiCalendar,
  FiFileText, FiDollarSign, FiCreditCard, FiActivity, FiClipboard,
  FiHome, FiAward, FiBook, FiList, FiGlobe,
  FiClock
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
      bgColor: "bg-blue-500",
    },
    {
      title: "Students",
      count: counts.studentCount,
      icon: FiUser,
      href: "/dashboard/students",
      bgColor: "bg-green-500",
    },
    {
      title: "Staff",
      count: counts.staffCount,
      icon: FiBriefcase,
      href: "/dashboard/staff",
      bgColor: "bg-purple-500",
    },
    {
      title: "Departments",
      count: counts.departmentCount,
      icon: FiHome,
      href: "/dashboard/departments",
      bgColor: "bg-yellow-500",
    },
    {
      title: "Programs",
      count: counts.programCount,
      icon: FiBookOpen,
      href: "/dashboard/programs",
      bgColor: "bg-indigo-500",
    },
    {
      title: "Semesters",
      count: counts.semesterCount,
      icon: FiCalendar,
      href: "/dashboard/semesters",
      bgColor: "bg-teal-500",
    },
    {
      title: "Courses",
      count: counts.courseCount,
      icon: FiBook,
      href: "/dashboard/courses",
      bgColor: "bg-orange-500",
    },
    {
      title: "Enrollments",
      count: counts.enrollmentCount,
      icon: FiList,
      href: "/dashboard/enrollments",
      bgColor: "bg-pink-500",
    },
    {
      title: "Grades",
      count: counts.gradeCount,
      icon: FiAward,
      href: "/dashboard/grades",
      bgColor: "bg-red-500",
    },
    {
      title: "Transcripts",
      count: counts.transcriptCount,
      icon: FiClipboard,
      href: "/dashboard/transcripts",
      bgColor: "bg-emerald-500",
    },
    {
      title: "Timetables",
      count: counts.timetableCount,
      icon: FiClock, // Assuming FiClock for timetable
      href: "/dashboard/timetables",
      bgColor: "bg-cyan-500",
    },
    {
      title: "Fee Structures",
      count: counts.feeStructureCount,
      icon: FiDollarSign,
      href: "/dashboard/feeStructures",
      bgColor: "bg-lime-500",
    },
    {
      title: "Invoices",
      count: counts.invoiceCount,
      icon: FiFileText,
      href: "/dashboard/invoices",
      bgColor: "bg-rose-500",
    },
    {
      title: "Payments",
      count: counts.paymentCount,
      icon: FiCreditCard,
      href: "/dashboard/payments",
      bgColor: "bg-fuchsia-500",
    },
    {
      title: "Staff Salaries",
      count: counts.staffSalaryCount,
      icon: FiDollarSign, // Reusing FiDollarSign
      href: "/dashboard/staffSalaries",
      bgColor: "bg-amber-500",
    },
    {
      title: "User Logs",
      count: counts.userLogCount,
      icon: FiActivity,
      href: "/dashboard/userLogs",
      bgColor: "bg-gray-500",
    },
  ];

  return (
    <div className="px-12 py-6 min-h-[calc(100vh-118px)]">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {dashboardCards.map((card, index) => (
          <Link key={index} href={card.href} className="block">
            <div className={`relative ${card.bgColor} rounded-xl shadow-lg p-6 flex items-center justify-between transition-transform transform hover:scale-105 hover:shadow-2xl cursor-pointer border border-white/20`}>
              <div className="flex flex-col">
                <span className="text-white text-lg font-semibold">{card.title}</span>
                <span className="text-white text-4xl font-bold mt-2">{card.count}</span>
              </div>
              <card.icon className="text-white opacity-40 w-16 h-16" />
              <div className="absolute inset-0 rounded-xl bg-black opacity-10 pointer-events-none"></div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}