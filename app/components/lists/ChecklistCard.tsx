import { Link } from '@remix-run/react';
import { Check } from 'lucide-react';
import * as Icons from 'lucide-react';

interface ChecklistCardProps {
  id: string;
  title: string;
  person: string;
  icon: string;
  color: string;
  items: Array<{ text: string; checked: boolean }>;
}

export function ChecklistCard({ id, title, person, icon, color, items }: ChecklistCardProps) {
  const IconComponent = (Icons as any)[icon] as any;
  const safeItems = items || [];
  const completed = safeItems.filter((i) => i?.checked).length;
  const total = safeItems.length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  const colorClasses = {
    cyan: { border: 'border-cyan-300', bg: 'bg-cyan-50', text: 'text-cyan-600', check: 'text-cyan-500' },
    green: { border: 'border-green-300', bg: 'bg-green-50', text: 'text-green-600', check: 'text-green-500' },
    yellow: { border: 'border-yellow-300', bg: 'bg-yellow-50', text: 'text-yellow-600', check: 'text-yellow-500' },
    blue: { border: 'border-blue-300', bg: 'bg-blue-50', text: 'text-blue-600', check: 'text-blue-500' },
    purple: { border: 'border-purple-300', bg: 'bg-purple-50', text: 'text-purple-600', check: 'text-purple-500' },
  };

  const c = colorClasses[color as keyof typeof colorClasses] || colorClasses.blue;

  return (
    <Link to={`/lists/${id}`} className="block">
      <div className={`bg-white rounded-2xl p-4 border-2 ${c.border} hover:shadow-md transition-shadow`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className={`p-2 ${c.bg} rounded-lg`}>
              {IconComponent && <IconComponent className={`w-5 h-5 ${c.text}`} />}
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">{title}</h3>
              <p className="text-xs text-gray-500">{person}</p>
            </div>
          </div>
          <div className="text-right">
            <span className={`text-lg font-bold ${c.text}`}>{percentage}%</span>
            <p className="text-xs text-gray-500">
              {completed}/{total}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          {safeItems.slice(0, 3).map((item, idx) => (
            <div key={idx} className="flex items-center space-x-3">
              <div
                className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                  item?.checked ? `${c.border} ${c.bg}` : 'border-gray-300'
                }`}
              >
                {item?.checked && <Check className={`w-3 h-3 ${c.check}`} />}
              </div>
              <span
                className={`text-sm ${
                  item?.checked ? 'line-through text-gray-400' : 'text-gray-700'
                }`}
              >
                {item?.text}
              </span>
            </div>
          ))}
          {safeItems.length > 3 && (
            <p className="text-xs text-gray-400 pl-8">+{safeItems.length - 3} more items</p>
          )}
        </div>
      </div>
    </Link>
  );
}
