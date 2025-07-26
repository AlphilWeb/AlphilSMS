'use client';

import { useState } from 'react';
import {
  getLecturerGrades,
  updateGrade,
} from '@/lib/actions/lecturer.manage.grades.action';
import type { GradeWithStudentAndCourse } from '@/lib/actions/lecturer.manage.grades.action';
import {
  FiEdit,
  FiSave,
  FiX,
  FiUser,
  FiBook,
  FiAward,
  FiPercent,
} from 'react-icons/fi';
import { FaChalkboardTeacher } from 'react-icons/fa';

export default function LecturerGradesManager({ initialGrades }: { initialGrades: GradeWithStudentAndCourse[] }) {
  const [grades, setGrades] = useState<GradeWithStudentAndCourse[]>(initialGrades);
  const [error, setError] = useState<string | null>(null);
  const [editingGradeId, setEditingGradeId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({
    catScore: 0,
    examScore: 0,
    letterGrade: '',
    gpa: 0,
  });

  // Start editing a grade
  const handleEditStart = (grade: GradeWithStudentAndCourse) => {
    setEditingGradeId(grade.id);
    setEditForm({
      catScore: grade.catScore || 0,
      examScore: grade.examScore || 0,
      letterGrade: grade.letterGrade || '',
      gpa: grade.gpa || 0,
    });
  };

  // Cancel editing
  const handleEditCancel = () => {
    setEditingGradeId(null);
  };

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: name === 'letterGrade' ? value : Number(value),
    }));
  };

  // Save grade updates
const handleSave = async (gradeId: number) => {
  try {
    const updated = await updateGrade(gradeId, {
      catScore: editForm.catScore,
      examScore: editForm.examScore,
      letterGrade: editForm.letterGrade,
      gpa: editForm.gpa,
    });

    // Transform the 'updated' object to convert string scores to numbers
    const transformedUpdated = {
      ...updated,
      catScore: updated.catScore !== null ? Number(updated.catScore) : null,
      examScore: updated.examScore !== null ? Number(updated.examScore) : null,
      totalScore: updated.totalScore !== null ? Number(updated.totalScore) : null,
      gpa: updated.gpa !== null ? Number(updated.gpa) : null,
    };

    // Use the transformed object to update your state
    setGrades(grades.map(g => g.id === transformedUpdated.id ? {
      ...g,
      // You can now safely assign the numeric scores
      catScore: transformedUpdated.catScore,
      examScore: transformedUpdated.examScore,
      totalScore: transformedUpdated.totalScore,
      letterGrade: transformedUpdated.letterGrade,
      gpa: transformedUpdated.gpa,
    } : g));

    setEditingGradeId(null);
    setError(null);
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Failed to update grade');
  }
};

  // Calculate letter grade based on score (example implementation)
  const calculateLetterGrade = (score: number | null) => {
    if (score === null) return 'N/A';
    if (score >= 80) return 'A';
    if (score >= 70) return 'B';
    if (score >= 60) return 'C';
    if (score >= 50) return 'D';
    return 'F';
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <FaChalkboardTeacher className="h-8 w-8 text-indigo-600" />
          <h1 className="text-3xl font-bold text-gray-800">Grades Manager</h1>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Grades Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="flex items-center gap-1">
                  <FiUser /> Student
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="flex items-center gap-1">
                  <FiBook /> Course
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="flex items-center gap-1">
                  <FiPercent /> CAT
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="flex items-center gap-1">
                  <FiPercent /> Exam
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="flex items-center gap-1">
                  <FiPercent /> Total
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="flex items-center gap-1">
                  <FiAward /> Grade
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                GPA
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {grades.map((grade) => (
              <tr key={grade.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-medium text-gray-900">
                    {grade.student.firstName} {grade.student.lastName}
                  </div>
                  <div className="text-sm text-gray-500">
                    {grade.student.registrationNumber}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {grade.course.code}
                  </div>
                  <div className="text-sm text-gray-500">
                    {grade.course.name}
                  </div>
                </td>
                
                {/* CAT Score */}
                <td className="px-6 py-4 whitespace-nowrap">
                  {editingGradeId === grade.id ? (
                    <input
                      type="number"
                      name="catScore"
                      value={editForm.catScore}
                      onChange={handleInputChange}
                      className="w-16 px-2 py-1 border border-gray-300 rounded"
                      min="0"
                      max="30"
                    />
                  ) : (
                    <span className="text-sm text-gray-500">
                      {grade.catScore ?? 'N/A'}
                    </span>
                  )}
                </td>
                
                {/* Exam Score */}
                <td className="px-6 py-4 whitespace-nowrap">
                  {editingGradeId === grade.id ? (
                    <input
                      type="number"
                      name="examScore"
                      value={editForm.examScore}
                      onChange={handleInputChange}
                      className="w-16 px-2 py-1 border border-gray-300 rounded"
                      min="0"
                      max="70"
                    />
                  ) : (
                    <span className="text-sm text-gray-500">
                      {grade.examScore ?? 'N/A'}
                    </span>
                  )}
                </td>
                
                {/* Total Score */}
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {grade.totalScore ?? 'N/A'}
                </td>
                
                {/* Letter Grade */}
                <td className="px-6 py-4 whitespace-nowrap">
                  {editingGradeId === grade.id ? (
                    <input
                      type="text"
                      name="letterGrade"
                      value={editForm.letterGrade}
                      onChange={handleInputChange}
                      className="w-16 px-2 py-1 border border-gray-300 rounded uppercase"
                      maxLength={2}
                    />
                  ) : (
                    <span className="text-sm font-medium text-gray-900">
                      {grade.letterGrade ?? calculateLetterGrade(grade.totalScore)}
                    </span>
                  )}
                </td>
                
                {/* GPA */}
                <td className="px-6 py-4 whitespace-nowrap">
                  {editingGradeId === grade.id ? (
                    <input
                      type="number"
                      name="gpa"
                      value={editForm.gpa}
                      onChange={handleInputChange}
                      className="w-16 px-2 py-1 border border-gray-300 rounded"
                      min="0"
                      max="4"
                      step="0.1"
                    />
                  ) : (
                    <span className="text-sm text-gray-500">
                      {grade.gpa ?? 'N/A'}
                    </span>
                  )}
                </td>
                
                {/* Actions */}
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {editingGradeId === grade.id ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSave(grade.id)}
                        className="text-green-600 hover:text-green-900"
                        title="Save"
                      >
                        <FiSave size={18} />
                      </button>
                      <button
                        onClick={handleEditCancel}
                        className="text-red-600 hover:text-red-900"
                        title="Cancel"
                      >
                        <FiX size={18} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleEditStart(grade)}
                      className="text-blue-600 hover:text-blue-900"
                      title="Edit"
                    >
                      <FiEdit size={18} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Empty State */}
      {grades.length === 0 && (
        <div className="mt-8 p-8 text-center bg-gray-50 rounded-lg">
          <FiBook className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No grades found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Grades will appear here once students are enrolled and assessments are graded.
          </p>
        </div>
      )}
    </div>
  );
}