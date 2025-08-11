// components/dashboard/next-class-card.tsx
import Link from 'next/link';
import { FiClock, FiCalendar } from 'react-icons/fi';

interface NextClassCardProps {
  courseCode: string;
  courseName: string;
  day: string;
  startTime: string;
  endTime: string;
  room: string | null;
  lecturer: string;
}

export default function NextClassCard({
  courseCode,
  courseName,
  day,
  startTime,
  endTime,
  room,
  lecturer
}: NextClassCardProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6 h-full">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold text-black">Next Class</h3>
          <h4 className="text-xl font-bold mt-2 text-blue-500">
            {courseCode} - {courseName}
          </h4>
        </div>
        <Link 
          href="/dashboard/student/timetable"
          className="text-sm text-emerald-600 hover:underline"
        >
          View Timetable
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="flex items-center gap-2">
          <FiCalendar className="text-gray-400" />
          <span className='text-blue-500'>{day}</span>
        </div>
        <div className="flex items-center gap-2">
          <FiClock className="text-gray-400" />
          <span className='text-blue-500'>{startTime} - {endTime}</span>
        </div>
        <div className="col-span-2">
          <p className="text-sm text-gray-500">Room</p>
          <p className="font-medium text-blue-500">{room || 'Not assigned'}</p>
        </div>
        <div className="col-span-2">
          <p className="text-sm text-gray-500">Lecturer</p>
          <p className="font-medium text-blue-500">{lecturer}</p>
        </div>
      </div>
    </div>
  );
}