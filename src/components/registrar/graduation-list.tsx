// src/components/registrar/graduation-list/index.tsx
'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { GraduationListFilters, getGraduationList } from '@/lib/actions/registrar.graduation.action';
import { Select, SelectItem } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { GraduationCandidateCard } from './graduation-candidate-card';
import { useTransition } from 'react';

type GraduationListProps = {
  data: Awaited<ReturnType<typeof getGraduationList>>;
};

export default function GraduationList({ data }: GraduationListProps) {
  const [filters, setFilters] = useState<GraduationListFilters>({});
  const [filteredData, setFilteredData] = useState(data);
  const [isPending, startTransition] = useTransition();

  const handleFilterChange = (key: keyof GraduationListFilters, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    startTransition(async () => {
      const updated = await getGraduationList({ ...filters, [key]: value });
      setFilteredData(updated);
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Select
          placeholder="Filter by Semester"
          onValueChange={(val: any) => handleFilterChange('semesterId', Number(val))}
        >
          {data.filters.semesters.map((sem) => (
            <SelectItem key={sem.id} value={sem.id.toString()}>
              {sem.name}
            </SelectItem>
          ))}
        </Select>

        <Select
          placeholder="Filter by Program"
          onValueChange={(val: any) => handleFilterChange('programId', Number(val))}
        >
          {data.filters.programs.map((p) => (
            <SelectItem key={p.id} value={p.id.toString()}>
              {p.name}
            </SelectItem>
          ))}
        </Select>

        <Select
          placeholder="Filter by Department"
          onValueChange={(val: any) => handleFilterChange('departmentId', Number(val))}
        >
          {data.filters.departments.map((d) => (
            <SelectItem key={d.id} value={d.id.toString()}>
              {d.name}
            </SelectItem>
          ))}
        </Select>

        <Select
          placeholder="Graduation Status"
          onValueChange={(val: any) => handleFilterChange('graduationStatus', val)}
        >
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="approved">Approved</SelectItem>
          <SelectItem value="completed">Completed</SelectItem>
        </Select>
      </div>

      <Input
        placeholder="Search by name or registration number"
        onChange={(e: { target: { value: any; }; }) => handleFilterChange('searchQuery', e.target.value)}
      />

      <div className="text-sm text-gray-600">
        Showing {filteredData.candidates.length} candidates —{' '}
        {filteredData.stats.pending} pending, {filteredData.stats.approved} approved,{' '}
        {filteredData.stats.completed} completed
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredData.candidates.map((candidate) => (
          <GraduationCandidateCard key={candidate.id} candidate={candidate} />
        ))}
      </div>
    </div>
  );
}
