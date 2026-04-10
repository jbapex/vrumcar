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
      <div className="bg-page-canvas flex min-h-screen w-full">
        <aside className="bg-sidebar sticky top-0 hidden h-screen shrink-0 overflow-hidden rounded-tr-4xl border-r border-white/10 md:block">
          <Sidebar
            orgSlug={orgSlug}
            orgName={orgName}
            userRole={userRole}
            mode="desktop"
          />
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

        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <Topbar
            orgSlug={orgSlug}
            orgName={orgName}
            userName={userName}
            userEmail={userEmail}
            onOpenMobileMenu={() => setMobileOpen(true)}
          />
          <main className="flex-1 overflow-y-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}
