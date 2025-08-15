import Image from 'next/image';

interface WelcomeBannerProps {
  firstName: string;
  position: string;
  department: string;
  avatarUrl?: string;
}

export default function WelcomeBanner({
  firstName,
  position,
  department,
  avatarUrl
}: WelcomeBannerProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center">
        <div className="relative h-16 w-16 rounded-full bg-gray-200 overflow-hidden mr-4">
          <Image
            src={avatarUrl || '/default-avatar.jpg'}
            alt="Bursar avatar"
            width={64}
            height={64}
            className="h-full w-full object-cover"
          />
        </div>
        
        <div>
          <h1 className="text-2xl font-bold text-pink-500">Welcome back, {firstName}!</h1>
          <p className="text-gray-600">
            {position} • {department} Department
          </p>
        </div>
        
        <div className="ml-auto bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium">
          Bursar Portal
        </div>
      </div>
    </div>
  );
}