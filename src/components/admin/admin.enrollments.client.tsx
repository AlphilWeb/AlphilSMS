// components/admin/admin.enrollments.client.tsx
'use client';

import { useState, useEffect } from 'react';
import {
  fetchFilteredEnrollments,
  fetchEnrollmentsTotalPages,
  fetchEnrollmentById,
  updateEnrollment,
  deleteEnrollment,
  fetchAllStudents,
  fetchAllSemesters,
  fetchCoursesBySemester,
  checkEnrollmentExists,
  type EnrollmentWithDetails
} from '@/lib/actions/admin/enrollments.actions';

import {
  FiUser, FiBook, FiPlus, FiEdit2, FiTrash2, 
  FiLoader, FiX, FiSearch, FiInfo, FiCheck, FiCalendar
} from 'react-icons/fi';
import { ActionError } from '@/lib/utils';

export default function AdminEnrollmentsClient() {
  const [enrollments, setEnrollments] = useState<EnrollmentWithDetails[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [loading, setLoading] = useState({
    enrollments: true,
    details: false,
    create: false,
    update: false,
    students: false,
    semesters: false,
    courses: false
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form data
  const [formData, setFormData] = useState({
    studentId: 0,
    courseId: 0,
    semesterId: 0,
    enrollmentDate: new Date().toISOString().split('T')[0]
  });

  interface Student {
    id: number;
    firstName: string;
    lastName: string;
    registrationNumber: string;
  }
  interface Semester {
    id: number;
    name: string;
    startDate: string;
    endDate: string;
  }
  interface Course {
    id: number;
    name: string;
    code: string;
  }

  const [students, setStudents] = useState<Student[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedEnrollment, setSelectedEnrollment] = useState<{
    id: number;
    studentId: number;
    courseId: number;
    semesterId: number;
    enrollmentDate: string | null;
  } | null>(null);

  // Fetch initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(prev => ({ ...prev, enrollments: true, students: true, semesters: true }));
        
        const [enrollmentsData, total, studentsData, semestersData] = await Promise.all([
          fetchFilteredEnrollments('', currentPage, itemsPerPage),
          fetchEnrollmentsTotalPages('', itemsPerPage),
          fetchAllStudents(),
          fetchAllSemesters()
        ]);

        setEnrollments(enrollmentsData);
        setTotalPages(total);
        setStudents(studentsData);
        setSemesters(semestersData);

        // Load courses if we have a semester
        if (semestersData.length > 0) {
          const coursesData = await fetchCoursesBySemester(semestersData[0].id);
          setCourses(coursesData);
        }
      } catch (err) {
        setError(err instanceof ActionError ? err.message : 'Failed to load initial data');
      } finally {
        setLoading(prev => ({
          ...prev,
          enrollments: false,
          students: false,
          semesters: false
        }));
      }
    };

    loadInitialData();
  }, [currentPage, itemsPerPage]);

  // Handle search - FIXED: Now reloads when search is cleared
  useEffect(() => {
    const searchEnrollments = async () => {
      try {
        setLoading(prev => ({ ...prev, enrollments: true }));
        const [results, total] = await Promise.all([
          fetchFilteredEnrollments(searchQuery, currentPage, itemsPerPage),
          fetchEnrollmentsTotalPages(searchQuery, itemsPerPage)
        ]);
        setEnrollments(results);
        setTotalPages(total);
      } catch (err) {
        setError(err instanceof ActionError ? err.message : 'Search failed');
      } finally {
        setLoading(prev => ({ ...prev, enrollments: false }));
      }
    };

    const timer = setTimeout(searchEnrollments, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, currentPage, itemsPerPage]);

  // Load courses when semester changes - FIXED: Made more robust
  const handleSemesterChange = async (semesterId: number) => {
    try {
      setLoading(prev => ({ ...prev, courses: true }));
      const coursesData = await fetchCoursesBySemester(semesterId);
      setCourses(coursesData);
      setFormData(prev => ({ ...prev, semesterId, courseId: 0 }));
    } catch (err) {
      setError(err instanceof ActionError ? err.message : 'Failed to load courses');
    } finally {
      setLoading(prev => ({ ...prev, courses: false }));
    }
  };

  // Select enrollment for viewing/editing - FIXED: Properly loads courses for the selected semester
  const handleSelectEnrollment = async (id: number) => {
    try {
      setLoading(prev => ({ ...prev, details: true }));
      setError(null);
      
      const enrollment = await fetchEnrollmentById(id);
      setSelectedEnrollment(enrollment);
      
      // Load courses for the selected semester
      const coursesData = await fetchCoursesBySemester(enrollment.semesterId);
      setCourses(coursesData);
      
      setFormData({
        studentId: enrollment.studentId,
        courseId: enrollment.courseId,
        semesterId: enrollment.semesterId,
        enrollmentDate: enrollment.enrollmentDate ? enrollment.enrollmentDate.split('T')[0] : new Date().toISOString().split('T')[0]
      });
      setIsViewModalOpen(true);
    } catch (err) {
      setError(err instanceof ActionError ? err.message : 'Failed to load enrollment details');
    } finally {
      setLoading(prev => ({ ...prev, details: false }));
    }
  };

  // Create new enrollment
  const handleCreateEnrollment = async () => {
    try {
      setLoading(prev => ({ ...prev, create: true }));
      setError(null);

      // Check if enrollment already exists
      const exists = await checkEnrollmentExists(
        formData.studentId,
        formData.courseId,
        formData.semesterId
      );

      if (exists) {
        throw new ActionError('This student is already enrolled in this course for the selected semester.');
      }

      // Refresh the enrollments list
      const [enrollmentsData, total] = await Promise.all([
        fetchFilteredEnrollments(searchQuery, currentPage, itemsPerPage),
        fetchEnrollmentsTotalPages(searchQuery, itemsPerPage)
      ]);

      setEnrollments(enrollmentsData);
      setTotalPages(total);
      
      setIsCreateModalOpen(false);
      setFormData({
        studentId: 0,
        courseId: 0,
        semesterId: semesters[0]?.id || 0,
        enrollmentDate: new Date().toISOString().split('T')[0]
      });
      setSuccess('Enrollment created successfully!');
    } catch (err) {
      setError(err instanceof ActionError ? err.message : 'Failed to create enrollment');
    } finally {
      setLoading(prev => ({ ...prev, create: false }));
    }
  };

  // Update enrollment
  const handleUpdateEnrollment = async () => {
    if (!selectedEnrollment) return;

    try {
      setLoading(prev => ({ ...prev, update: true }));
      setError(null);

      const formPayload = new FormData();
      formPayload.append('studentId', String(formData.studentId));
      formPayload.append('courseId', String(formData.courseId));
      formPayload.append('semesterId', String(formData.semesterId));
      formPayload.append('enrollmentDate', formData.enrollmentDate);

      await updateEnrollment(selectedEnrollment.id, formPayload);

      // Refresh the enrollments list
      const [enrollmentsData, total] = await Promise.all([
        fetchFilteredEnrollments(searchQuery, currentPage, itemsPerPage),
        fetchEnrollmentsTotalPages(searchQuery, itemsPerPage)
      ]);

      setEnrollments(enrollmentsData);
      setTotalPages(total);
      
      setIsEditModalOpen(false);
      setSuccess('Enrollment updated successfully!');
    } catch (err) {
      setError(err instanceof ActionError ? err.message : 'Failed to update enrollment');
    } finally {
      setLoading(prev => ({ ...prev, update: false }));
    }
  };

  // Delete enrollment
  const handleDeleteEnrollment = async () => {
    if (!selectedEnrollment) return;

    if (!confirm('Are you sure you want to delete this enrollment?')) return;

    try {
      setError(null);
      await deleteEnrollment(selectedEnrollment.id);
      
      // Refresh the enrollments list
      const [enrollmentsData, total] = await Promise.all([
        fetchFilteredEnrollments(searchQuery, currentPage, itemsPerPage),
        fetchEnrollmentsTotalPages(searchQuery, itemsPerPage)
      ]);

      setEnrollments(enrollmentsData);
      setTotalPages(total);
      setSelectedEnrollment(null);
      setIsViewModalOpen(false);
      setSuccess('Enrollment deleted successfully!');
    } catch (err) {
      setError(err instanceof ActionError ? err.message : 'Failed to delete enrollment');
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Handle search input change - FIXED: Clear search functionality
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    // Reset to first page when searching
    if (value !== searchQuery) {
      setCurrentPage(1);
    }
  };

  // Clear search and reload all enrollments
  const clearSearch = () => {
    setSearchQuery('');
    setCurrentPage(1);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Enrollment Management</h1>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2 bg-emerald-600 text-white text-sm rounded-md hover:bg-emerald-700 flex items-center gap-2"
        >
          <FiPlus size={16} /> New Enrollment
        </button>
      </div>

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
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search enrollments..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="text-black pl-10 w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  <FiX size={16} />
                </button>
              )}
            </div>
          </div>

          {loading.enrollments ? (
            <div className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-10 bg-gray-200 rounded"></div>
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-12 bg-gray-100 rounded"></div>
                ))}
              </div>
            </div>
          ) : enrollments.length === 0 ? (
            <div className="p-6 text-center">
              <FiBook className="mx-auto h-12 w-12 text-gray-400 mb-2" />
              <p className="text-gray-500">
                {searchQuery ? 'No enrollments found matching your search' : 'No enrollments found'}
              </p>
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="mt-2 px-4 py-2 text-sm text-emerald-600 hover:text-emerald-800"
                >
                  Clear search
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Course
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Semester
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Enrollment Date
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {enrollments.map((enrollment) => (
                      <tr 
                        key={enrollment.id} 
                        className="hover:bg-gray-50"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                              <FiUser className="text-emerald-600" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {enrollment.student.firstName} {enrollment.student.lastName}
                              </div>
                              <div className="text-sm text-gray-500">
                                {enrollment.student.registrationNumber}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {enrollment.course.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {enrollment.course.code}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {enrollment.semester.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            
{enrollment.semester?.startDate && (
  <p>{formatDate(enrollment.semester.startDate)}</p>
)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {enrollment.enrollmentDate ? formatDate(enrollment.enrollmentDate) : 'N/A'}
                            {/* {formatDate(enrollment.enrollmentDate)} */}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleSelectEnrollment(enrollment.id)}
                            className="text-emerald-600 hover:text-emerald-900 mr-4"
                            title="View Details"
                          >
                            <FiInfo />
                          </button>
                          <button
                            onClick={() => {
                              handleSelectEnrollment(enrollment.id);
                              setIsViewModalOpen(false);
                              setIsEditModalOpen(true);
                            }}
                            className="text-blue-600 hover:text-blue-900 mr-4"
                            title="Edit"
                          >
                            <FiEdit2 />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedEnrollment({
                                id: enrollment.id,
                                studentId: enrollment.student.id ?? 0,
                                courseId: enrollment.course.id ?? 0,
                                semesterId: enrollment.semester.id ?? 0,
                                enrollmentDate: enrollment.enrollmentDate,
                              });
                              handleDeleteEnrollment();
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

              {/* Pagination */}
              <div className="px-6 py-4 border-t flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Create Enrollment Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex justify-between items-center border-b p-6">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <FiPlus size={18} /> Create New Enrollment
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
                  Student
                </label>
                <select
                  value={formData.studentId}
                  onChange={(e) => setFormData({...formData, studentId: Number(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
                  disabled={loading.students}
                >
                  <option value={0}>Select a student</option>
                  {students.map(student => (
                    <option key={student.id} value={student.id}>
                      {student.firstName} {student.lastName} ({student.registrationNumber})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Semester
                </label>
                <select
                  value={formData.semesterId}
                  onChange={(e) => {
                    const semesterId = Number(e.target.value);
                    setFormData({...formData, semesterId, courseId: 0});
                    handleSemesterChange(semesterId);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
                  disabled={loading.semesters}
                >
                  <option value={0}>Select a semester</option>
                  {semesters.map(semester => (
                    <option key={semester.id} value={semester.id}>
                      {semester.name} ({formatDate(semester.startDate)} - {formatDate(semester.endDate)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Course
                </label>
                <select
                  value={formData.courseId}
                  onChange={(e) => setFormData({...formData, courseId: Number(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
                  disabled={loading.courses || !formData.semesterId}
                >
                  <option value={0}>Select a course</option>
                  {courses.map(course => (
                    <option key={course.id} value={course.id}>
                      {course.name} ({course.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Enrollment Date
                </label>
                <input
                  type="date"
                  value={formData.enrollmentDate}
                  onChange={(e) => setFormData({...formData, enrollmentDate: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 p-6 border-t">
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateEnrollment}
                disabled={!formData.studentId || !formData.courseId || !formData.semesterId || loading.create}
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
                    Create Enrollment
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Enrollment Details Modal */}
      {isViewModalOpen && selectedEnrollment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="relative bg-white rounded-xl shadow-2xl max-w-2xl w-full">
            <div className="flex justify-between items-center border-b p-6">
              <h2 className="text-xl font-bold text-gray-800">Enrollment Details</h2>
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
              >
                <FiX size={20} />
              </button>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Student Info */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                    <FiUser /> Student Information
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Name</h4>
                      <p className="mt-1 text-sm text-gray-900">
                        {enrollments.find(e => e.id === selectedEnrollment.id)?.student.firstName || 'N/A'}{' '}
                        {enrollments.find(e => e.id === selectedEnrollment.id)?.student.lastName || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Registration Number</h4>
                      <p className="mt-1 text-sm text-gray-900">
                        {enrollments.find(e => e.id === selectedEnrollment.id)?.student.registrationNumber || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Program</h4>
                      <p className="mt-1 text-sm text-gray-900">
                        {enrollments.find(e => e.id === selectedEnrollment.id)?.student.program.name || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Course Info */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                    <FiBook /> Course Information
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Course Name</h4>
                      <p className="mt-1 text-sm text-gray-900">
                        {enrollments.find(e => e.id === selectedEnrollment.id)?.course.name || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Course Code</h4>
                      <p className="mt-1 text-sm text-gray-900">
                        {enrollments.find(e => e.id === selectedEnrollment.id)?.course.code || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Semester</h4>
                      <p className="mt-1 text-sm text-gray-900">
                        {enrollments.find(e => e.id === selectedEnrollment.id)?.semester.name || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Enrollment Details */}
              <div className="mt-6 bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                  <FiCalendar /> Enrollment Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Enrollment Date</h4>
                    <p className="mt-1 text-sm text-gray-900">
                      {formatDate(selectedEnrollment.enrollmentDate || '')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 p-6 border-t">
              <button
                onClick={() => {
                  setIsViewModalOpen(false);
                  setIsEditModalOpen(true);
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md flex items-center gap-2"
              >
                <FiEdit2 size={16} />
                Edit Enrollment
              </button>
              <button
                onClick={handleDeleteEnrollment}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md flex items-center gap-2"
              >
                <FiTrash2 size={16} />
                Delete Enrollment
              </button>
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Enrollment Modal */}
      {isEditModalOpen && selectedEnrollment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex justify-between items-center border-b p-6">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <FiEdit2 size={18} /> Edit Enrollment
              </h2>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
              >
                <FiX size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Student
                </label>
                <select
                  value={formData.studentId}
                  onChange={(e) => setFormData({...formData, studentId: Number(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
                  disabled={loading.students}
                >
                  <option value={0}>Select a student</option>
                  {students.map(student => (
                    <option key={student.id} value={student.id}>
                      {student.firstName} {student.lastName} ({student.registrationNumber})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Semester
                </label>
                <select
                  value={formData.semesterId}
                  onChange={(e) => {
                    const semesterId = Number(e.target.value);
                    setFormData({...formData, semesterId, courseId: 0});
                    handleSemesterChange(semesterId);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
                  disabled={loading.semesters}
                >
                  <option value={0}>Select a semester</option>
                  {semesters.map(semester => (
                    <option key={semester.id} value={semester.id}>
                      {semester.name} ({formatDate(semester.startDate)} - {formatDate(semester.endDate)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Course
                </label>
                <select
                  value={formData.courseId}
                  onChange={(e) => setFormData({...formData, courseId: Number(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
                  disabled={loading.courses || !formData.semesterId}
                >
                  <option value={0}>Select a course</option>
                  {courses.map(course => (
                    <option key={course.id} value={course.id}>
                      {course.name} ({course.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Enrollment Date
                </label>
                <input
                  type="date"
                  value={formData.enrollmentDate}
                  onChange={(e) => setFormData({...formData, enrollmentDate: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 p-6 border-t">
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateEnrollment}
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