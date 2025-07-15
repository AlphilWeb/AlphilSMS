// components/invoicesNav.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FiFileText, FiUser, FiCalendar, FiDollarSign } from 'react-icons/fi'; // Example icons

export default function InvoicesNav() {
  const pathname = usePathname();

  const navItems = [
    { name: 'Overview', href: '/dashboard/invoices', icon: FiFileText },
    { name: 'By Student', href: '/dashboard/invoices/by-student', icon: FiUser }, // Example: view invoices by student
    { name: 'By Semester', href: '/dashboard/invoices/by-semester', icon: FiCalendar }, // Example: view invoices by semester
    { name: 'Payments', href: '/dashboard/invoices/payments', icon: FiDollarSign }, // Example: link to payments
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