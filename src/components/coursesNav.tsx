// components/coursesNav.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FiBook, FiCalendar, FiUsers } from 'react-icons/fi'; // Example icons

export default function CoursesNav() {
  const pathname = usePathname();

  const navItems = [
    { name: 'Overview', href: '/dashboard/courses', icon: FiBook },
    { name: 'Courses by Program', href: '/dashboard/courses/by-program', icon: FiCalendar }, // Example: filter courses by program
    { name: 'Courses by Semester', href: '/dashboard/courses/by-semester', icon: FiUsers }, // Example: filter courses by semester
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