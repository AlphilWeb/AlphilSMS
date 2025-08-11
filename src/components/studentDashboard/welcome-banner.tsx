// components/dashboard/welcome-banner.tsx
import Image from 'next/image';

interface WelcomeBannerProps {
  firstName: string;
  program: string;
  currentSemester: string;
  registrationNumber: string;
  studentNumber: string;
  passportPhotoUrl: string | null;
  cgpa: number | null;
}

export default function WelcomeBanner({
  firstName,
  program,
  currentSemester,
  registrationNumber,
  studentNumber,
  passportPhotoUrl,
  cgpa
}: WelcomeBannerProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex flex-col md:flex-row md:items-center gap-6">
        {/* Student Photo */}
        <div className="relative w-24 h-24 rounded-full bg-gray-100 overflow-hidden border-2 border-emerald-100">
          {passportPhotoUrl ? (
            <Image 
              src={passportPhotoUrl}
              alt="Student photo"
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              No photo
            </div>
          )}
        </div>

        {/* Student Info */}
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-800">Welcome, {firstName}!</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <p className="text-sm text-gray-500">Program</p>
              <p className="font-medium text-blue-500">{program}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Current Semester</p>
              <p className="font-medium text-blue-500">{currentSemester}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Registration No.</p>
              <p className="font-medium text-blue-500">{registrationNumber}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Student No.</p>
              <p className="font-medium text-blue-500">{studentNumber}</p>
            </div>
          </div>
        </div>

        {/* CGPA Display */}
        {cgpa !== null && (
          <div className="bg-emerald-50 rounded-lg p-4 text-center min-w-[120px]">
            <p className="text-sm text-emerald-600">Overall CGPA</p>
            <p className="text-3xl font-bold text-emerald-700">{cgpa.toFixed(2)}</p>
          </div>
        )}
      </div>
    </div>
  );
}