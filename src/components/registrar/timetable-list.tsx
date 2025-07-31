// components/registrar/timetables/timetables-list.tsx
'use client';

import { useState } from 'react';
import { FiEdit, FiCalendar, FiClock, FiTrash2, FiPlus } from 'react-icons/fi';
import { deleteTimetable } from '@/lib/actions/registrar.timetable.action';
import TimetableForm from './timetabe-form';

export default function TimetablesList({ timetables }: { timetables: any[] }) {
  const [editTimetable, setEditTimetable] = useState<any | null>(null);
  const [showAddTimetable, setShowAddTimetable] = useState(false);
  const [formStatus, setFormStatus] = useState<{ success: string | null; error: string | null }>({ 
    success: null, 
    error: null 
  });

  const handleDelete = async (timetableId: number) => {
    if (!confirm('Are you sure you want to delete this timetable entry?')) return;
    try {
      await deleteTimetable(timetableId);
      setFormStatus({ success: 'Timetable deleted successfully!', error: null });
      window.location.reload();
    } catch (error: any) {
      setFormStatus({ success: null, error: error.message || 'Failed to delete timetable.' });
    }
  };

  return (
    <div className="overflow-x-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Timetables</h2>
        <button
          onClick={() => setShowAddTimetable(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700"
        >
          <FiPlus className="-ml-1 mr-2 h-5 w-5" />
          Add Timetable
        </button>
      </div>

      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Course
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Day & Time
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Lecturer
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Room
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {timetables.map((timetable) => (
            <tr key={timetable.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center mr-3">
                    <FiCalendar className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{timetable.course?.code}</div>
                    <div className="text-sm text-gray-500">{timetable.course?.name}</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                    <FiClock className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-900">{timetable.dayOfWeek}</div>
                    <div className="text-sm text-gray-500">
                      {timetable.startTime} - {timetable.endTime}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {timetable.lecturer?.lastName}, {timetable.lecturer?.firstName}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {timetable.room || '-'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button
                  onClick={() => setEditTimetable(timetable)}
                  className="text-emerald-600 hover:text-emerald-800 p-2 rounded-full hover:bg-emerald-50 mr-2"
                >
                  <FiEdit className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleDelete(timetable.id)}
                  className="text-red-600 hover:text-red-800 p-2 rounded-full hover:bg-red-50"
                >
                  <FiTrash2 className="w-5 h-5" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Edit Timetable Modal */}
      {editTimetable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <TimetableForm
            initialData={editTimetable}
            onSubmit={async (data) => {
              try {
                // You would call updateTimetable here
                setFormStatus({ success: 'Timetable updated successfully!', error: null });
                setEditTimetable(null);
                window.location.reload();
              } catch (error: any) {
                setFormStatus({ success: null, error: error.message || 'Failed to update timetable.' });
              }
            }}
            onCancel={() => {
              setEditTimetable(null);
              setFormStatus({ success: null, error: null });
            }}
            title="Edit Timetable"
            formStatus={formStatus}
          />
        </div>
      )}

      {/* Add Timetable Modal */}
      {showAddTimetable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <TimetableForm
            onSubmit={async (data) => {
              try {
                // You would call createTimetable here
                setFormStatus({ success: 'Timetable created successfully!', error: null });
                setShowAddTimetable(false);
                window.location.reload();
              } catch (error: any) {
                setFormStatus({ success: null, error: error.message || 'Failed to create timetable.' });
              }
            }}
            onCancel={() => {
              setShowAddTimetable(false);
              setFormStatus({ success: null, error: null });
            }}
            title="Add New Timetable"
            formStatus={formStatus}
          />
        </div>
      )}
    </div>
  );
}