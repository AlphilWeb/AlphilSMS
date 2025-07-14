// components/courses/course-client-component.tsx
'use client';

import { useState } from "react";
import { FiPlus, FiEdit, FiTrash2, FiEye, FiX, FiSave, FiCheck } from "react-icons/fi";
import { createCourse, updateCourse, deleteCourse, getCourses } from "@/lib/actions/course.action";

// Define the interface for a Course based on your Drizzle schema
interface Course {
  id: number;
  programId: number;
  semesterId: number;
  name: string;
  code: string;
  credits: string; // Drizzle's numeric type often comes as a string
  description: string | null;
}

// Define the interface for reference data (for program and semester dropdowns)
interface ReferenceData {
  programs: { id: number; name: string; code: string }[];
  semesters: { id: number; name: string }[];
}

interface CoursesClientComponentProps {
  initialCourses: Course[];
  referenceData: ReferenceData;
}

export default function CoursesClientComponent({ initialCourses, referenceData }: CoursesClientComponentProps) {
  const [courses, setCourses] = useState<Course[]>(initialCourses);
  const [search, setSearch] = useState("");
  const [filterBy, setFilterBy] = useState("name"); // Default filter
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const [editedCourse, setEditedCourse] = useState<Partial<Course>>({});
  const [showDetails, setShowDetails] = useState<Course | null>(null);
  const [showAddCourse, setShowAddCourse] = useState(false);
  const [newCourse, setNewCourse] = useState({
    programId: "", // Keep as string for select value
    semesterId: "", // Keep as string for select value
    name: "",
    code: "",
    credits: "", // Keep as string for input value
    description: "",
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Filter courses based on search and filterBy criteria
  const filteredCourses = courses.filter((course: Course) => {
    const value = (course as any)[filterBy]?.toString().toLowerCase();
    return value ? value.includes(search.toLowerCase()) : false;
  });

  // Handle edit button click
  const handleEdit = (course: Course) => {
    setEditId(course.id);
    setEditedCourse(course);
    setFormError(null);
    setFormSuccess(null);
  };

  // Handle save (update) action
  const handleSave = async (id: number, formData: FormData) => {
    setFormError(null);
    setFormSuccess(null);
    try {
      const result = await updateCourse(id, formData);
      if ('error' in result) {
        setFormError(result.error ? String("Failed to update course.") : null);
        return;
      }
      setFormSuccess('Course updated successfully!');
      setEditId(null);
      // Re-fetch all courses to ensure the local state is fully synchronized
      const updatedCourses = await getCourses();
      setCourses(updatedCourses);
    } catch (error: any) {
      setFormError(error.message || "Failed to update course.");
    }
  };

  // Handle add new course action
  const handleAddCourse = async (formData: FormData) => {
    setFormError(null);
    setFormSuccess(null);
    try {
      const result = await createCourse(formData);
      if ('error' in result) {
        setFormError(result.error ? String("Failed to create course.") : null);
        return;
      }
      setFormSuccess('Course created successfully!');
      setShowAddCourse(false);
      setNewCourse({ // Reset form fields
        programId: "", semesterId: "", name: "", code: "", credits: "", description: ""
      });
      // Re-fetch all courses to ensure the local state is fully synchronized
      const updatedCourses = await getCourses();
      setCourses(updatedCourses);
    } catch (error: any) {
      setFormError(error.message || "Failed to create course.");
    }
  };

  // Handle delete course action
  const handleDeleteCourse = async (courseId: number) => {
    setFormError(null);
    setFormSuccess(null);
    if (!confirm("Are you sure you want to delete this course? This action cannot be undone.")) return;
    try {
      const result = await deleteCourse(courseId);
      if ('error' in result) {
        setFormError(result.error ? String("Failed to delete course.") : null);
        return;
      }
      setFormSuccess('Course deleted successfully!');
      setCourses(courses.filter((course) => course.id !== courseId));
    } catch (error: any) {
      setFormError(error.message || "Failed to delete course.");
    }
  };

  return (
    <>
      {/* Search and filter bar */}
      <div className="sticky top-[150px] z-20 px-12 py-4 bg-emerald-800 flex flex-wrap justify-between items-center gap-4 shadow-md">
        <div className="flex items-center gap-4">
          <input
            type="text"
            placeholder="Search courses..."
            className="px-4 py-2 bg-white/10 text-white placeholder-white/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 border border-emerald-600 w-64"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="px-4 py-2 bg-white/10 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 border border-emerald-600"
            value={filterBy}
            onChange={(e) => setFilterBy(e.target.value)}
          >
            <option className="bg-emerald-800" value="name">Name</option>
            <option className="bg-emerald-800" value="code">Code</option>
            <option className="bg-emerald-800" value="id">ID</option>
            <option className="bg-emerald-800" value="programId">Program ID</option>
            <option className="bg-emerald-800" value="semesterId">Semester ID</option>
          </select>
        </div>
        <button
          className="bg-gradient-to-r from-pink-600 to-pink-500 hover:from-pink-700 hover:to-pink-600 px-4 py-2 rounded-lg text-white font-medium flex items-center gap-2 transition-all shadow-md"
          onClick={() => setShowAddCourse(true)}
        >
          <FiPlus /> Add Course
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
                      <th className="p-4 text-left">Name</th>
                      <th className="p-4 text-left">Code</th>
                      <th className="p-4 text-left">Credits</th>
                      <th className="p-4 text-left">Program (ID)</th>
                      <th className="p-4 text-left">Semester (ID)</th>
                      <th className="p-4 text-left">Description</th>
                      <th className="p-4 text-left w-40">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200/50">
                    {filteredCourses.map((course: Course) => (
                      <tr key={course.id} className="hover:bg-emerald-50/50 transition-colors">
                        <td className="p-4 font-medium text-gray-800">{course.id}</td>
                        <td className="p-4">
                          {editId === course.id ? (
                            <input
                              className="px-3 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-800 bg-white"
                              value={editedCourse.name || ''}
                              onChange={(e) => setEditedCourse({ ...editedCourse, name: e.target.value })}
                            />
                          ) : (
                            <span className="text-gray-800">{course.name}</span>
                          )}
                        </td>
                        <td className="p-4">
                          {editId === course.id ? (
                            <input
                              className="px-3 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-800 bg-white"
                              value={editedCourse.code || ''}
                              onChange={(e) => setEditedCourse({ ...editedCourse, code: e.target.value })}
                            />
                          ) : (
                            <span className="text-gray-800">{course.code}</span>
                          )}
                        </td>
                        <td className="p-4">
                          {editId === course.id ? (
                            <input
                              type="number"
                              step="0.01" // For numeric credits
                              className="px-3 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-800 bg-white"
                              value={editedCourse.credits || ''}
                              onChange={(e) => setEditedCourse({ ...editedCourse, credits: e.target.value })}
                            />
                          ) : (
                            <span className="text-gray-800">{course.credits}</span>
                          )}
                        </td>
                        <td className="p-4">
                          {editId === course.id ? (
                            <select
                              className="px-3 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-800 bg-white"
                              value={editedCourse.programId || ''}
                              onChange={(e) => setEditedCourse({ ...editedCourse, programId: Number(e.target.value) })}
                            >
                              <option className="bg-emerald-800 text-white" value="">Select Program</option>
                              {referenceData.programs.map((program) => (
                                <option className="bg-emerald-800 text-white" key={program.id} value={program.id}>
                                  {program.name} ({program.code})
                                </option>
                              ))}
                            </select>
                          ) : (
                            course.programId ? (
                              <span className="text-gray-800">
                                {referenceData.programs.find(p => p.id === course.programId)?.name +
                                ` (ID: ${course.programId})`}
                              </span>
                            ) : (
                              <span className="text-gray-800">N/A</span>
                            )
                          )}
                        </td>
                        <td className="p-4">
                          {editId === course.id ? (
                            <select
                              className="px-3 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-800 bg-white"
                              value={editedCourse.semesterId || ''}
                              onChange={(e) => setEditedCourse({ ...editedCourse, semesterId: Number(e.target.value) })}
                            >
                              <option className="bg-emerald-800 text-white" value="">Select Semester</option>
                              {referenceData.semesters.map((semester) => (
                                <option className="bg-emerald-800 text-white" key={semester.id} value={semester.id}>
                                  {semester.name} (ID: {semester.id})
                                </option>
                              ))}
                            </select>
                          ) : (
                            course.semesterId ? (
                              <span className="text-gray-800">
                                {referenceData.semesters.find(s => s.id === course.semesterId)?.name +
                                ` (ID: ${course.semesterId})`}
                              </span>
                            ) : (
                              <span className="text-gray-800">N/A</span>
                            )
                          )}
                        </td>
                        <td className="p-4">
                          {editId === course.id ? (
                            <textarea
                              className="px-3 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-800 bg-white"
                              value={editedCourse.description || ''}
                              onChange={(e) => setEditedCourse({ ...editedCourse, description: e.target.value })}
                              rows={2}
                            />
                          ) : (
                            <span className="text-gray-800">{course.description || 'N/A'}</span>
                          )}
                        </td>
                        <td className="p-4 flex gap-3 items-center">
                          {editId === course.id ? (
                            <>
                              <button
                                className="text-white bg-gradient-to-r from-pink-600 to-pink-500 hover:from-pink-700 hover:to-pink-600 px-3 py-1.5 rounded-lg flex items-center gap-1 text-sm transition-all shadow"
                                onClick={() => {
                                  const formData = new FormData();
                                  if (editedCourse.programId !== undefined) formData.append('programId', String(editedCourse.programId));
                                  if (editedCourse.semesterId !== undefined) formData.append('semesterId', String(editedCourse.semesterId));
                                  if (editedCourse.name) formData.append('name', editedCourse.name);
                                  if (editedCourse.code) formData.append('code', editedCourse.code);
                                  if (editedCourse.credits) formData.append('credits', editedCourse.credits);
                                  if (editedCourse.description) formData.append('description', editedCourse.description);
                                  handleSave(course.id, formData);
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
                                onClick={() => handleEdit(course)}
                                title="Edit"
                              >
                                <FiEdit />
                              </button>
                              <button
                                className="text-red-600 hover:text-red-800 p-2 rounded-full hover:bg-red-50 transition-colors"
                                title="Delete"
                                onClick={() => handleDeleteCourse(course.id)}
                              >
                                <FiTrash2 />
                              </button>
                              <button
                                className="text-emerald-600 hover:text-emerald-800 p-2 rounded-full hover:bg-emerald-50 transition-colors"
                                onClick={() => setShowDetails(course)}
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

      {/* Add Course Modal */}
      {showAddCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl">
            <div className="flex justify-between items-center border-b p-6">
              <h2 className="text-2xl font-bold text-gray-800">Create New Course</h2>
              <button
                onClick={() => setShowAddCourse(false)}
                className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
              >
                <FiX size={24} />
              </button>
            </div>
            <form action={handleAddCourse}>
              <div className="grid grid-cols-1 gap-6 p-6">
                <div>
                  <label htmlFor="courseName" className="block mb-2 text-sm font-medium text-gray-700">Course Name</label>
                  <input
                    type="text"
                    id="courseName"
                    name="name"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-800 bg-white"
                    value={newCourse.name}
                    onChange={(e) => setNewCourse({ ...newCourse, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="courseCode" className="block mb-2 text-sm font-medium text-gray-700">Course Code</label>
                  <input
                    type="text"
                    id="courseCode"
                    name="code"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-800 bg-white"
                    value={newCourse.code}
                    onChange={(e) => setNewCourse({ ...newCourse, code: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="courseCredits" className="block mb-2 text-sm font-medium text-gray-700">Credits</label>
                  <input
                    type="number"
                    step="0.01"
                    id="courseCredits"
                    name="credits"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-800 bg-white"
                    value={newCourse.credits}
                    onChange={(e) => setNewCourse({ ...newCourse, credits: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="courseProgramId" className="block mb-2 text-sm font-medium text-gray-700">Program</label>
                  <select
                    id="courseProgramId"
                    name="programId"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-800 bg-white"
                    value={newCourse.programId}
                    onChange={(e) => setNewCourse({ ...newCourse, programId: e.target.value })}
                    required
                  >
                    <option className="bg-emerald-800 text-white" value="">Select Program</option>
                    {referenceData.programs.map((program) => (
                      <option className="bg-emerald-800 text-white" key={program.id} value={program.id}>
                        {program.name} ({program.code})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="courseSemesterId" className="block mb-2 text-sm font-medium text-gray-700">Semester</label>
                  <select
                    id="courseSemesterId"
                    name="semesterId"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-800 bg-white"
                    value={newCourse.semesterId}
                    onChange={(e) => setNewCourse({ ...newCourse, semesterId: e.target.value })}
                    required
                  >
                    <option className="bg-emerald-800 text-white" value="">Select Semester</option>
                    {referenceData.semesters.map((semester) => (
                      <option className="bg-emerald-800 text-white" key={semester.id} value={semester.id}>
                        {semester.name} (ID: {semester.id})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="courseDescription" className="block mb-2 text-sm font-medium text-gray-700">Description (Optional)</label>
                  <textarea
                    id="courseDescription"
                    name="description"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-800 bg-white"
                    value={newCourse.description}
                    onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 p-6 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddCourse(false)}
                  className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-pink-600 to-pink-500 text-white rounded-lg hover:from-pink-700 hover:to-pink-600 transition-all shadow-md"
                >
                  Create Course
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
              <h2 className="text-2xl font-bold text-gray-800">Course Details</h2>
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
                <div>
                  <p className="text-sm text-gray-500">Code</p>
                  <p className="font-medium text-gray-800">{showDetails.code}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-500">Name</p>
                  <p className="font-medium text-gray-800">{showDetails.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Credits</p>
                  <p className="font-medium text-gray-800">{showDetails.credits}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Program</p>
                  <p className="font-medium text-gray-800">
                    {showDetails.programId ? (
                      referenceData.programs.find(p => p.id === showDetails.programId)?.name +
                      ` (ID: ${showDetails.programId})`
                    ) : (
                      'N/A'
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Semester</p>
                  <p className="font-medium text-gray-800">
                    {showDetails.semesterId ? (
                      referenceData.semesters.find(s => s.id === showDetails.semesterId)?.name +
                      ` (ID: ${showDetails.semesterId})`
                    ) : (
                      'N/A'
                    )}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-500">Description</p>
                  <p className="font-medium text-gray-800">{showDetails.description || 'N/A'}</p>
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