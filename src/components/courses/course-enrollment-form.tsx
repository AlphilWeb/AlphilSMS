// components/student/courses/course-enrollment-form.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { enrollInCourse } from '@/lib/actions/student.course.actions';
import { toast } from 'sonner';
import { FiCheckSquare, FiSquare, FiBook, FiUser, FiAward } from 'react-icons/fi';

interface Course {
  id: number;
  name: string;
  code: string;
  credits: number;
  description: string | null;
  lecturer: {
    firstName: string | null;
    lastName: string | null;
  } | null;
}

interface CourseEnrollmentFormProps {
  availableCourses: Course[];
}

export default function CourseEnrollmentForm({ availableCourses }: CourseEnrollmentFormProps) {
  const router = useRouter();
  const [selectedCourseIds, setSelectedCourseIds] = useState<Set<number>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleCourseSelection = (courseId: number) => {
    setSelectedCourseIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(courseId)) {
        newSet.delete(courseId);
      } else {
        newSet.add(courseId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedCourseIds.size === availableCourses.length) {
      setSelectedCourseIds(new Set());
    } else {
      setSelectedCourseIds(new Set(availableCourses.map(course => course.id)));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCourseIds.size === 0) return;

    setIsSubmitting(true);
    try {
      // Enroll in all selected courses
      const enrollmentPromises = Array.from(selectedCourseIds).map(courseId => 
        enrollInCourse(courseId)
      );
      
      await Promise.all(enrollmentPromises);
      
      toast.success(`Successfully enrolled in ${selectedCourseIds.size} course${selectedCourseIds.size > 1 ? 's' : ''}`);
      router.push('/dashboard/student/courses');
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to enroll in courses');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedCount = selectedCourseIds.size;
  const allSelected = selectedCourseIds.size === availableCourses.length && availableCourses.length > 0;

  return (
    <div className="space-y-6">
      {availableCourses.length === 0 ? (
        <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg">
          <FiBook className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-lg">No courses available for enrollment</p>
          <p className="text-sm mt-1">in your current program and semester.</p>
        </div>
      ) : (
        <>
          {/* Header with Select All */}
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-800">
              Available Courses ({availableCourses.length})
            </h2>
            <button
              type="button"
              onClick={toggleSelectAll}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              {allSelected ? (
                <FiCheckSquare className="h-4 w-4 text-emerald-600" />
              ) : (
                <FiSquare className="h-4 w-4 text-gray-400" />
              )}
              {allSelected ? 'Deselect All' : 'Select All'}
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Courses Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableCourses.map((course) => {
                const isSelected = selectedCourseIds.has(course.id);
                
                return (
                  <div
                    key={course.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500 ring-opacity-20'
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                    }`}
                    onClick={() => toggleCourseSelection(course.id)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-800 text-sm line-clamp-2 mb-1">
                          {course.name}
                        </h3>
                        <p className="text-xs text-gray-500 font-mono mb-2">
                          {course.code}
                        </p>
                      </div>
                      {isSelected ? (
                        <FiCheckSquare className="h-5 w-5 text-emerald-600 flex-shrink-0 ml-2" />
                      ) : (
                        <FiSquare className="h-5 w-5 text-gray-400 flex-shrink-0 ml-2" />
                      )}
                    </div>

                    <div className="space-y-2 text-xs text-gray-600">
                      <div className="flex items-center gap-1">
                        <FiAward className="h-3 w-3" />
                        <span>{course.credits} credits</span>
                      </div>
                      
                      {course.lecturer && (
                        <div className="flex items-center gap-1">
                          <FiUser className="h-3 w-3" />
                          <span className="line-clamp-1">
                            {course.lecturer.firstName} {course.lecturer.lastName}
                          </span>
                        </div>
                      )}
                    </div>

                    {course.description && (
                      <p className="mt-3 text-xs text-gray-600 line-clamp-3">
                        {course.description}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Submit Section */}
            {selectedCount > 0 && (
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    <span className="font-medium text-emerald-600">{selectedCount}</span>
                    {' '}course{selectedCount > 1 ? 's' : ''} selected for enrollment
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`px-6 py-2 rounded-lg text-white font-medium ${
                      isSubmitting
                        ? 'bg-emerald-400 cursor-not-allowed'
                        : 'bg-emerald-600 hover:bg-emerald-700'
                    } transition-colors`}
                  >
                    {isSubmitting ? (
                      <>Enrolling {selectedCount} courses...</>
                    ) : (
                      <>Enroll in {selectedCount} Course{selectedCount > 1 ? 's' : ''}</>
                    )}
                  </button>
                </div>
              </div>
            )}
          </form>

          {/* Empty State when no courses selected */}
          {selectedCount === 0 && (
            <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
              <FiBook className="mx-auto h-8 w-8 text-gray-400 mb-2" />
              <p className="text-sm">Select courses above to enroll</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}