
interface CardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  link: string;
  linkText: string;
}

export default function Card({ title, value, icon }: CardProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-bold mt-1 text-pink-500">{value}</p>
        </div>
        <div className="p-3 rounded-full bg-blue-100 text-blue-600">
          {icon}
        </div>
      </div>
      
    </div>
  );
}