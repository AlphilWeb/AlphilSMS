// components/registrar/timetables/timetable-form.tsx
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { FiSave, FiX, FiCheck, FiClock, FiCalendar } from 'react-icons/fi';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  getSemestersForSelect, 
  getCoursesForSelect,
  getLecturersForSelect
} from '@/lib/actions/registrar.timetable.action';

const timetableSchema = z.object({
  semesterId: z.number().min(1, 'Semester is required'),
  courseId: z.number().min(1, 'Course is required'),
  lecturerId: z.number().min(1, 'Lecturer is required'),
  dayOfWeek: z.string().min(1, 'Day is required'),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  room: z.string().optional(),
});

type TimetableFormValues = z.infer<typeof timetableSchema>;

const daysOfWeek = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday'
];

export default function TimetableForm({
  initialData,
  onSubmit,
  onCancel,
  title = 'Timetable',
  formStatus,
}: {
  initialData?: Partial<TimetableFormValues>;
  onSubmit: (data: TimetableFormValues) => Promise<void>;
  onCancel: () => void;
  title?: string;
  formStatus?: { success: string | null; error: string | null };
}) {
  const [semesters, setSemesters] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [lecturers, setLecturers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TimetableFormValues>({
    resolver: zodResolver(timetableSchema),
    defaultValues: initialData || {
      semesterId: 0,
      courseId: 0,
      lecturerId: 0,
      dayOfWeek: '',
      startTime: '',
      endTime: '',
      room: '',
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      const [semestersData, coursesData, lecturersData] = await Promise.all([
        getSemestersForSelect(),
        getCoursesForSelect(),
        getLecturersForSelect(),
      ]);
      setSemesters(semestersData);
      setCourses(coursesData);
      setLecturers(lecturersData);
    };
    fetchData();
  }, []);

  const handleFormSubmit = async (data: TimetableFormValues) => {
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
            <select
              {...register('semesterId', { valueAsNumber: true })}
              className={`w-full px-4 py-2.5 border rounded-lg ${
                errors.semesterId ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-emerald-500'
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
            <select
              {...register('courseId', { valueAsNumber: true })}
              className={`w-full px-4 py-2.5 border rounded-lg ${
                errors.courseId ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-emerald-500'
              }`}
            >
              <option value={0}>Select a course</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.code} - {course.name}
                </option>
              ))}
            </select>
            {errors.courseId && (
              <p className="mt-1 text-sm text-red-600">{errors.courseId.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Lecturer</label>
            <select
              {...register('lecturerId', { valueAsNumber: true })}
              className={`w-full px-4 py-2.5 border rounded-lg ${
                errors.lecturerId ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-emerald-500'
              }`}
            >
              <option value={0}>Select a lecturer</option>
              {lecturers.map((lecturer) => (
                <option key={lecturer.id} value={lecturer.id}>
                  {lecturer.lastName}, {lecturer.firstName}
                </option>
              ))}
            </select>
            {errors.lecturerId && (
              <p className="mt-1 text-sm text-red-600">{errors.lecturerId.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Day of Week</label>
            <select
              {...register('dayOfWeek')}
              className={`w-full px-4 py-2.5 border rounded-lg ${
                errors.dayOfWeek ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-emerald-500'
              }`}
            >
              <option value="">Select a day</option>
              {daysOfWeek.map((day) => (
                <option key={day} value={day}>
                  {day}
                </option>
              ))}
            </select>
            {errors.dayOfWeek && (
              <p className="mt-1 text-sm text-red-600">{errors.dayOfWeek.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <FiClock className="text-gray-400" />
                </div>
                <input
                  type="time"
                  {...register('startTime')}
                  className={`w-full pl-10 px-4 py-2.5 border rounded-lg ${
                    errors.startTime ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-emerald-500'
                  }`}
                />
              </div>
              {errors.startTime && (
                <p className="mt-1 text-sm text-red-600">{errors.startTime.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <FiClock className="text-gray-400" />
                </div>
                <input
                  type="time"
                  {...register('endTime')}
                  className={`w-full pl-10 px-4 py-2.5 border rounded-lg ${
                    errors.endTime ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-emerald-500'
                  }`}
                />
              </div>
              {errors.endTime && (
                <p className="mt-1 text-sm text-red-600">{errors.endTime.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Room (Optional)</label>
            <input
              type="text"
              {...register('room')}
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