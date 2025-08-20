'use client';

import { useState, useTransition } from 'react';
import { Input } from '@/components/ui/input';
import { GraduationListFilters, getGraduationList } from '@/lib/actions/registrar.graduation.action';
import { GraduationCandidateCard } from './graduation-candidate-card';

type GraduationListProps = {
  data: Awaited<ReturnType<typeof getGraduationList>>;
};

export default function GraduationList({ data }: GraduationListProps) {
  const [filters, setFilters] = useState<GraduationListFilters>({});
  const [filteredData, setFilteredData] = useState(data);
  const [isPending, startTransition] = useTransition();

  type FilterKey = keyof GraduationListFilters;
  type FilterValue<K extends FilterKey> = GraduationListFilters[K];

  const handleFilterChange = <K extends FilterKey>(key: K, value: FilterValue<K>) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    startTransition(async () => {
      const updated = await getGraduationList({ ...filters, [key]: value });
      setFilteredData(updated);
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-black">
        {/* Semester Filter */}
        <div className="relative">
          <select
            onChange={(e) => handleFilterChange('semesterId', Number(e.target.value))}
            value={filters.semesterId?.toString() || ''}
            disabled={isPending}
            className={`
              w-full h-10 pl-3 pr-8 rounded-lg border border-emerald-300 bg-white
              text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500
              appearance-none ${isPending ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <option value="">Filter by Semester</option>
            {data.filters.semesters.map((sem) => (
              <option key={sem.id} value={sem.id.toString()}>
                {sem.name}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-emerald-600">
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
        </div>

        {/* Program Filter */}
        <div className="relative">
          <select
            onChange={(e) => handleFilterChange('programId', Number(e.target.value))}
            value={filters.programId?.toString() || ''}
            disabled={isPending}
            className={`
              w-full h-10 pl-3 pr-8 rounded-lg border border-emerald-300 bg-white
              text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500
              appearance-none ${isPending ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <option value="">Filter by Program</option>
            {data.filters.programs.map((p) => (
              <option key={p.id} value={p.id.toString()}>
                {p.name}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-emerald-600">
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
        </div>

        {/* Department Filter */}
        <div className="relative">
          <select
            onChange={(e) => handleFilterChange('departmentId', Number(e.target.value))}
            value={filters.departmentId?.toString() || ''}
            disabled={isPending}
            className={`
              w-full h-10 pl-3 pr-8 rounded-lg border border-emerald-300 bg-white
              text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500
              appearance-none ${isPending ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <option value="">Filter by Department</option>
            {data.filters.departments.map((d) => (
              <option key={d.id} value={d.id.toString()}>
                {d.name}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-emerald-600">
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
        </div>

        {/* Graduation Status Filter */}
        <div className="relative">
          <select
            onChange={(e) => handleFilterChange(
              'graduationStatus',
              e.target.value as 'pending' | 'approved' | 'completed'
            )}
            value={filters.graduationStatus || ''}
            disabled={isPending}
            className={`
              w-full h-10 pl-3 pr-8 rounded-lg border border-emerald-300 bg-white
              text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500
              appearance-none ${isPending ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <option value="">Graduation Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="completed">Completed</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-emerald-600">
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      </div>

      <Input
        placeholder="Search by name or registration number"
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          handleFilterChange('searchQuery', e.target.value)
        }
        disabled={isPending}
      />

      <div className="text-sm text-gray-600">
        Showing {filteredData.candidates.length} candidates —{' '}
        {filteredData.stats.pending} pending, {filteredData.stats.approved} approved,{' '}
        {filteredData.stats.completed} completed
      </div>

      {isPending ? (
        <div className="text-center py-8">
          <p className="text-gray-500">Loading candidates...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
{filteredData.candidates.map((candidate) => {
  // Create a new object with the correct type for semestersCompleted
  const candidateWithNumberSemesters = {
    ...candidate,
    semestersCompleted: candidate.semestersCompleted ?? 0,
  };

return (
  <GraduationCandidateCard
    key={candidate.id}
    candidate={{
      ...candidateWithNumberSemesters,
      currentSemester: candidateWithNumberSemesters.currentSemester ?? '',
    }}
  />
);
})}
        </div>
      )}
    </div>
  );
}