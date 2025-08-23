'use client';

import { useState, useEffect } from 'react';
import {
  getLecturerAssignments,
  getAssignmentWithSubmissions,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  gradeSubmission,
} from '@/lib/actions/lecturer.manage.assignments.action';
import type {
  AssignmentWithCourse,
  AssignmentSubmissionWithStudent,
} from '@/lib/actions/lecturer.manage.assignments.action';
import {
  FiFileText,
  FiEdit,
  FiTrash2,
  FiPlus,
  FiDownload,
  FiUser,
  FiUpload,
  FiX
} from 'react-icons/fi';
import { FaChalkboardTeacher } from 'react-icons/fa';
import { getDownloadUrl } from '@/lib/actions/files.download.action';
import { getLecturerCourses } from '@/lib/actions/lecturer.manage.results.action';

interface Course {
  id: number;
  name: string;
  code: string;
}

export default function LecturerAssignmentsManager() {
  const [assignments, setAssignments] = useState<AssignmentWithCourse[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<{
    assignment: AssignmentWithCourse;
    submissions: AssignmentSubmissionWithStudent[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [showAssignmentFormModal, setShowAssignmentFormModal] = useState(false);
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<AssignmentWithCourse | null>(null);
  const [currentSubmission, setCurrentSubmission] = useState<AssignmentSubmissionWithStudent | null>(null);
  const [lecturerCourses, setLecturerCourses] = useState<Course[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form states
  const [grade, setGrade] = useState('');
  const [remarks, setRemarks] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Fetch all assignments and courses
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [assignmentsData, coursesData] = await Promise.all([
          getLecturerAssignments(),
          getLecturerCourses()
        ]);
        setAssignments(assignmentsData);
        setLecturerCourses(coursesData);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Fetch assignment details when selected
  const handleSelectAssignment = async (assignment: AssignmentWithCourse) => {
    try {
      setIsLoading(true);
      const data = await getAssignmentWithSubmissions(assignment.id);

      // Transform the data to match your state's type
      const transformedSubmissions = data.submissions.map(submission => ({
        ...submission,
        grade: submission.grade !== null ? Number(submission.grade) : null,
      }));

      const transformedData = {
        ...data,
        submissions: transformedSubmissions
      };

      setSelectedAssignment(transformedData);
      setError(null);
      setIsModalOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load assignment details');
    } finally {
      setIsLoading(false);
    }
  };

  // Close modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedAssignment(null);
    setError(null);
  };

  // Handle assignment form submit
  const handleAssignmentSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    try {
      if (selectedFile) {
        formData.set('file', selectedFile);
      }

      const dueDate = formData.get('dueDate') as string;
      if (dueDate) {
        formData.set('dueDate', new Date(dueDate).toISOString());
      }

      if (editingAssignment) {
        const updated = await updateAssignment(editingAssignment.id, formData);
        const course = editingAssignment.course;

        const assignmentWithCourse = {
          ...updated,
          course: course
        };

        setAssignments(assignments.map(a => a.id === assignmentWithCourse.id ? assignmentWithCourse : a));
        
        if (selectedAssignment?.assignment.id === assignmentWithCourse.id) {
          setSelectedAssignment({
            assignment: assignmentWithCourse,
            submissions: selectedAssignment.submissions
          });
        }
      } else {
        const created = await createAssignment(formData);
        const course = assignments[0]?.course;

        if (!course) {
          throw new Error('Could not find course information for new assignment.');
        }
        
        const newAssignmentWithCourse = {
          ...created,
          course: course
        };
        
        setAssignments([newAssignmentWithCourse, ...assignments]);
      }
      
      setShowAssignmentFormModal(false);
      setEditingAssignment(null);
      setSelectedFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save assignment');
    }
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  // Handle grade submission
  const handleGradeSubmit = async () => {
    if (!currentSubmission) return;
    
    try {
      const graded = await gradeSubmission(
        currentSubmission.id,
        parseFloat(grade),
        remarks
      );
      
      if (selectedAssignment) {
        setSelectedAssignment({
          assignment: selectedAssignment.assignment,
          submissions: selectedAssignment.submissions.map(s => 
            s.id === graded.id ? { 
              ...s, 
              grade: graded.grade ? parseFloat(graded.grade) : null, 
              remarks: graded.remarks 
            } : s
          )
        });
      }
      
      setShowGradeModal(false);
      setGrade('');
      setRemarks('');
      setCurrentSubmission(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit grade');
    }
  };

  // Handle delete confirmation
  const handleDeleteConfirmed = async () => {
    if (!editingAssignment) return;
    
    try {
      await deleteAssignment(editingAssignment.id);
      setAssignments(assignments.filter(a => a.id !== editingAssignment.id));
      if (selectedAssignment?.assignment.id === editingAssignment.id) {
        setSelectedAssignment(null);
      }
      setShowDeleteConfirmation(false);
      setEditingAssignment(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete assignment');
    }
  };

  const handleDownload = async (itemId: number, itemType: 'assignment' | 'quiz' | 'course-material') => {
    try {
      const result = await getDownloadUrl(itemId, itemType);
      
      if (result.success && result.url) {
        const a = document.createElement('a');
        a.href = result.url;
        a.download = '';
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        throw new Error(result.error || 'Failed to get download URL');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Download failed');
    }
  };

  // Format date for display
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format date for datetime-local input
  const formatDateForInput = (date: Date) => {
    const d = new Date(date);
    const pad = (num: number) => num.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <FaChalkboardTeacher className="h-8 w-8 text-indigo-600" />
          <h1 className="text-3xl font-bold text-gray-800">Assignments Manager</h1>
        </div>
        <button
          onClick={() => {
            setEditingAssignment(null);
            setShowAssignmentFormModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
        >
          <FiPlus /> Create Assignment
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Assignments Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-700">Your Assignments</h2>
        </div>
        
        {isLoading ? (
          <div className="p-4">
            <div className="animate-pulse">
              <div className="h-10 bg-gray-200 rounded mb-2"></div>
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-14 bg-gray-100 rounded mb-2"></div>
              ))}
            </div>
          </div>
        ) : assignments.length === 0 ? (
          <div className="p-6 text-center">
            <FiFileText className="mx-auto h-12 w-12 text-gray-400 mb-2" />
            <p className="text-gray-500">No assignments created yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Course
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {assignments.map((assignment) => (
                  <tr 
                    key={assignment.id} 
                    className="hover:bg-gray-50 cursor-pointer"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {assignment.title}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {assignment.course.code}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(assignment.dueDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      Active
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleSelectAssignment(assignment)}
                          className="text-pink-600 hover:text-pink-900"
                        >
                          View Details
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingAssignment(assignment);
                            setShowAssignmentFormModal(true);
                          }}
                          className="text-gray-500 hover:text-pink-600 ml-2"
                          title="Edit assignment"
                        >
                          <FiEdit size={16} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingAssignment(assignment);
                            setShowDeleteConfirmation(true);
                          }}
                          className="text-gray-500 hover:text-red-600 ml-2"
                          title="Delete assignment"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Assignment Management Modal */}
      {isModalOpen && selectedAssignment && (
        <div className="fixed inset-0 backdrop-blur-sm bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  {selectedAssignment.assignment.title}
                </h2>
                <p className="text-gray-600 mt-1">
                  {selectedAssignment.assignment.course.code} - {selectedAssignment.assignment.course.name}
                </p>
              </div>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX size={24} />
              </button>
            </div>

            {/* Assignment Details */}
            <div className="p-6 bg-gray-50 border-b border-gray-200">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <p className="text-xs text-gray-500">Assigned Date</p>
                  <p className="font-medium text-pink-600 text-sm">
                    {formatDate(selectedAssignment.assignment.assignedDate)}
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <p className="text-xs text-gray-500">Due Date</p>
                  <p className="font-medium text-red-600 text-sm">
                    {formatDate(selectedAssignment.assignment.dueDate)}
                  </p>
                </div>
              </div>

              {selectedAssignment.assignment.description && (
                <div className="mt-4 bg-white p-4 rounded-lg shadow-sm">
                  <p className="text-sm text-gray-700">{selectedAssignment.assignment.description}</p>
                </div>
              )}

              {selectedAssignment.assignment.fileUrl && (
                <div className="mt-4">
                  <button
                    onClick={() => handleDownload(selectedAssignment.assignment.id, 'assignment')}
                    className="inline-flex items-center text-pink-600 hover:text-pink-800"
                    title="Download assignment"
                  >
                    <FiDownload className="mr-2" />
                    Download Assignment File
                  </button>
                </div>
              )}
            </div>

            {/* Submissions Section */}
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-700">
                  Student Submissions ({selectedAssignment.submissions.length})
                </h2>
              </div>

              {selectedAssignment.submissions.length === 0 ? (
                <div className="p-6 text-center bg-gray-50 rounded-lg">
                  <FiUser className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                  <p className="text-gray-500">No submissions yet</p>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedAssignment.submissions.map((submission) => (
                        <tr key={submission.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-medium text-gray-900">
                              {submission.student.firstName} {submission.student.lastName}
                            </div>
                            <div className="text-sm text-gray-500">{submission.student.registrationNumber}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(submission.submittedAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {submission.grade !== null ? submission.grade : 'Not graded'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex gap-3">
                              <button
                                onClick={() => handleDownload(submission.id, 'assignment')}
                                className="text-pink-600 hover:text-pink-900"
                                title="Download submission"
                              >
                                <FiDownload size={16} />
                              </button>
                              <button
                                onClick={() => {
                                  setCurrentSubmission(submission);
                                  setGrade(submission.grade?.toString() || '');
                                  setRemarks(submission.remarks || '');
                                  setShowGradeModal(true);
                                }}
                                className="text-gray-600 hover:text-green-600"
                                title="Grade submission"
                              >
                                <FiEdit size={16} />
                              </button>
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
        </div>
      )}

      {/* Assignment Form Modal */}
      {showAssignmentFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4 text-pink-500">
                {editingAssignment ? 'Edit Assignment' : 'Create New Assignment'}
              </h2>
              
              <form onSubmit={handleAssignmentSubmit}>
                <div className="space-y-4">
                  {/* Title Field */}
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                      Title
                    </label>
                    <input
                      type="text"
                      id="title"
                      name="title"
                      defaultValue={editingAssignment?.title || ''}
                      required
                      className="text-pink-500 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
                    />
                  </div>

                  {/* Course Select Field */}
                  <div>
                    <label htmlFor="courseId" className="block text-sm font-medium text-gray-700 mb-1">
                      Course
                    </label>
                    <select
                      id="courseId"
                      name="courseId"
                      defaultValue={editingAssignment?.course.id || ''}
                      required
                      className="text-pink-500 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
                    >
                      <option value="" disabled>Select a course</option>
                      {lecturerCourses.map(course => (
                        <option key={course.id} value={course.id}>
                          {course.code} - {course.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Description Field */}
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      defaultValue={editingAssignment?.description || ''}
                      rows={3}
                      className="text-pink-500 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
                    />
                  </div>

                  {/* File Upload Field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Assignment File
                    </label>
                    <div className="relative">
                      <label className={`flex flex-col items-center justify-center w-full px-4 py-6 border-2 border-dashed ${
                        selectedFile ? 'border-pink-300' : 'border-gray-300'
                      } rounded-md cursor-pointer hover:border-pink-400 transition-colors`}>
                        <input
                          type="file"
                          id="file"
                          name="file"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                        <div className="flex flex-col items-center justify-center text-center">
                          <FiUpload className="w-6 h-6 mb-2 text-gray-400" />
                          {selectedFile ? (
                            <p className="text-sm font-medium text-pink-600">
                              {selectedFile.name}
                            </p>
                          ) : editingAssignment?.fileUrl ? (
                            <>
                              <p className="text-sm font-medium text-pink-600">
                                Current file: {editingAssignment.fileUrl.split('/').pop()}
                              </p>
                              <p className="text-xs italic text-gray-400 mt-1">
                                Click to change file
                              </p>
                            </>
                          ) : (
                            <>
                              <p className="text-sm text-gray-500">
                                <span className="font-medium">Click to upload</span> or drag and drop
                              </p>
                              <p className="text-xs italic text-gray-400 mt-1">
                                PDF, DOCX, PPTX (Max 10MB)
                              </p>
                            </>
                          )}
                        </div>
                      </label>
                    </div>
                    {editingAssignment?.fileUrl && !selectedFile && (
                      <div className="mt-2 flex justify-center">
                        <a 
                          href={editingAssignment.fileUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-pink-600 hover:text-pink-800"
                        >
                          View current file
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Due Date Field */}
                  <div>
                    <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-1">
                      Due Date
                    </label>
                    <input
                      type="datetime-local"
                      id="dueDate"
                      name="dueDate"
                      defaultValue={editingAssignment ? formatDateForInput(editingAssignment.dueDate) : ''}
                      required
                      className="text-pink-500 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
                    />
                  </div>

                  {/* Form Actions */}
                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAssignmentFormModal(false);
                        setEditingAssignment(null);
                        setSelectedFile(null);
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700"
                    >
                      {editingAssignment ? 'Update Assignment' : 'Create Assignment'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Grade Submission Modal */}
      {showGradeModal && currentSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">
                Grade Submission
              </h2>
              <p className="mb-2">
                Student: {currentSubmission.student.firstName} {currentSubmission.student.lastName}
              </p>
              <p className="mb-4 text-sm text-gray-500">
                {currentSubmission.student.registrationNumber}
              </p>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="grade" className="block text-sm font-medium text-gray-700 mb-1">
                    Grade
                  </label>
                  <input
                    type="number"
                    id="grade"
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    min="0"
                    max="100"
                    step="0.01"
                    className="text-black w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
                  />
                </div>

                <div>
                  <label htmlFor="remarks" className="block text-sm font-medium text-gray-700 mb-1">
                    Remarks
                  </label>
                  <textarea
                    id="remarks"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    rows={3}
                    className="text-black w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowGradeModal(false);
                      setCurrentSubmission(null);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleGradeSubmit}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    Submit Grade
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmation && editingAssignment && (
        <div className="fixed inset-0 backdrop-blur-sm bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Confirm Deletion</h2>
              <p className="mb-6">
                Are you sure you want to delete this assignment: <span className="font-semibold">{editingAssignment.title}</span>?
                This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDeleteConfirmation(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirmed}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}