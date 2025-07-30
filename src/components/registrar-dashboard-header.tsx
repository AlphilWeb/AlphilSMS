"use client"

import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { 
  FiBell, 
  FiChevronDown, 
  FiHome, 
  FiUsers, 
  FiBook, 
  FiDollarSign, 
  FiCalendar,
  FiFileText,
  FiClock,
  FiLayers,
  FiPieChart,
  FiSettings,
  FiLogOut
} from "react-icons/fi";
import { 
  HiOutlineAcademicCap,
  HiOutlineUserGroup,
  HiOutlineDocumentReport
} from "react-icons/hi";
import { useState } from "react";

export default function RegistrarDashboardHeader() {
  const pathname = usePathname();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Mock user data
  const currentUser = {
    name: "Registrar Office",
    role: "Registrar",
    avatar: "/default-avatar.jpg"
  };

  // Navigation items specific to Registrar
  const navItems = [
    { 
      category: "Overview", 
      items: [
        { href: "/dashboard/registrar", icon: <FiHome className="w-5 h-5" />, label: "Dashboard" }
      ]
    },
    { 
      category: "Student Records", 
      items: [
        { href: "/dashboard/registrar/students", icon: <HiOutlineUserGroup className="w-5 h-5" />, label: "Students" },
        { href: "/dashboard/registrar/enrollments", icon: <FiFileText className="w-5 h-5" />, label: "Enrollments" },
        { href: "/dashboard/registrar/transcripts", icon: <HiOutlineDocumentReport className="w-5 h-5" />, label: "Transcripts" }
      ]
    },
    { 
      category: "Academic Operations", 
      items: [
        { href: "/dashboard/registrar/programs", icon: <HiOutlineAcademicCap className="w-5 h-5" />, label: "Programs" },
        { href: "/dashboard/registrar/courses", icon: <FiBook className="w-5 h-5" />, label: "Courses" },
        { href: "/dashboard/registrar/semesters", icon: <FiCalendar className="w-5 h-5" />, label: "Semesters" },
        { href: "/dashboard/registrar/timetables", icon: <FiClock className="w-5 h-5" />, label: "Timetables" }
      ]
    },
    { 
      category: "Reports", 
      items: [
        { href: "/dashboard/registrar/reports/enrollment-stats", icon: <FiPieChart className="w-5 h-5" />, label: "Enrollment Stats" },
        { href: "/dashboard/registrar/reports/graduation-list", icon: <FiFileText className="w-5 h-5" />, label: "Graduation List" }
      ]
    }
  ];

  return (
    <>
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="px-6 py-3 flex items-center justify-between">
          {/* Logo/Branding */}
          <div className="flex items-center space-x-4">
            <Image
              src="/logo.png"
              alt="College Logo"
              width={40}
              height={40}
              className="h-10 w-auto"
            />
            <h1 className="text-xl font-bold text-gray-800 hidden md:block">REGISTRAR OFFICE</h1>
          </div>

          {/* User controls */}
          <div className="flex items-center space-x-6">
            {/* Notifications */}
            <button className="relative p-1 rounded-full text-gray-600 hover:text-gray-900 hover:bg-gray-100">
              <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                3
              </span>
              <FiBell className="w-6 h-6" />
            </button>

            {/* User profile dropdown */}
            <div className="relative">
              <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center space-x-2 focus:outline-none"
              >
                <div className="h-8 w-8 rounded-full bg-gray-200 overflow-hidden">
                  <Image
                    src={currentUser.avatar}
                    alt="User avatar"
                    width={32}
                    height={32}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-gray-800">{currentUser.name}</p>
                  <p className="text-xs text-gray-500">{currentUser.role}</p>
                </div>
                <FiChevronDown className="hidden md:block w-4 h-4 text-gray-500" />
              </button>

              {/* Dropdown menu */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                  <div className="px-4 py-3">
                    <p className="text-sm font-medium text-gray-900">{currentUser.name}</p>
                    <p className="text-sm text-gray-500 truncate">{currentUser.role}</p>
                  </div>
                  <div className="py-1">
                    <Link
                      href="/dashboard/registrar/settings"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <FiSettings className="mr-3 h-5 w-5 text-gray-400" />
                      Settings
                    </Link>
                  </div>
                  <div className="border-t border-gray-100"></div>
                  <div className="py-1">
                    <Link
                      href="/logout"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <FiLogOut className="mr-3 h-5 w-5 text-gray-400" />
                      Sign out
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <aside className="fixed top-16 left-0 z-40 w-64 h-[calc(100vh-4rem)] transition-transform -translate-x-full md:translate-x-0 border-r border-gray-200 bg-white overflow-y-auto">
        <div className="px-4 py-6">
          {/* Navigation */}
          <nav className="space-y-8">
            {navItems.map((section) => (
              <div key={section.category} className="space-y-2">
                <h3 className="px-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  {section.category}
                </h3>
                <ul className="space-y-1">
                  {section.items.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                          pathname === item.href
                            ? "bg-emerald-50 text-emerald-700"
                            : "text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        <span className={`mr-3 ${
                          pathname === item.href ? "text-emerald-500" : "text-gray-400"
                        }`}>
                          {item.icon}
                        </span>
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>
      </aside>
    </>
  );
}