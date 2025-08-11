'use client';

import { useState } from "react";
import { FiPlus, FiEdit, FiTrash2, FiEye, FiX, FiSave, FiCheck } from "react-icons/fi";
import { createStudent, updateStudent, deleteStudent, getStudents } from "@/lib/actions/student.action";

// interface Student {
//   id: number;
//   userId: number;
//   programId: number;
//   departmentId: number;
//   currentSemesterId: number;
//   firstName: string;
//   lastName: string;
//   email: string;
//   registrationNumber: string;
//   studentNumber: string;
//   passportPhotoUrl: string | null;
//   idPhotoUrl: string | null;
//   certificateUrl: string | null;
//   programName?: string;
//   departmentName?: string;
//   currentSemesterName?: string;
//   userEmail?: string | null;
// }
interface NewStudentForm {
  userId: string;
  programId: string;
  departmentId: string;
  currentSemesterId: string;
  firstName: string;
  lastName: string;
  email: string;
  registrationNumber: string;
  studentNumber: string;
  passportPhotoUrl: string;
  idPhotoUrl: string;
  certificateUrl: string;
}
interface Student {
  id: number;
  userId: number;
  programId: number;
  departmentId: number;
  currentSemesterId: number;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  registrationNumber: string;
  studentNumber: string;
  passportPhotoUrl: string | null;
  idPhotoUrl: string | null;
  certificateUrl: string | null;
  programName?: string | null;
  departmentName?: string | null;
  currentSemesterName?: string | null;
  userEmail?: string | null;
}

interface ApiStudent {
  id: number;
  userId: number;
  programId?: number | null;
  departmentId?: number | null;
  currentSemesterId?: number | null;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  registrationNumber: string;
  studentNumber: string;
  passportPhotoUrl: string | null;
  idPhotoUrl: string | null;
  certificateUrl: string | null;
  programName?: string | null;
  departmentName?: string | null;
  currentSemesterName?: string | null;
  userEmail?: string | null;
}


interface StudentsClientComponentProps {
  initialStudents: ApiStudent[];
}

const transformApiStudent = (apiStudent: ApiStudent): Student => {
  return {
    id: apiStudent.id,
    userId: apiStudent.userId,
    programId: apiStudent.programId ?? 0,  // Provide default value if undefined/null
    departmentId: apiStudent.departmentId ?? 0,  // Provide default value if undefined/null
    currentSemesterId: apiStudent.currentSemesterId ?? 0,  // Provide default value if undefined/null
    firstName: apiStudent.firstName,
    lastName: apiStudent.lastName,
    fullName: apiStudent.fullName,
    email: apiStudent.email,
    registrationNumber: apiStudent.registrationNumber,
    studentNumber: apiStudent.studentNumber,
    passportPhotoUrl: apiStudent.passportPhotoUrl,
    idPhotoUrl: apiStudent.idPhotoUrl,
    certificateUrl: apiStudent.certificateUrl,
    ...(apiStudent.programName && { programName: apiStudent.programName }),
    ...(apiStudent.departmentName && { departmentName: apiStudent.departmentName }),
    ...(apiStudent.currentSemesterName && { currentSemesterName: apiStudent.currentSemesterName }),
    ...(apiStudent.userEmail && { userEmail: apiStudent.userEmail })
  };
};

