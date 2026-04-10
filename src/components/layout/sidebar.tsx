'use client';

import type { OrgRole } from '@prisma/client';
import {
  BarChart3,
  Calendar,
  Car,
  ChevronLeft,
  ChevronRight,
  Contact,
  Kanban,
  LayoutDashboard,
  MessageCircle,
  Settings,
  ShoppingCart,
  Smartphone,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { LogoMark } from '@/components/brand/logo';
import { Button } from '@/components/ui/button';
import { LUCIDE_STROKE_THIN } from '@/lib/ui/lucide';
import { cn } from '@/lib/utils';

const navIcons = {
  LayoutDashboard,
  Car,
  Users,
  Contact,
  ShoppingCart,
  Kanban,
  MessageCircle,
  Smartphone,
  Calendar,
  BarChart3,
  Settings,
} as const;

type NavDef = {
  href: string;
  icon: keyof typeof navIcons;
  label: string;
  iconClassName?: string;
};

function buildItems(orgSlug: string): NavDef[] {
  const p = `/${orgSlug}`;
  return [
    { href: `${p}/dashboard`, icon: 'LayoutDashboard', label: 'Dashboard' },
    { href: `${p}/vehicles`, icon: 'Car', label: 'Estoque' },
    { href: `${p}/leads`, icon: 'Users', label: 'Leads' },
    { href: `${p}/customers`, icon: 'Contact', label: 'Clientes' },
    { href: `${p}/sales`, icon: 'ShoppingCart', label: 'Vendas' },
    { href: `${p}/channels`, icon: 'Smartphone', label: 'Canais' },
    { href: `${p}/pipeline`, icon: 'Kanban', label: 'Funil' },
    {
      href: `${p}/inbox`,
      icon: 'MessageCircle',
      label: 'Atendimento',
      iconClassName: 'text-emerald-400',
    },
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
        'flex h-full flex-col overflow-hidden bg-sidebar text-sidebar-foreground transition-all duration-200',
        /* Desktop: borda/arco ficam no <aside> (clip correto). Mobile sheet: borda aqui. */
        isMobile ? 'rounded-tr-3xl border-r border-white/10' : '',
        effectiveCollapsed ? 'w-16' : 'w-64',
      )}
    >
      <div
        className={cn(
          'flex h-16 shrink-0 items-center gap-2 border-b border-white/15 bg-sidebar px-2',
          isMobile ? 'rounded-tr-3xl' : 'rounded-tr-4xl',
          effectiveCollapsed && 'justify-center',
        )}
      >
        <LogoMark className="size-8" variant="white" />
        {!effectiveCollapsed && (
          <span className="truncate text-lg font-bold tracking-tight text-sidebar-foreground">
            VrumCar
          </span>
        )}
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-2 pt-3">
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
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                active
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm'
                  : 'text-sidebar-foreground/90 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                effectiveCollapsed && 'justify-center px-2',
              )}
            >
              <Icon
                className={cn(
                  'size-[1.125rem] shrink-0',
                  active ? 'text-sidebar-primary-foreground' : item.iconClassName,
                )}
                strokeWidth={LUCIDE_STROKE_THIN}
                aria-hidden
              />
              {!effectiveCollapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>
      {!isMobile && (
        <div className="border-t border-white/10 p-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="w-full text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
          >
            {collapsed ? (
              <ChevronRight
                className="size-4"
                strokeWidth={LUCIDE_STROKE_THIN}
              />
            ) : (
              <ChevronLeft
                className="size-4"
                strokeWidth={LUCIDE_STROKE_THIN}
              />
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
