// components/admin/admin.grades.client.tsx
'use client';

import { useState, useEffect } from 'react';
import {
  getAllGrades,
  getGradesBySemester,
  getGradesByCourse,
  getGradesByStudent,
  getGradeById,
  createGrade,
  // updateGrade,
  deleteGrade,
  type GradeWithDetails,
  type GradeData
} from '@/lib/actions/admin/grades.actions';

import {
  FiBook, FiPlus, FiEdit2, FiTrash2, 
  FiLoader, FiX, FiSearch, FiInfo, 
  FiCheck, FiUser
} from 'react-icons/fi';
import { ActionError } from '@/lib/utils';

export default function AdminGradesClient() {
  const [grades, setGrades] = useState<GradeWithDetails[]>([]);
  const [selectedGrade, setSelectedGrade] = useState<GradeWithDetails | null>(null);
  const [loading, setLoading] = useState({
    grades: true,
    details: false,
    create: false,
    update: false
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'all' | 'semester' | 'course' | 'student'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [selectedSemester, setSelectedSemester] = useState<number | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<number | null>(null);

  const [formData, setFormData] = useState<GradeData>({
    enrollmentId: 0,
    catScore: null,
    examScore: null,
    totalScore: null,
    letterGrade: null,
    gpa: null
  });

  // Fetch grades based on current view mode
  useEffect(() => {
    const loadGrades = async () => {
      try {
        setLoading(prev => ({ ...prev, grades: true }));
        setError(null);
        
        let gradesData: GradeWithDetails[];
        switch (viewMode) {
          case 'semester':
            if (!selectedSemester) return;
            gradesData = await getGradesBySemester(selectedSemester);
            break;
          case 'course':
            if (!selectedCourse) return;
            gradesData = await getGradesByCourse(selectedCourse);
            break;
          case 'student':
            if (!selectedStudent) return;
            gradesData = await getGradesByStudent(selectedStudent);
            break;
          default:
            gradesData = await getAllGrades();
        }
        
        setGrades(gradesData);
      } catch (err) {
        setError(err instanceof ActionError ? err.message : 'Failed to load grades');
      } finally {
        setLoading(prev => ({ ...prev, grades: false }));
      }
    };

    loadGrades();
  }, [viewMode, selectedSemester, selectedCourse, selectedStudent]);

  // Handle search
  useEffect(() => {
    if (!searchQuery.trim()) return;

    const timer = setTimeout(async () => {
      try {
        setLoading(prev => ({ ...prev, grades: true }));
        const allGrades = await getAllGrades();
        const filteredGrades = allGrades.filter(grade => 
          grade.enrollment.student.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          grade.enrollment.student.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          grade.enrollment.student.registrationNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
          grade.enrollment.course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          grade.enrollment.course.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
          grade.enrollment.semester.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setGrades(filteredGrades);
      } catch (err) {
        setError(err instanceof ActionError ? err.message : 'Search failed');
      } finally {
        setLoading(prev => ({ ...prev, grades: false }));
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load grade details when selected
  const handleSelectGrade = async (gradeId: number) => {
    try {
      setLoading(prev => ({ ...prev, details: true }));
      setError(null);
      
      const gradeDetails = await getGradeById(gradeId);
      if (!gradeDetails) {
        throw new ActionError('Grade not found');
      }
      
      setSelectedGrade(gradeDetails);
      setFormData({
        enrollmentId: gradeDetails.enrollment.id,
        catScore: gradeDetails.catScore,
        examScore: gradeDetails.examScore,
        totalScore: gradeDetails.totalScore,
        letterGrade: gradeDetails.letterGrade,
        gpa: gradeDetails.gpa
      });
    } catch (err) {
      setError(err instanceof ActionError ? err.message : 'Failed to load grade details');
    } finally {
      setLoading(prev => ({ ...prev, details: false }));
    }
  };

  // Create new grade
  const handleCreateGrade = async () => {
    try {
      setLoading(prev => ({ ...prev, create: true }));
      setError(null);

      const newGrade = await createGrade(formData);
      
      // Update local state with the new grade
      const gradeDetails = await getGradeById(newGrade.id);
      if (gradeDetails) {
        setGrades(prev => [...prev, gradeDetails]);
      }
      
      setIsCreateModalOpen(false);
      setFormData({
        enrollmentId: 0,
        catScore: null,
        examScore: null,
        totalScore: null,
        letterGrade: null,
        gpa: null
      });
      setSuccess('Grade created successfully!');
    } catch (err) {
      setError(err instanceof ActionError ? err.message : 'Failed to create grade');
    } finally {
      setLoading(prev => ({ ...prev, create: false }));
    }
  };

  // Update grade
  const handleUpdateGrade = async () => {
    if (!selectedGrade) return;

    try {
      setLoading(prev => ({ ...prev, update: true }));
      setError(null);

      // const updatedGrade = await updateGrade(selectedGrade.id, formData);
      
      // Update local state with the updated grade
      const gradeDetails = await getGradeById(selectedGrade.id);
      if (gradeDetails) {
        setGrades(prev => prev.map(g => 
          g.id === selectedGrade.id ? gradeDetails : g
        ));
        setSelectedGrade(gradeDetails);
      }
      
      setIsEditModalOpen(false);
      setSuccess('Grade updated successfully!');
    } catch (err) {
      setError(err instanceof ActionError ? err.message : 'Failed to update grade');
    } finally {
      setLoading(prev => ({ ...prev, update: false }));
    }
  };

  // Delete grade
  const handleDeleteGrade = async () => {
    if (!selectedGrade) return;

    if (!confirm('Are you sure you want to delete this grade record?')) return;

    try {
      setError(null);
      await deleteGrade(selectedGrade.id);
      
      setGrades(prev => prev.filter(g => g.id !== selectedGrade.id));
      setSelectedGrade(null);
      setSuccess('Grade deleted successfully!');
    } catch (err) {
      setError(err instanceof ActionError ? err.message : 'Failed to delete grade');
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

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Grade Management</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 bg-emerald-600 text-white text-sm rounded-md hover:bg-emerald-700 flex items-center gap-2"
          >
            <FiPlus size={16} /> New Grade
          </button>
          <button
            onClick={() => setIsBulkModalOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 flex items-center gap-2"
          >
            <FiPlus size={16} /> Bulk Entry
          </button>
        </div>
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
            All Grades
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
            onClick={() => setViewMode('student')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
              viewMode === 'student'
                ? 'border-emerald-500 text-emerald-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            By Student
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
            {/* In a real app, you would map through semesters from your data */}
            <option value="1">Fall 2023</option>
            <option value="2">Spring 2024</option>
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
            {/* In a real app, you would map through courses from your data */}
            <option value="1">Introduction to Computer Science</option>
            <option value="2">Advanced Mathematics</option>
          </select>
        </div>
      )}

      {viewMode === 'student' && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <label className="block text-sm font-medium text-gray-700 mb-2">Select Student</label>
          <select
            value={selectedStudent || ''}
            onChange={(e) => setSelectedStudent(Number(e.target.value))}
            className="text-black mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-md"
          >
            <option value="">Select a student</option>
            {/* In a real app, you would map through students from your data */}
            <option value="1">John Doe (REG12345)</option>
            <option value="2">Jane Smith (REG67890)</option>
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
              <div className="text-gray-800 absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="text-gray-800" />
              </div>
              <input
                type="text"
                placeholder="Search grades..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="text-black pl-10 w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {loading.grades ? (
            <div className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-10 bg-gray-200 rounded"></div>
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-12 bg-gray-100 rounded"></div>
                ))}
              </div>
            </div>
          ) : grades.length === 0 ? (
            <div className="p-6 text-center">
              <FiBook className="mx-auto h-12 w-12 text-gray-400 mb-2" />
              <p className="text-gray-500">No grades found</p>
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
                      Course
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Semester
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Scores
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Grade
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {grades.map((grade) => (
                    <tr 
                      key={grade.id} 
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                            <FiUser className="text-emerald-600" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {grade.enrollment.student.firstName} {grade.enrollment.student.lastName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {grade.enrollment.student.registrationNumber}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {grade.enrollment.course.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {grade.enrollment.course.code}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {grade.enrollment.semester.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatDate(grade.enrollment.semester.startDate)} - {formatDate(grade.enrollment.semester.endDate)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          CAT: {grade.catScore || 'N/A'}
                        </div>
                        <div className="text-sm text-gray-900">
                          Exam: {grade.examScore || 'N/A'}
                        </div>
                        <div className="text-sm font-medium text-gray-900">
                          Total: {grade.totalScore || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {grade.letterGrade || 'N/A'}
                        </div>
                        <div className="text-sm text-gray-900">
                          GPA: {grade.gpa || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleSelectGrade(grade.id)}
                          className="text-emerald-600 hover:text-emerald-900 mr-4"
                          title="View Details"
                        >
                          <FiInfo />
                        </button>
                        <button
                          onClick={() => {
                            handleSelectGrade(grade.id);
                            setIsEditModalOpen(true);
                          }}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                          title="Edit"
                        >
                          <FiEdit2 />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedGrade(grade);
                            handleDeleteGrade();
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

      {/* Create Grade Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex justify-between items-center border-b p-6">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <FiPlus size={18} /> Create New Grade
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
                  Enrollment ID
                </label>
                <input
                  type="number"
                  value={formData.enrollmentId}
                  onChange={(e) => setFormData({...formData, enrollmentId: Number(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
                  placeholder="12345"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CAT Score
                  </label>
                  <input
                    type="number"
                    value={formData.catScore || ''}
                    onChange={(e) => setFormData({...formData, catScore: e.target.value || null})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
                    placeholder="0-30"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Exam Score
                  </label>
                  <input
                    type="number"
                    value={formData.examScore || ''}
                    onChange={(e) => setFormData({...formData, examScore: e.target.value || null})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
                    placeholder="0-70"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Letter Grade
                  </label>
                  <select
                    value={formData.letterGrade || ''}
                    onChange={(e) => setFormData({...formData, letterGrade: e.target.value || null})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
                  >
                    <option value="">Select grade</option>
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                    <option value="D">D</option>
                    <option value="F">F</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    GPA
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="4"
                    value={formData.gpa || ''}
                    onChange={(e) => setFormData({...formData, gpa: e.target.value || null})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
                    placeholder="0.0-4.0"
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
                onClick={handleCreateGrade}
                disabled={!formData.enrollmentId || loading.create}
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
                    Create Grade
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Grade Modal */}
      {isEditModalOpen && selectedGrade && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex justify-between items-center border-b p-6">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <FiEdit2 size={18} /> Edit Grade
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
                <h3 className="text-sm font-medium text-gray-700">Student</h3>
                <p className="mt-1 text-sm text-gray-900">
                  {selectedGrade.enrollment.student.firstName} {selectedGrade.enrollment.student.lastName}
                </p>
                <p className="text-sm text-gray-500">
                  {selectedGrade.enrollment.student.registrationNumber}
                </p>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-medium text-gray-700">Course</h3>
                <p className="mt-1 text-sm text-gray-900">
                  {selectedGrade.enrollment.course.name} ({selectedGrade.enrollment.course.code})
                </p>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-medium text-gray-700">Semester</h3>
                <p className="mt-1 text-sm text-gray-900">
                  {selectedGrade.enrollment.semester.name}
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CAT Score
                  </label>
                  <input
                    type="number"
                    value={formData.catScore || ''}
                    onChange={(e) => setFormData({...formData, catScore: e.target.value || null})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
                    placeholder="0-30"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Exam Score
                  </label>
                  <input
                    type="number"
                    value={formData.examScore || ''}
                    onChange={(e) => setFormData({...formData, examScore: e.target.value || null})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
                    placeholder="0-70"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Letter Grade
                  </label>
                  <select
                    value={formData.letterGrade || ''}
                    onChange={(e) => setFormData({...formData, letterGrade: e.target.value || null})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
                  >
                    <option value="">Select grade</option>
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                    <option value="D">D</option>
                    <option value="F">F</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    GPA
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="4"
                    value={formData.gpa || ''}
                    onChange={(e) => setFormData({...formData, gpa: e.target.value || null})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
                    placeholder="0.0-4.0"
                  />
                </div>
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
                onClick={handleUpdateGrade}
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

      {/* Bulk Grade Entry Modal */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-4xl">
            <div className="flex justify-between items-center border-b p-6">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <FiPlus size={18} /> Bulk Grade Entry
              </h2>
              <button 
                onClick={() => setIsBulkModalOpen(false)}
                className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
              >
                <FiX size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Course
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
                  >
                    <option value="">Select course</option>
                    {/* In a real app, you would map through courses */}
                    <option value="1">Introduction to Computer Science</option>
                    <option value="2">Advanced Mathematics</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Semester
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
                  >
                    <option value="">Select semester</option>
                    {/* In a real app, you would map through semesters */}
                    <option value="1">Fall 2023</option>
                    <option value="2">Spring 2024</option>
                  </select>
                </div>
              </div>
              
              <div className="mt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Students</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Student
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          CAT Score
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Exam Score
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Letter Grade
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          GPA
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {/* In a real app, you would map through students */}
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                              <FiUser className="text-gray-400" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                John Doe
                              </div>
                              <div className="text-sm text-gray-500">
                                REG12345
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="number"
                            className="w-20 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500 text-gray-800"
                            placeholder="0-30"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="number"
                            className="w-20 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500 text-gray-800"
                            placeholder="0-70"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            className="w-20 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500 text-gray-800"
                          >
                            <option value="">-</option>
                            <option value="A">A</option>
                            <option value="B">B</option>
                            <option value="C">C</option>
                            <option value="D">D</option>
                            <option value="F">F</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            max="4"
                            className="w-20 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500 text-gray-800"
                            placeholder="0.0-4.0"
                          />
                        </td>
                      </tr>
                      {/* Add more student rows as needed */}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 p-6 border-t">
              <button
                onClick={() => setIsBulkModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md flex items-center gap-2"
              >
                <FiPlus size={16} />
                Submit Grades
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}