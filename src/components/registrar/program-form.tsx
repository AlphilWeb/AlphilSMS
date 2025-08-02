// components/registrar/programs/program-form.tsx
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { FiSave, FiX, FiCheck } from 'react-icons/fi';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { getAllDepartments } from '@/lib/actions/registrar.department.actions';

const programSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  code: z.string().min(1, 'Code is required'),
  departmentId: z.number().min(1, 'Department is required'),
  durationSemesters: z.number().min(1, 'Duration must be at least 1 semester'),
});

type ProgramFormValues = z.infer<typeof programSchema>;

// Define a type for your department data
interface Department {
  id: number;
  name: string;
}

export default function ProgramForm({
  initialData,
  onSubmit,
  onCancel,
  title = 'Program',
  formStatus,
}: {
  initialData?: Partial<ProgramFormValues>;
  onSubmit: (data: ProgramFormValues) => Promise<void>;
  onCancel: () => void;
  title?: string;
  formStatus?: { success: string | null; error: string | null };
}) {
  // Use the new Department type instead of any[]
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },

  } = useForm<ProgramFormValues>({
    resolver: zodResolver(programSchema),
    defaultValues: initialData || {
      name: '',
      code: '',
      departmentId: 0,
      durationSemesters: 4,
    },
  });

  useEffect(() => {
    const fetchDepartments = async () => {
      // Ensure getAllDepartments returns data of type Department[]
      const data = await getAllDepartments();
      setDepartments(data);
    };
    fetchDepartments();
  }, []);

  const handleFormSubmit = async (data: ProgramFormValues) => {
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Program Name</label>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Program Code</label>
            <input
              type="text"
              {...register('code')}
              className={`w-full px-4 py-2.5 border rounded-lg ${
                errors.code ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-emerald-500'
              }`}
            />
            {errors.code && (
              <p className="mt-1 text-sm text-red-600">{errors.code.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
            <select
              {...register('departmentId', { valueAsNumber: true })}
              className={`w-full px-4 py-2.5 border rounded-lg ${
                errors.departmentId ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-emerald-500'
              }`}
            >
              <option value={0}>Select a department</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
            {errors.departmentId && (
              <p className="mt-1 text-sm text-red-600">{errors.departmentId.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Duration (Semesters)</label>
            <input
              type="number"
              min="1"
              {...register('durationSemesters', { valueAsNumber: true })}
              className={`w-full px-4 py-2.5 border rounded-lg ${
                errors.durationSemesters ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-emerald-500'
              }`}
            />
            {errors.durationSemesters && (
              <p className="mt-1 text-sm text-red-600">{errors.durationSemesters.message}</p>
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