import { cn } from '@/lib/utils';

type LogoProps = {
  variant?: 'default' | 'white';
  className?: string;
};

export function Logo({ variant = 'default', className }: LogoProps) {
  const textClass =
    variant === 'white' ? 'text-white' : 'text-primary';

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <LogoMark className="size-8 shrink-0" variant={variant} />
      <span className={cn('text-lg font-bold tracking-tight', textClass)}>
        VrumCar
      </span>
    </div>
  );
}

type LogoMarkProps = {
  className?: string;
  variant?: 'default' | 'white';
};

/** Ícone quadrado (mark) — usa cores do tema via Tailwind. */
export function LogoMark({ className, variant = 'default' }: LogoMarkProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      className={cn('aspect-square shrink-0', className)}
      aria-hidden
    >
      <circle
        cx="16"
        cy="16"
        r="14"
        className={variant === 'white' ? 'fill-white' : 'fill-primary'}
      />
      <path
        d="M9 16.5l4.5 4.5L23 11"
        fill="none"
        className={
          variant === 'white' ? 'stroke-primary' : 'stroke-primary-foreground'
        }
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
