'use client';

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface Props {
  data: Array<{
    month: string;
    label: string;
    count: number;
    valueReais: number;
  }>;
}

function formatAxis(value: number): string {
  if (value >= 1000) return `R$ ${(value / 1000).toFixed(0)}k`;
  return `R$ ${value.toFixed(0)}`;
}

const tooltipStyle = {
  fontSize: 12,
  borderRadius: 12,
  border: '1px solid oklch(0.922 0 0 / 0.8)',
  boxShadow: '0 8px 24px oklch(0 0 0 / 0.06)',
};

export function SalesChart({ data }: Props) {
  if (data.every((d) => d.count === 0)) {
    return (
      <div className="flex h-[260px] flex-col items-center justify-center gap-2 text-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <span className="text-lg">—</span>
        </div>
        <p className="text-sm text-muted-foreground">
          Nenhuma venda nos últimos 6 meses
        </p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 8, right: 4, left: -8, bottom: 0 }}>
        <defs>
          <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6e41aa" stopOpacity={0.25} />
            <stop offset="100%" stopColor="#6e41aa" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid
          stroke="oklch(0.922 0 0 / 0.6)"
          strokeDasharray="4 4"
          vertical={false}
        />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: 'oklch(0.556 0 0)' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 10, fill: 'oklch(0.556 0 0)' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={formatAxis}
        />
        <Tooltip
          formatter={(value) => [
            Number(value).toLocaleString('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            }),
            'Receita',
          ]}
          contentStyle={tooltipStyle}
        />
        <Area
          type="monotone"
          dataKey="valueReais"
          stroke="#6e41aa"
          strokeWidth={2.5}
          fill="url(#salesFill)"
          dot={{ r: 3, fill: '#6e41aa', strokeWidth: 0 }}
          activeDot={{ r: 5, fill: '#6e41aa' }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
