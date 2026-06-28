'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface Props {
  data: Array<{ date: string; label: string; count: number }>;
}

const tooltipStyle = {
  fontSize: 12,
  borderRadius: 12,
  border: '1px solid oklch(0.922 0 0 / 0.8)',
  boxShadow: '0 8px 24px oklch(0 0 0 / 0.06)',
};

export function LeadsChart({ data }: Props) {
  if (data.every((d) => d.count === 0)) {
    return (
      <div className="flex h-[260px] flex-col items-center justify-center gap-2 text-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <span className="text-lg">—</span>
        </div>
        <p className="text-sm text-muted-foreground">
          Nenhum lead nos últimos 30 dias
        </p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 8, right: 4, left: -18, bottom: 0 }}>
        <CartesianGrid
          stroke="oklch(0.922 0 0 / 0.6)"
          strokeDasharray="4 4"
          vertical={false}
        />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 10, fill: 'oklch(0.556 0 0)' }}
          axisLine={false}
          tickLine={false}
          interval={Math.floor(data.length / 6)}
        />
        <YAxis
          tick={{ fontSize: 10, fill: 'oklch(0.556 0 0)' }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
        />
        <Tooltip
          formatter={(value) => [`${value} leads`, 'Leads']}
          labelFormatter={(label) => `Dia ${label}`}
          contentStyle={tooltipStyle}
          cursor={{ fill: 'oklch(0.97 0 0 / 0.5)' }}
        />
        <Bar
          dataKey="count"
          fill="#6e41aa"
          radius={[6, 6, 0, 0]}
          maxBarSize={20}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
