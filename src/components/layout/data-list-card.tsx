import { cn } from '@/lib/utils';

type DataListCardProps = {
  className?: string;
  children: React.ReactNode;
};

/**
 * Container branco arredondado para toolbar + tabela (lista principal do módulo).
 */
export function DataListCard({ className, children }: DataListCardProps) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-2xl border border-border/60 bg-card text-card-foreground shadow-md',
        className,
      )}
    >
      {children}
    </div>
  );
}
