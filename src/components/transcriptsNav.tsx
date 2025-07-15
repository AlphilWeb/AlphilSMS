// components/transcriptsNav.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FiFileText, FiUser, FiCalendar, FiSearch } from 'react-icons/fi'; // Example icons

export default function TranscriptsNav() {
  const pathname = usePathname();

  const navItems = [
    { name: 'Overview', href: '/dashboard/transcripts', icon: FiFileText },
    { name: 'By Student', href: '/dashboard/transcripts/by-student', icon: FiUser }, // Example: view transcripts by student
    { name: 'By Semester', href: '/dashboard/transcripts/by-semester', icon: FiCalendar }, // Example: view transcripts by semester
    { name: 'Search Transcripts', href: '/dashboard/transcripts/search', icon: FiSearch }, // Example: a dedicated search page
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