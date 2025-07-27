// components/student/timetable/timetable.tsx
'use client';

import { useState } from 'react';
import { FiClock, FiMapPin, FiUser } from 'react-icons/fi';

interface TimetableEntry {
  id: number;
  courseId: number;
  courseName: string;
  courseCode: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  room: string | null;
  lecturer: {
    firstName: string;
    lastName: string;
  };
}

interface TimetableProps {
  timetableData: TimetableEntry[];
}

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function Timetable({ timetableData }: TimetableProps) {
  const [activeDay, setActiveDay] = useState<string>(() => {
    // Default to current day or first available day
    const today = new Date().toLocaleString('en-US', { weekday: 'long' });
    return timetableData.some(item => item.dayOfWeek === today) 
      ? today 
      : timetableData[0]?.dayOfWeek || 'Monday';
  });

  const filteredClasses = timetableData.filter(item => item.dayOfWeek === activeDay);

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${period}`;
  };

  if (timetableData.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No timetable data available for your enrolled courses.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Day Selector */}
      <div className="flex flex-wrap gap-2">
        {daysOfWeek.map(day => {
          const hasClasses = timetableData.some(item => item.dayOfWeek === day);
          return (
            <button
              key={day}
              onClick={() => setActiveDay(day)}
              disabled={!hasClasses}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeDay === day
                  ? 'bg-emerald-600 text-white'
                  : hasClasses
                    ? 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    : 'bg-gray-50 text-gray-400 cursor-not-allowed'
              }`}
            >
              {day.slice(0, 3)}
            </button>
          );
        })}
      </div>

      {/* Timetable for selected day */}
      <div className="space-y-4">
        {filteredClasses.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No classes scheduled for {activeDay}.
          </div>
        ) : (
          filteredClasses.map((classItem) => (
            <div key={classItem.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-gray-800">
                    {classItem.courseName} ({classItem.courseCode})
                  </h3>
                  <div className="flex items-center mt-2 text-sm text-gray-600">
                    <FiClock className="mr-1" />
                    <span>
                      {formatTime(classItem.startTime)} - {formatTime(classItem.endTime)}
                    </span>
                  </div>
                </div>
                <span className="bg-emerald-100 text-emerald-800 text-xs px-2 py-1 rounded-full">
                  {classItem.dayOfWeek}
                </span>
              </div>

              <div className="mt-4 flex flex-wrap gap-4 text-sm">
                {classItem.room && (
                  <div className="flex items-center text-gray-600">
                    <FiMapPin className="mr-1" />
                    <span>{classItem.room}</span>
                  </div>
                )}
                <div className="flex items-center text-gray-600">
                  <FiUser className="mr-1" />
                  <span>
                    {classItem.lecturer.firstName} {classItem.lecturer.lastName}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}