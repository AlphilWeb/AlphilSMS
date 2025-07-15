// components/paymentsNav.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FiCreditCard, FiFileText, FiUser, FiCalendar } from 'react-icons/fi'; // Example icons

export default function PaymentsNav() {
  const pathname = usePathname();

  const navItems = [
    { name: 'Overview', href: '/dashboard/payments', icon: FiCreditCard },
    { name: 'By Invoice', href: '/dashboard/payments/by-invoice', icon: FiFileText }, // Example: filter payments by invoice
    { name: 'By Student', href: '/dashboard/payments/by-student', icon: FiUser }, // Example: filter payments by student
    { name: 'By Date', href: '/dashboard/payments/by-date', icon: FiCalendar }, // Example: filter payments by date
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