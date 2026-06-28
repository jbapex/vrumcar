'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface Props {
  orgSlug: string;
}

export function SettingsNav({ orgSlug }: Props) {
  const pathname = usePathname();

  const items = [
    { href: `/${orgSlug}/settings`, label: 'Geral', exact: true },
    { href: `/${orgSlug}/settings/team`, label: 'Equipe', exact: false },
  ];

  return (
    <nav className="mb-6 flex gap-1 border-b border-zinc-200">
      {items.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              active
                ? 'border-purple-600 text-purple-700'
                : 'border-transparent text-zinc-600 hover:border-zinc-300 hover:text-zinc-800'
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
