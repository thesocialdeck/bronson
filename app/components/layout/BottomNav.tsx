import { Link, useLocation } from '@remix-run/react';
import { Home, Calendar, Users, CheckSquare } from 'lucide-react';

export function BottomNav() {
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  const links = [
    { to: '/', icon: Home, label: 'Today' },
    { to: '/week', icon: Calendar, label: 'Week' },
    { to: '/people', icon: Users, label: 'People' },
    { to: '/lists', icon: CheckSquare, label: 'Lists' },
  ];

  return (
    <div className="border-t bg-white/90 backdrop-blur-sm">
      <div className="flex items-center justify-around p-2">
        {links.map(({ to, icon: Icon, label }) => (
          <Link
            key={to}
            to={to}
            className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors ${
              isActive(to) ? 'text-purple-600' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <Icon className="w-6 h-6 mb-1" />
            <span className="text-xs font-medium">{label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
