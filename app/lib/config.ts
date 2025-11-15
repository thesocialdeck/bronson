import type { FamilyMember, ActivityType } from '~/types';

// NOTE: Family members are now loaded dynamically from data/family.md
// This is just kept for backward compatibility
export const FAMILY_MEMBERS: FamilyMember[] = [];

export const DEFAULT_ACTIVITIES: Record<string, ActivityType> = {
  triathlon: { icon: 'Flame', color: 'orange', underlineStyle: 'wavy' },
  running: { icon: 'PersonStanding', color: 'blue', underlineStyle: 'wavy' },
  cycling: { icon: 'Bike', color: 'green', underlineStyle: 'wavy' },
  athletics: { icon: 'Trophy', color: 'amber', underlineStyle: 'wavy' },
  tennis: { icon: 'Circle', color: 'lime', underlineStyle: 'wavy' },
  cricket: { icon: 'CircleDot', color: 'emerald', underlineStyle: 'wavy' },
  'surf-sports': { icon: 'Waves', color: 'cyan', underlineStyle: 'wavy' },
  surfing: { icon: 'Waves', color: 'sky', underlineStyle: 'wavy' },
  gymnastics: { icon: 'Sparkles', color: 'purple', underlineStyle: 'wavy' },
  dinner: { icon: 'Utensils', color: 'red', underlineStyle: 'wavy' },
  birthday: { icon: 'Gift', color: 'fuchsia', underlineStyle: 'wavy' },
  bbq: { icon: 'Flame', color: 'rose', underlineStyle: 'wavy' },
  // Common logistics
  pickup: { icon: 'Car', color: 'slate', underlineStyle: 'solid' },
  school: { icon: 'GraduationCap', color: 'yellow', underlineStyle: 'dotted' },
  playdate: { icon: 'Users', color: 'violet', underlineStyle: 'wavy' },
};

// Color mapping for person avatars and borders
export const PERSON_COLORS = {
  blue: {
    bg: 'bg-blue-500',
    light: 'bg-blue-100',
    text: 'text-blue-700',
    border: 'border-blue-300',
  },
  pink: {
    bg: 'bg-pink-500',
    light: 'bg-pink-100',
    text: 'text-pink-700',
    border: 'border-pink-300',
  },
  emerald: {
    bg: 'bg-emerald-500',
    light: 'bg-emerald-100',
    text: 'text-emerald-700',
    border: 'border-emerald-300',
  },
  amber: {
    bg: 'bg-amber-500',
    light: 'bg-amber-100',
    text: 'text-amber-700',
    border: 'border-amber-300',
  },
};

// Available Lucide icons for Claude to choose from
export const AVAILABLE_ICONS = [
  'Flame', 'PersonStanding', 'Bike', 'Trophy', 'Circle', 'CircleDot',
  'Waves', 'Sparkles', 'Utensils', 'Gift', 'Car', 'GraduationCap',
  'Users', 'Music', 'Palette', 'Book', 'Heart', 'Star', 'Plane',
  'Camera', 'Coffee', 'Gamepad2', 'Guitar', 'Dumbbell', 'Sword',
  'Brain', 'Brush', 'Rocket', 'TreePine', 'Fish', 'Dog', 'Cat',
];

// Available Tailwind colors for Claude to choose from
export const AVAILABLE_COLORS = [
  'red', 'orange', 'amber', 'yellow', 'lime', 'green', 'emerald',
  'teal', 'cyan', 'sky', 'blue', 'indigo', 'violet', 'purple',
  'fuchsia', 'pink', 'rose', 'slate', 'gray',
];
