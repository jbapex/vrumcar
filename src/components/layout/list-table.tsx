import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/** `<select>` nativo alinhado ao layout pill das listagens. */
export const listPageNativeSelectClass =
  'border-input bg-background h-10 w-full rounded-full border px-3.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 dark:bg-input/30';

export function ListTableWrap({ children }: { children: ReactNode }) {
  return <div className="overflow-x-auto">{children}</div>;
}

export function ListTable({ children }: { children: ReactNode }) {
  return (
    <table className="w-full min-w-[720px] text-sm">{children}</table>
  );
}

export function ListTableHeader({ children }: { children: ReactNode }) {
  return (
    <thead>
      <tr className="border-b border-border/60 bg-muted/25">{children}</tr>
    </thead>
  );
}

export function ListTableHeadCell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <th
      className={cn(
        'px-5 py-4 text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase',
        className,
      )}
    >
      {children}
    </th>
  );
}

export function ListTableBody({ children }: { children: ReactNode }) {
  return <tbody className="divide-y divide-border/50">{children}</tbody>;
}

export function ListTableRow({ children }: { children: ReactNode }) {
  return (
    <tr className="transition-colors hover:bg-muted/15">{children}</tr>
  );
}

export function ListTableCell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <td className={cn('px-5 py-4 align-middle', className)}>{children}</td>
  );
}

export function ListPageEmpty({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border/70 bg-muted/10 px-6 py-16 text-muted-foreground',
        className,
      )}
    >
      {children}
    </div>
  );
}
