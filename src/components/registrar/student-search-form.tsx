// components/registrar/students/student-search-form.tsx
'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { FiSearch } from 'react-icons/fi';
import { useDebouncedCallback } from 'use-debounce';

export default function StudentSearchForm() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const handleSearch = useDebouncedCallback((term: string) => {
    const params = new URLSearchParams(searchParams);
    if (term) {
      params.set('query', term);
      params.set('page', '1');
    } else {
      params.delete('query');
    }
    router.replace(`/dashboard/registrar/students?${params.toString()}`);
  }, 300);

  return (
    <div className="mb-6">
      <div className="relative max-w-md">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <FiSearch className="w-5 h-5 text-gray-500" />
        </div>
        <input
          type="text"
          className="block w-full p-2 pl-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-emerald-500 focus:border-emerald-500"
          placeholder="Search students..."
          onChange={(e) => handleSearch(e.target.value)}
          defaultValue={searchParams.get('query')?.toString()}
        />
      </div>
    </div>
  );
}