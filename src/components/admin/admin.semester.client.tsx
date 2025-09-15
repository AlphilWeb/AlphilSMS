'use client';

import { useState, useEffect } from 'react';
import {
  getAllSemesters,
  getSemesterDetails,
  createSemester,
  updateSemester,
  deleteSemester,
  getSemesterCourses,
  getSemesterStudents,
  getSemesterEvents,
  getSemesterTimetables,
  type SemesterWithStats,
  type SemesterDetails,
  type SemesterCourse,
  type SemesterStudent,
  type SemesterEvent,
  type SemesterTimetable,
} from '@/lib/actions/admin/semesters.action';

import {
  FiCalendar, FiBook, FiUsers, FiClock, FiPlus, 
  FiEdit2, FiTrash2, FiLoader, FiX, FiChevronUp,
  FiChevronDown, FiSearch
} from 'react-icons/fi';
import { ActionError } from '@/lib/utils';

export default function AdminSemestersClient() {
  const [semesters, setSemesters] = useState<SemesterWithStats[]>([]);
  const [selectedSemester, setSelectedSemester] = useState<SemesterDetails | null>(null);
  const [courses, setCourses] = useState<SemesterCourse[]>([]);
  const [students, setStudents] = useState<SemesterStudent[]>([]);
  const [events, setEvents] = useState<SemesterEvent[]>([]);
  const [timetables, setTimetables] = useState<SemesterTimetable[]>([]);
  const [activeTab, setActiveTab] = useState<'courses' | 'students' | 'events' | 'timetables'>('courses');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [loading, setLoading] = useState({
    semesters: true,
    details: false,
    courses: false,
    students: false,
    events: false,
    timetables: false,
    create: false,
    update: false
  });

  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    startDate: '',
    endDate: ''
  });
  const [editMode, setEditMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({
    key: 'name',
    direction: 'asc'
  });

  const [deleteConfirmation, setDeleteConfirmation] = useState('');

  // Fetch all semesters on component mount
  useEffect(() => {
    const loadSemesters = async () => {
      try {
        setLoading(prev => ({ ...prev, semesters: true }));
        setError(null);
        const semestersData = await getAllSemesters();
        setSemesters(semestersData);
      } catch (err) {
        setError(err instanceof ActionError ? err.message : 'Failed to load semesters');
      } finally {
        setLoading(prev => ({ ...prev, semesters: false }));
      }
    };

    loadSemesters();
  }, []);

  // Sort semesters
  const sortedSemesters = [...semesters].sort((a, b) => {
    if (sortConfig.key === 'name') {
      return sortConfig.direction === 'asc' 
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name);
    }
    if (sortConfig.key === 'startDate') {
      return sortConfig.direction === 'asc'
        ? new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
        : new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
    }
    if (sortConfig.key === 'endDate') {
      return sortConfig.direction === 'asc'
        ? new Date(a.endDate).getTime() - new Date(b.endDate).getTime()
        : new Date(b.endDate).getTime() - new Date(a.endDate).getTime();
    }
    return 0;
  });

  // Filter semesters based on search term
  const filteredSemesters = sortedSemesters.filter(semester =>
    semester.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    semester.startDate.toLowerCase().includes(searchTerm.toLowerCase()) ||
    semester.endDate.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Move selected semester to top
  const displayedSemesters = selectedSemester
    ? [selectedSemester, ...filteredSemesters.filter(s => s.id !== selectedSemester.id)]
    : filteredSemesters;

  const handleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Load semester details when selected
  const handleSelectSemester = async (semesterId: number) => {
    try {
      setLoading(prev => ({ 
        ...prev, 
        details: true,
        courses: true,
        students: true,
        events: true,
        timetables: true
      }));
      setError(null);
      
      const [details, semesterCourses, semesterStudents, semesterEvents, semesterTimetables] = await Promise.all([
        getSemesterDetails(semesterId),
        getSemesterCourses(semesterId),
        getSemesterStudents(semesterId),
        getSemesterEvents(semesterId),
        getSemesterTimetables(semesterId)
      ]);

      setSelectedSemester(details);
      setCourses(semesterCourses);
      setStudents(semesterStudents);
      setEvents(semesterEvents);
      setTimetables(semesterTimetables);
      setActiveTab('courses');
      setIsDetailsModalOpen(true);
      setEditMode(false);
      setFormData({
        name: details.name,
        startDate: details.startDate,
        endDate: details.endDate
      });
    } catch (err) {
      setError(err instanceof ActionError ? err.message : 'Failed to load semester details');
    } finally {
      setLoading(prev => ({ 
        ...prev, 
        details: false,
        courses: false,
        students: false,
        events: false,
        timetables: false
      }));
    }
  };

  // Create new semester
  const handleCreateSemester = async () => {
    if (!formData.name.trim() || !formData.startDate || !formData.endDate) {
      setError('All fields are required');
      return;
    }

    try {
      setLoading(prev => ({ ...prev, create: true }));
      setError(null);

      const newSemester = await createSemester(
        formData.name,
        formData.startDate,
        formData.endDate
      );
      
      setSemesters(prev => [...prev, {
        id: newSemester.id,
        name: newSemester.name,
        startDate: newSemester.startDate,
        endDate: newSemester.endDate,
        courseCount: 0,
        studentCount: 0,
        eventCount: 0,
        timetableCount: 0
      }]);
      
      setIsCreateModalOpen(false);
      setFormData({
        name: '',
        startDate: '',
        endDate: ''
      });
    } catch (err) {
      setError(err instanceof ActionError ? err.message : 'Failed to create semester');
    } finally {
      setLoading(prev => ({ ...prev, create: false }));
    }
  };

  // Update semester
  const handleUpdateSemester = async () => {
    if (!selectedSemester || !formData.name.trim() || !formData.startDate || !formData.endDate) {
      setError('All fields are required');
      return;
    }

    try {
      setLoading(prev => ({ ...prev, update: true }));
      setError(null);

      const updatedSemester = await updateSemester(selectedSemester.id, {
        name: formData.name,
        startDate: formData.startDate,
        endDate: formData.endDate
      });
      
      setSemesters(prev => prev.map(sem => 
        sem.id === selectedSemester.id 
          ? { 
              ...sem, 
              name: updatedSemester.name,
              startDate: updatedSemester.startDate,
              endDate: updatedSemester.endDate
            } 
          : sem
      ));
      
      setSelectedSemester(prev => prev ? { 
        ...prev, 
        name: updatedSemester.name,
        startDate: updatedSemester.startDate,
        endDate: updatedSemester.endDate
      } : null);
      
      setEditMode(false);
    } catch (err) {
      setError(err instanceof ActionError ? err.message : 'Failed to update semester');
    } finally {
      setLoading(prev => ({ ...prev, update: false }));
    }
  };

  // Delete semester
const handleDeleteSemester = async () => {
  if (!selectedSemester) return;

  try {
    setError(null);
    await deleteSemester(selectedSemester.id);
    
    setSemesters(prev => prev.filter(sem => sem.id !== selectedSemester.id));
    setSelectedSemester(null);
    setIsDetailsModalOpen(false);
    setDeleteConfirmation('');
  } catch (err) {
    setError(err instanceof ActionError ? err.message : 'Failed to delete semester');
  }
};

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const SortIcon = ({ columnKey }: { columnKey: string }) => {
    if (sortConfig.key !== columnKey) return <FiChevronUp className="opacity-30" />;
    return sortConfig.direction === 'asc' ? <FiChevronUp /> : <FiChevronDown />;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Semester Management</h1>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 flex items-center gap-2"
        >
          <FiPlus size={16} /> New Semester
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search semesters..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Semesters Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading.semesters ? (
          <div className="p-6">
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-100 rounded animate-pulse"></div>
              ))}
            </div>
          </div>
        ) : semesters.length === 0 ? (
          <div className="p-6 text-center">
            <FiCalendar className="mx-auto h-12 w-12 text-gray-400 mb-2" />
            <p className="text-gray-500">No semesters found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center gap-1">
                      Semester Name
                      <SortIcon columnKey="name" />
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('startDate')}
                  >
                    <div className="flex items-center gap-1">
                      Start Date
                      <SortIcon columnKey="startDate" />
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('endDate')}
                  >
                    <div className="flex items-center gap-1">
                      End Date
                      <SortIcon columnKey="endDate" />
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Students
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Courses
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Events
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timetables
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {displayedSemesters.map((semester) => (
                  <tr
                    key={semester.id}
                    className={`cursor-pointer transition-colors ${
                      selectedSemester?.id === semester.id
                        ? 'bg-blue-50 hover:bg-blue-100'
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => handleSelectSemester(semester.id)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {selectedSemester?.id === semester.id && (
                          <FiChevronUp className="text-blue-600 mr-2" />
                        )}
                        <div className="text-sm font-medium text-gray-900">
                          {semester.name}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(semester.startDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(semester.endDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        <FiUsers className="mr-1" size={12} />
                        {semester.studentCount}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <FiBook className="mr-1" size={12} />
                        {semester.courseCount}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        <FiCalendar className="mr-1" size={12} />
                        {semester.eventCount}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        <FiClock className="mr-1" size={12} />
                        {semester.timetableCount}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Semester Details Modal */}
      {isDetailsModalOpen && selectedSemester && (
        <div className="fixed inset-0 backdrop-blur-sm  bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-2xl font-bold text-gray-800">Semester Details</h2>
              <button
                onClick={() => {
                  setIsDetailsModalOpen(false);
                  setSelectedSemester(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <FiX size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Semester Header */}
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {editMode ? (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Semester Name
                          </label>
                          <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                            className="text-black w-full px-3 py-2 border border-gray-300 rounded-md"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Start Date
                            </label>
                            <input
                              type="date"
                              value={formData.startDate}
                              onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                              className="text-black w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              End Date
                            </label>
                            <input
                              type="date"
                              value={formData.endDate}
                              onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                              className="text-black w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={handleUpdateSemester}
                            disabled={!formData.name.trim() || !formData.startDate || !formData.endDate || loading.update}
                            className={`px-4 py-2 text-sm rounded-md text-white ${
                              loading.update ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
                            } transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed`}
                          >
                            {loading.update ? 'Saving...' : 'Save Changes'}
                          </button>
                          <button
                            onClick={() => setEditMode(false)}
                            className="px-4 py-2 text-sm rounded-md bg-gray-200 hover:bg-gray-300"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">
                          {selectedSemester.name}
                        </h3>
                        <p className="text-gray-600 mb-2">
                          {formatDate(selectedSemester.startDate)} - {formatDate(selectedSemester.endDate)}
                        </p>
                      </>
                    )}
                  </div>
                  
                  {!editMode && (
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => setEditMode(true)}
                        className="text-blue-500 hover:text-blue-800 p-2"
                        title="Edit semester"
                      >
                        <FiEdit2 size={18} />
                      </button>
                      <button
                        onClick={() => setDeleteConfirmation('show')}
                        className="text-red-600 hover:text-red-800 p-2"
                        title="Delete semester"
                      >
                        <FiTrash2 size={18} />
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-4 gap-4">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500">Students</p>
                    <p className="font-medium text-blue-500">
                      {selectedSemester.studentCount}
                    </p>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500">Courses</p>
                    <p className="font-medium text-green-600">
                      {selectedSemester.courseCount}
                    </p>
                  </div>
                  <div className="bg-purple-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500">Events</p>
                    <p className="font-medium text-purple-600">
                      {selectedSemester.eventCount}
                    </p>
                  </div>
                  <div className="bg-yellow-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500">Timetables</p>
                    <p className="font-medium text-yellow-600">
                      {selectedSemester.timetableCount}
                    </p>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-gray-200">
                <button
                  className={`px-4 py-2 font-medium flex items-center gap-2 ${
                    activeTab === 'courses'
                      ? 'text-blue-500 border-b-2 border-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => setActiveTab('courses')}
                >
                  <FiBook /> Courses ({courses.length})
                </button>
                <button
                  className={`px-4 py-2 font-medium flex items-center gap-2 ${
                    activeTab === 'students'
                      ? 'text-blue-500 border-b-2 border-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => setActiveTab('students')}
                >
                  <FiUsers /> Students ({students.length})
                </button>
                <button
                  className={`px-4 py-2 font-medium flex items-center gap-2 ${
                    activeTab === 'events'
                      ? 'text-blue-500 border-b-2 border-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => setActiveTab('events')}
                >
                  <FiCalendar /> Events ({events.length})
                </button>
                <button
                  className={`px-4 py-2 font-medium flex items-center gap-2 ${
                    activeTab === 'timetables'
                      ? 'text-blue-500 border-b-2 border-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => setActiveTab('timetables')}
                >
                  <FiClock /> Timetables ({timetables.length})
                </button>
              </div>

              {/* Courses Tab */}
              {activeTab === 'courses' && (
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div className="divide-y">
                    {loading.courses ? (
                      <div className="p-4">
                        {[...Array(5)].map((_, i) => (
                          <div key={i} className="h-16 bg-gray-100 rounded mb-2 animate-pulse"></div>
                        ))}
                      </div>
                    ) : courses.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">
                        No courses in this semester
                      </div>
                    ) : (
                      courses.map((course) => (
                        <div key={course.id} className="p-4 hover:bg-gray-50">
                          <div className="flex justify-between items-center">
                            <div>
                              <h4 className="font-medium text-gray-800">
                                {course.name} ({course.code})
                              </h4>
                              <p className="text-sm text-gray-600">
                                {course.credits} credits • {course.program.name}
                              </p>
                              {course.lecturer && (
                                <p className="text-xs text-gray-500 mt-1">
                                  Lecturer: {course.lecturer.firstName} {course.lecturer.lastName}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Students Tab */}
              {activeTab === 'students' && (
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div className="divide-y">
                    {loading.students ? (
                      <div className="p-4">
                        {[...Array(5)].map((_, i) => (
                          <div key={i} className="h-16 bg-gray-100 rounded mb-2 animate-pulse"></div>
                        ))}
                      </div>
                    ) : students.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">
                        No students in this semester
                      </div>
                    ) : (
                      students.map((student) => (
                        <div key={`${student.id}-${student.registrationNumber}`} className="p-4 hover:bg-gray-50">
                          <div className="flex justify-between items-center">
                            <div>
                              <h4 className="font-medium text-gray-800">
                                {student.firstName} {student.lastName}
                              </h4>
                              <p className="text-sm text-gray-600">
                                {student.email}
                              </p>
                              <div className="flex gap-4 mt-1">
                                <p className="text-xs text-gray-500">
                                  Reg: {student.registrationNumber}
                                </p>
                                <p className="text-xs text-gray-500">
                                  Program: {student.program.name}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Events Tab */}
              {activeTab === 'events' && (
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div className="divide-y">
                    {loading.events ? (
                      <div className="p-4">
                        {[...Array(5)].map((_, i) => (
                          <div key={i} className="h-16 bg-gray-100 rounded mb-2 animate-pulse"></div>
                        ))}
                      </div>
                    ) : events.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">
                        No events in this semester
                      </div>
                    ) : (
                      events.map((event) => (
                        <div key={event.id} className="p-4 hover:bg-gray-50">
                          <div className="flex justify-between items-center">
                            <div>
                              <h4 className="font-medium text-gray-800">
                                {event.title}
                              </h4>
                              <p className="text-sm text-gray-600 capitalize">
                                {event.eventType}
                              </p>
                              <div className="flex gap-4 mt-1">
                                <p className="text-xs text-gray-500">
                                  {new Date(event.startDate).toLocaleString()}
                                </p>
                                {event.location && (
                                  <p className="text-xs text-gray-500">
                                    Location: {event.location}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Timetables Tab */}
              {activeTab === 'timetables' && (
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div className="divide-y">
                    {loading.timetables ? (
                      <div className="p-4">
                        {[...Array(5)].map((_, i) => (
                          <div key={i} className="h-16 bg-gray-100 rounded mb-2 animate-pulse"></div>
                        ))}
                      </div>
                    ) : timetables.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">
                        No timetables in this semester
                      </div>
                    ) : (
                      timetables.map((timetable) => (
                        <div key={timetable.id} className="p-4 hover:bg-gray-50">
                          <div className="flex justify-between items-center">
                            <div>
                              <h4 className="font-medium text-gray-800">
                                {timetable.course.name} ({timetable.course.code})
                              </h4>
                              <p className="text-sm text-gray-600">
                                {timetable.dayOfWeek} • {timetable.startTime} - {timetable.endTime}
                              </p>
                              <div className="flex gap-4 mt-1">
                                <p className="text-xs text-gray-500">
                                  Lecturer: {timetable.lecturer.firstName} {timetable.lecturer.lastName}
                                </p>
                                {timetable.room && (
                                  <p className="text-xs text-gray-500">
                                    Room: {timetable.room}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Semester Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 backdrop-blur-sm bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <FiPlus size={18} /> Create New Semester
              </h3>
              <button 
                onClick={() => setIsCreateModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FiX size={20} />
              </button>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Semester Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="text-black w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Fall 2023"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                      className="text-black w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                      className="text-black w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 p-4 border-t">
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateSemester}
                disabled={!formData.name.trim() || !formData.startDate || !formData.endDate || loading.create}
                className={`px-4 py-2 text-sm font-medium text-white rounded-md flex items-center gap-2 ${
                  loading.create ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
                } transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed`}
              >
                {loading.create ? (
                  <>
                    <FiLoader className="animate-spin" size={16} />
                    Creating...
                  </>
                ) : (
                  <>
                    <FiPlus size={16} />
                    Create Semester
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      {deleteConfirmation && selectedSemester && (
        <div className="fixed inset-0 backdrop-blur-sm bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-800">
                Confirm Deletion
              </h3>
              <button 
                onClick={() => setDeleteConfirmation('')}
                className="text-gray-500 hover:text-gray-700"
              >
                <FiX size={20} />
              </button>
            </div>
            
            <div className="p-6">
              <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
                <h4 className="font-semibold text-red-800 mb-2">Warning: Deleting this semester will permanently delete:</h4>
                <ul className="text-red-700 text-sm list-disc list-inside space-y-1">
                  <li>All courses scheduled for this semester</li>
                  <li>All enrollments for this semester</li>
                  <li>All timetables for this semester</li>
                  <li>All fee structures for this semester</li>
                  <li>All invoices and academic calendar events</li>
                  <li>All transcripts for this semester</li>
                </ul>
              </div>
              
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type &quot;delete {selectedSemester.name}&quot; to confirm
                </label>
                <input
                  type="text"
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder={`delete ${selectedSemester.name}`}
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 p-4 border-t">
              <button
                onClick={() => setDeleteConfirmation('')}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleDeleteSemester();
                  setDeleteConfirmation('');
                }}
                disabled={deleteConfirmation !== `delete ${selectedSemester.name}`}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md disabled:bg-red-300 disabled:cursor-not-allowed"
              >
                Delete Semester
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}