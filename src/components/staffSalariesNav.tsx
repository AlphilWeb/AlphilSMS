// components/staffSalariesNav.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FiDollarSign, FiUser, FiCalendar, FiList } from 'react-icons/fi'; // Example icons

export default function StaffSalariesNav() {
  const pathname = usePathname();

  const navItems = [
    { name: 'Overview', href: '/dashboard/staffSalaries', icon: FiDollarSign },
    { name: 'By Staff', href: '/dashboard/staffSalaries/by-staff', icon: FiUser }, // Example: filter by staff member
    { name: 'By Date', href: '/dashboard/staffSalaries/by-date', icon: FiCalendar }, // Example: filter by payment date
    { name: 'Reports', href: '/dashboard/staffSalaries/reports', icon: FiList }, // Example: link to salary reports
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