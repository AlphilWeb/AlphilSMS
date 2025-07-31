// components/registrar/semesters/semesters-list.tsx
'use client';

import { useState } from 'react';
import { FiEdit, FiCalendar, FiTrash2, FiPlus } from 'react-icons/fi';
import { deleteSemester } from '@/lib/actions/semester.action';
import SemesterForm from './semester-form';

export default function SemestersList({ semesters }: { semesters: any[] }) {
  const [editSemester, setEditSemester] = useState<any | null>(null);
  const [showAddSemester, setShowAddSemester] = useState(false);
  const [formStatus, setFormStatus] = useState<{ success: string | null; error: string | null }>({ 
    success: null, 
    error: null 
  });

  const handleDelete = async (semesterId: number) => {
    if (!confirm('Are you sure you want to delete this semester?')) return;
    try {
      await deleteSemester(semesterId);
      setFormStatus({ success: 'Semester deleted successfully!', error: null });
      window.location.reload();
    } catch (error: any) {
      setFormStatus({ success: null, error: error.message || 'Failed to delete semester.' });
    }
  };

  return (
    <div className="overflow-x-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Semesters</h2>
        <button
          onClick={() => setShowAddSemester(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700"
        >
          <FiPlus className="-ml-1 mr-2 h-5 w-5" />
          Add Semester
        </button>
      </div>

      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Semester
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Duration
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {semesters.map((semester) => (
            <tr key={semester.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center mr-3">
                    <FiCalendar className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div className="text-sm font-medium text-gray-900">{semester.name}</div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-500">
                  {new Date(semester.startDate).toLocaleDateString()} - {new Date(semester.endDate).toLocaleDateString()}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button
                  onClick={() => setEditSemester(semester)}
                  className="text-emerald-600 hover:text-emerald-800 p-2 rounded-full hover:bg-emerald-50 mr-2"
                >
                  <FiEdit className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleDelete(semester.id)}
                  className="text-red-600 hover:text-red-800 p-2 rounded-full hover:bg-red-50"
                >
                  <FiTrash2 className="w-5 h-5" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Edit Semester Modal */}
      {editSemester && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <SemesterForm
            initialData={editSemester}
            onSubmit={async (data) => {
              try {
                // You would call updateSemester here
                setFormStatus({ success: 'Semester updated successfully!', error: null });
                setEditSemester(null);
                window.location.reload();
              } catch (error: any) {
                setFormStatus({ success: null, error: error.message || 'Failed to update semester.' });
              }
            }}
            onCancel={() => {
              setEditSemester(null);
              setFormStatus({ success: null, error: null });
            }}
            title="Edit Semester"
            formStatus={formStatus}
          />
        </div>
      )}

      {/* Add Semester Modal */}
      {showAddSemester && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <SemesterForm
            onSubmit={async (data) => {
              try {
                // You would call createSemester here
                setFormStatus({ success: 'Semester created successfully!', error: null });
                setShowAddSemester(false);
                window.location.reload();
              } catch (error: any) {
                setFormStatus({ success: null, error: error.message || 'Failed to create semester.' });
              }
            }}
            onCancel={() => {
              setShowAddSemester(false);
              setFormStatus({ success: null, error: null });
            }}
            title="Add New Semester"
            formStatus={formStatus}
          />
        </div>
      )}
    </div>
  );
}