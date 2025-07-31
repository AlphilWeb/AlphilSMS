// components/registrar/semester-info-card.tsx
import { FiCalendar, FiClock } from 'react-icons/fi';
import { format } from 'date-fns';

type SemesterInfoCardProps = {
  name: string;
  startDate: string | Date;
  endDate: string | Date;
};

export default function SemesterInfoCard({ name, startDate, endDate }: SemesterInfoCardProps) {
  const formattedStartDate = format(new Date(startDate), 'MMM d, yyyy');
  const formattedEndDate = format(new Date(endDate), 'MMM d, yyyy');
  
  // Calculate days remaining
  const today = new Date();
  const end = new Date(endDate);
  const daysRemaining = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Semester</h3>
      
      <div className="space-y-4">
        <div className="flex items-center">
          <div className="p-2 rounded-full bg-emerald-50 mr-3">
            <FiCalendar className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Semester Name</p>
            <p className="text-lg font-semibold text-gray-900">{name}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center">
            <div className="p-2 rounded-full bg-blue-50 mr-3">
              <FiClock className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Start Date</p>
              <p className="text-md font-medium text-gray-900">{formattedStartDate}</p>
            </div>
          </div>
          
          <div className="flex items-center">
            <div className="p-2 rounded-full bg-blue-50 mr-3">
              <FiClock className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">End Date</p>
              <p className="text-md font-medium text-gray-900">{formattedEndDate}</p>
            </div>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500">Days Remaining</span>
            <span className={`text-lg font-semibold ${
              daysRemaining <= 14 ? 'text-red-600' : 'text-emerald-600'
            }`}>
              {daysRemaining} days
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
            <div 
              className={`h-2.5 rounded-full ${
                daysRemaining <= 14 ? 'bg-red-600' : 'bg-emerald-600'
              }`}
              style={{ 
                width: `${Math.min(100, Math.max(0, 100 - (daysRemaining / 120 * 100)))}%` 
              }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}