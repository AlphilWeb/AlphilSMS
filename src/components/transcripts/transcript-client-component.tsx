// components/transcripts/transcript-client-component.tsx
'use client';

import { useState } from "react";
import { FiPlus, FiEdit, FiTrash2, FiEye, FiX, FiSave, FiCheck, FiDownload } from "react-icons/fi";
import { createTranscript, updateTranscript, deleteTranscript, getTranscripts } from "@/lib/actions/transcript.action";

// Define the interface for a Transcript based on your Drizzle schema
interface Transcript {
  id: number;
  studentId: number;
  semesterId: number;
  gpa: string | null; // Numeric types often come as string from DB, can be null
  cgpa: string | null; // Numeric types often come as string from DB, can be null
  generatedDate: string; // timestamp with defaultNow().notNull() will be Date, convert to string
  fileUrl: string | null;
}

// Define the interface for reference data
interface ReferenceData {
  students: { id: number; firstName: string; lastName: string; registrationNumber: string }[];
  semesters: { id: number; name: string }[];
}

interface TranscriptsClientComponentProps {
  initialTranscripts: Transcript[];
  referenceData: ReferenceData;
}

export default function TranscriptsClientComponent({ initialTranscripts, referenceData }: TranscriptsClientComponentProps) {
  const [transcripts, setTranscripts] = useState<Transcript[]>(initialTranscripts);
  const [search, setSearch] = useState("");
  const [filterBy, setFilterBy] = useState("studentId"); // Default filter
  const [selectedTranscriptId, setSelectedTranscriptId] = useState<number | null>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const [editedTranscript, setEditedTranscript] = useState<Partial<Transcript>>({});
  const [showDetails, setShowDetails] = useState<Transcript | null>(null);
  const [showAddTranscript, setShowAddTranscript] = useState(false);
  const [newTranscript, setNewTranscript] = useState({
    studentId: "", // Keep as string for select value
    semesterId: "", // Keep as string for select value
    gpa: "",
    cgpa: "",
    generatedDate: "", // Date input will be string
    fileUrl: "",
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Helper to get student display name
  const getStudentDisplayName = (studentId: number) => {
    const student = referenceData.students.find(s => s.id === studentId);
    return student ? `${student.firstName} ${student.lastName} (Reg: ${student.registrationNumber})` : `Student ID: ${studentId}`;
  };

  // Helper to get semester display name
  const getSemesterDisplayName = (semesterId: number) => {
    const semester = referenceData.semesters.find(s => s.id === semesterId);
    return semester ? semester.name : `Semester ID: ${semesterId}`;
  };

  // Filter transcripts based on search and filterBy criteria
  const filteredTranscripts = transcripts.filter((transcript: Transcript) => {
    let value = '';
    if (filterBy === 'studentId') {
      value = getStudentDisplayName(transcript.studentId).toLowerCase();
    } else if (filterBy === 'semesterId') {
      value = getSemesterDisplayName(transcript.semesterId).toLowerCase();
    } else {
      value = (transcript as any)[filterBy]?.toString().toLowerCase() || '';
    }
    return value.includes(search.toLowerCase());
  });

  // Handle edit button click
  const handleEdit = (transcript: Transcript) => {
    setEditId(transcript.id);
    setEditedTranscript({
      ...transcript,
      gpa: transcript.gpa || '',
      cgpa: transcript.cgpa || '',
      fileUrl: transcript.fileUrl || '',
      // Ensure generatedDate is a string and handle potential null/undefined
      generatedDate: transcript.generatedDate ? new Date(transcript.generatedDate).toISOString().split('T')[0] : '',
    });
    setFormError(null);
    setFormSuccess(null);
  };

  // Handle save (update) action
  const handleSave = async (id: number, formData: FormData) => {
    setFormError(null);
    setFormSuccess(null);
    try {
      const result = await updateTranscript(id, formData);
      if ('error' in result) {
        setFormError(result.error ? String("Failed to update transcript.") : null);
        return;
      }
      setFormSuccess('Transcript updated successfully!');
      setEditId(null);
      // Re-fetch all transcripts to ensure the local state is fully synchronized
      const updatedTranscripts = await getTranscripts();
      setTranscripts(updatedTranscripts.map(t => ({
        ...t,
        generatedDate: t.generatedDate instanceof Date ? t.generatedDate.toISOString() : t.generatedDate,
      })));
    } catch (error: any) {
      setFormError(error.message || "Failed to update transcript.");
    }
  };

  // Handle add new transcript action
  const handleAddTranscript = async (formData: FormData) => {
    setFormError(null);
    setFormSuccess(null);
    try {
      const result = await createTranscript(formData);
      if ('error' in result) {
        setFormError(result.error ? String("Failed to create transcript.") : null);
        return;
      }
      setFormSuccess('Transcript created successfully!');
      setShowAddTranscript(false);
      setNewTranscript({ // Reset form fields
        studentId: "", semesterId: "", gpa: "", cgpa: "", generatedDate: "", fileUrl: ""
      });
      // Re-fetch all transcripts to ensure the local state is fully synchronized
      const updatedTranscripts = await getTranscripts();
      setTranscripts(updatedTranscripts.map(t => ({
        ...t,
        generatedDate: t.generatedDate instanceof Date ? t.generatedDate.toISOString() : t.generatedDate,
      })));
    } catch (error: any) {
      setFormError(error.message || "Failed to create transcript.");
    }
  };

  // Handle delete transcript action
  const handleDeleteTranscript = async (transcriptId: number) => {
    setFormError(null);
    setFormSuccess(null);
    if (!confirm("Are you sure you want to delete this transcript? This action cannot be undone.")) return;
    try {
      const result = await deleteTranscript(transcriptId);
      if ('error' in result) {
        setFormError(result.error ? String("Failed to delete transcript.") : null);
        return;
      }
      setFormSuccess('Transcript deleted successfully!');
      setTranscripts(transcripts.filter((transcript) => transcript.id !== transcriptId));
    } catch (error: any) {
      setFormError(error.message || "Failed to delete transcript.");
    }
  };

  return (
    <>
      {/* Search and filter bar */}
      <div className="sticky top-[150px] z-20 px-12 py-4 bg-emerald-800 flex flex-wrap justify-between items-center gap-4 shadow-md">
        <div className="flex items-center gap-4">
          <input
            type="text"
            placeholder="Search transcripts..."
            className="px-4 py-2 bg-white/10 text-white placeholder-white/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 border border-emerald-600 w-64"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="px-4 py-2 bg-white/10 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 border border-emerald-600"
            value={filterBy}
            onChange={(e) => setFilterBy(e.target.value)}
          >
            <option className="bg-emerald-800" value="studentId">Student</option>
            <option className="bg-emerald-800" value="semesterId">Semester</option>
            <option className="bg-emerald-800" value="gpa">GPA</option>
            <option className="bg-emerald-800" value="cgpa">CGPA</option>
            <option className="bg-emerald-800" value="id">ID</option>
          </select>
        </div>
        <button
          className="bg-gradient-to-r from-pink-600 to-pink-500 hover:from-pink-700 hover:to-pink-600 px-4 py-2 rounded-lg text-white font-medium flex items-center gap-2 transition-all shadow-md"
          onClick={() => setShowAddTranscript(true)}
        >
          <FiPlus /> Add Transcript
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
                      <th className="p-4 text-left">Student</th>
                      <th className="p-4 text-left">Semester</th>
                      <th className="p-4 text-left">GPA</th>
                      <th className="p-4 text-left">CGPA</th>
                      <th className="p-4 text-left">Generated Date</th>
                      <th className="p-4 text-left w-40">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200/50">
                    {filteredTranscripts.map((transcript: Transcript) => (
                      <tr key={transcript.id} className="hover:bg-emerald-50/50 transition-colors">
                        <td className="p-4 font-medium text-gray-800">{transcript.id}</td>
                        <td className="p-4">
                          {editId === transcript.id ? (
                            <select
                              className="px-3 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-800 bg-white"
                              value={editedTranscript.studentId || ''}
                              onChange={(e) => setEditedTranscript({ ...editedTranscript, studentId: Number(e.target.value) })}
                            >
                              <option className="bg-emerald-800 text-white" value="">Select Student</option>
                              {referenceData.students.map((student) => (
                                <option className="bg-emerald-800 text-white" key={student.id} value={student.id}>
                                  {student.firstName} {student.lastName} ({student.registrationNumber})
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span className="text-gray-800">{getStudentDisplayName(transcript.studentId)}</span>
                          )}
                        </td>
                        <td className="p-4">
                          {editId === transcript.id ? (
                            <select
                              className="px-3 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-800 bg-white"
                              value={editedTranscript.semesterId || ''}
                              onChange={(e) => setEditedTranscript({ ...editedTranscript, semesterId: Number(e.target.value) })}
                            >
                              <option className="bg-emerald-800 text-white" value="">Select Semester</option>
                              {referenceData.semesters.map((semester) => (
                                <option className="bg-emerald-800 text-white" key={semester.id} value={semester.id}>
                                  {semester.name}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span className="text-gray-800">{getSemesterDisplayName(transcript.semesterId)}</span>
                          )}
                        </td>
                        <td className="p-4">
                          {editId === transcript.id ? (
                            <input
                              type="number"
                              step="0.01"
                              className="px-3 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-800 bg-white"
                              value={editedTranscript.gpa || ''}
                              onChange={(e) => setEditedTranscript({ ...editedTranscript, gpa: e.target.value })}
                            />
                          ) : (
                            <span className="text-gray-800">{transcript.gpa || 'N/A'}</span>
                          )}
                        </td>
                        <td className="p-4">
                          {editId === transcript.id ? (
                            <input
                              type="number"
                              step="0.01"
                              className="px-3 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-800 bg-white"
                              value={editedTranscript.cgpa || ''}
                              onChange={(e) => setEditedTranscript({ ...editedTranscript, cgpa: e.target.value })}
                            />
                          ) : (
                            <span className="text-gray-800">{transcript.cgpa || 'N/A'}</span>
                          )}
                        </td>
                        <td className="p-4">
                          {editId === transcript.id ? (
                            <input
                              type="date"
                              className="px-3 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-800 bg-white"
                              // Safely access generatedDate and split, providing empty string fallback
                              value={(editedTranscript.generatedDate || '').split('T')[0]}
                              onChange={(e) => setEditedTranscript({ ...editedTranscript, generatedDate: e.target.value })}
                            />
                          ) : (
                            <span className="text-gray-800">{new Date(transcript.generatedDate).toLocaleDateString()}</span>
                          )}
                        </td>
                        <td className="p-4 flex gap-3 items-center">
                          {editId === transcript.id ? (
                            <>
                              <button
                                className="text-white bg-gradient-to-r from-pink-600 to-pink-500 hover:from-pink-700 hover:to-pink-600 px-3 py-1.5 rounded-lg flex items-center gap-1 text-sm transition-all shadow"
                                onClick={() => {
                                  const formData = new FormData();
                                  if (editedTranscript.studentId !== undefined) formData.append('studentId', String(editedTranscript.studentId));
                                  if (editedTranscript.semesterId !== undefined) formData.append('semesterId', String(editedTranscript.semesterId));
                                  if (editedTranscript.gpa) formData.append('gpa', editedTranscript.gpa);
                                  if (editedTranscript.cgpa) formData.append('cgpa', editedTranscript.cgpa);
                                  if (editedTranscript.generatedDate) formData.append('generatedDate', editedTranscript.generatedDate);
                                  if (editedTranscript.fileUrl) formData.append('fileUrl', editedTranscript.fileUrl);
                                  handleSave(transcript.id, formData);
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
                                onClick={() => handleEdit(transcript)}
                                title="Edit"
                              >
                                <FiEdit />
                              </button>
                              <button
                                className="text-red-600 hover:text-red-800 p-2 rounded-full hover:bg-red-50 transition-colors"
                                title="Delete"
                                onClick={() => handleDeleteTranscript(transcript.id)}
                              >
                                <FiTrash2 />
                              </button>
                              <button
                                className="text-emerald-600 hover:text-emerald-800 p-2 rounded-full hover:bg-emerald-50 transition-colors"
                                onClick={() => setShowDetails(transcript)}
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

      {/* Add Transcript Modal */}
      {showAddTranscript && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl">
            <div className="flex justify-between items-center border-b p-6">
              <h2 className="text-2xl font-bold text-gray-800">Create New Transcript</h2>
              <button
                onClick={() => setShowAddTranscript(false)}
                className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
              >
                <FiX size={24} />
              </button>
            </div>
            <form action={handleAddTranscript}>
              <div className="grid grid-cols-1 gap-6 p-6">
                <div>
                  <label htmlFor="transcriptStudentId" className="block mb-2 text-sm font-medium text-gray-700">Student</label>
                  <select
                    id="transcriptStudentId"
                    name="studentId"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-800 bg-white"
                    value={newTranscript.studentId}
                    onChange={(e) => setNewTranscript({ ...newTranscript, studentId: e.target.value })}
                    required
                  >
                    <option className="bg-emerald-800 text-white" value="">Select Student</option>
                    {referenceData.students.map((student) => (
                      <option className="bg-emerald-800 text-white" key={student.id} value={student.id}>
                        {student.firstName} {student.lastName} ({student.registrationNumber})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="transcriptSemesterId" className="block mb-2 text-sm font-medium text-gray-700">Semester</label>
                  <select
                    id="transcriptSemesterId"
                    name="semesterId"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-800 bg-white"
                    value={newTranscript.semesterId}
                    onChange={(e) => setNewTranscript({ ...newTranscript, semesterId: e.target.value })}
                    required
                  >
                    <option className="bg-emerald-800 text-white" value="">Select Semester</option>
                    {referenceData.semesters.map((semester) => (
                      <option className="bg-emerald-800 text-white" key={semester.id} value={semester.id}>
                        {semester.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="gpa" className="block mb-2 text-sm font-medium text-gray-700">GPA (Optional)</label>
                  <input
                    type="number"
                    step="0.01"
                    id="gpa"
                    name="gpa"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-800 bg-white"
                    value={newTranscript.gpa}
                    onChange={(e) => setNewTranscript({ ...newTranscript, gpa: e.target.value })}
                  />
                </div>
                <div>
                  <label htmlFor="cgpa" className="block mb-2 text-sm font-medium text-gray-700">CGPA (Optional)</label>
                  <input
                    type="number"
                    step="0.01"
                    id="cgpa"
                    name="cgpa"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-800 bg-white"
                    value={newTranscript.cgpa}
                    onChange={(e) => setNewTranscript({ ...newTranscript, cgpa: e.target.value })}
                  />
                </div>
                <div>
                  <label htmlFor="generatedDate" className="block mb-2 text-sm font-medium text-gray-700">Generated Date</label>
                  <input
                    type="date"
                    id="generatedDate"
                    name="generatedDate"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-800 bg-white"
                    value={newTranscript.generatedDate}
                    onChange={(e) => setNewTranscript({ ...newTranscript, generatedDate: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="fileUrl" className="block mb-2 text-sm font-medium text-gray-700">File URL (Optional)</label>
                  <input
                    type="text"
                    id="fileUrl"
                    name="fileUrl"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-800 bg-white"
                    value={newTranscript.fileUrl}
                    onChange={(e) => setNewTranscript({ ...newTranscript, fileUrl: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 p-6 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddTranscript(false)}
                  className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-pink-600 to-pink-500 text-white rounded-lg hover:from-pink-700 hover:to-pink-600 transition-all shadow-md"
                >
                  Create Transcript
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
              <h2 className="text-2xl font-bold text-gray-800">Transcript Details</h2>
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
                  <p className="font-medium text-gray-800">{getStudentDisplayName(showDetails.studentId)}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-500">Semester</p>
                  <p className="font-medium text-gray-800">{getSemesterDisplayName(showDetails.semesterId)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">GPA</p>
                  <p className="font-medium text-gray-800">{showDetails.gpa || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">CGPA</p>
                  <p className="font-medium text-gray-800">{showDetails.cgpa || 'N/A'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-500">Generated Date</p>
                  <p className="font-medium text-gray-800">{new Date(showDetails.generatedDate).toLocaleDateString()}</p>
                </div>
                {showDetails.fileUrl && (
                  <div className="col-span-2">
                    <p className="text-sm text-gray-500">File URL</p>
                    <a href={showDetails.fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                      <FiDownload /> View File
                    </a>
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