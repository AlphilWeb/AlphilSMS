'use client';

import { useState, useTransition } from 'react';
import { Input } from '@/components/ui/input';
import { GraduationListFilters, getGraduationList } from '@/lib/actions/registrar.graduation.action';
import { Select, SelectItem } from '@/components/ui/select';
import { GraduationCandidateCard } from './graduation-candidate-card';
import { SelectTrigger, SelectValue } from '@radix-ui/react-select';
 // Assuming this component exists

type GraduationListProps = {
  data: Awaited<ReturnType<typeof getGraduationList>>;
};

export default function GraduationList({ data }: GraduationListProps) {
  const [filters, setFilters] = useState<GraduationListFilters>({});
  const [filteredData, setFilteredData] = useState(data);
  const [isPending, startTransition] = useTransition();

  // Helper type to allow only keys of GraduationListFilters for filtering
  type FilterKey = keyof GraduationListFilters;

  // Helper type to map keys to their expected value types
  type FilterValue<K extends FilterKey> = GraduationListFilters[K];

  // Strongly typed handler for all filter changes
  const handleFilterChange = <K extends FilterKey>(key: K, value: FilterValue<K>) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    startTransition(async () => {
      const updated = await getGraduationList({ ...filters, [key]: value });
      setFilteredData(updated);
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* The 'disabled' prop is applied to the SelectTrigger, not the Select wrapper */}
        <Select
          onValueChange={(val: string) => handleFilterChange('semesterId', Number(val))}
          value={filters.semesterId?.toString() || ''}
        >
          <SelectTrigger disabled={isPending}>
            <SelectValue placeholder="Filter by Semester" />
          </SelectTrigger>
          {data.filters.semesters.map((sem) => (
            <SelectItem key={sem.id} value={sem.id.toString()}>
              {sem.name}
            </SelectItem>
          ))}
        </Select>

        <Select
          onValueChange={(val: string) => handleFilterChange('programId', Number(val))}
          value={filters.programId?.toString() || ''}
        >
          <SelectTrigger disabled={isPending}>
            <SelectValue placeholder="Filter by Program" />
          </SelectTrigger>
          {data.filters.programs.map((p) => (
            <SelectItem key={p.id} value={p.id.toString()}>
              {p.name}
            </SelectItem>
          ))}
        </Select>

        <Select
          onValueChange={(val: string) => handleFilterChange('departmentId', Number(val))}
          value={filters.departmentId?.toString() || ''}
        >
          <SelectTrigger disabled={isPending}>
            <SelectValue placeholder="Filter by Department" />
          </SelectTrigger>
          {data.filters.departments.map((d) => (
            <SelectItem key={d.id} value={d.id.toString()}>
              {d.name}
            </SelectItem>
          ))}
        </Select>

        <Select
          onValueChange={(val) =>
            handleFilterChange(
              'graduationStatus',
              val as 'pending' | 'approved' | 'completed'
            )
          }
          value={filters.graduationStatus || ''}
        >
          <SelectTrigger disabled={isPending}>
            <SelectValue placeholder="Graduation Status" />
          </SelectTrigger>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="approved">Approved</SelectItem>
          <SelectItem value="completed">Completed</SelectItem>
        </Select>
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
          {filteredData.candidates.map((candidate) => (
            <GraduationCandidateCard key={candidate.id} candidate={candidate} />
          ))}
        </div>
      )}
    </div>
  );
}