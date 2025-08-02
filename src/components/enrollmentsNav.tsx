// components/enrollmentsNav.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FiUserCheck, FiBook, FiCalendar, FiUsers } from 'react-icons/fi'; // Example icons

export default function EnrollmentsNav() {
  const pathname = usePathname();

  const navItems = [
    { name: 'Overview', href: '/dashboard/enrollments', icon: FiUserCheck },
    { name: 'By Student', href: '/dashboard/enrollments/by-student', icon: FiUsers }, // Example: view enrollments by student
    { name: 'By Course', href: '/dashboard/enrollments/by-course', icon: FiBook }, // Example: view enrollments by course
    { name: 'By Semester', href: '/dashboard/enrollments/by-semester', icon: FiCalendar }, // Example: view enrollments by semester
  ];

  return (
    <nav className="flex flex-wrap gap-4">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link href={item.href} key={item.name}>
            <span
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all shadow-md
                ${isActive
                  ? 'bg-gradient-to-r from-pink-600 to-pink-500 text-white'
                  : 'bg-emerald-700/50 text-white hover:bg-emerald-600/70'
                }`}
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}