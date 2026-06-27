import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/** Link de ação nas tabelas de listagem. */
export const listPageLinkClass =
  'text-primary text-xs font-medium underline-offset-4 hover:underline';

/** Grid padrão de campos em formulários de módulo (até 4 colunas no desktop). */
export const formGridClass =
  'grid gap-x-3 gap-y-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';

/** Campo que ocupa a linha inteira do grid. */
export const formFieldFullClass = 'col-span-full';

/** Espaçamento label + input; labels menores e mais suaves que títulos de seção. */
export const formFieldClass =
  'space-y-1.5 [&_label]:text-xs [&_label]:font-medium [&_label]:text-muted-foreground';

/** `<select>` nativo em formulários. */
export const formNativeSelectClass =
  'border-border/80 bg-muted/60 h-9 w-full rounded-lg border px-3 text-sm text-foreground/80 outline-none transition-colors hover:bg-muted/70 focus-visible:border-ring focus-visible:bg-background focus-visible:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40 dark:border-input dark:bg-input/30 dark:text-foreground/85';

/** Card interno dentro de abas (ex.: resumo, adicionar custo). */
export const moduleInnerCardClass =
  'rounded-xl border border-border/50 bg-card p-4 shadow-sm';

/** Campo curto (ano, portas, motor…) — não estica na coluna do grid. */
export const formFieldCompactClass = 'w-full max-w-[6.75rem]';

/** Campo médio (placa, km, preços…). */
export const formFieldMediumClass = 'w-full max-w-[10rem]';

/** Barra de ações fixa no rodapé de formulários de módulo. */
export const formActionsClass =
  'flex flex-wrap gap-2 rounded-xl border border-border/50 bg-muted/15 px-4 py-3';

type FormSectionProps = {
  title: string;
  description?: ReactNode;
  icon?: ReactNode;
  className?: string;
  children: ReactNode;
};

export function FormSection({
  title,
  description,
  icon,
  className,
  children,
}: FormSectionProps) {
  return (
    <section
      className={cn(
        'overflow-hidden rounded-xl border border-border/50 bg-card',
        className,
      )}
    >
      <div className="border-b border-border/40 bg-muted/25 px-4 py-2.5">
        <div className="flex items-start gap-2.5">
          {icon ? (
            <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary [&_svg]:size-3.5">
              {icon}
            </span>
          ) : null}
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-semibold tracking-tight text-foreground">
              {title}
            </h2>
            {description ? (
              <p className="text-muted-foreground mt-0.5 text-xs leading-relaxed">
                {description}
              </p>
            ) : null}
          </div>
        </div>
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}
