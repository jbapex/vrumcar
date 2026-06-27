import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/** Espaçamento padrão entre cabeçalho e lista nas páginas de módulo. */
export const listPageSectionClass = 'space-y-4';

/** Barra de filtros / busca acima das tabelas. */
export const listPageToolbarClass =
  'border-b border-border/50 bg-muted/15 px-4 py-3 md:px-5';

/** Grid interno dos campos de filtro — uma linha no desktop. */
export const listPageToolbarFieldsClass =
  'flex flex-col gap-3 md:flex-row md:flex-nowrap md:items-end md:gap-2 lg:gap-3';

/** Campo individual de filtro (select com label). */
export const listPageFilterFieldClass = 'min-w-0 shrink-0 space-y-0.5';

/** Busca na toolbar — cresce mas limita largura no desktop. */
export const listPageSearchFieldClass =
  'relative min-w-0 flex-1 md:max-w-[13rem] lg:max-w-xs';

/** `<select>` nativo alinhado ao layout pill das listagens. */
export const listPageNativeSelectClass =
  'border-border/80 bg-muted/60 h-9 w-full rounded-full border px-3 text-xs text-foreground/80 outline-none transition-colors hover:bg-muted/70 focus-visible:border-ring focus-visible:bg-background focus-visible:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40 dark:border-input dark:bg-input/30 dark:text-foreground/85';

export function ListTableWrap({ children }: { children: ReactNode }) {
  return <div className="overflow-x-auto">{children}</div>;
}

export function ListTable({ children }: { children: ReactNode }) {
  return (
    <table className="w-full min-w-[720px] text-xs md:text-sm">{children}</table>
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
        'px-4 py-2.5 text-left text-[0.6875rem] font-semibold tracking-wide text-muted-foreground uppercase',
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
    <td className={cn('px-4 py-2.5 align-middle', className)}>{children}</td>
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
        'flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border/70 bg-muted/10 px-4 py-10 text-muted-foreground',
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Rodapé de paginação das listagens. */
export function ListPagePagination({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'text-muted-foreground flex flex-wrap items-center justify-between gap-2 text-xs',
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Paginação dentro do card da listagem. */
export function ListPageCardFooter({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'border-t border-border/50 bg-muted/10 px-4 py-2.5 md:px-5',
        className,
      )}
    >
      <ListPagePagination>{children}</ListPagePagination>
    </div>
  );
}
