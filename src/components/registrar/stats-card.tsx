// components/registrar/stats-card.tsx
import { FiUsers, FiBook, FiFileText, FiTrendingUp, FiTrendingDown } from 'react-icons/fi';

type StatsCardProps = {
  title: string;
  value: string;
  icon: 'users' | 'book' | 'file-text';
  trend?: 'up' | 'down' | 'neutral';
};

export default function StatsCard({ title, value, icon, trend }: StatsCardProps) {
  const iconMap = {
    users: <FiUsers className="h-6 w-6 text-emerald-600" />,
    book: <FiBook className="h-6 w-6 text-emerald-600" />,
    'file-text': <FiFileText className="h-6 w-6 text-emerald-600" />,
  };

  const trendColor = trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-red-500' : 'text-gray-500';
  const TrendIcon = trend === 'up' ? FiTrendingUp : FiTrendingDown;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">{value}</p>
        </div>
        <div className="p-3 rounded-full bg-emerald-50">
          {iconMap[icon]}
        </div>
      </div>
      {trend && trend !== 'neutral' && (
        <div className={`mt-4 flex items-center text-sm ${trendColor}`}>
          <TrendIcon className="h-4 w-4 mr-1" />
          <span>{trend === 'up' ? 'Increase' : 'Decrease'} from last period</span>
        </div>
      )}
    </div>
  );
}