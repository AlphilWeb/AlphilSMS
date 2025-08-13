import { FiBook, FiUsers, FiAward, FiFileText } from 'react-icons/fi';

export type CourseSummary = {
  id: number;
  name: string;
  code: string;
  programName: string;
  semesterName: string;
  studentCount: number;
  materialsCount: number;
  assignmentsCount: number;
  quizzesCount: number;
};

export default function CourseSummaryCard({ courses, currentSemester }: {
  courses: CourseSummary[];
  currentSemester: string;
}) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-900">
          <FiBook className="text-pink-500" /> Course Summary
        </h3>
        <span className="text-sm text-gray-500">{currentSemester}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {courses.slice(0, 4).map((course) => (
          <div key={course.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <h4 className="text-black font-medium">{course.name}</h4>
            <p className="text-sm text-gray-500 mb-2">{course.code}</p>
            
            <div className="flex flex-wrap gap-2 mt-2">
              <div className="flex items-center text-xs text-gray-500">
                <FiUsers className="mr-1 h-3 w-3" />
                {course.studentCount} students
              </div>
              <div className="flex items-center text-xs text-gray-500">
                <FiFileText className="mr-1 h-3 w-3" />
                {course.materialsCount} materials
              </div>
              <div className="flex items-center text-xs text-gray-500">
                <FiAward className="mr-1 h-3 w-3" />
                {course.assignmentsCount + course.quizzesCount} assessments
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}