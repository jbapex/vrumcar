'use client';

import type { OrgRole } from '@prisma/client';
import { useState } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { Topbar } from '@/components/layout/topbar';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { TooltipProvider } from '@/components/ui/tooltip';

type AppShellProps = {
  children: React.ReactNode;
  orgSlug: string;
  orgName: string;
  userRole: OrgRole;
  userName: string;
  userEmail: string;
};

export function AppShell({
  children,
  orgSlug,
  orgName,
  userRole,
  userName,
  userEmail,
}: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <TooltipProvider delay={300}>
      <div className="bg-page-canvas flex h-dvh w-full gap-2 overflow-hidden p-2">
        {/* Sidebar roxa — fixa, scroll só dentro dela se necessário */}
        <aside className="hidden h-full shrink-0 md:block">
          <div className="bg-sidebar h-full overflow-hidden rounded-xl border border-white/10 shadow-sm">
            <Sidebar
              orgSlug={orgSlug}
              orgName={orgName}
              userRole={userRole}
              mode="desktop"
            />
          </div>
        </aside>

        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent
            side="left"
            className="flex w-[min(18rem,100vw)] flex-col border-r border-sidebar-border bg-sidebar p-0"
            showCloseButton
          >
            <Sidebar
              orgSlug={orgSlug}
              orgName={orgName}
              userRole={userRole}
              mode="mobile"
              onNavigate={() => setMobileOpen(false)}
            />
          </SheetContent>
        </Sheet>

        {/* Container principal — topbar fixa, conteúdo rola dentro */}
        <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
          <Topbar
            orgSlug={orgSlug}
            orgName={orgName}
            userName={userName}
            userEmail={userEmail}
            onOpenMobileMenu={() => setMobileOpen(true)}
          />
          <main className="min-h-0 flex-1 overflow-y-auto p-4 md:p-5">
            {children}
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}
