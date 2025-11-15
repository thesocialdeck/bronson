import * as Icons from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface ActivityIconProps {
  icon: string;
  color: string;
  className?: string;
}

export function ActivityIcon({ icon, color, className = '' }: ActivityIconProps) {
  const IconComponent = (Icons as any)[icon] as LucideIcon | undefined;

  if (!IconComponent) {
    return (
      <div className={`p-2 bg-gray-50 rounded-lg ${className}`}>
        <Icons.Circle className="w-5 h-5 text-gray-500" />
      </div>
    );
  }

  return (
    <div className={`p-2 bg-${color}-50 rounded-lg ${className}`}>
      <IconComponent className={`w-5 h-5 text-${color}-500`} />
    </div>
  );
}
