import { Link, useLocation } from '@remix-run/react';
import { Home, Calendar, Inbox, Users, CheckSquare } from 'lucide-react';

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
    { to: '/review', icon: Inbox, label: 'Review' },
    { to: '/people', icon: Users, label: 'People' },
    { to: '/lists', icon: CheckSquare, label: 'Lists' },
  ];

  return (
    <nav
      className="border-t bg-white/90 backdrop-blur-sm"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="flex items-center justify-around p-2">
        {links.map(({ to, icon: Icon, label }) => {
          const active = isActive(to);
          return (
            <Link
              key={to}
              to={to}
              className={`flex flex-col items-center justify-center p-2 rounded-lg transition-all transform active:scale-95 focus:outline-none focus:ring-2 focus:ring-purple-300 ${
                active
                  ? 'text-purple-600 bg-purple-50'
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
              }`}
              aria-label={label}
              aria-current={active ? 'page' : undefined}
            >
              <Icon className={`w-6 h-6 mb-1 transition-transform ${active ? 'scale-110' : ''}`} />
              <span className="text-xs font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
