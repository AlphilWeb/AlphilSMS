import {
  FiUpload,
  FiEdit,
  FiCalendar,
  FiMessageSquare,
  FiBookOpen,
  FiFilePlus
} from 'react-icons/fi';

export default function QuickActions() {
  const actions = [
    {
      name: 'Upload Material',
      icon: <FiUpload className="h-5 w-5 text-pink-500" />,
      href: '/dashboard/lecturer/materials/upload'
    },
    {
      name: 'Create Assignment',
      icon: <FiEdit className="h-5 w-5 text-emerald-500" />,
      href: '/dashboard/lecturer/assignments/create'
    },
    {
      name: 'Schedule Class',
      icon: <FiCalendar className="h-5 w-5 text-purple-500" />,
      href: '/dashboard/lecturer/schedule'
    },
    {
      name: 'Send Announcement',
      icon: <FiMessageSquare className="h-5 w-5 text-amber-500" />,
      href: '/dashboard/lecturer/announcements/create'
    },
    {
      name: 'Grade Submissions',
      icon: <FiBookOpen className="h-5 w-5 text-pink-500" />,
      href: '/dashboard/lecturer/grading'
    },
    {
      name: 'New Quiz',
      icon: <FiFilePlus className="h-5 w-5 text-indigo-500" />,
      href: '/dashboard/lecturer/quizzes/create'
    }
  ];

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {actions.map((action) => (
          <a
            key={action.name}
            href={action.href}
            className="group flex flex-col items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="p-3 rounded-full bg-gray-50 group-hover:bg-white transition-colors">
              {action.icon}
            </div>
            <span className="mt-2 text-sm font-medium text-gray-700 text-center">
              {action.name}
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}