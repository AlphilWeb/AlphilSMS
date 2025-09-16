import Image from 'next/image';

export default function WelcomeBanner({
  firstName,
  position,
  department,
  avatarUrl
}: {
  firstName: string;
  position: string;
  department: string;
  avatarUrl: string;
}) {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-6 md:flex md:items-center md:justify-between">
        <div className="flex items-center">
          <div className="relative h-16 w-16 overflow-hidden border-2 border-pink-500">
            <Image
              src={avatarUrl}
              alt={`${firstName}'s avatar`}
              fill
              className="object-contain"
              sizes="64px"
            />
          </div>
          <div className="ml-4">
            <h2 className="text-xl font-bold text-gray-900">Welcome back {firstName}!</h2>
            <p className="text-sm text-gray-500">
              {position} • {department}
            </p>
          </div>
        </div>
        <div className="mt-4 md:mt-0">
          <div className="inline-flex rounded-md shadow-sm">
            <a
              href="/dashboard/lecturer/profile"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-pink-500 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
            >
              View Profile
            </a>
          </div>
        </div>
      </div>
      <div className="bg-pink-50 px-6 py-4">
        <p className="text-sm text-pink-700">
          <span className="font-medium"></span> You have {new Date().getDay() === 1 ? 'a busy week' : 'new submissions'} to review.
        </p>
      </div>
    </div>
  );
}