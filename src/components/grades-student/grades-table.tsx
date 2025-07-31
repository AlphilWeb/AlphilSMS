// components/student/grades/grades-table.tsx
'use client';

interface Grade {
  courseId: number;
  courseName: string;
  courseCode: string;
  credits: string;
  catScore: string | null;
  examScore: string | null;
  totalScore: string | null;
  letterGrade: string | null;
  gpa: string | null;
}

interface GradesTableProps {
  grades: Grade[];
}

export default function GradesTable({ grades }: GradesTableProps) {
  if (grades.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No grades available yet.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Credits</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CAT</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exam</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">GPA</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {grades.map((grade) => (
            <tr key={grade.courseId}>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{grade.courseName}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{grade.courseCode}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{grade.credits}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{grade.catScore || '-'}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{grade.examScore || '-'}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{grade.totalScore || '-'}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{grade.letterGrade || '-'}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{grade.gpa || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}