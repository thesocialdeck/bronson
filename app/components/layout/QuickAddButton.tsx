import { Link } from '@remix-run/react';
import { Plus } from 'lucide-react';

export function QuickAddButton() {
  return (
    <Link
      to="/add"
      className="fixed bottom-20 right-4 w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full shadow-lg flex items-center justify-center hover:shadow-xl transform hover:scale-110 active:scale-95 transition-all z-10 focus:outline-none focus:ring-4 focus:ring-purple-300 group"
      aria-label="Add new event, contact, or checklist"
      title="Quick Add"
    >
      <Plus className="text-white w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
    </Link>
  );
}
