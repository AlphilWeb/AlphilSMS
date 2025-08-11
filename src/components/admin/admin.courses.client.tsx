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
  deleteCourse,
  type CourseWithDetails,
  type CourseFormValues,
} from '@/lib/actions/admin/courses.actions';

import {
  FiUsers, FiBook, FiPlus, FiEdit2, FiTrash2,
  FiUserPlus, FiUserMinus, FiLoader, FiX,
} from 'react-icons/fi';
import { ActionError } from '@/lib/utils';

export default function AdminCoursesClient() {
  const [courses, setCourses] = useState<CourseWithDetails[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<CourseWithDetails | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
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
    credits: 3, // Default credits
    programId: 1, // Default to first program
    semesterId: 1, // Default to first semester
  });
  const [editMode, setEditMode] = useState(false);

  // Fetch all courses on component mount
  useEffect(() => {
    const loadCourses = async () => {
      try {
        setLoading(prev => ({ ...prev, courses: true }));
        const data = await getAllCourses();
        setCourses(data);
      } catch (err) {
        setError(err instanceof ActionError ? err.message : 'Failed to load courses');
      } finally {
        setLoading(prev => ({ ...prev, courses: false }));
      }
    };

    loadCourses();
  }, []);

  // Load course details when selected
  const handleSelectCourse = async (courseId: number) => {
    try {
      setLoading(prev => ({ ...prev, details: true }));
      setError(null);
      
      const details = await getCourseDetails(courseId);
      setSelectedCourse(details);
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
      setError(err instanceof ActionError ? err.message : 'Failed to load course details');
    } finally {
      setLoading(prev => ({ ...prev, details: false }));
    }
  };

  // Create new course
  const handleCreateCourse = async () => {
    if (!formData.name.trim() || !formData.code.trim()) {
      setError('Course name and code are required');
      return;
    }

    try {
      setLoading(prev => ({ ...prev, create: true }));
      setError(null);

      const newCourse = await createCourse(formData);
      setCourses(prev => [...prev, newCourse]);
      
      // Select the new course
      await handleSelectCourse(newCourse.id);
      setIsCreateModalOpen(false);
      setFormData({
        name: '',
        code: '',
        credits: 3,
        programId: 1,
        semesterId: 1,
      });
    } catch (err) {
      setError(err instanceof ActionError ? err.message : 'Failed to create course');
    } finally {
      setLoading(prev => ({ ...prev, create: false }));
    }
  };

  // Update course
  const handleUpdateCourse = async () => {
    if (!selectedCourse || !formData.name.trim() || !formData.code.trim()) {
      setError('Course name and code are required');
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
      setError(err instanceof ActionError ? err.message : 'Failed to update course');
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
      setError(err instanceof ActionError ? err.message : 'Failed to assign lecturer');
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
      setError(err instanceof ActionError ? err.message : 'Failed to remove lecturer');
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
    } catch (err) {
      setError(err instanceof ActionError ? err.message : 'Failed to delete course');
    }
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

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Courses List */}
        <div className="lg:col-span-1">
          {loading.courses ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse"></div>
              ))}
            </div>
          ) : courses.length === 0 ? (
            <div className="p-6 text-center bg-gray-50 rounded-lg">
              <FiBook className="mx-auto h-12 w-12 text-gray-400 mb-2" />
              <p className="text-gray-500">No courses found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {courses.map((course) => (
                <div
                  key={course.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    selectedCourse?.id === course.id 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                  onClick={() => handleSelectCourse(course.id)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-gray-800">{course.name}</h3>
                      <p className="text-sm text-gray-600">{course.code} • {course.credits} credits</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {course.program.name} • {course.semester.name}
                      </p>
                    </div>
                    {course.lecturer && (
                      <span 
                        className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full"
                        title={`Lecturer: ${course.lecturer.firstName} ${course.lecturer.lastName}`}
                      >
                        LEC
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Course Details */}
        <div className="lg:col-span-3">
          {!selectedCourse ? (
            <div className="p-6 text-center bg-gray-50 rounded-lg">
              <FiBook className="mx-auto h-12 w-12 text-gray-400 mb-2" />
              <p className="text-gray-500">Select a course to view details</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Course Header */}
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-start justify-between">
                  <div>
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
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
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
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
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
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
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
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={handleUpdateCourse}
                            disabled={!formData.name.trim() || !formData.code.trim() || loading.update}
                            className={`px-3 py-2 text-sm rounded-md text-white ${
                              loading.update ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
                            } transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed`}
                          >
                            {loading.update ? 'Saving...' : 'Save'}
                          </button>
                          <button
                            onClick={() => setEditMode(false)}
                            className="px-3 py-2 text-sm rounded-md bg-gray-200 hover:bg-gray-300"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                          {selectedCourse.name} ({selectedCourse.code})
                          <button
                            onClick={() => setEditMode(true)}
                            className="text-blue-500 hover:text-blue-800 p-1"
                            title="Edit course"
                          >
                            <FiEdit2 size={18} />
                          </button>
                        </h2>
                        <p className="text-gray-600 mt-2">
                          {selectedCourse.credits} credits • {selectedCourse.program.name} • {selectedCourse.semester.name}
                        </p>
                        {selectedCourse.description && (
                          <p className="text-gray-600 mt-2">{selectedCourse.description}</p>
                        )}
                        {selectedCourse.lecturer && (
                          <p className="text-gray-600 mt-2">
                            Lecturer: {selectedCourse.lecturer.firstName} {selectedCourse.lecturer.lastName}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                  
                  <button
                    onClick={handleDeleteCourse}
                    className="text-red-600 hover:text-red-800 p-1"
                    title="Delete course"
                  >
                    <FiTrash2 size={18} />
                  </button>
                </div>
              </div>

              {/* Lecturer Management */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b">
                  <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                    <FiUsers /> Lecturer Management
                  </h3>
                </div>
                <div className="p-4">
                  {selectedCourse.lecturer ? (
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-medium text-gray-800">
                          {selectedCourse.lecturer.firstName} {selectedCourse.lecturer.lastName}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {selectedCourse.lecturer.email}
                        </p>
                      </div>
                      <button
                        onClick={handleRemoveLecturer}
                        className="text-red-600 hover:text-red-800 p-1 flex items-center gap-1 text-sm"
                      >
                        <FiUserMinus size={16} />
                        <span>Remove Lecturer</span>
                      </button>
                    </div>
                  ) : (
                    <div className="text-center text-gray-500">
                      <p className="mb-3">No lecturer assigned</p>
                      <button
                        onClick={() => {
                          // In a real app, you'd have a modal or dropdown to select lecturer
                          // For demo, we'll just assign a dummy lecturer
                          handleAssignLecturer(1);
                        }}
                        className="text-blue-500 hover:text-blue-800 p-1 flex items-center gap-1 text-sm mx-auto"
                      >
                        <FiUserPlus size={16} />
                        <span>Assign Lecturer</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="Introduction to Computer Science"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="CS101"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      min="1"
                      max="10"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Program
                    </label>
                    <select
                      value={formData.programId}
                      onChange={(e) => setFormData({...formData, programId: Number(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      {/* In a real app, you would fetch programs */}
                      <option value="1">Computer Science</option>
                      <option value="2">Business Administration</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Semester
                    </label>
                    <select
                      value={formData.semesterId}
                      onChange={(e) => setFormData({...formData, semesterId: Number(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      {/* In a real app, you would fetch semesters */}
                      <option value="1">Fall 2023</option>
                      <option value="2">Spring 2024</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description (Optional)
                    </label>
                    <input
                      type="text"
                      value={formData.description || ''}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
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
                onClick={handleCreateCourse}
                disabled={!formData.name.trim() || !formData.code.trim() || loading.create}
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