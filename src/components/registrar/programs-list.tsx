// components/registrar/programs/programs-list.tsx
'use client';

import { useState } from 'react';
import { FiEdit, FiBook, FiLayers, FiTrash2, FiPlus } from 'react-icons/fi';
import { updateProgram, deleteProgram, createProgram } from '@/lib/actions/registrar.program.action';
import ProgramForm from './program-form';

export default function ProgramsList({ programs }: { programs: any[] }) {
  const [editProgram, setEditProgram] = useState<any | null>(null);
  const [showAddProgram, setShowAddProgram] = useState(false);
  const [formStatus, setFormStatus] = useState<{ success: string | null; error: string | null }>({ 
    success: null, 
    error: null 
  });

  const handleSave = async (data: any) => {
    setFormStatus({ success: null, error: null });
    try {
      await updateProgram(editProgram.id, data);
      setFormStatus({ success: 'Program updated successfully!', error: null });
      setEditProgram(null);
      window.location.reload();
    } catch (error: any) {
      setFormStatus({ success: null, error: error.message || 'Failed to update program.' });
    }
  };

  const handleCreate = async (data: any) => {
    setFormStatus({ success: null, error: null });
    try {
      await createProgram(data);
      setFormStatus({ success: 'Program created successfully!', error: null });
      setShowAddProgram(false);
      window.location.reload();
    } catch (error: any) {
      setFormStatus({ success: null, error: error.message || 'Failed to create program.' });
    }
  };

  const handleDelete = async (programId: number) => {
    if (!confirm('Are you sure you want to delete this program?')) return;
    try {
      await deleteProgram(programId);
      window.location.reload();
    } catch (error: any) {
      setFormStatus({ success: null, error: error.message || 'Failed to delete program.' });
    }
  };

  return (
    <div className="overflow-x-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Programs</h2>
        <button
          onClick={() => setShowAddProgram(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700"
        >
          <FiPlus className="-ml-1 mr-2 h-5 w-5" />
          Add Program
        </button>
      </div>

      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Program
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Department
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
          {programs.map((program) => (
            <tr key={program.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center mr-3">
                    <FiBook className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{program.name}</div>
                    <div className="text-sm text-gray-500">{program.code}</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                    <FiLayers className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="text-sm text-gray-900">{program.department?.name}</div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {program.durationSemesters} semesters
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button
                  onClick={() => setEditProgram(program)}
                  className="text-emerald-600 hover:text-emerald-800 p-2 rounded-full hover:bg-emerald-50 mr-2"
                >
                  <FiEdit className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleDelete(program.id)}
                  className="text-red-600 hover:text-red-800 p-2 rounded-full hover:bg-red-50"
                >
                  <FiTrash2 className="w-5 h-5" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Edit Program Modal */}
      {editProgram && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <ProgramForm
            initialData={editProgram}
            onSubmit={handleSave}
            onCancel={() => {
              setEditProgram(null);
              setFormStatus({ success: null, error: null });
            }}
            title="Edit Program"
            formStatus={formStatus}
          />
        </div>
      )}

      {/* Add Program Modal */}
      {showAddProgram && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <ProgramForm
            onSubmit={handleCreate}
            onCancel={() => {
              setShowAddProgram(false);
              setFormStatus({ success: null, error: null });
            }}
            title="Add New Program"
            formStatus={formStatus}
          />
        </div>
      )}
    </div>
  );
}