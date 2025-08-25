'use client';

import { useState, useEffect } from 'react';
import {
  getStudentEnrolledCourses,
  getCourseMaterials,
  getProgramMaterials,
  getCourseAssignments,
  getCourseQuizzes,
  submitAssignment,
  submitQuiz
} from '@/lib/actions/student.course.actions';
import type {
  EnrolledCourse,
  CourseMaterial,
  CourseAssignment,
  CourseQuiz
} from '@/lib/actions/student.course.actions';
import {
  FiBook,
  FiClock,
  FiUpload,
  FiFileText,
  FiCheckCircle,
  FiXCircle,
  FiChevronDown,
  FiChevronUp,
  FiEye,
  FiSearch,
  FiX,
  FiGrid,
  FiLayers
} from 'react-icons/fi';
import { FaChalkboardTeacher } from 'react-icons/fa';
import { getDocumentViewerUrl } from '@/lib/actions/view.document.action';
import dynamic from 'next/dynamic';
const DocumentViewer = dynamic(() => import('../documentViewer'), { ssr: false });

interface StudentCourseManagerProps {
  enrolledCourses: EnrolledCourse[];
  availableCourses: {
    id: number;
    name: string;
    code: string;
    credits: number;
    description: string | null;
    lecturer: {
      firstName: string | null;
      lastName: string | null;
    } | null;
  }[];
}

