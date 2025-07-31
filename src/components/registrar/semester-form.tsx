// components/registrar/semesters/semester-form.tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { FiSave, FiX, FiCheck } from 'react-icons/fi';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const semesterSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
});

type SemesterFormValues = z.infer<typeof semesterSchema>;

export default function SemesterForm({
  initialData,
  onSubmit,
  onCancel,
  title = 'Semester',
  formStatus,
}: {
  initialData?: Partial<SemesterFormValues>;
  onSubmit: (data: SemesterFormValues) => Promise<void>;
  onCancel: () => void;
  title?: string;
  formStatus?: { success: string | null; error: string | null };
}) {
  const [loading, setLoading] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SemesterFormValues>({
    resolver: zodResolver(semesterSchema),
    defaultValues: initialData || {
      name: '',
      startDate: '',
      endDate: '',
    },
  });

  const handleFormSubmit = async (data: SemesterFormValues) => {
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
          {/* Status Messages */}
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

          {/* Form Fields */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Semester Name</label>
            <input
              type="text"
              {...register('name')}
              className={`w-full px-4 py-2.5 border rounded-lg ${
                errors.name ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-emerald-500'
              }`}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              {...register('startDate')}
              className={`w-full px-4 py-2.5 border rounded-lg ${
                errors.startDate ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-emerald-500'
              }`}
            />
            {errors.startDate && (
              <p className="mt-1 text-sm text-red-600">{errors.startDate.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              {...register('endDate')}
              className={`w-full px-4 py-2.5 border rounded-lg ${
                errors.endDate ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-emerald-500'
              }`}
            />
            {errors.endDate && (
              <p className="mt-1 text-sm text-red-600">{errors.endDate.message}</p>
            )}
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