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
  FiClock,
  FiUser,
  FiUpload,
} from 'react-icons/fi';
import { FaChalkboardTeacher } from 'react-icons/fa';
import { getDownloadUrl } from '@/lib/actions/files.download.action';
import { getLecturerCourses } from '@/lib/actions/lecturer.manage.results.action';

interface Course {
  id: number;
  name: string;
  code: string;
}
interface Assignment {
  id: number;
  title: string;
  description: string | null;
  fileUrl: string | null;
  dueDate: Date;
  assignedDate: Date;
  course: Course;
}
interface LecturerAssignmentsManagerProps {
  initialAssignments: Assignment[];
}

export default function LecturerAssignmentsManager({ 
  initialAssignments 
}: LecturerAssignmentsManagerProps) {
  const [assignments, setAssignments] = useState<AssignmentWithCourse[]>(initialAssignments);
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
  // Form states
  const [grade, setGrade] = useState('');
  const [remarks, setRemarks] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Fetch all assignments
  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        setIsLoading(true);
        const data = await getLecturerAssignments();
        setAssignments(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load assignments');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAssignments();
  }, []);

  useEffect(() => {
  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [assignments, courses] = await Promise.all([
        getLecturerAssignments(),
        getLecturerCourses() // You'll need to implement this function
      ]);
      setAssignments(assignments);
      setLecturerCourses(courses);
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
const handleSelectAssignment = async (id: number) => {
  try {
    setIsLoading(true);
    const data = await getAssignmentWithSubmissions(id);

    // Transform the data to match your state's type
    const transformedSubmissions = data.submissions.map(submission => ({
      ...submission, // Keep all other properties as they are
      grade: submission.grade !== null ? Number(submission.grade) : null, // Convert the grade string to a number
    }));

    // Reconstruct the data object with the transformed submissions
    const transformedData = {
      ...data,
      submissions: transformedSubmissions
    };

    setSelectedAssignment(transformedData);
    setError(null);
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Failed to load assignment details');
  } finally {
    setIsLoading(false);
  }
};

  // Handle assignment form submit
const handleAssignmentSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  const formData = new FormData(e.currentTarget);
  
  try {
    // Handle file upload if a new file is selected
    if (selectedFile) {
      formData.set('file', selectedFile);
    }

    // Format the due date correctly
    const dueDate = formData.get('dueDate') as string;
    if (dueDate) {
      formData.set('dueDate', new Date(dueDate).toISOString());
    }

    if (editingAssignment) {
      // The updateAssignment action returns a plain assignment
      const updated = await updateAssignment(editingAssignment.id, formData);
      
      // Get the full course object from the original editingAssignment
      const course = editingAssignment.course;

      // Create a new object that matches the AssignmentWithCourse type
      const assignmentWithCourse = {
        ...updated,
        course: course // Attach the course object
      };

      setAssignments(assignments.map(a => a.id === assignmentWithCourse.id ? assignmentWithCourse : a));
      
      if (selectedAssignment?.assignment.id === assignmentWithCourse.id) {
        setSelectedAssignment({
          assignment: assignmentWithCourse,
          submissions: selectedAssignment.submissions
        });
      }
    } else {
      // The createAssignment action returns a plain assignment
      const created = await createAssignment(formData);

      // We need to find the course object for the new assignment.
      // Assuming all assignments on this page belong to the same course,
      // we can get it from an existing assignment in the state.
      const course = assignments[0]?.course;

      if (!course) {
        throw new Error('Could not find course information for new assignment.');
      }
      
      const newAssignmentWithCourse = {
        ...created,
        course: course // Attach the course object
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
        // Create a temporary anchor element to trigger the download
        const a = document.createElement('a');
        a.href = result.url;
        a.download = ''; // Let the Content-Disposition header handle the filename
        a.target = '_blank'; // Open in new tab
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
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Assignments List */}
        <div className="lg:col-span-1">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Your Assignments</h2>
          
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-100 rounded-lg animate-pulse"></div>
              ))}
            </div>
          ) : assignments.length === 0 ? (
            <div className="p-6 text-center bg-gray-50 rounded-lg">
              <FiFileText className="mx-auto h-12 w-12 text-gray-400 mb-2" />
              <p className="text-gray-500">No assignments created yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {assignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    selectedAssignment?.assignment.id === assignment.id
                      ? 'border-pink-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                  onClick={() => handleSelectAssignment(assignment.id)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-gray-800">
                        {assignment.title}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {assignment.course.code} - {assignment.course.name}
                      </p>
                      <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                        <FiClock className="h-4 w-4" />
                        <span>Due: {formatDate(assignment.dueDate)}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingAssignment(assignment);
                          setShowAssignmentFormModal(true);
                        }}
                        className="p-1 text-gray-500 hover:text-blue-600"
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
                        className="p-1 text-gray-500 hover:text-red-600"
                        title="Delete assignment"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Assignment Details & Submissions */}
        {selectedAssignment && (
          <div className="lg:col-span-2">
            {isLoading ? (
              <div className="space-y-4">
                <div className="h-8 bg-gray-100 rounded animate-pulse w-1/2"></div>
                <div className="h-4 bg-gray-100 rounded animate-pulse w-3/4"></div>
                <div className="h-4 bg-gray-100 rounded animate-pulse w-1/2"></div>
                <div className="h-12 bg-gray-100 rounded-lg animate-pulse mt-8"></div>
              </div>
            ) : (
              <div>
                {/* Assignment Details */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-800">
                        {selectedAssignment.assignment.title}
                      </h2>
                      <p className="text-gray-600 mt-1">
                        {selectedAssignment.assignment.course.code} - {selectedAssignment.assignment.course.name}
                      </p>
                    </div>
                  </div>

                  {selectedAssignment.assignment.description && (
                    <p className="mt-4 text-gray-700">{selectedAssignment.assignment.description}</p>
                  )}

                  <div className="mt-6 grid grid-cols-2 gap-4">
                    <div className="flex items-center">
                      <div className="p-2 rounded-full bg-blue-50 mr-3">
                        <FiClock className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Assigned</p>
                        <p className="font-medium text-pink-500">{formatDate(selectedAssignment.assignment.assignedDate)}</p>
                      </div>
                    </div>

                    <div className="flex items-center">
                      <div className="p-2 rounded-full bg-red-50 mr-3">
                        <FiClock className="h-5 w-5 text-red-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Due Date</p>
                        <p className="font-medium text-pink-500">{formatDate(selectedAssignment.assignment.dueDate)}</p>
                      </div>
                    </div>
                  </div>

                  {selectedAssignment.assignment.fileUrl && (
                    <div className="mt-4">
                      <button
                        onClick={() => handleDownload(selectedAssignment.assignment.id, 'assignment')}
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-blue-600 hover:text-blue-800"
                        title="Download assignment"
                      >
                        <FiDownload className="mr-2" />
                        Download Assignment File
                      </button>
                    </div>
// {/* <button
//   onClick={() => handleDownload(assignment.id, 'assignment')}
//   className="text-blue-600 hover:text-blue-900"
//   title="Download assignment"
// >
//   <FiDownload size={16} />
// </button> */}
                  )}
                </div>

                {/* Submissions Section */}
                <div className="mt-8">
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
                                  {/* <a
                                    href={submission.fileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-900"
                                    title="View/Download"
                                  >
                                    <FiDownload size={16} />
                                  </a> */}
<button
  onClick={() => handleDownload(submission.id, 'assignment')}
  className="text-blue-600 hover:text-blue-900"
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
            )}
          </div>
        )}
      </div>

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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
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