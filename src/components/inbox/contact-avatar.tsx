'use client';

import { User } from 'lucide-react';
import { useState } from 'react';

interface Props {
  name: string | null;
  avatarUrl?: string | null;
  size?: 'sm' | 'md' | 'lg';
}

export function ContactAvatar({ name, avatarUrl, size = 'md' }: Props) {
  const [imageError, setImageError] = useState(false);

  const sizeClasses = {
    sm: 'h-8 w-8 text-sm',
    md: 'h-10 w-10 text-base',
    lg: 'h-14 w-14 text-xl',
  };

  const initial = (name ?? '?').charAt(0).toUpperCase();

  if (avatarUrl && !imageError) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- URL externa do WhatsApp/uazapi
      <img
        src={avatarUrl}
        alt={name ?? 'Avatar'}
        className={`${sizeClasses[size]} rounded-full bg-zinc-200 object-cover dark:bg-zinc-700`}
        onError={() => setImageError(true)}
      />
    );
  }

  return (
    <div
      className={`${sizeClasses[size]} flex items-center justify-center rounded-full bg-zinc-200 font-medium text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300`}
    >
      {name ? initial : <User className="h-1/2 w-1/2" aria-hidden />}
    </div>
  );
}