export default function StudentsClientComponent({ initialStudents }: StudentsClientComponentProps) {
  const [students, setStudents] = useState<Student[]>(initialStudents.map(transformApiStudent));
  const [search, setSearch] = useState("");
  const [filterBy, setFilterBy] = useState<keyof Student>("email");
  const [editId, setEditId] = useState<number | null>(null);
  const [editedStudent, setEditedStudent] = useState<Partial<Student>>({});
  const [showDetails, setShowDetails] = useState<Student | null>(null);
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [newStudent, setNewStudent] = useState<NewStudentForm>({
    userId: "",
    programId: "",
    departmentId: "",
    currentSemesterId: "",
    firstName: "",
    lastName: "",
    email: "",
    registrationNumber: "",
    studentNumber: "",
    passportPhotoUrl: "",
    idPhotoUrl: "",
    certificateUrl: "",
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const filteredStudents = students.filter((student) => {
    const value = String(student[filterBy]).toLowerCase();
    return value.includes(search.toLowerCase());
  });

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilterBy(e.target.value as keyof Student);
  };

  const handleEdit = (student: Student) => {
    setEditId(student.id);
    setEditedStudent({
      ...student,
      passportPhotoUrl: student.passportPhotoUrl || '',
      idPhotoUrl: student.idPhotoUrl || '',
      certificateUrl: student.certificateUrl || ''
    });
    setFormError(null);
    setFormSuccess(null);
  };

  const handleSave = async (id: number, formData: FormData) => {
    setFormError(null);
    setFormSuccess(null);
    try {
      const result = await updateStudent(id, formData);
      if ('error' in result) {
        setFormError(result.error ?? "Failed to update student.");
        return;
      }
      setFormSuccess('Student updated successfully!');
      setEditId(null);
      
      const updatedStudents = await getStudents();
      setStudents(updatedStudents.map(transformApiStudent));
    } catch (error: unknown) {
      setFormError(error instanceof Error ? error.message : "Failed to update student.");
    }
  };

  const handleAddStudent = async (formData: FormData) => {
    setFormError(null);
    setFormSuccess(null);
    try {
      const result = await createStudent(formData);
      if ('error' in result) {
        setFormError(result.error ?? "Failed to create student.");
        return;
      }
      setFormSuccess('Student created successfully!');
      setShowAddStudent(false);
      setNewStudent({
        userId: "", programId: "", departmentId: "", currentSemesterId: "",
        firstName: "", lastName: "", email: "", registrationNumber: "",
        studentNumber: "", passportPhotoUrl: "", idPhotoUrl: "", certificateUrl: ""
      });

      const updatedStudents = await getStudents();
      setStudents(updatedStudents.map(transformApiStudent));
    } catch (error: unknown) {
      setFormError(error instanceof Error ? error.message : "Failed to create student.");
    }
  };

  const handleDeleteStudent = async (studentId: number) => {
    setFormError(null);
    setFormSuccess(null);
    if (!confirm("Are you sure you want to delete this student? This action cannot be undone.")) return;
    try {
      const result = await deleteStudent(studentId);
      if ('error' in result) {
        setFormError(result.error ?? "Failed to delete student.");
        return;
      }
      setFormSuccess('Student deleted successfully!');
      setStudents(students.filter(student => student.id !== studentId));
    } catch (error: unknown) {
      setFormError(error instanceof Error ? error.message : "Failed to delete student.");
    }
  };

  // JSX portion remains the same...

  return (
    <>
      {/* Search and filter bar */}
      <div className="sticky top-[150px] z-20 px-12 py-4 bg-emerald-800 flex flex-wrap justify-between items-center gap-4 shadow-md">
        <div className="flex items-center gap-4">
          <input
            type="text"
            placeholder="Search students..."
            className="px-4 py-2 bg-white/10 text-white placeholder-white/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border border-emerald-600 w-64"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
<select
  className="px-4 py-2 bg-white/10 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border border-emerald-600"
  value={filterBy}
  onChange={handleFilterChange}
>
            <option className="bg-emerald-800" value="email">Email</option>
            <option className="bg-emerald-800"  value="firstName">First Name</option>
            <option className="bg-emerald-800"  value="lastName">Last Name</option>
            <option className="bg-emerald-800"  value="registrationNumber">Reg. No.</option>
            <option className="bg-emerald-800"  value="studentNumber">Student No.</option>
            <option className="bg-emerald-800"  value="id">ID</option>
          </select>
        </div>
        <button
          className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 px-4 py-2 rounded-lg text-white font-medium flex items-center gap-2 transition-all shadow-md"
          onClick={() => setShowAddStudent(true)}
        >
          <FiPlus /> Add Student
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
                      {/* <th className="p-4 text-left w-12">Select</th> */}
                      <th className="p-4 text-left w-20">ID</th>
                      <th className="p-4 text-left">First Name</th>
                      <th className="p-4 text-left">Last Name</th>
                      <th className="p-4 text-left">Email</th>
                      <th className="p-4 text-left">Reg. No.</th>
                      <th className="p-4 text-left">Student No.</th>
                      <th className="p-4 text-left w-24">Program ID</th>
                      <th className="p-4 text-left w-24">Dept ID</th>
                      <th className="p-4 text-left w-24">Semester ID</th>
                      <th className="p-4 text-left w-40">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200/50">
                    {filteredStudents.map((student: Student) => (
                      <tr key={student.id} className="hover:bg-emerald-50/50 transition-colors">
                        {/* <td className="p-4">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            checked={selectedStudentId === student.id}
                            onChange={() =>
                              setSelectedStudentId(selectedStudentId === student.id ? null : student.id)
                            }
                          />
                        </td> */}
                        <td className="p-4 font-medium">{student.id}</td>
                        <td className="p-4">
                          {editId === student.id ? (
                            <input
                              className="px-3 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 bg-white"
                              value={editedStudent.firstName || ''}
                              onChange={(e) => setEditedStudent({ ...editedStudent, firstName: e.target.value })}
                            />
                          ) : (
                            student.firstName
                          )}
                        </td>
                        <td className="p-4">
                          {editId === student.id ? (
                            <input
                              className="px-3 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 bg-white"
                              value={editedStudent.lastName || ''}
                              onChange={(e) => setEditedStudent({ ...editedStudent, lastName: e.target.value })}
                            />
                          ) : (
                            student.lastName
                          )}
                        </td>
                        <td className="p-4">
                          {editId === student.id ? (
                            <input
                              type="email"
                              className="px-3 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 bg-white"
                              value={editedStudent.email || ''}
                              onChange={(e) => setEditedStudent({ ...editedStudent, email: e.target.value })}
                            />
                          ) : (
                            student.email
                          )}
                        </td>
                        <td className="p-4">
                          {editId === student.id ? (
                            <input
                              className="px-3 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 bg-white"
                              value={editedStudent.registrationNumber || ''}
                              onChange={(e) => setEditedStudent({ ...editedStudent, registrationNumber: e.target.value })}
                            />
                          ) : (
                            student.registrationNumber
                          )}
                        </td>
                        <td className="p-4">
                          {editId === student.id ? (
                            <input
                              className="px-3 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 bg-white"
                              value={editedStudent.studentNumber || ''}
                              onChange={(e) => setEditedStudent({ ...editedStudent, studentNumber: e.target.value })}
                            />
                          ) : (
                            student.studentNumber
                          )}
                        </td>
                        <td className="p-4">
                          {editId === student.id ? (
                            <input
                              type="number"
                              className="px-3 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 bg-white"
                              value={editedStudent.programId || ''}
                              onChange={(e) => setEditedStudent({ ...editedStudent, programId: Number(e.target.value) })}
                            />
                          ) : (
                            student.programId
                          )}
                        </td>
                        <td className="p-4">
                          {editId === student.id ? (
                            <input
                              type="number"
                              className="px-3 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 bg-white"
                              value={editedStudent.departmentId || ''}
                              onChange={(e) => setEditedStudent({ ...editedStudent, departmentId: Number(e.target.value) })}
                            />
                          ) : (
                            student.departmentId
                          )}
                        </td>
                        <td className="p-4">
                          {editId === student.id ? (
                            <input
                              type="number"
                              className="px-3 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 bg-white"
                              value={editedStudent.currentSemesterId || ''}
                              onChange={(e) => setEditedStudent({ ...editedStudent, currentSemesterId: Number(e.target.value) })}
                            />
                          ) : (
                            student.currentSemesterId
                          )}
                        </td>
                        
                        <td className="p-4 flex gap-3 items-center">
                          {editId === student.id ? (
                            <>
                              <button
                                className="text-white bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 px-3 py-1.5 rounded-lg flex items-center gap-1 text-sm transition-all shadow"
                                onClick={() => {
                                  const formData = new FormData();
                                  if (editedStudent.userId !== undefined) formData.append('userId', String(editedStudent.userId));
                                  if (editedStudent.programId !== undefined) formData.append('programId', String(editedStudent.programId));
                                  if (editedStudent.departmentId !== undefined) formData.append('departmentId', String(editedStudent.departmentId));
                                  if (editedStudent.currentSemesterId !== undefined) formData.append('currentSemesterId', String(editedStudent.currentSemesterId));
                                  if (editedStudent.firstName) formData.append('firstName', editedStudent.firstName);
                                  if (editedStudent.lastName) formData.append('lastName', editedStudent.lastName);
                                  if (editedStudent.email) formData.append('email', editedStudent.email);
                                  if (editedStudent.registrationNumber) formData.append('registrationNumber', editedStudent.registrationNumber);
                                  if (editedStudent.studentNumber) formData.append('studentNumber', editedStudent.studentNumber);
                                  if (editedStudent.passportPhotoUrl) formData.append('passportPhotoUrl', editedStudent.passportPhotoUrl);
                                  if (editedStudent.idPhotoUrl) formData.append('idPhotoUrl', editedStudent.idPhotoUrl);
                                  if (editedStudent.certificateUrl) formData.append('certificateUrl', editedStudent.certificateUrl);
                                  handleSave(student.id, formData);
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
                                onClick={() => handleEdit(student)}
                                title="Edit"
                              >
                                <FiEdit />
                              </button>
                              <button
                                className="text-red-600 hover:text-red-800 p-2 rounded-full hover:bg-red-50 transition-colors"
                                title="Delete"
                                onClick={() => handleDeleteStudent(student.id)}
                              >
                                <FiTrash2 />
                              </button>
                              <button
                                className="text-emerald-600 hover:text-emerald-800 p-2 rounded-full hover:bg-emerald-50 transition-colors"
                                onClick={() => setShowDetails(student)}
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

      {/* Add Student Modal */}
      {showAddStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-4xl">
            <div className="flex justify-between items-center border-b p-6">
              <h2 className="text-2xl font-bold text-gray-800">Create New Student</h2>
              <button
                onClick={() => setShowAddStudent(false)}
                className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
              >
                <FiX size={24} />
              </button>
            </div>
            <form action={handleAddStudent}>
              <div className="grid grid-cols-2 gap-6 p-6">
                <div>
                  <label htmlFor="userId" className="block mb-2 text-sm font-medium text-gray-700">User ID</label>
                  <input
                    type="number"
                    id="userId"
                    name="userId"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 bg-white"
                    value={newStudent.userId}
                    onChange={(e) => setNewStudent({ ...newStudent, userId: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="firstName" className="block mb-2 text-sm font-medium text-gray-700">First Name</label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 bg-white"
                    value={newStudent.firstName}
                    onChange={(e) => setNewStudent({ ...newStudent, firstName: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block mb-2 text-sm font-medium text-gray-700">Last Name</label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 bg-white"
                    value={newStudent.lastName}
                    onChange={(e) => setNewStudent({ ...newStudent, lastName: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block mb-2 text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 bg-white"
                    value={newStudent.email}
                    onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="registrationNumber" className="block mb-2 text-sm font-medium text-gray-700">Registration Number</label>
                  <input
                    type="text"
                    id="registrationNumber"
                    name="registrationNumber"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 bg-white"
                    value={newStudent.registrationNumber}
                    onChange={(e) => setNewStudent({ ...newStudent, registrationNumber: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="studentNumber" className="block mb-2 text-sm font-medium text-gray-700">Student Number</label>
                  <input
                    type="text"
                    id="studentNumber"
                    name="studentNumber"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 bg-white"
                    value={newStudent.studentNumber}
                    onChange={(e) => setNewStudent({ ...newStudent, studentNumber: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="programId" className="block mb-2 text-sm font-medium text-gray-700">Program ID</label>
                  <input
                    type="number"
                    id="programId"
                    name="programId"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 bg-white"
                    value={newStudent.programId}
                    onChange={(e) => setNewStudent({ ...newStudent, programId: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="departmentId" className="block mb-2 text-sm font-medium text-gray-700">Department ID</label>
                  <input
                    type="number"
                    id="departmentId"
                    name="departmentId"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 bg-white"
                    value={newStudent.departmentId}
                    onChange={(e) => setNewStudent({ ...newStudent, departmentId: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="currentSemesterId" className="block mb-2 text-sm font-medium text-gray-700">Current Semester ID</label>
                  <input
                    type="number"
                    id="currentSemesterId"
                    name="currentSemesterId"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 bg-white"
                    value={newStudent.currentSemesterId}
                    onChange={(e) => setNewStudent({ ...newStudent, currentSemesterId: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="passportPhotoUrl" className="block mb-2 text-sm font-medium text-gray-700">Passport Photo URL (Optional)</label>
                  <input
                    type="text"
                    id="passportPhotoUrl"
                    name="passportPhotoUrl"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 bg-white"
                    value={newStudent.passportPhotoUrl}
                    onChange={(e) => setNewStudent({ ...newStudent, passportPhotoUrl: e.target.value })}
                  />
                </div>
                <div>
                  <label htmlFor="idPhotoUrl" className="block mb-2 text-sm font-medium text-gray-700">ID Photo URL (Optional)</label>
                  <input
                    type="text"
                    id="idPhotoUrl"
                    name="idPhotoUrl"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 bg-white"
                    value={newStudent.idPhotoUrl}
                    onChange={(e) => setNewStudent({ ...newStudent, idPhotoUrl: e.target.value })}
                  />
                </div>
                <div>
                  <label htmlFor="certificateUrl" className="block mb-2 text-sm font-medium text-gray-700">Certificate URL (Optional)</label>
                  <input
                    type="text"
                    id="certificateUrl"
                    name="certificateUrl"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 bg-white"
                    value={newStudent.certificateUrl}
                    onChange={(e) => setNewStudent({ ...newStudent, certificateUrl: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 p-6 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddStudent(false)}
                  className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg hover:from-blue-700 hover:to-blue-600 transition-all shadow-md"
                >
                  Create Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {showDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="relative bg-white rounded-xl shadow-2xl max-w-2xl w-full">
            <div className="flex justify-between items-center border-b p-6">
              <h2 className="text-2xl font-bold text-gray-800">Student Details</h2>
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
                  <p className="font-medium text-black">{showDetails.id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">User ID</p>
                  <p className="font-medium text-black">{showDetails.userId}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">First Name</p>
                  <p className="font-medium text-black">{showDetails.firstName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Last Name</p>
                  <p className="font-medium text-black">{showDetails.lastName}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium text-black">{showDetails.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Registration Number</p>
                  <p className="font-medium text-black">{showDetails.registrationNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Student Number</p>
                  <p className="font-medium text-black">{showDetails.studentNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Program ID</p>
                  <p className="font-medium text-black">{showDetails.programId}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Department ID</p>
                  <p className="font-medium text-black">{showDetails.departmentId}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Current Semester ID</p>
                  <p className="font-medium text-black">{showDetails.currentSemesterId}</p>
                </div>
                {showDetails.passportPhotoUrl && (
                  <div className="col-span-2">
                    <p className="text-sm text-gray-500">Passport Photo</p>
                    <a href={showDetails.passportPhotoUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">View Photo</a>
                  </div>
                )}
                {showDetails.idPhotoUrl && (
                  <div className="col-span-2">
                    <p className="text-sm text-gray-500">ID Photo</p>
                    <a href={showDetails.idPhotoUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">View Photo</a>
                  </div>
                )}
                {showDetails.certificateUrl && (
                  <div className="col-span-2">
                    <p className="text-sm text-gray-500">Certificate</p>
                    <a href={showDetails.certificateUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">View Certificate</a>
                  </div>
                )}

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