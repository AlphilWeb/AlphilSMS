// components/registrar/courses/courses-list.tsx
'use client';

import { useState } from 'react';
import { FiEdit, FiBook, FiLayers, FiTrash2, FiPlus } from 'react-icons/fi';
import { deleteCourse } from '@/lib/actions/registrar.courses.action';
import CourseForm from './course-form';

export default function CoursesList({ courses }: { courses: any[] }) {
  const [editCourse, setEditCourse] = useState<any | null>(null);
  const [showAddCourse, setShowAddCourse] = useState(false);
  const [formStatus, setFormStatus] = useState<{ success: string | null; error: string | null }>({ 
    success: null, 
    error: null 
  });

  const handleDelete = async (courseId: number) => {
    if (!confirm('Are you sure you want to delete this course?')) return;
    try {
      await deleteCourse(courseId);
      setFormStatus({ success: 'Course deleted successfully!', error: null });
      window.location.reload();
    } catch (error: any) {
      setFormStatus({ success: null, error: error.message || 'Failed to delete course.' });
    }
  };

  return (
    <div className="overflow-x-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Courses</h2>
        <button
          onClick={() => setShowAddCourse(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700"
        >
          <FiPlus className="-ml-1 mr-2 h-5 w-5" />
          Add Course
        </button>
      </div>

      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Course
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Program
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Semester
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Credits
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {courses.map((course) => (
            <tr key={course.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center mr-3">
                    <FiBook className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{course.name}</div>
                    <div className="text-sm text-gray-500">{course.code}</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                    <FiLayers className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-900">{course.program?.name}</div>
                    <div className="text-sm text-gray-500">{course.program?.code}</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {course.semester?.name}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {course.credits}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button
                  onClick={() => setEditCourse(course)}
                  className="text-emerald-600 hover:text-emerald-800 p-2 rounded-full hover:bg-emerald-50 mr-2"
                >
                  <FiEdit className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleDelete(course.id)}
                  className="text-red-600 hover:text-red-800 p-2 rounded-full hover:bg-red-50"
                >
                  <FiTrash2 className="w-5 h-5" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Edit Course Modal */}
      {editCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <CourseForm
            initialData={editCourse}
            onSubmit={async (data) => {
              try {
                // You would call updateCourse here
                setFormStatus({ success: 'Course updated successfully!', error: null });
                setEditCourse(null);
                window.location.reload();
              } catch (error: any) {
                setFormStatus({ success: null, error: error.message || 'Failed to update course.' });
              }
            }}
            onCancel={() => {
              setEditCourse(null);
              setFormStatus({ success: null, error: null });
            }}
            title="Edit Course"
            formStatus={formStatus}
          />
        </div>
      )}

      {/* Add Course Modal */}
      {showAddCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <CourseForm
            onSubmit={async (data) => {
              try {
                // You would call createCourse here
                setFormStatus({ success: 'Course created successfully!', error: null });
                setShowAddCourse(false);
                window.location.reload();
              } catch (error: any) {
                setFormStatus({ success: null, error: error.message || 'Failed to create course.' });
              }
            }}
            onCancel={() => {
              setShowAddCourse(false);
              setFormStatus({ success: null, error: null });
            }}
            title="Add New Course"
            formStatus={formStatus}
          />
        </div>
      )}
    </div>
  );
}