'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  FiBell,
  FiChevronDown,
  FiHome,
  FiBook,
  FiCalendar,
  FiFileText,
  FiClock,
  FiPieChart,
  FiLogOut,
  FiUser,
  FiEye,
  FiMenu,
  FiX // Import a close icon for the hamburger menu
} from 'react-icons/fi';
import {
  HiOutlineAcademicCap,
  HiOutlineDocumentReport
} from 'react-icons/hi';
import { useState, useEffect } from 'react';
import { getLecturerHeaderData, LecturerHeaderData } from '@/lib/actions/lecturer.dashboard.header.action';
import { logout } from '@/lib/actions/lecturer.dashboard.header.action';
import { Skeleton } from '@/components/ui/skeleton';
import { getClientImageUrl } from '@/lib/image-client';

export default function LecturerDashboardHeader() {
  const pathname = usePathname();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  // State to control the mobile menu visibility
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [lecturerData, setLecturerData] = useState<LecturerHeaderData | null>(null);
  const [loading, setLoading] = useState(true);

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarLoading, setAvatarLoading] = useState(true);
  console.log('Avatar URL:', avatarUrl);
  console.log('Avatar Loading:', avatarLoading);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await getLecturerHeaderData();
        setLecturerData(data);

        // 🔑 fetch signed avatar URL
        if (data?.id) {
          const url = await getClientImageUrl(data.id, 'lecturer-passport');
          setAvatarUrl(url || null);
        }
      } catch (error) {
        console.error('Failed to load lecturer data:', error);
        setLecturerData(null);
        setAvatarUrl(null);
      } finally {
        setLoading(false);
        setAvatarLoading(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await getLecturerHeaderData();
        setLecturerData(data);
      } catch (error) {
        console.error('Failed to load lecturer data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Close mobile menu when a new link is clicked
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const navItems = [
    {
      category: "Overview",
      items: [
        { href: "/dashboard/lecturer", icon: <FiHome className="w-5 h-5" />, label: "Dashboard" }
      ]
    },
    {
      category: "Teaching",
      items: [
        { href: "/dashboard/lecturer/courses", icon: <FiBook className="w-5 h-5" />, label: "My Courses" },
        { href: "/dashboard/lecturer/students", icon: <FiUser className="w-5 h-5" />, label: "My Students" },
        { href: "/dashboard/lecturer/timetable", icon: <FiClock className="w-5 h-5" />, label: "Timetable" }
      ]
    },
    {
      category: "Assignments & Quizzes",
      items: [
        { href: "/dashboard/lecturer/assignments", icon: <FiFileText className="w-5 h-5" />, label: "Manage Assignments" },
        { href: "/dashboard/lecturer/quizzes", icon: <HiOutlineAcademicCap className="w-5 h-5" />, label: "Manage Quizzes" },
        { href: "/dashboard/lecturer/submissions", icon: <FiClock className="w-5 h-5" />, label: "Submissions" }
      ]
    },
    {
      category: "Assessment",
      items: [
        { href: "/dashboard/lecturer/grades", icon: <FiPieChart className="w-5 h-5" />, label: "Grade Students" },
        { href: "/dashboard/lecturer/results", icon: <HiOutlineDocumentReport className="w-5 h-5" />, label: "Results" },
        { href: "/dashboard/lecturer/material-views", icon: <FiEye className="w-5 h-5" />, label: "Material Views" }
      ]
    },
    {
      category: "Academic",
      items: [
        { href: "/dashboard/lecturer/academic-calendar", icon: <FiCalendar className="w-5 h-5" />, label: "Academic Calendar" }
      ]
    },
    {
      category: "Account",
      items: [
        { href: "/dashboard/lecturer/profile", icon: <FiUser className="w-5 h-5" />, label: "Profile" },
      ]
    }
  ];

  if (loading) {
    return (
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="px-6 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Skeleton className="h-10 w-10 rounded" />
            <Skeleton className="h-6 w-48 hidden md:block" />
          </div>
          <div className="flex items-center space-x-6">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-8 w-32 hidden md:block" />
          </div>
        </div>
      </header>
    );
  }

  if (!lecturerData) {
    return <div className="p-4 text-red-500">Failed to load user data</div>;
  }

  return (
    <>
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="px-6 py-1 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Hamburger menu button */}
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
              alt="College Logo"
              width={50}
              height={50}
              className="h-16 w-auto"
              priority
            />
            <h1 className="text-l font-bold text-pink-500 mt-8 hidden md:block">ALPHIL TRAINING COLLEGE</h1>
          </div>

          <div className="flex items-center space-x-6">
            <button className="relative p-1 rounded-full text-gray-600 hover:text-gray-900 hover:bg-gray-100">
              {lecturerData.notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {lecturerData.notificationCount}
                </span>
              )}
              <FiBell className="w-6 h-6" />
            </button>

            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center space-x-2 focus:outline-none"
              >
                <div className="h-8 w-8 rounded-full bg-gray-200 overflow-hidden">
                  <Image
                    src={lecturerData.avatar}
                    alt="User avatar"
                    width={32}
                    height={32}
                    className="h-full w-full object-contain"
                  />
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-gray-800">{lecturerData.name}</p>
                  <p className="text-xs text-gray-500">{lecturerData.role}</p>
                </div>
                <FiChevronDown className="hidden md:block w-4 h-4 text-gray-500" />
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                  <div className="px-4 py-3">
                    <p className="text-sm font-medium text-gray-900">{lecturerData.name}</p>
                    <p className="text-sm text-gray-500 truncate">{lecturerData.role.charAt(0).toUpperCase() + lecturerData.role.slice(1)}</p>
                    <p className="text-xs text-gray-500 truncate">{lecturerData.department}</p>
                  </div>
                  <div className="py-1">
                    <Link
                      href="/dashboard/lecturer/profile"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      <FiUser className="mr-3 h-5 w-5 text-gray-400" />
                      My Profile
                    </Link>
                  </div>
                  <div className="border-t border-gray-100"></div>
                  <div className="py-1">
                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        logout();
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <FiLogOut className="mr-3 h-5 w-5 text-gray-400" />
                      Sign out
                    </button>
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

      {/* Sidebar for all screens */}
      <aside className={`fixed top-16 left-0 z-40 w-64 h-[calc(100vh-4rem)] transition-transform border-r border-gray-200 bg-white overflow-y-auto ${
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      } md:translate-x-0`}>
        <div className="px-4 py-6">
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
