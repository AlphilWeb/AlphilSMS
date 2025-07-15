// components/semestersNav.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FiCalendar, FiList, FiClock } from 'react-icons/fi'; // Example icons

export default function SemestersNav() {
  const pathname = usePathname();

  const navItems = [
    { name: 'Overview', href: '/dashboard/semesters', icon: FiCalendar },
    { name: 'Upcoming', href: '/dashboard/semesters/upcoming', icon: FiClock }, // Example: view upcoming semesters
    { name: 'Past Semesters', href: '/dashboard/semesters/past', icon: FiList }, // Example: view past semesters
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