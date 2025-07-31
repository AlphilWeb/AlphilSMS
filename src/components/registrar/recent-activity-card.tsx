// components/registrar/recent-activity-card.tsx
import { FiClock } from 'react-icons/fi';

type ActivityItem = {
  action: string;
  description: string;
  timestamp: Date | string;
};

type RecentActivityCardProps = {
  activities: ActivityItem[];
};

export default function RecentActivityCard({ activities }: RecentActivityCardProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
        <button className="text-sm text-emerald-600 hover:text-emerald-800">
          View All
        </button>
      </div>
      
      <div className="space-y-4">
        {activities.length > 0 ? (
          activities.map((activity, index) => (
            <div key={index} className="flex items-start">
              <div className="flex-shrink-0 mt-1">
                <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                <p className="text-sm text-gray-500">{activity.description}</p>
                <div className="mt-1 flex items-center text-xs text-gray-400">
                  <FiClock className="mr-1 h-3 w-3" />
                  {new Date(activity.timestamp).toLocaleString()}
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-gray-500">No recent activity</p>
        )}
      </div>
    </div>
  );
}