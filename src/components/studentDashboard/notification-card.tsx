// components/dashboard/notification-card.tsx
import { formatDistanceToNow } from 'date-fns';

interface NotificationCardProps {
  title: string;
  description: string | null;
  timestamp: Date;
}

export default function NotificationCard({
  title,
  description,
  timestamp
}: NotificationCardProps) {
  return (
    <div className="border-b pb-4 last:border-0 last:pb-0">
      <div className="flex justify-between items-start">
        <h4 className="font-medium text-blue-600">{title}</h4>
        <span className="text-xs text-gray-400">
          {formatDistanceToNow(new Date(timestamp), { addSuffix: true })}
        </span>
      </div>
      <p className="text-sm text-gray-600 mt-1">{description}</p>
    </div>
  );
}