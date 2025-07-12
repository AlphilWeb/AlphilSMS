'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const UsersNav = () => {
  const pathname = usePathname();

  const navItems = [
    { name: 'All', href: '/dashboard/admin/users' },
    { name: 'Staff', href: '/dashboard/admin/users/staff' },
    { name: 'Students', href: '/dashboard/admin/users/students' },
  ];

  return (
    <div className="flex gap-4 mb-4 px-6">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.name}
            href={item.href}
            className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
              isActive
                ? 'bg-emerald-700 text-white shadow'
                : 'bg-emerald-900 text-white hover:bg-emerald-700'
            }`}
          >
            {item.name}
          </Link>
        );
      })}
    </div>
  );
};

export default UsersNav;
