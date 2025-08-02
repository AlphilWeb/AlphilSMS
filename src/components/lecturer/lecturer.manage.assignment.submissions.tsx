'use client';

import { useState, useEffect } from 'react';
import {
  getLecturerSubmissions,
  getSubmissionStatistics,
  gradeSubmission,
  type SubmissionWithDetails,
  type CourseSubmissionsOverview
} from '@/lib/actions/lecturer.assignment.submissions.action';
import {
  FiCheck,
  FiDownload,
  FiAlertCircle,
  FiCheckCircle
} from 'react-icons/fi';
import { FaChalkboardTeacher } from 'react-icons/fa';

import { getDownloadUrl } from '@/lib/actions/files.download.action';

export default function LecturerSubmissionsManager() {
  const [submissions, setSubmissions] = useState<SubmissionWithDetails[]>([]);
  const [statistics, setStatistics] = useState<CourseSubmissionsOverview[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<number | 'all'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [currentSubmission, setCurrentSubmission] = useState<SubmissionWithDetails | null>(null);
  const [grade, setGrade] = useState('');
  const [remarks, setRemarks] = useState('');

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [subsData, statsData] = await Promise.all([
          selectedCourse === 'all' 
            ? getLecturerSubmissions() 
            : getLecturerSubmissions(selectedCourse),
          getSubmissionStatistics()
        ]);
        setSubmissions(subsData);
        setStatistics(statsData);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [selectedCourse]);

  // Handle grade submission
  const handleGradeSubmit = async () => {
    if (!currentSubmission || !grade) return;
    
    try {
      setIsLoading(true);
      await gradeSubmission(
        currentSubmission.id,
        parseFloat(grade),
        remarks
      );
      
      // Refresh the data
      const updatedSubmissions = await getLecturerSubmissions(
        selectedCourse === 'all' ? undefined : selectedCourse
      );
      setSubmissions(updatedSubmissions);
      
      setShowGradeModal(false);
      setCurrentSubmission(null);
      setGrade('');
      setRemarks('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit grade');
    } finally {
      setIsLoading(false);
    }
  };

  // Format date for display
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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

  // Status badge component
  const StatusBadge = ({ submission }: { submission: SubmissionWithDetails }) => {
    const isLate = new Date(submission.submittedAt) > new Date(submission.assignment.dueDate);
    
    if (submission.grade !== null) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <FiCheckCircle className="mr-1" /> Graded: {submission.grade}
        </span>
      );
    }
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
        isLate ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
      }`}>
        {isLate ? (
          <>
            <FiAlertCircle className="mr-1" /> Late
          </>
        ) : (
          'Pending'
        )}
      </span>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <FaChalkboardTeacher className="h-8 w-8 text-indigo-600" />
          <h1 className="text-3xl font-bold text-gray-800">Manage Submissions</h1>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Course Filter and Statistics */}
      <div className="mb-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <h2 className="text-xl font-semibold text-gray-700">Course Overview</h2>
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value === 'all' ? 'all' : Number(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="all">All Courses</option>
            {statistics.map((course) => (
              <option key={course.courseId} value={course.courseId}>
                {course.courseCode} - {course.courseName}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {statistics.map((course) => (
            <div 
              key={course.courseId} 
              className={`p-4 rounded-lg border ${
                selectedCourse === course.courseId 
                  ? 'border-indigo-500 bg-indigo-50' 
                  : 'border-gray-200'
              }`}
            >
              <h3 className="font-medium text-gray-900">
                {course.courseCode}
              </h3>
              <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-gray-500">Total</p>
                  <p>{course.totalAssignments}</p>
                </div>
                <div>
                  <p className="text-gray-500">Graded</p>
                  <p className="text-green-600">{course.submissionsGraded}</p>
                </div>
                <div>
                  <p className="text-gray-500">Pending</p>
                  <p className="text-yellow-600">{course.submissionsPending}</p>
                </div>
                <div>
                  <p className="text-gray-500">Late</p>
                  <p className="text-red-600">{course.submissionsLate}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Submissions Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assignment</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading && submissions.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center">
                  Loading submissions...
                </td>
              </tr>
            ) : submissions.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                  No submissions found
                </td>
              </tr>
            ) : (
              submissions.map((submission) => (
                <tr key={submission.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">
                      {submission.student.firstName} {submission.student.lastName}
                    </div>
                    <div className="text-sm text-gray-500">
                      {submission.student.registrationNumber}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {submission.assignment.title}
                    </div>
                    <div className="text-xs text-gray-500">
                      Due: {formatDate(submission.assignment.dueDate)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {submission.assignment.course.code}
                    </div>
                    <div className="text-xs text-gray-500">
                      {submission.assignment.course.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(submission.submittedAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge submission={submission} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-3">
                      {/* <a
                        href={submission.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-900"
                        title="Download submission"
                      >
                        <FiDownload size={16} />
                      </a> */}

<button
  onClick={() => handleDownload(submission.id, 'assignment')}
  rel='noopener noreferrer'
  className="text-blue-600 hover:text-blue-900"
  title="Download Submission"
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
                        className={`${
                          submission.grade !== null 
                            ? 'text-yellow-600 hover:text-yellow-900' 
                            : 'text-green-600 hover:text-green-900'
                        }`}
                        title={submission.grade !== null ? 'Update grade' : 'Grade submission'}
                      >
                        <FiCheck size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Grade Submission Modal */}
      {showGradeModal && currentSubmission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">
                {currentSubmission.grade !== null ? 'Update Grade' : 'Grade Submission'}
              </h2>
              
              <div className="mb-4">
                <p className="font-medium">
                  {currentSubmission.student.firstName} {currentSubmission.student.lastName}
                </p>
                <p className="text-sm text-gray-500">
                  {currentSubmission.student.registrationNumber}
                </p>
              </div>
              
              <div className="mb-4">
                <p className="font-medium">{currentSubmission.assignment.title}</p>
                <p className="text-sm text-gray-500">
                  {currentSubmission.assignment.course.code} - Submitted: {formatDate(currentSubmission.submittedAt)}
                </p>
                {new Date(currentSubmission.submittedAt) > new Date(currentSubmission.assignment.dueDate) && (
                  <p className="text-sm text-red-500 mt-1">
                    <FiAlertCircle className="inline mr-1" />
                    Submitted late
                  </p>
                )}
              </div>

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
                    step="0.1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Add feedback for the student..."
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    onClick={() => {
                      setShowGradeModal(false);
                      setCurrentSubmission(null);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleGradeSubmit}
                    disabled={!grade || isLoading}
                    className={`px-4 py-2 text-white rounded-md ${
                      !grade || isLoading
                        ? 'bg-indigo-300 cursor-not-allowed'
                        : 'bg-indigo-600 hover:bg-indigo-700'
                    }`}
                  >
                    {isLoading ? 'Processing...' : 'Submit Grade'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}