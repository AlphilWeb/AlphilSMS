// components/ui/error-message.tsx
import { FiAlertTriangle } from 'react-icons/fi';

interface ErrorMessageProps {
  title: string;
  message: string;
}

export default function ErrorMessage({ title, message }: ErrorMessageProps) {
  return (
    <div className="bg-red-50 border-l-4 border-red-500 p-4">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <FiAlertTriangle className="h-5 w-5 text-red-500" />
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-red-800">{title}</h3>
          <div className="mt-2 text-sm text-red-700">
            <p>{message}</p>
          </div>
        </div>
      </div>
    </div>
  );
}