import type {
  DashboardChartData,
  DashboardMetrics,
} from '@/modules/dashboard/metrics-service';
import { LeadsChart } from '@/components/dashboard/leads-chart';
import { RecentActivities } from '@/components/dashboard/recent-activities';
import { SalesChart } from '@/components/dashboard/sales-chart';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';
import {
  DollarSign,
  Percent,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';

interface Props {
  orgSlug: string;
  orgName: string;
  metrics: DashboardMetrics;
  chartData: DashboardChartData;
}

function formatBRL(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

function formatResponseTime(minutes: number | null): string {
  if (minutes === null) return '—';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

function Metric({
  label,
  value,
  hint,
  emphasis,
}: {
  label: string;
  value: string | number;
  hint?: string;
  emphasis?: boolean;
}) {
  const valueStr = String(value);
  const isLongValue = valueStr.length > 10;

  return (
    <div className="min-w-0">
      <p className="truncate text-[9px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/80">
        {label}
      </p>
      <p
        className={cn(
          'mt-1 font-semibold tabular-nums leading-none tracking-tight',
          isLongValue
            ? 'truncate text-sm sm:text-[15px]'
            : 'text-lg sm:text-xl',
          emphasis ? 'text-primary' : 'text-foreground',
        )}
        title={valueStr.length > 12 ? valueStr : undefined}
      >
        {value}
      </p>
      {hint && (
        <p
          className="mt-1 line-clamp-2 text-[10px] leading-snug text-muted-foreground"
          title={hint}
        >
          {hint}
        </p>
      )}
    </div>
  );
}

function MetricBand({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-4 border-b border-border/50 px-5 py-4 last:border-b-0 sm:grid-cols-[120px_1fr] sm:items-start sm:gap-6 sm:px-6 sm:py-5">
      <div className="sm:pt-0.5">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
          {subtitle}
        </p>
      </div>
      <div className="grid min-w-0 grid-cols-2 gap-x-3 gap-y-4 sm:grid-cols-3 lg:grid-cols-5 lg:gap-x-4 lg:gap-y-4">
        {children}
      </div>
    </div>
  );
}

const kpiColorStyles = {
  green: {
    card: 'border-green-200/80 bg-green-50/80',
    icon: 'text-green-600',
    value: 'text-green-800',
  },
  red: {
    card: 'border-red-200/80 bg-red-50/80',
    icon: 'text-red-600',
    value: 'text-red-800',
  },
  amber: {
    card: 'border-amber-200/80 bg-amber-50/80',
    icon: 'text-amber-600',
    value: 'text-amber-900',
  },
  blue: {
    card: 'border-blue-200/80 bg-blue-50/80',
    icon: 'text-blue-600',
    value: 'text-blue-900',
  },
  zinc: {
    card: 'border-border/60 bg-muted/30',
    icon: 'text-muted-foreground',
    value: 'text-foreground',
  },
} as const;

function KpiCard({
  icon: Icon,
  label,
  value,
  color,
  highlight,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  color: keyof typeof kpiColorStyles;
  highlight?: boolean;
}) {
  const styles = kpiColorStyles[color];

  return (
    <div
      className={cn(
        'rounded-xl border p-4',
        styles.card,
        highlight && 'ring-2 ring-primary/20',
      )}
    >
      <div className="flex items-center gap-2">
        <Icon className={cn('h-4 w-4', styles.icon)} aria-hidden />
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          {label}
        </p>
      </div>
      <p className={cn('mt-2 text-xl font-bold tabular-nums', styles.value)}>
        {value}
      </p>
    </div>
  );
}

export function DashboardContent({
  orgSlug,
  orgName,
  metrics,
  chartData,
}: Props) {
  const vendorLines = metrics.whatsapp.byVendor
    .slice(0, 3)
    .map((v) => `${v.name.split(' ')[0]} · ${v.count}`)
    .join('  ·  ');

  const todayLabel = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <div className="mx-auto max-w-[1440px] space-y-8 px-4 py-6 pb-14 sm:px-6 lg:space-y-10">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium capitalize text-muted-foreground">
            {todayLabel}
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground sm:text-[1.75rem]">
            {getGreeting()},{' '}
            <span className="bg-gradient-to-r from-primary to-[#9b6fd4] bg-clip-text text-transparent">
              {orgName}
            </span>
          </h1>
        </div>
        <p className="max-w-sm text-sm leading-relaxed text-muted-foreground sm:text-right">
          Visão executiva da operação — estoque, funil, vendas e atendimento em
          um só lugar.
        </p>
      </header>

      {/* Hero — marca */}
      <div className="relative overflow-hidden rounded-[1.25rem] bg-gradient-to-br from-[#5a3494] via-primary to-[#8b5fc9] px-6 py-7 text-white shadow-lg shadow-primary/20 sm:px-8 sm:py-8">
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-20 left-1/3 h-48 w-48 rounded-full bg-black/10 blur-3xl"
          aria-hidden
        />
        <div className="relative grid grid-cols-2 gap-6 sm:grid-cols-4 sm:gap-8">
          {[
            {
              label: 'Veículos',
              value: metrics.stock.total,
              sub: formatBRL(metrics.stock.valueCents),
            },
            {
              label: 'Vendas no mês',
              value: metrics.sales.countThisMonth,
              sub: formatBRL(metrics.sales.valueCents),
            },
            {
              label: 'Conversão',
              value: `${metrics.leads.conversionRate}%`,
              sub: `${metrics.leads.newThisMonth} leads novos`,
            },
            {
              label: 'Fila WhatsApp',
              value: metrics.whatsapp.inbox,
              sub:
                metrics.whatsapp.inbox > 0
                  ? 'precisa de atenção'
                  : 'tudo em dia',
              alert: metrics.whatsapp.inbox > 0,
            },
          ].map((item) => (
            <div key={item.label} className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/60">
                {item.label}
              </p>
              <p
                className={cn(
                  'mt-2 text-3xl font-bold tabular-nums tracking-tight sm:text-4xl',
                  item.alert && 'text-amber-200',
                )}
              >
                {item.value}
              </p>
              <p className="mt-1 truncate text-xs text-white/55">{item.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Bento: analytics + WhatsApp */}
      <div className="grid gap-5 lg:grid-cols-12 lg:gap-6">
        <div className="overflow-hidden rounded-[1.25rem] bg-card shadow-sm ring-1 ring-border/50 lg:col-span-8">
          <div className="border-b border-border/50 px-6 py-4">
            <h2 className="text-sm font-semibold text-foreground">Tendências</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Leads diários e receita mensal
            </p>
          </div>
          <div className="grid gap-0 md:grid-cols-2 md:divide-x md:divide-border/50">
            <div className="p-5 sm:p-6">
              <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Leads · 30 dias
              </p>
              <LeadsChart data={chartData.leadsChart} />
            </div>
            <div className="border-t border-border/50 p-5 sm:p-6 md:border-t-0">
              <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Vendas · 6 meses
              </p>
              <SalesChart data={chartData.salesChart} />
            </div>
          </div>
        </div>

        <div className="flex flex-col overflow-hidden rounded-[1.25rem] bg-card shadow-sm ring-1 ring-border/50 lg:col-span-4">
          <div className="border-b border-border/50 px-6 py-4">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                {metrics.whatsapp.inbox > 0 && (
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                )}
                <span
                  className={cn(
                    'relative inline-flex h-2 w-2 rounded-full',
                    metrics.whatsapp.inbox > 0 ? 'bg-emerald-500' : 'bg-muted-foreground/40',
                  )}
                />
              </span>
              <h2 className="text-sm font-semibold text-foreground">
                WhatsApp ao vivo
              </h2>
            </div>
          </div>
          <div className="flex flex-1 flex-col px-6 py-6">
            <div className="mb-6">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Na fila
              </p>
              <p
                className={cn(
                  'mt-2 text-5xl font-bold tabular-nums tracking-tight',
                  metrics.whatsapp.inbox > 0
                    ? 'text-rose-600'
                    : 'text-foreground',
                )}
              >
                {metrics.whatsapp.inbox}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                conversas aguardando atendimento
              </p>
            </div>
            <div className="mt-auto space-y-4 border-t border-border/50 pt-5">
              {[
                { label: 'Em atendimento', value: metrics.whatsapp.attending },
                { label: 'Resolvidas hoje', value: metrics.whatsapp.resolvedToday },
                { label: 'Mensagens hoje', value: metrics.whatsapp.messagesToday },
                {
                  label: 'Vendedores ativos',
                  value: metrics.whatsapp.byVendor.length,
                  hint: vendorLines || undefined,
                },
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex items-baseline justify-between gap-3"
                >
                  <span className="text-xs text-muted-foreground">{row.label}</span>
                  <div className="text-right">
                    <span className="text-sm font-semibold tabular-nums text-foreground">
                      {row.value}
                    </span>
                    {'hint' in row && row.hint && (
                      <p className="mt-0.5 max-w-[140px] truncate text-[10px] text-muted-foreground">
                        {row.hint}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Métricas — uma folha, quatro faixas */}
      <div className="overflow-hidden rounded-[1.25rem] bg-card shadow-sm ring-1 ring-border/50">
        <div className="border-b border-border/50 px-6 py-4">
          <h2 className="text-sm font-semibold text-foreground">
            Painel operacional
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Detalhamento completo por área
          </p>
        </div>

        <MetricBand title="Estoque" subtitle="Pátio e capital imobilizado">
          <Metric
            label="Veículos"
            value={metrics.stock.total}
            emphasis
          />
          <Metric label="Valor total" value={formatBRL(metrics.stock.valueCents)} />
          <Metric label="Preço médio" value={formatBRL(metrics.stock.avgPriceCents)} />
          <Metric
            label="Tempo médio"
            value={`${metrics.stock.avgDaysInStock} dias`}
          />
          <Metric label="Reservados" value={metrics.stock.reserved} />
        </MetricBand>

        <MetricBand title="Leads" subtitle="Funil e origem">
          <Metric label="Novos/mês" value={metrics.leads.newThisMonth} />
          <Metric
            label="Conversão"
            value={`${metrics.leads.conversionRate}%`}
            emphasis
          />
          <Metric
            label="Quentes"
            value={metrics.leads.hot}
            hint="qualif. + negociando"
          />
          <Metric
            label="WhatsApp"
            value={metrics.leads.fromWhatsApp}
            hint="este mês"
          />
          <Metric
            label="1ª resposta"
            value={formatResponseTime(metrics.leads.avgResponseMinutes)}
          />
        </MetricBand>

        <MetricBand title="Vendas" subtitle="Resultado comercial">
          <Metric
            label="Fechadas"
            value={metrics.sales.countThisMonth}
            hint={formatBRL(metrics.sales.valueCents)}
            emphasis
          />
          <Metric label="Ticket médio" value={formatBRL(metrics.sales.avgTicketCents)} />
          <Metric label="Trade-in" value={`${metrics.sales.tradeInRate}%`} />
          <Metric
            label="Canceladas"
            value={metrics.sales.cancelled}
            hint="este mês"
          />
          <Metric
            label="Top vendedor"
            value={
              metrics.sales.ranking[0]?.name
                ? metrics.sales.ranking[0].name.split(' ')[0]!
                : '—'
            }
            hint={
              metrics.sales.ranking[0]
                ? `${metrics.sales.ranking[0].count} vendas · ${metrics.sales.ranking[0].name}`
                : undefined
            }
          />
        </MetricBand>

        <section className="border-b border-border/50 px-5 py-5 sm:px-6">
          <div className="mb-4 flex items-center gap-3">
            <h2 className="text-sm font-semibold uppercase text-zinc-400">
              Financeiro do mês
            </h2>
            <div className="h-px flex-1 bg-zinc-200" />
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <KpiCard
              icon={DollarSign}
              label="Lucro bruto"
              value={formatBRL(metrics.financial.monthlyProfitCents)}
              color={
                metrics.financial.monthlyProfitCents >= 0 ? 'green' : 'red'
              }
              highlight
            />
            <KpiCard
              icon={Percent}
              label="Margem média"
              value={`${metrics.financial.monthlyMarginPercent}%`}
              color={
                metrics.financial.monthlyMarginPercent > 20 ? 'green' : 'amber'
              }
            />
            <KpiCard
              icon={TrendingUp}
              label="Receita"
              value={formatBRL(metrics.financial.monthlyRevenueCents)}
              color="blue"
            />
            <KpiCard
              icon={TrendingDown}
              label="Investido"
              value={formatBRL(metrics.financial.monthlyInvestedCents)}
              color="zinc"
            />
          </div>
        </section>

        <MetricBand title="WhatsApp" subtitle="Indicadores complementares">
          <Metric label="Entrada" value={metrics.whatsapp.inbox} emphasis />
          <Metric label="Atendendo" value={metrics.whatsapp.attending} />
          <Metric label="Resolvidas" value={metrics.whatsapp.resolvedToday} />
          <Metric label="Mensagens" value={metrics.whatsapp.messagesToday} />
          <Metric
            label="Equipe"
            value={metrics.whatsapp.byVendor.length}
            hint={vendorLines || '—'}
          />
        </MetricBand>
      </div>

      {/* Feed */}
      <div className="overflow-hidden rounded-[1.25rem] bg-card shadow-sm ring-1 ring-border/50">
        <div className="border-b border-border/50 px-6 py-4">
          <h2 className="text-sm font-semibold text-foreground">
            Movimentação recente
          </h2>
        </div>
        <div className="p-4 sm:p-6">
          <RecentActivities
            orgSlug={orgSlug}
            recentSales={chartData.recentSales}
            recentLeads={chartData.recentLeads}
          />
        </div>
      </div>
    </div>
  );
}
