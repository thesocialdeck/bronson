/**
 * Empty State Components
 *
 * Beautiful, encouraging empty states instead of plain text.
 * Makes the app feel friendly and guides users to take action.
 */

import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  illustration?: string; // Emoji or simple illustration
}

export const EmptyState = ({
  icon: Icon,
  title,
  description,
  action,
  illustration,
}: EmptyStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 py-16">
      {/* Illustration or Icon */}
      {illustration ? (
        <div className="text-7xl mb-4 animate-bounce" style={{ animationDuration: '2s' }}>
          {illustration}
        </div>
      ) : (
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center mb-4">
          <Icon className="w-8 h-8 text-purple-600" />
        </div>
      )}

      {/* Title */}
      <h3 className="text-lg font-semibold text-gray-800 mb-2">{title}</h3>

      {/* Description */}
      <p className="text-sm text-gray-600 max-w-sm mb-6">{description}</p>

      {/* Action Button */}
      {action && (
        <button
          onClick={action.onClick}
          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-full hover:shadow-lg transform hover:scale-105 transition-all"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};

// Pre-configured empty states for common scenarios
export const EmptyEvents = ({ onAdd }: { onAdd?: () => void }) => (
  <EmptyState
    illustration="🌅"
    title="No events today"
    description="Enjoy the free time! Tap the + button below to add an event anytime."
    action={
      onAdd
        ? {
            label: 'Add Event',
            onClick: onAdd,
          }
        : undefined
    }
  />
);

export const EmptyChecklists = ({ onAdd }: { onAdd?: () => void }) => (
  <EmptyState
    illustration="✅"
    title="No checklists yet"
    description="Create checklists for homework, packing, errands, or anything you need to remember!"
    action={
      onAdd
        ? {
            label: 'Create Checklist',
            onClick: onAdd,
          }
        : undefined
    }
  />
);

export const EmptyContacts = ({ onAdd }: { onAdd?: () => void }) => (
  <EmptyState
    illustration="👥"
    title="No contacts found"
    description="Add friends, coaches, teachers, and other parents to easily keep in touch."
    action={
      onAdd
        ? {
            label: 'Add Contact',
            onClick: onAdd,
          }
        : undefined
    }
  />
);

export const EmptySearchResults = () => (
  <EmptyState
    illustration="🔍"
    title="No results found"
    description="Try adjusting your search or add a new contact."
  />
);
