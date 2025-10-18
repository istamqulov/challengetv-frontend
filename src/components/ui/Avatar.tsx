import React from 'react';
import { User } from 'lucide-react';
import { cn, getInitials, getAvatarUrl } from '@/lib/utils';

interface AvatarProps {
  src?: string | null;
  alt?: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt,
  firstName,
  lastName,
  username,
  size = 'md',
  className,
}) => {
  const sizes = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-16 h-16 text-xl',
    xl: 'w-24 h-24 text-3xl',
  };

  const avatarUrl = getAvatarUrl(src);

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={alt || username || 'Avatar'}
        className={cn(
          'rounded-full object-cover',
          sizes[size],
          className
        )}
      />
    );
  }

  const initials = getInitials(firstName, lastName, username);

  return (
    <div
      className={cn(
        'rounded-full bg-primary-600 text-white flex items-center justify-center font-medium',
        sizes[size],
        className
      )}
    >
      {initials || <User className="w-1/2 h-1/2" />}
    </div>
  );
};
