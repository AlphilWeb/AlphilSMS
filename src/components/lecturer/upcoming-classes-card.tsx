import { FiCalendar, FiClock } from 'react-icons/fi';

type UpcomingClass = {
  id: number;
  courseName: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  room: string;
};

export default function UpcomingClassesCard({ classes, currentSemester }: {
  classes: UpcomingClass[];
  currentSemester: string;
}) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-900">
          <FiCalendar className="text-pink-500" /> Upcoming Classes
        </h3>
        <span className="text-sm text-gray-500">{currentSemester}</span>
      </div>

      {classes.length > 0 ? (
        <div className="space-y-3">
          {classes.slice(0, 4).map((classItem) => (
            <div key={classItem.id} className="flex items-center p-3 border border-gray-100 rounded-lg">
              <div className="p-2 bg-pink-100 text-pink-500 rounded-lg mr-3">
                <FiClock className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium">{classItem.courseName}</h4>
                <p className="text-sm text-gray-500">
                  {classItem.dayOfWeek}, {classItem.startTime} - {classItem.endTime}
                </p>
              </div>
              <span className="text-xs text-gray-400">{classItem.room}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6 text-gray-500">
          <p>No upcoming classes scheduled</p>
        </div>
      )}
    </div>
  );
}