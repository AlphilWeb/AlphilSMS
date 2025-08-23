'use client';

import { useState, useEffect } from 'react';
import {
  getLecturerQuizzes,
  getQuizWithSubmissions,
  createQuiz,
  updateQuiz,
  deleteQuiz,
  gradeQuizSubmission,
} from '@/lib/actions/lecturer.manage.quizzes.action';
import type {
  QuizWithCourse,
  QuizSubmissionWithStudent,
} from '@/lib/actions/lecturer.manage.quizzes.action';
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
import { getLecturerCourses } from '@/lib/actions/lecturer.manage.courses.action';

export default function LecturerQuizzesManager({ initialQuizzes }: { initialQuizzes: QuizWithCourse[] }) {
  const [quizzes, setQuizzes] = useState<QuizWithCourse[]>(initialQuizzes);
  const [selectedQuiz, setSelectedQuiz] = useState<{
    quiz: QuizWithCourse;
    submissions: QuizSubmissionWithStudent[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [showQuizFormModal, setShowQuizFormModal] = useState(false);
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<QuizWithCourse | null>(null);
  const [currentSubmission, setCurrentSubmission] = useState<QuizSubmissionWithStudent | null>(null);
const [courses, setCourses] = useState<{ id: number; code: string; name: string }[]>([]);
  // Form states
  const [score, setScore] = useState('');
  const [feedback, setFeedback] = useState('');

  const [quizFile, setQuizFile] = useState<File | null>(null);
const [isUploading, setIsUploading] = useState(false);


const handleQuizFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  if (e.target.files?.[0]) {
    setQuizFile(e.target.files[0]);
  }
};


  // Fetch all quizzes on client-side if needed
  useEffect(() => {
    if (initialQuizzes.length === 0) {
      const fetchQuizzes = async () => {
        try {
          setIsLoading(true);
          const data = await getLecturerQuizzes();
          setQuizzes(data);
          setError(null);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to load quizzes');
        } finally {
          setIsLoading(false);
        }
      };
      fetchQuizzes();
    }
  }, [initialQuizzes]);

  useEffect(() => {
  const fetchCourses = async () => {
    try {
      const lecturerCourses = await getLecturerCourses(); // You'll need to implement this function
      setCourses(lecturerCourses);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load courses');
    }
  };
  
  fetchCourses();
}, []);

  // Fetch quiz details when selected
const handleSelectQuiz = async (id: number) => {
  try {
    setIsLoading(true);
    const data = await getQuizWithSubmissions(id);
    
    // Transform the submissions array to convert the score
    // const transformedSubmissions = data.submissions.map(submission => ({
    //   ...submission,
    //   score: submission.score !== null ? Number(submission.score) : null,
    // }));
    
    // // Reconstruct the data object with the transformed submissions
    // const transformedData = {
    //   ...data,
    //   submissions: transformedSubmissions
    // };

    setSelectedQuiz(data);
    setError(null);
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Failed to load quiz details');
  } finally {
    setIsLoading(false);
  }
};

  // Handle quiz form submit
const handleQuizSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  setIsUploading(true);
  
  try {
    const formData = new FormData(e.currentTarget);
    
    // Format the quiz date correctly
    const quizDate = formData.get('quizDate') as string;
    if (quizDate) {
      formData.set('quizDate', new Date(quizDate).toISOString());
    }

    // Add file if it exists (for new or updated quizzes)
    if (quizFile) {
      formData.append('file', quizFile);
    }

    if (editingQuiz) {
      const updated = await updateQuiz(editingQuiz.id, formData);
      const quizWithCourse = {
        ...updated,
        course: editingQuiz.course
      };

      setQuizzes(quizzes.map(q => q.id === quizWithCourse.id ? quizWithCourse : q));
      
      if (selectedQuiz?.quiz.id === quizWithCourse.id) {
        setSelectedQuiz({
          quiz: quizWithCourse,
          submissions: selectedQuiz.submissions
        });
      }
    } else {
      const created = await createQuiz(formData);
      const course = courses.find(c => c.id === Number(formData.get('courseId')));
      
      if (!course) {
        throw new Error('Course not found');
      }
      
      const newQuizWithCourse = {
        ...created,
        course: course
      };
      
      setQuizzes([newQuizWithCourse, ...quizzes]);
    }
    
    setShowQuizFormModal(false);
    setEditingQuiz(null);
    setQuizFile(null);
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Failed to save quiz');
  } finally {
    setIsUploading(false);
  }
};

  // Handle grade submission
  const handleGradeSubmit = async () => {
    if (!currentSubmission) return;
    
    try {
      const graded = await gradeQuizSubmission(
        currentSubmission.id,
        parseFloat(score),
        feedback
      );
      
      if (selectedQuiz) {
        setSelectedQuiz({
          quiz: selectedQuiz.quiz,
          submissions: selectedQuiz.submissions.map(s => 
            s.id === graded.id ? { 
              ...s, 
              score: graded.score, 
              feedback: graded.feedback 
            } : s
          )
        });
      }
      
      setShowGradeModal(false);
      setScore('');
      setFeedback('');
      setCurrentSubmission(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit grade');
    }
  };

  // Handle delete confirmation
  const handleDeleteConfirmed = async () => {
    if (!editingQuiz) return;
    
    try {
      await deleteQuiz(editingQuiz.id);
      setQuizzes(quizzes.filter(q => q.id !== editingQuiz.id));
      if (selectedQuiz?.quiz.id === editingQuiz.id) {
        setSelectedQuiz(null);
      }
      setShowDeleteConfirmation(false);
      setEditingQuiz(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete quiz');
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
          <h1 className="text-3xl font-bold text-gray-800">Quizzes Manager</h1>
        </div>
        <button
          onClick={() => {
            setEditingQuiz(null);
            setShowQuizFormModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <FiPlus /> Create Quiz
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quizzes List */}
        <div className="lg:col-span-1">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Your Quizzes</h2>
          
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-100 rounded-lg animate-pulse"></div>
              ))}
            </div>
          ) : quizzes.length === 0 ? (
            <div className="p-6 text-center bg-gray-50 rounded-lg">
              <FiFileText className="mx-auto h-12 w-12 text-gray-400 mb-2" />
              <p className="text-gray-500">No quizzes created yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {quizzes.map((quiz) => (
                <div
                  key={quiz.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    selectedQuiz?.quiz.id === quiz.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                  onClick={() => handleSelectQuiz(quiz.id)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-gray-800">
                        {quiz.title}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {quiz.course.code} - {quiz.course.name}
                      </p>
                      <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                        <FiClock className="h-4 w-4" />
                        <span>Date: {formatDate(quiz.quizDate)}</span>
                      </div>
                      <div className="mt-1 text-sm text-gray-500">
                        Total Marks: {quiz.totalMarks}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingQuiz(quiz);
                          setShowQuizFormModal(true);
                        }}
                        className="p-1 text-gray-500 hover:text-blue-600"
                        title="Edit quiz"
                      >
                        <FiEdit size={16} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingQuiz(quiz);
                          setShowDeleteConfirmation(true);
                        }}
                        className="p-1 text-gray-500 hover:text-red-600"
                        title="Delete quiz"
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

        {/* Quiz Details & Submissions */}
        {selectedQuiz && (
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
                {/* Quiz Details */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-800">
                        {selectedQuiz.quiz.title}
                      </h2>
                      <p className="text-gray-600 mt-1">
                        {selectedQuiz.quiz.course.code} - {selectedQuiz.quiz.course.name}
                      </p>
                    </div>
                  </div>

                  {selectedQuiz.quiz.instructions && (
                    <div className="mt-4">
                      <h3 className="font-medium text-gray-700">Instructions:</h3>
                      <p className="text-gray-700 mt-1">{selectedQuiz.quiz.instructions}</p>
                    </div>
                  )}

                  <div className="mt-6 grid grid-cols-3 gap-4">
                    <div className="flex items-center">
                      <div className="p-2 rounded-full bg-blue-50 mr-3">
                        <FiClock className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Created</p>
                        <p className="text-pink-500 font-medium">{formatDate(selectedQuiz.quiz.createdAt)}</p>
                      </div>
                    </div>

                    <div className="flex items-center">
                      <div className="p-2 rounded-full bg-red-50 mr-3">
                        <FiClock className="h-5 w-5 text-red-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Quiz Date</p>
                        <p className="text-pink-500 font-medium">{formatDate(selectedQuiz.quiz.quizDate)}</p>
                      </div>
                    </div>

                    <div className="flex items-center">
                      <div className="p-2 rounded-full bg-green-50 mr-3">
                        <FiFileText className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Total Marks</p>
                        <p className="text-pink-500 font-medium">{selectedQuiz.quiz.totalMarks}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Submissions Section */}
                <div className="mt-8">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-gray-700">
                      Student Submissions ({selectedQuiz.submissions.length})
                    </h2>
                  </div>

                  {selectedQuiz.submissions.length === 0 ? (
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
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {selectedQuiz.submissions.map((submission) => (
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
                                {submission.score !== null ? `${submission.score}/${selectedQuiz.quiz.totalMarks}` : 'Not graded'}
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
  onClick={() => handleDownload(submission.id, 'quiz')}
  className="text-blue-600 hover:text-blue-900"
  title="Download quiz"
>
  <FiDownload size={16} />
</button>
                                  <button
                                    onClick={() => {
                                      setCurrentSubmission(submission);
                                      setScore(submission.score?.toString() || '');
                                      setFeedback(submission.feedback || '');
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

      {/* Quiz Form Modal */}
{showQuizFormModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
    <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-4">
          {editingQuiz ? 'Edit Quiz' : 'Create New Quiz'}
        </h2>
        
        <form onSubmit={handleQuizSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <input
                type="text"
                id="title"
                name="title"
                defaultValue={editingQuiz?.title || ''}
                required
                className="text-pink-500 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="courseId" className="block text-sm font-medium text-gray-700 mb-1">
                Course
              </label>
              <select
                id="courseId"
                name="courseId"
                defaultValue={editingQuiz?.course.id || ''}
                required
                className="text-pink-500 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                {courses.map(course => (
                  <option key={course.id} value={course.id}>
                    {course.code} - {course.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="instructions" className="block text-sm font-medium text-gray-700 mb-1">
                Instructions
              </label>
              <textarea
                id="instructions"
                name="instructions"
                defaultValue={editingQuiz?.instructions || ''}
                rows={3}
                className="text-pink-500 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="totalMarks" className="block text-sm font-medium text-gray-700 mb-1">
                Total Marks
              </label>
              <input
                type="number"
                id="totalMarks"
                name="totalMarks"
                defaultValue={editingQuiz?.totalMarks || ''}
                required
                min="1"
                className="text-black w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="quizDate" className="block text-sm font-medium text-gray-700 mb-1">
                Quiz Date
              </label>
              <input
                type="datetime-local"
                id="quizDate"
                name="quizDate"
                defaultValue={editingQuiz ? formatDateForInput(editingQuiz.quizDate) : ''}
                required
                className="text-pink-500 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="quizFile" className="block text-sm font-medium text-gray-700 mb-1">
                Quiz File {!editingQuiz && '(Required)'}
              </label>
              {editingQuiz?.fileUrl && (
                <div className="mb-2">
                  <p className="text-sm text-gray-600">Current file: {editingQuiz.fileUrl.split('/').pop()}</p>
                  <button
                    type="button"
                    onClick={() => handleDownload(editingQuiz.id, 'quiz')}
                    className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1 mt-1"
                  >
                    <FiDownload size={14} /> Download current file
                  </button>
                </div>
              )}
              <div className="relative">
                <label className={`flex flex-col items-center justify-center w-full px-4 py-6 border-2 border-dashed ${
                  quizFile ? 'border-blue-300' : 'border-gray-300'
                } rounded-md cursor-pointer hover:border-blue-400 transition-colors`}>
                  <input
                    type="file"
                    id="quizFile"
                    name="quizFile"
                    onChange={handleQuizFileChange}
                    className="hidden"
                    required={!editingQuiz}
                  />
                  <div className="flex flex-col items-center justify-center text-center">
                    <FiUpload className="w-6 h-6 mb-2 text-gray-400" />
                    {quizFile ? (
                      <p className="text-sm font-medium text-gray-900">
                        {quizFile.name}
                      </p>
                    ) : (
                      <>
                        <p className="text-sm text-gray-500">
                          <span className="font-medium">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs italic text-gray-400">
                          PDF, DOCX files accepted
                        </p>
                      </>
                    )}
                  </div>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowQuizFormModal(false);
                  setEditingQuiz(null);
                  setQuizFile(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isUploading || (!editingQuiz && !quizFile)}
                className={`px-4 py-2 text-white rounded-md ${
                  isUploading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
                } ${(!editingQuiz && !quizFile) ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isUploading ? 'Uploading...' : editingQuiz ? 'Update Quiz' : 'Create Quiz'}
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
        <div className="fixed inset-0 backdrop-blur-sm bg-opacity-50 flex items-center justify-center p-4 z-50">
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
                  <label htmlFor="score" className="block text-sm font-medium text-gray-700 mb-1">
                    Score (out of {selectedQuiz?.quiz.totalMarks})
                  </label>
                  <input
                    type="number"
                    id="score"
                    value={score}
                    onChange={(e) => setScore(e.target.value)}
                    min="0"
                    max={selectedQuiz?.quiz.totalMarks}
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="feedback" className="block text-sm font-medium text-gray-700 mb-1">
                    Feedback
                  </label>
                  <textarea
                    id="feedback"
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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
      {showDeleteConfirmation && editingQuiz && (
        <div className="fixed inset-0 backdrop-blur-sm bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Confirm Deletion</h2>
              <p className="mb-6">
                Are you sure you want to delete this quiz: <span className="font-semibold">{editingQuiz.title}</span>?
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