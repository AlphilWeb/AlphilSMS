'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  getLecturerCourses,
  getCourseDetails,
  getCourseMaterials,
  uploadCourseMaterial,
  deleteCourseMaterial,
  getCourseEnrollments,
  getCourseTimetable,
  type CourseWithProgram,
  type CourseDetails,
  type CourseMaterial,
  type CourseEnrollment,
} from '@/lib/actions/lecturer.manage.courses.action';

type TimetableEntry = {
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  room: string;
};

import {
  FiBook, FiUsers, FiFileText, FiClock, FiUpload, 
  FiTrash2, FiDownload, FiPlus, FiChevronRight
} from 'react-icons/fi';

import { getDownloadUrl } from '@/lib/actions/files.download.action';

export default function LecturerCoursesClient() {
  const router = useRouter();
  const [courses, setCourses] = useState<CourseWithProgram[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<CourseDetails | null>(null);
  const [materials, setMaterials] = useState<CourseMaterial[]>([]);
  const [enrollments, setEnrollments] = useState<CourseEnrollment[]>([]);
  const [timetablee, setTimetable] = useState<TimetableEntry[]>([]);
  const [activeTab, setActiveTab] = useState<'materials' | 'students' | 'timetable'>('materials');
  const [loading, setLoading] = useState({
    courses: true,
    details: false,
    materials: false,
    enrollments: false,
    timetable: false,
    upload: false
  });
  const [error, setError] = useState<string | null>(null);
  const [newMaterial, setNewMaterial] = useState({
    title: '',
    type: 'lecture_notes',
    file: null as File | null
  });

  // Fetch all courses on component mount
  useEffect(() => {
    const loadCourses = async () => {
      try {
        setLoading(prev => ({ ...prev, courses: true }));
        const data = await getLecturerCourses();
        setCourses(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load courses');
      } finally {
        setLoading(prev => ({ ...prev, courses: false }));
      }
    };

    loadCourses();
  }, []);

  // Load course details when selected
  const handleSelectCourse = async (courseId: number) => {
    try {
      setLoading(prev => ({ 
        ...prev, 
        details: true,
        materials: true,
        enrollments: true,
        timetable: true
      }));
      setError(null);
      
      const [details, mats, enrolls, timetable] = await Promise.all([
        getCourseDetails(courseId),
        getCourseMaterials(courseId),
        getCourseEnrollments(courseId),
        getCourseTimetable(courseId)
      ]);

      setSelectedCourse(details);
      setMaterials(mats);
      setEnrollments(enrolls);
      setTimetable(timetablee);
      setActiveTab('materials');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load course details');
    } finally {
      setLoading(prev => ({ 
        ...prev, 
        details: false,
        materials: false,
        enrollments: false,
        timetable: false
      }));
    }
  };

  // Handle file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setNewMaterial(prev => ({
        ...prev,
        file: e.target.files![0]
      }));
    }
  };

  // Submit new material
  const handleUploadMaterial = async () => {
    if (!selectedCourse || !newMaterial.file) return;
    
    try {
      setLoading(prev => ({ ...prev, upload: true }));
      setError(null);
      
      const formData = new FormData();
      formData.append('title', newMaterial.title);
      formData.append('type', newMaterial.type);
      formData.append('file', newMaterial.file);

      const uploadedMaterial = await uploadCourseMaterial(selectedCourse.id, formData);
      
      setMaterials(prev => [uploadedMaterial, ...prev]);
      setNewMaterial({
        title: '',
        type: 'lecture_notes',
        file: null
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload material');
    } finally {
      setLoading(prev => ({ ...prev, upload: false }));
    }
  };

  // Delete material
  const handleDeleteMaterial = async (materialId: number) => {
    if (!selectedCourse) return;
    
    try {
      setError(null);
      await deleteCourseMaterial(materialId);
      setMaterials(prev => prev.filter(m => m.id !== materialId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete material');
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

  // Format time
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), date.setMinutes(parseInt(minutes)));
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Course Management</h1>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Courses List */}
        <div className="lg:col-span-1">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Your Courses</h2>
          
          {loading.courses ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-100 rounded-lg animate-pulse"></div>
              ))}
            </div>
          ) : courses.length === 0 ? (
            <div className="p-6 text-center bg-gray-50 rounded-lg">
              <FiBook className="mx-auto h-12 w-12 text-gray-400 mb-2" />
              <p className="text-gray-500">No courses found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {courses.map((course) => (
                <div
                  key={course.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    selectedCourse?.id === course.id 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                  onClick={() => handleSelectCourse(course.id)}
                >
                  <div>
                    <h3 className="font-semibold text-gray-800">{course.name}</h3>
                    <p className="text-sm text-gray-600">{course.code} • {course.program.code}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {course.semester.name} • {course.credits} credits
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Course Details */}
        <div className="lg:col-span-3">
          {!selectedCourse ? (
            <div className="p-6 text-center bg-gray-50 rounded-lg">
              <FiBook className="mx-auto h-12 w-12 text-gray-400 mb-2" />
              <p className="text-gray-500">Select a course to view details</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Course Header */}
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">
                      {selectedCourse.name} ({selectedCourse.code})
                    </h2>
                    <p className="text-gray-600">
                      {selectedCourse.program.name} • {selectedCourse.semester.name}
                    </p>
                    {selectedCourse.description && (
                      <p className="mt-2 text-gray-700">{selectedCourse.description}</p>
                    )}
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500">Students</p>
                    <p className="font-medium text-blue-600">
                      {selectedCourse.studentCount}
                    </p>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500">Materials</p>
                    <p className="font-medium text-green-600">
                      {selectedCourse.materialsCount}
                    </p>
                  </div>
                  <div className="bg-purple-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500">Credits</p>
                    <p className="font-medium text-purple-600">
                      {selectedCourse.credits}
                    </p>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-gray-200">
                <button
                  className={`px-4 py-2 font-medium flex items-center gap-2 ${
                    activeTab === 'materials'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => setActiveTab('materials')}
                >
                  <FiFileText /> Materials
                </button>
                <button
                  className={`px-4 py-2 font-medium flex items-center gap-2 ${
                    activeTab === 'students'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => setActiveTab('students')}
                >
                  <FiUsers /> Students
                </button>
                <button
                  className={`px-4 py-2 font-medium flex items-center gap-2 ${
                    activeTab === 'timetable'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => setActiveTab('timetable')}
                >
                  <FiClock /> Timetable
                </button>
              </div>

              {/* Materials Tab */}
              {activeTab === 'materials' && (
                <div className="space-y-6">
                  {/* Upload Form */}
                  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                      <FiUpload /> Upload New Material
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Title
                        </label>
                        <input
                          type="text"
                          value={newMaterial.title}
                          onChange={(e) => setNewMaterial({...newMaterial, title: e.target.value})}
                          className="text-pink-500 w-full px-3 py-2 border border-gray-300 rounded-md"
                          placeholder="Material title"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Type
                        </label>
                        <select
                          value={newMaterial.type}
                          onChange={(e) => setNewMaterial({...newMaterial, type: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-emerald-800"
                        >
                          <option value="lecture_notes">Lecture Notes</option>
                          <option value="slides">Slides</option>
                          <option value="assignment">Assignment</option>
                          <option value="reading">Reading Material</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          File
                        </label>
                        <input
                          type="file"
                          onChange={handleFileChange}
                          className="text-pink-500 w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      <button
                        onClick={handleUploadMaterial}
                        disabled={!newMaterial.file || loading.upload}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300 flex items-center gap-2"
                      >
                        {loading.upload ? 'Uploading...' : 'Upload Material'}
                      </button>
                    </div>
                  </div>

                  {/* Materials List */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <h3 className="font-semibold text-gray-800 p-4 border-b flex items-center gap-2">
                      <FiFileText /> Course Materials
                    </h3>
                    <div className="divide-y">
                      {loading.materials ? (
                        <div className="p-4">
                          {[...Array(3)].map((_, i) => (
                            <div key={i} className="h-16 bg-gray-100 rounded mb-2 animate-pulse"></div>
                          ))}
                        </div>
                      ) : materials.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">
                          No materials uploaded yet
                        </div>
                      ) : (
                        materials.map((material) => (
                          <div key={material.id} className="p-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-medium text-gray-800">{material.title}</h4>
                                <p className="text-sm text-gray-500 mt-1">
                                  {material.type.replace('_', ' ')} • Uploaded on{' '}
                                  {new Date(material.uploadedAt).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="flex items-center gap-3">
                                {/* <a
                                  href={material.fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800"
                                  title="Download"
                                >
                                  <FiDownload />
                                </a> */}
<button
  onClick={() => handleDownload(material.id, 'course-material')}
  className="text-blue-600 hover:text-blue-900"
  title="Download quiz"
>
  <FiDownload size={16} />
</button>
                                <button
                                  onClick={() => handleDeleteMaterial(material.id)}
                                  className="text-red-600 hover:text-red-800"
                                  title="Delete"
                                >
                                  <FiTrash2 />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Students Tab */}
              {activeTab === 'students' && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                  <h3 className="font-semibold text-gray-800 p-4 border-b flex items-center gap-2">
                    <FiUsers /> Enrolled Students ({enrollments.length})
                  </h3>
                  <div className="divide-y">
                    {loading.enrollments ? (
                      <div className="p-4">
                        {[...Array(5)].map((_, i) => (
                          <div key={i} className="h-16 bg-gray-100 rounded mb-2 animate-pulse"></div>
                        ))}
                      </div>
                    ) : enrollments.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">
                        No students enrolled in this course
                      </div>
                    ) : (
                      enrollments.map((enrollment) => (
                        <div key={enrollment.id} className="p-4 hover:bg-gray-50">
                          <div className="flex justify-between items-center">
                            <div>
                              <h4 className="font-medium text-gray-800">
                                {enrollment.student.firstName} {enrollment.student.lastName}
                              </h4>
                              <p className="text-sm text-gray-600">
                                {enrollment.student.registrationNumber}
                              </p>
                              {enrollment.enrollmentDate && ( // Only render this <p> tag if enrollmentDate is not null
                              <p className="text-xs text-gray-500 mt-1">
                                Enrolled on {new Date(enrollment.enrollmentDate).toLocaleDateString()}
                              </p>
                            )}
                            </div>
                            <button
                              onClick={() => router.push(`/dashboard/lecturer/students/${enrollment.student.id}`)}
                              className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                            >
                              View <FiChevronRight />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Timetable Tab */}
              {activeTab === 'timetable' && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                  <h3 className="font-semibold text-gray-800 p-4 border-b flex items-center gap-2">
                    <FiClock /> Course Schedule
                  </h3>
                  <div className="divide-y">
                    {loading.timetable ? (
                      <div className="p-4">
                        {[...Array(2)].map((_, i) => (
                          <div key={i} className="h-16 bg-gray-100 rounded mb-2 animate-pulse"></div>
                        ))}
                      </div>
                    ) : timetablee.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">
                        No schedule set for this course
                      </div>
                    ) : (
                      timetablee.map((entry, index) => (
                        <div key={index} className="p-4 hover:bg-gray-50">
                          <div className="flex justify-between items-center">
                            <div>
                              <h4 className="font-medium text-gray-800 capitalize">
                                {entry.dayOfWeek}
                              </h4>
                              <p className="text-sm text-gray-600">
                                {formatTime(entry.startTime)} - {formatTime(entry.endTime)}
                              </p>
                            </div>
                            <div className="text-gray-600">
                              {entry.room || 'Room not specified'}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
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