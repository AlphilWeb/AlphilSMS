'use client';

import { useState, useEffect } from 'react';
import { getMyTimetable } from '@/lib/actions/lecturer.timetable.action';
import { FiCalendar, FiClock, FiBook, FiMapPin } from 'react-icons/fi';
import { FaChalkboardTeacher } from 'react-icons/fa';

// Types from DB
type DbTimetable = {
  day: string;
  start: string;
  end: string;
  room: string | null;
  course: string;
  courseCode: string;
  semester: string;
};

// Client-side types
type TimetableEntry = {
  id: string; // We'll generate this client-side
  day: string;
  startTime: string;
  endTime: string;
  room: string;
  courseName: string;
  courseCode: string;
  semester: string;
  formattedTime: string;
};

export default function StaffTimetable({ initialTimetable }: { initialTimetable?: DbTimetable[] }) {
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [isLoading, setIsLoading] = useState(!initialTimetable);
  const [error, setError] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  // Transform DB data to client-side format
  const transformTimetableData = (dbData: DbTimetable[]): TimetableEntry[] => {
    return dbData.map((item, index) => ({
      id: `entry-${index}`,
      day: item.day,
      startTime: item.start,
      endTime: item.end,
      room: item.room || 'TBA',
      courseName: item.course,
      courseCode: item.courseCode,
      semester: item.semester,
      formattedTime: `${formatTime(item.start)} - ${formatTime(item.end)}`,
    }));
  };

  // Helper to format time (HH:MM:SS to HH:MM)
  const formatTime = (timeString: string) => {
    return timeString.split(':').slice(0, 2).join(':');
  };

  // Fetch timetable data
  useEffect(() => {
    const fetchTimetable = async () => {
      try {
        setIsLoading(true);
        const dbData = await getMyTimetable();
        setTimetable(transformTimetableData(dbData));
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load timetable');
      } finally {
        setIsLoading(false);
      }
    };

    if (!initialTimetable || initialTimetable.length === 0) {
      fetchTimetable();
    } else {
      setTimetable(transformTimetableData(initialTimetable));
      setIsLoading(false);
    }
  }, [initialTimetable]);

  // Group timetable by day
  const timetableByDay = timetable.reduce((acc, entry) => {
    if (!acc[entry.day]) {
      acc[entry.day] = [];
    }
    acc[entry.day].push(entry);
    return acc;
  }, {} as Record<string, TimetableEntry[]>);

  // Sort days in order
  const daysOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const sortedDays = Object.keys(timetableByDay).sort(
    (a, b) => daysOrder.indexOf(a) - daysOrder.indexOf(b)
  );

  // If a day is selected but has no entries, default to first available day
  useEffect(() => {
    if (sortedDays.length > 0 && (!selectedDay || !timetableByDay[selectedDay])) {
      setSelectedDay(sortedDays[0]);
    }
  }, [sortedDays, selectedDay, timetableByDay]);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <FaChalkboardTeacher className="h-8 w-8 text-indigo-600" />
          <h1 className="text-3xl font-bold text-gray-800">My Teaching Timetable</h1>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-lg animate-pulse"></div>
          ))}
        </div>
      ) : timetable.length === 0 ? (
        <div className="p-6 text-center bg-gray-50 rounded-lg">
          <FiCalendar className="mx-auto h-12 w-12 text-gray-400 mb-2" />
          <p className="text-gray-500">No timetable entries found</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Day Selector (Mobile) */}
          <div className="lg:hidden border-b border-gray-200">
            <select
              value={selectedDay || ''}
              onChange={(e) => setSelectedDay(e.target.value)}
              className="w-full p-3 border-none focus:ring-indigo-500"
            >
              {sortedDays.map((day) => (
                <option key={day} value={day}>
                  {day}
                </option>
              ))}
            </select>
          </div>

          {/* Day Tabs (Desktop) */}
          <div className="hidden lg:flex border-b border-gray-200">
            {sortedDays.map((day) => (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`px-6 py-3 font-medium text-sm ${selectedDay === day ? 'border-b-2 border-indigo-500 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {day}
              </button>
            ))}
          </div>

          {/* Timetable Content */}
          <div className="divide-y divide-gray-200">
            {selectedDay && timetableByDay[selectedDay]?.length > 0 ? (
              timetableByDay[selectedDay]
                .sort((a, b) => a.startTime.localeCompare(b.startTime))
                .map((entry) => (
                  <div key={entry.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-800">
                          {entry.courseName} ({entry.courseCode})
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">{entry.semester}</p>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                        <div className="flex items-center text-sm text-gray-600">
                          <FiClock className="h-4 w-4 mr-2 text-gray-400" />
                          <span>{entry.formattedTime}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <FiMapPin className="h-4 w-4 mr-2 text-gray-400" />
                          <span>{entry.room}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
            ) : (
              <div className="p-6 text-center text-gray-500">
                No classes scheduled for {selectedDay}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}