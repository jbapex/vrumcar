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
        'overflow-hidden rounded-xl border border-border/50 bg-card text-card-foreground shadow-sm',
        className,
      )}
    >
      {children}
    </div>
  );
}
