'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { FiSave, FiX, FiCheck } from 'react-icons/fi';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  getProgramsForSelect,
  getSemestersForSelect,
} from '@/lib/actions/registrar.courses.action';

const courseSchema = z.object({
  programId: z.number().min(1, 'Program is required'),
  semesterId: z.number().min(1, 'Semester is required'),
  name: z.string().min(1, 'Name is required'),
  code: z.string().min(1, 'Code is required'),
  credits: z.number().min(0.5, 'Credits must be at least 0.5'),
  description: z.string().optional(),
});

type CourseFormValues = z.infer<typeof courseSchema>;

type Program = {
  id: number;
  name: string;
  code: string;
};

type Semester = {
  id: number;
  name: string;
};

export default function CourseForm({
  initialData,
  onSubmit,
  onCancel,
  title = 'Course',
  formStatus,
}: {
  initialData?: Partial<CourseFormValues>;
  onSubmit: (data: CourseFormValues) => Promise<void>;
  onCancel: () => void;
  title?: string;
  formStatus?: { success: string | null; error: string | null };
}) {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    
  } = useForm<CourseFormValues>({
    resolver: zodResolver(courseSchema),
    defaultValues: initialData || {
      programId: 0,
      semesterId: 0,
      name: '',
      code: '',
      credits: 3,
      description: '',
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      const [programsData, semestersData] = await Promise.all([
        getProgramsForSelect(),
        getSemestersForSelect(),
      ]);
      setPrograms(programsData);
      setSemesters(semestersData);
    };
    fetchData();
  }, []);

  const handleFormSubmit = async (data: CourseFormValues) => {
    setLoading(true);
    try {
      await onSubmit(data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-xl">
      <div className="flex justify-between items-center border-b p-6">
        <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
        <button
          onClick={onCancel}
          className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
        >
          <FiX size={24} />
        </button>
      </div>

      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <div className="p-6 space-y-4">
          {formStatus?.error && (
            <div className="p-2 bg-red-100 text-red-700 rounded flex gap-2 items-center">
              <FiX /> {formStatus.error}
            </div>
          )}
          {formStatus?.success && (
            <div className="p-2 bg-green-100 text-green-700 rounded flex gap-2 items-center">
              <FiCheck /> {formStatus.success}
            </div>
          )}

          {/* Program */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Program</label>
            <select
              {...register('programId', { valueAsNumber: true })}
              className={`w-full px-4 py-2.5 border rounded-lg ${
                errors.programId
                  ? 'border-red-300 focus:border-red-500'
                  : 'border-gray-300 focus:border-emerald-500'
              }`}
            >
              <option value={0}>Select a program</option>
              {programs.map((program) => (
                <option key={program.id} value={program.id}>
                  {program.name} ({program.code})
                </option>
              ))}
            </select>
            {errors.programId && (
              <p className="mt-1 text-sm text-red-600">{errors.programId.message}</p>
            )}
          </div>

          {/* Semester */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
            <select
              {...register('semesterId', { valueAsNumber: true })}
              className={`w-full px-4 py-2.5 border rounded-lg ${
                errors.semesterId
                  ? 'border-red-300 focus:border-red-500'
                  : 'border-gray-300 focus:border-emerald-500'
              }`}
            >
              <option value={0}>Select a semester</option>
              {semesters.map((semester) => (
                <option key={semester.id} value={semester.id}>
                  {semester.name}
                </option>
              ))}
            </select>
            {errors.semesterId && (
              <p className="mt-1 text-sm text-red-600">{errors.semesterId.message}</p>
            )}
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Course Name</label>
            <input
              type="text"
              {...register('name')}
              className={`w-full px-4 py-2.5 border rounded-lg ${
                errors.name
                  ? 'border-red-300 focus:border-red-500'
                  : 'border-gray-300 focus:border-emerald-500'
              }`}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          {/* Code */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Course Code</label>
            <input
              type="text"
              {...register('code')}
              className={`w-full px-4 py-2.5 border rounded-lg ${
                errors.code
                  ? 'border-red-300 focus:border-red-500'
                  : 'border-gray-300 focus:border-emerald-500'
              }`}
            />
            {errors.code && (
              <p className="mt-1 text-sm text-red-600">{errors.code.message}</p>
            )}
          </div>

          {/* Credits */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Credits</label>
            <input
              type="number"
              step="0.5"
              min="0.5"
              {...register('credits', { valueAsNumber: true })}
              className={`w-full px-4 py-2.5 border rounded-lg ${
                errors.credits
                  ? 'border-red-300 focus:border-red-500'
                  : 'border-gray-300 focus:border-emerald-500'
              }`}
            />
            {errors.credits && (
              <p className="mt-1 text-sm text-red-600">{errors.credits.message}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description (Optional)
            </label>
            <textarea
              {...register('description')}
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:border-emerald-500"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-lg hover:from-emerald-700 hover:to-emerald-600 disabled:opacity-50"
          >
            {loading ? 'Saving...' : (
              <>
                <FiSave className="inline mr-1" /> Save
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
