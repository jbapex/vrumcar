'use client';

import { Menu } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { logoutAction } from '@/app/[orgSlug]/dashboard/actions';
import { LUCIDE_STROKE_THIN } from '@/lib/ui/lucide';

type TopbarProps = {
  orgSlug: string;
  orgName: string;
  userName: string;
  userEmail: string;
  onOpenMobileMenu: () => void;
};

function initials(name: string, email: string) {
  const s = name.trim();
  if (s.length >= 2) {
    return s
      .split(/\s+/)
      .map((p) => p[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }
  return email.slice(0, 2).toUpperCase();
}

export function Topbar({
  orgSlug,
  orgName,
  userName,
  userEmail,
  onOpenMobileMenu,
}: TopbarProps) {
  const router = useRouter();
  const ini = initials(userName || userEmail, userEmail);

  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b border-border/50 bg-card px-4 md:px-5">
      <div className="flex min-w-0 items-center gap-3 md:hidden">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onOpenMobileMenu}
          aria-label="Abrir menu"
        >
          <Menu className="size-5" strokeWidth={LUCIDE_STROKE_THIN} />
        </Button>
        <p className="truncate text-sm font-medium text-foreground">{orgName}</p>
      </div>

      <div className="hidden flex-1 md:block" />

      <DropdownMenu>
        <DropdownMenuTrigger
          className="flex size-10 items-center justify-center rounded-full border border-border/60 bg-card p-0 outline-none ring-offset-background hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Menu da conta"
        >
          <Avatar className="size-8">
            <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
              {ini}
            </AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem
            onClick={() => router.push(`/${orgSlug}/settings/profile`)}
          >
            Perfil
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="cursor-pointer p-0 focus:bg-transparent">
            <form action={logoutAction} className="w-full">
              <button
                type="submit"
                className="w-full cursor-pointer rounded-sm px-2 py-1.5 text-left text-sm outline-none hover:bg-accent hover:text-accent-foreground"
              >
                Sair
              </button>
            </form>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
