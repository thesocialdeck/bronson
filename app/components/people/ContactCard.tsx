import { Users } from 'lucide-react';

interface ContactCardProps {
  name: string;
  relation: string;
  parents?: string[];
  phone?: string;
  notes?: string;
  color?: string;
}

export function ContactCard({ name, relation, parents, phone, notes, color = 'blue' }: ContactCardProps) {
  const colorClasses = {
    blue: 'border-blue-200 bg-blue-50',
    purple: 'border-purple-200 bg-purple-50',
    pink: 'border-pink-200 bg-pink-50',
    green: 'border-green-200 bg-green-50',
  };

  const borderClass = colorClasses[color as keyof typeof colorClasses]?.split(' ')[0] || 'border-blue-200';
  const bgClass = colorClasses[color as keyof typeof colorClasses]?.split(' ')[1] || 'bg-blue-50';

  return (
    <div className={`bg-white rounded-2xl p-4 border-2 ${borderClass}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-800 text-lg">{name}</h3>
          <p className="text-sm text-gray-500 mt-1">{relation}</p>
          {parents && parents.length > 0 && (
            <p className="text-sm text-gray-600 mt-1">
              Parents: <span className="font-medium">{parents.join(' & ')}</span>
            </p>
          )}
          {phone && (
            <p className="text-sm text-gray-600 mt-1">{phone}</p>
          )}
          {notes && (
            <p className="text-xs text-gray-500 italic mt-2">{notes}</p>
          )}
        </div>
        <div className={`p-2 ${bgClass} rounded-lg`}>
          <Users className="w-5 h-5 text-gray-600" />
        </div>
      </div>
    </div>
  );
}
