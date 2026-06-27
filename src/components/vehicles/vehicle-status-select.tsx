'use client';

import type { VehicleStatus } from '@prisma/client';
import { useTransition } from 'react';
import { updateStatusAction } from '@/app/[orgSlug]/vehicles/actions';

const OPTIONS: { value: VehicleStatus; label: string }[] = [
  { value: 'AVAILABLE', label: 'Disponível' },
  { value: 'RESERVED', label: 'Reservado' },
  { value: 'SOLD', label: 'Vendido' },
  { value: 'IN_PREPARATION', label: 'Em preparação' },
  { value: 'IN_MAINTENANCE', label: 'Em manutenção' },
  { value: 'INACTIVE', label: 'Inativo' },
];

export function VehicleStatusSelect({
  orgSlug,
  vehicleId,
  current,
}: {
  orgSlug: string;
  vehicleId: string;
  current: VehicleStatus;
}) {
  const [pending, start] = useTransition();

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      <span className="text-muted-foreground">Status:</span>
      <select
        disabled={pending}
        defaultValue={current}
        onChange={(e) => {
          const v = e.target.value as VehicleStatus;
          start(() => {
            void updateStatusAction(orgSlug, vehicleId, v);
          });
        }}
        className="border-border/80 bg-muted/60 h-8 rounded-lg border px-2 text-xs text-foreground/80 outline-none transition-colors hover:bg-muted/70 focus-visible:border-ring focus-visible:bg-background focus-visible:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40"
      >
        {OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
