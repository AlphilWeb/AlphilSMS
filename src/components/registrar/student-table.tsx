// components/registrar/students/students-table.tsx
'use client';

import { useState } from 'react';
import { FiEdit, FiFileText, FiX, FiSave, FiCheck } from 'react-icons/fi';
import Pagination from '../ui/pagination';
import { updateStudentRecord } from '@/lib/actions/registrar.students.action';

export default function StudentsTable({
  students,
  currentPage,
  totalPages,
}: {
  students: any[];
  currentPage: number;
  totalPages: number;
}) {
  const [editStudent, setEditStudent] = useState<any | null>(null);
  const [formStatus, setFormStatus] = useState<{ success: string | null; error: string | null }>({ success: null, error: null });

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormStatus({ success: null, error: null });

    if (!editStudent) return;

    try {
      const formData = new FormData(e.currentTarget);
      const result = await updateStudentRecord(editStudent.id, {
        registrationNumber: formData.get('registrationNumber')?.toString(),
        programId: Number(formData.get('programId')),
        currentSemesterId: Number(formData.get('currentSemesterId')),
      });
      if (result?.length) {
        setFormStatus({ success: 'Student updated successfully!', error: null });
        setEditStudent(null);
      }
    } catch (error: any) {
      setFormStatus({ success: null, error: error.message || 'Failed to update student.' });
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left text-gray-500">
        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3">Reg Number</th>
            <th scope="col" className="px-6 py-3">Name</th>
            <th scope="col" className="px-6 py-3">Program</th>
            <th scope="col" className="px-6 py-3">Semester</th>
            <th scope="col" className="px-6 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {students.map((student) => (
            <tr key={student.id} className="bg-white border-b hover:bg-gray-50">
              <td className="px-6 py-4 font-medium text-gray-900">{student.registrationNumber}</td>
              <td className="px-6 py-4">{student.firstName} {student.lastName}</td>
              <td className="px-6 py-4">{student.program?.name || 'N/A'}</td>
              <td className="px-6 py-4">{student.currentSemester?.name || 'N/A'}</td>
              <td className="px-6 py-4 flex space-x-2">
                <button
                  className="p-2 text-emerald-600 hover:text-emerald-800"
                  onClick={() => setEditStudent(student)}
                >
                  <FiEdit className="w-5 h-5" />
                </button>
                <a
                  href={`/dashboard/registrar/transcripts/generate?studentId=${student.id}`}
                  className="p-2 text-blue-600 hover:text-blue-800"
                >
                  <FiFileText className="w-5 h-5" />
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        baseUrl="/dashboard/registrar/students"
      />

      {editStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-xl">
            <div className="flex justify-between items-center border-b p-6">
              <h2 className="text-2xl font-bold text-gray-800">Edit Student</h2>
              <button onClick={() => setEditStudent(null)} className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100">
                <FiX size={24} />
              </button>
            </div>
            <form onSubmit={handleSave}>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Registration Number</label>
                  <input
                    type="text"
                    name="registrationNumber"
                    defaultValue={editStudent.registrationNumber || ''}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Program ID</label>
                  <input
                    type="number"
                    name="programId"
                    defaultValue={editStudent.program?.id || ''}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Semester ID</label>
                  <input
                    type="number"
                    name="currentSemesterId"
                    defaultValue={editStudent.currentSemester?.id || ''}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg"
                    required
                  />
                </div>

                {formStatus.error && (
                  <div className="p-2 bg-red-100 text-red-700 rounded flex gap-2 items-center">
                    <FiX /> {formStatus.error}
                  </div>
                )}
                {formStatus.success && (
                  <div className="p-2 bg-green-100 text-green-700 rounded flex gap-2 items-center">
                    <FiCheck /> {formStatus.success}
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-3 p-6 border-t">
                <button
                  type="button"
                  onClick={() => setEditStudent(null)}
                  className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-lg hover:from-emerald-700 hover:to-emerald-600"
                >
                  <FiSave className="inline mr-1" /> Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
