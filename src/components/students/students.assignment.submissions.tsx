'use client';

import { useState, useEffect } from 'react';
import {
  getStudentAssignments,
  submitAssignment,
  deleteSubmission,
  type StudentAssignment,
} from '@/lib/actions/students.assignment.submissions.action';
import {
  FiFileText,
  FiUpload,
  FiTrash2,
  FiDownload,
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
} from 'react-icons/fi';
import { FaChalkboardTeacher } from 'react-icons/fa';

export default function StudentAssignmentsManager({ 
  initialAssignments 
}: { 
  initialAssignments: StudentAssignment[] 
}) {
  const [assignments, setAssignments] = useState<StudentAssignment[]>(initialAssignments);
  const [selectedAssignment, setSelectedAssignment] = useState<StudentAssignment | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [fileUrl, setFileUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Refresh assignments
  const refreshAssignments = async () => {
    try {
      setIsLoading(true);
      const data = await getStudentAssignments();
      setAssignments(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load assignments');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle file upload change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      // In a real app, you would upload the file to storage here
      // and get back a URL to store in your database
      const dummyUrl = URL.createObjectURL(e.target.files[0]);
      setFileUrl(dummyUrl);
    }
  };

  // Handle assignment submission
  const handleSubmitAssignment = async () => {
    if (!selectedAssignment || !fileUrl) return;
    
    try {
      setIsSubmitting(true);
      const isUpdate = !!selectedAssignment.submission;
      await submitAssignment(selectedAssignment.id, fileUrl, isUpdate);
      await refreshAssignments();
      setShowSubmitModal(false);
      setFileUrl('');
      setSelectedAssignment(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit assignment');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete submission
  const handleDeleteSubmission = async () => {
    if (!selectedAssignment?.submission) return;
    
    try {
      setIsLoading(true);
      await deleteSubmission(selectedAssignment.submission.id);
      await refreshAssignments();
      setShowDeleteModal(false);
      setSelectedAssignment(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete submission');
    } finally {
      setIsLoading(false);
    }
  };

  // Format date for display
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Status badge component
  const StatusBadge = ({ assignment }: { assignment: StudentAssignment }) => {
    if (assignment.submission) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <FiCheckCircle className="mr-1" /> Submitted
        </span>
      );
    }
    
    const isOverdue = new Date() > new Date(assignment.dueDate);
    if (isOverdue) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <FiAlertCircle className="mr-1" /> Overdue
        </span>
      );
    }
    
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
        Pending
      </span>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <FaChalkboardTeacher className="h-8 w-8 text-indigo-600" />
          <h1 className="text-3xl font-bold text-gray-800">My Assignments</h1>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Assignments List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assignment</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading && assignments.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center">
                  Loading assignments...
                </td>
              </tr>
            ) : assignments.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                  No assignments found
                </td>
              </tr>
            ) : (
              assignments.map((assignment) => (
                <tr key={assignment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{assignment.title}</div>
                    {assignment.description && (
                      <div className="text-sm text-gray-500 mt-1 line-clamp-1">
                        {assignment.description}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {assignment.course.code}
                    </div>
                    <div className="text-sm text-gray-500">
                      {assignment.course.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {formatDate(assignment.dueDate)}
                    </div>
                    <div className="text-xs text-gray-500">
                      Assigned: {formatDate(assignment.assignedDate)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge assignment={assignment} />
                    {assignment.submission?.grade !== null && (
                      <div className="text-sm text-gray-900 mt-1">
                        Grade: {assignment.submission.grade}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-3">
                      {assignment.fileUrl && (
                        <a
                          href={assignment.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-900"
                          title="Download assignment"
                        >
                          <FiDownload size={16} />
                        </a>
                      )}
                      {assignment.submission ? (
                        <>
                          <a
                            href={assignment.submission.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-green-600 hover:text-green-900"
                            title="View submission"
                          >
                            <FiFileText size={16} />
                          </a>
                          <button
                            onClick={() => {
                              setSelectedAssignment(assignment);
                              setShowSubmitModal(true);
                            }}
                            className="text-yellow-600 hover:text-yellow-900"
                            title="Update submission"
                          >
                            <FiUpload size={16} />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedAssignment(assignment);
                              setShowDeleteModal(true);
                            }}
                            className="text-red-600 hover:text-red-900"
                            title="Delete submission"
                          >
                            <FiTrash2 size={16} />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => {
                            setSelectedAssignment(assignment);
                            setShowSubmitModal(true);
                          }}
                          className="text-indigo-600 hover:text-indigo-900"
                          title="Submit assignment"
                        >
                          <FiUpload size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Submit Assignment Modal */}
      {showSubmitModal && selectedAssignment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">
                {selectedAssignment.submission ? 'Update Submission' : 'Submit Assignment'}
              </h2>
              <p className="mb-2 font-medium">{selectedAssignment.title}</p>
              <p className="mb-4 text-sm text-gray-500">
                {selectedAssignment.course.code} - Due: {formatDate(selectedAssignment.dueDate)}
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Upload your file
                  </label>
                  <input
                    type="file"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-md file:border-0
                      file:text-sm file:font-semibold
                      file:bg-indigo-50 file:text-indigo-700
                      hover:file:bg-indigo-100"
                  />
                  {selectedAssignment.submission && (
                    <div className="mt-2 text-sm text-gray-500">
                      Current submission: {selectedAssignment.submission.fileUrl.split('/').pop()}
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    onClick={() => {
                      setShowSubmitModal(false);
                      setSelectedAssignment(null);
                      setFileUrl('');
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitAssignment}
                    disabled={!fileUrl || isSubmitting}
                    className={`px-4 py-2 rounded-md text-white ${
                      !fileUrl || isSubmitting
                        ? 'bg-indigo-300 cursor-not-allowed'
                        : 'bg-indigo-600 hover:bg-indigo-700'
                    }`}
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedAssignment?.submission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Confirm Deletion</h2>
              <p className="mb-6">
                Are you sure you want to delete your submission for{' '}
                <span className="font-semibold">{selectedAssignment.title}</span>?
                This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteSubmission}
                  disabled={isLoading}
                  className={`px-4 py-2 rounded-md text-white ${
                    isLoading ? 'bg-red-300 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {isLoading ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}