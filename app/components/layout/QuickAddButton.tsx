import { Link } from '@remix-run/react';

export function QuickAddButton() {
  return (
    <Link
      to="/add"
      className="fixed bottom-20 right-4 w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full shadow-lg flex items-center justify-center hover:shadow-xl transform hover:scale-105 transition-all z-10"
    >
      <span className="text-white text-2xl">+</span>
    </Link>
  );
}
