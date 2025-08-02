// components/enrollments/enrollment-client-component.tsx
'use client';

import { useState } from "react";
import { FiPlus, FiEdit, FiTrash2, FiEye, FiX, FiSave, FiCheck } from "react-icons/fi";
import { createEnrollment, updateEnrollment, deleteEnrollment, getEnrollments } from "@/lib/actions/enrollment.action";

interface Enrollment {
  id: number;
  studentId: number;
  courseId: number;
  semesterId: number;
  enrollmentDate: string | null;
}

interface Student {
  id: number;
  firstName: string;
  lastName: string;
  registrationNumber: string;
}

interface Course {
  id: number;
  name: string;
  code: string;
}

interface Semester {
  id: number;
  name: string;
}

interface ReferenceData {
  students: Student[];
  courses: Course[];
  semesters: Semester[];
}

interface NewEnrollmentForm {
  studentId: string;
  courseId: string;
  semesterId: string;
  enrollmentDate: string;
}

interface EnrollmentsClientComponentProps {
  initialEnrollments: Enrollment[];
  referenceData: ReferenceData;
}

type EnrollmentFilterField = 'studentId' | 'courseId' | 'semesterId' | 'enrollmentDate' | 'id';

export default function EnrollmentsClientComponent({ 
  initialEnrollments, 
  referenceData 
}: EnrollmentsClientComponentProps) {
  const [enrollments, setEnrollments] = useState<Enrollment[]>(initialEnrollments);
  const [search, setSearch] = useState("");
  const [filterBy, setFilterBy] = useState<EnrollmentFilterField>('studentId');
  const [editId, setEditId] = useState<number | null>(null);
  const [editedEnrollment, setEditedEnrollment] = useState<Partial<Enrollment>>({});
  const [showDetails, setShowDetails] = useState<Enrollment | null>(null);
  const [showAddEnrollment, setShowAddEnrollment] = useState(false);
  const [newEnrollment, setNewEnrollment] = useState<NewEnrollmentForm>({
    studentId: "",
    courseId: "",
    semesterId: "",
    enrollmentDate: ""
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const filteredEnrollments = enrollments.filter((enrollment) => {
    const value = enrollment[filterBy]?.toString().toLowerCase() || '';
    return value.includes(search.toLowerCase());
  });

  const getStudentDisplay = (studentId: number): string => {
    const student = referenceData.students.find(s => s.id === studentId);
    return student 
      ? `${student.firstName} ${student.lastName} (Reg: ${student.registrationNumber})`
      : `Student ID: ${studentId}`;
  };

  const getCourseDisplay = (courseId: number): string => {
    const course = referenceData.courses.find(c => c.id === courseId);
    return course
      ? `${course.name} (${course.code})`
      : `Course ID: ${courseId}`;
  };

  const getSemesterDisplay = (semesterId: number): string => {
    const semester = referenceData.semesters.find(s => s.id === semesterId);
    return semester
      ? semester.name
      : `Semester ID: ${semesterId}`;
  };

  const handleEdit = (enrollment: Enrollment) => {
    setEditId(enrollment.id);
    setEditedEnrollment({ 
      ...enrollment, 
      enrollmentDate: enrollment.enrollmentDate || '' 
    });
    setFormError(null);
    setFormSuccess(null);
  };

  const handleSave = async (id: number, formData: FormData) => {
    setFormError(null);
    setFormSuccess(null);
    try {
      const result = await updateEnrollment(id, formData);
      if ('error' in result) {
        setFormError(result.error || "Failed to update enrollment.");
        return;
      }
      setFormSuccess('Enrollment updated successfully!');
      setEditId(null);
      const updatedEnrollments = await getEnrollments();
      setEnrollments(updatedEnrollments);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Failed to update enrollment.");
    }
  };

  const handleAddEnrollment = async (formData: FormData) => {
    setFormError(null);
    setFormSuccess(null);
    try {
      const result = await createEnrollment(formData);
      if ('error' in result) {
        setFormError(result.error || "Failed to create enrollment.");
        return;
      }
      setFormSuccess('Enrollment created successfully!');
      setShowAddEnrollment(false);
      setNewEnrollment({
        studentId: "", 
        courseId: "", 
        semesterId: "", 
        enrollmentDate: ""
      });
      const updatedEnrollments = await getEnrollments();
      setEnrollments(updatedEnrollments);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Failed to create enrollment.");
    }
  };

  const handleDeleteEnrollment = async (enrollmentId: number) => {
    setFormError(null);
    setFormSuccess(null);
    if (!confirm("Are you sure you want to delete this enrollment? This action cannot be undone.")) return;
    try {
      const result = await deleteEnrollment(enrollmentId);
      if ('error' in result) {
        setFormError(result.error || "Failed to delete enrollment.");
        return;
      }
      setFormSuccess('Enrollment deleted successfully!');
      setEnrollments(enrollments.filter((enrollment) => enrollment.id !== enrollmentId));
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Failed to delete enrollment.");
    }
  };

  return (
    <>
      <div className="sticky top-[150px] z-20 px-12 py-4 bg-emerald-800 flex flex-wrap justify-between items-center gap-4 shadow-md">
        <div className="flex items-center gap-4">
          <input
            type="text"
            placeholder="Search enrollments..."
            className="px-4 py-2 bg-white/10 text-white placeholder-white/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 border border-emerald-600 w-64"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="px-4 py-2 bg-white/10 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 border border-emerald-600"
            value={filterBy}
            onChange={(e) => setFilterBy(e.target.value as EnrollmentFilterField)}
          >
            <option value="studentId">Student ID</option>
            <option value="courseId">Course ID</option>
            <option value="semesterId">Semester ID</option>
            <option value="enrollmentDate">Enrollment Date</option>
            <option value="id">ID</option>
          </select>
        </div>
        <button
          className="bg-gradient-to-r from-pink-600 to-pink-500 hover:from-pink-700 hover:to-pink-600 px-4 py-2 rounded-lg text-white font-medium flex items-center gap-2 transition-all shadow-md"
          onClick={() => setShowAddEnrollment(true)}
        >
          <FiPlus /> Add Enrollment
        </button>
      </div>

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

      <div className="px-12 py-6 h-[calc(100vh-250px)] overflow-hidden">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden h-full flex flex-col border border-white/20">
          <div className="overflow-x-auto h-full">
            <div className="h-full">
              <div className="overflow-y-auto max-h-full">
                <table className="min-w-full table-fixed text-gray-800">
                  <thead className="sticky top-0 bg-gradient-to-r from-emerald-700 to-emerald-600 text-white z-10">
                    <tr>
                      <th className="p-4 text-left w-20">ID</th>
                      <th className="p-4 text-left">Student</th>
                      <th className="p-4 text-left">Course</th>
                      <th className="p-4 text-left">Semester</th>
                      <th className="p-4 text-left">Enrollment Date</th>
                      <th className="p-4 text-left w-40">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200/50">
                    {filteredEnrollments.map((enrollment) => (
                      <tr key={enrollment.id} className="hover:bg-emerald-50/50 transition-colors">
                        <td className="p-4 font-medium">{enrollment.id}</td>
                        <td className="p-4">
                          {editId === enrollment.id ? (
                            <select
                              className="px-3 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-800 bg-white"
                              value={editedEnrollment.studentId || ''}
                              onChange={(e) => setEditedEnrollment({ 
                                ...editedEnrollment, 
                                studentId: Number(e.target.value) 
                              })}
                            >
                              <option value="">Select Student</option>
                              {referenceData.students.map((student) => (
                                <option key={student.id} value={student.id}>
                                  {student.firstName} {student.lastName} ({student.registrationNumber})
                                </option>
                              ))}
                            </select>
                          ) : (
                            getStudentDisplay(enrollment.studentId)
                          )}
                        </td>
                        <td className="p-4">
                          {editId === enrollment.id ? (
                            <select
                              className="px-3 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-800 bg-white"
                              value={editedEnrollment.courseId || ''}
                              onChange={(e) => setEditedEnrollment({ 
                                ...editedEnrollment, 
                                courseId: Number(e.target.value) 
                              })}
                            >
                              <option value="">Select Course</option>
                              {referenceData.courses.map((course) => (
                                <option key={course.id} value={course.id}>
                                  {course.name} ({course.code})
                                </option>
                              ))}
                            </select>
                          ) : (
                            getCourseDisplay(enrollment.courseId)
                          )}
                        </td>
                        <td className="p-4">
                          {editId === enrollment.id ? (
                            <select
                              className="px-3 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-800 bg-white"
                              value={editedEnrollment.semesterId || ''}
                              onChange={(e) => setEditedEnrollment({ 
                                ...editedEnrollment, 
                                semesterId: Number(e.target.value) 
                              })}
                            >
                              <option value="">Select Semester</option>
                              {referenceData.semesters.map((semester) => (
                                <option key={semester.id} value={semester.id}>
                                  {semester.name}
                                </option>
                              ))}
                            </select>
                          ) : (
                            getSemesterDisplay(enrollment.semesterId)
                          )}
                        </td>
                        <td className="p-4">
                          {editId === enrollment.id ? (
                            <input
                              type="date"
                              className="px-3 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-800 bg-white"
                              value={editedEnrollment.enrollmentDate || ''}
                              onChange={(e) => setEditedEnrollment({ 
                                ...editedEnrollment, 
                                enrollmentDate: e.target.value 
                              })}
                            />
                          ) : (
                            enrollment.enrollmentDate || 'N/A'
                          )}
                        </td>
                        <td className="p-4 flex gap-3 items-center">
                          {editId === enrollment.id ? (
                            <>
                              <button
                                className="text-white bg-gradient-to-r from-pink-600 to-pink-500 hover:from-pink-700 hover:to-pink-600 px-3 py-1.5 rounded-lg flex items-center gap-1 text-sm transition-all shadow"
                                onClick={() => {
                                  const formData = new FormData();
                                  if (editedEnrollment.studentId !== undefined) {
                                    formData.append('studentId', String(editedEnrollment.studentId));
                                  }
                                  if (editedEnrollment.courseId !== undefined) {
                                    formData.append('courseId', String(editedEnrollment.courseId));
                                  }
                                  if (editedEnrollment.semesterId !== undefined) {
                                    formData.append('semesterId', String(editedEnrollment.semesterId));
                                  }
                                  if (editedEnrollment.enrollmentDate) {
                                    formData.append('enrollmentDate', editedEnrollment.enrollmentDate);
                                  }
                                  handleSave(enrollment.id, formData);
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
                                onClick={() => handleEdit(enrollment)}
                                title="Edit"
                              >
                                <FiEdit />
                              </button>
                              <button
                                className="text-red-600 hover:text-red-800 p-2 rounded-full hover:bg-red-50 transition-colors"
                                title="Delete"
                                onClick={() => handleDeleteEnrollment(enrollment.id)}
                              >
                                <FiTrash2 />
                              </button>
                              <button
                                className="text-emerald-600 hover:text-emerald-800 p-2 rounded-full hover:bg-emerald-50 transition-colors"
                                onClick={() => setShowDetails(enrollment)}
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

      {showAddEnrollment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl">
            <div className="flex justify-between items-center border-b p-6">
              <h2 className="text-2xl font-bold text-gray-800">Create New Enrollment</h2>
              <button
                onClick={() => setShowAddEnrollment(false)}
                className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
              >
                <FiX size={24} />
              </button>
            </div>
            <form action={handleAddEnrollment}>
              <div className="grid grid-cols-1 gap-6 p-6">
                <div>
                  <label htmlFor="enrollmentStudentId" className="block mb-2 text-sm font-medium text-gray-700">Student</label>
                  <select
                    id="enrollmentStudentId"
                    name="studentId"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-800 bg-white"
                    value={newEnrollment.studentId}
                    onChange={(e) => setNewEnrollment({ ...newEnrollment, studentId: e.target.value })}
                    required
                  >
                    <option value="">Select Student</option>
                    {referenceData.students.map((student) => (
                      <option key={student.id} value={student.id}>
                        {student.firstName} {student.lastName} ({student.registrationNumber})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="enrollmentCourseId" className="block mb-2 text-sm font-medium text-gray-700">Course</label>
                  <select
                    id="enrollmentCourseId"
                    name="courseId"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-800 bg-white"
                    value={newEnrollment.courseId}
                    onChange={(e) => setNewEnrollment({ ...newEnrollment, courseId: e.target.value })}
                    required
                  >
                    <option value="">Select Course</option>
                    {referenceData.courses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.name} ({course.code})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="enrollmentSemesterId" className="block mb-2 text-sm font-medium text-gray-700">Semester</label>
                  <select
                    id="enrollmentSemesterId"
                    name="semesterId"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-800 bg-white"
                    value={newEnrollment.semesterId}
                    onChange={(e) => setNewEnrollment({ ...newEnrollment, semesterId: e.target.value })}
                    required
                  >
                    <option value="">Select Semester</option>
                    {referenceData.semesters.map((semester) => (
                      <option key={semester.id} value={semester.id}>
                        {semester.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="enrollmentDate" className="block mb-2 text-sm font-medium text-gray-700">Enrollment Date</label>
                  <input
                    type="date"
                    id="enrollmentDate"
                    name="enrollmentDate"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-800 bg-white"
                    value={newEnrollment.enrollmentDate}
                    onChange={(e) => setNewEnrollment({ ...newEnrollment, enrollmentDate: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 p-6 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddEnrollment(false)}
                  className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-pink-600 to-pink-500 text-white rounded-lg hover:from-pink-700 hover:to-pink-600 transition-all shadow-md"
                >
                  Create Enrollment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="flex justify-between items-center border-b p-6">
              <h2 className="text-2xl font-bold text-gray-800">Enrollment Details</h2>
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
                  <p className="text-sm text-gray-500">Student</p>
                  <p className="font-medium text-gray-800">
                    {getStudentDisplay(showDetails.studentId)}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-500">Course</p>
                  <p className="font-medium text-gray-800">
                    {getCourseDisplay(showDetails.courseId)}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-500">Semester</p>
                  <p className="font-medium text-gray-800">
                    {getSemesterDisplay(showDetails.semesterId)}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-500">Enrollment Date</p>
                  <p className="font-medium text-gray-800">
                    {showDetails.enrollmentDate || 'N/A'}
                  </p>
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