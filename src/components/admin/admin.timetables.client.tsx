// components/admin/admin.timetables.client.tsx
'use client';

import { useState, useEffect } from 'react';
import {
  getAllTimetables,
  getTimetablesBySemester,
  getTimetablesByCourse,
  getTimetablesByLecturer,
  getTimetableById,
  createTimetable,
  // updateTimetable,
  deleteTimetable,
  checkTimetableConflict,
  getAllTimetableRooms,
  fetchSemesters,
  fetchCourses,
  type TimetableWithDetails,
  type TimetableData,
  fetchLecturers
} from '@/lib/actions/admin/timetables.actions';

import {
  FiCalendar, FiPlus, FiEdit2, FiTrash2, 
  FiLoader, FiX, FiSearch, FiInfo, 
  FiCheck
} from 'react-icons/fi';
import { ActionError } from '@/lib/utils';
import { SelectCourse, SelectSemester, SelectStaff } from '@/lib/db';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function AdminTimetablesClient() {
  const [timetables, setTimetables] = useState<TimetableWithDetails[]>([]);
  const [selectedTimetable, setSelectedTimetable] = useState<TimetableWithDetails | null>(null);
  const [loading, setLoading] = useState({
    timetables: true,
    details: false,
    create: false,
    update: false,
    rooms: false
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'all' | 'semester' | 'course' | 'lecturer'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  // const [selectedCourse, setSelectedCourse] = useState<number | null>(null);
  // const [selectedLecturer, setSelectedLecturer] = useState<number | null>(null);
  const [availableRooms, setAvailableRooms] = useState<string[]>([]);
  const [conflictError, setConflictError] = useState<string | null>(null);
const [semestersList, setSemestersList] = useState<SelectSemester[]>([]);
const [selectedSemester, setSelectedSemester] = useState<number | null>(null);

useEffect(() => {
  async function loadSemesters() {
    try {
      const data = await fetchSemesters();
      setSemestersList(data);
    } catch (error) {
      // You should handle this error gracefully in your UI
      console.error("Failed to load semesters:", error);
    }
  }

  loadSemesters();
}, []); // The empty array ensures this runs only once

const [coursesList, setCoursesList] = useState<SelectCourse[]>([]);
const [selectedCourse, setSelectedCourse] = useState<number | null>(null);

useEffect(() => {
  async function loadCourses() {
    try {
      const data = await fetchCourses();
      setCoursesList(data);
    } catch (error) {
      console.error("Failed to load courses:", error);
    }
  }
  loadCourses();
}, []); // The empty array ensures this runs only once on mount

const [lecturersList, setLecturersList] = useState<SelectStaff[]>([]);
const [selectedLecturer, setSelectedLecturer] = useState<number | null>(null);

useEffect(() => {
  async function loadLecturers() {
    try {
      const data = await fetchLecturers();
      setLecturersList(data);
    } catch (error) {
      console.error("Failed to load lecturers:", error);
    }
  }
  loadLecturers();
}, []); // The empty array ensures this runs only once


  const [formData, setFormData] = useState<TimetableData>({
    semesterId: 0,
    courseId: 0,
    lecturerId: 0,
    dayOfWeek: 'Monday',
    startTime: '08:00',
    endTime: '09:00',
    room: null
  });

  // Fetch timetables based on current view mode
  useEffect(() => {
    const loadTimetables = async () => {
      try {
        setLoading(prev => ({ ...prev, timetables: true }));
        setError(null);
        
        let timetablesData: TimetableWithDetails[];
        switch (viewMode) {
          case 'semester':
            if (!selectedSemester) return;
            timetablesData = await getTimetablesBySemester(selectedSemester);
            break;
          case 'course':
            if (!selectedCourse) return;
            timetablesData = await getTimetablesByCourse(selectedCourse);
            break;
          case 'lecturer':
            if (!selectedLecturer) return;
            timetablesData = await getTimetablesByLecturer(selectedLecturer);
            break;
          default:
            timetablesData = await getAllTimetables();
        }
        
        setTimetables(timetablesData);
      } catch (err) {
        setError(err instanceof ActionError ? err.message : 'Failed to load timetables');
      } finally {
        setLoading(prev => ({ ...prev, timetables: false }));
      }
    };

    loadTimetables();
  }, [viewMode, selectedSemester, selectedCourse, selectedLecturer]);

  // Load available rooms
  useEffect(() => {
    const loadRooms = async () => {
      try {
        setLoading(prev => ({ ...prev, rooms: true }));
        const rooms = await getAllTimetableRooms();
        setAvailableRooms(rooms);
      } catch (err) {
        console.error('Failed to load rooms:', err);
      } finally {
        setLoading(prev => ({ ...prev, rooms: false }));
      }
    };

    loadRooms();
  }, []);

  // Handle search
  useEffect(() => {
    if (!searchQuery.trim()) return;

    const timer = setTimeout(async () => {
      try {
        setLoading(prev => ({ ...prev, timetables: true }));
        const allTimetables = await getAllTimetables();
        const filteredTimetables = allTimetables.filter(timetable => 
          timetable.course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          timetable.course.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
          timetable.lecturer.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          timetable.lecturer.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (timetable.room && timetable.room.toLowerCase().includes(searchQuery.toLowerCase())) ||
          timetable.dayOfWeek.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setTimetables(filteredTimetables);
      } catch (err) {
        setError(err instanceof ActionError ? err.message : 'Search failed');
      } finally {
        setLoading(prev => ({ ...prev, timetables: false }));
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load timetable details when selected
  const handleSelectTimetable = async (timetableId: number) => {
    try {
      setLoading(prev => ({ ...prev, details: true }));
      setError(null);
      
      const timetableDetails = await getTimetableById(timetableId);
      if (!timetableDetails) {
        throw new ActionError('Timetable not found');
      }
      
      setSelectedTimetable(timetableDetails);
      setFormData({
        semesterId: timetableDetails.semester.id,
        courseId: timetableDetails.course.id,
        lecturerId: timetableDetails.lecturer.id,
        dayOfWeek: timetableDetails.dayOfWeek,
        startTime: timetableDetails.startTime,
        endTime: timetableDetails.endTime,
        room: timetableDetails.room
      });
    } catch (err) {
      setError(err instanceof ActionError ? err.message : 'Failed to load timetable details');
    } finally {
      setLoading(prev => ({ ...prev, details: false }));
    }
  };

  // Check for timetable conflicts
  const checkForConflicts = async () => {
    try {
      const hasConflict = await checkTimetableConflict(
        formData.semesterId,
        formData.dayOfWeek,
        formData.startTime,
        formData.endTime,
        formData.room || null,
        selectedTimetable?.id
      );

      if (hasConflict) {
        setConflictError('There is a scheduling conflict with this room and time slot');
        return true;
      } else {
        setConflictError(null);
        return false;
      }
    } catch (err) {
      console.log('Error checking for conflicts:', err);
      setConflictError('Failed to check for conflicts');
      return true;
    }
  };

  // Create new timetable
  const handleCreateTimetable = async () => {
    try {
      setLoading(prev => ({ ...prev, create: true }));
      setError(null);
      setConflictError(null);

      // Check for conflicts first
      const hasConflict = await checkForConflicts();
      if (hasConflict) return;

      const newTimetable = await createTimetable(formData);
      
      // Update local state with the new timetable
      const timetableDetails = await getTimetableById(newTimetable.id);
      if (timetableDetails) {
        setTimetables(prev => [...prev, timetableDetails]);
      }
      
      setIsCreateModalOpen(false);
      setFormData({
        semesterId: 0,
        courseId: 0,
        lecturerId: 0,
        dayOfWeek: 'Monday',
        startTime: '08:00',
        endTime: '09:00',
        room: null
      });
      setSuccess('Timetable created successfully!');
    } catch (err) {
      setError(err instanceof ActionError ? err.message : 'Failed to create timetable');
    } finally {
      setLoading(prev => ({ ...prev, create: false }));
    }
  };

  // Update timetable
  const handleUpdateTimetable = async () => {
    if (!selectedTimetable) return;

    try {
      setLoading(prev => ({ ...prev, update: true }));
      setError(null);
      setConflictError(null);

      // Check for conflicts first
      const hasConflict = await checkForConflicts();
      if (hasConflict) return;

      // Update local state with the updated timetable
      const timetableDetails = await getTimetableById(selectedTimetable.id);
      if (timetableDetails) {
        setTimetables(prev => prev.map(t => 
          t.id === selectedTimetable.id ? timetableDetails : t
        ));
        setSelectedTimetable(timetableDetails);
      }
      
      setIsEditModalOpen(false);
      setSuccess('Timetable updated successfully!');
    } catch (err) {
      setError(err instanceof ActionError ? err.message : 'Failed to update timetable');
    } finally {
      setLoading(prev => ({ ...prev, update: false }));
    }
  };

  // Delete timetable
  const handleDeleteTimetable = async () => {
    if (!selectedTimetable) return;

    if (!confirm('Are you sure you want to delete this timetable entry?')) return;

    try {
      setError(null);
      await deleteTimetable(selectedTimetable.id);
      
      setTimetables(prev => prev.filter(t => t.id !== selectedTimetable.id));
      setSelectedTimetable(null);
      setSuccess('Timetable deleted successfully!');
    } catch (err) {
      setError(err instanceof ActionError ? err.message : 'Failed to delete timetable');
    }
  };

  // Format time for display
  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Timetable Management</h1>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2 bg-emerald-600 text-white text-sm rounded-md hover:bg-emerald-700 flex items-center gap-2"
        >
          <FiPlus size={16} /> New Entry
        </button>
      </div>

      {/* View Mode Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setViewMode('all')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
              viewMode === 'all'
                ? 'border-emerald-500 text-emerald-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            All Timetables
          </button>
          <button
            onClick={() => setViewMode('semester')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
              viewMode === 'semester'
                ? 'border-emerald-500 text-emerald-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            By Semester
          </button>
          <button
            onClick={() => setViewMode('course')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
              viewMode === 'course'
                ? 'border-emerald-500 text-emerald-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            By Course
          </button>
          <button
            onClick={() => setViewMode('lecturer')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
              viewMode === 'lecturer'
                ? 'border-emerald-500 text-emerald-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            By Lecturer
          </button>
        </nav>
      </div>

      {/* Filter Controls */}
      {viewMode === 'semester' && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <label className="block text-sm font-medium text-gray-700 mb-2">Select Semester</label>
<select
  value={selectedSemester || ''}
  onChange={(e) => setSelectedSemester(Number(e.target.value))}
  className="text-black mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-md"
>
  <option value="">Select a semester</option>
  {semestersList.map(semester => (
    <option key={semester.id} value={semester.id}>
      {semester.name}
    </option>
  ))}
</select>
        </div>
      )}

      {viewMode === 'course' && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <label className="block text-sm font-medium text-gray-700 mb-2">Select Course</label>
<select
  value={selectedCourse || ''}
  onChange={(e) => setSelectedCourse(Number(e.target.value))}
  className="text-black mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-md"
>
  <option value="">Select a course</option>
  {/* This is the new, dynamic part */}
  {coursesList.map(course => (
    <option key={course.id} value={course.id}>
      {course.name}
    </option>
  ))}
</select>
        </div>
      )}

      {viewMode === 'lecturer' && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <label className="block text-sm font-medium text-gray-700 mb-2">Select Lecturer</label>
<select
  value={selectedLecturer || ''}
  onChange={(e) => setSelectedLecturer(Number(e.target.value))}
  className="text-black mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-md"
>
  <option value="">Select a lecturer</option>
  {lecturersList.map(lecturer => (
    <option key={lecturer.id} value={lecturer.id}>
      {/* You can display the full name for a user-friendly experience */}
      {`${lecturer.firstName} ${lecturer.lastName}`}
    </option>
  ))}
</select>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded flex items-center gap-2">
          <FiX className="flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded flex items-center gap-2">
          <FiCheck className="flex-shrink-0" />
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 gap-8">
        {/* Search and Table Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 border-b flex justify-between items-center">
            <div className="relative w-full max-w-md">
              <div className="text-emerald-500 absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search timetables..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="text-emerald-500 pl-10 w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {loading.timetables ? (
            <div className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-10 bg-gray-200 rounded"></div>
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-12 bg-gray-100 rounded"></div>
                ))}
              </div>
            </div>
          ) : timetables.length === 0 ? (
            <div className="p-6 text-center">
              <FiCalendar className="mx-auto h-12 w-12 text-gray-400 mb-2" />
              <p className="text-gray-500">No timetable entries found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Course
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Lecturer
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Schedule
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {timetables.map((timetable) => (
                    <tr 
                      key={timetable.id} 
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {timetable.course.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {timetable.course.code}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {timetable.lecturer.firstName} {timetable.lecturer.lastName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {timetable.lecturer.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {timetable.dayOfWeek}
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatTime(timetable.startTime)} - {formatTime(timetable.endTime)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {timetable.room || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleSelectTimetable(timetable.id)}
                          className="text-emerald-600 hover:text-emerald-900 mr-4"
                          title="View Details"
                        >
                          <FiInfo />
                        </button>
                        <button
                          onClick={() => {
                            handleSelectTimetable(timetable.id);
                            setIsEditModalOpen(true);
                          }}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                          title="Edit"
                        >
                          <FiEdit2 />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedTimetable(timetable);
                            handleDeleteTimetable();
                          }}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                        >
                          <FiTrash2 />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Create Timetable Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex justify-between items-center border-b p-6">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <FiPlus size={18} /> New Timetable Entry
              </h2>
              <button 
                onClick={() => setIsCreateModalOpen(false)}
                className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
              >
                <FiX size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Semester
                </label>
<select
  value={selectedSemester || ''}
  onChange={(e) => setSelectedSemester(Number(e.target.value))}
  className="text-black mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-md"
>
  <option value="">Select a semester</option>
  {semestersList.map(semester => (
    <option key={semester.id} value={semester.id}>
      {semester.name}
    </option>
  ))}
</select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Course
                </label>
<select
  value={selectedCourse || ''}
  onChange={(e) => setSelectedCourse(Number(e.target.value))}
  className="text-black mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-md"
>
  <option value="">Select a course</option>
  {/* This is the new, dynamic part */}
  {coursesList.map(course => (
    <option key={course.id} value={course.id}>
      {course.name}
    </option>
  ))}
</select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lecturer
                </label>
<select
  value={selectedLecturer || ''}
  onChange={(e) => setSelectedLecturer(Number(e.target.value))}
  className="text-black mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-md"
>
  <option value="">Select a lecturer</option>
  {lecturersList.map(lecturer => (
    <option key={lecturer.id} value={lecturer.id}>
      {/* You can display the full name for a user-friendly experience */}
      {`${lecturer.firstName} ${lecturer.lastName}`}
    </option>
  ))}
</select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Day of Week
                  </label>
                  <select
                    value={formData.dayOfWeek}
                    onChange={(e) => setFormData({...formData, dayOfWeek: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
                  >
                    {DAYS_OF_WEEK.map(day => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Room
                  </label>
                  <select
                    value={formData.room || ''}
                    onChange={(e) => setFormData({...formData, room: e.target.value || null})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
                  >
                    <option value="">Select room</option>
                    {availableRooms.map(room => (
                      <option key={room} value={room}>{room}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
                  />
                </div>
              </div>
              
              {conflictError && (
                <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded flex items-center gap-2">
                  <FiX className="flex-shrink-0" />
                  {conflictError}
                </div>
              )}
            </div>
            
            <div className="flex justify-end gap-3 p-6 border-t">
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTimetable}
                disabled={!formData.semesterId || !formData.courseId || !formData.lecturerId || loading.create}
                className={`px-4 py-2 text-sm font-medium text-white rounded-md flex items-center gap-2 ${
                  loading.create ? 'bg-emerald-400' : 'bg-emerald-600 hover:bg-emerald-700'
                } transition-colors disabled:bg-emerald-300 disabled:cursor-not-allowed`}
              >
                {loading.create ? (
                  <>
                    <FiLoader className="animate-spin" size={16} />
                    Creating...
                  </>
                ) : (
                  <>
                    <FiPlus size={16} />
                    Create Entry
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Timetable Modal */}
      {isEditModalOpen && selectedTimetable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex justify-between items-center border-b p-6">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <FiEdit2 size={18} /> Edit Timetable
              </h2>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
              >
                <FiX size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-medium text-gray-700">Course</h3>
                <p className="mt-1 text-sm text-gray-900">
                  {selectedTimetable.course.name} ({selectedTimetable.course.code})
                </p>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-medium text-gray-700">Lecturer</h3>
                <p className="mt-1 text-sm text-gray-900">
                  {selectedTimetable.lecturer.firstName} {selectedTimetable.lecturer.lastName}
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Day of Week
                  </label>
                  <select
                    value={formData.dayOfWeek}
                    onChange={(e) => setFormData({...formData, dayOfWeek: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
                  >
                    {DAYS_OF_WEEK.map(day => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Room
                  </label>
                  <select
                    value={formData.room || ''}
                    onChange={(e) => setFormData({...formData, room: e.target.value || null})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
                  >
                    <option value="">Select room</option>
                    {availableRooms.map(room => (
                      <option key={room} value={room}>{room}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
                  />
                </div>
              </div>
              
              {conflictError && (
                <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded flex items-center gap-2">
                  <FiX className="flex-shrink-0" />
                  {conflictError}
                </div>
              )}
            </div>
            
            <div className="flex justify-end gap-3 p-6 border-t">
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateTimetable}
                disabled={loading.update}
                className={`px-4 py-2 text-sm font-medium text-white rounded-md flex items-center gap-2 ${
                  loading.update ? 'bg-emerald-400' : 'bg-emerald-600 hover:bg-emerald-700'
                } transition-colors disabled:bg-emerald-300 disabled:cursor-not-allowed`}
              >
                {loading.update ? (
                  <>
                    <FiLoader className="animate-spin" size={16} />
                    Updating...
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}