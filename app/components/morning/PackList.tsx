import { useState } from 'react';
import { CheckSquare, Square, ChevronDown, ChevronUp } from 'lucide-react';

interface PackItem {
  item: string;
  packed: boolean;
  priority: 'high' | 'normal';
}

interface PackListProps {
  person: string;
  activity: string;
  time: string;
  items: PackItem[];
  personColor?: string;
}

export function PackList({ person, activity, time, items, personColor = 'purple' }: PackListProps) {
  const [packItems, setPackItems] = useState(items);
  const [expanded, setExpanded] = useState(true);

  const toggleItem = (index: number) => {
    setPackItems(prev =>
      prev.map((item, i) => (i === index ? { ...item, packed: !item.packed } : item))
    );
  };

  const packedCount = packItems.filter(item => item.packed).length;
  const totalCount = packItems.length;
  const percentage = Math.round((packedCount / totalCount) * 100);
  const allPacked = packedCount === totalCount;

  return (
    <div className={`bg-white rounded-2xl p-4 shadow-sm border-2 ${allPacked ? 'border-emerald-300 bg-emerald-50' : 'border-gray-200'}`}>
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-start justify-between mb-3"
      >
        <div className="flex-1 text-left">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg font-semibold text-gray-900">{person}</span>
            <span className="text-sm text-gray-600">• {activity}</span>
          </div>
          <p className="text-sm text-gray-600">{time}</p>

          {/* Progress Bar */}
          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  allPacked ? 'bg-emerald-500' : 'bg-purple-500'
                }`}
                style={{ width: `${percentage}%` }}
              />
            </div>
            <span className="text-xs font-medium text-gray-600">
              {packedCount}/{totalCount}
            </span>
          </div>
        </div>

        {expanded ? (
          <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
        )}
      </button>

      {/* Items List */}
      {expanded && (
        <div className="space-y-2 pt-2 border-t border-gray-100">
          {packItems.map((item, index) => (
            <button
              key={index}
              onClick={() => toggleItem(index)}
              className={`w-full flex items-center gap-3 p-2 rounded-lg transition-all ${
                item.packed
                  ? 'bg-emerald-50 text-emerald-900'
                  : 'hover:bg-gray-50 text-gray-900'
              }`}
            >
              {item.packed ? (
                <CheckSquare className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              ) : (
                <Square className="w-5 h-5 text-gray-400 flex-shrink-0" />
              )}
              <span className={`flex-1 text-left ${item.packed ? 'line-through opacity-60' : 'font-medium'}`}>
                {item.item}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Success Message */}
      {allPacked && (
        <div className="mt-3 pt-3 border-t border-emerald-200">
          <p className="text-sm text-emerald-700 font-medium text-center">
            ✓ All packed for {activity}!
          </p>
        </div>
      )}
    </div>
  );
}
