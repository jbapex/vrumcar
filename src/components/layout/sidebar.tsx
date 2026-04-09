'use client';

import type { OrgRole } from '@prisma/client';
import {
  BarChart3,
  Calendar,
  Car,
  ChevronLeft,
  ChevronRight,
  Kanban,
  LayoutDashboard,
  MessageSquare,
  Settings,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { LogoMark } from '@/components/brand/logo';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

const navIcons = {
  LayoutDashboard,
  Car,
  Users,
  Kanban,
  MessageSquare,
  Calendar,
  BarChart3,
  Settings,
} as const;

type NavDef = {
  href: string;
  icon: keyof typeof navIcons;
  label: string;
};

function buildItems(orgSlug: string): NavDef[] {
  const p = `/${orgSlug}`;
  return [
    { href: `${p}/dashboard`, icon: 'LayoutDashboard', label: 'Dashboard' },
    { href: `${p}/vehicles`, icon: 'Car', label: 'Estoque' },
    { href: `${p}/leads`, icon: 'Users', label: 'Leads' },
    { href: `${p}/pipeline`, icon: 'Kanban', label: 'Funil' },
    { href: `${p}/inbox`, icon: 'MessageSquare', label: 'Atendimento' },
    { href: `${p}/calendar`, icon: 'Calendar', label: 'Agenda' },
    { href: `${p}/reports`, icon: 'BarChart3', label: 'Relatórios' },
    { href: `${p}/settings`, icon: 'Settings', label: 'Configurações' },
  ];
}

type SidebarProps = {
  orgSlug: string;
  orgName: string;
  userRole: OrgRole;
  mode?: 'desktop' | 'mobile';
  onNavigate?: () => void;
};

export function Sidebar({
  orgSlug,
  orgName: _orgName,
  userRole: _userRole,
  mode = 'desktop',
  onNavigate,
}: SidebarProps) {
  void _orgName;
  void _userRole;
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const isMobile = mode === 'mobile';
  const effectiveCollapsed = isMobile ? false : collapsed;
  const items = buildItems(orgSlug);

  const linkActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div
      className={cn(
        'flex h-full flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-all duration-200',
        effectiveCollapsed ? 'w-16' : 'w-64',
      )}
    >
      <div
        className={cn(
          'flex h-14 shrink-0 items-center gap-2 border-b border-sidebar-border px-2',
          effectiveCollapsed && 'justify-center',
        )}
      >
        <LogoMark className="size-9" />
        {!effectiveCollapsed && (
          <span className="truncate text-lg font-bold tracking-tight text-primary">
            VrumCar
          </span>
        )}
      </div>
      <Separator />
      <nav className="flex-1 space-y-1 overflow-y-auto p-2">
        {items.map((item) => {
          const Icon = navIcons[item.icon];
          const active = linkActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              title={effectiveCollapsed ? item.label : undefined}
              onClick={() => onNavigate?.()}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'bg-primary/10 text-primary'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                effectiveCollapsed && 'justify-center px-2',
              )}
            >
              <Icon className="size-5 shrink-0" aria-hidden />
              {!effectiveCollapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>
      {!isMobile && (
        <div className="border-t border-sidebar-border p-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="w-full"
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
          >
            {collapsed ? (
              <ChevronRight className="size-4" />
            ) : (
              <ChevronLeft className="size-4" />
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
