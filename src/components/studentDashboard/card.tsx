// components/dashboard/card.tsx
import Link from 'next/link';

interface CardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  link: string;
  linkText: string;
}

export default function Card({ title, value, icon, link, linkText }: CardProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6 h-full">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-1xl font-bold mt-1 text-pink-600">{value}</p>
        </div>
        <div className="bg-emerald-100 p-2 rounded-lg text-emerald-600">
          {icon}
        </div>
      </div>
      <Link 
        href={link}
        className="mt-4 inline-block text-sm text-emerald-600 hover:underline"
      >
        {linkText}
      </Link>
    </div>
  );
}