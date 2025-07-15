// components/staffNav.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FiUsers, FiBriefcase, FiDollarSign, FiCalendar } from 'react-icons/fi'; // Example icons

export default function StaffNav() {
  const pathname = usePathname();

  const navItems = [
    { name: 'Overview', href: '/dashboard/staff', icon: FiBriefcase },
    { name: 'My Profile', href: '/dashboard/staff/profile', icon: FiUsers }, // Assuming a staff profile page
    { name: 'My Timetable', href: '/dashboard/staff/timetable', icon: FiCalendar }, // Assuming a staff timetable page
    { name: 'My Salaries', href: '/dashboard/staff/salaries', icon: FiDollarSign }, // Assuming a staff salaries page
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
