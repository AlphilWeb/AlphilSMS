'use client';

import { FiCalendar } from 'react-icons/fi';

export default function AcademicCalendar({ calendarData }: {
  calendarData: {
    id: number;
    name: string;
    startDate: string;
    endDate: string;
  }[]
}) {
  if (calendarData.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No academic calendar data available.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {calendarData.map((semester) => {
          const startDate = new Date(semester.startDate);
          const endDate = new Date(semester.endDate);
          const durationInWeeks = Math.ceil(
            (endDate.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000)
          );

          return (
            <div key={semester.id} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-full bg-emerald-100 text-emerald-600">
                  <FiCalendar className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800">{semester.name}</h3>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Start Date:</span>
                  <span className="text-gray-800 font-medium">
                    {startDate.toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">End Date:</span>
                  <span className="text-gray-800 font-medium">
                    {endDate.toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Duration:</span>
                  <span className="text-gray-800 font-medium">
                    {durationInWeeks} weeks
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-500 mb-2">Important Notes:</h4>
        <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
          <li>Dates are subject to change by the administration</li>
          <li>Public holidays are not included in the duration calculation</li>
          <li>Examination periods are included in the semester duration</li>
        </ul>
      </div>
    </div>
  );
}