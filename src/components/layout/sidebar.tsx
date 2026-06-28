'use client';

import type { OrgRole } from '@prisma/client';
import {
  BarChart3,
  Calendar,
  Car,
  ChevronsLeft,
  ChevronsRight,
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
  roles?: OrgRole[];
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
    {
      href: `${p}/settings`,
      icon: 'Settings',
      label: 'Configurações',
      roles: ['OWNER', 'ADMIN'],
    },
  ];
}

function filterItemsByRole(items: NavDef[], userRole: OrgRole): NavDef[] {
  return items.filter(
    (item) => !item.roles || item.roles.includes(userRole),
  );
}

type SidebarProps = {
  orgSlug: string;
  orgName: string;
  userRole: OrgRole;
  mode?: 'desktop' | 'mobile';
  onNavigate?: () => void;
};

function NavLink({
  item,
  active,
  collapsed,
  onNavigate,
}: {
  item: NavDef;
  active: boolean;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const Icon = navIcons[item.icon];

  return (
    <Link
      href={item.href}
      title={collapsed ? item.label : undefined}
      onClick={() => onNavigate?.()}
      className={cn(
        'flex items-center rounded-xl py-2.5 text-sm transition-colors',
        active
          ? 'font-semibold text-sidebar-foreground'
          : 'font-medium text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground',
        collapsed ? 'justify-center px-2' : 'gap-3 px-3',
      )}
    >
      <Icon
        className={cn(
          'size-[1.125rem] shrink-0',
          active ? 'text-sidebar-foreground' : item.iconClassName,
        )}
        strokeWidth={LUCIDE_STROKE_THIN}
        aria-hidden
      />
      {!collapsed && <span>{item.label}</span>}
    </Link>
  );
}

export function Sidebar({
  orgSlug,
  orgName: _orgName,
  userRole,
  mode = 'desktop',
  onNavigate,
}: SidebarProps) {
  void _orgName;
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(true);
  const isMobile = mode === 'mobile';
  const effectiveCollapsed = isMobile ? false : collapsed;
  const items = filterItemsByRole(buildItems(orgSlug), userRole);
  const mainItems = items.filter((item) => item.icon !== 'Settings');
  const footerItems = items.filter((item) => item.icon === 'Settings');

  const linkActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div
      className={cn(
        'flex h-full flex-col overflow-hidden bg-sidebar text-sidebar-foreground transition-all duration-200',
        effectiveCollapsed ? 'w-16' : 'w-60',
      )}
    >
      {/* Header — logo em tile claro + nome */}
      <div
        className={cn(
          'shrink-0 border-b border-white/15 px-3 py-4',
          effectiveCollapsed && 'px-2',
        )}
      >
        <div
          className={cn(
            'flex items-center gap-3',
            effectiveCollapsed && 'justify-center',
          )}
        >
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/15">
            <LogoMark className="size-7" variant="white" />
          </div>
          {!effectiveCollapsed && (
            <span className="truncate text-lg font-bold tracking-tight text-sidebar-foreground">
              VrumCar
            </span>
          )}
        </div>
      </div>

      {/* Nav principal */}
      <nav className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {!isMobile && (
          <div
            className={cn(
              'shrink-0 px-2 pt-3',
              effectiveCollapsed && 'flex justify-center',
            )}
          >
            <button
              type="button"
              onClick={() => setCollapsed((c) => !c)}
              aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
              className="rounded-lg p-2 text-sidebar-foreground/55 transition-colors hover:bg-white/10 hover:text-sidebar-foreground"
            >
              {collapsed ? (
                <ChevronsRight
                  className="size-4"
                  strokeWidth={LUCIDE_STROKE_THIN}
                />
              ) : (
                <ChevronsLeft
                  className="size-4"
                  strokeWidth={LUCIDE_STROKE_THIN}
                />
              )}
            </button>
          </div>
        )}

        <div className="flex-1 space-y-0.5 overflow-y-auto px-2 py-2">
          {mainItems.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              active={linkActive(item.href)}
              collapsed={effectiveCollapsed}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      </nav>

      {/* Rodapé — itens secundários */}
      <div className="shrink-0 border-t border-white/15 px-2 py-3">
        {footerItems.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            active={linkActive(item.href)}
            collapsed={effectiveCollapsed}
            onNavigate={onNavigate}
          />
        ))}
      </div>
    </div>
  );
}
