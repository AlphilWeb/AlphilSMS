// components/admin/admin.students.client.tsx
'use client';

import { useState, useEffect } from 'react';
import {
  getAllStudents,
  getStudentDetails,
  createStudent,
  updateStudent,
  deleteStudent,
  getStudentEnrollments,
  type StudentWithDetails,
  type StudentDetails,
  type StudentEnrollment,
  searchStudents,
} from '@/lib/actions/admin/students.action';

import {
  FiUser, FiBook, FiPlus, FiEdit2, FiTrash2, 
  FiLoader, FiX,
   FiSearch, FiInfo, FiCheck
} from 'react-icons/fi';
import { ActionError } from '@/lib/utils';

export default function AdminStudentsClient() {
  const [students, setStudents] = useState<StudentWithDetails[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<StudentDetails | null>(null);
  const [enrollments, setEnrollments] = useState<StudentEnrollment[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [loading, setLoading] = useState({
    students: true,
    details: false,
    enrollments: false,
    create: false,
    update: false
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    registrationNumber: '',
    studentNumber: '',
    programId: 1,
    departmentId: 1,
    currentSemesterId: 1
  });

  // Fetch all students on component mount and when search changes
  useEffect(() => {
    const loadStudents = async () => {
      try {
        setLoading(prev => ({ ...prev, students: true }));
        setError(null);
        const studentsData = await getAllStudents();
        setStudents(studentsData);
      } catch (err) {
        setError(err instanceof ActionError ? err.message : 'Failed to load students');
      } finally {
        setLoading(prev => ({ ...prev, students: false }));
      }
    };

    loadStudents();
  }, []);

  // Handle search
  useEffect(() => {
    if (!searchQuery.trim()) return;

    const timer = setTimeout(async () => {
      try {
        setLoading(prev => ({ ...prev, students: true }));
        const results = await searchStudents(searchQuery);
        setStudents(results);
      } catch (err) {
        setError(err instanceof ActionError ? err.message : 'Search failed');
      } finally {
        setLoading(prev => ({ ...prev, students: false }));
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load student details when selected
  const handleSelectStudent = async (studentId: number) => {
    try {
      setLoading(prev => ({ ...prev, details: true, enrollments: true }));
      setError(null);
      
      const [details, studentEnrollments] = await Promise.all([
        getStudentDetails(studentId),
        getStudentEnrollments(studentId)
      ]);

      setSelectedStudent(details);
      setEnrollments(studentEnrollments);
      setFormData({
        firstName: details.firstName,
        lastName: details.lastName,
        email: details.email,
        registrationNumber: details.registrationNumber,
        studentNumber: details.studentNumber,
        programId: details.program.id,
        departmentId: details.department.id,
        currentSemesterId: details.currentSemester.id
      });
      setIsViewModalOpen(true);
    } catch (err) {
      setError(err instanceof ActionError ? err.message : 'Failed to load student details');
    } finally {
      setLoading(prev => ({ ...prev, details: false, enrollments: false }));
    }
  };

  // Create new student
  const handleCreateStudent = async () => {
    try {
      setLoading(prev => ({ ...prev, create: true }));
      setError(null);

      const newStudent = await createStudent({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        registrationNumber: formData.registrationNumber,
        studentNumber: formData.studentNumber,
        programId: formData.programId,
        departmentId: formData.departmentId,
        currentSemesterId: formData.currentSemesterId
      });
      
      setStudents(prev => [...prev, {
        id: newStudent.id,
        firstName: newStudent.firstName,
        lastName: newStudent.lastName,
        email: newStudent.email,
        registrationNumber: newStudent.registrationNumber,
        studentNumber: newStudent.studentNumber,
        program: {
          id: formData.programId,
          name: '' // Will be updated when selected
        },
        department: {
          id: formData.departmentId,
          name: '' // Will be updated when selected
        },
        currentSemester: {
          id: formData.currentSemesterId,
          name: '' // Will be updated when selected
        },
        createdAt: new Date(),
        updatedAt: new Date()
      }]);
      
      setIsCreateModalOpen(false);
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        registrationNumber: '',
        studentNumber: '',
        programId: 1,
        departmentId: 1,
        currentSemesterId: 1
      });
      setSuccess('Student created successfully!');
    } catch (err) {
      setError(err instanceof ActionError ? err.message : 'Failed to create student');
    } finally {
      setLoading(prev => ({ ...prev, create: false }));
    }
  };

  // Update student
  const handleUpdateStudent = async () => {
    if (!selectedStudent) return;

    try {
      setLoading(prev => ({ ...prev, update: true }));
      setError(null);

      const updatedStudent = await updateStudent(selectedStudent.id, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        registrationNumber: formData.registrationNumber,
        studentNumber: formData.studentNumber,
        programId: formData.programId,
        departmentId: formData.departmentId,
        currentSemesterId: formData.currentSemesterId
      });
      
      setStudents(prev => prev.map(student => 
        student.id === selectedStudent.id 
          ? { 
              ...student, 
              ...updatedStudent,
              program: {
                id: formData.programId,
                name: student.program.name
              },
              department: {
                id: formData.departmentId,
                name: student.department.name
              },
              currentSemester: {
                id: formData.currentSemesterId,
                name: student.currentSemester.name
              }
            } 
          : student
      ));
      
      setSelectedStudent(prev => prev ? { 
        ...prev, 
        ...updatedStudent,
        program: {
          id: formData.programId,
          name: prev.program.name
        },
        department: {
          id: formData.departmentId,
          name: prev.department.name
        },
        currentSemester: {
          id: formData.currentSemesterId,
          name: prev.currentSemester.name
        }
      } : null);
      
      setIsEditModalOpen(false);
      setSuccess('Student updated successfully!');
    } catch (err) {
      setError(err instanceof ActionError ? err.message : 'Failed to update student');
    } finally {
      setLoading(prev => ({ ...prev, update: false }));
    }
  };

  // Delete student
  const handleDeleteStudent = async () => {
    if (!selectedStudent) return;

    if (!confirm('Are you sure you want to delete this student?')) return;

    try {
      setError(null);
      await deleteStudent(selectedStudent.id);
      
      setStudents(prev => prev.filter(s => s.id !== selectedStudent.id));
      setSelectedStudent(null);
      setIsViewModalOpen(false);
      setSuccess('Student deleted successfully!');
    } catch (err) {
      setError(err instanceof ActionError ? err.message : 'Failed to delete student');
    }
  };

  // Format date for display
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Student Management</h1>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2 bg-emerald-600 text-white text-sm rounded-md hover:bg-emerald-700 flex items-center gap-2"
        >
          <FiPlus size={16} /> New Student
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
              <div className="text-emerald-500 absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search students..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="text-black pl-10 w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {loading.students ? (
            <div className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-10 bg-gray-200 rounded"></div>
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-12 bg-gray-100 rounded"></div>
                ))}
              </div>
            </div>
          ) : students.length === 0 ? (
            <div className="p-6 text-center">
              <FiUser className="mx-auto h-12 w-12 text-gray-400 mb-2" />
              <p className="text-gray-500">No students found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Program
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Registration
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {students.map((student) => (
                    <tr 
                      key={student.id} 
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                            <FiUser className="text-emerald-600" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {student.firstName} {student.lastName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {student.studentNumber}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{student.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{student.program.name}</div>
                        <div className="text-sm text-gray-500">{student.department.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{student.registrationNumber}</div>
                        <div className="text-sm text-gray-500">
                          Joined {formatDate(student.createdAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleSelectStudent(student.id)}
                          className="text-emerald-600 hover:text-emerald-900 mr-4"
                          title="View Details"
                        >
                          <FiInfo />
                        </button>
                        <button
                          onClick={() => {
                            handleSelectStudent(student.id);
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
                            setSelectedStudent(student);
                            handleDeleteStudent();
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

      {/* Create Student Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex justify-between items-center border-b p-6">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <FiPlus size={18} /> Create New Student
              </h2>
              <button 
                onClick={() => setIsCreateModalOpen(false)}
                className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
              >
                <FiX size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
                    placeholder="John"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
                    placeholder="Doe"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
                  placeholder="john.doe@university.edu"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Registration Number
                  </label>
                  <input
                    type="text"
                    value={formData.registrationNumber}
                    onChange={(e) => setFormData({...formData, registrationNumber: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
                    placeholder="REG123456"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Student Number
                  </label>
                  <input
                    type="text"
                    value={formData.studentNumber}
                    onChange={(e) => setFormData({...formData, studentNumber: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
                    placeholder="STU789012"
                  />
                </div>
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
                onClick={handleCreateStudent}
                disabled={!formData.firstName || !formData.lastName || !formData.email || 
                         !formData.registrationNumber || !formData.studentNumber || loading.create}
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
                    Create Student
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Student Details Modal */}
      {isViewModalOpen && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="relative bg-white rounded-xl shadow-2xl max-w-2xl w-full">
            <div className="flex justify-between items-center border-b p-6">
              <h2 className="text-xl font-bold text-gray-800">Student Details</h2>
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
              >
                <FiX size={20} />
              </button>
            </div>
            
            <div className="p-6">
              <div className="flex items-start gap-6">
                <div className="flex-shrink-0 h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center">
                  <FiUser className="text-emerald-600 text-2xl" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-gray-800">
                    {selectedStudent.firstName} {selectedStudent.lastName}
                  </h2>
                  <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Email</h3>
                      <p className="mt-1 text-sm text-gray-900">{selectedStudent.email}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Student Number</h3>
                      <p className="mt-1 text-sm text-gray-900">{selectedStudent.studentNumber}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Registration Number</h3>
                      <p className="mt-1 text-sm text-gray-900">{selectedStudent.registrationNumber}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Date Joined</h3>
                      <p className="mt-1 text-sm text-gray-900">{formatDate(selectedStudent.createdAt)}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Program</h3>
                      <p className="mt-1 text-sm text-gray-900">{selectedStudent.program.name}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Department</h3>
                      <p className="mt-1 text-sm text-gray-900">{selectedStudent.department.name}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Enrollments Section */}
              <div className="mt-8">
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                  <FiBook /> Enrollments
                </h3>
                {loading.enrollments ? (
                  <div className="animate-pulse space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-16 bg-gray-100 rounded"></div>
                    ))}
                  </div>
                ) : enrollments.length === 0 ? (
                  <div className="p-4 text-center text-gray-500 bg-gray-50 rounded-lg">
                    No enrollments found for this student
                  </div>
                ) : (
                  <div className="overflow-hidden border border-gray-200 rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Course
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Semester
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Enrollment Date
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {enrollments.map((enrollment) => (
                          <tr key={enrollment.id}>
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
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {enrollment.enrollmentDate ? new Date(enrollment.enrollmentDate).toLocaleDateString() : 'N/A'}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
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
                Edit Student
              </button>
              <button
                onClick={handleDeleteStudent}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md flex items-center gap-2"
              >
                <FiTrash2 size={16} />
                Delete Student
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

      {/* Edit Student Modal */}
      {isEditModalOpen && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex justify-between items-center border-b p-6">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <FiEdit2 size={18} /> Edit Student
              </h2>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
              >
                <FiX size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Registration Number
                  </label>
                  <input
                    type="text"
                    value={formData.registrationNumber}
                    onChange={(e) => setFormData({...formData, registrationNumber: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Student Number
                </label>
                <input
                  type="text"
                  value={formData.studentNumber}
                  onChange={(e) => setFormData({...formData, studentNumber: e.target.value})}
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
                onClick={handleUpdateStudent}
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