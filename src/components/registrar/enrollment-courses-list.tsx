'use client';

import { useState } from 'react';
import { FiUsers, FiPlus } from 'react-icons/fi';
import { Dialog, DialogPanel, DialogTitle, DialogDescription } from '@headlessui/react';
import { bulkEnrollStudents, getCourseEnrollments } from '@/lib/actions/registrar.enrollment.action';

interface Program {
  id: number;
  name: string;
}

interface Course {
  id: number;
  code: string;
  name: string;
  credits: number;
  program?: Program | null;
}

interface Student {
  id: number;
  fullName: string;
  admissionNo: string;
}

// The Enrollment interface needs to match the structure of the data you're receiving
// We'll update this based on the error message
interface Enrollment {
  id: number;
  semesterId: number;
  courseId: number;
  studentId: number;
  enrollmentDate: string | null;
  student: Student;
  // This interface also includes the grade object, but we will ignore it for now
  // since the error is only on the student property
}

interface EnrollmentCoursesListProps {
  courses: Course[];
  semesterId: number;
}

export default function EnrollmentCoursesList({ courses, semesterId }: EnrollmentCoursesListProps) {
  const [viewCourse, setViewCourse] = useState<Course | null>(null);
  const [addCourse, setAddCourse] = useState<Course | null>(null);
  const [students, setStudents] = useState<number[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(false);

  const handleView = async (course: Course) => {
    setViewCourse(course);
    setLoading(true);
    try {
      const result = await getCourseEnrollments(course.id, semesterId);
      if (result) {
        // Transform the data to match the Enrollment interface
        const transformedEnrollments = result.map(dbEnrollment => ({
          ...dbEnrollment,
          student: {
            id: dbEnrollment.student.id,
            fullName: `${dbEnrollment.student.firstName} ${dbEnrollment.student.lastName}`,
            admissionNo: dbEnrollment.student.registrationNumber
          },
        }));
        setEnrollments(transformedEnrollments);
      } else {
        setEnrollments([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = (course: Course) => {
    setAddCourse(course);
  };

  const handleEnroll = async () => {
    if (!addCourse || students.length === 0) return;
    await bulkEnrollStudents(students, addCourse.id, semesterId);
    setAddCourse(null);
    setStudents([]);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {courses.map((course) => (
        <div key={course.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-semibold text-gray-800">{course.code} - {course.name}</h3>
              <p className="text-sm text-gray-600">{course.program?.name}</p>
            </div>
            <span className="bg-emerald-100 text-emerald-800 text-xs px-2 py-1 rounded">
              {course.credits} credits
            </span>
          </div>

          <div className="mt-4 flex justify-between items-center">
            <button
              onClick={() => handleView(course)}
              className="flex items-center text-sm text-emerald-600 hover:text-emerald-800"
            >
              <FiUsers className="mr-1" /> View Enrollments
            </button>
            <button
              onClick={() => handleAdd(course)}
              className="flex items-center text-sm text-blue-600 hover:text-blue-800"
            >
              <FiPlus className="mr-1" /> Add Students
            </button>
          </div>
        </div>
      ))}

      {/* View Modal */}
      <Dialog open={!!viewCourse} onClose={() => setViewCourse(null)} className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <DialogPanel className="bg-white rounded-2xl w-full max-w-xl p-6 border border-gray-200 shadow-xl">
          <DialogTitle className="text-lg font-semibold text-gray-800 mb-4">
            {viewCourse?.code} - {viewCourse?.name} Enrollments
          </DialogTitle>
          {loading ? <p>Loading...</p> : (
            <ul className="space-y-2">
              {enrollments.map((enroll, i) => (
                <li key={i} className="border px-3 py-2 rounded bg-gray-50">
                  {enroll.student.fullName} - {enroll.student.admissionNo}
                </li>
              ))}
            </ul>
          )}
          <div className="mt-4 text-right">
            <button onClick={() => setViewCourse(null)} className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300">Close</button>
          </div>
        </DialogPanel>
      </Dialog>

      {/* Add Modal */}
      <Dialog open={!!addCourse} onClose={() => setAddCourse(null)} className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <DialogPanel className="bg-white rounded-2xl w-full max-w-xl p-6 border border-gray-200 shadow-xl">
          <DialogTitle className="text-lg font-semibold text-gray-800 mb-4">
            Enroll Students to {addCourse?.code} - {addCourse?.name}
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-500 mb-2">
            Enter comma-separated student IDs to enroll:
          </DialogDescription>
          <textarea
            className="w-full border px-3 py-2 rounded resize-none"
            rows={3}
            value={students.join(', ')}
            onChange={(e) => setStudents(
              e.target.value.split(',').map((id) => parseInt(id.trim(), 10)).filter(id => !isNaN(id))
            )}
          ></textarea>
          <div className="mt-4 flex justify-end gap-2">
            <button onClick={() => setAddCourse(null)} className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200">Cancel</button>
            <button onClick={handleEnroll} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              Enroll Students
            </button>
          </div>
        </DialogPanel>
      </Dialog>
    </div>
  );
}