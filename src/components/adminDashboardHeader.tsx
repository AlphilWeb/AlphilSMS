'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
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
  FiLogOut,
  FiMenu, // Import hamburger menu icon
  FiX // Import close icon
} from 'react-icons/fi';
import {
  HiOutlineAcademicCap,
  HiOutlineUserGroup,
  HiOutlineDocumentReport
} from 'react-icons/hi';
import { useState, useEffect } from 'react';

export default function AdminDashboardHeader() {
  const pathname = usePathname();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // State for mobile menu

  // Mock user data
  const currentUser = {
    name: "Dr. Jane Doe",
    role: "Administrator",
    avatar: "/default-avatar.jpg" // Replace with actual user image path
  };

  // Close the mobile menu automatically when the route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Main navigation items
  const navItems = [
    {
      category: "Overview",
      items: [
        { href: "/dashboard/admin", icon: <FiHome className="w-5 h-5" />, label: "Dashboard" }
      ]
    },
    {
      category: "Academic Structure",
      items: [
        { href: "/dashboard/admin/departments", icon: <FiLayers className="w-5 h-5" />, label: "Departments" },
        { href: "/dashboard/admin/programs", icon: <HiOutlineAcademicCap className="w-5 h-5" />, label: "Programs" },
        { href: "/dashboard/admin/courses", icon: <FiBook className="w-5 h-5" />, label: "Courses" },
        { href: "/dashboard/admin/semesters", icon: <FiCalendar className="w-5 h-5" />, label: "Semesters" }
      ]
    },
    {
      category: "User Management",
      items: [
        { href: "/dashboard/admin/students", icon: <HiOutlineUserGroup className="w-5 h-5" />, label: "Students" },
        { href: "/dashboard/admin/staff", icon: <FiUsers className="w-5 h-5" />, label: "Staff" }
      ]
    },
    {
      category: "Academic Records",
      items: [
        { href: "/dashboard/admin/enrollments", icon: <FiFileText className="w-5 h-5" />, label: "Enrollments" },
        { href: "/dashboard/admin/grades", icon: <FiPieChart className="w-5 h-5" />, label: "Grades" },
        { href: "/dashboard/admin/transcripts", icon: <HiOutlineDocumentReport className="w-5 h-5" />, label: "Transcripts" },
        { href: "/dashboard/admin/timetables", icon: <FiClock className="w-5 h-5" />, label: "Timetables" }
      ]
    },
    {
      category: "Finance",
      items: [
        { href: "/dashboard/admin/finance/fee-structures", icon: <FiDollarSign className="w-5 h-5" />, label: "Fee Structures" },
        { href: "/dashboard/admin/finance/invoices", icon: <FiFileText className="w-5 h-5" />, label: "Invoices" },
        { href: "/dashboard/admin/finance/payments", icon: <FiDollarSign className="w-5 h-5" />, label: "Payments" },
        { href: "/dashboard/admin/finance/salaries", icon: <FiDollarSign className="w-5 h-5" />, label: "Staff Salaries" }
      ]
    },
    {
      category: "Reports",
      items: [
        { href: "/dashboard/admin/reports", icon: <FiUsers className="w-5 h-5" />, label: "Analytics" },
      ]
    },

    {
      category: "System",
      items: [
        { href: "/dashboard/admin/logs", icon: <FiFileText className="w-5 h-5" />, label: "Activity Logs" },
      ]
    }
  ];

  return (
    <>
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="px-6 py-3 flex items-center justify-between">
          {/* Logo/Branding and Hamburger menu button for mobile */}
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-md text-gray-600 hover:bg-gray-100"
            >
              {isMobileMenuOpen ? (
                <FiX className="w-6 h-6" />
              ) : (
                <FiMenu className="w-6 h-6" />
              )}
            </button>
            <Image
              src="/icon.jpg" 
              alt="Alphil Training College"
              width={50}
              height={50}
              className="h-16 w-auto"
            />
            <h1 className="text-xl font-bold text-pink-500 mt-8hidden md:block">ALPHIL TRAINING COLLEGE</h1>
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
                    <a
                      href="#"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <FiSettings className="mr-3 h-5 w-5 text-gray-400" />
                      Settings
                    </a>
                  </div>
                  <div className="border-t border-gray-100"></div>
                  <div className="py-1">
                    <a
                      href="#"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <FiLogOut className="mr-3 h-5 w-5 text-gray-400" />
                      Sign out
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile menu overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-gray-900 opacity-50 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <aside className={`fixed top-16 left-0 z-40 w-64 h-[calc(100vh-4rem)] transition-transform border-r border-gray-200 bg-white overflow-y-auto ${
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      } md:translate-x-0`}>
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
                        onClick={() => setIsMobileMenuOpen(false)}
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
