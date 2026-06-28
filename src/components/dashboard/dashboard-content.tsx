import type { DashboardMetrics } from '@/modules/dashboard/metrics-service';
import {
  ArrowLeftRight,
  Bookmark,
  Car,
  CheckCircle,
  Clock,
  DollarSign,
  Flame,
  Headphones,
  Inbox,
  MessageCircle as PhoneMsg,
  MessageSquare,
  Percent,
  Receipt,
  ShoppingCart,
  Timer,
  TrendingUp,
  Trophy,
  Users,
  XCircle,
} from 'lucide-react';

interface Props {
  orgSlug: string;
  orgName: string;
  metrics: DashboardMetrics;
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
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h${mins}min` : `${hours}h`;
}

function KpiCard({
  icon: Icon,
  label,
  value,
  subtitle,
  color = 'purple',
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  subtitle?: string;
  color?: 'purple' | 'green' | 'blue' | 'amber' | 'red' | 'zinc';
}) {
  const colorMap = {
    purple: 'bg-purple-50 text-purple-600',
    green: 'bg-green-50 text-green-600',
    blue: 'bg-blue-50 text-blue-600',
    amber: 'bg-amber-50 text-amber-600',
    red: 'bg-red-50 text-red-600',
    zinc: 'bg-zinc-100 text-zinc-600',
  };

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4">
      <div className="flex items-center gap-3">
        <div className={`rounded-lg p-2 ${colorMap[color]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-zinc-500">{label}</p>
          <p className="text-xl font-bold">{value}</p>
          {subtitle && (
            <p className="truncate text-xs text-zinc-400">{subtitle}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export function DashboardContent({ orgName, metrics }: Props) {
  const vendorSubtitle =
    metrics.whatsapp.byVendor.length > 0
      ? metrics.whatsapp.byVendor
          .map((v) => `${v.name}: ${v.count}`)
          .join(', ')
      : undefined;

  return (
    <div className="space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-bold">{orgName}</h1>
        <p className="text-sm text-zinc-500">Visão geral do negócio</p>
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase text-zinc-400">
          Estoque
        </h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
          <KpiCard
            icon={Car}
            label="Veículos em estoque"
            value={metrics.stock.total}
            color="purple"
          />
          <KpiCard
            icon={DollarSign}
            label="Valor total"
            value={formatBRL(metrics.stock.valueCents)}
            color="green"
          />
          <KpiCard
            icon={Receipt}
            label="Preço médio"
            value={formatBRL(metrics.stock.avgPriceCents)}
            color="blue"
          />
          <KpiCard
            icon={Clock}
            label="Tempo médio em estoque"
            value={`${metrics.stock.avgDaysInStock}d`}
            color="amber"
          />
          <KpiCard
            icon={Bookmark}
            label="Reservados"
            value={metrics.stock.reserved}
            color="zinc"
          />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase text-zinc-400">
          Leads
        </h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
          <KpiCard
            icon={TrendingUp}
            label="Novos este mês"
            value={metrics.leads.newThisMonth}
            color="blue"
          />
          <KpiCard
            icon={Percent}
            label="Taxa de conversão"
            value={`${metrics.leads.conversionRate}%`}
            color="green"
          />
          <KpiCard
            icon={Flame}
            label="Leads quentes"
            value={metrics.leads.hot}
            subtitle="Qualificados + negociando"
            color="amber"
          />
          <KpiCard
            icon={PhoneMsg}
            label="Via WhatsApp"
            value={metrics.leads.fromWhatsApp}
            subtitle="Este mês"
            color="green"
          />
          <KpiCard
            icon={Timer}
            label="Tempo médio de resposta"
            value={formatResponseTime(metrics.leads.avgResponseMinutes)}
            color="purple"
          />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase text-zinc-400">
          Vendas
        </h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
          <KpiCard
            icon={ShoppingCart}
            label="Vendas do mês"
            value={metrics.sales.countThisMonth}
            subtitle={formatBRL(metrics.sales.valueCents)}
            color="green"
          />
          <KpiCard
            icon={Receipt}
            label="Ticket médio"
            value={formatBRL(metrics.sales.avgTicketCents)}
            color="blue"
          />
          <KpiCard
            icon={ArrowLeftRight}
            label="Taxa de trade-in"
            value={`${metrics.sales.tradeInRate}%`}
            color="amber"
          />
          <KpiCard
            icon={XCircle}
            label="Canceladas"
            value={metrics.sales.cancelled}
            subtitle="Este mês"
            color="red"
          />
          <KpiCard
            icon={Trophy}
            label="Top vendedor"
            value={metrics.sales.ranking[0]?.name ?? '—'}
            subtitle={
              metrics.sales.ranking[0]
                ? `${metrics.sales.ranking[0].count} vendas`
                : undefined
            }
            color="purple"
          />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase text-zinc-400">
          Atendimento WhatsApp
        </h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
          <KpiCard
            icon={Inbox}
            label="Na entrada"
            value={metrics.whatsapp.inbox}
            subtitle="Aguardando atendimento"
            color="red"
          />
          <KpiCard
            icon={Headphones}
            label="Em atendimento"
            value={metrics.whatsapp.attending}
            color="blue"
          />
          <KpiCard
            icon={CheckCircle}
            label="Resolvidas hoje"
            value={metrics.whatsapp.resolvedToday}
            color="green"
          />
          <KpiCard
            icon={MessageSquare}
            label="Mensagens hoje"
            value={metrics.whatsapp.messagesToday}
            color="purple"
          />
          <KpiCard
            icon={Users}
            label="Vendedores atendendo"
            value={metrics.whatsapp.byVendor.length}
            subtitle={vendorSubtitle}
            color="zinc"
          />
        </div>
      </section>
    </div>
  );
}
