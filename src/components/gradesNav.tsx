// components/gradesNav.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FiAward, FiUser, FiBook, FiList } from 'react-icons/fi'; // Example icons

export default function GradesNav() {
  const pathname = usePathname();

  const navItems = [
    { name: 'Overview', href: '/dashboard/grades', icon: FiAward },
    { name: 'By Enrollment', href: '/dashboard/grades/by-enrollment', icon: FiList }, // Example: view grades by enrollment
    { name: 'By Student', href: '/dashboard/grades/by-student', icon: FiUser }, // Example: view grades by student
    { name: 'By Course', href: '/dashboard/grades/by-course', icon: FiBook }, // Example: view grades by course
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