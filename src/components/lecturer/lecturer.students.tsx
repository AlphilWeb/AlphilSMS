'use client';

import { useState, useEffect } from 'react';
import {
  getStudentsEnrolledInLecturerCourses,
  getStudentProfile,
  getStudentCourses,
  getStudentPerformance,
  getStudentCourseSubmissions,
  type StudentProfile,
  type StudentCourse,
  type StudentPerformance,
  type StudentAssignmentSubmission,
  type StudentQuizSubmission
} from '@/lib/actions/lecturer.students.action';
import { gradeSubmission } from '@/lib/actions/lecturer.assignment.submissions.action';

import {
  FiUser, FiFileText, FiAward, FiClock, 
  FiSearch, FiChevronDown, FiChevronUp,
  FiDownload,
  FiBook
} from 'react-icons/fi';

export default function LecturerStudentsClient() {
  // State management
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<StudentProfile | null>(null);
  const [studentCourses, setStudentCourses] = useState<StudentCourse[]>([]);
  const [performance, setPerformance] = useState<StudentPerformance | null>(null);
const [submissions, setSubmissions] = useState<{
  assignments: StudentAssignmentSubmission[];
  quizzes: StudentQuizSubmission[];
}>({ assignments: [], quizzes: [] });
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  
  // UI state
  const [loading, setLoading] = useState({
    students: true,
    profile: false,
    courses: false,
    performance: false,
    submissions: false
  });
  const [error, setError] = useState<string | null>(null);
  const [expandedView, setExpandedView] = useState<'performance' | 'submissions' | null>(null);
  const [gradeInputs, setGradeInputs] = useState<Record<number, string>>({});

  // Fetch all students on component mount
  useEffect(() => {
    const loadStudents = async () => {
      try {
        setLoading(prev => ({ ...prev, students: true }));
        const data = await getStudentsEnrolledInLecturerCourses();
        setStudents(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load students');
      } finally {
        setLoading(prev => ({ ...prev, students: false }));
      }
    };

    loadStudents();
  }, []);

  // Load student details when selected
  const handleSelectStudent = async (student: StudentProfile) => {
    try {
      setSelectedStudent(student);
      setExpandedView(null);
      setLoading(prev => ({ ...prev, profile: true, courses: true, performance: true }));
      
      // Parallel loading of student data
      const [courses, perf] = await Promise.all([
        getStudentCourses(student.id),
        getStudentPerformance(student.id)
      ]);

      setStudentCourses(courses);
      setPerformance(perf);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load student details');
    } finally {
      setLoading(prev => ({ 
        ...prev, 
        profile: false, 
        courses: false, 
        performance: false 
      }));
    }
  };

  // Load submissions for a specific course
const handleSelectCourse = async (courseId: number) => {
  if (!selectedStudent) return;
  
  try {
    setSelectedCourseId(courseId);
    setLoading(prev => ({ ...prev, submissions: true }));
    
    const data = await getStudentCourseSubmissions(selectedStudent.id, courseId);
    setSubmissions(data);
    setExpandedView('submissions');
    
    // Initialize grade inputs with proper typing
    const initialGrades = data.assignments.reduce((acc: Record<number, string>, submission) => {
      if (submission.grade) {
        acc[submission.id] = submission.grade.toString();
      }
      return acc;
    }, {} as Record<number, string>);
    
    setGradeInputs(initialGrades);
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Failed to load submissions');
  } finally {
    setLoading(prev => ({ ...prev, submissions: false }));
  }
};

  // Handle grade submission
  const handleGradeSubmit = async (submissionId: number, assignmentId: number) => {
    if (!selectedStudent || !selectedCourseId) return;
    
    const grade = gradeInputs[submissionId];
    if (!grade) return;

    try {
      await gradeSubmission(
        submissionId,
        parseFloat(grade),
        `Graded by lecturer on ${new Date().toLocaleDateString()}`
      );
      
      // Refresh submissions
      const data = await getStudentCourseSubmissions(selectedStudent.id, selectedCourseId);
      setSubmissions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit grade');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Student Management</h1>
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search students..."
            className="text-pink-500 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Students List */}
        <div className="lg:col-span-1">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Your Students</h2>
          
          {loading.students ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-100 rounded-lg animate-pulse"></div>
              ))}
            </div>
          ) : students.length === 0 ? (
            <div className="p-6 text-center bg-gray-50 rounded-lg">
              <FiUser className="mx-auto h-12 w-12 text-gray-400 mb-2" />
              <p className="text-gray-500">No students found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {students.map((student) => (
                <div
                  key={student.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    selectedStudent?.id === student.id 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                  onClick={() => handleSelectStudent(student)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                      <FiUser className="text-gray-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">
                        {student.firstName} {student.lastName}
                      </h3>
                      <p className="text-sm text-gray-600">{student.registrationNumber}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Student Details */}
        <div className="lg:col-span-2">
          {!selectedStudent ? (
            <div className="p-6 text-center bg-gray-50 rounded-lg">
              <FiUser className="mx-auto h-12 w-12 text-gray-400 mb-2" />
              <p className="text-gray-500">Select a student to view details</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Student Profile */}
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                      <FiUser className="text-gray-500 text-2xl" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-800">
                        {selectedStudent.firstName} {selectedStudent.lastName}
                      </h2>
                      <p className="text-gray-600">
                        {selectedStudent.registrationNumber} • {selectedStudent.program.name}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500">Courses</p>
                    <p className="font-medium text-blue-600">
                      {loading.courses ? '...' : studentCourses.length}
                    </p>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500">Assignments</p>
                    <p className="font-medium text-green-600">
                      {loading.performance ? '...' : performance?.assignmentSubmissions || 0}
                    </p>
                  </div>
                  <div className="bg-yellow-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500">Quizzes</p>
                    <p className="font-medium text-yellow-600">
                      {loading.performance ? '...' : performance?.quizSubmissions || 0}
                    </p>
                  </div>
                  <div className="bg-purple-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500">Avg Grade</p>
                    <p className="font-medium text-purple-600">
                      {loading.performance ? '...' : performance?.averageGrade?.toFixed(1) || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Performance Overview */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <button
                  className="w-full flex justify-between items-center p-4 hover:bg-gray-50"
                  onClick={() => setExpandedView(expandedView === 'performance' ? null : 'performance')}
                >
                  <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                    <FiAward className="text-blue-500" />
                    Performance Overview
                  </h3>
                  {expandedView === 'performance' ? <FiChevronUp /> : <FiChevronDown />}
                </button>
                
                {expandedView === 'performance' && (
                  <div className="p-4 border-t">
                    {loading.performance ? (
                      <div className="h-32 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium text-gray-700 mb-2">Assignment Completion</h4>
                          <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-blue-500" 
                              style={{ 
                                width: `${(performance?.assignmentsGraded || 0) / (performance?.assignmentSubmissions || 1) * 100}%` 
                              }}
                            ></div>
                          </div>
                          <p className="text-sm text-gray-500 mt-1">
                            {performance?.assignmentsGraded} of {performance?.assignmentSubmissions} graded
                          </p>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-700 mb-2">Average Grades</h4>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Assignments:</span>
                              <span className="font-medium">
                                {performance?.averageGrade?.toFixed(1) || 'N/A'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

{/* Student Courses */}
<div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
  <h3 className="font-semibold text-gray-800 p-4 border-b flex items-center gap-2">
    <FiBook className="text-blue-500" />
    Enrolled Courses
  </h3>
  <div className="divide-y">
    {loading.courses ? (
      <div className="p-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-12 bg-gray-100 rounded mb-2 animate-pulse"></div>
        ))}
      </div>
    ) : studentCourses.length === 0 ? (
      <div className="p-4 text-center text-gray-500">
        No courses found
      </div>
    ) : (
      studentCourses.map((course) => (
        <div 
          key={course.id}
          className={`p-4 hover:bg-gray-50 cursor-pointer ${
            selectedCourseId === course.id ? 'bg-blue-50' : ''
          }`}
          onClick={() => handleSelectCourse(course.id)}
        >
          <div className="flex justify-between items-center">
            <div>
              <h4 className="font-medium text-gray-800">{course.name}</h4>
              <p className="text-sm text-gray-500">
                {course.code} • {course.enrollmentDate ? 
                  `Enrolled on ${new Date(course.enrollmentDate).toLocaleDateString()}` : 
                  'Enrollment date not available'}
              </p>
            </div>
{course.grade?.totalScore != null && (
  <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
    {Number(course.grade.totalScore).toFixed(1)}%
  </div>
)}
          </div>
        </div>
      ))
    )}
  </div>
</div>
              {/* Course Submissions */}
              {expandedView === 'submissions' && (
                <div className="space-y-6">
                  {/* Assignments */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <h3 className="font-semibold text-gray-800 p-4 border-b flex items-center gap-2">
                      <FiFileText className="text-blue-500" />
                      Assignment Submissions
                    </h3>
                    <div className="divide-y">
                      {loading.submissions ? (
                        <div className="p-4">
                          {[...Array(2)].map((_, i) => (
                            <div key={i} className="h-16 bg-gray-100 rounded mb-2 animate-pulse"></div>
                          ))}
                        </div>
                      ) : submissions.assignments.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">
                          No assignment submissions found
                        </div>
                      ) : (
                        submissions.assignments.map((submission) => (
                          <div key={submission.id} className="p-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-medium text-gray-800">{submission.title}</h4>
                                <p className="text-sm text-gray-500 mt-1">
                                  Submitted on {new Date(submission.submittedAt).toLocaleDateString()}
                                </p>
                                {submission.remarks && (
                                  <p className="text-sm text-gray-600 mt-1">{submission.remarks}</p>
                                )}
                              </div>
                              <div className="flex items-center gap-3">
                                <a
                                  // href={submission.fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800"
                                  title="Download"
                                >
                                  <FiDownload />
                                </a>
                              </div>
                            </div>
                            
                            <div className="mt-3 flex items-center gap-3">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={gradeInputs[submission.id] || ''}
                                onChange={(e) => setGradeInputs({
                                  ...gradeInputs,
                                  [submission.id]: e.target.value
                                })}
                                className="w-20 px-2 py-1 border border-gray-300 rounded"
                                placeholder="Grade"
                              />
                              <button
                                onClick={() => handleGradeSubmit(submission.id, submission.assignmentId)}
                                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                              >
                                {submission.grade ? 'Update' : 'Submit'} Grade
                              </button>
                              {submission.grade && (
                                <span className="text-sm text-gray-600">
                                  Current: {submission.grade}%
                                </span>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Quizzes */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <h3 className="font-semibold text-gray-800 p-4 border-b flex items-center gap-2">
                      <FiClock className="text-blue-500" />
                      Quiz Submissions
                    </h3>
                    <div className="divide-y">
                      {loading.submissions ? (
                        <div className="p-4">
                          <div className="h-16 bg-gray-100 rounded animate-pulse"></div>
                        </div>
                      ) : submissions.quizzes.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">
                          No quiz submissions found
                        </div>
                      ) : (
                        submissions.quizzes.map((quiz) => (
                          <div key={quiz.id} className="p-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-medium text-gray-800">{quiz.title}</h4>
                                <p className="text-sm text-gray-500 mt-1">
                                  Submitted on {new Date(quiz.submittedAt).toLocaleDateString()}
                                </p>
                                {quiz.feedback && (
                                  <p className="text-sm text-gray-600 mt-1">{quiz.feedback}</p>
                                )}
                              </div>
                              <div className="flex items-center gap-3">
                                {quiz.score && (
                                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm">
                                    {quiz.score}%
                                  </span>
                                )}
                                <a
                                  // href={quiz.fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800"
                                  title="Download"
                                >
                                  <FiDownload />
                                </a>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}