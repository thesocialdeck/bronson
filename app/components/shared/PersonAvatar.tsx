import { PERSON_COLORS } from '~/lib/config';

interface PersonAvatarProps {
  name: string;
  color: string;
  avatar: string;
  size?: 'sm' | 'md' | 'lg';
}

export function PersonAvatar({ name, color, avatar, size = 'md' }: PersonAvatarProps) {
  const colors = PERSON_COLORS[color as keyof typeof PERSON_COLORS] || PERSON_COLORS.blue;

  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
  };

  return (
    <div
      className={`${sizeClasses[size]} ${colors.bg} rounded-full flex items-center justify-center text-white font-bold`}
      title={name}
    >
      {avatar}
    </div>
  );
}
