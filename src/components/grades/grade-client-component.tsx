// components/grades/grade-client-component.tsx
'use client';

import { useState } from "react";
import { FiPlus, FiEdit, FiTrash2, FiEye, FiX, FiSave, FiCheck } from "react-icons/fi";
import { createGrade, updateGrade, deleteGrade, getGrades } from "@/lib/actions/grade.action";

interface Grade {
  id: number;
  enrollmentId: number;
  catScore: string | null;
  examScore: string | null;
  totalScore: string | null;
  letterGrade: string | null;
  gpa: string | null;
}

interface ReferenceData {
  enrollments: {
    id: number;
    studentId: number;
    courseId: number;
    semesterId: number;
    enrollmentDate: string | null;
  }[];
  students: { id: number; firstName: string; lastName: string; registrationNumber: string }[];
  courses: { id: number; name: string; code: string }[];
  semesters: { id: number; name: string }[];
}

interface GradesClientComponentProps {
  initialGrades: Grade[];
  referenceData: ReferenceData;
}

export default function GradesClientComponent({ initialGrades, referenceData }: GradesClientComponentProps) {
  const [grades, setGrades] = useState<Grade[]>(initialGrades);
  const [search, setSearch] = useState<string>("");
  const [filterBy, setFilterBy] = useState<'enrollmentId' | 'letterGrade' | 'id'>('enrollmentId');
  const [editId, setEditId] = useState<number | null>(null);
  const [editedGrade, setEditedGrade] = useState<Partial<Grade>>({});
  const [showDetails, setShowDetails] = useState<Grade | null>(null);
  const [showAddGrade, setShowAddGrade] = useState<boolean>(false);
  const [newGrade, setNewGrade] = useState<{
    enrollmentId: string;
    catScore: string;
    examScore: string;
    totalScore: string;
    letterGrade: string;
    gpa: string;
  }>({
    enrollmentId: "",
    catScore: "",
    examScore: "",
    totalScore: "",
    letterGrade: "",
    gpa: "",
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const getEnrollmentDisplayName = (enrollmentId: number): string => {
    const enrollment = referenceData.enrollments.find(e => e.id === enrollmentId);
    if (!enrollment) return `Enrollment ID: ${enrollmentId}`;

    const student = referenceData.students.find(s => s.id === enrollment.studentId);
    const course = referenceData.courses.find(c => c.id === enrollment.courseId);
    const semester = referenceData.semesters.find(s => s.id === enrollment.semesterId);

    const studentName = student ? `${student.firstName} ${student.lastName}` : `Student ID: ${enrollment.studentId}`;
    const courseName = course ? `${course.name} (${course.code})` : `Course ID: ${enrollment.courseId}`;
    const semesterName = semester ? `${semester.name}` : `Semester ID: ${enrollment.semesterId}`;

    return `${studentName} - ${courseName} - ${semesterName}`;
  };

  const filteredGrades = grades.filter((grade) => {
    let value: string = '';
    if (filterBy === 'enrollmentId') {
      value = getEnrollmentDisplayName(grade.enrollmentId).toLowerCase();
    } else if (filterBy === 'letterGrade') {
      value = grade.letterGrade?.toLowerCase() || '';
    } else if (filterBy === 'id') {
      value = grade.id.toString().toLowerCase();
    }
    return value.includes(search.toLowerCase());
  });

  const handleEdit = (grade: Grade) => {
    setEditId(grade.id);
    setEditedGrade({
      ...grade,
      catScore: grade.catScore || '',
      examScore: grade.examScore || '',
      totalScore: grade.totalScore || '',
      letterGrade: grade.letterGrade || '',
      gpa: grade.gpa || '',
    });
    setFormError(null);
    setFormSuccess(null);
  };

  const handleSave = async (id: number, formData: FormData): Promise<void> => {
    setFormError(null);
    setFormSuccess(null);
    try {
      const result = await updateGrade(id, formData);
      if ('error' in result) {
        setFormError("Failed to update grade.");
        return;
      }
      setFormSuccess('Grade updated successfully!');
      setEditId(null);
      const updatedGrades = await getGrades();
      setGrades(updatedGrades);
    } catch (error) {
      const err = error as Error;
      setFormError(err.message || "Failed to update grade.");
    }
  };

  const handleAddGrade = async (formData: FormData): Promise<void> => {
    setFormError(null);
    setFormSuccess(null);
    try {
      const result = await createGrade(formData);
      if ('error' in result) {
        setFormError("Failed to create grade.");
        return;
      }
      setFormSuccess('Grade created successfully!');
      setShowAddGrade(false);
      setNewGrade({
        enrollmentId: "", catScore: "", examScore: "", totalScore: "", letterGrade: "", gpa: ""
      });
      const updatedGrades = await getGrades();
      setGrades(updatedGrades);
    } catch (error) {
      const err = error as Error;
      setFormError(err.message || "Failed to create grade.");
    }
  };

  const handleDeleteGrade = async (gradeId: number): Promise<void> => {
    setFormError(null);
    setFormSuccess(null);
    if (!confirm("Are you sure you want to delete this grade? This action cannot be undone.")) return;
    try {
      const result = await deleteGrade(gradeId);
      if ('error' in result) {
        setFormError("Failed to delete grade.");
        return;
      }
      setFormSuccess('Grade deleted successfully!');
      setGrades(grades.filter((grade) => grade.id !== gradeId));
    } catch (error) {
      const err = error as Error;
      setFormError(err.message || "Failed to delete grade.");
    }
  };

  return (
    <>
      {/* Search and filter bar */}
      <div className="sticky top-[150px] z-20 px-12 py-4 bg-emerald-800 flex flex-wrap justify-between items-center gap-4 shadow-md">
        <div className="flex items-center gap-4">
          <input
            type="text"
            placeholder="Search grades..."
            className="px-4 py-2 bg-white/10 text-white placeholder-white/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 border border-emerald-600 w-64"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
<select
  className="px-4 py-2 bg-white/10 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 border border-emerald-600"
  value={filterBy}
  onChange={(e) => setFilterBy(e.target.value as 'enrollmentId' | 'letterGrade' | 'id')}
>
            <option className="bg-emerald-800" value="enrollmentId">Enrollment</option>
            <option className="bg-emerald-800" value="letterGrade">Letter Grade</option>
            <option className="bg-emerald-800" value="id">ID</option>
          </select>
        </div>
        <button
          className="bg-gradient-to-r from-pink-600 to-pink-500 hover:from-pink-700 hover:to-pink-600 px-4 py-2 rounded-lg text-white font-medium flex items-center gap-2 transition-all shadow-md"
          onClick={() => setShowAddGrade(true)}
        >
          <FiPlus /> Add Grade
        </button>
      </div>

      {/* Status messages */}
      {formError && (
        <div className="mx-8 mt-4 p-3 bg-red-500/90 text-white rounded-lg shadow flex items-center gap-2">
          <FiX className="flex-shrink-0" />
          {formError}
        </div>
      )}
      {formSuccess && (
        <div className="mx-8 mt-4 p-3 bg-green-500/90 text-white rounded-lg shadow flex items-center gap-2">
          <FiCheck className="flex-shrink-0" />
          {formSuccess}
        </div>
      )}

      {/* Table section */}
      <div className="px-12 py-6 h-[calc(100vh-250px)] overflow-hidden">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden h-full flex flex-col border border-white/20">
          <div className="overflow-x-auto h-full">
            <div className="h-full">
              <div className="overflow-y-auto max-h-full">
                <table className="min-w-full table-fixed text-gray-800">
                  <thead className="sticky top-0 bg-gradient-to-r from-emerald-700 to-emerald-600 text-white z-10">
                    <tr>
                      <th className="p-4 text-left w-20">ID</th>
                      <th className="p-4 text-left">Enrollment</th>
                      <th className="p-4 text-left">CAT Score</th>
                      <th className="p-4 text-left">Exam Score</th>
                      <th className="p-4 text-left">Total Score</th>
                      <th className="p-4 text-left">Letter Grade</th>
                      <th className="p-4 text-left">GPA</th>
                      <th className="p-4 text-left w-40">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200/50">
                    {filteredGrades.map((grade: Grade) => (
                      <tr key={grade.id} className="hover:bg-emerald-50/50 transition-colors">
                        <td className="p-4 font-medium text-gray-800">{grade.id}</td>
                        <td className="p-4">
                          {editId === grade.id ? (
                            <select
                              className="px-3 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-800 bg-white"
                              value={editedGrade.enrollmentId || ''}
                              onChange={(e) => setEditedGrade({ ...editedGrade, enrollmentId: Number(e.target.value) })}
                            >
                              <option className="bg-emerald-800 text-white" value="">Select Enrollment</option>
                              {referenceData.enrollments.map((enrollment) => (
                                <option className="bg-emerald-800 text-white" key={enrollment.id} value={enrollment.id}>
                                  {getEnrollmentDisplayName(enrollment.id)}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span className="text-gray-800">{getEnrollmentDisplayName(grade.enrollmentId)}</span>
                          )}
                        </td>
                        <td className="p-4">
                          {editId === grade.id ? (
                            <input
                              type="number"
                              step="0.01"
                              className="px-3 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-800 bg-white"
                              value={editedGrade.catScore || ''}
                              onChange={(e) => setEditedGrade({ ...editedGrade, catScore: e.target.value })}
                            />
                          ) : (
                            <span className="text-gray-800">{grade.catScore || 'N/A'}</span>
                          )}
                        </td>
                        <td className="p-4">
                          {editId === grade.id ? (
                            <input
                              type="number"
                              step="0.01"
                              className="px-3 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-800 bg-white"
                              value={editedGrade.examScore || ''}
                              onChange={(e) => setEditedGrade({ ...editedGrade, examScore: e.target.value })}
                            />
                          ) : (
                            <span className="text-gray-800">{grade.examScore || 'N/A'}</span>
                          )}
                        </td>
                        <td className="p-4">
                          {editId === grade.id ? (
                            <input
                              type="number"
                              step="0.01"
                              className="px-3 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-800 bg-white"
                              value={editedGrade.totalScore || ''}
                              onChange={(e) => setEditedGrade({ ...editedGrade, totalScore: e.target.value })}
                            />
                          ) : (
                            <span className="text-gray-800">{grade.totalScore || 'N/A'}</span>
                          )}
                        </td>
                        <td className="p-4">
                          {editId === grade.id ? (
                            <input
                              type="text"
                              className="px-3 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-800 bg-white"
                              value={editedGrade.letterGrade || ''}
                              onChange={(e) => setEditedGrade({ ...editedGrade, letterGrade: e.target.value })}
                            />
                          ) : (
                            <span className="text-gray-800">{grade.letterGrade || 'N/A'}</span>
                          )}
                        </td>
                        <td className="p-4">
                          {editId === grade.id ? (
                            <input
                              type="number"
                              step="0.01"
                              className="px-3 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-800 bg-white"
                              value={editedGrade.gpa || ''}
                              onChange={(e) => setEditedGrade({ ...editedGrade, gpa: e.target.value })}
                            />
                          ) : (
                            <span className="text-gray-800">{grade.gpa || 'N/A'}</span>
                          )}
                        </td>
                        <td className="p-4 flex gap-3 items-center">
                          {editId === grade.id ? (
                            <>
                              <button
                                className="text-white bg-gradient-to-r from-pink-600 to-pink-500 hover:from-pink-700 hover:to-pink-600 px-3 py-1.5 rounded-lg flex items-center gap-1 text-sm transition-all shadow"
                                onClick={() => {
                                  const formData = new FormData();
                                  if (editedGrade.enrollmentId !== undefined) formData.append('enrollmentId', String(editedGrade.enrollmentId));
                                  if (editedGrade.catScore) formData.append('catScore', editedGrade.catScore);
                                  if (editedGrade.examScore) formData.append('examScore', editedGrade.examScore);
                                  if (editedGrade.totalScore) formData.append('totalScore', editedGrade.totalScore);
                                  if (editedGrade.letterGrade) formData.append('letterGrade', editedGrade.letterGrade);
                                  if (editedGrade.gpa) formData.append('gpa', editedGrade.gpa);
                                  handleSave(grade.id, formData);
                                }}
                              >
                                <FiSave /> Save
                              </button>
                              <button
                                className="text-gray-700 hover:bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-300 text-sm transition-colors"
                                onClick={() => setEditId(null)}
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                className="text-blue-600 hover:text-blue-800 p-2 rounded-full hover:bg-blue-50 transition-colors"
                                onClick={() => handleEdit(grade)}
                                title="Edit"
                              >
                                <FiEdit />
                              </button>
                              <button
                                className="text-red-600 hover:text-red-800 p-2 rounded-full hover:bg-red-50 transition-colors"
                                title="Delete"
                                onClick={() => handleDeleteGrade(grade.id)}
                              >
                                <FiTrash2 />
                              </button>
                              <button
                                className="text-emerald-600 hover:text-emerald-800 p-2 rounded-full hover:bg-emerald-50 transition-colors"
                                onClick={() => setShowDetails(grade)}
                                title="View"
                              >
                                <FiEye />
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Grade Modal */}
      {showAddGrade && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl">
            <div className="flex justify-between items-center border-b p-6">
              <h2 className="text-2xl font-bold text-gray-800">Create New Grade</h2>
              <button
                onClick={() => setShowAddGrade(false)}
                className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
              >
                <FiX size={24} />
              </button>
            </div>
            <form action={handleAddGrade}>
              <div className="grid grid-cols-1 gap-6 p-6">
                <div>
                  <label htmlFor="gradeEnrollmentId" className="block mb-2 text-sm font-medium text-gray-700">Enrollment</label>
                  <select
                    id="gradeEnrollmentId"
                    name="enrollmentId"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-800 bg-white"
                    value={newGrade.enrollmentId}
                    onChange={(e) => setNewGrade({ ...newGrade, enrollmentId: e.target.value })}
                    required
                  >
                    <option className="bg-emerald-800 text-white" value="">Select Enrollment</option>
                    {referenceData.enrollments.map((enrollment) => (
                      <option className="bg-emerald-800 text-white" key={enrollment.id} value={enrollment.id}>
                        {getEnrollmentDisplayName(enrollment.id)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="catScore" className="block mb-2 text-sm font-medium text-gray-700">CAT Score (Optional)</label>
                  <input
                    type="number"
                    step="0.01"
                    id="catScore"
                    name="catScore"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-800 bg-white"
                    value={newGrade.catScore}
                    onChange={(e) => setNewGrade({ ...newGrade, catScore: e.target.value })}
                  />
                </div>
                <div>
                  <label htmlFor="examScore" className="block mb-2 text-sm font-medium text-gray-700">Exam Score (Optional)</label>
                  <input
                    type="number"
                    step="0.01"
                    id="examScore"
                    name="examScore"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-800 bg-white"
                    value={newGrade.examScore}
                    onChange={(e) => setNewGrade({ ...newGrade, examScore: e.target.value })}
                  />
                </div>
                <div>
                  <label htmlFor="totalScore" className="block mb-2 text-sm font-medium text-gray-700">Total Score (Optional)</label>
                  <input
                    type="number"
                    step="0.01"
                    id="totalScore"
                    name="totalScore"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-800 bg-white"
                    value={newGrade.totalScore}
                    onChange={(e) => setNewGrade({ ...newGrade, totalScore: e.target.value })}
                  />
                </div>
                <div>
                  <label htmlFor="letterGrade" className="block mb-2 text-sm font-medium text-gray-700">Letter Grade (Optional)</label>
                  <input
                    type="text"
                    id="letterGrade"
                    name="letterGrade"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-800 bg-white"
                    value={newGrade.letterGrade}
                    onChange={(e) => setNewGrade({ ...newGrade, letterGrade: e.target.value })}
                  />
                </div>
                <div>
                  <label htmlFor="gpa" className="block mb-2 text-sm font-medium text-gray-700">GPA (Optional)</label>
                  <input
                    type="number"
                    step="0.01"
                    id="gpa"
                    name="gpa"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-800 bg-white"
                    value={newGrade.gpa}
                    onChange={(e) => setNewGrade({ ...newGrade, gpa: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 p-6 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddGrade(false)}
                  className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-pink-600 to-pink-500 text-white rounded-lg hover:from-pink-700 hover:to-pink-600 transition-all shadow-md"
                >
                  Create Grade
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {showDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="flex justify-between items-center border-b p-6">
              <h2 className="text-2xl font-bold text-gray-800">Grade Details</h2>
              <button
                onClick={() => setShowDetails(null)}
                className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
              >
                <FiX size={24} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">ID</p>
                  <p className="font-medium text-gray-800">{showDetails.id}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-500">Enrollment</p>
                  <p className="font-medium text-gray-800">{getEnrollmentDisplayName(showDetails.enrollmentId)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">CAT Score</p>
                  <p className="font-medium text-gray-800">{showDetails.catScore || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Exam Score</p>
                  <p className="font-medium text-gray-800">{showDetails.examScore || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Score</p>
                  <p className="font-medium text-gray-800">{showDetails.totalScore || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Letter Grade</p>
                  <p className="font-medium text-gray-800">{showDetails.letterGrade || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">GPA</p>
                  <p className="font-medium text-gray-800">{showDetails.gpa || 'N/A'}</p>
                </div>
              </div>
            </div>
            <div className="flex justify-end p-6 border-t">
              <button
                onClick={() => setShowDetails(null)}
                className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-lg hover:from-emerald-700 hover:to-emerald-600 transition-all shadow-md"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}