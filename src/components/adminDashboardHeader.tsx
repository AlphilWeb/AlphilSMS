"use client"

import Image from "next/image"
import { usePathname } from "next/navigation";
import { CgProfile } from "react-icons/cg";
import { FiLogOut } from "react-icons/fi";
import { RxDashboard } from "react-icons/rx";
import { FiUsers, FiBook, FiDollarSign, FiActivity, FiSettings } from "react-icons/fi";
import Link from "next/link";

export default function AdminDashboardHeader() {
  const pathname = usePathname();

  const navItems = [
    { href: "/dashboard/admin", icon: <RxDashboard />, label: "Dashboard" },
    { href: "/dashboard/admin/users", icon: <FiUsers />, label: "Users" },
    { href: "/dashboard/admin/courses", icon: <FiBook />, label: "Courses" },
    { href: "/dashboard/admin/finance", icon: <FiDollarSign />, label: "Finance" },
    { href: "/dashboard/admin/logs", icon: <FiActivity />, label: "Logs" },
    { href: "/dashboard/admin/settings", icon: <FiSettings />, label: "Settings" },
  ];

  return (
    <>
      <div className="bg-white sticky top-0 z-50 shadow-sm">
        <div className="p-0.5 flex flex-row justify-between">
          <div className="flex flex-row">
            <Image
              src="/favicon_io/android-chrome-192x192.png"
              alt="School Logo"
              width={50}
              height={20}
              className="p-1"
              priority
            />
            <h1 className="font-bold p-3 text-black">ALPHIL TRAINING COLLEGE</h1>
          </div>
          <div className="flex flex-row gap-3 p-3">
            <CgProfile size={30} color="#022c22" />
            <FiLogOut size={30} color="#022c22" />
          </div>
        </div>
      </div>

      <aside className="w-55 px-3 bg-[#F3F4F6] text-black fixed left-0 top-[58px] h-[calc(100vh-58px)] overflow-y-auto border-r border-gray-200">
        <div className="space-y-6">
          <div className="flex items-center space-x-2 p-2 border-b border-[#022c22] pb-4">
            <RxDashboard className="text-xl" />
            <span className="text-xl font-semibold">Admin Panel</span>
          </div>

          <nav>
            <ul className="space-y-3">
              {navItems.map(({ href, icon, label }) => (
                <li key={href}>
                  <Link href={href}>
                    <div
                      className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors ${
                        pathname === href
                          ? "bg-[#011e1a] text-white"
                          : "bg-[#022c22] text-white hover:bg-[#022c19f1]"
                      }`}
                    >
                      {icon}
                      <span>{label}</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </aside>
    </>
  )
};
