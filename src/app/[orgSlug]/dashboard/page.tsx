import { auth } from '@/lib/auth';
import { Skeleton } from '@/components/ui/skeleton';

export default async function DashboardPage() {
  const session = await auth();

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      <p className="text-muted-foreground">
        Bem-vindo(a) de volta,{' '}
        {session?.user?.name ?? session?.user?.email ?? 'visitante'}.
      </p>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col gap-2 rounded-lg border bg-card p-4 text-card-foreground shadow-sm"
          >
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}
