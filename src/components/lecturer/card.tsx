// components/lecturer/card.tsx
import Link from 'next/link';
import { FiArrowRight } from 'react-icons/fi';

type CardProps = {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend?: number;
  link: string;
  linkText: string;
};

export default function Card({ title, value, icon, trend, link, linkText }: CardProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="p-3 rounded-lg bg-pink-50 text-pink-500 mr-4">
            {icon}
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">{title}</h3>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
          </div>
        </div>
        {trend !== undefined && (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            trend >= 0 
              ? 'bg-emerald-100 text-emerald-800' 
              : 'bg-pink-100 text-pink-800'
          }`}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div className="mt-4 border-t border-gray-200 pt-4">
        <Link
          href={link}
          className="text-sm font-medium text-pink-500 hover:text-pink-500 flex items-center"
        >
          {linkText}
          <FiArrowRight className="ml-1 h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}