import Link from 'next/link';
import { cn } from '@/lib/utils';

interface Sale {
  id: string;
  vehicle: string;
  customer: string;
  valueCents: number;
  date: string;
}

interface Lead {
  id: string;
  name: string;
  phone: string | null;
  source: string;
  status: string;
  date: string;
}

interface Props {
  orgSlug: string;
  recentSales: Sale[];
  recentLeads: Lead[];
}

function formatBRL(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
  });
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
  });
}

function getSourceLabel(source: string): string {
  const map: Record<string, string> = {
    WHATSAPP: 'WhatsApp',
    PHONE: 'Telefone',
    WALK_IN: 'Presencial',
    WEBSITE: 'Site',
    REFERRAL: 'Indicação',
    OTHER: 'Outro',
  };
  return map[source] ?? source;
}

function getStatusStyle(status: string): string {
  const map: Record<string, string> = {
    NEW: 'bg-sky-500/10 text-sky-700',
    WON: 'bg-emerald-500/10 text-emerald-700',
    NEGOTIATING: 'bg-primary/10 text-primary',
    QUALIFIED: 'bg-amber-500/10 text-amber-700',
    LOST: 'bg-rose-500/10 text-rose-700',
  };
  return map[status] ?? 'bg-muted text-muted-foreground';
}

function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    NEW: 'Novo',
    CONTACTED: 'Contatado',
    QUALIFIED: 'Qualificado',
    NEGOTIATING: 'Negociando',
    WON: 'Ganho',
    LOST: 'Perdido',
  };
  return map[status] ?? status;
}

function Initial({ name, variant }: { name: string; variant: 'sale' | 'lead' }) {
  return (
    <div
      className={cn(
        'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
        variant === 'sale'
          ? 'bg-emerald-500/10 text-emerald-700'
          : 'bg-primary/10 text-primary',
      )}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

export function RecentActivities({
  orgSlug,
  recentSales,
  recentLeads,
}: Props) {
  return (
    <div className="grid gap-8 lg:grid-cols-2 lg:gap-10">
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Vendas
          </h3>
          <Link
            href={`/${orgSlug}/sales`}
            className="text-xs font-medium text-primary hover:underline"
          >
            Ver todas →
          </Link>
        </div>
        {recentSales.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Nenhuma venda ainda
          </p>
        ) : (
          <ul className="space-y-1">
            {recentSales.map((sale) => (
              <li
                key={sale.id}
                className="flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-muted/40"
              >
                <Initial name={sale.vehicle} variant="sale" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{sale.vehicle}</p>
                  <p className="text-xs text-muted-foreground">
                    {sale.customer} · {formatDate(sale.date)}
                  </p>
                </div>
                <span className="shrink-0 text-sm font-semibold tabular-nums text-emerald-600">
                  {formatBRL(sale.valueCents)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Leads
          </h3>
          <Link
            href={`/${orgSlug}/leads`}
            className="text-xs font-medium text-primary hover:underline"
          >
            Ver todos →
          </Link>
        </div>
        {recentLeads.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Nenhum lead ainda
          </p>
        ) : (
          <ul className="space-y-1">
            {recentLeads.map((lead) => (
              <li key={lead.id}>
                <Link
                  href={`/${orgSlug}/leads/${lead.id}`}
                  className="flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-muted/40"
                >
                  <Initial name={lead.name} variant="lead" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{lead.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {getSourceLabel(lead.source)} · {formatDate(lead.date)}
                    </p>
                  </div>
                  <span
                    className={cn(
                      'shrink-0 rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                      getStatusStyle(lead.status),
                    )}
                  >
                    {getStatusLabel(lead.status)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
