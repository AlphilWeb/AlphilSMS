// components/admin/admin.courses.client.tsx
'use client';

import { useState, useEffect } from 'react';
import {
  getAllCourses,
  getCourseDetails,
  createCourse,
  updateCourse,
  assignCourseLecturer,
  removeCourseLecturer,
  getAllPrograms,
  getAllSemesters,
  deleteCourse,
  getAllLecturers,
  type CourseWithDetails,
  type CourseFormValues,
  ProgramOption,
  SemesterOption,
  LecturerOption,
} from '@/lib/actions/admin/courses.actions';

import {
  FiUsers, FiBook, FiPlus, FiEdit2, FiTrash2,
  FiUserPlus, FiUserMinus, FiLoader, FiX,
  FiChevronUp, FiChevronDown, FiSearch
} from 'react-icons/fi';

export default function AdminCoursesClient() {
  const [courses, setCourses] = useState<CourseWithDetails[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<CourseWithDetails | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [loading, setLoading] = useState({
    courses: true,
    details: false,
    create: false,
    update: false
  });
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<CourseFormValues>({
    name: '',
    code: '',
    credits: 3,
    programId: 0,
    semesterId: 0,
  });
  const [editMode, setEditMode] = useState(false);

  const [isLecturerModalOpen, setIsLecturerModalOpen] = useState(false);
  const [lecturerOptions, setLecturerOptions] = useState<LecturerOption[]>([]);
  const [loadingLecturers, setLoadingLecturers] = useState(false);

  const [programOptions, setProgramOptions] = useState<ProgramOption[]>([]);
  const [semesterOptions, setSemesterOptions] = useState<SemesterOption[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({
    key: 'name',
    direction: 'asc'
  });

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoadingOptions(true);
        const [coursesData, programsData, semestersData] = await Promise.all([
          getAllCourses(),
          getAllPrograms(),
          getAllSemesters(),
        ]);
        setCourses(coursesData);
        setProgramOptions(programsData);
        setSemesterOptions(semestersData);
        
        setFormData(prev => ({
          ...prev,
          programId: programsData[0]?.id || 0,
          semesterId: semestersData[0]?.id || 0
        }));
      } catch (err) {
        console.error(err);
        setError('Something went wrong while loading data. Please try again.');
      } finally {
        setLoadingOptions(false);
        setLoading(prev => ({ ...prev, courses: false }));
      }
    };

    loadInitialData();
  }, []);

  // Reset form when create modal closes
  useEffect(() => {
    if (!isCreateModalOpen) {
      setFormData({
        name: '',
        code: '',
        credits: 3,
        programId: programOptions[0]?.id || 0,
        semesterId: semesterOptions[0]?.id || 0,
      });
      setError(null);
    }
  }, [isCreateModalOpen, programOptions, semesterOptions]);

  // Sort courses
  const sortedCourses = [...courses].sort((a, b) => {
    if (sortConfig.key === 'name') {
      return sortConfig.direction === 'asc' 
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name);
    }
    if (sortConfig.key === 'code') {
      return sortConfig.direction === 'asc'
        ? a.code.localeCompare(b.code)
        : b.code.localeCompare(a.code);
    }
    if (sortConfig.key === 'credits') {
      return sortConfig.direction === 'asc' 
        ? Number(a.credits) - Number(b.credits) 
        : Number(b.credits) - Number(a.credits);
    }
    return 0;
  });

  // Filter courses based on search term
  const filteredCourses = sortedCourses.filter(course =>
    course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.program.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Move selected course to top
  const displayedCourses = selectedCourse
    ? [selectedCourse, ...filteredCourses.filter(c => c.id !== selectedCourse.id)]
    : filteredCourses;

  const handleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Load course details when selected
  const handleSelectCourse = async (courseId: number) => {
    try {
      setLoading(prev => ({ ...prev, details: true }));
      setError(null);
      
      const details = await getCourseDetails(courseId);
      setSelectedCourse(details);
      setIsDetailsModalOpen(true);
      setEditMode(false);
      setFormData({
        name: details.name,
        code: details.code,
        credits: details.credits,
        description: details.description || '',
        programId: details.program.id,
        semesterId: details.semester.id,
        lecturerId: details.lecturer?.id
      });
    } catch (err) {
      console.error(err);
      setError('Unable to load course details. Please try again.');
    } finally {
      setLoading(prev => ({ ...prev, details: false }));
    }
  };

  const openLecturerModal = async () => {
    try {
      setLoadingLecturers(true);
      const lecturers = await getAllLecturers();
      setLecturerOptions(lecturers);
      setIsLecturerModalOpen(true);
    } catch (err) {
      console.error(err);
      setError('Unable to load lecturers. Please try again.');
    } finally {
      setLoadingLecturers(false);
    }
  };

  const handleSelectLecturer = (lecturerId: number) => {
    if (!selectedCourse) return;
    handleAssignLecturer(lecturerId);
    setIsLecturerModalOpen(false);
  };

  // Create new course
  const handleCreateCourse = async () => {
    if (!formData.name.trim() || !formData.code.trim()) {
      setError('Course name and code are required.');
      return;
    }

    if (!formData.programId || !formData.semesterId) {
      setError('Please select both program and semester.');
      return;
    }

    try {
      setLoading(prev => ({ ...prev, create: true }));
      setError(null);

      const newCourse = await createCourse(formData);
      setCourses(prev => [...prev, newCourse]);
      setIsCreateModalOpen(false);
    } catch (err) {
      console.error(err);
      setError('Unable to create course. Please try again.');
    } finally {
      setLoading(prev => ({ ...prev, create: false }));
    }
  };

  // Update course
  const handleUpdateCourse = async () => {
    if (!selectedCourse || !formData.name.trim() || !formData.code.trim()) {
      setError('Course name and code are required.');
      return;
    }

    try {
      setLoading(prev => ({ ...prev, update: true }));
      setError(null);

      const updatedCourse = await updateCourse(selectedCourse.id, formData);
      
      setCourses(prev => prev.map(course => 
        course.id === selectedCourse.id ? updatedCourse : course
      ));
      
      setSelectedCourse(updatedCourse);
      setEditMode(false);
    } catch (err) {
      console.error(err);
      setError('Unable to update course. Please try again.');
    } finally {
      setLoading(prev => ({ ...prev, update: false }));
    }
  };

  // Assign lecturer to course
  const handleAssignLecturer = async (lecturerId: number) => {
    if (!selectedCourse) return;

    try {
      setError(null);
      const updatedCourse = await assignCourseLecturer(selectedCourse.id, lecturerId);
      
      setCourses(prev => prev.map(course => 
        course.id === selectedCourse.id ? updatedCourse : course
      ));
      
      setSelectedCourse(updatedCourse);
    } catch (err) {
      console.error(err);
      setError('Unable to assign lecturer. Please try again.');
    }
  };

  // Remove lecturer from course
  const handleRemoveLecturer = async () => {
    if (!selectedCourse || !selectedCourse.lecturer) return;

    try {
      setError(null);
      const updatedCourse = await removeCourseLecturer(selectedCourse.id);
      
      setCourses(prev => prev.map(course => 
        course.id === selectedCourse.id ? updatedCourse : course
      ));
      
      setSelectedCourse(updatedCourse);
    } catch (err) {
      console.error(err);
      setError('Unable to remove lecturer. Please try again.');
    }
  };

  // Delete course
  const handleDeleteCourse = async () => {
    if (!selectedCourse) return;

    try {
      setError(null);
      await deleteCourse(selectedCourse.id);
      
      setCourses(prev => prev.filter(course => course.id !== selectedCourse.id));
      setSelectedCourse(null);
      setIsDetailsModalOpen(false);
    } catch (err) {
      console.error(err);
      setError('Unable to delete course. Please try again.');
    }
  };

  const SortIcon = ({ columnKey }: { columnKey: string }) => {
    if (sortConfig.key !== columnKey) return <FiChevronUp className="opacity-30" />;
    return sortConfig.direction === 'asc' ? <FiChevronUp /> : <FiChevronDown />;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Course Management</h1>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 flex items-center gap-2"
        >
          <FiPlus size={16} /> New Course
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
            placeholder="Search courses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Courses Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading.courses ? (
          <div className="p-6">
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-100 rounded animate-pulse"></div>
              ))}
            </div>
          </div>
        ) : courses.length === 0 ? (
          <div className="p-6 text-center">
            <FiBook className="mx-auto h-12 w-12 text-gray-400 mb-2" />
            <p className="text-gray-500">No courses found</p>
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
                      Course Name
                      <SortIcon columnKey="name" />
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('code')}
                  >
                    <div className="flex items-center gap-1">
                      Code
                      <SortIcon columnKey="code" />
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('credits')}
                  >
                    <div className="flex items-center gap-1">
                      Credits
                      <SortIcon columnKey="credits" />
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Program
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Semester
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Lecturer
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {displayedCourses.map((course) => (
                  <tr
                    key={course.id}
                    className={`cursor-pointer transition-colors ${
                      selectedCourse?.id === course.id
                        ? 'bg-blue-50 hover:bg-blue-100'
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => handleSelectCourse(course.id)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {selectedCourse?.id === course.id && (
                          <FiChevronUp className="text-blue-600 mr-2" />
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900">{course.name}</div>
                          {course.description && (
                            <div className="text-sm text-gray-500 truncate max-w-xs">
                              {course.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {course.code}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {course.credits}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {course.program.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {course.semester.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {course.lecturer ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {course.lecturer.firstName} {course.lecturer.lastName}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          Not assigned
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Course Details Modal */}
      {isDetailsModalOpen && selectedCourse && (
        <div className="fixed inset-0 backdrop-blur-sm bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-2xl font-bold text-gray-800">Course Details</h2>
              <button
                onClick={() => {
                  setIsDetailsModalOpen(false);
                  setSelectedCourse(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <FiX size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Course Header */}
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {editMode ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Course Name
                            </label>
                            <input
                              type="text"
                              value={formData.name}
                              onChange={(e) => setFormData({...formData, name: e.target.value})}
                              className="text-black w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Course Code
                            </label>
                            <input
                              type="text"
                              value={formData.code}
                              onChange={(e) => setFormData({...formData, code: e.target.value})}
                              className="text-black w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Credits
                            </label>
                            <input
                              type="number"
                              value={formData.credits}
                              onChange={(e) => setFormData({...formData, credits: Number(e.target.value)})}
                              className="text-black w-full px-3 py-2 border border-gray-300 rounded-md"
                              min="1"
                              max="10"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Description
                            </label>
                            <input
                              type="text"
                              value={formData.description || ''}
                              onChange={(e) => setFormData({...formData, description: e.target.value})}
                              className="text-black w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={handleUpdateCourse}
                            disabled={!formData.name.trim() || !formData.code.trim() || loading.update}
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
                          {selectedCourse.name} ({selectedCourse.code})
                        </h3>
                        <p className="text-gray-600 mb-2">
                          <strong>{selectedCourse.credits}</strong> credits • 
                          <strong> {selectedCourse.program.name}</strong> • 
                          <strong> {selectedCourse.semester.name}</strong>
                        </p>
                        {selectedCourse.description && (
                          <p className="text-gray-600 mb-4">{selectedCourse.description}</p>
                        )}
                      </>
                    )}
                  </div>
                  
                  {!editMode && (
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => setEditMode(true)}
                        className="text-blue-500 hover:text-blue-800 p-2"
                        title="Edit course"
                      >
                        <FiEdit2 size={18} />
                      </button>
                      <button
                        onClick={handleDeleteCourse}
                        className="text-red-600 hover:text-red-800 p-2"
                        title="Delete course"
                      >
                        <FiTrash2 size={18} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Lecturer Management */}
              <div className="border-t pt-6">
                <h4 className="font-semibold text-gray-800 flex items-center gap-2 mb-4">
                  <FiUsers /> Lecturer Management
                </h4>
                
                {selectedCourse.lecturer ? (
                  <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h5 className="font-medium text-gray-800">
                        {selectedCourse.lecturer.firstName} {selectedCourse.lecturer.lastName}
                      </h5>
                      <p className="text-sm text-gray-600">
                        {selectedCourse.lecturer.email}
                      </p>
                    </div>
                    <button
                      onClick={handleRemoveLecturer}
                      className="text-red-600 hover:text-red-800 p-2 flex items-center gap-1 text-sm"
                    >
                      <FiUserMinus size={16} />
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="text-center p-6 bg-gray-50 rounded-lg">
                    <p className="text-gray-500 mb-3">No lecturer assigned</p>
                    <button
                      onClick={openLecturerModal}
                      className="text-blue-500 hover:text-blue-800 p-2 flex items-center gap-1 text-sm mx-auto"
                    >
                      <FiUserPlus size={16} />
                      Assign Lecturer
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lecturer Selection Modal */}
      {isLecturerModalOpen && (
        <div className="fixed inset-0 backdrop-blur-sm bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <FiUsers size={18} /> Select Lecturer
              </h3>
              <button 
                onClick={() => setIsLecturerModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FiX size={20} />
              </button>
            </div>
            
            <div className="p-6">
              {loadingLecturers ? (
                <div className="text-center py-4">
                  <FiLoader className="animate-spin mx-auto mb-2" size={24} />
                  <p>Loading lecturers...</p>
                </div>
              ) : lecturerOptions.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  No lecturers available
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {lecturerOptions.map((lecturer) => (
                    <div
                      key={lecturer.id}
                      className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleSelectLecturer(lecturer.id)}
                    >
                      <h4 className="font-medium text-gray-800">
                        {lecturer.firstName} {lecturer.lastName}
                      </h4>
                      <p className="text-sm text-gray-600">{lecturer.email}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Course Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 backdrop-blur-sm bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <FiPlus size={18} /> Create New Course
              </h3>
              <button 
                onClick={() => setIsCreateModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FiX size={20} />
              </button>
            </div>
            
            <div className="p-6">
              {loadingOptions ? (
                <div className="text-center py-4">
                  <FiLoader className="animate-spin mx-auto mb-2" size={24} />
                  <p>Loading course options...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {error && (
                    <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
                      {error}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Course Name *
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="text-black w-full px-3 py-2 border border-gray-300 rounded-md"
                        placeholder="Introduction to Computer Science"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Course Code *
                      </label>
                      <input
                        type="text"
                        value={formData.code}
                        onChange={(e) => setFormData({...formData, code: e.target.value})}
                        className="text-black w-full px-3 py-2 border border-gray-300 rounded-md"
                        placeholder="CS101"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Credits *
                      </label>
                      <input
                        type="number"
                        value={formData.credits}
                        onChange={(e) => setFormData({...formData, credits: Number(e.target.value)})}
                        className="text-black w-full px-3 py-2 border border-gray-300 rounded-md"
                        min="1"
                        max="10"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <input
                        type="text"
                        value={formData.description || ''}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        className="text-black w-full px-3 py-2 border border-gray-300 rounded-md"
                        placeholder="Course description"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Program *
                      </label>
                      <select
                        value={formData.programId}
                        onChange={(e) => setFormData({...formData, programId: Number(e.target.value)})}
                        className="text-black w-full px-3 py-2 border border-gray-300 rounded-md"
                        required
                      >
                        {programOptions.map((program) => (
                          <option key={program.id} value={program.id}>
                            {program.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Semester *
                      </label>
                      <select
                        value={formData.semesterId}
                        onChange={(e) => setFormData({...formData, semesterId: Number(e.target.value)})}
                        className="text-black w-full px-3 py-2 border border-gray-300 rounded-md"
                        required
                      >
                        {semesterOptions.map((semester) => (
                          <option key={semester.id} value={semester.id}>
                            {semester.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex justify-end gap-3 p-4 border-t">
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                disabled={loading.create}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCourse}
                disabled={
                  !formData.name.trim() || 
                  !formData.code.trim() || 
                  loading.create || 
                  loadingOptions ||
                  formData.programId === 0 ||
                  formData.semesterId === 0
                }
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
                    Create Course
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}