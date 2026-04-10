import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type InfoBannerProps = {
  icon?: LucideIcon;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
};

/**
 * Faixa informativa (CTA / dica) com fundo suave na cor primária da marca.
 */
export function InfoBanner({
  icon: Icon,
  title,
  description,
  action,
  className,
}: InfoBannerProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-4 rounded-xl border border-primary/20 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
    >
      <div className="flex min-w-0 gap-3">
        {Icon ? (
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="size-5" aria-hidden />
          </div>
        ) : null}
        <div className="min-w-0">
          <p className="font-medium text-foreground">{title}</p>
          {description ? (
            <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
