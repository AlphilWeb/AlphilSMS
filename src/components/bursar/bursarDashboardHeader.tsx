'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  FiBell,
  FiChevronDown,
  FiHome,
  FiUsers,
  FiDollarSign,
  FiFileText,
  
  
  FiLogOut,
  FiMenu,
  FiX,
  FiCreditCard
} from 'react-icons/fi';
import { useState, useEffect } from 'react';
import { getBursarHeaderData, logoutBursar } from '@/lib/actions/bursar/dashboard.header.action';
import { useQuery } from '@tanstack/react-query';

export default function BursarDashboardHeader() {
  const pathname = usePathname();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Fetch bursar data using React Query
  const { data: bursarData, isLoading, error } = useQuery({
    queryKey: ['bursarHeaderData'],
    queryFn: getBursarHeaderData,
  });

  // Close the mobile menu automatically when the route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Navigation items specific to Bursar's portal
  const navItems = [
    {
      category: "Overview",
      items: [
        { href: "/dashboard/finance", icon: <FiHome className="w-5 h-5" />, label: "Dashboard" }
      ]
    },
    {
      category: "Fee Management",
      items: [
        { href: "/dashboard/finance/fee-structures", icon: <FiDollarSign className="w-5 h-5" />, label: "Fee Structures" },
      ]
    },
    {
      category: "Payments",
      items: [
        { href: "/dashboard/finance/invoices", icon: <FiFileText className="w-5 h-5" />, label: "Invoices" },
        { href: "/dashboard/finance/payments", icon: <FiCreditCard className="w-5 h-5" />, label: "Payment Records" },
      ]
    },
    {
      category: "Staff Payments",
      items: [
        { href: "/dashboard/finance/salaries", icon: <FiDollarSign className="w-5 h-5" />, label: "Salary Payments" },
        { href: "/dashboard/finance/payroll", icon: <FiUsers className="w-5 h-5" />, label: "Payroll Management" }
      ]
    }
  ];

  const handleLogout = async () => {
    await logoutBursar();
  };

  if (error) {
    console.error('Error fetching bursar data:', error);
    // You might want to redirect to login or show an error message
  }

  return (
    <>
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="px-6 py-3 flex items-center justify-between">
          {/* Logo/Branding and Hamburger menu button for mobile */}
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-md text-gray-600 hover:bg-gray-100"
            >
              {isMobileMenuOpen ? (
                <FiX className="w-6 h-6" />
              ) : (
                <FiMenu className="w-6 h-6" />
              )}
            </button>
            <Image
              src="/icon.jpg" 
              alt="Alphil Training College"
              width={50}
              height={50}
              className="h-16 w-auto"
            />
            <h1 className="text-xl mt-8 font-bold text-pink-500 hidden md:block">ALPHIL TRAINING COLLEGE</h1>
          </div>

          {/* User controls */}
          <div className="flex items-center space-x-6">
            {/* Notifications */}
            <button className="relative p-1 rounded-full text-gray-600 hover:text-gray-900 hover:bg-gray-100">
              <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                {bursarData?.notificationCount || 0}
              </span>
              <FiBell className="w-6 h-6" />
            </button>

            {/* User profile dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center space-x-2 focus:outline-none"
              >
                <div className="h-8 w-8 rounded-full bg-gray-200 overflow-hidden">
                  <Image
                    src={bursarData?.avatar || '/default-avatar.jpg'}
                    alt="User avatar"
                    width={32}
                    height={32}
                    className="h-full w-full object-contain"
                  />
                </div>
                {!isLoading && bursarData && (
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-medium text-gray-800">{bursarData.name}</p>
                    <p className="text-xs text-gray-500">{bursarData.position}</p>
                  </div>
                )}
                <FiChevronDown className="hidden md:block w-4 h-4 text-gray-500" />
              </button>

              {/* Dropdown menu */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                  <div className="px-4 py-3">
                    <p className="text-sm font-medium text-gray-900">{bursarData?.name || 'Loading...'}</p>
                    <p className="text-sm text-gray-500 truncate">{bursarData?.position || 'Bursar'}</p>
                  </div>

                  <div className="border-t border-gray-100"></div>
                  <div className="py-1">
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <FiLogOut className="mr-3 h-5 w-5 text-gray-400" />
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile menu overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-gray-900 opacity-50 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <aside className={`fixed top-16 left-0 z-40 w-64 h-[calc(100vh-4rem)] transition-transform border-r border-gray-200 bg-white overflow-y-auto ${
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      } md:translate-x-0`}>
        <div className="px-4 py-6">
          {/* Navigation */}
          <nav className="space-y-8">
            {navItems.map((section) => (
              <div key={section.category} className="space-y-2">
                <h3 className="px-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  {section.category}
                </h3>
                <ul className="space-y-1">
                  {section.items.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                          pathname === item.href
                            ? "bg-blue-50 text-emerald-800"
                            : "text-gray-700 hover:bg-gray-100"
                        }`}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <span className={`mr-3 ${
                          pathname === item.href ? "text-emerald-800" : "text-gray-400"
                        }`}>
                          {item.icon}
                        </span>
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>
      </aside>
    </>
  );
}