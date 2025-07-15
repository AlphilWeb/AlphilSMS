// components/studentsNav.tsx
'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FiFilter, FiUpload, FiDownload } from "react-icons/fi";

export default function StudentsNav() {
  const pathname = usePathname();
  
  return (
    <div className="flex items-center gap-3">
      <button className="flex items-center gap-1 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 rounded-lg text-sm transition-colors">
        <FiFilter /> Filters
      </button>
      <button className="flex items-center gap-1 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 rounded-lg text-sm transition-colors">
        <FiUpload /> Import
      </button>
      <button className="flex items-center gap-1 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 rounded-lg text-sm transition-colors">
        <FiDownload /> Export
      </button>
    </div>
  );
}