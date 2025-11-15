import { Link } from '@remix-run/react';
import { Gift, ChevronRight, Cake } from 'lucide-react';
import type { Contact } from '~/types';

interface UpcomingBirthday {
  contact: Contact;
  daysUntil: number;
  age?: number;
  formattedDate: string;
}

interface UpcomingBirthdaysSectionProps {
  birthdays: UpcomingBirthday[];
}

export function UpcomingBirthdaysSection({ birthdays }: UpcomingBirthdaysSectionProps) {
  if (birthdays.length === 0) return null;

  const getDaysText = (days: number) => {
    if (days === 0) return 'Today! 🎉';
    if (days === 1) return 'Tomorrow';
    if (days <= 7) return `in ${days} days`;
    return `in ${days} days`;
  };

  const getUrgencyColor = (days: number) => {
    if (days === 0) return 'border-pink-300 bg-pink-50';
    if (days <= 3) return 'border-rose-300 bg-rose-50';
    if (days <= 7) return 'border-orange-300 bg-orange-50';
    return 'border-amber-300 bg-amber-50';
  };

  const getBadgeColor = (days: number) => {
    if (days === 0) return 'bg-pink-500 text-white';
    if (days <= 3) return 'bg-rose-500 text-white';
    if (days <= 7) return 'bg-orange-500 text-white';
    return 'bg-amber-500 text-white';
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <Gift className="w-5 h-5 text-pink-600" />
          Upcoming Birthdays
        </h3>
        <Link
          to="/people"
          className="text-sm text-pink-600 hover:text-pink-700 font-medium flex items-center gap-1"
        >
          All Contacts
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="space-y-2">
        {birthdays.map((birthday) => (
          <Link
            key={birthday.contact.id}
            to={`/people?contact=${birthday.contact.id}`}
            className={`block rounded-xl p-4 shadow-sm border-2 hover:shadow-md transition-all ${getUrgencyColor(birthday.daysUntil)}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 flex-1">
                <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-rose-400 rounded-xl flex items-center justify-center text-2xl shadow-sm">
                  🎂
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-gray-900">
                      {birthday.contact.name}
                    </p>
                    {birthday.age !== undefined && (
                      <span className="px-2 py-0.5 bg-white/80 rounded-full text-xs font-medium text-gray-700">
                        Turning {birthday.age}
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-gray-700 mb-2">
                    {birthday.formattedDate}
                  </p>

                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${getBadgeColor(birthday.daysUntil)}`}>
                      {getDaysText(birthday.daysUntil)}
                    </span>
                    {birthday.contact.relation && (
                      <span className="text-xs text-gray-600">
                        • {birthday.contact.relation}
                      </span>
                    )}
                  </div>

                  {birthday.contact.notes && (
                    <div className="mt-2 flex items-start gap-1.5 text-xs text-gray-600 bg-white/60 rounded-lg p-2">
                      <Cake className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                      <p className="line-clamp-2">{birthday.contact.notes}</p>
                    </div>
                  )}
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 mt-2" />
            </div>
          </Link>
        ))}
      </div>

      <div className="bg-gradient-to-r from-pink-100 to-rose-100 rounded-xl p-3 border-2 border-pink-200">
        <p className="text-sm text-gray-700 flex items-center gap-2">
          <Gift className="w-4 h-4 text-pink-600" />
          <span>
            <strong>Tip:</strong> Add gift ideas to contact notes for quick reference!
          </span>
        </p>
      </div>
    </div>
  );
}
