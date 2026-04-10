import { auth } from '@/lib/auth';
import { PageHeader } from '@/components/layout/page-header';
import { Skeleton } from '@/components/ui/skeleton';

export default async function DashboardPage() {
  const session = await auth();

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={
          <>
            <span className="font-medium text-foreground">VrumCar</span>
            <span className="mx-1.5">/</span>
            <span>Dashboard</span>
          </>
        }
        title="Dashboard"
        description={
          <>
            Bem-vindo(a) de volta,{' '}
            <span className="font-medium text-foreground">
              {session?.user?.name ?? session?.user?.email ?? 'visitante'}
            </span>
            . Em breve métricas e atalhos aparecem aqui.
          </>
        }
      />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-card p-5 text-card-foreground shadow-md"
          >
            <Skeleton className="h-4 w-24 rounded-full" />
            <Skeleton className="h-9 w-full rounded-lg" />
            <Skeleton className="h-3 w-16 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