export default function StudentCourseManager({
  enrolledCourses: initialEnrolledCourses,
}: StudentCourseManagerProps) {
  const [selectedCourse, setSelectedCourse] = useState<EnrolledCourse | null>(
    initialEnrolledCourses[0] || null
  );
  const [courses, setCourses] = useState<EnrolledCourse[]>([]);
  const [materials, setMaterials] = useState<CourseMaterial[]>([]);
  const [assignments, setAssignments] = useState<CourseAssignment[]>([]);
  const [quizzes, setQuizzes] = useState<CourseQuiz[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'materials' | 'assignments' | 'quizzes'>('materials');
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<CourseAssignment | null>(null);
  const [selectedQuiz, setSelectedQuiz] = useState<CourseQuiz | null>(null);
  const [submissionFile, setSubmissionFile] = useState<File | null>(null);
  const [expandedMaterialIds, setExpandedMaterialIds] = useState<Set<number>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [materialsViewMode, setMaterialsViewMode] = useState<'course' | 'program'>('course');
  const [allProgramMaterials, setAllProgramMaterials] = useState<CourseMaterial[]>([]);
  
  // Document viewer state
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [currentDocument, setCurrentDocument] = useState<{
    url: string;
    type: string;
    title: string;
    content?: string;
  } | null>(null);

  const toggleExpanded = (id: number) => {
    setExpandedMaterialIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Filter courses based on search term
  const filteredCourses = courses.filter(course => 
    course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.programName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get the appropriate materials based on view mode
  const displayedMaterials = materialsViewMode === 'course' 
    ? materials 
    : allProgramMaterials;

  // Fetch all enrolled courses
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setIsLoading(true);
        const data = await getStudentEnrolledCourses();
        setCourses(data);
        if (data.length > 0) {
          setSelectedCourse(data[0]);
        }
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load courses');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourses();
  }, []);

  // Fetch all program materials once when component mounts
  useEffect(() => {
    const fetchProgramMaterials = async () => {
      try {
        const programMats = await getProgramMaterials();
        setAllProgramMaterials(programMats);
      } catch (err) {
        console.error('Failed to load program materials:', err);
      }
    };

    fetchProgramMaterials();
  }, []);

  // Fetch course details when selected or view mode changes
  useEffect(() => {
    if (!selectedCourse) return;

    const fetchCourseDetails = async () => {
      try {
        setIsLoading(true);
        
        if (materialsViewMode === 'course') {
          // Fetch only current course materials
          const [mats, assigns, quizs] = await Promise.all([
            getCourseMaterials(selectedCourse.id),
            getCourseAssignments(selectedCourse.id),
            getCourseQuizzes(selectedCourse.id)
          ]);
          setMaterials(mats);
          setAssignments(assigns);
          setQuizzes(quizs);
        } else {
          // Fetch all program materials (already cached) and current course assignments/quizzes
          const [assigns, quizs] = await Promise.all([
            getCourseAssignments(selectedCourse.id),
            getCourseQuizzes(selectedCourse.id)
          ]);
          setAssignments(assigns);
          setQuizzes(quizs);
          // Materials are already set from allProgramMaterials
        }
        
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load course details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourseDetails();
  }, [selectedCourse, materialsViewMode]);

  // Toggle between course and program view
  const toggleMaterialsView = () => {
    setMaterialsViewMode(prev => prev === 'course' ? 'program' : 'course');
  };

  const handleAssignmentSubmit = async () => {
    if (!selectedAssignment || !submissionFile) return;

    try {
      setIsLoading(true);
      const formData = new FormData();
      formData.append('file', submissionFile);
      
      const updatedAssignment = await submitAssignment(selectedAssignment.id, formData);
      
      setAssignments(assignments.map(a => 
        a.id === updatedAssignment.assignmentId ? { 
          ...a, 
          submitted: true, 
          submission: {
            fileUrl: updatedAssignment.fileUrl,
            submittedAt: updatedAssignment.submittedAt,
            grade: null,
            remarks: null
          } 
        } : a
      ));
      
      setShowAssignmentModal(false);
      setSelectedAssignment(null);
      setSubmissionFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit assignment');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuizSubmit = async () => {
    if (!selectedQuiz || !submissionFile) return;

    try {
      setIsLoading(true);
      const formData = new FormData();
      formData.append('file', submissionFile);
      
      const updatedQuiz = await submitQuiz(selectedQuiz.id, formData);
      
      setQuizzes(quizzes.map(q => 
        q.id === updatedQuiz.quizId ? { 
          ...q, 
          submitted: true, 
          submission: {
            fileUrl: updatedQuiz.fileUrl,
            submittedAt: updatedQuiz.submittedAt,
            score: null
          } 
        } : q
      ));
      
      setShowQuizModal(false);
      setSelectedQuiz(null);
      setSubmissionFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit quiz');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSubmissionFile(e.target.files[0]);
    }
  };

  const handleViewMaterial = async (material: CourseMaterial) => {
    if (!material.id) {
      setError('Invalid material');
      return;
    }

    try {
      setError(null);

      if (material.type === 'notes') {
        setCurrentDocument({
          url: '',
          type: 'notes',
          title: material.title,
          content: material.content as string,
        });
        setIsViewerOpen(true);
        return;
      }

      const result = await getDocumentViewerUrl(material.id, 'course-material');
      if (!result.success || !result.fileUrl) {
        setError(result.error || 'Failed to retrieve document URL');
        return;
      }

      setCurrentDocument({
        url: result.fileUrl,
        type: 'pdf',
        title: material.title,
      });
      setIsViewerOpen(true);
    } catch (error) {
      console.error('Error retrieving document URL:', error);
      setError('Failed to open document viewer');
    }
  };

  const getMaterialContent = (material: CourseMaterial): string => {
    if (!material.content) return '';

    if (typeof material.content === 'string') {
      return material.content;
    }

    if (typeof material.content === 'object' && material.content !== null) {
      if ('html' in material.content && typeof material.content.html === 'string') {
        return material.content.html;
      }
      
      try {
        return JSON.stringify(material.content);
      } catch {
        return '';
      }
    }

    return '';
  };

  const groupMaterialsBySemester = (materials: CourseMaterial[]) => {
    const grouped: { [key: string]: CourseMaterial[] } = {};
    
    materials.forEach(material => {
      const semesterKey = material.semesterName || 'Unknown Semester';
      if (!grouped[semesterKey]) {
        grouped[semesterKey] = [];
      }
      grouped[semesterKey].push(material);
    });
    
    return grouped;
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <FaChalkboardTeacher className="h-8 w-8 text-pink-600" />
          <h1 className="text-3xl font-bold text-gray-800">My Courses</h1>
        </div>
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
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-700">My Enrollments</h2>
          </div>
          
          {/* Search Box */}
          <div className="relative mb-4">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search courses..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-100 rounded-lg animate-pulse"></div>
              ))}
            </div>
          ) : courses.length === 0 ? (
            <div className="p-6 text-center bg-gray-50 rounded-lg">
              <FiBook className="mx-auto h-12 w-12 text-gray-400 mb-2" />
              <p className="text-gray-500">Not enrolled in any courses</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg shadow-sm border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Course
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Credits
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredCourses.map((course) => (
                    <tr 
                      key={course.id} 
                      className={`cursor-pointer transition-colors ${
                        selectedCourse?.id === course.id
                          ? 'bg-pink-50 hover:bg-pink-100'
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedCourse(course)}
                    >
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{course.name}</div>
                            <div className="text-sm text-gray-500">{course.code}</div>
                            <div className="text-xs text-gray-400 mt-1">{course.programName}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-pink-100 text-pink-800">
                          {course.credits} cr
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Course Content */}
        {selectedCourse && (
          <div className="lg:col-span-3">
            {/* Course Header */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                {selectedCourse.name} ({selectedCourse.code})
              </h2>
              <p className="text-gray-600 mt-1">
                {selectedCourse.programName} • {selectedCourse.semesterName}
              </p>
              {selectedCourse.description && (
                <p className="mt-4 text-gray-700">{selectedCourse.description}</p>
              )}
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 mb-6">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('materials')}
                  className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                    activeTab === 'materials'
                      ? 'border-pink-500 text-pink-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <FiFileText /> Materials ({displayedMaterials.length})
                </button>
                <button
                  onClick={() => setActiveTab('assignments')}
                  className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                    activeTab === 'assignments'
                      ? 'border-pink-500 text-pink-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <FiUpload /> Assignments ({assignments.length})
                </button>
                <button
                  onClick={() => setActiveTab('quizzes')}
                  className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                    activeTab === 'quizzes'
                      ? 'border-pink-500 text-pink-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <FiClock /> Quizzes ({quizzes.length})
                </button>
              </nav>
            </div>

            {/* Content */}
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse"></div>
                ))}
              </div>
            ) : (
              <>
                {/* Materials Tab - Updated with view mode toggle */}
                {activeTab === 'materials' && (
                  <div className="space-y-4">
                    {/* View Mode Toggle */}
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium text-gray-800">
                        {materialsViewMode === 'course' ? 'Course Materials' : 'All Program Materials'}
                      </h3>
                      <button
                        onClick={toggleMaterialsView}
                        className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-300 hover:bg-gray-200 rounded-md transition-colors"
                        title={materialsViewMode === 'course' ? 'View all program materials' : 'View only current course materials'}
                      >
                        {materialsViewMode === 'course' ? (
                          <>
                            <FiLayers size={14} />
                            View All Program
                          </>
                        ) : (
                          <>
                            <FiGrid size={14} />
                            View This Course Only
                          </>
                        )}
                      </button>
                    </div>

                    {displayedMaterials.length === 0 ? (
                      <div className="p-6 text-center bg-gray-50 rounded-lg">
                        <FiFileText className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                        <p className="text-gray-500">No materials available</p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {Object.entries(groupMaterialsBySemester(displayedMaterials)).map(([semesterName, semesterMaterials]) => (
                          <div key={semesterName} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                              <h3 className="font-semibold text-gray-800">{semesterName}</h3>
                            </div>
                            <div className="divide-y divide-gray-200">
                              {semesterMaterials.map((material) => {
                                const isExpanded = expandedMaterialIds.has(material.id);
                                
                                return (
                                  <div key={material.id} className="bg-white">
                                    {/* Card Header */}
                                    <div 
                                      className="flex justify-between items-center p-4 cursor-pointer hover:bg-gray-50"
                                      onClick={() => toggleExpanded(material.id)}
                                    >
                                      <div>
                                        <h4 className="font-medium text-gray-800">{material.title}</h4>
                                        <div className="flex items-center gap-2 mt-1">
                                          <span className="text-xs px-2 py-1 bg-pink-100 text-pink-800 rounded-full capitalize">
                                            {material.type.replace('_', ' ')}
                                          </span>
                                          <span className="text-xs text-gray-500">
                                            {material.courseCode} • Uploaded {formatDate(material.uploadedAt)}
                                          </span>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-3">
                                        {material.type !== 'notes' && (
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleViewMaterial(material);
                                            }}
                                            className="text-pink-600 hover:text-pink-800 p-1"
                                            title="View"
                                          >
                                            <FiEye size={16} />
                                          </button>
                                        )}
                                        {isExpanded ? (
                                          <FiChevronUp className="text-gray-500" />
                                        ) : (
                                          <FiChevronDown className="text-gray-500" />
                                        )}
                                      </div>
                                    </div>

                                    {/* Card Content - Collapsible */}
                                    {isExpanded && (
                                      <div className="px-4 pb-4 border-t border-gray-100">
                                        {material.type === 'notes' ? (
                                          <div className="mt-3 p-3 bg-gray-50 rounded-md">
                                            <div 
                                              className="prose prose-sm max-w-none text-black" 
                                              dangerouslySetInnerHTML={{ __html: getMaterialContent(material) }}
                                            />
                                          </div>
                                        ) : (
                                          <div className="mt-3 flex gap-2">
                                            <button
                                              onClick={() => handleViewMaterial(material)}
                                              className="px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700 transition-colors"
                                            >
                                              View Material
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Assignments Tab */}
                {activeTab === 'assignments' && (
                  <div className="space-y-4">
                    {assignments.length === 0 ? (
                      <div className="p-6 text-center bg-gray-50 rounded-lg">
                        <FiFileText className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                        <p className="text-gray-500">No assignments available</p>
                      </div>
                    ) : (
                      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assignment</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {assignments.map((assignment) => (
                              <tr key={assignment.id}>
                                <td className="px-6 py-4">
                                  <div className="font-medium text-gray-900">
                                    {assignment.title}
                                  </div>
                                  {assignment.description && (
                                    <div className="text-sm text-gray-500 mt-1 line-clamp-2">
                                      {assignment.description}
                                    </div>
                                  )}
                                  
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  <div className="flex items-center">
                                    <FiClock className="mr-1" />
                                    {formatDate(assignment.dueDate)}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  {assignment.submitted ? (
                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                      Submitted
                                    </span>
                                  ) : (
                                    new Date(assignment.dueDate) < new Date() ? (
                                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                        Overdue
                                      </span>
                                    ) : (
                                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                        Pending
                                      </span>
                                    )
                                  )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {assignment.submitted && assignment.submission?.grade !== null ? 
                                    `${assignment.submission?.grade}%` : '--'
                                  }
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                  <div className="flex gap-3">
                                    {!assignment.submitted ? (
                                      <button
                                        onClick={() => {
                                          setSelectedAssignment(assignment);
                                          setShowAssignmentModal(true);
                                        }}
                                        className="text-pink-600 hover:text-pink-900"
                                      >
                                        <FiUpload size={16} />
                                      </button>
                                    ) : (
                                      <>
                                        
                                        {assignment.submission?.grade !== null && (
                                          <span className="text-green-600">
                                            <FiCheckCircle size={16} />
                                          </span>
                                        )}
                                      </>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* Quizzes Tab */}
                {activeTab === 'quizzes' && (
                  <div className="space-y-4">
                    {quizzes.length === 0 ? (
                      <div className="p-6 text-center bg-gray-50 rounded-lg">
                        <FiFileText className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                        <p className="text-gray-500">No quizzes available</p>
                      </div>
                    ) : (
                      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quiz</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {quizzes.map((quiz) => (
                              <tr key={quiz.id}>
                                <td className="px-6 py-4">
                                  <div className="font-medium text-gray-900">
                                    {quiz.title}
                                  </div>
                                  {quiz.instructions && (
                                    <div className="text-sm text-gray-500 mt-1 line-clamp-2">
                                      {quiz.instructions}
                                    </div>
                                  )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {formatDate(quiz.quizDate)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  {quiz.submitted ? (
                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                      Submitted
                                    </span>
                                  ) : new Date(quiz.quizDate) < new Date() ? (
                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                      Missed
                                    </span>
                                  ) : (
                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                      Pending
                                    </span>
                                  )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {quiz.submitted && quiz.submission?.score !== null ? 
                                    `${quiz.submission?.score}/${quiz.totalMarks}` : '--'
                                  }
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                  <div className="flex gap-3">
                                    {!quiz.submitted && new Date(quiz.quizDate) >= new Date() ? (
                                      <button
                                        onClick={() => {
                                          setSelectedQuiz(quiz);
                                          setShowQuizModal(true);
                                        }}
                                        className="text-pink-600 hover:text-pink-900"
                                      >
                                        <FiUpload size={16} />
                                      </button>
                                    ) : quiz.submitted ? (
                                      <>
                                        {quiz.submission?.score !== null && (
                                          <span className="text-green-600">
                                            <FiCheckCircle size={16} />
                                          </span>
                                        )}
                                      </>
                                    ) : (
                                      <span className="text-red-600">
                                        <FiXCircle size={16} />
                                      </span>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Assignment Submission Modal */}
      {showAssignmentModal && selectedAssignment && (
        <div className="fixed inset-0 backdrop-blur-sm border border-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-auto">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">
                Submit Assignment: {selectedAssignment.title}
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="assignmentFile" className="block text-sm font-medium text-gray-700 mb-1">
                    Submission File
                  </label>
                  <input
                    type="file"
                    id="assignmentFile"
                    onChange={handleFileChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAssignmentModal(false);
                      setSelectedAssignment(null);
                      setSubmissionFile(null);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleAssignmentSubmit}
                    disabled={!submissionFile || isLoading}
                    className={`px-4 py-2 text-white rounded-md ${
                      !submissionFile || isLoading
                        ? 'bg-pink-400 cursor-not-allowed'
                        : 'bg-pink-600 hover:bg-pink-700'
                    }`}
                  >
                    {isLoading ? 'Submitting...' : 'Submit Assignment'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quiz Submission Modal */}
      {showQuizModal && selectedQuiz && (
        <div className="fixed inset-0 backdrop-blur-sm border border-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-auto">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">
                Submit Quiz: {selectedQuiz.title}
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                Total Marks: {selectedQuiz.totalMarks}
              </p>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="quizFile" className="block text-sm font-medium text-gray-700 mb-1">
                    Submission File
                  </label>
                  <input
                    type="file"
                    id="quizFile"
                    onChange={handleFileChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowQuizModal(false);
                      setSelectedQuiz(null);
                      setSubmissionFile(null);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleQuizSubmit}
                    disabled={!submissionFile || isLoading}
                    className={`px-4 py-2 text-white rounded-md ${
                      !submissionFile || isLoading
                        ? 'bg-pink-400 cursor-not-allowed'
                        : 'bg-pink-600 hover:bg-pink-700'
                    }`}
                  >
                    {isLoading ? 'Submitting...' : 'Submit Quiz'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Document Viewer Modal */}
      {isViewerOpen && currentDocument && (
        <div className="fixed inset-0 backdrop-blur-sm border border-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-800">
                {currentDocument.title}
              </h2>
              <button
                onClick={() => setIsViewerOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX size={24} />
              </button>
            </div>
            <div className="p-6">
              <DocumentViewer 
                document={currentDocument} 
                onClose={() => setIsViewerOpen(false)} 
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}