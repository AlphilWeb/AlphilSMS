'use client';

import { useState, useEffect } from 'react';
import { 
  getCourseResults, 
  getLecturerCourses,
  type StudentResult,
  type LecturerCourse 
} from '@/lib/actions/lecturer.manage.results.action';
import { FiFileText, FiUser } from 'react-icons/fi';
import { FaChalkboardTeacher } from 'react-icons/fa';

export default function LecturerResultsManager({ 
  initialCourses,
  initialResults,
}: { 
  initialCourses: LecturerCourse[];
  initialResults: StudentResult[];
}) {
  const [courses, setCourses] = useState<LecturerCourse[]>(initialCourses);
  const [results, setResults] = useState<StudentResult[]>(initialResults);
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate overall performance statistics
  const performanceStats = {
    totalStudents: results.length,
    averageScore: results.reduce((sum, r) => sum + (r.totalScore || 0), 0) / (results.length || 1),
    passed: results.filter(r => (r.totalScore || 0) >= 50).length,
    failed: results.filter(r => (r.totalScore || 0) < 50).length,
  };

  const handleCourseChange = async (courseId: number) => {
    try {
      setIsLoading(true);
      const data = await getCourseResults(courseId);
      setResults(data);
      setSelectedCourse(courseId);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load results');
    } finally {
      setIsLoading(false);
    }
  };

  // Load courses if not passed as props
useEffect(() => {
  if (initialCourses.length === 0) {
    const fetchCourses = async () => {
      try {
        setIsLoading(true);
        const data = await getLecturerCourses();
        setCourses(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load courses');
      } finally {
        setIsLoading(false);
      }
    };
    fetchCourses();
  }
}, [initialCourses.length]); // Add initialCourses.length to dependencies

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <FaChalkboardTeacher className="h-8 w-8 text-indigo-600" />
          <h1 className="text-3xl font-bold text-gray-800">Results Management</h1>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Course Selection */}
      <div className="mb-6">
        <label htmlFor="course" className="block text-sm font-medium text-gray-700 mb-2">
          Select Course
        </label>
        <select
          id="course"
          onChange={(e) => handleCourseChange(Number(e.target.value))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          disabled={isLoading || courses.length === 0}
          value={selectedCourse || ''}
        >
          <option value="">{courses.length === 0 ? 'Loading courses...' : 'Select a course'}</option>
          {courses.map(course => (
            <option key={course.id} value={course.id}>
              {course.code} - {course.name}
            </option>
          ))}
        </select>
      </div>

      {/* Performance Overview */}
      {selectedCourse && results.length > 0 && (
        <div className="mb-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
            <div className="text-sm font-medium text-gray-500">Total Students</div>
            <div className="mt-1 text-2xl font-semibold text-gray-900">
              {performanceStats.totalStudents}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
            <div className="text-sm font-medium text-gray-500">Average Score</div>
            <div className="mt-1 text-2xl font-semibold text-gray-900">
              {performanceStats.averageScore.toFixed(1)}%
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
            <div className="text-sm font-medium text-gray-500">Passed</div>
            <div className="mt-1 text-2xl font-semibold text-green-600">
              {performanceStats.passed}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
            <div className="text-sm font-medium text-gray-500">Failed</div>
            <div className="mt-1 text-2xl font-semibold text-red-600">
              {performanceStats.failed}
            </div>
          </div>
        </div>
      )}

      {/* Results Table */}
      {selectedCourse && results.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assignments
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quizzes
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  CAT
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Exam
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Grade
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {results.map((result) => (
                <tr key={`${result.studentId}-${result.courseId}`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">
                      {result.firstName} {result.lastName}
                    </div>
                    <div className="text-sm text-gray-500">
                      {result.registrationNumber}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {result.assignments.filter(a => a.grade !== null).length}/{result.assignments.length} submitted
                    </div>
                    <div className="text-sm text-gray-500">
                      Avg: {(
                        result.assignments.reduce((sum, a) => sum + (a.grade || 0), 0) /
                        Math.max(1, result.assignments.filter(a => a.grade !== null).length)
                      ).toFixed(1)}%
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {result.quizzes.filter(q => q.score !== null).length}/{result.quizzes.length} submitted
                    </div>
                    <div className="text-sm text-gray-500">
                      Avg: {(
                        result.quizzes.reduce((sum, q) => sum + (q.score || 0), 0) /
                        Math.max(1, result.quizzes.filter(q => q.score !== null).length)
                      ).toFixed(1)}%
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {result.catScore ?? 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {result.examScore ?? 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {result.totalScore ?? 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      (result.totalScore || 0) >= 70 ? 'bg-green-100 text-green-800' :
                      (result.totalScore || 0) >= 50 ? 'bg-blue-100 text-blue-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {result.letterGrade ?? 'N/A'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty States */}
      {courses.length === 0 && !isLoading && (
        <div className="mt-8 p-8 text-center bg-gray-50 rounded-lg">
          <FiFileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No courses found</h3>
          <p className="mt-1 text-sm text-gray-500">
            You are not assigned to teach any courses yet.
          </p>
        </div>
      )}

      {selectedCourse && results.length === 0 && !isLoading && (
        <div className="mt-8 p-8 text-center bg-gray-50 rounded-lg">
          <FiUser className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No results found</h3>
          <p className="mt-1 text-sm text-gray-500">
            No students have been enrolled or graded in this course yet.
          </p>
        </div>
      )}

      {!selectedCourse && courses.length > 0 && (
        <div className="mt-8 p-8 text-center bg-gray-50 rounded-lg">
          <FiFileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No course selected</h3>
          <p className="mt-1 text-sm text-gray-500">
            Select a course from the dropdown to view student results.
          </p>
        </div>
      )}
    </div>
  );
}